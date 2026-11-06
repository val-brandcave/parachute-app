"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@realwired/ui";
import { Button } from "@/components/atoms";
import { CodeBoxes } from "@/components/molecules";
import { useSessionStore } from "@/store/session.store";

const RESEND_SECONDS = 42;

function clock(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Keycloak verify-email-code, themed. Any six digits pass (prototype). */
export function VerifyCodeForm({ email }: { email: string }) {
  const router = useRouter();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const verify = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length < 6) return;
    const s = useSessionStore.getState();
    s.verify({ email: s.email ?? email, name: s.name ?? "" });
    router.push("/welcome");
  };

  const resend = () => {
    setLeft(RESEND_SECONDS);
    toast({ title: "Code sent", description: `A new code is on its way to ${email}.`, tone: "success" });
  };

  return (
    <form onSubmit={verify}>
      <h1 className="kc-title">Check your inbox</h1>
      <p className="kc-sub">We sent a 6-digit code to {email}.</p>

      <div className="field" style={{ marginBottom: 8 }}>
        <label>Verification code</label>
      </div>
      <CodeBoxes value={code} onChange={setCode} autoFocus />

      <Button type="submit" size="lg" block disabled={code.length < 6}>
        Verify email
      </Button>

      <div className="kc-resend">
        <button type="button" className="kc-link" onClick={resend} disabled={left > 0}>
          Resend code
        </button>
        {left > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span aria-live="polite">You can resend in {clock(left)}</span>
          </>
        )}
      </div>
      <p className="kc-alt">
        Wrong address?{" "}
        <button type="button" className="kc-link" onClick={() => router.push("/auth/create-account")}>
          Go back
        </button>
      </p>
    </form>
  );
}
