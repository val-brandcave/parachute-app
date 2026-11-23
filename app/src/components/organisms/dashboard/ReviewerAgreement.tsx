"use client";

import { EmptyLine } from "@/components/molecules";
import type { Agreement, DataSource } from "./insights.types";
import { CardHead, SegmentBar, Swatch, plural, roundShares, type Tone } from "./dv2i-parts";

/** "Do reviewers agree with Parachute?": how reviewers decided on the engine's
 *  findings (concurred / edited / rejected), as one stacked bar + legend rows. */
export function ReviewerAgreement({
  data,
  title = "Do reviewers agree with Parachute?",
  emptyText = "No reviewer decisions yet in this period.",
}: {
  data: Agreement;
  /** Accepted for the integrator; no badge is drawn (Val, Nov 2026). */
  periodLabel?: string;
  /** Where the real data would come from (kept for the integrator; no visual today). */
  source?: DataSource;
  title?: string;
  emptyText?: string;
}) {
  const [pc, pe, pr] = roundShares([data.concurred, data.edited, data.rejected]);
  const rows: { label: string; pct: number; tone: Tone }[] = [
    { label: "Concurred", pct: pc, tone: "strong" },
    { label: "Edited", pct: pe, tone: "mid" },
    { label: "Rejected", pct: pr, tone: "soft" },
  ];

  return (
    <section className="widget dv2i-card">
      <CardHead title={title} />
      {data.decisions <= 0 ? (
        <EmptyLine>{emptyText}</EmptyLine>
      ) : (
        <div className="dv2i-body dv2i-agree">
          <div className="dv2i-big">
            <span className="dv2i-big-val">{pc}%</span>
            <span className="dv2i-big-label">concurred</span>
          </div>
          <SegmentBar
            size="lg"
            label={rows.map((r) => `${r.pct}% ${r.label.toLowerCase()}`).join(", ")}
            segments={rows.map((r) => ({ value: r.pct, tone: r.tone }))}
          />
          <ul className="dv2i-agree-rows">
            {rows.map((r) => (
              <li key={r.label}>
                <span className="dv2i-legend-item">
                  <Swatch tone={r.tone} />
                  {r.label}
                </span>
                <span className="dv2i-num">{r.pct}%</span>
              </li>
            ))}
          </ul>
          {data.mostRejectedCategory && (
            <p className="dv2i-agree-note">
              Rejected most in <b>{data.mostRejectedCategory}</b>
            </p>
          )}
          <p className="dv2i-foot dv2i-foot--tight">
            Based on {plural(data.decisions, "reviewer decision")}
          </p>
        </div>
      )}
    </section>
  );
}
