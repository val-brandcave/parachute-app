"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@realwired/ui";
import { useOnboardingStore } from "@/store";

/** Shows ONE quiet toast when a setup step earns a credit. No confetti. */
export function EarnedToastHost() {
  const router = useRouter();
  const toast = useToast();
  const notice = useOnboardingStore((s) => s.earnedNotice);

  useEffect(() => {
    if (!notice) return;
    toast({
      title: notice.title,
      description: `${notice.credits} credit${notice.credits === 1 ? "" : "s"} added to ${notice.orgName}.`,
      tone: "success",
      action: { label: "View", onClick: () => router.push("/get-started") },
    });
    useOnboardingStore.getState().clearEarnedNotice();
  }, [notice, toast, router]);

  return null;
}
