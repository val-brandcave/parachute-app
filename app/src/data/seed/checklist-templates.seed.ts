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

// Compact item builder for the additional seeded families.
function ci(
  id: string,
  group: string,
  question: string,
  opts: {
    orig?: string;
    type?: ChecklistTemplateItem["type"];
    map?: ChecklistTemplateItem["map"];
    hint?: string;
    cite?: boolean;
  } = {},
): ChecklistTemplateItem {
  return {
    id,
    group,
    orig: opts.orig ?? question,
    question,
    type: opts.type ?? "binary",
    map: opts.map ?? "ok",
    hint: opts.hint,
    requireCitation: opts.cite ?? false,
  };
}

const sbaItems: ChecklistTemplateItem[] = [
  ci("sba-01", "SBA Eligibility", "Is the SBA program (7(a) or 504) identified and the appraisal addressed to SBA as an intended user?", { cite: true }),
  ci("sba-02", "SBA Eligibility", "Is the property an eligible property type under SBA SOP requirements?"),
  ci("sba-03", "Economic Life", "Is remaining economic life stated and at least 25 years for the loan term?", { cite: true }),
  ci("sba-04", "Going Concern", "If a going concern, are business/real-estate/FF&E values separately allocated?", { type: "qualitative", cite: true }),
  ci("sba-05", "Going Concern", "Is the going-concern methodology disclosed and supported?", { type: "qualitative" }),
  ci("sba-06", "Special-Use", "For special-use properties, is the limited-market nature addressed?", { type: "qualitative" }),
  ci("sba-07", "Environmental", "Is an environmental questionnaire or report referenced where required?"),
  ci("sba-08", "Environmental", "Are any environmental conditions reflected in the value conclusion?", { type: "qualitative" }),
];

const resItems: ChecklistTemplateItem[] = [
  ci("res-01", "Report & Compliance", "Is the report on the correct form (1004 / 1073 / 1025) for the property type?", { cite: true }),
  ci("res-02", "Report & Compliance", "Are the client and intended users identified?", { cite: true }),
  ci("res-03", "Report & Compliance", "Are the effective date and report date stated?"),
  ci("res-04", "Report & Compliance", "Does the report conform with USPAP and the Interagency Guidelines?", { cite: true }),
  ci("res-05", "Subject & Site", "Is the subject's site size, zoning and utilities described?"),
  ci("res-06", "Subject & Site", "Is highest-and-best-use as-improved addressed?", { type: "qualitative" }),
  ci("res-07", "Subject & Site", "Are adverse site or external conditions disclosed?", { type: "qualitative" }),
  ci("res-08", "Valuation", "Are at least three closed comparable sales included?", { cite: true }),
  ci("res-09", "Valuation", "Are net and gross adjustment guidelines met or explained?", { type: "qualitative", map: "warn", hint: "Ambiguous: which guideline thresholds apply? Specify the bank-policy limits this row tests." }),
  ci("res-10", "Valuation", "Is the reconciliation logical and supported?", { type: "qualitative" }),
  ci("res-11", "Photos & Exhibits", "Are interior and exterior subject photos present?"),
  ci("res-12", "Photos & Exhibits", "Is a location map and sketch with GLA included?"),
];

const conItems: ChecklistTemplateItem[] = [
  ci("con-01", "Inspection", "Does the inspection percentage-complete match the draw request?", { cite: true }),
  ci("con-02", "Inspection", "Are dated site photos for this draw included?"),
  ci("con-03", "Inspection", "Are any deviations from approved plans noted?", { type: "qualitative" }),
  ci("con-04", "Budget & Draw", "Does work-in-place support the cumulative amount disbursed?", { cite: true }),
  ci("con-05", "Budget & Draw", "Is the remaining budget sufficient to complete (cost-to-complete)?", { type: "qualitative", cite: true }),
  ci("con-06", "Budget & Draw", "Are stored materials documented and secured?"),
  ci("con-07", "Lien & Compliance", "Are lien waivers collected for prior draws?"),
  ci("con-08", "Lien & Compliance", "Are required permits and inspections current?"),
  ci("con-09", "Schedule", "Is the project on schedule relative to the construction timeline?", { type: "qualitative" }),
];

const SOURCE_FILE = "Meridian_Commercial_Review_Form.docx";

// Three snapshots: the firm grew the form over time. v1/v2 are archived history
// (kept so in-flight reviews stay pinned); v3 is the published version every new
// review inherits. Earlier versions carry fewer items (the form was expanded).
export const seedChecklistTemplates: ChecklistTemplate[] = [
  {
    id: "checklist-demo-commercial",
    name: "Demo Bank — Commercial Review Form",
    usedInReviews: 14,
    isDefault: true, // the org-default admin checklist
    createdAt: NOW - 120 * 86400000,
    versions: [
      {
        id: "cv-commercial-1",
        version: 1,
        status: "archived",
        sourceFile: SOURCE_FILE,
        items: items.slice(0, 16),
        createdAt: NOW - 120 * 86400000,
        publishedAt: NOW - 118 * 86400000,
      },
      {
        id: "cv-commercial-2",
        version: 2,
        status: "archived",
        sourceFile: SOURCE_FILE,
        items: items.slice(0, 20),
        createdAt: NOW - 96 * 86400000,
        publishedAt: NOW - 95 * 86400000,
      },
      {
        id: "cv-commercial-3",
        version: 3,
        status: "published",
        sourceFile: SOURCE_FILE,
        items,
        createdAt: NOW - 45 * 86400000,
        publishedAt: NOW - 38 * 86400000,
      },
    ],
  },
  {
    id: "checklist-sba-addendum",
    name: "SBA 7(a) / 504 Addendum Checklist",
    usedInReviews: 6,
    createdAt: NOW - 80 * 86400000,
    versions: [
      {
        id: "cv-sba-1",
        version: 1,
        status: "archived",
        sourceFile: "SBA_Addendum_Checklist.docx",
        items: sbaItems.slice(0, 6),
        createdAt: NOW - 80 * 86400000,
        publishedAt: NOW - 78 * 86400000,
      },
      {
        id: "cv-sba-2",
        version: 2,
        status: "published",
        sourceFile: "SBA_Addendum_Checklist.docx",
        items: sbaItems,
        createdAt: NOW - 26 * 86400000,
        publishedAt: NOW - 22 * 86400000,
      },
    ],
  },
  {
    id: "checklist-residential",
    name: "Residential 1–4 Family Review Form",
    usedInReviews: 31,
    createdAt: NOW - 150 * 86400000,
    versions: [
      {
        id: "cv-res-1",
        version: 1,
        status: "published",
        sourceFile: "Residential_1_4_Family_Review.docx",
        items: resItems,
        createdAt: NOW - 150 * 86400000,
        publishedAt: NOW - 140 * 86400000,
      },
      {
        // An in-progress revision — showcases the "Draft in progress" state.
        id: "cv-res-2",
        version: 2,
        status: "draft",
        sourceFile: "Residential_1_4_Family_Review.docx",
        items: resItems,
        createdAt: NOW - 4 * 86400000,
      },
    ],
  },
  {
    id: "checklist-construction",
    name: "Construction / Draw Inspection Checklist",
    usedInReviews: 9,
    createdAt: NOW - 60 * 86400000,
    versions: [
      {
        id: "cv-con-1",
        version: 1,
        status: "published",
        sourceFile: "Construction_Draw_Inspection.docx",
        items: conItems,
        createdAt: NOW - 60 * 86400000,
        publishedAt: NOW - 55 * 86400000,
      },
    ],
  },
];

// The deep-linkable checklist family id (used by tests / docs).
export const DEMO_CHECKLIST_ID = "checklist-demo-commercial";
