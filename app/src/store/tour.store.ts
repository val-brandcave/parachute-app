import { create } from "zustand";
import { tourById } from "@/lib/tours";

/**
 * The one active tour (spec §5.13). Seen state lives in prefs (`toursSeen`); this store
 * only drives the running tour. TourHost (shell or run scope) renders the tour whose
 * scope matches. `stop` says why, so the host can mark it done / dismissed and only a
 * finished first-review completes the `tutorial` step.
 */
export type TourStopReason = "done" | "skipped" | "interrupted";

interface TourState {
  active: string | null;
  step: number;
  lastStop: { id: string; reason: TourStopReason } | null;
  start: (id: string) => void;
  next: () => void;
  back: () => void;
  stop: (reason: TourStopReason) => void;
}

export const useTourStore = create<TourState>((set, get) => ({
  active: null,
  step: 0,
  lastStop: null,
  start: (id) => {
    if (!tourById(id)) return;
    set({ active: id, step: 0 });
  },
  next: () => {
    const { active, step } = get();
    const tour = active ? tourById(active) : undefined;
    if (!tour) return;
    if (step + 1 >= tour.steps.length) get().stop("done");
    else set({ step: step + 1 });
  },
  back: () => set({ step: Math.max(0, get().step - 1) }),
  stop: (reason) => {
    const { active } = get();
    set({ active: null, step: 0, lastStop: active ? { id: active, reason } : null });
  },
}));
