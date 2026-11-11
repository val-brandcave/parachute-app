"use client";

import { useEffect, useState } from "react";
import { celebrate } from "@/lib/celebrate";
import { useCurrentUser } from "@/lib/current-user";
import { takeArrival, type Arrival } from "@/lib/motion";

/**
 * Module-scoped so a strict-mode double effect (mount → cleanup → mount) sees the
 * same arrival: takeArrival() clears sessionStorage on the first read.
 */
let pending: { arrival: Arrival; fired: boolean } | null = null;

/**
 * Reads the one-shot arrival mark (set by the onboarding interstitial) once, and
 * for a self-serve arrival fires the onboarding confetti 200 ms after mount.
 * `celebrate` itself enforces once-per-user and skips under reduced motion / off.
 */
export function useArrivalCelebration(): { arrival: Arrival | null } {
  const me = useCurrentUser();
  const [arrival, setArrival] = useState<Arrival | null>(null);

  useEffect(() => {
    const taken = takeArrival();
    if (taken) pending = { arrival: taken, fired: false };
    const p = pending;
    if (!p) return;
    setArrival(p.arrival); // eslint-disable-line react-hooks/set-state-in-effect -- one-shot read of sessionStorage
    if (p.arrival.path !== "self_serve" || p.fired) return;
    const t = setTimeout(() => {
      p.fired = true;
      pending = null;
      void celebrate("onboarding", me.id);
    }, 200);
    return () => clearTimeout(t);
    // Read once per mount; the user id is stable for the arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { arrival };
}
