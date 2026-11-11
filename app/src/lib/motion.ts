import { useSyncExternalStore } from "react";
import type { Transition, Variants } from "framer-motion";

/** Corporate archetype: calm, precise, no bounce on UI (motion-contract.md). */
export const ease = {
  standard: [0.2, 0, 0, 1], // ~80% of motion
  enter: [0.05, 0.7, 0.1, 1],
  exit: [0.3, 0, 1, 1],
  linear: "linear", // progress bars only
} as const;

/** Seconds (framer units). */
export const dur = {
  quick: 0.15,
  standard: 0.28,
  slow: 0.48,
  fill: 0.4,
  shake: 0.3,
  reducedFade: 0.12,
} as const;

export const dist = {
  enter: 12,
  step: 16,
  panel: 24,
  lift: 8,
  shake: 6,
  icon: 6,
} as const;

export const stagger = {
  gap: 0.06,
  maxTotal: 0.4,
  codeFill: 0.03,
} as const;

/** Clamp a stagger so N children never exceed stagger.maxTotal. */
export function staggerFor(count: number): number {
  return Math.min(stagger.gap, stagger.maxTotal / Math.max(count - 1, 1));
}

/** Direction of a step change: 1 = forward (content leaves to the left), -1 = back. */
export type Dir = 1 | -1;

/** Step content (T1, T3, T3b). Use with AnimatePresence `custom={dir}` and motion.div `custom={dir}`. */
export const stepVariants: Variants = {
  enter: (dir: Dir) => ({ opacity: 0, x: dist.step * dir }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: dur.standard, ease: ease.enter },
  },
  exit: (dir: Dir) => ({
    opacity: 0,
    x: -dist.step * dir,
    transition: { duration: dur.quick, ease: ease.exit },
  }),
};

/** Reduced-motion twin: no travel, 120 ms fades. */
export const stepVariantsReduced: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: dur.reducedFade } },
  exit: { opacity: 0, transition: { duration: dur.reducedFade } },
};

/** Generic entrance: opacity plus 12 px rise. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: dist.enter },
  shown: { opacity: 1, y: 0, transition: { duration: dur.standard, ease: ease.enter } },
};

/** Card height and T2 move. */
export const cardHeight: Transition = { duration: dur.standard, ease: ease.standard };
export const cardMove: Transition = { duration: dur.slow, ease: ease.standard };

const MOTION_KEY = "parachute:motion";

function motionQuery(): string | null {
  try {
    return new URLSearchParams(location.search).get("motion");
  } catch {
    return null;
  }
}

function storedFlag(): string | null {
  try {
    return sessionStorage.getItem(MOTION_KEY);
  } catch {
    return null;
  }
}

/**
 * Read-only (safe to call during render). True when motion is switched off for
 * tests and recordings (motion-spec §8). Precedence: `?motion=1|0` in the URL,
 * then the tab's sticky flag, then automation (`navigator.webdriver`), then
 * `NEXT_PUBLIC_MOTION=0`.
 */
export function motionOff(): boolean {
  if (typeof window === "undefined" && typeof location === "undefined") {
    return process.env.NEXT_PUBLIC_MOTION === "0";
  }
  const q = motionQuery();
  if (q === "1") return false;
  if (q === "0") return true;
  const stored = storedFlag();
  if (stored === "1") return false;
  if (stored === "0") return true;
  if (typeof navigator !== "undefined" && navigator.webdriver === true) return true;
  return process.env.NEXT_PUBLIC_MOTION === "0";
}

/**
 * Persists `?motion=1` / `?motion=0` for the tab so it survives client-side
 * navigation. The one write; call once on the client (MotionProvider), never in render.
 */
export function initMotionFlag(): void {
  const q = motionQuery();
  if (q !== "0" && q !== "1") return;
  try {
    sessionStorage.setItem(MOTION_KEY, q);
  } catch {
    /* storage unavailable: the flag just isn't sticky */
  }
}

export type MotionMode = "full" | "reduced" | "off";

/**
 * Non-hook mode check, shared by useMotionMode and celebrate(). This is the
 * single sanctioned matchMedia call: components and libs never query it themselves.
 */
export function motionModeNow(): MotionMode {
  if (motionOff()) return "off";
  if (typeof window === "undefined") return "full";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full";
}

function subscribeMotionMode(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function serverMotionMode(): MotionMode {
  return process.env.NEXT_PUBLIC_MOTION === "0" ? "off" : "full";
}

/**
 * "full" | "reduced" | "off". Reduced = OS setting; off = tests (§8).
 * useSyncExternalStore: the server and hydration render use the server value
 * ("full", or "off" via the env flag), then the client value applies, so there
 * is no hydration mismatch.
 */
export function useMotionMode(): MotionMode {
  return useSyncExternalStore(subscribeMotionMode, motionModeNow, serverMotionMode);
}

/** Picks the variant set for the current motion mode. */
export function useStepVariants(): Variants {
  return useMotionMode() === "full" ? stepVariants : stepVariantsReduced;
}

/* ---- One-shot hand-offs across route changes (T2 and T5) ------------------- */

const HANDOFF_KEY = "parachute:handoff";
const ARRIVAL_KEY = "parachute:arrival";
const ARRIVAL_MAX_AGE_MS = 10_000;

/** from = the card that left: "signup" (T1, height only) or "verify" (T2, full rect). */
export type Handoff = {
  from: "signup" | "verify";
  rect: { top: number; left: number; width: number; height: number };
};
export type Arrival = { path: "self_serve" | "enterprise"; at: number };

function put(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the transition just doesn't hand off */
  }
}

function take<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return null;
    sessionStorage.removeItem(key);
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setHandoff(h: Handoff): void {
  put(HANDOFF_KEY, h);
}
/** Reads and clears. */
export function takeHandoff(): Handoff | null {
  return take<Handoff>(HANDOFF_KEY);
}
export function markArrival(a: Arrival): void {
  put(ARRIVAL_KEY, a);
}
/** Reads and clears; null if older than 10 s (guards a stale tab). `now` is injectable for purity. */
export function takeArrival(now: number = Date.now()): Arrival | null {
  const a = take<Arrival>(ARRIVAL_KEY);
  if (!a || now - a.at > ARRIVAL_MAX_AGE_MS) return null;
  return a;
}
