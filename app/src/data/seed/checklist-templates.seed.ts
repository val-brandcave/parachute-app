import type { ChecklistTemplate, ChecklistTemplateItem } from "@/types";

// The bank's administrative-review compliance form, AI-extracted from a .docx
// and mapped into normalized questions. Drives Administrative Review at order
// time. 22 items / 3 groups; items 5 and 9 need attention (warn) — one is
// double-barrelled, one is ambiguous — mirroring the client mock's health
// stats (20 mapped · 2 need attention).
const NOW = 1781827200000;

const items: ChecklistTemplateItem[] = [
  /* ---- Report & Compliance ---- */
  {
    id: "ci-01",
    group: "Report & Compliance",
    orig: "Signed by certified appraiser?",
    question:
      "Is the report signed by a state-certified general appraiser, with license number disclosed?",
    type: "binary",
    map: "ok",
    requireCitation: true,
  },
  {
    id: "ci-02",
    group: "Report & Compliance",
    orig: "Client & intended users listed",
    question: "Are the client and all intended users explicitly identified?",
    type: "binary",
    map: "ok",
    requireCitation: true,
  },
  {
    id: "ci-03",
    group: "Report & Compliance",
    orig: "Dates OK?",
    question:
      "Are the effective date of value and the report date both clearly stated?",
    type: "binary",
    map: "ok",
    requireCitation: true,
  },
  {
    id: "ci-04",
    group: "Report & Compliance",
    orig: "USPAP / FIRREA statement present",
    question:
      "Does the report state conformance with USPAP and FIRREA / Interagency Guidelines?",
    type: "binary",
    map: "ok",
    requireCitation: true,
  },
  {
    id: "ci-05",
    group: "Report & Compliance",
    orig: "Definition of value and property rights appraised stated?",
    question: "Is the definition of value and the property rights appraised stated?",
    type: "binary",
    map: "ok",
    requireCitation: false,
  },
  {
    id: "ci-06",
    group: "Report & Compliance",
    orig: "Extraordinary assumptions / hypothetical conditions disclosed?",
    question:
      "Are any extraordinary assumptions or hypothetical conditions disclosed?",
    type: "qualitative",
    map: "ok",
    requireCitation: false,
  },
  /* ---- Valuation Approaches ---- */
  {
    id: "ci-07",
    group: "Valuation Approaches",
    orig: "Sales comp approach used and supported? Cap rate supported?",
    question: "Sales comp approach used and supported? Cap rate supported?",
    type: "qualitative",
    map: "warn",
    hint: "Double-barrelled: two questions detected in one row — split into Sales-comparison support and Cap-rate support.",
    requireCitation: true,
  },
  {
    id: "ci-08",
    group: "Valuation Approaches",
    orig: "At least 3 comps",
    question:
      "Are at least three comparable sales included in the Sales Comparison Approach?",
    type: "binary",
    map: "ok",
    requireCitation: true,
  },
  {
    id: "ci-09",
    group: "Valuation Approaches",
    orig: "Income approach reconciliation",
    question: "Is the final value reconciliation logical and adequately supported?",
    type: "qualitative",
    map: "ok",
    requireCitation: false,
  },
  {
    id: "ci-10",
    group: "Valuation Approaches",
    orig: "Cost approach or exclusion justified",
    question:
      "If the Cost Approach is excluded, is the exclusion explicitly justified?",
    type: "binary",
    map: "ok",
    requireCitation: true,
  },
  {
    id: "ci-11",
    group: "Valuation Approaches",
    orig: "Highest & best use analysis present?",
    question:
      "Is a highest-and-best-use analysis present and consistent with the conclusions?",
    type: "qualitative",
    map: "ok",
    requireCitation: false,
  },
  {
    id: "ci-12",
    group: "Valuation Approaches",
    orig: "Adjustments to comps explained?",
    question: "Are adjustments to the comparables explained and supported?",
    type: "qualitative",
    map: "ok",
    requireCitation: false,
  },
  {
    id: "ci-13",
    group: "Valuation Approaches",
    orig: "Exposure / marketing time stated?",
    question: "Are reasonable exposure time and marketing time stated?",
    type: "binary",
    map: "ok",
    requireCitation: false,
  },
  /* ---- Bank Policy & Special Considerations ---- */
  {
    id: "ci-14",
    group: "Bank Policy & Special Considerations",
    orig: "Special considerations addressed?",
    question: "Special considerations addressed?",
    type: "qualitative",
    map: "warn",
    hint: "Ambiguous: which considerations? Specify the bank-policy items this row should test.",
    requireCitation: false,
  },
  {
    id: "ci-15",
    group: "Bank Policy & Special Considerations",
    orig: "Environmental concerns noted",
    question:
      "Does the report address environmental or hazard concerns, if applicable?",
    type: "qualitative",
    map: "ok",
    requireCitation: false,
  },
  {
    id: "ci-16",
    group: "Bank Policy & Special Considerations",
    orig: "Contract price vs value gap explained",
    question:
      "If under contract, is any divergence between contract price and appraised value disclosed and explained?",
    type: "qualitative",
    map: "ok",
    requireCitation: true,
  },
  {
    id: "ci-17",
    group: "Bank Policy & Special Considerations",
    orig: "SBA: econ life ≥ 25y if SBA loan",
    question:
      "If SBA is an intended user, is remaining economic life stated and at least 25 years?",
    type: "binary",
    map: "ok",
    requireCitation: true,
  },
  {
    id: "ci-18",
    group: "Bank Policy & Special Considerations",
    orig: "Flood zone determination included?",
    question: "Is a flood-zone determination included where required by policy?",
    type: "binary",
    map: "ok",
    requireCitation: false,
  },
  {
    id: "ci-19",
    group: "Bank Policy & Special Considerations",
    orig: "Photos of subject and comps present?",
    question: "Are photographs of the subject and comparables present?",
    type: "binary",
    map: "ok",
    requireCitation: false,
  },
  {
    id: "ci-20",
    group: "Bank Policy & Special Considerations",
    orig: "Zoning compliance addressed?",
    question: "Is the subject's zoning compliance addressed?",
    type: "qualitative",
    map: "ok",
    requireCitation: false,
  },
  {
    id: "ci-21",
    group: "Bank Policy & Special Considerations",
    orig: "Personal property / FF&E excluded from value?",
    question:
      "Are personal property and FF&E excluded from the real-property value, or itemized if included?",
    type: "qualitative",
    map: "ok",
    requireCitation: false,
  },
  {
    id: "ci-22",
    group: "Bank Policy & Special Considerations",
    orig: "Bank policy exceptions documented?",
    question:
      "Are any exceptions to bank appraisal policy documented and approved?",
    type: "binary",
    map: "ok",
    requireCitation: false,
  },
];

export const seedChecklistTemplates: ChecklistTemplate[] = [
  {
    id: "checklist-demo-commercial",
    name: "Demo Bank — Commercial Review Form",
    sourceFile: "Meridian_Commercial_Review_Form.docx",
    version: 3,
    publishedAt: NOW - 38 * 86400000,
    usedInReviews: 14,
    items,
    createdAt: NOW - 120 * 86400000,
  },
];
