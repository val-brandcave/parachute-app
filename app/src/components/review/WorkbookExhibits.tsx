"use client";

import { formatMoney } from "@/lib/workbook";
import type { WorkbookExhibits } from "@/types";

/**
 * The workbook's analytical exhibits — the "evidence of property" the reviewer
 * includes alongside dispositions (§4.4). Bespoke SVG/CSS built on our tokens
 * (no chart library): the adjustment grid, an adjusted-$/SF bar chart, a
 * cap-rate comparison number-line, a sensitivity heat table, and the SWOT grid.
 * All presentational — data comes from the workspace store's exhibits record.
 */

const pct = (n: number) => `${n > 0 ? "+" : ""}${n}%`;

export function AdjustmentTable({ rows }: { rows: WorkbookExhibits["adjustmentGrid"] }) {
  return (
    <table className="wb-exh-table">
      <thead>
        <tr>
          <th>Comparable</th>
          <th className="num">Unadj. $/SF</th>
          <th className="num">Location</th>
          <th className="num">Condition</th>
          <th className="num">Quality</th>
          <th className="num">Adj. $/SF</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.comp} className={r.flag ? "is-flag" : undefined}>
            <td>
              {r.comp}
              {r.flag && <span className="wb-exh-flag">discrepancy — see finding</span>}
            </td>
            <td className="num">${r.unadj.toFixed(2)}</td>
            <td className="num">{pct(r.location)}</td>
            <td className="num">{pct(r.condition)}</td>
            <td className="num">{pct(r.quality)}</td>
            <td className="num strong">${r.adj.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PsfBarChart({ psf }: { psf: WorkbookExhibits["psf"] }) {
  const max = Math.max(...psf.bars.map((b) => b.value));
  return (
    <div className="wb-exh">
      <div className="wb-exh-h">Adjusted $/SF by comparable</div>
      <div className="wb-bars">
        {psf.bars.map((b) => (
          <div key={b.label} className={`wb-bar-row${b.concluded ? " is-concluded" : ""}`}>
            <span className="wb-bar-l">{b.label}</span>
            <span className="wb-bar-track">
              <span className="wb-bar-fill" style={{ width: `${(b.value / max) * 100}%` }} />
            </span>
            <span className="wb-bar-v">${b.value}</span>
          </div>
        ))}
      </div>
      <p className="wb-exh-note">{psf.note}</p>
    </div>
  );
}

export function CapRateScale({ cap }: { cap: WorkbookExhibits["capRate"] }) {
  const values = cap.points.map((p) => p.value).concat([cap.bandMin, cap.bandMax]);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.18 || 0.5;
  const min = lo - pad;
  const span = hi + pad - min;
  const at = (v: number) => `${((v - min) / span) * 100}%`;

  return (
    <div className="wb-exh">
      <div className="wb-exh-h">Capitalization-rate comparison</div>
      <div className="wb-cap">
        <span className="wb-cap-line" />
        <span
          className="wb-cap-band"
          style={{ left: at(cap.bandMin), width: `calc(${at(cap.bandMax)} - ${at(cap.bandMin)})` }}
        />
        {cap.points.map((p) => (
          <span key={p.label} className="wb-cap-pt" style={{ left: at(p.value) }}>
            <span className={`wb-cap-dot${p.selected ? " is-sel" : ""}`} />
            <span className={`wb-cap-lab${p.selected ? " is-sel" : ""}`}>
              <b>
                {p.value}
                {cap.unit}
              </b>
              {p.label}
            </span>
          </span>
        ))}
      </div>
      <p className="wb-exh-note">{cap.note}</p>
    </div>
  );
}

export function SensitivityHeat({ sens }: { sens: WorkbookExhibits["sensitivity"] }) {
  return (
    <div className="wb-exh">
      <p className="wb-prose wb-muted" style={{ marginBottom: 8 }}>
        {sens.metric}.
      </p>
      <table className="wb-exh-table wb-heat">
        <thead>
          <tr>
            <th>Cap rate</th>
            {sens.cols.map((c) => (
              <th key={c.label} className={`num${c.selected ? " is-sel" : ""}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Indicated value</td>
            {sens.cols.map((c) => (
              <td
                key={c.label}
                className={`num${c.delta > 0 ? " heat-pos" : c.delta < 0 ? " heat-neg" : ""}`}
              >
                {formatMoney(c.value)}
              </td>
            ))}
          </tr>
          <tr>
            <td>Δ vs concluded</td>
            {sens.cols.map((c) => (
              <td
                key={c.label}
                className={`num${c.delta > 0 ? " heat-pos" : c.delta < 0 ? " heat-neg" : ""}`}
              >
                {c.delta === 0 ? "—" : pct(+c.delta.toFixed(1))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="wb-exh-note">{sens.note}</p>
    </div>
  );
}

const SWOT_QUADRANTS = [
  { key: "strengths", label: "Strengths", cls: "s" },
  { key: "weaknesses", label: "Weaknesses", cls: "w" },
  { key: "opportunities", label: "Opportunities", cls: "o" },
  { key: "threats", label: "Threats", cls: "t" },
] as const;

export function SwotGrid({ swot }: { swot: WorkbookExhibits["swot"] }) {
  return (
    <div className="wb-swot">
      {SWOT_QUADRANTS.map((q) => (
        <div key={q.key} className={`wb-swot-q wb-swot-q--${q.cls}`}>
          <h5>{q.label}</h5>
          <ul>
            {swot[q.key].map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
