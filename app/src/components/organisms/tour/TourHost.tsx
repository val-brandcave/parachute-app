"use client";

import { useEffect, useMemo, useRef } from "react";
import { flushSync } from "react-dom";
import { usePathname } from "next/navigation";
import {
  EVENTS,
  Joyride,
  PORTAL_ELEMENT_ID,
  type EventData,
  type Options,
  type PartialDeep,
  type Step,
  type Styles,
} from "react-joyride";
import { tourById, type TourDef } from "@/lib/tours";
import { dur, useMotionMode } from "@/lib/motion";
import { useCurrentUser } from "@/lib/current-user";
import { useTourStore } from "@/store/tour.store";
import { usePrefsStore } from "@/store/prefs.store";
import { useOnboardingStore, useRunStore } from "@/store";
import { useLockStore } from "@/store/lock.store";
import { findTarget, useRunTourBlocked, useTourTargets } from "@/lib/use-tour-targets";
import { TourTooltip, type TourStepData } from "./TourTooltip";
import "./tour.css";

/**
 * Tour host (react-joyride v3, spec §5.13, PC-14 / PC-31 / PC-38).
 *
 * Mounted twice: `scope="shell"` in AppShell for page tours, and `scope="run"` inside
 * the review takeover (`RunExperience`), because `.run` (z 120) covers the shell's
 * stacking context. Each host renders only the active tour of its own scope, portaled
 * to `document.body` at the tour tier: overlay 126, tooltip 128 — above `.run`, below
 * the Sign modal (130), `LockDialog` (140) and popovers (200).
 *
 * `useTourStore` is the source of truth; Joyride runs controlled (`stepIndex`).
 * - Opt-in: a tour starts from its chip, or from `?tour=<id>` on its route (Get started
 *   "Start tour" lands on a review with `?tour=first-review`). Nothing else starts one.
 * - The run tour starts only on spoke `workbook`, Technical track, once the workbook is
 *   ready (its targets exist); on a two-type run the Technical tab is selected first.
 * - Missing targets are skipped (Joyride's `target_not_found` → next step), never thrown.
 * - Any dialog opening (Sign modal, LockDialog, checkout…) stops the tour ("interrupted"),
 *   BEFORE it renders: `openLock` is caught on the lock store, a click on a known dialog
 *   opener (Sign & finalize) in the capture phase, anything else by a MutationObserver.
 * - Esc skips the tour (not while a menu is open) and never reaches the takeover's Esc.
 * - A tour that showed a card is marked seen when it stops; only Done on the last card
 *   (`done`) completes `first-review`'s `tutorial`. A missing last target = "interrupted".
 */

const READY_TIMEOUT_MS = 8000;
/** Joyride draws the floater at `zIndex + 1` and the overlay at `zIndex`; the overlay is
 *  lowered to 126 in `styles` so the pair lands on PC-31's 126 / 128 (`--z-tour-*`). */
const Z_TOUR_OVERLAY = 126;
const Z_TOUR = 128;

/** Dialog roots that interrupt a tour. The tour's own card lives in Joyride's portal. */
const DIALOG_SEL = '[role="dialog"], [role="alertdialog"], .ui-modal';
/** Controls that open a dialog over the tour: a click on one stops the tour first. */
const DIALOG_OPENERS = '[data-tour="wb-sign"]';
/** While one of these is open, Esc belongs to it, not to the tour. */
const MENU_SEL = '.ui-menu-pop, [role="menu"], [role="listbox"]';

/** Stop now and commit the removal before the event that opens a dialog is handled. */
function stopFirst() {
  flushSync(() => useTourStore.getState().stop("interrupted"));
}

export function TourHost({ scope }: { scope: "shell" | "run" }) {
  const active = useTourStore((s) => s.active);
  const stepIndex = useTourStore((s) => s.step);
  const tour = active ? tourById(active) : undefined;
  const mine: TourDef | undefined = tour && tour.scope === scope ? tour : undefined;

  const pathname = usePathname();
  const spoke = useRunStore((s) => s.spoke);
  const runBlocked = useRunTourBlocked();
  const userId = useCurrentUser().id;
  const motion = useMotionMode();

  const selectors = useMemo(() => (mine ? mine.steps.map((s) => s.target) : []), [mine]);
  const present = useTourTargets(selectors, !!mine);
  const ready = present.some(Boolean);
  const inPlace = !mine ? false : scope === "run" ? spoke === "workbook" : mine.route === pathname;
  const show = !!mine && inPlace && ready;

  // ---- Deep link: `?tour=<id>` on this scope's surface (the only non-chip start) ----
  useEffect(() => {
    const id = readTourParam();
    const t = id ? tourById(id) : undefined;
    if (!t || t.scope !== scope) return;
    if (scope === "run") {
      // Wait out the pipeline (progress auto-advances to workbook); drop it anywhere else.
      if (spoke === "progress") return;
      // Same gate as the chip: the user's own open review, never the sample or a signed one.
      if (spoke === "workbook" && !runBlocked) useTourStore.getState().start(t.id);
      clearTourParam();
      return;
    }
    if (t.route !== pathname) return;
    useTourStore.getState().start(t.id);
    clearTourParam();
  }, [scope, spoke, runBlocked, pathname]);

  // ---- Leaving the tour's surface stops it (route change, or off the workbook spoke) ----
  useEffect(() => {
    if (mine && !inPlace) useTourStore.getState().stop("interrupted");
  }, [mine, inPlace]);

  // ---- Run tour: Technical track first (two-type runs default to it, but may be on Admin) ----
  useEffect(() => {
    if (!mine || scope !== "run" || !inPlace) return;
    const tabs = document.querySelectorAll<HTMLElement>('.run-types [role="tab"]');
    for (const tab of tabs) {
      if (/technical/i.test(tab.textContent ?? "") && tab.getAttribute("aria-selected") !== "true") {
        tab.click();
        break;
      }
    }
  }, [mine, scope, inPlace]);

  // ---- Never wait forever for a surface that has none of the targets ----
  useEffect(() => {
    if (!mine || !inPlace || ready) return;
    const t = window.setTimeout(() => useTourStore.getState().stop("interrupted"), READY_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [mine, inPlace, ready]);

  // ---- Any dialog opening stops the tour first (PC-31) ----
  useEffect(() => {
    if (!show) return;
    const isOwn = (el: Element) => !!el.closest(`#${PORTAL_ELEMENT_ID}`);
    const before = new Set(Array.from(document.querySelectorAll(DIALOG_SEL)));
    let frame = 0;
    const check = () => {
      frame = 0;
      for (const el of document.querySelectorAll(DIALOG_SEL)) {
        if (!before.has(el) && !isOwn(el)) {
          stopFirst();
          return;
        }
      }
    };
    const mo = new MutationObserver((records) => {
      // A dialog must be stopped for before it paints over the tour: check synchronously
      // when a node was added, otherwise batch to the next frame.
      if (records.some((r) => r.addedNodes.length)) check();
      else if (!frame) frame = requestAnimationFrame(check);
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["role", "open"] });
    return () => {
      mo.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [show]);

  // ---- Known openers: LockDialog (store-driven) and Sign & finalize stop the tour first ----
  useEffect(() => {
    if (!show) return;
    const unsub = useLockStore.subscribe((s, prev) => {
      if (s.reason && !prev.reason) stopFirst();
    });
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (t && t.closest && t.closest(DIALOG_OPENERS)) stopFirst();
    };
    document.addEventListener("click", onClick, true);
    return () => {
      unsub();
      document.removeEventListener("click", onClick, true);
    };
  }, [show]);

  // ---- Esc skips the tour (capture: runs before the takeover's Esc-to-close) ----
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (document.querySelector(MENU_SEL)) return; // the open menu owns this Esc
      e.preventDefault();
      useTourStore.getState().stop("skipped");
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [show]);

  // ---- Unmounting the surface mid-tour (closing the review) interrupts it ----
  const shownRef = useRef(false);
  useEffect(() => {
    shownRef.current = show;
  }, [show]);
  useEffect(
    () => () => {
      if (!shownRef.current) return;
      const s = useTourStore.getState();
      if (s.active && tourById(s.active)?.scope === scope) s.stop("interrupted");
    },
    [scope],
  );

  // ---- Outcome: seen once a card was shown; `done` completes the tour's setup step ----
  const cardShownRef = useRef<string | null>(null);
  useEffect(
    () =>
      useTourStore.subscribe((s, prev) => {
        const last = s.lastStop;
        if (!last || last === prev.lastStop) return;
        const t = tourById(last.id);
        if (!t || t.scope !== scope) return;
        const sawCard = cardShownRef.current === t.id;
        cardShownRef.current = null;
        // A tour that never showed a card (no targets, 8 s timeout) stays unseen.
        if (sawCard) usePrefsStore.getState().setTourSeen(userId, t.id, true);
        if (last.reason === "done" && t.completesStep) {
          void useOnboardingStore.getState().complete(t.completesStep);
        }
      }),
    [scope, userId],
  );

  // ---- Step direction, so a missing target is skipped the way the user was going ----
  const dirRef = useRef<1 | -1>(1);
  const prevStepRef = useRef(stepIndex);
  useEffect(() => {
    dirRef.current = stepIndex < prevStepRef.current ? -1 : 1;
    prevStepRef.current = stepIndex;
  }, [stepIndex]);

  const steps = useMemo<Step[]>(() => (mine ? toJoyrideSteps(mine) : []), [mine]);

  const options = useMemo<Partial<Options>>(
    () => ({
      zIndex: Z_TOUR - 1,
      skipBeacon: true,
      // We scroll ourselves (`before`): Joyride's scroller reads offsets, which are wrong
      // inside the CSS-zoomed `.run-wb-zoom`; a rect delta on the scroll parent is not.
      skipScroll: true,
      before: (data) => scrollToTarget(data.step.target, motion),
      beforeTimeout: 2000,
      targetWaitTimeout: 600,
      overlayClickAction: false,
      dismissKeyAction: false,
      blockTargetInteraction: false,
      spotlightPadding: 6,
      spotlightRadius: 10,
      offset: 12,
      width: 340,
      arrowColor: "var(--md-surface)",
      backgroundColor: "var(--md-surface)",
      textColor: "var(--md-on-surface)",
      primaryColor: "var(--md-primary)",
      overlayColor: "var(--tour-dim)",
    }),
    [motion],
  );

  const styles = useMemo<PartialDeep<Styles>>(
    () => ({
      overlay: { zIndex: Z_TOUR_OVERLAY },
      floater: {
        filter: "none",
        transition:
          motion === "off"
            ? "none"
            : `opacity ${(motion === "full" ? dur.standard : dur.reducedFade) * 1000}ms`,
      },
    }),
    [motion],
  );

  const onEvent = (data: EventData) => {
    if (data.type === EVENTS.TOOLTIP) {
      if (mine) cardShownRef.current = mine.id;
      return;
    }
    if (data.type !== EVENTS.TARGET_NOT_FOUND) return;
    const s = useTourStore.getState();
    const t = s.active ? tourById(s.active) : undefined;
    if (dirRef.current === -1 && s.step > 0) s.back();
    // A missing LAST card is not a finished tour: Done is only reachable on a shown card.
    else if (t && s.step + 1 >= t.steps.length) s.stop("interrupted");
    else s.next();
  };

  if (!show || !mine) return null;

  return (
    <Joyride
      key={mine.id}
      run
      continuous
      stepIndex={stepIndex}
      steps={steps}
      options={options}
      styles={styles}
      tooltipComponent={TourTooltip}
      onEvent={onEvent}
      scrollToFirstStep
    />
  );
}

function toJoyrideSteps(tour: TourDef): Step[] {
  return tour.steps.map((s, i) => ({
    id: `${tour.id}-${i}`,
    // A function target re-resolves on every lookup, so a re-rendered node is followed
    // and a removed one reads as "not found" (skipped), never a stale element.
    target: () => findTarget(s.target),
    title: s.title,
    content: s.body,
    placement: s.placement ?? "auto",
    data: { art: s.art } satisfies TourStepData,
  }));
}

/** Centre the target in its nearest scrolling ancestor, by rect delta (zoom-safe). */
async function scrollToTarget(target: unknown, motion: "full" | "reduced" | "off"): Promise<void> {
  const el = typeof target === "function" ? (target as () => HTMLElement | null)() : null;
  if (!el) return;
  const parent = scrollParent(el);
  if (!parent) return;
  const r = el.getBoundingClientRect();
  const p = parent.getBoundingClientRect();
  const inView = r.top >= p.top + 8 && r.bottom <= p.bottom - 8;
  if (inView) return;
  const delta = r.top + r.height / 2 - (p.top + p.height / 2);
  const smooth = motion === "full";
  parent.scrollBy({ top: delta, behavior: smooth ? "smooth" : "auto" });
  await new Promise((res) => window.setTimeout(res, smooth ? dur.standard * 1000 + 120 : 40));
}

function scrollParent(el: HTMLElement): HTMLElement | null {
  let n = el.parentElement;
  while (n && n !== document.body) {
    const { overflowY } = getComputedStyle(n);
    if ((overflowY === "auto" || overflowY === "scroll") && n.scrollHeight > n.clientHeight) return n;
    n = n.parentElement;
  }
  return null;
}

function readTourParam(): string | null {
  try {
    return new URLSearchParams(window.location.search).get("tour");
  } catch {
    return null;
  }
}

function clearTourParam() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("tour")) return;
    url.searchParams.delete("tour");
    window.history.replaceState(window.history.state, "", url.toString());
  } catch {
    /* no history API: the param just stays */
  }
}
