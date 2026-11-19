/**
 * Mock setup-call scheduler data. Everything is computed in Eastern Time so the
 * result never depends on the machine's timezone. Pure: callers pass `now`.
 */

const TZ = "America/New_York";
const DAYS_SHOWN = 5;

/** 8 half-hour starts per day, with a lunch gap (hour, minute). */
const SLOT_STARTS: [number, number][] = [
  [9, 0],
  [9, 30],
  [10, 0],
  [10, 30],
  [13, 0],
  [13, 30],
  [14, 30],
  [15, 0],
];

export interface CallSlot {
  at: number;
  label: string;
}
export interface CallDay {
  day: { label: string; date: number };
  times: CallSlot[];
}

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});

function easternParts(t: number) {
  const o: Record<string, number> = {};
  for (const p of partsFmt.formatToParts(new Date(t))) {
    if (p.type !== "literal") o[p.type] = Number(p.value);
  }
  return o as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** UTC timestamp for a wall-clock time in Eastern (DST-aware). */
function easternToUtc(y: number, m: number, d: number, h: number, min: number): number {
  const wall = Date.UTC(y, m - 1, d, h, min);
  let guess = wall;
  // Two passes settle the offset, including across a DST change.
  for (let i = 0; i < 2; i++) {
    const p = easternParts(guess);
    const seen = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess += wall - seen;
  }
  return guess;
}

const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" });
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });
const longFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" });

/** "Fri, Nov 13 at 10:00 AM" (Eastern). */
export function slotLabel(at: number): string {
  return `${longFmt.format(new Date(at))} at ${timeFmt.format(new Date(at))}`;
}

/** The next five weekdays after today (Eastern), 8 times each. */
export function buildSlots(now: number): CallDay[] {
  const p = easternParts(now);
  const out: CallDay[] = [];
  let offset = 0;
  while (out.length < DAYS_SHOWN) {
    offset += 1;
    // Noon UTC on the calendar date avoids any date-rollover at the edges.
    const cal = new Date(Date.UTC(p.year, p.month - 1, p.day + offset, 12));
    const dow = cal.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const y = cal.getUTCFullYear();
    const m = cal.getUTCMonth() + 1;
    const d = cal.getUTCDate();
    const date = easternToUtc(y, m, d, 0, 0);
    const times = SLOT_STARTS.map(([h, min]) => {
      const at = easternToUtc(y, m, d, h, min);
      return { at, label: timeFmt.format(new Date(at)) };
    });
    out.push({ day: { label: `${weekdayFmt.format(new Date(easternToUtc(y, m, d, 12, 0)))} ${d}`, date }, times });
  }
  return out;
}

const monthOnly = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "long" });
const yearOnly = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric" });

/** "November 2026", "November – December 2026" or "December 2026 – January 2027" for the given day timestamps. */
export function monthRange(dates: number[]): string {
  const a = new Date(dates[0]);
  const b = new Date(dates[dates.length - 1]);
  const [ma, mb, ya, yb] = [monthOnly.format(a), monthOnly.format(b), yearOnly.format(a), yearOnly.format(b)];
  if (ma === mb && ya === yb) return `${ma} ${ya}`;
  if (ya === yb) return `${ma} – ${mb} ${ya}`;
  return `${ma} ${ya} – ${mb} ${yb}`;
}
