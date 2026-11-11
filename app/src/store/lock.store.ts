import { create } from "zustand";
import type { ReviewType } from "@/types";

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
    }
  | { kind: "role"; action: string; admin: string };

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
