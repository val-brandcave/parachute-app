"use client";

import { useState } from "react";
import { Icon } from "@/components/atoms";
import { formatMoney } from "@/lib/workbook";
import type { WbAdjustmentRow, WorkbookExhibits } from "@/types";

/**
 * The workbook's analytical exhibits — the "evidence of property" the reviewer
 * includes alongside dispositions (§4.4). Bespoke SVG/CSS built on our tokens
 * (no chart library): the adjustment grid, an adjusted-$/SF bar chart, a
 * cap-rate comparison number-line, a sensitivity heat table, and the SWOT grid.
 * All presentational — data comes from the workspace store's exhibits record.
 */

const pct = (n: number) => `${n > 0 ? "+" : ""}${n}%`;

/** Row tools for the comp-grid repeater (inline workbook editing, F-144):
 *  instant add row, per-row delete, click-any-cell-to-edit. Structured controls
 *  only — the adjusted $/SF re-derives in the store, so the table never breaks. */
export interface CompGridTools {
  onAdd: () => void;
  onDelete: (comp: string) => void;
  onUpdate: (comp: string, patch: Partial<WbAdjustmentRow>) => void;
}

export function AdjustmentTable({
  rows,
  tools,
}: {
  rows: WorkbookExhibits["adjustmentGrid"];
  tools?: CompGridTools | null;
}) {
  return (
    <>
      <table className={`wb-exh-table${tools ? " is-editable" : ""}`}>
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
                {tools ? (
                  <GridCell
                    raw={r.comp}
                    display={r.comp}
                    onCommit={(v) => v.trim() && tools.onUpdate(r.comp, { comp: v.trim() })}
                  />
                ) : (
                  r.comp
                )}
                {r.flag && <span className="wb-exh-flag">discrepancy — see finding</span>}
              </td>
              <NumCell
                value={r.unadj}
                display={`$${r.unadj.toFixed(2)}`}
                tools={tools}
                onCommit={(n) => tools?.onUpdate(r.comp, { unadj: n })}
              />
              <NumCell
                value={r.location}
                display={pct(r.location)}
                tools={tools}
                onCommit={(n) => tools?.onUpdate(r.comp, { location: n })}
              />
              <NumCell
                value={r.condition}
                display={pct(r.condition)}
                tools={tools}
                onCommit={(n) => tools?.onUpdate(r.comp, { condition: n })}
              />
              <NumCell
                value={r.quality}
                display={pct(r.quality)}
                tools={tools}
                onCommit={(n) => tools?.onUpdate(r.comp, { quality: n })}
              />
              <td className="num strong">
                ${r.adj.toFixed(2)}
                {tools && (
                  <button
                    className="wb-rowdel"
                    onClick={() => tools.onDelete(r.comp)}
                    aria-label={`Delete ${r.comp}`}
                    title={`Delete ${r.comp}`}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tools && (
        <button className="wb-addrow" onClick={tools.onAdd}>
          <Icon name="add" size={13} /> Add row
        </button>
      )}
    </>
  );
}

/** A numeric grid cell — renders formatted, flips to an input on click. The
 *  adjusted column stays derived (read-only), so edits can't break the math. */
function NumCell({
  value,
  display,
  tools,
  onCommit,
}: {
  value: number;
  display: string;
  tools?: CompGridTools | null;
  onCommit: (n: number) => void;
}) {
  return (
    <td className="num">
      {tools ? (
        <GridCell
          raw={String(value)}
          display={display}
          numeric
          onCommit={(v) => {
            const n = parseFloat(v.replace(/[$,%\s,]/g, ""));
            if (!Number.isNaN(n)) onCommit(n);
          }}
        />
      ) : (
        display
      )}
    </td>
  );
}

/** Click-to-edit cell: a button showing the formatted value; clicking swaps in
 *  an input seeded with the raw value. Enter/blur commits, Esc cancels.
 *  Exported — the fact grid and SWOT cards reuse the same cell mechanic. */
export function GridCell({
  raw,
  display,
  numeric,
  onCommit,
}: {
  raw: string;
  display: string;
  numeric?: boolean;
  onCommit: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(raw);

  if (!editing)
    return (
      <button
        className="wb-cell"
        title="Click to edit"
        onClick={() => {
          setVal(raw);
          setEditing(true);
        }}
      >
        {display}
      </button>
    );

  return (
    <input
      className={`wb-cell-in${numeric ? " num" : ""}`}
      autoFocus
      value={val}
      onFocus={(e) => e.target.select()}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        setEditing(false);
        onCommit(val);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          e.stopPropagation();
          setEditing(false);
        }
      }}
    />
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
            <span className={`wb-cap-val${p.selected ? " is-sel" : ""}`}>
              {p.value}
              {cap.unit}
            </span>
            <span className={`wb-cap-dot${p.selected ? " is-sel" : ""}`} />
            <span className={`wb-cap-cap${p.selected ? " is-sel" : ""}`}>{p.label}</span>
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

export function SwotGrid({
  swot,
  onUpdateQuadrant,
}: {
  swot: WorkbookExhibits["swot"];
  /** When set (edit mode), quadrant items are click-to-edit with per-item
   *  delete and a per-quadrant add — the "cards" get the same structured
   *  editing as the repeater tables (§5 matrix). */
  onUpdateQuadrant?: ((q: keyof WorkbookExhibits["swot"], items: string[]) => void) | null;
}) {
  return (
    <div className="wb-swot">
      {SWOT_QUADRANTS.map((q) => {
        const items = swot[q.key];
        const commit = (next: string[]) => onUpdateQuadrant?.(q.key, next);
        return (
          <div key={q.key} className={`wb-swot-q wb-swot-q--${q.cls}`}>
            <h5>{q.label}</h5>
            <ul>
              {items.map((item, i) =>
                onUpdateQuadrant ? (
                  <li key={`${i}-${item}`} className="wb-swot-li">
                    <GridCell
                      raw={item}
                      display={item}
                      onCommit={(v) =>
                        commit(
                          v.trim()
                            ? items.map((it, j) => (j === i ? v.trim() : it))
                            : items.filter((_, j) => j !== i),
                        )
                      }
                    />
                    <button
                      className="wb-rowdel"
                      onClick={() => commit(items.filter((_, j) => j !== i))}
                      aria-label={`Delete "${item}"`}
                      title="Delete item"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </li>
                ) : (
                  <li key={i}>{item}</li>
                ),
              )}
            </ul>
            {onUpdateQuadrant && (
              <button
                className="wb-swot-add"
                onClick={() => commit([...items, "New point — click to edit"])}
              >
                <Icon name="add" size={12} /> Add
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
