"use client";

import { Tooltip } from "@/components/atoms";
import { EmptyLine } from "@/components/molecules";
import type { CategoryRow, DataSource } from "./insights.types";
import { CardHead, Legend, SegmentBar, plural } from "./dv2i-parts";

/** "Where issues show up": issues per checklist category, each bar split into
 *  critical + high (navy) and medium + low (light navy). Bars are relative to
 *  the busiest category. */
export function IssuesByCategory({
  rows,
  title = "Where issues show up",
  emptyText = "No issues raised in this period.",
}: {
  rows: CategoryRow[];
  /** Accepted for the integrator; no badge is drawn (Val, Nov 2026). */
  periodLabel?: string;
  /** Where the real data would come from (kept for the integrator; no visual today). */
  source?: DataSource;
  title?: string;
  emptyText?: string;
}) {
  const list = [...rows]
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
  const max = Math.max(1, ...list.map((r) => r.total));

  return (
    <section className="widget dv2i-card">
      <CardHead title={title} />
      {list.length === 0 ? (
        <EmptyLine>{emptyText}</EmptyLine>
      ) : (
        <div className="dv2i-body">
          <div className="dv2i-cats">
            {list.map((r, i) => {
              const rest = Math.max(0, r.total - r.criticalHigh);
              return (
                <Tooltip
                  key={r.category}
                  block
                  content={`${r.category}: ${plural(r.total, "issue")}, ${r.criticalHigh} critical or high`}
                >
                  <span className="dv2i-cat">
                    <span className="dv2i-cat-name">{r.category}</span>
                    <SegmentBar
                      index={i}
                      count={list.length}
                      scale={r.total / max}
                      segments={[
                        { value: r.criticalHigh, tone: "strong" },
                        { value: rest, tone: "soft" },
                      ]}
                    />
                    <span className="dv2i-num">{r.total.toLocaleString()}</span>
                  </span>
                </Tooltip>
              );
            })}
          </div>
          <Legend
            items={[
              { tone: "strong", label: "Critical + high" },
              { tone: "soft", label: "Medium + low" },
            ]}
          />
        </div>
      )}
    </section>
  );
}
