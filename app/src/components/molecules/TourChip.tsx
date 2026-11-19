"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { IconButton } from "@/components/atoms/IconButton";
import { useRunTourBlocked, useTourEligible } from "@/lib/use-tour-targets";
import { tourById } from "@/lib/tours";
import { useCurrentUser } from "@/lib/current-user";
import { useTourStore } from "@/store/tour.store";
import { usePrefsStore } from "@/store/prefs.store";

/**
 * "Take a 1-minute tour" chip (spec §5.13, PC-38): local Button size="sm" outline + a petrol
 * icon + a dismiss IconButton. Page tours render it in the header slot; the review tour in
 * `.run-head`. Offered on first visit only, when the tour's required targets exist. It is
 * marked seen once the user has actually been able to see it (on screen and not covered),
 * or on dismiss; a tour that ran marks itself seen in TourHost. While its tour runs it
 * becomes the "Tour, n of N" status line. Styles live in `organisms/tour/tour.css`
 * (loaded by TourHost, which is mounted in AppShell and RunExperience).
 * // DS-candidate: TourChip — no DS chip carries an action + dismiss.
 */
export function TourChip({ tourId }: { tourId: string }) {
  const tour = tourById(tourId);
  const userId = useCurrentUser().id;
  const active = useTourStore((s) => s.active);
  const step = useTourStore((s) => s.step);
  const lastStop = useTourStore((s) => s.lastStop);
  const setTourSeen = usePrefsStore((s) => s.setTourSeen);

  // Snapshots per visit (the slot keys the chip by route; the run chip mounts on the
  // workbook spoke): marking it seen mid-visit doesn't hide it, and only a tour that
  // stops during THIS visit retires the chip (a "Reset tours" brings it back next visit).
  const [seenAtVisit] = useState(() => !!usePrefsStore.getState().toursSeen[userId]?.[tourId]);
  const [stopAtVisit] = useState(() => useTourStore.getState().lastStop);
  const [dismissed, setDismissed] = useState(false);
  const ranThisVisit = lastStop !== stopAtVisit && lastStop?.id === tourId;

  const runBlocked = useRunTourBlocked();
  const blocked = tour?.scope === "run" && runBlocked;
  const running = active === tourId;
  const offerable = !!tour && !seenAtVisit && !dismissed && !blocked && !active && !ranThisVisit;
  const eligible = useTourEligible(tour, offerable);
  const showChip = offerable && eligible;

  // Seen only once the chip has really been in view: intersecting the viewport AND the
  // topmost element at its centre (not under the prototype pill or another layer).
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!showChip || !el) return;
    let timer = 0;
    let done = false;
    const visible = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!hit && el.contains(hit);
    };
    const tick = () => {
      if (done) return;
      if (visible()) {
        done = true;
        setTourSeen(userId, tourId, true);
        return;
      }
      timer = window.setTimeout(tick, 600);
    };
    const io = new IntersectionObserver((entries) => {
      window.clearTimeout(timer);
      if (entries.some((e) => e.isIntersecting)) timer = window.setTimeout(tick, 400);
    });
    io.observe(el);
    return () => {
      done = true;
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [showChip, setTourSeen, userId, tourId]);

  if (!tour) return null;

  if (running) {
    return (
      <span className="tour-status" role="status" aria-live="polite">
        Tour, {step + 1} of {tour.steps.length}
      </span>
    );
  }

  if (!showChip) return null;

  return (
    <span className="tour-chip" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        iconLeft="help"
        className="tour-chip-btn"
        onClick={() => useTourStore.getState().start(tourId)}
      >
        {tour.label}
      </Button>
      <IconButton
        name="close"
        size={14}
        className="tour-chip-x"
        aria-label="Dismiss tour"
        onClick={() => {
          setTourSeen(userId, tourId, true);
          setDismissed(true);
        }}
      />
    </span>
  );
}
