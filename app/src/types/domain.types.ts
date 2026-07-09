import type { BaseEntity, Timestamp, UUID } from "./common.types";

/* ============ Users & Orgs ============ */
export interface User extends BaseEntity {
  name: string;
  initials: string;
  designation: string; // e.g. "Chief Appraiser, MAI"
  signatureName: string;
  role: "reviewer" | "admin";
}

export interface Org extends BaseEntity {
  name: string;
  brandPrimary: string;
  brandAccent: string;
  brandFont: string;
}

/* ============ Reviews ============ */
// Honest lifecycle phases (no synthetic "status"). The queue derives its
// columns/tabs from these via lib/review-lifecycle — it never prints the raw value.
//   intake       = delivered / new-from-YC, awaiting order ("Confirm & run")
//   autorejected = failed the quality gate at intake ("Triage")
//   running      = pipeline S1–S5 in progress
//   in_review    = pipeline complete, reviewer deciding findings / attesting
//   returned     = sent back to the fee appraiser, awaiting resubmission
//   completed    = signed off / filed
export type ReviewStatus =
  | "intake"
  | "autorejected"
  | "running"
  | "in_review"
  | "returned"
  | "completed";

export type ReviewSource = "yc" | "manual";
export type ReviewType = "technical" | "administrative";

export interface Review extends BaseEntity {
  propertyAddress: string;
  propertyType: string; // e.g. "Office (Medical)"
  bank: string; // the lending entity/branch this loan sits under (org = the bank itself)
  appraisalFirm: string; // the external fee-appraiser firm whose work is under review
  loanNo: string;
  status: ReviewStatus;
  reviewTypes: ReviewType[];
  assigneeId: UUID;
  source: ReviewSource;
  riskRating: "low" | "moderate" | "elevated" | null;
  openFindings: number;
  flaggedCount: number;
  worstSeverity: Severity | null; // drives the queue Outcome chip (crit/fail/flag); null = clean / pre-pipeline
  pipelineStage: number; // 0-5 (0 = not started, 5 = done)
  slaDueAt: number; // epoch ms
  orderedAt: number;
}

/* ============ YouConnect deliveries (Order stepper inbox) ============ */
// An appraisal that has landed in YouConnect and can be ordered for review.
// Backs the "From YouConnect" source step. `status` drives the inbox badge:
//   new      = not yet ordered → "NEW"
//   in_queue = already has an active review → "IN QUEUE" (a second review needs intent)
export interface YcDelivery extends BaseEntity {
  propertyAddress: string;
  propertyType: string;
  bank: string; // lending entity/branch
  appraisalFirm: string; // the fee-appraiser firm whose work would be reviewed
  loanNo: string;
  deliveredAt: number; // epoch ms — when YouConnect delivered it
  docName: string; // e.g. "Commercial Appraisal Report.pdf"
  docPages: number;
  viaApi: boolean; // delivered straight over the YC API (read-only source)
  slaDueAt: number; // epoch ms — SLA clock from YC delivery
  defaultAssigneeId: UUID; // inherited reviewer (changeable in the stepper)
  status: "new" | "in_queue";
  existingReviewId?: UUID; // set when status === "in_queue" (the second-review target)
}

/* ============ Findings ============ */
export type Severity = "crit" | "fail" | "flag" | "pass" | "na";
export type Disposition =
  | "pending"
  | "accepted"
  | "edited" // reviewer rewrote the finding's wording (F-140); the edited text replaces the AI analysis
  | "rejected"
  | "removed"; // not a concern — dropped from the workbook, kept for audit (F-118)

export interface Finding extends BaseEntity {
  reviewId: UUID;
  category: string; // e.g. "Valuation Analysis"
  severity: Severity;
  status: string; // "FAIL" | "PASS" | "FLAG"
  confidence: number; // 0..1
  page: number;
  question: string; // the issue / question
  analysis: string; // the system's finding text
  evidence: string; // quoted excerpt from the appraisal
  auditTag: "CONFIRMED" | "CORRECTED" | "FLAGGED";
  auditText: string;
  material: boolean; // value-impacting
  suggestedDisposition: Disposition;
  byReviewer?: boolean; // reviewer-authored finding
  /** Raw quoted source span for a reviewer finding created from a selection —
   *  re-matched on the Source doc to re-highlight the span (F-145). */
  citedSpan?: string;
}

/* Per-finding reviewer state (lives in the workspace store). */
export interface FindingState {
  disposition: Disposition;
  /** The reviewer's text for the current disposition: the rewritten finding
   *  wording when `edited`, or the return reason when `rejected`. */
  reason?: string;
  /** A free note, INDEPENDENT of the disposition (F-140) — a reviewer can Accept /
   *  Edit / Reject and still attach a comment; it is not itself a decision. */
  comment?: string;
  /** Secondary, disposition-independent flags from the ⋯ overflow (decision #4):
   *  `condition` rolls the finding into the workbook's batched conditions list;
   *  `flagged` marks it for personal follow-up. */
  condition?: boolean;
  flagged?: boolean;
  /** Response template last applied to the composer (for the "applied" hint). */
  templateId?: string;
  /** When the current disposition was set — the inline workbook block prints it
   *  on its decided line ("Concurred · J. Rivera · 2:14 PM", F-143). */
  decidedAt?: number;
}

/* ============ Administrative review (checklist attestation) ============ */
// A reviewer's possible answer to a compliance-checklist item.
export type AttAnswer = "YES" | "NO" | "NA";

// Per-review AI pre-fill for ONE checklist item: the answer Parachute proposed
// against THIS appraisal, with its confidence, page cite and quoted evidence.
// Keyed to a ChecklistTemplateItem by `itemId` — the item's text/group are owned
// by the org-default checklist (single source of truth, resolved at load); this
// is the per-review layer the AI produces, parallel to how a Finding is the
// per-review output of the Technical pipeline.
export interface Attestation extends BaseEntity {
  reviewId: UUID;
  itemId: string; // → ChecklistTemplateItem.id on the inherited checklist
  aiAnswer: AttAnswer;
  confidence: number; // 0..1
  page: number; // source page cite
  evidence: string; // quoted excerpt supporting the AI's answer
}

// The reviewer's attestation of one item — lives in the admin store, not the
// data layer (mirrors FindingState). `answer` starts at the AI's suggestion;
// changing it away from the AI requires a `reason` before it can be `confirmed`
// (attested). Changing the answer re-opens it (clears `confirmed`).
export interface AttestationState {
  answer: AttAnswer;
  confirmed: boolean;
  reason?: string; // required for the audit trail when answer !== the AI's
}

/* ============ Templates ============ */
// The Templates hub holds three kinds of reusable, AI-configurable artifacts
// that drive the review pipeline and its output. Only response templates carry
// a personal/org scope; checklists and workbook layouts are org-owned.
export type TemplateKind = "checklist" | "response" | "workbook";

/** Response-template ownership: shared org library vs the reviewer's own set. */
export type TemplateScope = "org" | "mine";

/** Merge-field tokens that fill from the finding when a response is applied. */
export type MergeField =
  | "property"
  | "page"
  | "topic"
  | "action"
  | "condition"
  | "detail";

// Reviewer disposition boilerplate (Concur / Requires revision / Override / …).
// Org library + personal; merge fields fill from the finding at apply time.
// Populates the finding ActionMenu and the workbook response wording.
export interface ResponseTemplate extends BaseEntity {
  scope: TemplateScope;
  group: string; // e.g. "Concur", "Requires revision"
  name: string;
  body: string; // prose with {{merge}} tokens
}

export type ChecklistItemType = "binary" | "qualitative";

// One row of a compliance checklist template.
export interface ChecklistTemplateItem {
  id: UUID;
  group: string;
  orig: string; // raw source text extracted from the .docx
  question: string; // AI-normalized question
  type: ChecklistItemType;
  map: "ok" | "warn"; // mapping health: ok = mapped, warn = needs attention
  hint?: string; // why it's flagged (e.g. "two questions detected in one row")
  requireCitation: boolean;
}

// Lifecycle of a single template version within its family. At most one
// `published` (the snapshot new reviews inherit) and at most one `draft` (the
// editable work-in-progress) exist at a time; superseded versions are `archived`
// but kept — in-flight reviews stay pinned to the version they were created with.
export type VersionStatus = "published" | "draft" | "archived";

// One version (snapshot) of a checklist template. Editing happens on a draft;
// publishing freezes it active and archives the prior published version.
export interface ChecklistVersion {
  id: UUID;
  version: number; // 1, 2, 3 — monotonic per family
  status: VersionStatus;
  sourceFile: string; // e.g. "Meridian_Commercial_Review_Form.docx"
  items: ChecklistTemplateItem[];
  createdAt: Timestamp;
  publishedAt?: Timestamp; // when this snapshot became (or last was) published
}

// A bank's administrative-review form: uploaded as .docx → AI-extracted →
// mapped → versioned/published. Drives Administrative Review. Org-owned. The
// family is a container of versions; resolve the active/published one via
// lib/template-versions. There may be more than one family per kind.
export interface ChecklistTemplate extends BaseEntity {
  name: string;
  usedInReviews: number;
  // The single org-default admin checklist: the order picker defaults to it and
  // the AI recommends from there; the reviewer can pick another per order. Only
  // one family is the default at a time (the store enforces it). Set in Settings
  // or via the Templates card ⋯ "Set as default".
  isDefault?: boolean;
  versions: ChecklistVersion[];
}

// One section of an org-default workbook layout.
export interface WorkbookLayoutSection {
  id: UUID;
  title: string;
  type: string; // findings | summary | exhibits | conclusion | ...
  enabled: boolean;
}

// One version (snapshot) of an org workbook layout.
export interface WorkbookVersion {
  id: UUID;
  version: number;
  status: VersionStatus;
  theme: string; // e.g. "Navy"
  sections: WorkbookLayoutSection[];
  createdAt: Timestamp;
  publishedAt?: Timestamp;
}

// Org-default workbook section layout (= Builder in org mode). Light for v2:
// editing deep-links into the existing Builder; we model shape + versions only.
export interface WorkbookLayout extends BaseEntity {
  orgId: UUID;
  name: string;
  // Workbook layouts are scoped per review profile (Commercial / Residential).
  // A review inherits the default layout for its profile automatically. One
  // default per profile (the store enforces it within a profile).
  profile: string;
  isDefault?: boolean;
  versions: WorkbookVersion[];
}

/* ============ Workbook analytical exhibits (compiled-doc data) ============ */
// The "evidence of property" the workbook is built to present — the analytical
// tables/charts the reviewer includes alongside their dispositions. Property-
// level data (one record per review), distinct from the live finding state.
// Conditions / returned items / action items are derived from dispositions; the
// exhibits below are static source data.

/** One row of the Sales Comparison adjustment grid (abbreviated $/SF view). */
export interface WbAdjustmentRow {
  comp: string;
  unadj: number; // unadjusted $/SF
  location: number; // signed % adjustment
  condition: number;
  quality: number;
  adj: number; // adjusted $/SF
  flag?: boolean; // the discrepancy comp — highlighted in the doc
}

/** A bar in the adjusted-$/SF-by-comparable chart. */
export interface WbBar {
  label: string;
  value: number;
  concluded?: boolean; // the reviewer's concluded figure (accent bar)
}

/** A point on the cap-rate comparison number-line. */
export interface WbCapPoint {
  label: string;
  value: number; // percent (e.g. 6.0)
  selected?: boolean; // the appraiser's selected rate
}

/** A column of the sensitivity heat table. */
export interface WbSensitivityCol {
  label: string;
  value: number; // indicated value at this input
  delta: number; // signed % vs the concluded value (0 = the selected column)
  selected?: boolean;
}

export interface WbSwot {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

/** A narrative section imported from the appraisal report into the workbook. */
export interface WbImportedSection {
  id: UUID;
  title: string;
  body: string;
}

export interface WorkbookExhibits {
  id: UUID; // one record per review (id === reviewId)
  reviewId: UUID;
  adjustmentGrid: WbAdjustmentRow[];
  psf: { bars: WbBar[]; note: string };
  capRate: { points: WbCapPoint[]; bandMin: number; bandMax: number; unit: string; note: string };
  sensitivity: { metric: string; cols: WbSensitivityCol[]; note: string };
  swot: WbSwot;
  imported: WbImportedSection[];
}

/* ============ A page of the source appraisal PDF (for side-by-side) ============ */
export interface SourcePage {
  page: number;
  heading: string;
  body: string; // simple text content
  highlight?: string; // substring to highlight when cited
}
