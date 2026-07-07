import type { Finding } from "@/types";

const NOW = 1781827200000;

export const seedFindings: Finding[] = [
  {
    id: "finding-001",
    reviewId: "review-001",
    category: "Valuation Analysis",
    severity: "crit",
    status: "FAIL",
    confidence: 0.94,
    page: 47,
    question:
      "Are the sales comparables consistently adjusted across the Sales Comparison Approach?",
    analysis:
      "Comparable 2 is adjusted to a price of $500,000 in the adjustment grid but is summarized at $800,000 in the reconciliation narrative. A $300,000 unreconciled discrepancy materially affects the indicated value via the Sales Comparison Approach.",
    evidence:
      "“After adjustments, Comparable 2 indicates $500,000 …” (adjustment grid) vs. “Comparable 2, at $800,000, supports the concluded value…” (reconciliation narrative)",
    auditTag: "CORRECTED",
    auditText:
      "S3 Consistency cross-checked the adjustment grid against the reconciliation narrative and flagged a value mismatch on Comparable 2.",
    material: true,
    suggestedDisposition: "rejected",
    createdAt: NOW,
  },
  {
    id: "finding-002",
    reviewId: "review-001",
    category: "Income Approach",
    severity: "fail",
    status: "FAIL",
    confidence: 0.88,
    page: 61,
    question:
      "Is the capitalization rate supported and within the market-derived range?",
    analysis:
      "The applied overall cap rate of 5.25% falls below the market-derived range of 6.0%–7.5% cited from the appraiser's own survey. The unsupported compression overstates value by an estimated 12–18%.",
    evidence:
      "“A capitalization rate of 5.25% was selected…”, while the appraiser's own survey reports a range of 6.0%–7.5%.",
    auditTag: "FLAGGED",
    auditText:
      "S4 Analytics compared the selected cap rate against the report's cited survey range and the regional dataset.",
    material: true,
    suggestedDisposition: "override",
    createdAt: NOW,
  },
  {
    id: "finding-003",
    reviewId: "review-001",
    category: "Highest & Best Use",
    severity: "flag",
    status: "FLAG",
    confidence: 0.71,
    page: 33,
    question:
      "Does the Highest & Best Use analysis address the medical-office zoning overlay?",
    analysis:
      "The H&BU conclusion of “continued medical office” does not reference the recently adopted MX-2 overlay that permits higher-density mixed use. Worth confirming whether the as-improved conclusion still holds.",
    evidence:
      "“The highest and best use, as improved, is continued use as a medical office building.” (Highest & Best Use)",
    auditTag: "FLAGGED",
    auditText:
      "S2 Validation matched the parcel against the municipal zoning layer and noted an overlay not discussed in the report.",
    material: false,
    suggestedDisposition: "commented",
    createdAt: NOW,
  },
  {
    id: "finding-004",
    reviewId: "review-001",
    category: "Mathematical Accuracy",
    severity: "fail",
    status: "FAIL",
    confidence: 0.97,
    page: 58,
    question: "Do the net operating income calculations foot correctly?",
    analysis:
      "Effective Gross Income of $1,284,000 less Operating Expenses of $462,000 should yield NOI of $822,000; the report states $842,000 in the operating statement. A $20,000 arithmetic error flows through to the Income Approach conclusion.",
    evidence:
      "“EGI $1,284,000 − OpEx $462,000 = NOI $842,000” (operating statement)",
    auditTag: "CORRECTED",
    auditText:
      "S3 Consistency recomputed the income statement and detected a footing error.",
    material: true,
    suggestedDisposition: "rejected",
    createdAt: NOW,
  },
  {
    id: "finding-005",
    reviewId: "review-001",
    category: "USPAP Compliance",
    severity: "pass",
    status: "PASS",
    confidence: 0.96,
    page: 8,
    question:
      "Does the report contain a compliant Scope of Work and signed certification?",
    analysis:
      "Scope of Work is clearly stated and the certification is signed and dated by the appraiser with an active credential. No exceptions noted.",
    evidence:
      "“I certify that, to the best of my knowledge and belief…” — signed, dated, license #CG-44120 (Certification)",
    auditTag: "CONFIRMED",
    auditText:
      "S1 Checklist confirmed presence and completeness of the USPAP certification.",
    material: false,
    suggestedDisposition: "accepted",
    createdAt: NOW,
  },
  {
    id: "finding-006",
    reviewId: "review-001",
    category: "Cost Approach",
    severity: "pass",
    status: "PASS",
    confidence: 0.9,
    page: 64,
    question: "Is depreciation reasonably supported in the Cost Approach?",
    analysis:
      "Physical depreciation of 22% is consistent with the reported effective age of 11 years against a 50-year economic life. Method and figures reconcile.",
    evidence:
      "“Effective age 11 years; total economic life 50 years; 22% physical depreciation applied.” (Cost Approach)",
    auditTag: "CONFIRMED",
    auditText: "S4 Analytics validated the age-life depreciation computation.",
    material: false,
    suggestedDisposition: "accepted",
    createdAt: NOW,
  },
  {
    id: "finding-007",
    reviewId: "review-001",
    category: "Bank Policy",
    severity: "flag",
    status: "FLAG",
    confidence: 0.83,
    page: 12,
    question:
      "Does the engagement satisfy Meridian Trust Bank policy on comparable recency (≤18 months)?",
    analysis:
      "Two of five sale comparables closed 24 and 27 months prior to the effective date, exceeding the bank's 18-month recency policy. Permitted with commentary, but commentary is absent.",
    evidence:
      "Comparable 4 closed 24 months prior; Comparable 5 closed 27 months prior (adjustment grid).",
    auditTag: "FLAGGED",
    auditText:
      "S5 Policy applied Meridian Trust Bank's uploaded policy rules and flagged a recency exception lacking the required commentary.",
    material: false,
    suggestedDisposition: "commented",
    createdAt: NOW,
  },
];
