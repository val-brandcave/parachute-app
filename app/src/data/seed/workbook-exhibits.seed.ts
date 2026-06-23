import type { WorkbookExhibits } from "@/types";

// Analytical exhibits for the compiled workbook, keyed 1:1 to a review. Numbers
// are kept internally consistent with the review-001 findings seed: the selected
// 5.25% cap rate sits BELOW the market-derived 6.0–7.5% range (finding-002), and
// the sensitivity table shows how correcting it moves the indicated value. Demo
// data — the real product would derive these from the appraisal extraction.

export const seedWorkbookExhibits: WorkbookExhibits[] = [
  {
    id: "review-001",
    reviewId: "review-001",
    adjustmentGrid: [
      { comp: "Comparable 1", unadj: 372, location: 5, condition: 0, quality: 1, adj: 394 },
      { comp: "Comparable 2", unadj: 340, location: -5, condition: -5, quality: 0, adj: 307, flag: true },
      { comp: "Comparable 3", unadj: 310, location: 3, condition: 3, quality: 0, adj: 328 },
      { comp: "Comparable 4", unadj: 402, location: 0, condition: -2, quality: -1.5, adj: 388 },
      { comp: "Comparable 5", unadj: 366, location: 4, condition: 1, quality: 2, adj: 391 },
    ],
    psf: {
      bars: [
        { label: "Comp 1", value: 394 },
        { label: "Comp 2", value: 307 },
        { label: "Comp 3", value: 328 },
        { label: "Comp 4", value: 388 },
        { label: "Comp 5", value: 391 },
        { label: "Concluded", value: 355, concluded: true },
      ],
      note: "Adjusted $/SF across the comparable set; the concluded $355/SF sits mid-range, consistent with the subject's quality tier.",
    },
    capRate: {
      points: [
        { label: "Selected", value: 5.25, selected: true },
        { label: "Low", value: 6.0 },
        { label: "Survey", value: 6.75 },
        { label: "High", value: 7.5 },
      ],
      bandMin: 6.0,
      bandMax: 7.5,
      unit: "%",
      note: "The selected 5.25% OAR falls 75 bps below the market-derived range (6.0%–7.5%) cited in the report — see Finding (Income Approach, p.61).",
    },
    sensitivity: {
      metric: "Indicated value at overall cap-rate shifts (NOI held constant)",
      cols: [
        { label: "4.75%", value: 6_300_000, delta: 21.2 },
        { label: "5.25% (selected)", value: 5_200_000, delta: 0, selected: true },
        { label: "6.75% (market)", value: 4_040_000, delta: -22.3 },
      ],
      note: "Correcting the cap rate to the market mid-point would reduce the indicated value by roughly 22%, confirming the materiality of the finding.",
    },
    swot: {
      strengths: [
        "Stabilized medical-office occupancy with credit tenancy",
        "Building renovated 2025; effective age well below chronological",
        "Strong infill location within an established medical corridor",
      ],
      weaknesses: [
        "Selected cap rate below the market-derived range (value-sensitive)",
        "Single-building, two-tenant concentration limits diversification",
      ],
      opportunities: [
        "Recently adopted MX-2 overlay permits higher-density mixed use",
        "In-place rents trail market; mark-to-market upside on renewal",
      ],
      threats: [
        "Anchor-tenant lease rollover within the holding period",
        "Rate environment pressures exit-cap assumptions",
      ],
    },
    imported: [
      {
        id: "imp-recon",
        title: "Reconciliation of Value",
        body: "The appraiser reconciled the Sales Comparison and Income Capitalization approaches, assigning primary weight to the Income Approach given the most-likely buyer is an investor. The Cost Approach was developed as a support check only.",
      },
      {
        id: "imp-hbu",
        title: "Highest & Best Use",
        body: "As-improved analysis applying the four tests — legally permissible, physically possible, financially feasible, and maximally productive — concluded continued use as a medical-office building. The MX-2 overlay was noted but not analysed.",
      },
      {
        id: "imp-scope",
        title: "Scope of Work",
        body: "Interior and exterior inspection on the effective date, market data research, and application of the Sales Comparison and Income Capitalization approaches in conformance with USPAP Standard 1.",
      },
    ],
  },
];
