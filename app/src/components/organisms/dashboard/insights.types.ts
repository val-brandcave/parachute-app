/**
 * Dashboard v2 data contract (PROTOTYPE).
 *
 * The dashboard answers three questions, top to bottom:
 *   A. What needs me now?            -> NeedsYou
 *   B. What did Parachute do for us? -> ValueBand
 *   C. What are our appraisals telling us? -> IssuesByCategory, FirmScorecard, Agreement
 *   D. Volume and turnaround (existing TrendChart, unchanged)
 *   E. Portfolio risk by property type -> PortfolioRisk
 *
 * Every figure carries a `source` so the hand-off says where real data would come from
 * (see docs: dashboard proposal, 21 Nov 2026):
 *   "app"      = Parachute / YouConnect already hold it
 *   "engine"   = the engine produces it, but has no results endpoint yet
 *   "estimate" = no source yet (needs Ed / engine v2 / data dictionary)
 *
 * Built by `deriveInsights()` in insights-model.ts. Components only read these shapes.
 */
import type { Review, Severity } from "@/types";

export type DataSource = "app" | "engine" | "estimate";

/** Checklist-weight severity, as the engine models it (RWT-694). */
export type IssueSeverity = "critical" | "high" | "medium" | "low";

/* ---------- A. Needs you ---------- */
export interface NeedsYou {
  /** In review / auto-rejected / overdue: waiting on a reviewer decision (live, not period-scoped). */
  waiting: number;
  overdue: number;
  /** YouConnect deliveries not yet started (live). */
  newFromYc: number;
  /** Most urgent first: overdue first, then by SLA due date. Max 5. */
  urgent: UrgentRow[];
}
export interface UrgentRow {
  review: Review;
  /** Worst finding severity, if the pipeline has run. */
  worst: Severity | null;
  /** Negative = overdue by that many ms. */
  dueInMs: number;
}

/* ---------- B. What Parachute did (period-scoped) ---------- */
export interface ValueBand {
  completed: number;
  /** Fractional change vs the previous period (0.12 = +12%), null when no history. */
  completedDelta: number | null;
  /** Estimated reviewer hours saved. source "estimate". */
  hoursSaved: number;
  hoursPerReview: number;
  /** Checks the engine re-ran / corrected (math verification). source "engine". */
  checksRun: number;
  checksCorrected: number;
  /** Issues the engine raised, and how many are critical or high. source "engine". */
  issues: number;
  issuesCriticalHigh: number;
  issuesPerReport: number;
}

/* ---------- C. Insights (period-scoped) ---------- */
export interface CategoryRow {
  category: string; // Valuation, USPAP Compliance, Property Analysis, FIRREA, Documentation, Methodology
  total: number;
  criticalHigh: number;
}

export interface FirmRow {
  firm: string; // fee-appraiser firm whose work was reviewed (Review.appraisalFirm)
  reports: number;
  issuesPerReport: number;
  /** Share of this firm's reports returned (sent back) for revision, 0..1. */
  returnedRate: number;
  /** vs previous period: "worse" | "same" | "better" (on issues per report). */
  trend: "worse" | "same" | "better";
  /** Top issue category for this firm, for the row's sub-line. */
  topCategory: string;
}

export interface Agreement {
  /** Reviewer decisions on AI findings, shares 0..1, sum to 1. */
  concurred: number;
  edited: number;
  rejected: number;
  decisions: number;
  /** Category where reviewers reject the AI most often. */
  mostRejectedCategory: string | null;
}

/* ---------- E. Portfolio risk (period-scoped) ---------- */
export type RiskLevel = "low" | "moderate" | "elevated";
export interface RiskRow {
  propertyType: string; // Office, Multifamily, Industrial, Retail, Hospitality, Other
  reports: number;
  low: number;
  moderate: number;
  elevated: number;
}

export interface DashboardInsights {
  needsYou: NeedsYou;
  value: ValueBand;
  categories: CategoryRow[]; // sorted by total desc, max 6
  firms: FirmRow[]; // sorted by issuesPerReport desc, max 6
  agreement: Agreement;
  risk: RiskRow[]; // sorted by reports desc, max 6
  /** Where each block's real data would come from (drives the small "Estimated" / "Preview" marks). */
  sources: {
    needsYou: DataSource;
    completed: DataSource;
    hoursSaved: DataSource;
    checks: DataSource;
    issues: DataSource;
    categories: DataSource;
    firms: DataSource;
    agreement: DataSource;
    risk: DataSource;
  };
}
