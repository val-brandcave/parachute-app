"use client";

import type { Ref } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/atoms";
import { dur, ease, useMotionMode } from "@/lib/motion";
import { EARN_REWARD_CREDITS, costFor } from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { cn } from "@/lib/utils";

/** Free full reviews one section pays (EARN_REWARD_CREDITS / cost of a full review). */
export function reviewsPerSection(): number {
  return Math.max(1, Math.floor(EARN_REWARD_CREDITS / costFor(FULL_REVIEW_TYPES)));
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * "Earn 1 free review · 2 credits" (gift) ↔ "1 free review earned" (check). PC-35:
 * navy-selected surface while it can still earn; success once earned. The text carries
 * the meaning (never a bare number); the glyph is decorative. `ref` is the burst origin
 * for `burstFrom`.
 *
 * DS-candidate: Chip `icon` + `ref` (EarnPill) — the DS chip takes neither a leading
 * glyph slot with a swap animation nor a forwarded ref for the celebration origin.
 */
export function EarnPill({ state, ref }: { state: "earn" | "earned"; ref?: Ref<HTMLSpanElement> }) {
  const mode = useMotionMode();
  const reviews = reviewsPerSection();
  const earned = state === "earned";
  const swap = mode === "full" ? dur.quick : dur.reducedFade;
  return (
    <span ref={ref} className={cn("ui-chip gs-earn", earned ? "ui-chip--pass is-earned" : "ui-chip--accent")}>
      <span className="gs-earn-ic" aria-hidden="true">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={state}
            className="gs-earn-ic-in"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: swap, ease: ease.standard } }}
            exit={{ opacity: 0, transition: { duration: swap, ease: ease.exit } }}
          >
            <Icon name={earned ? "check" : "gift"} size={14} strokeWidth={earned ? 2.4 : 1.75} />
          </motion.span>
        </AnimatePresence>
      </span>
      {earned ? (
        <span>{plural(reviews, "free review", "free reviews")} earned</span>
      ) : (
        <span>
          Earn {plural(reviews, "free review", "free reviews")}
          <span className="gs-earn-credits"> · {plural(EARN_REWARD_CREDITS, "credit", "credits")}</span>
        </span>
      )}
    </span>
  );
}
