import { useState } from "react";
import { useToast } from "@realwired/ui";
import { useCurrentUser } from "@/lib/current-user";
import { defaultItEmail } from "@/lib/security-pack";
import type { SecuritySend } from "@/types";
import { useOnboardingStore, useSetupSummary } from "@/store";

const NO_SENDS: SecuritySend[] = [];

/** State for /configure/security: the send form and this org's sent log. */
export function useSecurityPack() {
  const toast = useToast();
  const me = useCurrentUser();
  const sends = useOnboardingStore((s) => s.progress?.securitySends ?? NO_SENDS);
  const { adminFirst } = useSetupSummary();
  const [email, setEmail] = useState(() => defaultItEmail(me.email));
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    const sent = await useOnboardingStore.getState().sendSecurityPack(email.trim(), note.trim());
    setSending(false);
    if (sent) {
      setNote("");
      toast({ title: "Security pack sent", description: `Sent to ${sent.to}.`, tone: "success" });
    }
  };

  return { email, setEmail, note, setNote, sends, canSend: me.role === "org_admin", sending, send, adminFirst };
}
