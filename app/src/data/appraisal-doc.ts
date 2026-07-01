/**
 * Stand-in for the ORIGINAL appraisal PDF shown in the Exceptions proofing view.
 *
 * It models a believable 6-page condensed commercial appraisal — cover, letter of
 * transmittal + executive summary, scope + highest-and-best-use, the sales
 * comparison grid, the income approach, and the cost approach + certification.
 * Each finding's cited evidence lives here as an inline ANCHOR run (`anchor` =
 * the finding id), so the viewer can highlight the exact source span in context
 * and pin a numbered margin tag beside it. Sequential `n` (1..6) drives the page
 * counter; `reportPages` keeps the appraisal's own page labels (p.47, pp.56–61)
 * as a citation, matching what the findings + workbook reference.
 *
 * A few fields (address, firm, bank, loan #, dates, value) are interpolated from
 * the live review so the document is cohesive with the rest of the run; the
 * analytical content (comps, statements, rates) is representative seed data.
 */

/** An inline run of body text. `anchor` (a finding id) marks the span cited by a
 *  Technical finding; `attAnchor` (a checklist item id) marks the span cited by
 *  an Administrative attestation. A run may carry both when the same span is
 *  cited on each track; each viewer reads only its own field. */
export interface DocRun {
  text: string;
  anchor?: string;
  attAnchor?: string;
}

export type DocBlock =
  | { type: "h"; text: string }
  | { type: "p"; runs: DocRun[] }
  | { type: "facts"; rows: [string, string][] }
  | { type: "table"; caption?: string; head: string[]; rows: string[][]; note?: string }
  | { type: "note"; runs: DocRun[] }
  | { type: "figure"; label: string; caption: string };

export interface DocPage {
  /** Sequential page number in this rendered document (1..N). */
  n: number;
  /** The original report's own page label for this spread (citation continuity). */
  reportPages: string;
  /** Section title shown in the page's running header. */
  title: string;
  blocks: DocBlock[];
  cover?: boolean;
}

export interface AppraisalCtx {
  address: string;
  propertyType: string;
  firm: string;
  bank: string;
  loanNo: string;
  effectiveDate: string;
  reportDate: string;
}

const APPRAISER = "J. Patel, MAI — License #CG-44120";

/* The appraisal's OWN figures — fixed so the document reconciles internally
   (comps, NOI, and cap-rate evidence all sit at this scale, matching the
   findings that cite them). These are the source report's numbers, independent
   of the review's seeded value. */
const CONCLUDED_VALUE = "$9,850,000";
const LOAN_AMOUNT = "$6,400,000";

/** Plain run helper. */
const t = (text: string): DocRun => ({ text });

/** Build the 6-page appraisal for a given review context. */
export function buildAppraisalDoc(c: AppraisalCtx): DocPage[] {
  return [
    /* ---------------------------------------------------------------- p.1 */
    {
      n: 1,
      reportPages: "Cover",
      title: "Appraisal Report",
      cover: true,
      blocks: [
        { type: "h", text: "Self-Contained Appraisal Report" },
        {
          type: "p",
          runs: [t(`A complete appraisal of the real property located at ${c.address}.`)],
        },
        {
          type: "facts",
          rows: [
            ["Property", c.address],
            ["Property type", c.propertyType],
            ["Prepared for", c.bank],
            ["Prepared by", `${c.firm} · ${APPRAISER}`],
            ["Loan reference", `#${c.loanNo}`],
            ["Effective date of value", c.effectiveDate],
            ["Date of report", c.reportDate],
            ["Intended use", "Mortgage lending / collateral valuation"],
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- p.2 */
    {
      n: 2,
      reportPages: "pp. 1–5",
      title: "Letter of Transmittal & Executive Summary",
      blocks: [
        {
          type: "p",
          runs: [
            t(
              `In accordance with your request, we have appraised the above-referenced property for ${c.bank} for mortgage lending purposes. The subject is a ${c.propertyType.toLowerCase()} property held in fee simple. Based on the analysis that follows, and subject to the assumptions and limiting conditions of this report, `,
            ),
            {
              attAnchor: "ci-05",
              text: `our opinion of market value as of ${c.effectiveDate} is stated below.`,
            },
          ],
        },
        {
          type: "p",
          runs: [
            t(`The subject is identified as ${c.address}. `),
            {
              attAnchor: "ci-02",
              text: `The intended use of this appraisal is to assist ${c.bank} in a mortgage-lending decision; the intended users are ${c.bank}, its participants, and its regulators.`,
            },
            t(
              ` Use by any other party is neither intended nor authorized. A reasonable exposure time of nine to twelve months is estimated as of the effective date of value.`,
            ),
          ],
        },
        { type: "h", text: "Salient Facts & Property Identification" },
        {
          type: "facts",
          rows: [
            ["Property address", c.address],
            ["Property type", c.propertyType],
            ["Site area", "1.84 acres (80,150 SF)"],
            ["Gross building area", "16,420 SF"],
            ["Year built / renovated", "2004 / 2018"],
            ["Occupancy at inspection", "94% (multi-tenant)"],
          ],
        },
        { type: "h", text: "Value Indications by Approach" },
        {
          type: "table",
          head: ["Approach to value", "Indicated value", "Weight"],
          rows: [
            ["Sales Comparison Approach", CONCLUDED_VALUE, "Primary"],
            ["Income Capitalization Approach", CONCLUDED_VALUE, "Secondary / support"],
            ["Cost Approach", CONCLUDED_VALUE, "Support only"],
          ],
          note: "All three approaches were developed and reconciled; greatest weight is given to the Sales Comparison Approach, supported by the Income Capitalization Approach.",
        },
        {
          type: "p",
          runs: [
            t(
              "The Cost Approach is afforded limited weight given the effective age of the improvements and the limited number of recent land sales. The reconciled opinion of value and the principal terms of the engagement are summarized below.",
            ),
          ],
        },
        {
          type: "facts",
          rows: [
            ["Concluded market value", CONCLUDED_VALUE],
            ["Subject loan amount", LOAN_AMOUNT],
            ["Interest appraised", "Fee Simple"],
            ["Exposure / marketing time", "9–12 months"],
            ["Date of value", c.effectiveDate],
            ["Date of report", c.reportDate],
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- p.3 */
    {
      n: 3,
      reportPages: "pp. 6–33",
      title: "Scope of Work, Engagement & Highest and Best Use",
      blocks: [
        { type: "h", text: "Scope of Work & Engagement" },
        {
          type: "p",
          runs: [
            t(`This appraisal was prepared for ${c.bank} for mortgage lending purposes and `),
            {
              attAnchor: "ci-04",
              text: "conforms to the Uniform Standards of Professional Appraisal Practice (USPAP), the Interagency Appraisal and Evaluation Guidelines, and the bank's appraisal policy.",
            },
            t(
              ` The appraiser conducted an interior and exterior inspection of the subject, photographed the improvements, and confirmed site characteristics against public records.`,
            ),
          ],
        },
        {
          type: "p",
          runs: [
            t(
              "Market data were gathered from CoStar, county records, the multiple listing service, and direct broker confirmation. Five improved sale comparables were researched, verified, and analyzed. ",
            ),
            {
              anchor: "finding-007",
              text: "Comparable 4 closed 24 months prior to the effective date; Comparable 5 closed 27 months prior.",
            },
            t(
              " Bank policy requires comparables to have closed within 18 months of the effective date unless supported by additional commentary.",
            ),
          ],
        },
        {
          type: "note",
          runs: [
            {
              attAnchor: "ci-06",
              text: "Extraordinary assumptions: none. Hypothetical conditions: none.",
            },
            t(
              " The value opinion assumes the improvements are free of undisclosed structural or environmental defects.",
            ),
          ],
        },
        { type: "h", text: "Highest & Best Use" },
        {
          type: "p",
          runs: [
            t(
              "Highest and best use is the reasonably probable use of property that is legally permissible, physically possible, financially feasible, and maximally productive. The site is zoned O-1 (Office), which permits the existing improvements as a conforming use. ",
            ),
            {
              anchor: "finding-003",
              text: "The highest and best use, as improved, is continued use as a medical office building.",
            },
            t(
              " As-vacant analysis supports office or medical-office development consistent with surrounding uses.",
            ),
          ],
        },
        {
          type: "p",
          runs: [
            t(
              "The four tests support this conclusion: continued medical-office use is legally permissible under current zoning, physically accommodated by the existing improvements, financially feasible at prevailing rents and occupancy, and maximally productive relative to alternative uses given the subject's location within an established medical corridor.",
            ),
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- p.4 */
    {
      n: 4,
      reportPages: "pp. 45–52",
      title: "Sales Comparison Approach",
      blocks: [
        {
          type: "p",
          runs: [
            t(
              "The Sales Comparison Approach analyzes recent arm's-length transactions of properties comparable to the subject. Five improved sales were selected, verified, and adjusted to the subject for property rights conveyed, financing terms, conditions of sale, market conditions (time), location, and physical characteristics. The adjustment grid below summarizes the unadjusted and adjusted indications.",
            ),
          ],
        },
        {
          type: "table",
          caption: "Sales comparison adjustment grid (abbreviated)",
          head: ["Comparable", "Sale price", "$/SF", "Net adj.", "Adjusted", "Closed"],
          rows: [
            ["Comparable 1", "$8,940,000", "$612", "−4%", "$588 / SF", "5 mo prior"],
            ["Comparable 2", "$500,000", "—", "applied", "$500,000", "8 mo prior"],
            ["Comparable 3", "$9,210,000", "$604", "−1%", "$596 / SF", "11 mo prior"],
            ["Comparable 4", "$8,375,000", "$571", "+6% (time)", "$605 / SF", "24 mo prior"],
            ["Comparable 5", "$8,120,000", "$559", "+7% (time)", "$598 / SF", "27 mo prior"],
          ],
        },
        {
          type: "p",
          runs: [
            t(
              "Time adjustments were applied to the older transactions at approximately 3% per annum to reflect improving market conditions. Comparables 1 and 3 are the most similar in size, age, and tenancy and required the smallest net adjustments; they are afforded the greatest weight. After all adjustments, the comparables indicate a tight range of $588 to $605 per square foot.",
            ),
          ],
        },
        { type: "h", text: "Reconciliation of the Sales Comparison Approach" },
        {
          type: "p",
          runs: [
            t("After adjustments, "),
            {
              anchor: "finding-001",
              text: "Comparable 2 indicates $500,000",
            },
            t(
              ` in the grid above. In the narrative reconciliation, Comparable 2 is summarized at $800,000 and, together with Comparables 1 and 3, supports a concluded value via the Sales Comparison Approach of ${CONCLUDED_VALUE}.`,
            ),
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- p.5 */
    {
      n: 5,
      reportPages: "pp. 56–61",
      title: "Income Capitalization Approach",
      blocks: [
        {
          type: "p",
          runs: [
            t(
              "The Income Capitalization Approach converts the subject's anticipated income into a value indication via direct capitalization. The subject is 94% occupied by a mix of medical and general-office tenants on multi-year leases with contractual escalations. Market rent was concluded from a survey of competing space and applied to the rentable area to derive potential gross income.",
            ),
          ],
        },
        {
          type: "table",
          caption: "Stabilized operating statement",
          head: ["Line item", "Amount"],
          rows: [
            ["Potential Gross Income (PGI)", "$1,352,000"],
            ["Vacancy & collection loss (5%)", "($68,000)"],
            ["Effective Gross Income (EGI)", "$1,284,000"],
            ["Total operating expenses", "($462,000)"],
            ["Net Operating Income (NOI)", "$842,000"],
          ],
        },
        {
          type: "note",
          runs: [
            t("Net operating income is reported as "),
            { anchor: "finding-004", text: "EGI $1,284,000 − OpEx $462,000 = NOI $842,000" },
            t("."),
          ],
        },
        {
          type: "p",
          runs: [
            t(
              "Operating expenses include management at 4% of EGI, real estate taxes, insurance, utilities, repairs and maintenance, and a reserve for replacements. The resulting expense ratio of approximately 36% is consistent with comparable multi-tenant medical-office assets in the market.",
            ),
          ],
        },
        { type: "h", text: "Capitalization Rate & Direct Capitalization" },
        {
          type: "p",
          runs: [
            t(
              "Investor surveys and recent transactions for comparable medical-office assets indicate overall capitalization rates ranging from 6.0% to 7.5%, with a central tendency near 6.6%. ",
            ),
            {
              anchor: "finding-002",
              attAnchor: "ci-07",
              text: "A capitalization rate of 5.25% was selected",
            },
            t(
              " based on the subject's quality and tenancy. Applying the selected rate to NOI yields the indicated value via the Income Approach.",
            ),
          ],
        },
      ],
    },

    /* ---------------------------------------------------------------- p.6 */
    {
      n: 6,
      reportPages: "pp. 62–64",
      title: "Cost Approach, Reconciliation & Certification",
      blocks: [
        { type: "h", text: "Cost Approach — Depreciation" },
        {
          type: "p",
          runs: [
            t("Replacement cost new was estimated and depreciated for age and condition. "),
            {
              anchor: "finding-006",
              text: "Effective age 11 years; total economic life 50 years; 22% physical depreciation applied.",
            },
            t(
              " External and functional obsolescence were considered and found negligible.",
            ),
          ],
        },
        {
          type: "p",
          runs: [
            t(
              "Land value was estimated by comparison to recent commercial land sales and added to the depreciated cost of the improvements and site work. Because the improvements are well-maintained and the depreciation estimate is reliable, the Cost Approach provides reasonable support for, but is given less weight than, the other two approaches.",
            ),
          ],
        },
        { type: "h", text: "Final Reconciliation" },
        {
          type: "p",
          runs: [
            t(
              `Greatest weight is given to the Sales Comparison Approach, supported by the Income Approach. The reconciled opinion of market value of the fee simple interest, as improved, as of ${c.effectiveDate}, is ${CONCLUDED_VALUE}.`,
            ),
          ],
        },
        { type: "h", text: "Assumptions & Limiting Conditions" },
        {
          type: "note",
          runs: [
            t(
              "This appraisal is subject to the following, among others: title is assumed marketable; no responsibility is assumed for matters legal in nature; the property is assumed to comply with applicable zoning and environmental regulations; information furnished by others is believed reliable but is not guaranteed; and the appraiser is not required to give testimony unless arrangements have been made in advance.",
            ),
          ],
        },
        { type: "h", text: "Certification" },
        {
          type: "p",
          runs: [
            {
              anchor: "finding-005",
              text: "I certify that, to the best of my knowledge and belief, the statements of fact contained in this report are true and correct.",
            },
            t(
              ` The reported analyses, opinions, and conclusions are my personal, impartial, and unbiased professional analyses. Appraiser: ${APPRAISER}. Effective date: ${c.effectiveDate}.`,
            ),
          ],
        },
      ],
    },
  ];
}
