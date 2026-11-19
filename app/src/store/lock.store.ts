import { create } from "zustand";
import type { CreditPackId, ReviewType } from "@/types";

/**
 * Why an action is locked (spec §5.5). `credits.needed` is the SHORTFALL
 * (cost − balance), never the full review cost (RF2).
 */
export type LockReason =
  | { kind: "approval" }
  | {
      kind: "credits";
      needed: number;
      have: number;
      types: ReviewType[];
      resume?: string;
      /** PC-32: "Run Technical only" — start now with one type. */
      onRunOnly?: (type: ReviewType) => void;
      /** Review setup's own checkout path (draft-before-checkout, return + types, §5.6).
       *  When absent the dialog builds the checkout URL itself (checkoutHref + resume). */
      onAdd?: (choice: { credits: number } | { pack: CreditPackId }) => void;
    }
  | { kind: "role"; action: string; admin: string }
  /** The tour and signing need a review of the org's own (Get started rows). */
  | { kind: "needs-review" };

interface LockState {
  reason: LockReason | null;
  /** Where focus goes back when the dialog closes (the trigger). */
  returnFocus: HTMLElement | null;
  openLock: (reason: LockReason, opts?: { returnFocus?: HTMLElement | null }) => void;
  close: () => void;
}

/** Store-driven lock-then-explain dialog (`LockDialog`, mounted once per frame). */
export const useLockStore = create<LockState>((set, get) => ({
  reason: null,
  returnFocus: null,
  openLock: (reason, opts) => {
    const fallback = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
    set({ reason, returnFocus: opts?.returnFocus ?? fallback });
  },
  close: () => {
    const el = get().returnFocus;
    set({ reason: null, returnFocus: null });
    if (el && typeof el.focus === "function") el.focus();
  },
}));
