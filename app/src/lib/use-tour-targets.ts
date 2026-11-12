"use client";

import { useEffect, useState } from "react";
import { requiredSelectors, type TourDef } from "@/lib/tours";
import { useReviewsStore, useRunStore } from "@/store";

/**
 * DOM presence of tour targets (spec §5.13). Targets are `[data-tour="…"]` selectors on
 * the real UI; a target counts only when it is rendered (has a layout box), so a
 * `display: none` copy never anchors a step. Shared by TourChip (eligibility) and
 * TourHost (start when ready, skip what is missing).
 */

/** First rendered element for a target selector, or null. Never throws. */
export function findTarget(selector: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let nodes: NodeListOf<HTMLElement>;
  try {
    nodes = document.querySelectorAll<HTMLElement>(selector);
  } catch {
    return null;
  }
  for (const el of nodes) {
    if (el.getClientRects().length > 0) return el;
  }
  return null;
}

function presence(selectors: string[]): string {
  return selectors.map((s) => (findTarget(s) ? "1" : "0")).join("");
}

/**
 * Which of `selectors` are on the page now, re-checked on DOM changes (MutationObserver,
 * one check per animation frame). One boolean per selector; all false until the first
 * client check, so server and hydration renders agree.
 */
export function useTourTargets(selectors: string[], enabled = true): boolean[] {
  const key = selectors.join("\n");
  const [state, setState] = useState<{ key: string; bits: string }>({ key: "", bits: "" });

  useEffect(() => {
    if (!enabled || !key) return;
    const sels = key.split("\n");
    let frame = 0;
    const check = () => {
      frame = 0;
      const bits = presence(sels);
      setState((prev) => (prev.key === key && prev.bits === bits ? prev : { key, bits }));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    schedule();
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-tour", "hidden"] });
    window.addEventListener("resize", schedule);
    return () => {
      mo.disconnect();
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [key, enabled]);

  const live = enabled && state.key === key ? state.bits : "";
  return selectors.map((_, i) => live[i] === "1");
}

/** A tour is offered when all of its required targets are on the page (`requiredSelectors`). */
export function useTourEligible(tour: TourDef | undefined, enabled = true): boolean {
  const present = useTourTargets(tour ? requiredSelectors(tour) : [], enabled && !!tour);
  return !!tour && present.length > 0 && present.every(Boolean);
}

/** The review tour is for the user's own open review: never the sample, never a signed one. */
export function useRunTourBlocked(): boolean {
  const readOnly = useRunStore((s) => s.readOnly);
  const reviewId = useRunStore((s) => s.reviewId);
  const sample = useReviewsStore((s) =>
    reviewId ? !!s.reviews.find((r) => r.id === reviewId)?.sample || reviewId === "review-sample" : false,
  );
  return readOnly || sample;
}
