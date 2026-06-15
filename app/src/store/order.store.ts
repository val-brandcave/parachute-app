import { create } from "zustand";

interface OrderState {
  open: boolean;
  step: number;
  openOrder: () => void;
  close: () => void;
  setStep: (n: number) => void;
}

/** Controls the global "Order a review" stepper modal (mounted in AppShell). */
export const useOrderStore = create<OrderState>((set) => ({
  open: false,
  step: 0,
  openOrder: () => set({ open: true, step: 0 }),
  close: () => set({ open: false }),
  setStep: (step) => set({ step }),
}));
