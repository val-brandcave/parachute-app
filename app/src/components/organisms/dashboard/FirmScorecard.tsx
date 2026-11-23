"use client";

import Link from "next/link";
import { Icon, Tooltip } from "@/components/atoms";
import { EmptyLine } from "@/components/molecules";
import { cn } from "@/lib/utils";
import type { DataSource, FirmRow } from "./insights.types";
import { CardHead } from "./dv2i-parts";

/** Highest issues-per-report only gets the amber "worst" mark at or above this. */
const WORST_AT = 2.5;

const TREND = {
  worse: { icon: "arrow-up", label: "Worse than last period" },
  better: { icon: "arrow-down", label: "Better than last period" },
  same: { icon: "minus", label: "Same as last period" },
} as const;

const firmHref = (firm: string) => `/reviews?firm=${encodeURIComponent(firm)}`;

/** Firm name: ellipsises; the link's ::after stretches over the whole row, so
 *  the row is the click target with a single tab stop. (A truncation tooltip
 *  would add a second focusable wrapper per row, so the full name rides on the
 *  link's aria-label instead.) */
function FirmName({ row, href }: { row: FirmRow; href: string }) {
  return (
    <span className="dv2i-firm-main">
      <Link href={href} className="dv2i-firm-link" aria-label={`${row.firm}: view reviews`}>
        <span className="dv2i-firm-name">{row.firm}</span>
      </Link>
      {row.topCategory?.trim() && (
        <span className="dv2i-firm-sub">Most issues in {row.topCategory}</span>
      )}
    </span>
  );
}

/** "Appraisal firms": the fee appraisers whose reports were reviewed, worst first
 *  (issues per report). A row opens Reviews filtered to that firm. */
export function FirmScorecard({
  rows,
  hrefFor = firmHref,
  title = "Appraisal firms",
  footnote = "Firms are the fee appraisers whose reports your team reviewed.",
  limit = 4,
  emptyText = "No appraisal firms reviewed in this period.",
}: {
  rows: FirmRow[];
  /** Accepted for the integrator; no badge is drawn (Val, Nov 2026). */
  periodLabel?: string;
  /** Where the real data would come from (kept for the integrator; no visual today). */
  source?: DataSource;
  /** Row destination; defaults to the Reviews queue filtered to the firm. */
  hrefFor?: (firm: string) => string;
  title?: string;
  footnote?: string;
  /** Rows shown (worst first). 4 keeps the card level with its neighbours on the dashboard. */
  limit?: number;
  emptyText?: string;
}) {
  const list = [...rows].sort((a, b) => b.issuesPerReport - a.issuesPerReport).slice(0, limit);
  const maxIpr = Math.max(0.0001, ...list.map((r) => r.issuesPerReport));
  // Sorted worst first, so the worst row is index 0 — marked only past the threshold.
  const worstIdx = list.length && list[0].issuesPerReport >= WORST_AT ? 0 : -1;

  return (
    <section className="widget dv2i-card">
      <CardHead title={title} />
      {list.length === 0 ? (
        <EmptyLine>{emptyText}</EmptyLine>
      ) : (
        <div className="dv2i-body dv2i-body--flush">
          <div className="dv2i-firms" role="table" aria-label={title}>
            <div className="dv2i-firm dv2i-firm--head" role="row">
              <span role="columnheader">Firm</span>
              <span role="columnheader" className="dv2i-r">
                Reports
              </span>
              <span role="columnheader">
                <Tooltip content="Issues per report · sorted worst first" compact>
                  <span className="dv2i-colhint">Per report</span>
                </Tooltip>
              </span>
              <span role="columnheader" className="dv2i-r">
                Returned
              </span>
              <span role="columnheader" className="dv2i-c">
                <span className="dv2i-sr">Trend</span>
              </span>
            </div>
            {list.map((r, i) => {
              const worst = i === worstIdx;
              const t = TREND[r.trend];
              return (
                <div key={r.firm} className="dv2i-firm" role="row">
                  <span role="cell" className="dv2i-firm-cell">
                    <FirmName row={r} href={hrefFor(r.firm)} />
                  </span>
                  <span role="cell" className="dv2i-num dv2i-r">
                    {r.reports.toLocaleString()}
                  </span>
                  <span role="cell" className={cn("dv2i-ipr", worst && "dv2i-ipr--worst")}>
                    <span className="dv2i-ipr-val">
                      {worst && <span className="dv2i-dot" aria-hidden="true" />}
                      {r.issuesPerReport.toFixed(1)}
                      {worst && <span className="dv2i-sr"> (highest)</span>}
                    </span>
                    <span className="dv2i-mini" aria-hidden="true">
                      <span
                        className="dv2i-mini-fill"
                        style={{ width: `${(r.issuesPerReport / maxIpr) * 100}%` }}
                      />
                    </span>
                  </span>
                  <span role="cell" className="dv2i-num dv2i-r">
                    {Math.round(r.returnedRate * 100)}%
                  </span>
                  <span role="cell" className="dv2i-c dv2i-trend-cell">
                    <Tooltip content={t.label} compact>
                      <span
                        className={cn("dv2i-trend", `dv2i-trend--${r.trend}`)}
                        role="img"
                        aria-label={t.label}
                      >
                        <Icon name={t.icon} size={15} />
                      </span>
                    </Tooltip>
                  </span>
                </div>
              );
            })}
          </div>
          <p className="dv2i-foot">{footnote}</p>
        </div>
      )}
    </section>
  );
}
