"use client";

import { Skeleton } from "@/components/atoms";

/* Static bar heights (%) so the chart placeholder is stable across renders —
   no Math.random() in render (React 19). */
const BAR_HEIGHTS = [44, 66, 54, 78, 50, 70, 60, 84, 56, 72, 62, 48];

/** Mirrors the dashboard StatBar — 5 informational segments. */
function StatBarSkeleton() {
  return (
    <div className="statbar">
      {Array.from({ length: 5 }).map((_, i) => (
        <div className="statseg" key={i} aria-hidden="true">
          <div className="statseg-main">
            <Skeleton width="64%" height={11} />
            <Skeleton width={52} height={28} radius={8} style={{ marginTop: 12 }} />
          </div>
          <Skeleton width={46} height={46} radius={13} />
        </div>
      ))}
    </div>
  );
}

/** Mirrors the Review-volume TrendChart widget (header + bars + footer metrics). */
function TrendChartSkeleton() {
  return (
    <div className="widget" aria-hidden="true">
      <div className="widget-head">
        <Skeleton width={132} height={15} />
        <Skeleton width={74} height={20} radius={8} />
      </div>
      <div style={{ padding: "18px 18px 6px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 168 }}>
          {BAR_HEIGHTS.map((h, i) => (
            <Skeleton key={i} height={`${h}%`} radius={5} style={{ flex: 1 }} />
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 28,
          padding: "14px 18px 18px",
          borderTop: "1px solid var(--md-outline-v)",
          marginTop: 12,
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <Skeleton width={84} height={11} />
            <Skeleton width={56} height={18} radius={6} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mirrors a dashboard list widget (Action needed / Recent reviews). */
function WidgetListSkeleton({
  rows = 5,
  leadingDot = false,
}: {
  rows?: number;
  leadingDot?: boolean;
}) {
  return (
    <div className="widget" aria-hidden="true">
      <div className="widget-head">
        <Skeleton width={120} height={15} />
        <Skeleton width={56} height={12} />
      </div>
      <div className="widget-body">
        {Array.from({ length: rows }).map((_, i) => (
          <div className="an-row" key={i}>
            {leadingDot && <Skeleton width={8} height={8} radius={4} />}
            <span className="an-main" style={{ display: "block" }}>
              <Skeleton width="70%" height={13} />
              <Skeleton width="46%" height={11} style={{ marginTop: 6 }} />
            </span>
            <Skeleton width={68} height={22} radius={8} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full dashboard loading state — StatBar + chart + the two list widgets. */
export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard">
      <StatBarSkeleton />
      <div style={{ marginTop: "var(--d-gap)" }}>
        <TrendChartSkeleton />
      </div>
      <div className="dash-grid">
        <WidgetListSkeleton rows={5} leadingDot />
        <WidgetListSkeleton rows={5} />
      </div>
    </div>
  );
}

/** Mirrors the reviews queue table (column header + placeholder rows). */
export function ReviewTableSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading reviews">
      <div className="qcols">
        <div>Property</div>
        <div className="qcol-center">Reviewer</div>
        <div>Type</div>
        <div>Pipeline</div>
        <div>Findings</div>
        <div>Due</div>
        <div />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div className="qrow" key={i} aria-hidden="true">
          <div className="prop-cell">
            <div style={{ minWidth: 0, width: "100%" }}>
              <Skeleton width="60%" height={13} />
              <Skeleton width="40%" height={11} style={{ marginTop: 7 }} />
            </div>
          </div>
          <div className="qreviewer">
            <Skeleton width={28} height={28} radius={14} />
          </div>
          <div>
            <Skeleton width={50} height={18} radius={6} />
          </div>
          <div>
            <Skeleton width={120} height={14} />
          </div>
          <div>
            <Skeleton width={64} height={22} radius={11} />
          </div>
          <div>
            <Skeleton width={60} height={13} />
          </div>
          <div className="qactions">
            <Skeleton width={92} height={32} radius={8} />
          </div>
        </div>
      ))}
    </div>
  );
}
