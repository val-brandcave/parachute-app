import type { Finding, FindingState, Review, WorkbookLayout } from "@/types";
import { publishedVersion } from "@/lib/template-versions";

/**
 * Workbook derivation — everything the compiled, auditor-facing doc shows is
 * computed here from the live workspace dispositions, never stored as a second
 * copy. The Workbook organism reads these helpers so Preview and Edit agree on
 * the same source of truth (the §4.4 "derive everything from the workspace
 * store" rule).
 */

/* ---------- Reviewer recommendation (cover banner) ---------- */

export type Recommendation = "approve" | "approve_conditions" | "in_progress";

export const RECOMMENDATION_META: Record<
  Recommendation,
  { label: string; sub: string; tone: "pass" | "flag" | "info" }
> = {
  approve: {
    label: "Approve",
    sub: "Appraisal accepted as submitted — no exceptions taken.",
    tone: "pass",
  },
  approve_conditions: {
    label: "Approve with conditions",
    sub: "Acceptable subject to the conditions below being resolved.",
    tone: "flag",
  },
  in_progress: {
    label: "Review in progress",
    sub: "Findings remain open — disposition them before signing.",
    tone: "info",
  },
};

function dispOf(states: Record<string, FindingState>, id: string) {
  return states[id]?.disposition ?? "pending";
}

/** The reviewer recommendation, derived from how findings were dispositioned. */
export function recommendation(
  findings: Finding[],
  states: Record<string, FindingState>,
): Recommendation {
  const pending = findings.some((f) => dispOf(states, f.id) === "pending");
  if (pending) return "in_progress";
  const rejected = findings.some((f) => dispOf(states, f.id) === "rejected");
  const conditioned = findings.some((f) => states[f.id]?.condition);
  return rejected || conditioned ? "approve_conditions" : "approve";
}

/* ---------- Risk rating ---------- */

export type RiskRating = "low" | "moderate" | "elevated";

export const RISK_META: Record<
  RiskRating,
  { label: string; color: string; bg: string; wording: string }
> = {
  low: {
    label: "Low Risk",
    color: "var(--md-success)",
    bg: "var(--md-success-c)",
    wording: "Acceptable — no material deficiencies identified.",
  },
  moderate: {
    label: "Moderate Risk",
    color: "var(--md-warn)",
    bg: "var(--md-warn-c)",
    wording: "Acceptable subject to the conditions noted below.",
  },
  elevated: {
    label: "Elevated Risk",
    color: "var(--md-error)",
    bg: "var(--md-error-c)",
    wording: "Material revisions required prior to reliance.",
  },
};

/* ---------- Value summary (deterministic mock figures) ---------- */
// The prototype domain model carries no appraised value, so the workbook derives
// a stable, sensible value summary from the review's identity. Deterministic
// (no Date.now / Math.random) → safe to call during render and identical on
// every visit, so the demo reads consistently.

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export interface ValueSummary {
  concludedValue: number;
  loanAmount: number;
  ltv: number; // 0..1
  effectiveDate: number; // epoch ms
  rights: string;
  approaches: string[];
}

export function valueSummary(review: Review): ValueSummary {
  const h = hash(`${review.id}·${review.loanNo}`);
  const concludedValue = Math.round((1_500_000 + (h % 10_500_000)) / 50_000) * 50_000;
  const ltv = (60 + (h % 19)) / 100; // 60–78%
  const loanAmount = Math.round((concludedValue * ltv) / 5_000) * 5_000;
  const effectiveDate = review.orderedAt - ((h % 10) + 5) * 86_400_000;
  return {
    concludedValue,
    loanAmount,
    ltv,
    effectiveDate,
    rights: h % 4 === 0 ? "Leased Fee" : "Fee Simple",
    approaches: ["Sales Comparison", "Income Capitalization", "Cost"],
  };
}

export function formatMoney(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatLongDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ---------- Layout inheritance + section blocks ---------- */

/** A review inherits the org default WorkbookLayout for its property profile. */
export function profileFor(propertyType: string): "Residential" | "Commercial" {
  return /resid|single.?family|condo|townhome|duplex/i.test(propertyType)
    ? "Residential"
    : "Commercial";
}

/** Resolve the org default layout for a review's profile (the inherited base). */
export function inheritedLayout(
  layouts: WorkbookLayout[],
  profile: string,
): WorkbookLayout | undefined {
  return (
    layouts.find((l) => l.profile === profile && l.isDefault) ??
    layouts.find((l) => l.profile === profile) ??
    layouts[0]
  );
}

/** Human label for the inherited layout + its live version, for the Edit note. */
export function layoutLabel(layout: WorkbookLayout | undefined): string {
  if (!layout) return "Org default layout";
  const v = publishedVersion(layout.versions);
  return v ? `${layout.name} · v${v.version}` : layout.name;
}

export type WorkbookBlockType =
  | "summary"
  | "findings"
  | "conditions"
  | "returns"
  | "conclusion"
  | "certification";

export interface WorkbookBlock {
  id: WorkbookBlockType;
  title: string;
  enabled: boolean;
  /** Auto blocks hide themselves when they have no content (conditions/returns). */
  auto?: boolean;
}

/** The canonical workbook block order, seeded from the inherited layout. The
 *  literal org section titles (Sales Comparison Approach…) are an org-authoring
 *  concern (Templates → Workbook Layout); the per-review doc composes these
 *  derived blocks, inheriting the layout's enabled/visible defaults. */
export function defaultBlocks(): WorkbookBlock[] {
  return [
    { id: "summary", title: "Property & Value Summary", enabled: true },
    { id: "findings", title: "Findings & Dispositions", enabled: true },
    { id: "conditions", title: "Conditions to Funding", enabled: true, auto: true },
    { id: "returns", title: "Returned to Appraiser", enabled: true, auto: true },
    { id: "conclusion", title: "Reviewer Conclusion & Action Items", enabled: true },
    { id: "certification", title: "Reviewer Certification", enabled: true },
  ];
}

/* ---------- Per-finding workbook wording ---------- */

const DISP_TAG: Record<
  string,
  { label: string; tone: "pass" | "flag" | "fail" | "info" }
> = {
  accepted: { label: "Concur", tone: "pass" },
  override: { label: "Reviewer override", tone: "flag" },
  rejected: { label: "Revision required", tone: "fail" },
  commented: { label: "Commented", tone: "info" },
  pending: { label: "Open", tone: "info" },
};

export function dispTag(disposition: string) {
  return DISP_TAG[disposition] ?? DISP_TAG.pending;
}

/** The reviewer's wording that prints under a finding in the workbook. Accepted
 *  findings carry a default concurrence; overridden/rejected/commented carry the
 *  reviewer's merge-filled response from the composer. */
export function dispositionLine(state: FindingState): string {
  switch (state.disposition) {
    case "accepted":
      return "Reviewer concurs. The appraiser's treatment is adequately supported; no exception taken.";
    case "override":
      return state.reason || "Reviewer override applied; the finding is resolved in the appraiser's favour.";
    case "rejected":
      return state.reason || "Returned to the appraiser for revision (see return letter).";
    case "commented":
      return state.comment || state.reason || "Comment recorded for the file.";
    default:
      return "";
  }
}

/* ---------- Themes & fonts (per-review light overrides) ---------- */

export const WB_THEMES: Record<string, { label: string; accent: string }> = {
  Navy: { label: "Navy", accent: "var(--md-primary)" },
  Petrol: { label: "Petrol", accent: "var(--md-accent-d)" },
  Graphite: { label: "Graphite", accent: "var(--md-on-surface)" },
};

export const WB_FONTS: Record<string, { label: string; stack: string }> = {
  display: { label: "Schibsted Grotesk", stack: "var(--font-display)" },
  body: { label: "Inter", stack: "var(--font-sans)" },
};

/* ---------- Structured findings sections (group by approach) ---------- */
// The compiled doc presents findings under appraisal-section headings (the way a
// reviewer organises a workbook), not by the raw pipeline category. Each finding
// category maps to a section; unmapped categories fall into "Additional Review".

const FINDINGS_SECTIONS: { title: string; cats: string[] }[] = [
  {
    title: "Scope & Compliance",
    cats: ["USPAP Compliance", "Bank Policy", "Highest & Best Use"],
  },
  {
    title: "Sales Comparison Approach",
    cats: ["Valuation Analysis", "Mathematical Accuracy"],
  },
  { title: "Income Approach", cats: ["Income Approach"] },
  { title: "Cost Approach", cats: ["Cost Approach"] },
];

export interface FindingsSection {
  title: string;
  findings: Finding[];
}

/** Group findings into approach-based workbook sections, preserving section
 *  order and dropping empties. A finding is included when `keep(finding)` is
 *  true (the caller decides which dispositions belong in the body). */
export function findingsSections(
  findings: Finding[],
  keep: (f: Finding) => boolean,
): FindingsSection[] {
  const kept = findings.filter(keep);
  const sections: FindingsSection[] = [];
  const used = new Set<string>();
  for (const sec of FINDINGS_SECTIONS) {
    const items = kept.filter((f) => sec.cats.includes(f.category));
    items.forEach((f) => used.add(f.id));
    if (items.length) sections.push({ title: sec.title, findings: items });
  }
  const other = kept.filter((f) => !used.has(f.id));
  if (other.length) sections.push({ title: "Additional Review", findings: other });
  return sections;
}

/** The AI-basis footnote printed under each finding in the workbook:
 *  "AI basis: FAIL · confidence 94% · S3 corrected · p.47". */
export function aiBasisLine(f: Finding): string {
  const tag =
    f.auditTag === "CONFIRMED"
      ? "confirmed"
      : f.auditTag === "CORRECTED"
        ? "corrected"
        : "flagged";
  return `AI basis: ${f.status} · confidence ${Math.round(f.confidence * 100)}% · ${tag} · p.${f.page}`;
}

/* ---------- Conclusion action items (derived from dispositions) ---------- */

export interface ActionItem {
  id: string;
  text: string;
  deadline: string;
}

/** Action items the conclusion lists, derived from the reviewer's decisions:
 *  rejected findings and conditioned findings become tracked asks, with a
 *  deadline phrase scaled by severity. */
export function actionItems(
  findings: Finding[],
  states: Record<string, FindingState>,
): ActionItem[] {
  return findings
    .filter((f) => {
      const st = states[f.id];
      return st?.disposition === "rejected" || st?.condition;
    })
    .map((f, i) => ({
      id: `A${i + 1}`,
      text:
        states[f.id]?.reason ||
        states[f.id]?.comment ||
        f.question,
      deadline: f.severity === "crit" || f.severity === "fail" ? "due before funding" : "due with revision",
    }));
}

/* ---------- Document header / footer defaults ---------- */

export function workbookHeader(bank: string): string {
  return `${bank} — Commercial Appraisal Review`;
}
export const WORKBOOK_FOOTER =
  "CONFIDENTIAL — prepared under engagement. For internal underwriting use only.";

/* ---------- SHA-256 seal (computed in the Sign handler, not render) ---------- */

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
