import type { IconName } from "@/components/atoms";
import type { Finding, FindingState, WorkbookExhibits, WorkbookLayout } from "@/types";
import { publishedVersion } from "@/lib/template-versions";
import {
  RISK_META,
  findingsSections,
  derivedDeadlinePhrase,
  type RiskRating,
} from "@/lib/workbook";

/**
 * Per-review Workbook configuration — what the Builder authors and the Workbook
 * renders. It is the editable layer between the org-default `WorkbookLayout`
 * (which seeds the defaults, resolved by property profile) and the live compiled
 * doc. Per-review and ephemeral: it lives in the workspace store, is derived
 * fresh on `loadReview`, and is discarded unless the demo saves it. Everything
 * the doc shows still DERIVES from the workspace dispositions — this config only
 * governs ordering, visibility, grouping, and presentation.
 */

/* ---------- Section model ---------- */

export type WbSectionType =
  | "summary"
  | "findings"
  | "exhibits"
  | "sensitivity"
  | "swot"
  | "conditions"
  | "returns"
  | "conclusion"
  | "freeText"
  | "certification";

/** Which exhibit series an exhibits section renders. */
export interface WbExhibitSeries {
  adjustmentGrid: boolean;
  psf: boolean;
  capRate: boolean;
}

/** One row of an editable fact grid (summary section). Facts derive from the
 *  review record until first edited; editing MATERIALIZES them onto the section
 *  (`WbSection.facts`) — plan §4.1 "compile = seed, not render". */
export interface WbFact {
  label: string;
  value: string;
  big?: boolean;
}

/** One authored condition of approval (F-151). Conditions derive from the
 *  conditioned findings until the reviewer touches them; the first edit
 *  MATERIALIZES the list onto the section (`WbSection.conditions`), after which
 *  the WORDING is authored separately from the raw finding text — a condition is
 *  the batched correction sent to the fee appraiser, not the finding. A derived
 *  condition keeps `sourceFindingId` (+ its page/category) so the p.X citation
 *  and provenance survive; a reviewer-added condition carries no source. */
export interface WbCondition {
  id: string;
  text: string;
  sourceFindingId?: string;
  page?: number;
  category?: string;
}

/** One authored action item on the conclusion (F-151). Like conditions, action
 *  items derive from dispositions until first edited, then materialize onto
 *  `WbSection.actions`. Each is structured — an `owner` (defaults to the fee
 *  appraiser, reassignable to a teammate) and a `deadline` (an ISO `yyyy-mm-dd`
 *  once authored; a derived seed carries the severity phrase until dated) —
 *  never free text laid over a table. */
export interface WbActionItem {
  id: string;
  text: string;
  owner: string;
  deadline: string;
  sourceFindingId?: string;
}

export interface WbSection {
  id: string;
  type: WbSectionType;
  title: string;
  enabled: boolean;
  /** Appendix sections number with letters (A, B…) instead of 1, 2…. */
  appendix?: boolean;
  /** Auto sections silently hide when they have no content (conditions/returns). */
  auto?: boolean;
  /** findings — the finding categories rolled into this section. */
  categories?: string[];
  /** exhibits — which series to show + as table / chart / both. */
  series?: WbExhibitSeries;
  exhibitMode?: "table" | "chart" | "both";
  /** sensitivity — how many scenario columns to print (centred on the selected). */
  sensitivityCols?: number;
  /** freeText — the narrative body. On a `conclusion` section it is the
   *  reviewer's in-place rewrite, overriding the derived narrative (F-144). */
  body?: string;
  /** freeText carrying an appraisal section pulled in via the import band. */
  imported?: boolean;
  /** summary — reviewer-materialized fact rows (overrides the derived facts). */
  facts?: WbFact[];
  /** summary — reviewer-materialized "approaches developed" tags. */
  approaches?: string[];
  /** conditions — reviewer-materialized conditions of approval (overrides the
   *  derived-from-findings list once authored; F-151). */
  conditions?: WbCondition[];
  /** conclusion — reviewer-materialized action items (overrides the derived
   *  list; each carries a structured owner + deadline; F-151). */
  actions?: WbActionItem[];
  /** conclusion — show the per-item due/timing on action items (client ref's
   *  "Show due/timing column" toggle). Undefined reads as true. */
  showActionTiming?: boolean;
  /** Set when the reviewer edited this section's content in place — drives the
   *  "Edited by reviewer" provenance pip (inline-workbook plan §4.3, layer 1). */
  edited?: { by: string; at: number };
}

/** The 9 author-addable section types (the Builder add-palette). `returns` is
 *  auto-derived and `imported` narrative arrives via the import band, so neither
 *  appears in the palette. */
export const PALETTE_TYPES: WbSectionType[] = [
  "summary",
  "findings",
  "exhibits",
  "sensitivity",
  "swot",
  "conditions",
  "conclusion",
  "freeText",
  "certification",
];

/** Types that may appear at most once in a document (the palette disables them
 *  once present). Findings and free-text narratives can repeat. */
export const SINGLETON_TYPES: WbSectionType[] = [
  "summary",
  "exhibits",
  "sensitivity",
  "swot",
  "conditions",
  "conclusion",
  "certification",
];

export const SECTION_TYPE_LABEL: Record<WbSectionType, string> = {
  summary: "Property / value summary",
  findings: "Findings section",
  exhibits: "Analytical exhibits",
  sensitivity: "Sensitivity analysis",
  swot: "SWOT analysis",
  conditions: "Conditions of approval",
  returns: "Returned to appraiser",
  conclusion: "Conclusion & action items",
  freeText: "Free-text narrative",
  certification: "Reviewer certification",
};

/** A distinct icon per section type — used by the enriched add palette so a
 *  reviewer can tell "sensitivity" from "exhibits" at a glance (client ref: the
 *  Section-library rail). Every name is verified against the `Icon` atom map. */
export const SECTION_TYPE_ICON: Record<WbSectionType, IconName> = {
  summary: "info",
  findings: "checklist",
  exhibits: "columns",
  sensitivity: "sort",
  swot: "templates",
  conditions: "gavel",
  returns: "undo",
  conclusion: "check-circle",
  freeText: "document",
  certification: "sso",
};

/** One-line "what this section does" — the add palette's subtitle (client ref). */
export const SECTION_TYPE_DESC: Record<WbSectionType, string> = {
  summary: "Property & value summary — auto-populated",
  findings: "Dispositioned findings, routed by category",
  exhibits: "Adjustment grid, $/SF & cap-rate exhibits",
  sensitivity: "Value sensitivity to cap-rate shifts",
  swot: "Strengths · weaknesses · opportunities · threats",
  conditions: "Numbered conditions of approval",
  returns: "Items returned to the appraiser",
  conclusion: "Conclusion & appraiser action items",
  freeText: "A free narrative block",
  certification: "Reviewer certification & signature",
};

/** A short type tag shown on the section row. */
export const SECTION_TYPE_TAG: Record<WbSectionType, string> = {
  summary: "summary",
  findings: "findings",
  exhibits: "exhibits",
  sensitivity: "sensitivity",
  swot: "swot",
  conditions: "conditions",
  returns: "returns",
  conclusion: "conclusion",
  freeText: "narrative",
  certification: "cert",
};

/* ---------- Document settings ---------- */

export interface WbDocSettings {
  theme: string; // WB_THEMES key — Navy | Petrol | Graphite
  headingFont: "display" | "body"; // WB_FONTS key for headings
  scale: "compact" | "normal" | "spacious";
  showHeader: boolean;
  showFooter: boolean;
  showLogo: boolean;
  showStatus: boolean; // disposition status badges on findings
  showConfidence: boolean; // AI-basis footnote under findings
  hideRejected: boolean; // drop rejected items from the Returned section
  hideOverridden: boolean; // drop overridden findings from the body
  colorCoding: boolean; // severity-coloured left border on finding entries
  riskWording: Record<RiskRating, string>; // per-level risk wording override
}

export function defaultRiskWording(): Record<RiskRating, string> {
  return {
    low: RISK_META.low.wording,
    moderate: RISK_META.moderate.wording,
    elevated: RISK_META.elevated.wording,
  };
}

export function defaultSettings(theme: string): WbDocSettings {
  return {
    theme,
    headingFont: "display",
    scale: "normal",
    showHeader: true,
    showFooter: true,
    showLogo: true,
    showStatus: true,
    showConfidence: true,
    hideRejected: false,
    hideOverridden: false,
    colorCoding: true,
    riskWording: defaultRiskWording(),
  };
}

export interface WorkbookConfig {
  settings: WbDocSettings;
  sections: WbSection[];
  /** The org `WorkbookLayout` this config was derived from — the "current base"
   *  the Builder's Templates pane marks, and what "Reset to inherited" reverts to
   *  (undefined when no org layout resolved for the property profile). */
  baseLayoutId?: string;
}

/* ---------- Default config (inherits the org layout) ---------- */

const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

/** Build the default per-review config: the same rich doc the Workbook renders
 *  today, expressed as explicit, editable sections — findings grouped by
 *  appraisal approach, analytical exhibits, sensitivity, conditions/returns
 *  (auto), conclusion, and the imported narrative + SWOT appendices. The theme
 *  is inherited from the org layout's published version. */
export function defaultWorkbookConfig(
  layout: WorkbookLayout | undefined,
  findings: Finding[],
  exhibits: WorkbookExhibits | null,
): WorkbookConfig {
  const sections: WbSection[] = [];

  sections.push({
    id: "summary",
    type: "summary",
    title: "Property & Value Summary",
    enabled: true,
  });

  // Findings — one section per appraisal approach group that has content.
  findingsSections(findings, () => true).forEach((g) => {
    const categories = Array.from(new Set(g.findings.map((f) => f.category)));
    sections.push({
      id: `findings-${slug(g.title)}`,
      type: "findings",
      title: g.title,
      enabled: true,
      categories,
    });
  });

  if (exhibits) {
    sections.push({
      id: "exhibits",
      type: "exhibits",
      title: "Analytical Exhibits",
      enabled: true,
      series: { adjustmentGrid: true, psf: true, capRate: true },
      exhibitMode: "both",
    });
    sections.push({
      id: "sensitivity",
      type: "sensitivity",
      title: "Sensitivity Analysis",
      enabled: true,
      sensitivityCols: exhibits.sensitivity.cols.length,
    });
  }

  sections.push({
    id: "conditions",
    type: "conditions",
    title: "Conditions of Approval",
    enabled: true,
    auto: true,
  });
  sections.push({
    id: "returns",
    type: "returns",
    title: "Returned to Appraiser",
    enabled: true,
    auto: true,
  });
  sections.push({
    id: "conclusion",
    type: "conclusion",
    title: "Conclusion & Action Items",
    enabled: true,
  });

  if (exhibits) {
    sections.push({
      id: "swot",
      type: "swot",
      title: "SWOT Analysis",
      enabled: true,
      appendix: true,
    });
    exhibits.imported.forEach((s) => {
      sections.push({
        id: `import-${s.id}`,
        type: "freeText",
        title: s.title,
        enabled: true,
        appendix: true,
        imported: true,
        body: s.body,
      });
    });
  }

  sections.push({
    id: "certification",
    type: "certification",
    title: "Reviewer Certification",
    enabled: true,
  });

  const theme = (layout && publishedVersion(layout.versions)?.theme) || "Navy";
  return { settings: defaultSettings(theme), sections, baseLayoutId: layout?.id };
}

/* ---------- Section numbering (mirrors the compiled doc) ---------- */

/** Whether a section actually renders in the compiled doc — the same predicate
 *  the Workbook applies (disabled hide; exhibits/sensitivity/SWOT need exhibit
 *  data; conditions/returns hide when empty). Everything else always renders. */
export function sectionRenders(
  s: WbSection,
  ctx: { hasExhibits: boolean; conditionsCount: number; returnedCount: number },
): boolean {
  if (!s.enabled) return false;
  switch (s.type) {
    case "exhibits":
    case "sensitivity":
    case "swot":
      return ctx.hasExhibits;
    case "conditions":
      return ctx.conditionsCount > 0;
    case "returns":
      return ctx.returnedCount > 0;
    default:
      return true;
  }
}

/** Short list labels mirroring the doc's numbering: body sections 1,2,3…,
 *  appendix sections A,B…, and sections that won't render → null (shown as a
 *  muted dash in the Builder list). Same order/algorithm as `WorkbookPreview`. */
export function sectionListLabels(
  sections: WbSection[],
  ctx: { hasExhibits: boolean; conditionsCount: number; returnedCount: number },
): Record<string, string | null> {
  let num = 0;
  let appx = 0;
  const out: Record<string, string | null> = {};
  for (const s of sections) {
    if (!sectionRenders(s, ctx)) {
      out[s.id] = null;
    } else if (s.appendix) {
      out[s.id] = String.fromCharCode(65 + appx++);
    } else {
      out[s.id] = String(++num);
    }
  }
  return out;
}

/* ---------- Conditions / action items (derive → materialize on edit) ---------- */

/** Which findings roll into the batched asks: a rejected finding (returned for
 *  revision) or one the reviewer flagged as a condition — never an excluded one. */
function isTrackedAsk(f: Finding, states: Record<string, FindingState>): boolean {
  const st = states[f.id];
  if (st?.disposition === "removed") return false;
  return st?.disposition === "rejected" || !!st?.condition;
}

/** The reviewer's text for a finding-derived ask — the rewritten wording, else a
 *  note, else the raw question. */
function askText(f: Finding, states: Record<string, FindingState>): string {
  return states[f.id]?.reason || states[f.id]?.comment || f.question;
}

/** Conditions of approval derived from the conditioned findings (F-151). Ids are
 *  deterministic (`cond-<findingId>`) so this is safe to call in render before
 *  the reviewer materializes the list; each keeps its source finding for the
 *  p.X citation. */
export function derivedConditions(
  findings: Finding[],
  states: Record<string, FindingState>,
): WbCondition[] {
  return findings
    .filter((f) => states[f.id]?.condition && states[f.id]?.disposition !== "removed")
    .map((f) => ({
      id: `cond-${f.id}`,
      text: askText(f, states),
      sourceFindingId: f.id,
      page: f.page,
      category: f.category,
    }));
}

/** Action items derived from the reviewer's decisions (F-151). Owner defaults to
 *  the fee appraiser (the send-back target); the deadline seeds as the severity
 *  phrase until the reviewer authors a real date. Deterministic ids, render-safe. */
export function derivedActionItems(
  findings: Finding[],
  states: Record<string, FindingState>,
  defaultOwner: string,
): WbActionItem[] {
  return findings
    .filter((f) => isTrackedAsk(f, states))
    .map((f) => ({
      id: `act-${f.id}`,
      text: askText(f, states),
      owner: defaultOwner,
      deadline: derivedDeadlinePhrase(f),
      sourceFindingId: f.id,
    }));
}

/** Whether a deadline string is an authored ISO date (vs a derived phrase). */
export function isIsoDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

/** Human deadline for the compiled doc: an authored ISO date renders "Due Mon D,
 *  YYYY"; a derived phrase prints as-is; empty reads as unset. */
export function formatActionDeadline(d: string): string {
  if (!d) return "No date set";
  if (isIsoDate(d)) {
    const dt = new Date(`${d}T00:00:00`);
    return `Due ${dt.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`;
  }
  return d;
}

/* ---------- Helpers shared by the Builder + the doc ---------- */

/** The finding categories present in this review (for the findings editor). */
export function availableCategories(findings: Finding[]): string[] {
  return Array.from(new Set(findings.map((f) => f.category))).sort();
}

/** Slice a sensitivity table to `n` columns, keeping the selected column in
 *  view and centred where possible. */
export function visibleSensitivityCols<T extends { selected?: boolean }>(
  cols: T[],
  n: number,
): T[] {
  if (n >= cols.length) return cols;
  const sel = cols.findIndex((c) => c.selected);
  const pivot = sel < 0 ? Math.floor(cols.length / 2) : sel;
  let start = Math.max(0, pivot - Math.floor(n / 2));
  start = Math.min(start, cols.length - n);
  return cols.slice(start, start + n);
}

/** A fresh section of `type`, ready to append (id stamped by the store). */
export function newSection(type: WbSectionType, allFindings: Finding[]): Omit<WbSection, "id"> {
  switch (type) {
    case "findings":
      return {
        type,
        title: "Findings",
        enabled: true,
        categories: availableCategories(allFindings),
      };
    case "exhibits":
      return {
        type,
        title: "Analytical Exhibits",
        enabled: true,
        series: { adjustmentGrid: true, psf: true, capRate: true },
        exhibitMode: "both",
      };
    case "sensitivity":
      return { type, title: "Sensitivity Analysis", enabled: true, sensitivityCols: 5 };
    case "swot":
      return { type, title: "SWOT Analysis", enabled: true, appendix: true };
    case "conditions":
      return { type, title: "Conditions of Approval", enabled: true, auto: true };
    case "conclusion":
      return { type, title: "Conclusion & Action Items", enabled: true };
    case "freeText":
      return { type, title: "Narrative", enabled: true, body: "" };
    case "certification":
      return { type, title: "Reviewer Certification", enabled: true };
    case "summary":
    default:
      return { type: "summary", title: "Property & Value Summary", enabled: true };
  }
}
