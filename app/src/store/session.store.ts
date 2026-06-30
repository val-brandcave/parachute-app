import { create } from "zustand";

/**
 * App entry mode (the "one app, three entry modes" model from the J1/J3 build
 * plan). `full` = the standalone Parachute app (dashboard, queue, nav). `embedded`
 * = entered via the YouConnect SSO handoff for a single document: no dashboard /
 * queue / nav, a trust strip in the run flow, and "return to YouConnect" on sign.
 * (`admin` / J2 is deferred.)
 */
export type AppMode = "full" | "embedded";

interface SessionState {
  mode: AppMode;
  /** Where an embedded session returns to on close/sign (e.g. "YouConnect"). */
  returnLabel: string | null;
  setMode: (mode: AppMode, opts?: { returnLabel?: string }) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  mode: "full",
  returnLabel: null,
  setMode: (mode, opts) =>
    set({ mode, returnLabel: mode === "embedded" ? opts?.returnLabel ?? "YouConnect" : null }),
  reset: () => set({ mode: "full", returnLabel: null }),
}));
