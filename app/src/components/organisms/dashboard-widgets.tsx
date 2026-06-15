import Link from "next/link";
import { Icon, Chip } from "@/components/atoms";
import { relativeDue, STATUS_META } from "@/lib/utils";
import { reviewHref, STATUS_TONE } from "./ReviewTable";
import type { Review } from "@/types";

/** Action-needed widget: the most urgent items waiting on the reviewer. */
export function ActionNeeded({ reviews }: { reviews: Review[] }) {
  return (
    <div className="widget">
      <div className="widget-head">
        <h3>
          <Icon name="flag" size={17} /> Action needed
        </h3>
        <Link href="/reviews" className="link">
          View all <Icon name="chevron-right" size={14} />
        </Link>
      </div>
      <div className="widget-body">
        {reviews.length === 0 ? (
          <div className="widget-empty">You&apos;re all caught up. 🎉</div>
        ) : (
          reviews.map((r) => {
            const due = relativeDue(r.slaDueAt);
            const tone =
              r.status === "autorejected"
                ? { bg: "var(--md-error-c)", c: "var(--md-error)", icon: "checklist" as const }
                : due.tone === "overdue"
                  ? { bg: "var(--md-error-c)", c: "var(--md-error)", icon: "warn" as const }
                  : { bg: "var(--md-warn-c)", c: "var(--md-warn)", icon: "flag" as const };
            return (
              <Link key={r.id} href={reviewHref(r)} className="an-row">
                <span className="an-ic" style={{ background: tone.bg, color: tone.c }}>
                  <Icon name={tone.icon} size={17} />
                </span>
                <span className="an-main">
                  <div className="t">{r.propertyAddress}</div>
                  <div className="s">
                    {STATUS_META[r.status].label} · {r.propertyType} · Loan #{r.loanNo}
                  </div>
                </span>
                <span
                  className={
                    "due2 " + (r.status !== "completed" && due.tone !== "ok" ? due.tone : "")
                  }
                >
                  {due.label}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

/** Recent reviews: compact recent-activity list. */
export function RecentReviews({ reviews }: { reviews: Review[] }) {
  return (
    <div className="widget">
      <div className="widget-head">
        <h3>
          <Icon name="document" size={17} /> Recent reviews
        </h3>
        <Link href="/reviews" className="link">
          View all <Icon name="chevron-right" size={14} />
        </Link>
      </div>
      <div className="widget-body">
        {reviews.map((r) => (
          <Link key={r.id} href={reviewHref(r)} className="rc-row">
            <span className="rc-main">
              <div className="t">{r.propertyAddress}</div>
              <div className="s">
                {r.propertyType} · Loan #{r.loanNo}
              </div>
            </span>
            <Chip tone={STATUS_TONE[r.status]}>{STATUS_META[r.status].label}</Chip>
            <Icon name="chevron-right" size={16} style={{ color: "var(--md-on-surface-v)" }} />
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Throughput trend chart (period-scoped, mock data). */
export function TrendChart({
  data,
  periodLabel,
}: {
  data: { x: string; v: number }[];
  periodLabel: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.v));
  const total = data.reduce((s, d) => s + d.v, 0);
  return (
    <div className="widget">
      <div className="widget-head">
        <h3>
          <Icon name="check-all" size={17} /> Throughput
        </h3>
        <span style={{ fontSize: 12.5, color: "var(--md-on-surface-v)" }}>
          {periodLabel}
        </span>
      </div>
      <div className="trend-legend">
        <span>
          <b>{total}</b> completed
        </span>
        <span>
          <b>24m</b> avg turnaround
        </span>
      </div>
      <div className="trend-wrap" style={{ paddingTop: 0 }}>
        <div className="trend-bars">
          {data.map((d) => (
            <div key={d.x} className="trend-col">
              <div
                className="trend-bar"
                style={{ height: `${Math.round((d.v / max) * 100)}%` }}
                title={`${d.v} completed`}
              />
              <span className="trend-x">{d.x}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
