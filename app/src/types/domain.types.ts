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
  | "override"
  | "rejected"
  | "commented";

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
}

/* Per-finding reviewer state (lives in the workspace store). */
export interface FindingState {
  disposition: Disposition;
  reason?: string;
  comment?: string;
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

// A bank's administrative-review form: uploaded as .docx → AI-extracted →
// mapped → versioned/published. Drives Administrative Review. Org-owned.
export interface ChecklistTemplate extends BaseEntity {
  name: string;
  sourceFile: string; // e.g. "Meridian_Commercial_Review_Form.docx"
  version: number;
  publishedAt?: Timestamp;
  usedInReviews: number;
  items: ChecklistTemplateItem[];
}

// One section of an org-default workbook layout.
export interface WorkbookLayoutSection {
  id: UUID;
  title: string;
  type: string; // findings | summary | exhibits | conclusion | ...
  enabled: boolean;
}

// Org-default workbook section layout (= Builder in org mode). Light for v2:
// editing deep-links into the existing Builder; we model shape + version only.
export interface WorkbookLayout extends BaseEntity {
  orgId: UUID;
  name: string;
  theme: string; // e.g. "Navy"
  version: number;
  sections: WorkbookLayoutSection[];
}

/* ============ A page of the source appraisal PDF (for side-by-side) ============ */
export interface SourcePage {
  page: number;
  heading: string;
  body: string; // simple text content
  highlight?: string; // substring to highlight when cited
}
