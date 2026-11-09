import { useSyncExternalStore } from "react";
import { create } from "zustand";

export type Density = "comfortable" | "compact";
export type ThemePref = "light" | "dark" | "system";

const DKEY = "parachute:density";
const TKEY = "parachute:theme";
const HKEY = "parachute:setup-hidden";
const WKEY = "parachute:welcome-dismissed";

/** Per-user "Hide setup guide" flags, keyed by user id. */
function initialHidden(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(HKEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

/** Per-user "ready" banner dismissals, keyed by user id. */
function initialWelcome(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(WKEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

function initialDensity(): Density {
  if (typeof window === "undefined") return "comfortable";
  return (window.localStorage.getItem(DKEY) as Density) || "comfortable";
}
function initialTheme(): ThemePref {
  if (typeof window === "undefined") return "system";
  return (window.localStorage.getItem(TKEY) as ThemePref) || "system";
}

/** Resolve a theme preference to the actual applied theme. */
export function resolveTheme(pref: ThemePref): "light" | "dark" {
  if (pref !== "system") return pref;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

interface PrefsState {
  density: Density;
  theme: ThemePref;
  navCollapsed: boolean;
  /** Users who hid the setup guide (per user, not per org). */
  setupHiddenBy: Record<string, boolean>;
  setSetupHidden: (userId: string, hidden: boolean) => void;
  /** Users who dismissed the one-time "your organization is ready" banner. */
  welcomeDismissedBy: Record<string, boolean>;
  dismissWelcome: (userId: string) => void;
  setDensity: (d: Density) => void;
  setTheme: (t: ThemePref) => void;
  toggleNav: () => void;
}

export const usePrefsStore = create<PrefsState>((set, get) => ({
  density: initialDensity(),
  theme: initialTheme(),
  navCollapsed: false,
  setupHiddenBy: initialHidden(),
  setSetupHidden: (userId, hidden) => {
    const next = { ...get().setupHiddenBy, [userId]: hidden };
    if (typeof window !== "undefined") window.localStorage.setItem(HKEY, JSON.stringify(next));
    set({ setupHiddenBy: next });
  },
  welcomeDismissedBy: initialWelcome(),
  dismissWelcome: (userId) => {
    const next = { ...get().welcomeDismissedBy, [userId]: true };
    if (typeof window !== "undefined") window.localStorage.setItem(WKEY, JSON.stringify(next));
    set({ welcomeDismissedBy: next });
  },
  setDensity: (density) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DKEY, density);
      document.documentElement.dataset.density = density;
    }
    set({ density });
  },
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TKEY, theme);
      document.documentElement.dataset.theme = resolveTheme(theme);
    }
    set({ theme });
  },
  toggleNav: () => set({ navCollapsed: !get().navCollapsed }),
}));

/* ---- Build notes (PROTOTYPE ONLY) -------------------------------------------
 * Engineering annotations (Keycloak theme tag, template names, "needs API sample"
 * callouts). OFF by default so a demo shows none; engineers turn them on from the
 * DemoDock. Persisted per browser and readable outside the AppShell (the auth
 * pages), so it is a tiny external store rather than state in the shell. */
const BNKEY = "parachute:build-notes";
const BN_EVENT = "parachute:build-notes-change";

function readBuildNotes(): boolean {
  try {
    return window.localStorage.getItem(BNKEY) === "on";
  } catch {
    return false;
  }
}

export function setBuildNotes(on: boolean): void {
  try {
    window.localStorage.setItem(BNKEY, on ? "on" : "off");
  } catch {
    /* storage blocked: the switch still works for this page view */
  }
  window.dispatchEvent(new Event(BN_EVENT));
}

function subscribeBuildNotes(cb: () => void): () => void {
  window.addEventListener(BN_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(BN_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Are build notes switched on? False on the server and on first paint. */
export function useBuildNotes(): boolean {
  return useSyncExternalStore(subscribeBuildNotes, readBuildNotes, () => false);
}
