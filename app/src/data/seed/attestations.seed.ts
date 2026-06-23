import type { Attestation } from "@/types";

// Per-review AI pre-fill for the Administrative review of review-001. Each row is
// keyed to a ChecklistTemplateItem id (ci-01…ci-22) on the org-default
// "Demo Bank — Commercial Review Form" (v3 published) — the item's question and
// group come from that template (single source of truth); this seed is the
// per-review layer the AI produces when the Administrative pipeline runs against
// the appraisal. Parallel to findings.seed for the Technical pipeline.
//
// "Needs attention" (AI answered NO, or confidence < 0.85) is intentionally
// spread across a handful of items so the focus-mode filter and coverage panel
// have something to surface: ci-06, ci-07, ci-09, ci-14, ci-16, ci-20.
const NOW = 1781827200000;

type Row = Omit<Attestation, "reviewId" | "createdAt">;

const rows: Row[] = [
  /* ---- Report & Compliance ---- */
  {
    id: "att-001",
    itemId: "ci-01",
    aiAnswer: "YES",
    confidence: 0.99,
    page: 1,
    evidence:
      "Signature page: “Certified General Real Estate Appraiser,” license no. disclosed (redacted in the copy of record).",
  },
  {
    id: "att-002",
    itemId: "ci-02",
    aiAnswer: "YES",
    confidence: 0.97,
    page: 3,
    evidence:
      "“Intended user: the lender, its successors and assigns. Intended use: business and credit decisions.”",
  },
  {
    id: "att-003",
    itemId: "ci-03",
    aiAnswer: "YES",
    confidence: 1,
    page: 2,
    evidence: "Effective date of value: Jan 9, 2024. Date of report: Jan 22, 2024.",
  },
  {
    id: "att-004",
    itemId: "ci-04",
    aiAnswer: "YES",
    confidence: 0.88,
    page: 1,
    evidence:
      "“…conforms to Title XI Regulations and FIRREA, as updated by the 2010 Interagency Appraisal Guidelines.”",
  },
  {
    id: "att-005",
    itemId: "ci-05",
    aiAnswer: "YES",
    confidence: 0.93,
    page: 6,
    evidence:
      "Market Value defined per the Interagency definition; property rights appraised: Fee Simple.",
  },
  {
    id: "att-006",
    itemId: "ci-06",
    aiAnswer: "YES",
    confidence: 0.82,
    page: 7,
    evidence:
      "An extraordinary assumption regarding the environmental condition is noted on p.7 — confirm it is carried consistently into the value conclusion.",
  },
  /* ---- Valuation Approaches ---- */
  {
    id: "att-007",
    itemId: "ci-07",
    aiAnswer: "NO",
    confidence: 0.84,
    page: 61,
    evidence:
      "Sales-comparison support is adequate, but the selected 5.25% cap rate (p.61) falls below the appraiser's own surveyed 6.0%–7.5% range (p.60). The cap-rate leg of this item is not supported.",
  },
  {
    id: "att-008",
    itemId: "ci-08",
    aiAnswer: "YES",
    confidence: 0.99,
    page: 45,
    evidence: "Five closed comparable sales are presented in the adjustment grid (pp.45–47).",
  },
  {
    id: "att-009",
    itemId: "ci-09",
    aiAnswer: "YES",
    confidence: 0.8,
    page: 52,
    evidence:
      "A reconciliation is present but leans almost entirely on the Income Approach; the weighting rationale across approaches is thin.",
  },
  {
    id: "att-010",
    itemId: "ci-10",
    aiAnswer: "YES",
    confidence: 0.9,
    page: 40,
    evidence:
      "The Cost Approach is excluded; the exclusion is justified by the age of the improvements and limited cost data.",
  },
  {
    id: "att-011",
    itemId: "ci-11",
    aiAnswer: "YES",
    confidence: 0.86,
    page: 33,
    evidence:
      "Highest-and-best-use as-improved is concluded as continued medical-office use, consistent with the valuation.",
  },
  {
    id: "att-012",
    itemId: "ci-12",
    aiAnswer: "YES",
    confidence: 0.87,
    page: 47,
    evidence: "Adjustments are itemized in the grid with paired-sales and market support discussed.",
  },
  {
    id: "att-013",
    itemId: "ci-13",
    aiAnswer: "YES",
    confidence: 0.95,
    page: 58,
    evidence: "Exposure time of 9 months and marketing time of 9 months are both stated.",
  },
  /* ---- Bank Policy & Special Considerations ---- */
  {
    id: "att-014",
    itemId: "ci-14",
    aiAnswer: "NA",
    confidence: 0.7,
    page: 21,
    evidence:
      "No bank-policy special considerations were identified for this property type — confirm against the current policy schedule before attesting.",
  },
  {
    id: "att-015",
    itemId: "ci-15",
    aiAnswer: "YES",
    confidence: 0.85,
    page: 72,
    evidence:
      "A Phase I environmental report is referenced in the addenda; no recognized environmental conditions are noted.",
  },
  {
    id: "att-016",
    itemId: "ci-16",
    aiAnswer: "NO",
    confidence: 0.9,
    page: 5,
    evidence:
      "The subject is under contract at $4,650,000 against a concluded value of $4,200,000. The 10.7% divergence is disclosed but not explained.",
  },
  {
    id: "att-017",
    itemId: "ci-17",
    aiAnswer: "NA",
    confidence: 0.96,
    page: 1,
    evidence: "This is not an SBA loan; SBA is not identified as an intended user.",
  },
  {
    id: "att-018",
    itemId: "ci-18",
    aiAnswer: "YES",
    confidence: 0.94,
    page: 4,
    evidence: "Flood Zone X determined via InterFlood, cited under Data Sources (p.4).",
  },
  {
    id: "att-019",
    itemId: "ci-19",
    aiAnswer: "YES",
    confidence: 1,
    page: 12,
    evidence: "Subject photographs appear on pp.12–15; comparable data sheets are in the addenda.",
  },
  {
    id: "att-020",
    itemId: "ci-20",
    aiAnswer: "YES",
    confidence: 0.83,
    page: 30,
    evidence:
      "Zoning is stated as O-1; legal-conforming status is implied by the narrative but not expressly confirmed.",
  },
  {
    id: "att-021",
    itemId: "ci-21",
    aiAnswer: "NA",
    confidence: 0.91,
    page: 21,
    evidence: "Subject is an office building with no FF&E or going-concern component to separate.",
  },
  {
    id: "att-022",
    itemId: "ci-22",
    aiAnswer: "YES",
    confidence: 0.86,
    page: 1,
    evidence: "No exceptions to the bank's appraisal policy are taken in the report.",
  },
];

export const seedAttestations: Attestation[] = rows.map((r) => ({
  ...r,
  reviewId: "review-001",
  createdAt: NOW,
}));
