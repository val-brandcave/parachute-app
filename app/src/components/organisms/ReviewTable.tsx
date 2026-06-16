import Link from "next/link";
import { Chip, Icon } from "@/components/atoms";
import { cn, relativeDue, STATUS_META } from "@/lib/utils";
import type { Review, ReviewStatus } from "@/types";

export const STATUS_TONE: Record<ReviewStatus, Parameters<typeof Chip>[0]["tone"]> =
  {
    intake: "info",
    autorejected: "fail",
    running: "info",
    needs_action: "flag",
    in_review: "info",
    returned: "flag",
    completed: "pass",
  };

export function reviewHref(r: Review) {
  return r.status === "autorejected"
    ? `/reviews/${r.id}/triage`
    : `/reviews/${r.id}`;
}

function RiskDot({ rating }: { rating: Review["riskRating"] }) {
  if (!rating) return <>—</>;
  const bg =
    rating === "elevated"
      ? "var(--md-error)"
      : rating === "moderate"
        ? "var(--md-warn)"
        : "var(--md-success)";
  return (
    <span className="risk">
      <span className="ui-dot" style={{ background: bg }} />
      {rating}
    </span>
  );
}

export function ReviewTable({ reviews }: { reviews: Review[] }) {
  return (
    <>
      <div className="qcols">
        <div>Property</div>
        <div>Status</div>
        <div>Risk</div>
        <div>Open findings</div>
        <div>SLA</div>
        <div />
      </div>
      {reviews.map((r) => {
        const due = relativeDue(r.slaDueAt);
        return (
          <Link key={r.id} href={reviewHref(r)} className="qrow">
            <div className="prop-cell">
              <div style={{ minWidth: 0 }}>
                <div className="addr">{r.propertyAddress}</div>
                <div className="meta">
                  {r.propertyType} · Loan #{r.loanNo}
                  {r.source === "yc" && "  ·  via YouConnect"}
                </div>
              </div>
            </div>
            <div>
              <Chip tone={STATUS_TONE[r.status]}>{STATUS_META[r.status].label}</Chip>
            </div>
            <div>
              <RiskDot rating={r.riskRating} />
            </div>
            <div>
              {r.openFindings > 0 ? <span className="num">{r.openFindings}</span> : "—"}
              {r.flaggedCount > 0 && (
                <Chip tone="flag" className="ml-2">
                  {r.flaggedCount} flagged
                </Chip>
              )}
            </div>
            <div
              className={cn(
                "due2",
                r.status !== "completed" && due.tone !== "ok" && due.tone,
              )}
            >
              {r.status === "completed" ? "—" : due.label}
            </div>
            <div style={{ color: "var(--md-on-surface-v)" }}>
              <Icon name="chevron-right" size={18} />
            </div>
          </Link>
        );
      })}
    </>
  );
}
