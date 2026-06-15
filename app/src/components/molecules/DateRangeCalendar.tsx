"use client";

import { useMemo, useState } from "react";
import { Button, Icon } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type DateRange = { start: number; end: number };

const DAY = 86400000;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/* ── date helpers (all pure — only operate on passed-in timestamps) ── */
function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function endOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
function startOfMonth(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}
function addMonths(ts: number, n: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime();
}
/** Monday-first weekday index (0 = Mon … 6 = Sun). */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}
/** 42-cell (6-week) grid for the month containing `monthTs`, Monday-first. */
function monthGrid(monthTs: number): number[] {
  const base = new Date(monthTs);
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const cur = new Date(
    first.getFullYear(),
    first.getMonth(),
    1 - mondayIndex(first),
  );
  const cells: number[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(startOfDay(cur.getTime()));
    cur.setDate(cur.getDate() + 1);
  }
  return cells;
}

/** Compact, human range label, e.g. "Jun 1 – Jun 15, 2026". */
export function formatRange(r: DateRange): string {
  const s = new Date(r.start);
  const e = new Date(r.end);
  const md = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const mdy = (d: Date) =>
    d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return s.getFullYear() === e.getFullYear()
    ? `${md(s)} – ${mdy(e)}`
    : `${mdy(s)} – ${mdy(e)}`;
}

type Preset = { label: string; start: number; end: number };
function buildPresets(today: number): Preset[] {
  const t = startOfDay(today);
  return [
    { label: "Last 7 days", start: t - 6 * DAY, end: t },
    { label: "Last 30 days", start: t - 29 * DAY, end: t },
    { label: "Last 90 days", start: t - 89 * DAY, end: t },
    { label: "Month to date", start: startOfMonth(today), end: t },
    {
      label: "Year to date",
      start: new Date(new Date(today).getFullYear(), 0, 1).getTime(),
      end: t,
    },
  ];
}

export function DateRangeCalendar({
  value,
  today,
  onApply,
  onCancel,
}: {
  value: DateRange | null;
  /** "now" passed in from the caller's lazy initializer (keeps render pure). */
  today: number;
  onApply: (r: DateRange) => void;
  onCancel: () => void;
}) {
  const [start, setStart] = useState<number | null>(
    value ? startOfDay(value.start) : null,
  );
  const [end, setEnd] = useState<number | null>(
    value ? startOfDay(value.end) : null,
  );
  const [hover, setHover] = useState<number | null>(null);
  const [viewTs, setViewTs] = useState(() =>
    startOfMonth(value ? value.start : addMonths(today, -1)),
  );

  const t0 = startOfDay(today);
  const presets = useMemo(() => buildPresets(today), [today]);
  const months = [viewTs, addMonths(viewTs, 1)];

  function pick(day: number) {
    if (start === null || end !== null) {
      setStart(day);
      setEnd(null);
    } else if (day < start) {
      setEnd(start);
      setStart(day);
    } else {
      setEnd(day);
    }
  }

  function applyPreset(p: Preset) {
    setStart(p.start);
    setEnd(p.end);
    setViewTs(startOfMonth(addMonths(p.end, -1)));
  }

  // Resolve the visible band: while picking the second endpoint, the hovered
  // day previews the range.
  const previewEnd = end ?? (start !== null ? hover : null);
  let lo: number | null = null;
  let hi: number | null = null;
  if (start !== null && previewEnd !== null) {
    lo = Math.min(start, previewEnd);
    hi = Math.max(start, previewEnd);
  } else if (start !== null) {
    lo = start;
  }

  const canApply = start !== null && end !== null;
  const readout =
    start !== null && end !== null
      ? formatRange({ start, end })
      : start !== null
        ? `${new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – select end`
        : "Select a start date";

  return (
    <div className="drcal">
      <div className="drcal-presets">
        <span className="drcal-presets-label">Quick ranges</span>
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            className={cn(
              "drcal-preset",
              start === p.start && end === p.end && "on",
            )}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="drcal-main">
        <div className="drcal-cals">
          <button
            type="button"
            className="drcal-nav drcal-nav--prev"
            onClick={() => setViewTs(addMonths(viewTs, -1))}
            aria-label="Previous month"
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <button
            type="button"
            className="drcal-nav drcal-nav--next"
            onClick={() => setViewTs(addMonths(viewTs, 1))}
            aria-label="Next month"
          >
            <Icon name="chevron-right" size={16} />
          </button>

          {months.map((m) => {
            const mDate = new Date(m);
            return (
              <div className="drcal-month" key={m}>
                <div className="drcal-mhead">
                  {MONTH_NAMES[mDate.getMonth()]} {mDate.getFullYear()}
                </div>
                <div className="drcal-dow">
                  {DOW.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div
                  className="drcal-grid"
                  onMouseLeave={() => setHover(null)}
                >
                  {monthGrid(m).map((day) => {
                    const inMonth = new Date(day).getMonth() === mDate.getMonth();
                    const isStart = lo !== null && day === lo;
                    const isEnd = hi !== null && day === hi;
                    const isEndpoint = isStart || isEnd;
                    const inRange =
                      lo !== null && hi !== null && day > lo && day < hi;
                    return (
                      <div
                        key={day}
                        className={cn(
                          "drcal-cell",
                          inRange && "in-range",
                          isStart && hi !== null && hi !== lo && "range-start",
                          isEnd && hi !== lo && "range-end",
                        )}
                      >
                        <button
                          type="button"
                          className={cn(
                            "drcal-day",
                            !inMonth && "muted",
                            day === t0 && "today",
                            isEndpoint && "endpoint",
                          )}
                          onClick={() => pick(day)}
                          onMouseEnter={() => setHover(day)}
                        >
                          {new Date(day).getDate()}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="drcal-foot">
          <span className="drcal-readout">{readout}</span>
          <div className="drcal-actions">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!canApply}
              onClick={() =>
                start !== null &&
                end !== null &&
                onApply({ start: startOfDay(start), end: endOfDay(end) })
              }
            >
              Apply range
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
