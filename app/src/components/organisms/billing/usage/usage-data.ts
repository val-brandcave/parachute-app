import { CREDIT_USD, REVIEW_TYPE_COST } from "@/lib/pricing";
import type { CreditLedgerEntry, CreditSource, Review, ReviewType } from "@/types";
import { DEMO_TODAY, invoicedReviews, rebasedDate, shortName, sourceLabel, type UserName } from "../billing-data";

/**
 * Everything the Usage tab and the Overview chart need, as pure functions over the ledger (wallet orgs)
 * or the reviews (invoiced orgs). One "line" = one review type of one review, so a Technical + Admin
 * review is two lines of one credit each. Nothing here reads the clock: "today" is derived from the data.
 */

export type UsageSource = CreditSource | "invoiced";
export type UsageGroupBy = "type" | "person" | "source";
export type UsagePeriod = "30d" | "90d" | "12m";

export interface UsageLine {
  id: string;
  at: number;
  credits: number;
  type: ReviewType;
  personId: string;
  source: UsageSource;
  /** Distinct per review (loan number or review id), so reviews can be counted. */
  reviewKey: string;
}

export const DAY = 86_400_000;

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

/* ------------------------------------------------------------------ lines */

export function buildUsageLines(
  ledger: readonly CreditLedgerEntry[],
  reviews: readonly Review[],
  invoiced: boolean,
): UsageLine[] {
  if (invoiced) {
    const list = invoicedReviews(reviews);
    return list.flatMap((r) =>
      r.reviewTypes.map((t): UsageLine => ({
        id: `${r.id}-${t}`,
        at: rebasedDate(r, list),
        credits: REVIEW_TYPE_COST[t] ?? 1,
        type: t,
        personId: r.assigneeId ?? "system",
        source: "invoiced",
        reviewKey: r.id,
      })),
    );
  }

  // A debit that was refunded in full (failed on our side) is not usage: drop it and its refund.
  const refunded = new Set(ledger.filter((e) => e.kind === "refund" && e.loanNo).map((e) => e.loanNo));
  const sorted = [...ledger].sort((a, b) => a.createdAt - b.createdAt);
  const pool: Record<CreditSource, number> = { trial: 0, earned: 0, purchased: 0 };
  const out: UsageLine[] = [];
  for (const e of sorted) {
    if (e.kind === "trial_grant") pool.trial += e.credits;
    else if (e.kind === "earned") pool.earned += e.credits;
    else if (e.kind === "debit" || e.kind === "rescan") {
      if (e.loanNo && refunded.has(e.loanNo)) continue;
      const types: ReviewType[] = e.reviewTypes?.length ? e.reviewTypes : ["technical"];
      const per = Math.abs(e.credits) / types.length;
      types.forEach((t, i) => {
        const source: CreditSource = (["trial", "earned"] as const).find((s) => pool[s] >= per) ?? "purchased";
        pool[source] -= per;
        out.push({ id: `${e.id}-${i}`, at: e.createdAt, credits: per, type: t, personId: e.actorId, source, reviewKey: e.loanNo ?? e.id });
      });
    } else if (e.kind === "refund" && e.loanNo && refunded.has(e.loanNo) && sorted.some((d) => d.kind === "debit" && d.loanNo === e.loanNo)) {
      // The refund of a failed run: its debit was skipped above, so nothing moves.
    } else pool.purchased += e.credits;
  }
  return out;
}

/** The end of "today" (exclusive): the demo's today, or the newest thing on the ledger if that is later. */
export function usageAnchor(lines: readonly UsageLine[], ledger: readonly CreditLedgerEntry[]): number {
  const newest = Math.max(DEMO_TODAY, ...lines.map((l) => l.at), ...ledger.map((e) => e.createdAt));
  return startOfDay(newest) + DAY;
}

/* ---------------------------------------------------------------- windows */

export interface Bucket {
  start: number;
  end: number;
  /** x-axis label */
  label: string;
  /** tooltip heading */
  long: string;
}
export interface UsageWindow {
  period: UsagePeriod;
  from: number;
  to: number;
  prevFrom: number;
  prevTo: number;
  buckets: Bucket[];
  /** "last 30 days" */
  phrase: string;
}

const fmt = (ts: number, o: Intl.DateTimeFormatOptions) => new Date(ts).toLocaleDateString("en-GB", o);

export function windowFor(period: UsagePeriod, anchorEnd: number): UsageWindow {
  if (period === "30d") {
    const buckets = Array.from({ length: 30 }, (_, i): Bucket => {
      const start = anchorEnd - (30 - i) * DAY;
      return { start, end: start + DAY, label: fmt(start, { day: "numeric", month: "short" }), long: fmt(start, { weekday: "short", day: "numeric", month: "short" }) };
    });
    const from = anchorEnd - 30 * DAY;
    return { period, from, to: anchorEnd, prevFrom: from - 30 * DAY, prevTo: from, buckets, phrase: "last 30 days" };
  }
  if (period === "90d") {
    const buckets = Array.from({ length: 13 }, (_, i): Bucket => {
      const start = anchorEnd - (13 - i) * 7 * DAY;
      const end = start + 7 * DAY;
      return {
        start,
        end,
        label: fmt(start, { day: "numeric", month: "short" }),
        long: `${fmt(start, { day: "numeric", month: "short" })} to ${fmt(end - DAY, { day: "numeric", month: "short" })}`,
      };
    });
    const from = anchorEnd - 91 * DAY;
    return { period, from, to: anchorEnd, prevFrom: from - 91 * DAY, prevTo: from, buckets, phrase: "last 13 weeks" };
  }
  const last = new Date(anchorEnd - 1);
  const buckets = Array.from({ length: 12 }, (_, i): Bucket => {
    const start = new Date(last.getFullYear(), last.getMonth() - (11 - i), 1).getTime();
    const end = Math.min(new Date(last.getFullYear(), last.getMonth() - (10 - i), 1).getTime(), anchorEnd);
    return { start, end, label: fmt(start, { month: "short" }), long: fmt(start, { month: "long", year: "numeric" }) };
  });
  const from = buckets[0].start;
  const prevFrom = new Date(last.getFullYear(), last.getMonth() - 23, 1).getTime();
  return { period, from, to: anchorEnd, prevFrom, prevTo: from, buckets, phrase: "last 12 months" };
}

export const PERIOD_OPTIONS: { value: UsagePeriod; label: string }[] = [
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "12m", label: "12 months" },
];

/* ----------------------------------------------------------------- groups */

export interface GroupDef {
  key: string;
  label: string;
  /** Index into the chart palette (0 to 4). */
  tone: number;
}

const TYPE_GROUPS: GroupDef[] = [
  { key: "technical", label: "Technical", tone: 0 },
  { key: "administrative", label: "Administrative", tone: 1 },
];
const SOURCE_GROUPS: GroupDef[] = [
  { key: "trial", label: "Trial", tone: 2 },
  { key: "earned", label: "Earned", tone: 1 },
  { key: "purchased", label: "Purchased", tone: 0 },
];
export const OTHERS_KEY = "others";

export function keyOf(by: UsageGroupBy, l: UsageLine, personKeys?: ReadonlySet<string>): string {
  if (by === "type") return l.type;
  if (by === "source") return l.source === "invoiced" ? "purchased" : l.source;
  return personKeys && !personKeys.has(l.personId) ? OTHERS_KEY : l.personId;
}

/** People ranked by credits in a set of lines, biggest first. */
export function rankPeople(lines: readonly UsageLine[]): { id: string; credits: number }[] {
  const m = new Map<string, number>();
  for (const l of lines) m.set(l.personId, (m.get(l.personId) ?? 0) + l.credits);
  return [...m.entries()].map(([id, credits]) => ({ id, credits })).sort((a, b) => b.credits - a.credits);
}

const MAX_PEOPLE_SERIES = 4;

/** Series for the chart: every group with usage in the window, bottom of the stack first. */
export function chartGroups(by: UsageGroupBy, lines: readonly UsageLine[], userName: UserName): { groups: GroupDef[]; personKeys?: Set<string> } {
  if (by === "type") return { groups: TYPE_GROUPS.filter((g) => lines.some((l) => l.type === g.key)) };
  if (by === "source") return { groups: SOURCE_GROUPS.filter((g) => lines.some((l) => keyOf("source", l) === g.key)) };
  const ranked = rankPeople(lines);
  const top = ranked.slice(0, MAX_PEOPLE_SERIES);
  const groups: GroupDef[] = top.map((p, i) => ({ key: p.id, label: shortName(userName(p.id)), tone: i }));
  if (ranked.length > top.length) groups.push({ key: OTHERS_KEY, label: "Others", tone: 4 });
  return { groups, personKeys: new Set(top.map((p) => p.id)) };
}

/** Every group for the table (people are not merged there). */
export function tableGroups(by: UsageGroupBy, lines: readonly UsageLine[], prev: readonly UsageLine[], userName: UserName, fullName = true): GroupDef[] {
  if (by === "type") return TYPE_GROUPS;
  if (by === "source") return SOURCE_GROUPS;
  const ranked = rankPeople([...lines, ...prev]);
  const topIds = rankPeople(lines).slice(0, MAX_PEOPLE_SERIES).map((p) => p.id);
  return ranked.map((p) => {
    const i = topIds.indexOf(p.id);
    return { key: p.id, label: (fullName ? userName(p.id) : shortName(userName(p.id))) ?? "Unknown", tone: i === -1 ? 4 : i };
  });
}

/* ------------------------------------------------------------- aggregates */

export const isPaid = (l: UsageLine) => l.source === "purchased" || l.source === "invoiced";
export const usdOf = (lines: readonly UsageLine[]) => lines.filter(isPaid).reduce((s, l) => s + l.credits * CREDIT_USD, 0);
export const creditsOf = (lines: readonly UsageLine[]) => lines.reduce((s, l) => s + l.credits, 0);
export const reviewsOf = (lines: readonly UsageLine[]) => new Set(lines.map((l) => l.reviewKey)).size;
export const within = (lines: readonly UsageLine[], from: number, to: number) => lines.filter((l) => l.at >= from && l.at < to);

export interface StackColumn {
  bucket: Bucket;
  /** credits per group, in `groups` order */
  values: number[];
  total: number;
  /** dollars of the paid credits in the column */
  usd: number;
}

export function stackColumns(lines: readonly UsageLine[], w: UsageWindow, by: UsageGroupBy, groups: readonly GroupDef[], personKeys?: ReadonlySet<string>): StackColumn[] {
  const idx = new Map(groups.map((g, i) => [g.key, i]));
  const cols: StackColumn[] = w.buckets.map((bucket) => ({ bucket, values: groups.map(() => 0), total: 0, usd: 0 }));
  for (const l of lines) {
    if (l.at < w.from || l.at >= w.to) continue;
    const gi = idx.get(keyOf(by, l, personKeys));
    if (gi === undefined) continue;
    // buckets are contiguous, so the column is a direct index for days and weeks and a search for months
    const col = cols.find((c) => l.at >= c.bucket.start && l.at < c.bucket.end);
    if (!col) continue;
    col.values[gi] += l.credits;
    col.total += l.credits;
    if (isPaid(l)) col.usd += l.credits * CREDIT_USD;
  }
  return cols;
}

/** Running totals per group over the last 30 days, plus the same-pace projection for the next 30. */
export interface CumulativeData {
  /** One entry per day: cumulative credits per group. */
  days: { bucket: Bucket; values: number[]; total: number; usd: number }[];
  total: number;
  pacePerDay: number;
  projectedEnd: number;
}

export function cumulative(columns: readonly StackColumn[]): CumulativeData {
  const acc: number[] = columns[0]?.values.map(() => 0) ?? [];
  let usd = 0;
  const days = columns.map((c) => {
    c.values.forEach((v, i) => (acc[i] += v));
    usd += c.usd;
    return { bucket: c.bucket, values: [...acc], total: acc.reduce((s, v) => s + v, 0), usd };
  });
  const total = days.at(-1)?.total ?? 0;
  const pacePerDay = total / Math.max(1, days.length);
  return { days, total, pacePerDay, projectedEnd: Math.round(total + pacePerDay * 30) };
}

/** A tidy axis: a max and a step that give 3 to 5 gridlines. */
export function niceAxis(max: number): { max: number; step: number } {
  if (max <= 4) return { max: 4, step: 1 };
  const rough = max / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const f = rough / pow;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
  const s = Math.max(1, step);
  return { max: Math.ceil(max / s) * s, step: s };
}

/* ----------------------------------------------------------------- facts */

export interface Delta {
  /** Percentage change, or null when there is nothing to compare against. */
  pct: number | null;
  /** True when the earlier period was zero and this one is not. */
  isNew: boolean;
}
export function deltaOf(cur: number, prev: number): Delta {
  if (prev === 0) return { pct: null, isNew: cur > 0 };
  return { pct: Math.round(((cur - prev) / prev) * 100), isNew: false };
}

/** The previous period is only worth comparing to when the history reaches back across most of it. */
export function comparableDelta(lines: readonly UsageLine[], w: UsageWindow, cur: number, prev: number): Delta {
  const first = Math.min(...lines.map((l) => l.at));
  if (prev > 0 && first > w.prevFrom + 14 * DAY) return { pct: null, isNew: false };
  return deltaOf(cur, prev);
}

export interface Facts {
  used: number;
  prevUsed: number;
  reviews: number;
  prevReviews: number;
  avg: number;
  prevAvg: number;
  /** Dollars bought in the window (wallet orgs) or billed (invoiced). */
  spent: number;
  prevSpent: number;
}

export function factsFor(lines: readonly UsageLine[], ledger: readonly CreditLedgerEntry[], anchorEnd: number, scope?: { personId: string }): Facts {
  const from = anchorEnd - 30 * DAY;
  const prevFrom = from - 30 * DAY;
  const mine = scope ? lines.filter((l) => l.personId === scope.personId) : lines;
  const cur = within(mine, from, anchorEnd);
  const prev = within(mine, prevFrom, from);
  const bought = (a: number, b: number) =>
    ledger.filter((e) => e.kind === "purchase" && e.createdAt >= a && e.createdAt < b).reduce((s, e) => s + (e.amountUsd ?? 0), 0);
  const used = creditsOf(cur);
  const prevUsed = creditsOf(prev);
  const reviews = reviewsOf(cur);
  const prevReviews = reviewsOf(prev);
  return {
    used,
    prevUsed,
    reviews,
    prevReviews,
    avg: reviews ? used / reviews : 0,
    prevAvg: prevReviews ? prevUsed / prevReviews : 0,
    spent: ledger.length ? bought(from, anchorEnd) : usdOf(cur),
    prevSpent: ledger.length ? bought(prevFrom, from) : usdOf(prev),
  };
}

export interface Runway {
  pacePerDay: number;
  /** Days the balance lasts at that pace, or null when there is no usage to go on. */
  days: number | null;
  runsOut: number | null;
}
export function runwayFor(balance: number, lines: readonly UsageLine[], anchorEnd: number): Runway {
  const used = creditsOf(within(lines, anchorEnd - 30 * DAY, anchorEnd));
  const pacePerDay = used / 30;
  if (pacePerDay <= 0) return { pacePerDay: 0, days: null, runsOut: null };
  const days = balance / pacePerDay;
  return { pacePerDay, days, runsOut: anchorEnd - DAY + Math.ceil(days) * DAY };
}

/* --------------------------------------------------------------- display */

export const credits = (n: number) => `${Math.round(n * 10) / 10}`;
export const sourceName = sourceLabel;
