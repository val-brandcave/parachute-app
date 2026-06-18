import { create } from "zustand";
import type { ReviewSource } from "@/types";

/** Context carried into the Order stepper when launched from an existing
 *  delivery (e.g. a "New from YouConnect" item's "Confirm & run"), so the
 *  flow opens pre-selected on that appraisal rather than blank. */
export interface OrderPrefill {
  reviewId?: string;
  source?: ReviewSource;
  propertyAddress?: string;
  loanNo?: string;
  bank?: string;
}

interface OrderState {
  open: boolean;
  step: number;
  prefill: OrderPrefill | null;
  openOrder: (opts?: { step?: number; prefill?: OrderPrefill }) => void;
  close: () => void;
  setStep: (n: number) => void;
}

/** Controls the global "Order a review" stepper modal (mounted in AppShell).
 *  `openOrder()` starts a blank order; pass `{ step, prefill }` to jump straight
 *  to a step with an appraisal pre-selected (the YouConnect "Confirm & run" path). */
export const useOrderStore = create<OrderState>((set) => ({
  open: false,
  step: 0,
  prefill: null,
  openOrder: (opts) =>
    set({ open: true, step: opts?.step ?? 0, prefill: opts?.prefill ?? null }),
  close: () => set({ open: false, prefill: null }),
  setStep: (step) => set({ step }),
}));
