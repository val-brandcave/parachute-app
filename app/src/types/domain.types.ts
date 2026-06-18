import type { BaseEntity, UUID } from "./common.types";

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

/* ============ A page of the source appraisal PDF (for side-by-side) ============ */
export interface SourcePage {
  page: number;
  heading: string;
  body: string; // simple text content
  highlight?: string; // substring to highlight when cited
}
