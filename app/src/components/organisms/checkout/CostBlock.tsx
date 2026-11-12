"use client";

import Link from "next/link";
import { CreditChip, Icon } from "@/components/atoms";
import { CREDIT_USD, REVIEW_TYPE_COST, costFor, formatUsd, usd } from "@/lib/pricing";
import "./cost-block.css";

/** The three ways to run a review (spec §5.6 Amount, §5.7). Every number from pricing.ts. */
export const COST_ROWS = [
  {
    id: "technical",
    title: "Technical",
    desc: "Every figure checked against the appraisal and your policy",
    credits: REVIEW_TYPE_COST.technical,
  },
  {
    id: "administrative",
    title: "Administrative",
    desc: "Your compliance checklist, item by item",
    credits: REVIEW_TYPE_COST.administrative,
  },
  {
    id: "both",
    title: "Both on one report",
    desc: "A full review, the usual choice for a commercial loan",
    credits: costFor(["technical", "administrative"]),
  },
] as const;

type ColId = (typeof COST_ROWS)[number]["id"];

/** What each review type gives you. "both" always includes everything. */
const FEATURES: { label: string; in: ColId[] }[] = [
  { label: "Every figure traced to its page in the appraisal", in: ["technical", "both"] },
  { label: "Valuation math re-run (DCF, cap rate, adjustments)", in: ["technical", "both"] },
  { label: "Findings checked against your credit policy", in: ["technical", "both"] },
  { label: "Compliance checklist answered item by item", in: ["administrative", "both"] },
  { label: "Signed workbook for the lender", in: ["technical", "both"] },
  { label: "Signed compliance attestation", in: ["administrative", "both"] },
];

export const HOW_CREDITS_HREF = "/configure/billing?tab=credits";

/**
 * "What does a review cost?" as a comparison table: the three review options as columns (credits
 * and list price in the header, "Both" highlighted as the usual choice), what each includes as
 * rows. Shared by checkout Amount and Billing → How credits work.
 * `compact` keeps only the header row (name, credits, price).
 * // DS-candidate: ComparisonTable — plan/option comparison; the DS table has no column highlight.
 */
export function CostBlock({
  compact = false,
  title = "What does a review cost?",
  showLink = true,
}: {
  compact?: boolean;
  title?: string;
  /** Drop the "How credits work" link (e.g. on the How credits work page itself). */
  showLink?: boolean;
}) {
  return (
    <section className={compact ? "cost-block cost-block--compact" : "cost-block"} aria-labelledby="cost-block-t">
      <h2 className="cost-block-title" id="cost-block-t">
        {title}
      </h2>
      <div className="cost-block-wrap">
        <table className="cost-block-table">
          <thead>
            <tr>
              <th scope="col" className="cost-block-corner">
                <span className="sr-only">What&rsquo;s included</span>
              </th>
              {COST_ROWS.map((c) => (
                <th key={c.id} scope="col" className={c.id === "both" ? "cost-block-col is-pick" : "cost-block-col"}>
                  {c.id === "both" && <span className="cost-block-tag">Usual for a commercial loan</span>}
                  <span className="cost-block-name">{c.title}</span>
                  <span className="cost-block-price">
                    <CreditChip tone="credit">
                      {c.credits} {c.credits === 1 ? "credit" : "credits"}
                    </CreditChip>
                    <span className="cost-block-usd">{formatUsd(usd(c.credits))}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          {!compact && (
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.label}>
                  <th scope="row" className="cost-block-feat">
                    {f.label}
                  </th>
                  {COST_ROWS.map((c) => {
                    const yes = f.in.includes(c.id);
                    return (
                      <td key={c.id} className={c.id === "both" ? "cost-block-cell is-pick" : "cost-block-cell"}>
                        {yes ? (
                          <span className="cost-block-yes">
                            <Icon name="check" size={16} />
                            <span className="sr-only">Included</span>
                          </span>
                        ) : (
                          <span className="cost-block-no">
                            <Icon name="minus" size={14} />
                            <span className="sr-only">Not included</span>
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      {!compact && showLink && (
        <p className="cost-block-foot">
          <span className="text-secondary">1 credit is about {formatUsd(CREDIT_USD)} at list price. </span>
          <Link href={HOW_CREDITS_HREF} className="cost-block-link">
            How credits work
          </Link>
        </p>
      )}
    </section>
  );
}
