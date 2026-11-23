/**
 * Dashboard v2 insights model (PROTOTYPE). Pure functions only: no Date.now(),
 * no Math.random(). `deriveInsights()` builds the `DashboardInsights` contract
 * (insights.types.ts) that the dashboard organisms read.
 *
 * Two modes, mirroring the trend in useDashboard:
 *   own === true  (trial / pay-as-you-go): honest figures from the org's own
 *                 non-sample reviews in the period. Empty data -> zeros / empty lists.
 *                 Where findings aren't loaded, each review's openFindings are
 *                 spread deterministically across categories / severities / decisions
 *                 (fallbackItems) so every block agrees with the issue count.
 *   own === false (seeded demo / invoiced): a deterministic, plausible dataset
 *                 scaled to `completed` (the period's trend total). Seeded by the
 *                 period, never random, so it is stable across renders.
 *
 * `needsYou` is always LIVE (never period-scoped) and always real.
 */
import { isOverdue } from "@/lib/review-lifecycle";
import {
  isProcessed,
  MATH_CHECKS_PER_ADMIN,
  MATH_CHECKS_PER_TECHNICAL,
} from "@/components/organisms/value/value-model";
import type { DateRange, Period } from "@/components/molecules";
import type { Disposition, Finding, Review, ReviewType, Severity } from "@/types";
import type {
  Agreement,
  CategoryRow,
  DashboardInsights,
  FirmRow,
  IssueSeverity,
  NeedsYou,
  RiskLevel,
  RiskRow,
  ValueBand,
} from "./insights.types";

const DAY = 86400000;

/* ================= Constants (exported for the UI) ================= */

/**
 * Reviewer hours saved per processed review, by review type.
 * placeholder — Ed to confirm; realwired.com claims 15 min–1 h per administrative review.
 */
export const HOURS_SAVED_PER_REVIEW: Record<ReviewType, number> = {
  technical: 2.0,
  administrative: 0.5,
};

/** The engine's six issue categories, in display order. */
export const CATEGORY_ORDER = [
  "Valuation",
  "USPAP Compliance",
  "Property Analysis",
  "FIRREA",
  "Documentation",
  "Methodology",
] as const;
export type EngineCategory = (typeof CATEGORY_ORDER)[number];

/**
 * Finding.category (checklist wording) -> engine category. Unknown categories
 * fall back by keyword, then to "Documentation" (see `toEngineCategory`).
 */
export const CATEGORY_MAP: Record<string, EngineCategory> = {
  "Valuation Analysis": "Valuation",
  "Mathematical Accuracy": "Valuation", // math errors move the value conclusion
  Reconciliation: "Valuation",
  "Income Approach": "Methodology",
  "Cost Approach": "Methodology",
  "Sales Comparison Approach": "Methodology",
  "Highest & Best Use": "Property Analysis",
  "Site Analysis": "Property Analysis",
  "Market Analysis": "Property Analysis",
  Improvements: "Property Analysis",
  "USPAP Compliance": "USPAP Compliance",
  "Scope of Work": "USPAP Compliance",
  Certification: "USPAP Compliance",
  "Bank Policy": "FIRREA", // lender policy = Interagency Guidelines / FIRREA requirements
  "Interagency Guidelines": "FIRREA",
  Exhibits: "Documentation",
  Addenda: "Documentation",
  "Reviewer Note": "Documentation",
};

/** Normalised property types, in display order. */
export const PROPERTY_TYPE_ORDER = [
  "Office",
  "Multifamily",
  "Industrial",
  "Retail",
  "Hospitality",
  "Other",
] as const;
export type PropertyTypeGroup = (typeof PROPERTY_TYPE_ORDER)[number];

/** Engine severity <- Parachute severity. pass / na are not issues. */
export const SEVERITY_MAP: Partial<Record<Severity, IssueSeverity>> = {
  crit: "critical",
  fail: "high",
  flag: "medium",
};

/** Firm names used only when the org's reviews carry fewer than 6 distinct firms. */
const FALLBACK_FIRMS = [
  "Hudson Valuation Advisors LLC",
  "Apex Appraisal Partners",
  "Cornerstone Valuation Group",
  "Pinnacle Appraisal Co.",
  "Beacon Realty Advisors",
  "Coastal Appraisal Co.",
];

/* ================= Helpers ================= */

export function toEngineCategory(category: string): EngineCategory {
  const hit = CATEGORY_MAP[category];
  if (hit) return hit;
  const c = category.toLowerCase();
  if (c.includes("uspap")) return "USPAP Compliance";
  if (c.includes("firrea") || c.includes("policy")) return "FIRREA";
  if (c.includes("approach") || c.includes("method")) return "Methodology";
  if (c.includes("valu") || c.includes("math")) return "Valuation";
  if (c.includes("property") || c.includes("site") || c.includes("use")) return "Property Analysis";
  return "Documentation";
}

export function toPropertyType(propertyType: string): PropertyTypeGroup {
  const p = propertyType.toLowerCase();
  if (p.startsWith("office")) return "Office";
  if (p.startsWith("multifamily") || p.includes("apartment")) return "Multifamily";
  if (p.startsWith("industrial") || p.includes("warehouse")) return "Industrial";
  if (p.startsWith("retail")) return "Retail";
  if (p.startsWith("hospitality") || p.includes("hotel")) return "Hospitality";
  return "Other";
}

/** The period's time window, matching the buckets the dashboard trend uses. */
export function periodWindow(period: Period, range: DateRange | null, now: number): { lo: number; hi: number } {
  if (period === "custom" && range) return { lo: range.start, hi: Math.max(range.end, range.start + DAY) };
  const span =
    period === "week" ? 7 * DAY : period === "month" ? 35 * DAY : period === "quarter" ? 91 * DAY : 360 * DAY;
  return { lo: now - span, hi: now };
}

/** Deterministic 0..1 from a string (FNV-1a). */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Split `total` across `weights` with integer counts that sum exactly to `total`. */
function allocate(total: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((s, w) => s + w, 0) || 1;
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map(Math.floor);
  let rest = total - out.reduce((s, n) => s + n, 0);
  const order = raw.map((v, i) => ({ i, f: v - Math.floor(v) })).sort((a, b) => b.f - a.f || a.i - b.i);
  for (let k = 0; rest > 0; k = (k + 1) % order.length, rest--) out[order[k].i]++;
  return out;
}

/* ================= A. Needs you (live, real) ================= */

export function deriveNeedsYou(reviews: readonly Review[], now: number): NeedsYou {
  const waitingSet = reviews.filter(
    (r) => r.status === "in_review" || r.status === "autorejected" || isOverdue(r, now),
  );
  const overdue = waitingSet.filter((r) => isOverdue(r, now)).length;
  const newFromYc = reviews.filter((r) => r.status === "intake" && r.source === "yc").length;
  const urgent = [...waitingSet]
    .sort((a, b) => {
      const oa = isOverdue(a, now) ? 0 : 1;
      const ob = isOverdue(b, now) ? 0 : 1;
      return oa - ob || a.slaDueAt - b.slaDueAt;
    })
    .slice(0, 5)
    .map((review) => ({ review, worst: review.worstSeverity, dueInMs: review.slaDueAt - now }));
  return { waiting: waitingSet.length, overdue, newFromYc, urgent };
}

/* ================= Input ================= */

export interface InsightsInput {
  /** The org's non-sample reviews. */
  reviews: readonly Review[];
  /** Findings, where loaded. Reviews without findings fall back to Review.openFindings / worstSeverity. */
  findings?: readonly Finding[];
  /** Reviewer dispositions keyed by finding id (drives Agreement). */
  findingStates?: Record<string, { disposition: Disposition }>;
  own: boolean;
  period: Period;
  range: DateRange | null;
  now: number;
  /** trend.completed from useDashboard (the period's completed total). */
  completed: number;
  /** trend.prev.completed, so the delta matches the trend chart. Optional. */
  prevCompleted?: number;
}

const SOURCES: DashboardInsights["sources"] = {
  needsYou: "app",
  completed: "engine",
  hoursSaved: "estimate",
  checks: "engine",
  issues: "engine",
  categories: "engine",
  // The firm is already on the review in the prototype; in production the real
  // dependency is YouConnect carrying the appraisal firm through to Parachute.
  firms: "app",
  agreement: "app",
  risk: "estimate",
};

export function deriveInsights(input: InsightsInput): DashboardInsights {
  const needsYou = deriveNeedsYou(input.reviews, input.now);
  const rest = input.own ? deriveOwn(input) : deriveDemo(input);
  return { needsYou, ...rest, sources: SOURCES };
}

type PeriodScoped = Omit<DashboardInsights, "needsYou" | "sources">;

/* ================= Own mode ================= */

/**
 * Fallback category mix for reviews whose findings aren't loaded: spread
 * Review.openFindings across the engine categories, weighted toward the three
 * the engine raises most. Deterministic (hash of review id + index).
 */
const FALLBACK_CATEGORY_WEIGHT: Record<EngineCategory, number> = {
  Valuation: 0.26,
  "USPAP Compliance": 0.2,
  "Property Analysis": 0.2,
  Methodology: 0.14,
  Documentation: 0.12,
  FIRREA: 0.08,
};
/** Reviewer decision split assumed for decided fallback issues (concurred, edited, rejected). */
const FALLBACK_AGREEMENT: [number, number, number] = [0.78, 0.14, 0.08];
/** Share of engine checks that correct a figure (own orgs, estimate). */
const CHECKS_CORRECTED_RATE = 0.03;

type Decision = "concurred" | "edited" | "rejected";
interface IssueItem {
  reviewId: string;
  category: EngineCategory;
  ch: boolean;
  decision: Decision | null;
}

function pickCategory(key: string): EngineCategory {
  const x = hash01(key);
  let acc = 0;
  for (const c of CATEGORY_ORDER) {
    acc += FALLBACK_CATEGORY_WEIGHT[c];
    if (x < acc) return c;
  }
  return "Valuation";
}

/** Synthesized issues for one review from its counters (no findings loaded). */
function fallbackItems(r: Review): IssueItem[] {
  const worst = r.worstSeverity ? SEVERITY_MAP[r.worstSeverity] : undefined;
  return Array.from({ length: Math.max(0, r.openFindings) }, (_, i) => {
    // Issue 0 carries the review's worst severity; the rest are medium / low.
    const sev: IssueSeverity =
      i === 0 ? (worst ?? "medium") : hash01(`${r.id}:sev:${i}`) < 0.5 ? "medium" : "low";
    return {
      reviewId: r.id,
      category: pickCategory(`${r.id}:cat:${i}`),
      ch: sev === "critical" || sev === "high",
      decision: null,
    };
  });
}

/** Most frequent category (ties -> CATEGORY_ORDER), or null when empty. */
function topOf(cats: readonly EngineCategory[]): EngineCategory | null {
  let best: EngineCategory | null = null;
  let bestN = 0;
  for (const c of CATEGORY_ORDER) {
    const n = cats.filter((x) => x === c).length;
    if (n > bestN) {
      best = c;
      bestN = n;
    }
  }
  return best;
}

function deriveOwn(input: InsightsInput): PeriodScoped {
  const { lo, hi } = periodWindow(input.period, input.range, input.now);
  const done = input.reviews.filter((r) => isProcessed(r) && r.orderedAt > lo && r.orderedAt <= hi);
  const doneIds = new Set(done.map((r) => r.id));
  const isCH = (s: Severity) => s === "crit" || s === "fail";

  // Issue-level findings (pass / na are not issues), grouped by review.
  const issueFindings = (input.findings ?? []).filter(
    (f) => doneIds.has(f.reviewId) && SEVERITY_MAP[f.severity] !== undefined,
  );
  const byReview = new Map<string, Finding[]>();
  for (const f of issueFindings) {
    const list = byReview.get(f.reviewId) ?? [];
    list.push(f);
    byReview.set(f.reviewId, list);
  }

  // One list of issues: real findings where loaded, synthesized from the review's
  // counters otherwise, so categories / firms / agreement agree with `issues`.
  const states = input.findingStates ?? {};
  const toDecision = (d: Disposition | undefined): Decision | null =>
    d === "accepted"
      ? "concurred"
      : d === "edited"
        ? "edited"
        : d === "rejected" || d === "removed"
          ? "rejected"
          : null;
  const items: IssueItem[] = [];
  const fallbackDecided: IssueItem[] = [];
  for (const r of done) {
    const fs = byReview.get(r.id);
    if (fs) {
      for (const f of fs) {
        items.push({
          reviewId: r.id,
          category: toEngineCategory(f.category),
          ch: isCH(f.severity),
          decision: toDecision(states[f.id]?.disposition),
        });
      }
    } else {
      const synth = fallbackItems(r);
      items.push(...synth);
      // Completed / returned: every issue was decided. in_review: the reviewer is part-way
      // through, so roughly the first half of its issues already carry a decision (Val, 21 Nov:
      // a trial org's first review is usually still open, and an empty card reads as broken).
      if (r.status === "completed" || r.status === "returned") fallbackDecided.push(...synth);
      else if (r.status === "in_review") fallbackDecided.push(...synth.slice(0, Math.ceil(synth.length / 2)));
    }
  }
  // Decide the fallback issues at ~78 / 14 / 8, in a deterministic hashed order.
  const [nc, ne] = allocate(fallbackDecided.length, FALLBACK_AGREEMENT);
  fallbackDecided
    .map((it, i) => ({ it, k: hash01(`${it.reviewId}:dec:${i}`) }))
    .sort((a, b) => a.k - b.k)
    .forEach(({ it }, i) => {
      it.decision = i < nc ? "concurred" : i < nc + ne ? "edited" : "rejected";
    });

  const issues = items.length;
  const issuesCriticalHigh = items.filter((x) => x.ch).length;
  const hoursSaved = r1(
    done.reduce((s, r) => s + r.reviewTypes.reduce((t, k) => t + (HOURS_SAVED_PER_REVIEW[k] ?? 0), 0), 0),
  );
  const checksRun = done.reduce(
    (s, r) =>
      s + r.reviewTypes.reduce((t, k) => t + (k === "technical" ? MATH_CHECKS_PER_TECHNICAL : MATH_CHECKS_PER_ADMIN), 0),
    0,
  );
  const corrected = Math.max(
    issueFindings.filter((f) => f.auditTag === "CORRECTED").length,
    Math.round(checksRun * CHECKS_CORRECTED_RATE),
  );
  const checksCorrected = checksRun > 0 && issues > 0 ? Math.max(1, corrected) : corrected;

  const value: ValueBand = {
    completed: input.completed,
    completedDelta: null, // no history for an org's own data yet
    hoursSaved,
    hoursPerReview: done.length ? r1(hoursSaved / done.length) : 0,
    checksRun,
    checksCorrected,
    issues,
    issuesCriticalHigh,
    issuesPerReport: done.length ? r1(issues / done.length) : 0,
  };

  // Categories.
  const cat = new Map<EngineCategory, CategoryRow>();
  for (const x of items) {
    const row = cat.get(x.category) ?? { category: x.category, total: 0, criticalHigh: 0 };
    row.total++;
    if (x.ch) row.criticalHigh++;
    cat.set(x.category, row);
  }
  const categories = sortCategories([...cat.values()]);

  // Firms.
  const itemsByReview = new Map<string, IssueItem[]>();
  for (const x of items) {
    const list = itemsByReview.get(x.reviewId) ?? [];
    list.push(x);
    itemsByReview.set(x.reviewId, list);
  }
  const firmMap = new Map<string, Review[]>();
  for (const r of done) {
    const list = firmMap.get(r.appraisalFirm) ?? [];
    list.push(r);
    firmMap.set(r.appraisalFirm, list);
  }
  const firms: FirmRow[] = [...firmMap.entries()]
    .map(([firm, rs]) => {
      const its = rs.flatMap((r) => itemsByReview.get(r.id) ?? []);
      return {
        firm,
        reports: rs.length,
        issuesPerReport: r1(its.length / rs.length),
        returnedRate: r2(rs.filter((r) => r.status === "returned").length / rs.length),
        trend: "same" as const, // no history yet
        topCategory: topOf(its.map((x) => x.category)) ?? "", // "" = firm had no issues
      };
    })
    .sort((a, b) => b.issuesPerReport - a.issuesPerReport || b.reports - a.reports)
    .slice(0, 6);

  // Agreement.
  const decided = items.filter((x) => x.decision !== null);
  const count = (d: Decision) => decided.filter((x) => x.decision === d).length;
  const decisions = decided.length;
  const agreement: Agreement = decisions
    ? {
        concurred: count("concurred") / decisions,
        edited: count("edited") / decisions,
        rejected: count("rejected") / decisions,
        decisions,
        mostRejectedCategory: topOf(decided.filter((x) => x.decision === "rejected").map((x) => x.category)),
      }
    : { concurred: 0, edited: 0, rejected: 0, decisions: 0, mostRejectedCategory: null };

  // Risk by property type (null riskRating skipped).
  const riskMap = new Map<PropertyTypeGroup, RiskRow>();
  for (const r of done) {
    if (!r.riskRating) continue;
    const t = toPropertyType(r.propertyType);
    const row = riskMap.get(t) ?? { propertyType: t, reports: 0, low: 0, moderate: 0, elevated: 0 };
    row.reports++;
    row[r.riskRating satisfies RiskLevel]++;
    riskMap.set(t, row);
  }
  const risk = sortRisk([...riskMap.values()]);

  return { value, categories, firms, agreement, risk };
}

function sortCategories(rows: CategoryRow[]): CategoryRow[] {
  const idx = (c: string) => CATEGORY_ORDER.indexOf(c as EngineCategory);
  return rows.sort((a, b) => b.total - a.total || idx(a.category) - idx(b.category)).slice(0, 6);
}

function sortRisk(rows: RiskRow[]): RiskRow[] {
  const idx = (t: string) => PROPERTY_TYPE_ORDER.indexOf(t as PropertyTypeGroup);
  return rows.sort((a, b) => b.reports - a.reports || idx(a.propertyType) - idx(b.propertyType)).slice(0, 6);
}

/* ================= Demo mode (deterministic synthesis) ================= */

/** Share of issues per category; Valuation always largest. */
const DEMO_CATEGORY_WEIGHT: Record<EngineCategory, number> = {
  Valuation: 0.3,
  Methodology: 0.2,
  "USPAP Compliance": 0.17,
  "Property Analysis": 0.14,
  Documentation: 0.11,
  FIRREA: 0.08,
};
/** Critical+high share within each category (overall ≈ 39%). */
const DEMO_CH_RATE: Record<EngineCategory, number> = {
  Valuation: 0.48,
  Methodology: 0.35,
  "USPAP Compliance": 0.4,
  "Property Analysis": 0.32,
  Documentation: 0.2,
  FIRREA: 0.5,
};
/** Firm profiles, worst to best. */
const DEMO_FIRM_PROFILE: { weight: number; ipr: number; returned: number; trend: FirmRow["trend"]; top: EngineCategory }[] = [
  { weight: 0.22, ipr: 3.1, returned: 0.35, trend: "worse", top: "Valuation" },
  { weight: 0.2, ipr: 2.6, returned: 0.2, trend: "worse", top: "Methodology" },
  { weight: 0.18, ipr: 2.2, returned: 0.12, trend: "same", top: "USPAP Compliance" },
  { weight: 0.16, ipr: 1.8, returned: 0.08, trend: "better", top: "Valuation" },
  { weight: 0.14, ipr: 1.2, returned: 0.05, trend: "better", top: "Property Analysis" },
  { weight: 0.1, ipr: 0.4, returned: 0, trend: "same", top: "Documentation" },
];
/** Property-type mix and risk split (low, moderate, elevated). */
const DEMO_RISK: { type: PropertyTypeGroup; weight: number; split: [number, number, number] }[] = [
  { type: "Office", weight: 0.26, split: [0.45, 0.35, 0.2] },
  { type: "Multifamily", weight: 0.24, split: [0.65, 0.3, 0.05] },
  { type: "Industrial", weight: 0.2, split: [0.7, 0.25, 0.05] },
  { type: "Retail", weight: 0.18, split: [0.4, 0.4, 0.2] },
  { type: "Hospitality", weight: 0.12, split: [0.35, 0.4, 0.25] },
];
/** Demo assumption: every review is technical, 80% also ordered administrative. */
const DEMO_ADMIN_SHARE = 0.8;

function deriveDemo(input: InsightsInput): PeriodScoped {
  const c = Math.max(0, Math.round(input.completed));
  const seed = input.period === "custom" && input.range ? `custom:${input.range.start}:${input.range.end}` : input.period;
  const h = (k: string) => hash01(`${seed}|${k}`);

  // Categories -> issues (so totals agree exactly).
  const ipr = 2.0 + 0.3 * h("ipr");
  const issues = Math.round(c * ipr);
  const catWeights = CATEGORY_ORDER.map(
    (k) => DEMO_CATEGORY_WEIGHT[k] * (k === "Valuation" ? 1 : 1 + 0.15 * (h(`cat:${k}`) - 0.5)),
  );
  const totals = allocate(issues, catWeights);
  const categories = sortCategories(
    CATEGORY_ORDER.map((k, i) => ({
      category: k,
      total: totals[i],
      criticalHigh: Math.min(totals[i], Math.round(totals[i] * DEMO_CH_RATE[k])),
    })).filter((r) => r.total > 0),
  );
  const issuesCriticalHigh = categories.reduce((s, r) => s + r.criticalHigh, 0);

  const hoursSaved = r1(c * (HOURS_SAVED_PER_REVIEW.technical + DEMO_ADMIN_SHARE * HOURS_SAVED_PER_REVIEW.administrative));
  const checksRun = Math.round(c * (27 + 2 * h("checks")));
  const checksCorrected = Math.round(checksRun * (0.02 + 0.01 * h("corrected")));
  const completedDelta =
    input.prevCompleted && input.prevCompleted > 0
      ? r2((c - input.prevCompleted) / input.prevCompleted)
      : r2(0.08 + 0.04 * h("delta"));

  const value: ValueBand = {
    completed: c,
    completedDelta: c ? completedDelta : null,
    hoursSaved,
    hoursPerReview: c ? r1(hoursSaved / c) : 0,
    checksRun,
    checksCorrected,
    issues,
    issuesCriticalHigh,
    issuesPerReport: c ? r1(issues / c) : 0,
  };

  // Firms: names from the org's own reviews so they match the queue.
  const names = [...new Set(input.reviews.filter((r) => !r.sample).map((r) => r.appraisalFirm))];
  for (const f of FALLBACK_FIRMS) if (names.length < 6 && !names.includes(f)) names.push(f);
  const reports = allocate(c, DEMO_FIRM_PROFILE.map((p) => p.weight));
  const firms: FirmRow[] = DEMO_FIRM_PROFILE.map((p, i) => ({
    firm: names[i],
    reports: reports[i],
    issuesPerReport: r1(Math.max(0, p.ipr + 0.2 * (h(`firm:${i}`) - 0.5))),
    returnedRate: p.returned === 0 ? 0 : r2(p.returned + 0.04 * (h(`ret:${i}`) - 0.5)),
    trend: p.trend,
    topCategory: p.top,
  }))
    .filter((f) => f.reports > 0)
    .sort((a, b) => b.issuesPerReport - a.issuesPerReport);

  // Agreement ≈ 78 / 14 / 8.
  const concurred = 0.78 + 0.03 * (h("agree") - 0.5);
  const edited = 0.14 + 0.02 * (h("edit") - 0.5);
  const agreement: Agreement = issues
    ? {
        concurred: r2(concurred),
        edited: r2(edited),
        rejected: r2(1 - r2(concurred) - r2(edited)),
        decisions: issues,
        mostRejectedCategory: "Valuation",
      }
    : { concurred: 0, edited: 0, rejected: 0, decisions: 0, mostRejectedCategory: null };

  // Risk across 5 property types.
  const typeCounts = allocate(c, DEMO_RISK.map((r) => r.weight));
  const risk = sortRisk(
    DEMO_RISK.map((t, i) => {
      const [low, moderate, elevated] = allocate(typeCounts[i], t.split);
      return { propertyType: t.type, reports: typeCounts[i], low, moderate, elevated };
    }).filter((r) => r.reports > 0),
  );

  return { value, categories, firms, agreement, risk };
}
