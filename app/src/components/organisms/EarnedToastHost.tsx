"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@realwired/ui";
import { burstFrom } from "@/lib/celebrate";
import { stagger } from "@/lib/motion";
import { costFor } from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { useOnboardingStore } from "@/store";
import { earnPillFor } from "@/components/organisms/home/earnPillRegistry";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * When a Get started section earns its review: ONE quiet toast ("1 free review earned ·
 * 2 credits added", numbers from pricing) and, if the section's earn pill is on screen,
 * the small section burst from it (motion-spec §6.3). The notice is cleared at once, so
 * each section's reward plays exactly once. `burstFrom` skips under reduced motion / off.
 */
export function EarnedToastHost() {
  const router = useRouter();
  const toast = useToast();
  const notice = useOnboardingStore((s) => s.earnedNotice);

  useEffect(() => {
    if (!notice) return;
    const reviews = Math.max(1, Math.floor(notice.credits / costFor(FULL_REVIEW_TYPES)));
    toast({
      title: `${plural(reviews, "free review", "free reviews")} earned · ${plural(notice.credits, "credit", "credits")} added`,
      description: `${notice.title} is done. The credits are in ${notice.orgName}'s balance and never expire.`,
      tone: "success",
      action: { label: "View", onClick: () => router.push("/get-started") },
    });
    const el = notice.sectionId ? earnPillFor(notice.sectionId) : null;
    // Let the pill re-render to "earned" first, then burst from where it sits.
    // Not cleared on cleanup: clearing the notice re-runs this effect straight away.
    if (el) window.setTimeout(() => void burstFrom(el), stagger.gap * 1000);
    useOnboardingStore.getState().clearEarnedNotice();
  }, [notice, toast, router]);

  return null;
}
