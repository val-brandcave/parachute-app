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

/* ---- Pattern change (T0.2): per-user help & celebration memory -------------- */
const CKEY = "parachute:celebrated";
const TOURKEY = "parachute:tours-seen";
const HINTKEY = "parachute:hints-seen";
const VKEY = "parachute:video-progress";
const PKEY = "parachute:proto:hidden";

export type CelebrationKind = "onboarding" | "approval" | "setup-done";
type PerUser<T> = Record<string, T>;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: keep the in-memory value for this page view */
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
  /** Celebrations already played, per user (confetti plays once). */
  celebratedBy: PerUser<Partial<Record<CelebrationKind, true>>>;
  markCelebrated: (userId: string, kind: CelebrationKind) => void;
  /** Tours seen (finished or skipped), per user. */
  toursSeen: PerUser<Record<string, boolean>>;
  setTourSeen: (userId: string, tourId: string, seen: boolean) => void;
  /** One-time hints dismissed, per user. */
  hintsSeen: PerUser<Record<string, true>>;
  markHintSeen: (userId: string, id: string) => void;
  /** Video progress 0..1, per user per video. */
  videoProgress: PerUser<Record<string, number>>;
  setVideoProgress: (userId: string, videoId: string, progress: number) => void;
  /** Prototype controls hidden (per browser, not per user). */
  protoHidden: boolean;
  setProtoHidden: (hidden: boolean) => void;
  /** Reset tours + celebrations for one user (prototype "Reset tours and celebrations"). */
  clearCelebrationsAndTours: (userId: string) => void;
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
  celebratedBy: readJson(CKEY, {}),
  markCelebrated: (userId, kind) => {
    const cur = get().celebratedBy;
    const next = { ...cur, [userId]: { ...cur[userId], [kind]: true as const } };
    writeJson(CKEY, next);
    set({ celebratedBy: next });
  },
  toursSeen: readJson(TOURKEY, {}),
  setTourSeen: (userId, tourId, seen) => {
    const cur = get().toursSeen;
    const next = { ...cur, [userId]: { ...cur[userId], [tourId]: seen } };
    writeJson(TOURKEY, next);
    set({ toursSeen: next });
  },
  hintsSeen: readJson(HINTKEY, {}),
  markHintSeen: (userId, id) => {
    const cur = get().hintsSeen;
    const next = { ...cur, [userId]: { ...cur[userId], [id]: true as const } };
    writeJson(HINTKEY, next);
    set({ hintsSeen: next });
  },
  videoProgress: readJson(VKEY, {}),
  setVideoProgress: (userId, videoId, progress) => {
    const cur = get().videoProgress;
    const p = Math.min(1, Math.max(0, progress));
    const next = { ...cur, [userId]: { ...cur[userId], [videoId]: p } };
    writeJson(VKEY, next);
    set({ videoProgress: next });
  },
  protoHidden: readJson(PKEY, false),
  setProtoHidden: (hidden) => {
    writeJson(PKEY, hidden);
    set({ protoHidden: hidden });
  },
  clearCelebrationsAndTours: (userId) => {
    const celebratedBy = { ...get().celebratedBy };
    const toursSeen = { ...get().toursSeen };
    delete celebratedBy[userId];
    delete toursSeen[userId];
    writeJson(CKEY, celebratedBy);
    writeJson(TOURKEY, toursSeen);
    set({ celebratedBy, toursSeen });
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
 * scenario popover. Persisted per browser and readable outside the AppShell (the auth
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
