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
  edited: { label: "Edited", tone: "flag" },
  rejected: { label: "Revision required", tone: "fail" },
  removed: { label: "Excluded (audit)", tone: "info" },
  pending: { label: "Open", tone: "info" },
};

export function dispTag(disposition: string) {
  return DISP_TAG[disposition] ?? DISP_TAG.pending;
}

/** The reviewer's wording that prints under a finding in the workbook. Accepted
 *  findings carry a default concurrence; `edited` prints the reviewer's rewritten
 *  wording; `rejected` carries the return reason. A free `comment` is rendered
 *  separately (it's independent of the disposition), not here. */
export function dispositionLine(state: FindingState): string {
  switch (state.disposition) {
    case "accepted":
      return "Reviewer concurs. The appraiser's treatment is adequately supported; no exception taken.";
    case "edited":
      return state.reason || "Reviewer revised the finding wording.";
    case "rejected":
      return state.reason || "Returned to the appraiser for revision (see return letter).";
    case "removed":
      // Excluded from the workbook body entirely; retained only in the audit log.
      return "";
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

/* ---------- AI audit trail: multi-stage reasoning chain ---------- */

export interface AuditStage {
  n: number;
  label: string;
  verdict: string;
  tone: "info" | "pass" | "flag" | "fail";
  text: string;
}

/** A presentational reasoning chain (Screen → Verify → Adjudicate) derived from
 *  the finding's single `auditTag`/`auditText` — surfaces *how* the AI reached
 *  the tag, not just the tag (F-118 §3/§6). This is the SEAM for Ed's real
 *  5-stage output + per-stage citations (F3): swap the body here once that lands,
 *  no call-site change. Stage 3 carries the real `auditText`; 1–2 are framed. */
export function auditStages(f: Finding): AuditStage[] {
  const verify =
    f.auditTag === "CONFIRMED"
      ? { verdict: "Consistent", tone: "pass" as const }
      : f.auditTag === "CORRECTED"
        ? { verdict: "Discrepancy", tone: "flag" as const }
        : { verdict: "Needs review", tone: "fail" as const };
  const adjudicate =
    f.auditTag === "CONFIRMED"
      ? { verdict: "Confirmed", tone: "pass" as const }
      : f.auditTag === "CORRECTED"
        ? { verdict: "Corrected", tone: "flag" as const }
        : { verdict: "Flagged", tone: "fail" as const };
  return [
    {
      n: 1,
      label: "Screen",
      verdict: "Matched",
      tone: "info",
      text: `Located the ${f.category.toLowerCase()} passage on p.${f.page} and matched it to the review checklist item.`,
    },
    {
      n: 2,
      label: "Verify",
      verdict: verify.verdict,
      tone: verify.tone,
      text: "Cross-checked the figure against the report's other approaches, comparable sales and stated policy limits.",
    },
    {
      n: 3,
      label: "Adjudicate",
      verdict: adjudicate.verdict,
      tone: adjudicate.tone,
      text: f.auditText,
    },
  ];
}

/** The severity-scaled deadline phrase a derived action item / condition seed
 *  carries until the reviewer authors a real date (F-151). Shared so the derived
 *  seeds in `workbook-config` and any read-only surface agree. */
export function derivedDeadlinePhrase(f: Finding): string {
  return f.severity === "crit" || f.severity === "fail"
    ? "Before funding"
    : "With revision";
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
