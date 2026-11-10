"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CREDIT_USD, formatUsd } from "@/lib/pricing";
import { DAY, niceAxis, type CumulativeData, type GroupDef, type StackColumn, type UsagePeriod } from "./usage-data";

export type ChartUnit = "credits" | "usd";
export type ChartView = "daily" | "cumulative";

/** What the tooltip shows for one column. */
interface TipData {
  heading: string;
  rows: { label: string; tone: number; value: string }[];
  /** "Total" row value. */
  total: string;
  /** Muted second line under the total. */
  sub?: string;
  /** Replaces the rows for projected days. */
  note?: string;
}
interface Hover {
  i: number;
  ax: number;
  ay: number;
}

const unitFmt = (unit: ChartUnit) => (v: number) => (unit === "usd" ? formatUsd(Math.round(v * CREDIT_USD)) : `${Math.round(v * 10) / 10}`);
const axisFmt = (unit: ChartUnit) => (v: number) => {
  if (unit === "credits") return `${v}`;
  const d = v * CREDIT_USD;
  return d >= 1000 ? `$${Math.round(d / 100) / 10}k`.replace(".0k", "k") : `$${d}`;
};
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Bar path with only the top corners rounded. */
function topRounded(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

/**
 * The usage chart: stacked bars of credits per day, week or month by group, or a cumulative running
 * total with a shaded same-pace projection. Bespoke SVG (no chart library): tokens only, gridlines,
 * tick-gated labels, a portaled tooltip with a row per group and the total in credits and dollars.
 */
export function UsageChart({
  columns,
  groups,
  hidden,
  view,
  cum,
  period,
  unit,
  compact = false,
  ariaLabel,
}: {
  columns: StackColumn[];
  groups: GroupDef[];
  /** Group keys switched off in the legend. */
  hidden: ReadonlySet<string>;
  view: ChartView;
  cum?: CumulativeData;
  period: UsagePeriod;
  unit: ChartUnit;
  compact?: boolean;
  ariaLabel: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useState(720);
  const [hover, setHover] = useState<Hover | null>(null);
  const f = unitFmt(unit);
  const af = axisFmt(unit);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => {
      const cw = e[0]?.contentRect.width;
      if (cw) setW(Math.floor(cw));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Dismiss the floating tooltip when the page moves under it.
  useEffect(() => {
    if (!hover) return;
    const off = () => setHover(null);
    window.addEventListener("scroll", off, true);
    window.addEventListener("resize", off);
    return () => {
      window.removeEventListener("scroll", off, true);
      window.removeEventListener("resize", off);
    };
  }, [hover]);

  const cumulativeOn = view === "cumulative" && !!cum;
  const vis = useMemo(() => groups.map((g, i) => ({ g, i })).filter((x) => !hidden.has(x.g.key)), [groups, hidden]);

  // geometry
  const H = compact ? 200 : 300;
  const padL = unit === "usd" ? 50 : 36;
  const padR = 16;
  const padT = 14;
  const padB = 28;
  const plotW = Math.max(40, w - padL - padR);
  const plotH = H - padT - padB;

  const visTotal = useCallback((vals: number[]) => vis.reduce((s, x) => s + vals[x.i], 0), [vis]);

  const n = cumulativeOn ? 60 : columns.length;
  const colW = plotW / n;
  const cx = (i: number) => padL + colW * i + colW / 2;

  const maxV = useMemo(() => {
    if (cumulativeOn && cum) {
      const end = visTotal(cum.days.at(-1)?.values ?? []);
      const share = cum.total ? end / cum.total : 1;
      return Math.max(end + cum.pacePerDay * share * 30, 1);
    }
    return Math.max(0, ...columns.map((c) => visTotal(c.values)));
  }, [cumulativeOn, cum, columns, visTotal]);
  const axis = niceAxis(cumulativeOn ? maxV * 1.06 : maxV);
  const y = (v: number) => padT + plotH - (v / axis.max) * plotH;
  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let v = 0; v <= axis.max + 1e-9; v += axis.step) out.push(v);
    return out;
  }, [axis.max, axis.step]);

  // x labels: gated by the width they need, counted back from the newest column
  const labelW = period === "12m" ? 30 : 36;
  const every = Math.max(1, Math.ceil((labelW + 14) / colW));
  const dayLabel = (t: number) => new Date((columns[0]?.bucket.start ?? 0) + t * DAY).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const labelAt = (i: number) => (cumulativeOn ? dayLabel(i) : columns[i].bucket.label);
  const showLabel = (i: number) => (cumulativeOn ? (29 - i) % every === 0 || (i > 29 && (i - 29) % every === 0) : (n - 1 - i) % every === 0);

  const empty = cumulativeOn ? !cum || cum.total === 0 : columns.every((c) => visTotal(c.values) === 0);

  /* ---------- tooltip data ---------- */
  const tipFor = (i: number): TipData | null => {
    if (cumulativeOn && cum) {
      if (i >= 30) {
        const lastTotal = visTotal(cum.days[29].values);
        const share = cum.total ? lastTotal / cum.total : 1;
        const proj = lastTotal + cum.pacePerDay * share * (i - 29);
        return {
          heading: dayLabel(i),
          rows: [],
          total: `~${f(Math.round(proj))}`,
          sub: unit === "usd" ? undefined : `~${formatUsd(Math.round(Math.round(proj) * CREDIT_USD))} at list value`,
          note: "Projected at your last 30 days' pace",
        };
      }
      const d = cum.days[i];
      const total = visTotal(d.values);
      return {
        heading: `To ${columns[i].bucket.long}`,
        rows: [...vis].reverse().map((x) => ({ label: x.g.label, tone: x.g.tone, value: f(d.values[x.i]) })).filter((r) => r.value !== "0"),
        total: f(total),
        sub: unit === "usd" ? undefined : d.usd > 0 ? `~${formatUsd(d.usd)}` : total > 0 ? "Free" : undefined,
      };
    }
    const c = columns[i];
    const total = visTotal(c.values);
    const rows = [...vis].reverse().map((x) => ({ label: x.g.label, tone: x.g.tone, value: f(c.values[x.i]), raw: c.values[x.i] })).filter((r) => r.raw > 0);
    if (total === 0) return { heading: c.bucket.long, rows: [], total: unit === "usd" ? f(0) : "0 credits", note: "No reviews" };
    return {
      heading: c.bucket.long,
      rows,
      total: unit === "usd" ? f(total) : `${f(total)} ${plural(total, "credit", "credits")}`,
      sub: unit === "usd" ? undefined : c.usd > 0 ? `~${formatUsd(c.usd)}` : total > 0 ? "Free" : undefined,
    };
  };

  const enter = (i: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    setHover({ i, ax: r.left + cx(i), ay: r.top + padT });
  };

  const hi = hover?.i ?? null;
  const tip = hi !== null && !empty ? tipFor(hi) : null;
  const colLabel = (i: number) => {
    const t = tipFor(i);
    return t ? `${t.heading}: ${t.rows.map((r) => `${r.label} ${r.value}`).join(", ") || t.note || "no usage"}, total ${t.total}` : "";
  };

  /* ---------- drawing ---------- */
  const barW = Math.min(34, Math.max(3, colW * 0.62));
  const bars = columns.map((c, i) => {
    let acc = 0;
    const segs = vis
      .map((x) => ({ x, v: c.values[x.i] }))
      .filter((s) => s.v > 0)
      .map((s) => {
        const y1 = y(acc + s.v);
        const h = y(acc) - y1;
        acc += s.v;
        return { tone: s.x.g.tone, key: s.x.g.key, y: y1, h };
      });
    return { i, segs };
  });

  // cumulative: stacked areas of the actual 30 days, dashed projection of the total afterwards
  const area = useMemo(() => {
    if (!cumulativeOn || !cum) return null;
    const xs = (t: number) => padL + (plotW * (t + 0.5)) / 60;
    const layers: { tone: number; key: string; top: number[]; bottom: number[] }[] = [];
    let below = cum.days.map(() => 0);
    for (const x of vis) {
      const top = cum.days.map((d, t) => below[t] + d.values[x.i]);
      layers.push({ tone: x.g.tone, key: x.g.key, top, bottom: below });
      below = top;
    }
    const pts = (arr: number[]) => arr.map((v, t) => `${xs(t).toFixed(1)},${(padT + plotH - (v / axis.max) * plotH).toFixed(1)}`);
    return {
      xs,
      paths: layers.map((l) => ({
        tone: l.tone,
        key: l.key,
        d: `M${pts(l.top).join(" L")} L${pts(l.bottom).reverse().join(" L")} Z`,
        edge: `M${pts(l.top).join(" L")}`,
      })),
      end: below[29] ?? 0,
    };
  }, [cumulativeOn, cum, vis, padL, plotW, padT, plotH, axis.max]);

  const projEnd = cumulativeOn && cum && area ? area.end + cum.pacePerDay * (cum.total ? area.end / cum.total : 1) * 30 : 0;

  return (
    <div className={`us-chart${compact ? " is-compact" : ""}`} ref={wrapRef} onMouseLeave={() => setHover(null)}>
      <svg ref={svgRef} width={w} height={H} role="img" aria-label={ariaLabel}>
        {ticks.map((v) => (
          <g key={v}>
            <line className={v === 0 ? "us-axis" : "us-grid"} x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} />
            <text className="us-ylabel" x={padL - 8} y={y(v)} textAnchor="end" dominantBaseline="central">
              {af(v)}
            </text>
          </g>
        ))}

        {cumulativeOn && cum && area && (
          <>
            <rect className="us-zone" x={area.xs(29)} y={padT} width={Math.max(0, w - padR - area.xs(29))} height={plotH} />
            <text className="us-zone-label" x={area.xs(29) + 10} y={padT + 14}>
              Projected
            </text>
          </>
        )}

        {hi !== null && !empty && !cumulativeOn && (
          <rect className="us-hoverband" x={padL + colW * hi} y={padT} width={colW} height={plotH} rx={4} />
        )}

        {!cumulativeOn && !empty && (
          <g key={`${period}-${vis.map((v) => v.g.key).join()}-${unit}`}>
            {bars.map(({ i, segs }) => (
              <g key={i} className="us-col" style={{ opacity: hi === null || hi === i ? 1 : 0.5, animationDelay: `${i * 14}ms` }}>
                {segs.map((s, si) =>
                  si === segs.length - 1 ? (
                    <path key={s.key} className={`us-seg us-t${s.tone}`} d={topRounded(cx(i) - barW / 2, s.y, barW, s.h, 3)} />
                  ) : (
                    <rect key={s.key} className={`us-seg us-t${s.tone}`} x={cx(i) - barW / 2} y={s.y} width={barW} height={s.h} />
                  ),
                )}
              </g>
            ))}
          </g>
        )}

        {cumulativeOn && cum && area && !empty && (
          <g key={`cum-${vis.map((v) => v.g.key).join()}-${unit}`} className="us-cumg">
            {area.paths.map((p) => (
              <g key={p.key}>
                <path className={`us-area us-t${p.tone}`} d={p.d} />
                <path className="us-areaedge" d={p.edge} />
              </g>
            ))}
            <line className="us-today" x1={area.xs(29)} x2={area.xs(29)} y1={padT} y2={padT + plotH} />
            <path
              className="us-proj"
              d={`M${area.xs(29)},${y(area.end)} L${area.xs(59)},${y(projEnd)}`}
            />
            <circle className="us-enddot" cx={area.xs(59)} cy={y(projEnd)} r={4} />
            <text className="us-endlabel" x={area.xs(59) - 8} y={y(projEnd) - 10} textAnchor="end">
              ~{f(Math.round(projEnd))}
            </text>
          </g>
        )}

        {empty && (
          <text className="us-empty" x={padL + plotW / 2} y={padT + plotH / 2} textAnchor="middle">
            No usage in this period
          </text>
        )}

        {Array.from({ length: n }, (_, i) =>
          showLabel(i) ? (
            <text key={i} className="us-xlabel" x={cx(i)} y={H - 8} textAnchor="middle">
              {labelAt(i)}
            </text>
          ) : null,
        )}

        {hi !== null && !empty && cumulativeOn && area && hi < 30 && (
          <>
            <line className="us-guide" x1={area.xs(hi)} x2={area.xs(hi)} y1={padT} y2={padT + plotH} />
            <circle className="us-hoverdot" cx={area.xs(hi)} cy={y(visTotal(cum!.days[hi].values))} r={4.5} />
          </>
        )}
        {hi !== null && !empty && cumulativeOn && hi >= 30 && cum && area && (
          <>
            <line className="us-guide" x1={cx(hi)} x2={cx(hi)} y1={padT} y2={padT + plotH} />
            <circle
              className="us-hoverdot us-hoverdot--proj"
              cx={cx(hi)}
              cy={y(area.end + cum.pacePerDay * (cum.total ? area.end / cum.total : 1) * (hi - 29))}
              r={4.5}
            />
          </>
        )}

        {!empty &&
          Array.from({ length: n }, (_, i) => (
            <rect
              key={i}
              className="us-hit"
              x={padL + colW * i}
              y={0}
              width={colW}
              height={H}
              tabIndex={i === n - 1 ? 0 : -1}
              role="img"
              onKeyDown={(e) => {
                const next = e.key === "ArrowRight" ? e.currentTarget.nextElementSibling : e.key === "ArrowLeft" ? e.currentTarget.previousElementSibling : null;
                if (next instanceof SVGElement && next.classList.contains("us-hit")) {
                  e.preventDefault();
                  next.focus();
                }
              }}
              aria-label={colLabel(i)}
              onMouseEnter={() => enter(i)}
              onFocus={() => enter(i)}
              onBlur={() => setHover(null)}
            />
          ))}
      </svg>
      {hover && tip && <ChartTip tip={tip} hover={hover} />}
    </div>
  );
}

/** Portaled, fixed-position tooltip. Sits to the right of the column, flips left near the edge, clamps to the viewport. */
function ChartTip({ tip, hover }: { tip: TipData; hover: Hover }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tw = el.offsetWidth;
    const th = el.offsetHeight;
    const gap = 14;
    let left = hover.ax + gap;
    if (left + tw > window.innerWidth - 8) left = hover.ax - gap - tw;
    left = Math.max(8, left);
    const top = Math.min(Math.max(8, hover.ay), window.innerHeight - th - 8);
    setPos({ left, top });
  }, [hover, tip]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div ref={ref} className="us-tip" role="tooltip" style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}>
      <div className="us-tip-h">{tip.heading}</div>
      {tip.note ? (
        <div className="us-tip-note">{tip.note}</div>
      ) : (
        tip.rows.map((r) => (
          <div key={r.label} className="us-tip-row">
            <span>
              <i className={`us-sw us-t${r.tone}`} />
              {r.label}
            </span>
            <b>{r.value}</b>
          </div>
        ))
      )}
      {tip.note !== "No reviews" && (
        <div className="us-tip-total">
          <span>{tip.note ? "On pace for" : "Total"}</span>
          <b>{tip.total}</b>
        </div>
      )}
      {tip.sub && <div className="us-tip-sub">{tip.sub}</div>}
    </div>,
    document.body,
  );
}
