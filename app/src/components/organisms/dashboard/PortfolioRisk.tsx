"use client";

import { Tooltip } from "@/components/atoms";
import { EmptyLine } from "@/components/molecules";
import type { DataSource, RiskRow } from "./insights.types";
import { CardHead, Legend, SegmentBar, plural } from "./dv2i-parts";

/** "Portfolio risk": one tile per property type with its low / moderate /
 *  elevated mix. Elevated uses the flag (amber) tone because it IS a warning. */
export function PortfolioRisk({
  rows,
  title = "Portfolio risk",
  emptyText = "No rated reports in this period.",
}: {
  rows: RiskRow[];
  /** Accepted for the integrator; no badge is drawn (Val, Nov 2026). */
  periodLabel?: string;
  /** Where the real data would come from (kept for the integrator; no visual today). */
  source?: DataSource;
  title?: string;
  emptyText?: string;
}) {
  const list = [...rows]
    .filter((r) => r.reports > 0)
    .sort((a, b) => b.reports - a.reports)
    .slice(0, 6);

  return (
    <section className="widget dv2i-card dv2i-card--wide">
      <CardHead title={title} />
      {list.length === 0 ? (
        <EmptyLine>{emptyText}</EmptyLine>
      ) : (
        <div className="dv2i-body">
          <div className="dv2i-risk-tiles">
            {list.map((r, i) => (
              <div key={r.propertyType} className="dv2i-risk-tile">
                <span className="dv2i-risk-type">{r.propertyType}</span>
                {/* One focusable bar per tile; the tooltip spells out the mix. */}
                <Tooltip
                  block
                  content={`Low ${r.low} · Moderate ${r.moderate} · Elevated ${r.elevated}`}
                >
                  <span className="dv2i-risk-bar">
                    <SegmentBar
                      index={i}
                      count={list.length}
                      label={`${r.low} low, ${r.moderate} moderate, ${r.elevated} elevated`}
                      segments={[
                        { value: r.low, tone: "soft" },
                        { value: r.moderate, tone: "mid" },
                        { value: r.elevated, tone: "warn" },
                      ]}
                    />
                  </span>
                </Tooltip>
                <span className="dv2i-risk-cap">
                  {plural(r.reports, "report")} · {r.elevated} elevated
                </span>
              </div>
            ))}
          </div>
          <Legend
            items={[
              { tone: "soft", label: "Low" },
              { tone: "mid", label: "Moderate" },
              { tone: "warn", label: "Elevated" },
            ]}
          />
        </div>
      )}
    </section>
  );
}
