import type { Options as ConfettiOptions } from "canvas-confetti";
import { motionModeNow } from "@/lib/motion";
import { usePrefsStore, type CelebrationKind } from "@/store";

/** Fixed hexes: a canvas can't read var(). Documented exception to "tokens only" (motion-spec §6.2). */
const COLORS = ["#10344c", "#2a6f7f", "#d6e3ee", "#2e7d4f", "#e0a43a"];

const BASE: ConfettiOptions = {
  spread: 60,
  startVelocity: 45,
  ticks: 200,
  gravity: 1.1,
  scalar: 0.9,
  shapes: ["square", "circle"],
  colors: COLORS,
  disableForReducedMotion: true,
};

type Fire = (opts: ConfettiOptions) => Promise<unknown> | null;

/** Own canvas, portaled to body, above overlays and below tours (z-index var(--z-celebrate)). */
async function withCanvas(run: (fire: Fire) => Promise<void>): Promise<void> {
  const { default: confetti } = await import("canvas-confetti");
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "var(--z-celebrate)",
  });
  document.body.appendChild(canvas);
  const instance = confetti.create(canvas, { resize: true, useWorker: true, disableForReducedMotion: true });
  try {
    await run((opts) => instance(opts));
  } finally {
    instance.reset();
    canvas.remove();
  }
}

/**
 * Big two-sided celebration. Fires at most once per user per kind; returns false when skipped.
 * Kinds: "onboarding" (self-serve arrival), "approval" (enterprise confirmed), "setup-done"
 * (all 8 Get started steps finished).
 */
export async function celebrate(kind: CelebrationKind, userId: string): Promise<boolean> {
  const prefs = usePrefsStore.getState();
  if (prefs.celebratedBy[userId]?.[kind]) return false;
  // Mark even under reduced motion / off, so flipping the setting later doesn't replay an old moment.
  prefs.markCelebrated(userId, kind);
  if (motionModeNow() !== "full") return false;

  return bigBurst();
}

/** The two-sided burst itself (no once-per-user bookkeeping). */
async function bigBurst(): Promise<boolean> {
  try {
    await withCanvas(async (fire) => {
      const wave = (count: number) =>
        Promise.all([
          fire({ ...BASE, particleCount: count, angle: 60, origin: { x: 0, y: 1 } }),
          fire({ ...BASE, particleCount: count, angle: 120, origin: { x: 1, y: 1 } }),
        ]);
      const first = wave(70);
      await new Promise((r) => setTimeout(r, 250));
      await Promise.all([first, wave(30)]);
    });
  } catch {
    return false; // import or canvas failure: the flag stays marked, no unhandled rejection
  }
  return true;
}

/** PROTOTYPE ONLY ("Play confetti" in the scenario popover): play the big burst on demand,
 *  ignoring the once-per-user marks. Still skipped when motion is off or reduced. */
export async function playConfetti(): Promise<boolean> {
  if (motionModeNow() !== "full") return false;
  return bigBurst();
}

/** Small single burst from an element (the section's earn pill). Not persisted. */
export async function burstFrom(el: HTMLElement): Promise<void> {
  if (motionModeNow() !== "full") return;
  const r = el.getBoundingClientRect();
  const origin = {
    x: (r.left + r.width / 2) / window.innerWidth,
    y: (r.top + r.height / 2) / window.innerHeight,
  };
  try {
    await withCanvas(async (fire) => {
      await fire({ ...BASE, particleCount: 30, origin });
    });
  } catch {
    /* decorative: swallow */
  }
}
