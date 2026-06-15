import { create } from "zustand";

export type Density = "comfortable" | "compact";
export type ThemePref = "light" | "dark" | "system";

const DKEY = "parachute:density";
const TKEY = "parachute:theme";

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
  setDensity: (d: Density) => void;
  setTheme: (t: ThemePref) => void;
  toggleNav: () => void;
}

export const usePrefsStore = create<PrefsState>((set, get) => ({
  density: initialDensity(),
  theme: initialTheme(),
  navCollapsed: false,
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
