"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { orgShortName } from "./StepPanel";
import { Button, Illustration } from "@/components/atoms";
import { SelectTile } from "@/components/molecules";
import { buildSlots, monthRange, slotLabel } from "@/lib/call-slots";
import { useOrgStore } from "@/store/org.store";
import { useProtoFill } from "@/components/organisms/prototype/useProtoFill";
import "./call.css";

type Slot = { at: number; label: string };


/**
 * Book-a-call step for enterprise prospects (spec §5.1, PC-24 option C): a mock
 * scheduler inside the onboarding card. Pick a day and a time, book, see the
 * confirmation, then `onBooked` when the user clicks Continue. The interstitial and routing belong to the
 * caller. "I'll book later" calls `onLater`.
 */
export function CallBooking({
  orgName,
  onBooked,
  onLater,
}: {
  orgName: string;
  onBooked: (slot: Slot) => void;
  onLater: () => void;
}) {
  const bookCall = useOrgStore((s) => s.bookCall);
  // Lazy initialiser: no Date.now() during render.
  const [now] = useState(() => Date.now());
  const days = useMemo(() => buildSlots(now), [now]);
  const [dayIdx, setDayIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<Slot | null>(null);
  const doneRef = useRef(false);

  const day = days[dayIdx];
  const month = monthRange(days.map((d) => d.day.date));
  const pickedLabel = picked !== null ? slotLabel(picked) : null;

  const onBookedRef = useRef(onBooked);
  useEffect(() => {
    onBookedRef.current = onBooked;
  }, [onBooked]);
  const finish = useCallback((slot: Slot) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onBookedRef.current(slot);
  }, []);

  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!booked) return;
    // Hold on the confirmation until the user clicks Continue (no auto-advance).
    headingRef.current?.focus();
  }, [booked]);

  // Fill wand: the first free slot. Shift-wand clears the pick and shows the "pick a time" error. Never books.
  useProtoFill("welcome-call", {
    valid: () => {
      setDayIdx(0);
      setPicked(days[0]?.times[0]?.at ?? null);
      setError(null);
    },
    invalid: () => {
      setPicked(null);
      setError("Pick a time first.");
    },
  });

  const book = async () => {
    if (picked === null) {
      setError("Pick a time first.");
      return;
    }
    setError(null);
    setBusy(true);
    const slot = { at: picked, label: slotLabel(picked) };
    try {
      await bookCall(slot);
      setBooked(slot);
    } finally {
      setBusy(false);
    }
  };

  if (booked) {
    return (
      <div className="call call--booked" role="status">
        <Illustration name="25-scene-call-booked" size={320} />
        <h1 className="wel-title" tabIndex={-1} ref={headingRef}>
          You&apos;re booked
        </h1>
        <p className="call-when">{booked.label} · Eastern Time</p>
        <p className="wel-sub call-lede">
          Realwired&apos;s onboarding team will call to set up {orgShortName(orgName)}. A calendar invite is on its way.
        </p>
        <Button block iconRight="forward" onClick={() => finish(booked)}>
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="call">
      <h1 className="wel-title">Book {possessive(orgShortName(orgName))} setup call</h1>
      <p className="wel-sub">Twenty minutes with Realwired&apos;s onboarding team, so your first review uses your own rules.</p>

      <div className="call-head">
        <span className="call-month">{month} · Eastern Time</span>
      </div>

      <div className="call-days" role="group" aria-label="Day">
        {days.map((d, i) => {
          const [wd, num] = d.day.label.split(" ");
          return (
            <SelectTile key={d.day.date} selected={i === dayIdx} onSelect={() => setDayIdx(i)} className="call-day">
              <span className="call-day-wd">{wd}</span>
              <span className="call-day-num">{num}</span>
            </SelectTile>
          );
        })}
      </div>

      <div className="call-times" role="group" aria-label={`Times on ${day.day.label}`}>
        {day.times.map((t) => (
          <SelectTile
            key={t.at}
            selected={picked === t.at}
            onSelect={() => {
              setPicked(t.at);
              setError(null);
            }}
            className="call-time"
          >
            {t.label}
          </SelectTile>
        ))}
      </div>

      <Button
        block
        busy={busy}
        iconLeft="calendar-event"
        onClick={book}
        aria-disabled={picked === null ? true : undefined}
        aria-describedby={picked === null ? (error ? "call-hint call-err" : "call-hint") : undefined}
      >
        {pickedLabel ? `Book ${pickedLabel}` : "Book a call"}
      </Button>
      <span id="call-hint" className="sr-only">
        Pick a day and a time to book.
      </span>
      {error && (
        <p id="call-err" className="call-err" role="alert">
          {error}
        </p>
      )}

      <p className="wel-note">
        Can&apos;t find a time?{" "}
        <button type="button" className="call-later" onClick={onLater}>
          I&apos;ll book later
        </button>
      </p>
    </div>
  );
}

function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}
