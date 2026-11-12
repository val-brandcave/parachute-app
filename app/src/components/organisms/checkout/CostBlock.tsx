"use client";

import Link from "next/link";
import { CreditChip } from "@/components/atoms";
import { CREDIT_USD, REVIEW_TYPE_COST, costFor, formatUsd, usd } from "@/lib/pricing";
import "./cost-block.css";

/** "What does a review cost?" rows (spec §5.6 Amount, §5.7). Shared by checkout and How
 *  credits work. Every number from pricing.ts. `compact` drops the descriptions and the link. */
export const COST_ROWS = [
  {
    id: "technical",
    title: "Technical review",
    desc: "Every figure checked against the appraisal and your policy",
    credits: REVIEW_TYPE_COST.technical,
  },
  {
    id: "administrative",
    title: "Administrative review",
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

export const HOW_CREDITS_HREF = "/configure/billing?tab=credits";

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
    <section className={compact ? "cost-block cost-block--compact" : "cost-block"} aria-label={title}>
      <h3 className="cost-block-title">{title}</h3>
      <ul className="cost-block-rows">
        {COST_ROWS.map((r) => (
          <li key={r.id} className="cost-block-row">
            <span className="cost-block-name">
              <span className="cost-block-label">{r.title}</span>
              {!compact && <span className="cost-block-desc tw-pretty">{r.desc}</span>}
            </span>
            <CreditChip tone="credit" className="cost-block-credits">
              {r.credits} {r.credits === 1 ? "credit" : "credits"}
            </CreditChip>
            <span className="cost-block-usd mono">{formatUsd(usd(r.credits))}</span>
          </li>
        ))}
      </ul>
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
