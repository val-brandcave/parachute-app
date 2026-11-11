"use client";

import { EmptyLine } from "@/components/molecules";
import "../billing-states.css";
import { costFor } from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";

const FULL_REVIEW_COST = costFor(FULL_REVIEW_TYPES);

/** Review types in their fixed order: from 12 o'clock, clockwise. Colour means type, never rank. */
const SERIES = [
  { key: "technical", label: "Technical", color: "var(--viz-tech)" },
  { key: "administrative", label: "Administrative", color: "var(--viz-admin)" },
] as const;

export interface DonutUsage {
  technical: number;
  administrative: number;
  total: number;
}

const SIZE = 180;
const RING = 22;
const R = (SIZE - RING) / 2;
const CIRC = 2 * Math.PI * R;
/** Gap between slices: 2 px of arc, in pathLength units (the ring is 100 long). */
const GAP = (2 / CIRC) * 100;

const n = (v: number) => `${Math.round(v * 10) / 10}`;
const credits = (v: number) => `${n(v)} ${v === 1 ? "credit" : "credits"}`;
const fullReviews = (v: number) => {
  const f = v / FULL_REVIEW_COST;
  return `${n(f)} full ${f === 1 ? "review" : "reviews"}`;
};

/** Whole-number shares that add up to 100. */
function shares(u: DonutUsage): number[] {
  if (u.total <= 0) return [0, 0];
  const t = Math.round((u.technical / u.total) * 100);
  return [t, 100 - t];
}

/**
 * "Credits used in <month>" (PC-28): a two-slice donut by review type, always with its legend.
 * Hand-built SVG (DS DonutViz takes palette indices, not the `--viz-*` tokens). The SVG is one
 * `role="img"` with a sentence; a visually hidden table carries the same rows; nothing needs hover.
 * The balance is never drawn as a donut: only spend in a period has a finite total.
 */
export function UsageDonut({
  usage,
  monthName,
  rangeLabel,
}: {
  usage: DonutUsage;
  /** "November" */
  monthName: string;
  /** "Nov 1 to Nov 11" */
  rangeLabel: string;
}) {
  const pct = shares(usage);
  const values = [usage.technical, usage.administrative];
  const sentence = `${credits(usage.total)} used in ${monthName}: ${SERIES.map(
    (s, i) => `${s.label} ${credits(values[i])} (${pct[i]}%)`,
  ).join(", ")}.`;

  // Slices: share of the ring, minus the gap when both are drawn.
  const both = values[0] > 0 && values[1] > 0;
  const arcs = SERIES.map((s, i) => {
    const share = usage.total > 0 ? (values[i] / usage.total) * 100 : 0;
    const before = i === 0 ? 0 : (values[0] / usage.total) * 100;
    return { ...s, i, share, len: both ? Math.max(share - GAP, 0) : share, start: before };
  });

  return (
    <section className="card bl-card ud" aria-labelledby="ud-t">
      <div className="ud-head">
        <h2 className="bl-h" id="ud-t">
          Credits used in {monthName}
        </h2>
        <span className="bl-sub">{rangeLabel}</span>
      </div>

      {usage.total <= 0 ? (
        <EmptyLine>No credits used yet this period.</EmptyLine>
      ) : (
        <div className="ud-body">
          <div className="ud-chart">
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} role="img" aria-label={sentence}>
              <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
                {arcs
                  .filter((a) => a.share > 0)
                  .map((a) => (
                    <circle
                      key={a.key}
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={R}
                      fill="none"
                      pathLength={100}
                      stroke={a.color}
                      strokeWidth={RING}
                      strokeDasharray={`${a.len} ${100 - a.len}`}
                      strokeDashoffset={-(a.start + (both ? GAP / 2 : 0))}
                    >
                      <title>
                        {a.label}: {credits(values[a.i])}
                      </title>
                    </circle>
                  ))}
              </g>
            </svg>
            <div className="ud-center" aria-hidden="true">
              <span className="ud-n">{n(usage.total)}</span>
              <span className="ud-u">credits used</span>
            </div>
          </div>

          <div className="ud-legend">
            {SERIES.map((s, i) => (
              <div className="ud-lr" key={s.key}>
                <i className="ud-sw" style={{ background: s.color }} aria-hidden="true" />
                <span className="ud-name">
                  <b>{s.label}</b>
                  <span className="ud-share">{pct[i]}%</span>
                </span>
                <span className="ud-val">
                  {credits(values[i])}
                  <small>= {fullReviews(values[i])}</small>
                </span>
              </div>
            ))}
            <div className="ud-lr ud-lr--tot">
              <span />
              <span className="ud-name">
                <b>Total</b>
              </span>
              <span className="ud-val">
                {credits(usage.total)}
                <small>= {fullReviews(usage.total)}</small>
              </span>
            </div>
            <p className="bl-sub tw-pretty ud-foot">
              1 credit is one review type on one report. A full review, Technical and Administrative, is {FULL_REVIEW_COST} credits.
            </p>
          </div>

          <table className="ui-visually-hidden">
            <caption>Credits used in {monthName}, by review type</caption>
            <thead>
              <tr>
                <th scope="col">Review type</th>
                <th scope="col">Credits</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              {SERIES.map((s, i) => (
                <tr key={s.key}>
                  <td>{s.label}</td>
                  <td>{n(values[i])}</td>
                  <td>{pct[i]}%</td>
                </tr>
              ))}
              <tr>
                <td>Total</td>
                <td>{n(usage.total)}</td>
                <td>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
