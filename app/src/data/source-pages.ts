import type { SourcePage } from "@/types";

/**
 * Stand-in for the appraisal PDF. The Technical Review side-by-side viewer
 * opens the cited page and highlights the relevant excerpt. Keyed by page #.
 */
export const SOURCE_PAGES: Record<number, SourcePage> = {
  8: {
    page: 8,
    heading: "Certification",
    body: "I certify that, to the best of my knowledge and belief, the statements of fact contained in this report are true and correct. The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions and are my personal, impartial, and unbiased professional analyses, opinions, and conclusions.\n\nAppraiser: J. Patel, MAI — License #CG-44120 — Effective Date: April 2, 2026.",
    highlight:
      "I certify that, to the best of my knowledge and belief, the statements of fact contained in this report are true and correct.",
  },
  12: {
    page: 12,
    heading: "Scope of Work & Engagement",
    body: "This appraisal was prepared for Meridian Trust Bank, N.A. for mortgage lending purposes. Five improved sale comparables were analyzed. Comparable 4 closed 24 months prior to the effective date; Comparable 5 closed 27 months prior. Bank policy requires comparables within 18 months of the effective date unless supported by commentary.",
    highlight:
      "Comparable 4 closed 24 months prior to the effective date; Comparable 5 closed 27 months prior.",
  },
  33: {
    page: 33,
    heading: "Highest & Best Use",
    body: "The site is zoned O-1 (Office). The highest and best use, as improved, is continued use as a medical office building. As-vacant analysis supports office or medical office development consistent with surrounding uses.",
    highlight:
      "The highest and best use, as improved, is continued use as a medical office building.",
  },
  47: {
    page: 47,
    heading: "Sales Comparison Approach — Adjustment Grid",
    body: "Comparable 1: $612 / SF — adjusted to $588 / SF.\nComparable 2: gross adjustments applied. After adjustments, Comparable 2 indicates $500,000.\nComparable 3: $604 / SF — adjusted to $596 / SF.\nComparable 4 (24 mo): time-adjusted.\nComparable 5 (27 mo): time-adjusted.",
    highlight: "After adjustments, Comparable 2 indicates $500,000",
  },
  52: {
    page: 52,
    heading: "Reconciliation of Value",
    body: "Greatest weight is given to the Sales Comparison Approach. Comparable 2, at $800,000, supports the concluded value alongside Comparables 1 and 3. The reconciled value via the Sales Comparison Approach is concluded at $9,850,000.",
    highlight: "Comparable 2, at $800,000, supports the concluded value",
  },
  58: {
    page: 58,
    heading: "Income Approach — Operating Statement",
    body: "Potential Gross Income: $1,352,000.\nVacancy & Collection Loss (5%): ($68,000).\nEffective Gross Income: $1,284,000.\nTotal Operating Expenses: $462,000.\nEGI $1,284,000 − OpEx $462,000 = NOI $842,000.",
    highlight: "EGI $1,284,000 − OpEx $462,000 = NOI $842,000",
  },
  60: {
    page: 60,
    heading: "Capitalization Rate Survey",
    body: "Investor surveys and recent transactions for comparable medical office assets indicate overall capitalization rates ranging from 6.0% to 7.5%, with a central tendency near 6.6%.",
    highlight: "ranging from 6.0% to 7.5%",
  },
  61: {
    page: 61,
    heading: "Income Approach — Direct Capitalization",
    body: "A capitalization rate of 5.25% was selected based on the subject's quality and tenancy. Applying the selected rate to NOI yields the indicated value via the Income Approach.",
    highlight: "A capitalization rate of 5.25% was selected",
  },
  64: {
    page: 64,
    heading: "Cost Approach — Depreciation",
    body: "Effective age 11 years; total economic life 50 years; 22% physical depreciation applied. External and functional obsolescence were considered and found negligible.",
    highlight: "22% physical depreciation applied",
  },
};
