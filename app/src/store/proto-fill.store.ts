import { create } from "zustand";

/* PROTOTYPE ONLY: the current page's fill-wand handlers (spec §6). Kept apart from
 * prototype.store so a form that registers a fill (useProtoFill) does not pull the whole
 * scenario store and its import graph into its page chunk: doing that from the /welcome
 * forms broke the onboarding route's hard load (React "unique key" error in OuterLayoutRouter). */

export interface ProtoFill {
  screenId: string;
  valid: () => void;
  invalid?: () => void;
}

interface ProtoFillState {
  fill: ProtoFill | null;
  /** Registers `fill`; returns the unregister function (a no-op if another fill replaced it). */
  setFill: (fill: ProtoFill) => () => void;
}

export const useProtoFillStore = create<ProtoFillState>((set, get) => ({
  fill: null,
  setFill: (fill) => {
    set({ fill });
    return () => {
      if (get().fill === fill) set({ fill: null });
    };
  },
}));
