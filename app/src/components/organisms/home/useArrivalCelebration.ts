"use client";

import { useEffect, useRef, useState } from "react";
import { celebrate } from "@/lib/celebrate";
import { useCurrentUser } from "@/lib/current-user";
import { takeArrival, type Arrival } from "@/lib/motion";

/** "200 ms after the page lands" (motion-spec §3.7 / §6.3). */
const LAND_DELAY_MS = 200;

/**
 * Reads the one-shot arrival mark (set by the onboarding interstitial) on mount;
 * `takeArrival()` clears it from sessionStorage at once, so leaving early or reloading
 * never replays it. The arrival lives in state, which survives a strict-mode remount
 * (the second read returns null and is ignored).
 *
 * `ready` = the page content is on screen (not the skeleton). 200 ms after that,
 * `landed` turns true — the welcome line enters — and a self-serve arrival fires the
 * onboarding confetti. `celebrate` itself enforces once-per-user and skips under
 * reduced motion / off; `landed` still flips so the welcome line shows regardless.
 */
export function useArrivalCelebration(ready: boolean): { arrival: Arrival | null; landed: boolean } {
  const me = useCurrentUser();
  const [arrival, setArrival] = useState<Arrival | null>(null);
  const [landed, setLanded] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    const taken = takeArrival();
    if (taken) setArrival(taken); // eslint-disable-line react-hooks/set-state-in-effect -- one-shot read of sessionStorage
  }, []);

  useEffect(() => {
    if (!ready || !arrival || fired.current) return;
    const t = setTimeout(() => {
      fired.current = true;
      setLanded(true);
      if (arrival.path === "self_serve") void celebrate("onboarding", me.id);
    }, LAND_DELAY_MS);
    return () => clearTimeout(t);
  }, [ready, arrival, me.id]);

  return { arrival, landed };
}
