import { create } from "zustand";

export type Density = "comfortable" | "compact";
export type ThemePref = "light" | "dark" | "system";

const DKEY = "parachute:density";
const TKEY = "parachute:theme";
const HKEY = "parachute:setup-hidden";

/** Per-user "Hide setup guide" flags, keyed by user id. */
function initialHidden(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(HKEY) ?? "{}") as Record<string, boolean>;
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
