"use client";

import { useMemo } from "react";
import { Modal } from "@/components/atoms";
import { pipelineView, outcomeView } from "@/lib/review-lifecycle";
import { relativeDue } from "@/lib/utils";
import { valueSummary, formatMoney, formatLongDate } from "@/lib/workbook";
import type { Review } from "@/types";

/**
 * Review summary — the click-to-open reference card for a review (replaces the
 * cramped hover popover that lived on the context-bar ⓘ). A focused, scrollable
 * `Modal` laying the metadata out in grouped sections: Property · Valuation ·
 * Engagement & parties · Status. Read-only; everything is derived from the
 * review (valuation figures via `lib/workbook#valueSummary`, lifecycle via
 * `lib/review-lifecycle`).
 */

const RISK_TONE: Record<string, string> = {
  low: "var(--md-success)",
  moderate: "var(--md-warn)",
  elevated: "var(--md-error)",
};

const OUTCOME_TONE: Record<string, string> = {
  pass: "var(--md-success)",
  flag: "var(--md-warn)",
  fail: "var(--md-error)",
  crit: "var(--md-crit)",
  info: "var(--md-info)",
  neutral: "var(--md-on-surface)",
};

export function ReviewSummaryModal({
  open,
  onClose,
  review,
  reviewerName,
}: {
  open: boolean;
  onClose: () => void;
  review: Review;
  reviewerName: string;
}) {
  const value = useMemo(() => valueSummary(review), [review]);
  const pipe = pipelineView(review);
  const outcome = outcomeView(review);
  const due = relativeDue(review.slaDueAt);

  const reviewType =
    review.reviewTypes
      .map((t) => (t === "technical" ? "Technical" : "Administrative"))
      .join(" + ") || "—";
  const risk = review.riskRating;

  return (
    <Modal open={open} onClose={onClose} title="Review summary" size="sm">
      <div className="rs">
        <header className="rs-id">
          <div className="rs-id-title">{review.propertyAddress}</div>
          <div className="rs-id-sub">
            {review.propertyType} · Loan #{review.loanNo}
          </div>
        </header>

        <Group title="Property">
          <Row label="Address" value={review.propertyAddress} />
          <Row label="Type" value={review.propertyType} />
          <Row label="Property rights" value={value.rights} />
          <Row label="Approaches developed" value={value.approaches.join(" · ")} />
        </Group>

        <Group title="Valuation">
          <Row label="Concluded market value" value={formatMoney(value.concludedValue)} strong />
          <Row label="Loan amount" value={formatMoney(value.loanAmount)} />
          <Row label="Loan-to-value" value={`${Math.round(value.ltv * 100)}%`} />
          <Row label="Effective date" value={formatLongDate(value.effectiveDate)} />
        </Group>

        <Group title="Engagement & parties">
          <Row label="Lender" value={review.bank} />
          <Row label="Appraisal firm" value={review.appraisalFirm} />
          <Row label="Reviewer" value={reviewerName} />
          <Row label="Review type" value={reviewType} />
          <Row label="Order source" value={review.source === "yc" ? "YouConnect" : "Manual upload"} />
        </Group>

        <Group title="Status">
          <Row label="Pipeline" value={pipe.label} />
          {outcome && (
            <Row label="Findings outcome" value={outcome.label} color={OUTCOME_TONE[outcome.tone]} />
          )}
          <Row
            label="Open findings"
            value={`${review.openFindings} open · ${review.flaggedCount} flagged`}
          />
          {risk && (
            <Row
              label="Risk rating"
              value={`${risk[0].toUpperCase()}${risk.slice(1)}`}
              color={RISK_TONE[risk]}
            />
          )}
          <Row
            label="SLA"
            value={due.label}
            color={due.tone === "overdue" ? "var(--md-error)" : undefined}
          />
          <Row label="Ordered" value={formatLongDate(review.orderedAt)} />
        </Group>
      </div>
    </Modal>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rs-group">
      <h3 className="rs-group-h">{title}</h3>
      <dl className="rs-rows">{children}</dl>
    </section>
  );
}

function Row({
  label,
  value,
  strong,
  color,
}: {
  label: string;
  value: string;
  strong?: boolean;
  color?: string;
}) {
  return (
    <div className="rs-row">
      <dt>{label}</dt>
      <dd className={strong ? "is-strong" : undefined} style={color ? { color } : undefined}>
        {value}
      </dd>
    </div>
  );
}
