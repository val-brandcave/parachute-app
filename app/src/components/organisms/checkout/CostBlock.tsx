"use client";

import Link from "next/link";
import { CreditChip } from "@/components/atoms";
import { CREDIT_USD, REVIEW_TYPE_COST, costFor, formatUsd, usd } from "@/lib/pricing";
import "./cost-block.css";

/** The three ways to run a review (spec §5.6 Amount, §5.7). Every number from pricing.ts. */
export const COST_ROWS = [
  {
    id: "technical",
    title: "Technical",
    desc: "Checking the valuation: every figure, the math and your credit policy",
    credits: REVIEW_TYPE_COST.technical,
  },
  {
    id: "administrative",
    title: "Administrative",
    desc: "Checking compliance: your checklist, answered item by item",
    credits: REVIEW_TYPE_COST.administrative,
  },
  {
    id: "both",
    title: "Both on one report",
    desc: "A complete review of one appraisal",
    credits: costFor(["technical", "administrative"]),
  },
] as const;

export const HOW_CREDITS_HREF = "/configure/billing?tab=credits";

/**
 * "What does a review cost?" as a small price list: the three ways to run a review as columns,
 * and three rows — credits used, cost at list price, best for. Explains how reviews consume
 * credits; it doesn't sell features or recommend an option. Shared by checkout Amount and
 * Billing → How credits work. `compact` keeps only the credits and cost rows.
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
              <td className="cost-block-corner" />
              {COST_ROWS.map((c) => (
                <th key={c.id} scope="col" className="cost-block-col">
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="cost-block-k">
                Credits used
              </th>
              {COST_ROWS.map((c) => (
                <td key={c.id} className="cost-block-v">
                  <CreditChip tone="credit">
                    {c.credits} {c.credits === 1 ? "credit" : "credits"}
                  </CreditChip>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="cost-block-k">
                Cost
                <span className="cost-block-kn">at {formatUsd(CREDIT_USD)} a credit</span>
              </th>
              {COST_ROWS.map((c) => (
                <td key={c.id} className="cost-block-v cost-block-usd">
                  {formatUsd(usd(c.credits))}
                </td>
              ))}
            </tr>
            {!compact && (
              <tr>
                <th scope="row" className="cost-block-k">
                  Best for
                </th>
                {COST_ROWS.map((c) => (
                  <td key={c.id} className="cost-block-v cost-block-desc tw-pretty">
                    {c.desc}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!compact && showLink && (
        <p className="cost-block-foot">
          <span className="text-secondary">Bigger packs lower the price per credit. </span>
          <Link href={HOW_CREDITS_HREF} className="cost-block-link">
            How credits work
          </Link>
        </p>
      )}
    </section>
  );
}
