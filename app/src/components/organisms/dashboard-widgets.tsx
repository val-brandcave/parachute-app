"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, Chip, Button } from "@/components/atoms";
import { ActionMenu, type ActionItem } from "@/components/molecules";
import { cn, relativeDue } from "@/lib/utils";
import { useOrderStore, ORDER_STEP } from "@/store";
import { reviewHref } from "./ReviewTable";
import type { Review } from "@/types";

/** Risk → dot color. Calm by default: only elevated (red) and moderate (amber)
 *  carry color; low/unrated stay neutral grey so color signals real severity. */
const riskColor = (rating: Review["riskRating"]) =>
  rating === "elevated"
    ? "var(--md-error)"
    : rating === "moderate"
      ? "var(--md-warn)"
      : "var(--md-on-surface-t)";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Action-needed widget: the most urgent items waiting on the reviewer.
 *  Leading risk dot, then the property; the right-hand badge carries the one
 *  meaningful signal per row — due urgency (neutral/amber/red) or, for an
 *  auto-rejected item, its failure state. No status text (the widget IS the
 *  status) and no decorative icon tiles. */
export function ActionNeeded({ reviews }: { reviews: Review[] }) {
  return (
    <div className="widget">
      <div className="widget-head">
        <h3>Action needed</h3>
        <Link href="/reviews?tab=needs_action" className="link">
          View all <Icon name="chevron-right" size={14} />
        </Link>
      </div>
      <div className="widget-body">
        {reviews.length === 0 ? (
          <div className="widget-empty">You&apos;re all caught up. 🎉</div>
        ) : (
          reviews.map((r) => {
            const due = relativeDue(r.slaDueAt);
            return (
              <Link key={r.id} href={reviewHref(r)} className="an-row">
                <span
                  className="an-risk"
                  style={r.riskRating ? { background: riskColor(r.riskRating) } : undefined}
                  title={r.riskRating ? `${cap(r.riskRating)} risk` : undefined}
                  aria-label={r.riskRating ? `${cap(r.riskRating)} risk` : undefined}
                />
                <span className="an-main">
                  <div className="t">{r.propertyAddress}</div>
                  <div className="s">
                    {r.propertyType} · Loan #{r.loanNo}
                  </div>
                </span>
                {r.status === "autorejected" ? (
                  <Chip tone="fail">Auto-rejected</Chip>
                ) : (
                  <Chip
                    tone={
                      due.tone === "overdue" ? "fail" : due.tone === "soon" ? "flag" : "neutral"
                    }
                  >
                    {due.label}
                  </Chip>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

/** New from YouConnect: appraisal deliveries that have landed but aren't ordered
 *  yet (status "intake", source "yc"). The dashboard's front door — each row's
 *  "Confirm & run" opens the Order stepper on its final step, pre-selected on
 *  that delivery (decisions #1/#2). Disjoint from Action needed by construction. */
export function NewFromYouConnect({ reviews }: { reviews: Review[] }) {
  const openOrder = useOrderStore((s) => s.openOrder);

  const runReview = (r: Review) =>
    openOrder({
      step: ORDER_STEP.confirm,
      prefill: {
        reviewId: r.id,
        source: "yc",
        propertyAddress: r.propertyAddress,
        loanNo: r.loanNo,
        bank: r.bank,
      },
    });

  return (
    <div className="widget">
      <div className="widget-head">
        <h3>New from YouConnect</h3>
        <Link href="/reviews?tab=intake" className="link">
          View all <Icon name="chevron-right" size={14} />
        </Link>
      </div>
      <div className="widget-body">
        {reviews.length === 0 ? (
          <div className="widget-empty">No new deliveries from YouConnect.</div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="yc-row">
              <span className="yc-main">
                <div className="t">{r.propertyAddress}</div>
                <div className="s">
                  {r.propertyType} · Loan #{r.loanNo} · {r.bank}
                </div>
              </span>
              <Button
                size="sm"
                variant="outline"
                iconLeft="parachute"
                onClick={() => runReview(r)}
              >
                Run
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type TrendPoint = {
  key: string;
  label: string;
  v: number;
  t: number;
  onTime: number;
  tick: boolean;
};
type Overlay = "turnaround" | "ontime" | "both" | "none";
type Summary = { completed: number; avgT: number; avgOn: number };

/** Small period-over-period delta pill. */
function Delta({
  value,
  suffix,
  lowerIsBetter,
}: {
  value: number;
  suffix: string;
  lowerIsBetter: boolean;
}) {
  if (value === 0)
    return <span className="rv-delta flat">±0{suffix}</span>;
  const up = value > 0;
  const good = lowerIsBetter ? !up : up;
  return (
    <span className={cn("rv-delta", good ? "good" : "bad")}>
      {up ? "▲" : "▼"} {Math.abs(value)}
      {suffix}
    </span>
  );
}

/** Legend swatch that mirrors how a series is drawn on the chart, so the
 *  footer metrics, tooltip rows, and header legend all read back to the marks. */
function SeriesGlyph({ kind }: { kind: "bar" | "line" | "dashed" }) {
  return (
    <svg
      className="rv-glyph"
      width="18"
      height="10"
      viewBox="0 0 18 10"
      aria-hidden="true"
    >
      {kind === "bar" ? (
        <rect className="rv-glyph-bar" x="6" y="0.5" width="6" height="9" rx="1.5" />
      ) : (
        <>
          <line
            className={cn("rv-glyph-line", kind === "dashed" && "rv-glyph-line--alt")}
            x1="1"
            y1="5"
            x2="17"
            y2="5"
          />
          <circle
            className={cn("rv-glyph-dot", kind === "dashed" && "rv-glyph-dot--alt")}
            cx="9"
            cy="5"
            r="2.6"
          />
        </>
      )}
    </svg>
  );
}

/**
 * Review volume — completed reviews per period (bars) with a configurable overlay
 * line (turnaround / on-time / both / none) chosen from the ⋯ menu. Bespoke SVG so
 * it uses our tokens, dark mode, and motion directly. Hover a column for details +
 * a "View reviews" action. Metrics live in the footer with vs-previous deltas, each
 * tagged with its series glyph (bar / solid line / dashed line).
 */
export function TrendChart({
  points,
  completed,
  avgT,
  avgOn,
  prev,
  periodLabel,
}: {
  points: TrendPoint[];
  completed: number;
  avgT: number;
  avgOn: number;
  prev: Summary;
  periodLabel: string;
}) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(680);
  const [overlay, setOverlay] = useState<Overlay>("turnaround");
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width;
      if (cw) setW(cw);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // geometry (px, measured width)
  const H = 196;
  const padX = 14;
  const padTop = 16;
  const padBottom = 26;
  const plotH = H - padTop - padBottom;
  const plotW = Math.max(0, w - padX * 2);
  const n = points.length;
  const colW = n ? plotW / n : plotW;
  const cx = (i: number) => padX + colW * i + colW / 2;
  const barW = Math.min(30, Math.max(6, colW * 0.5));

  const maxV = Math.max(1, ...points.map((d) => d.v));
  const barH = (v: number) => (v / maxV) * plotH;
  const barY = (v: number) => padTop + plotH - barH(v);

  // Each overlay line scaled to its own range within the plot.
  const lineFor = (get: (p: TrendPoint) => number) => {
    const vals = points.map(get);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const pad = (hi - lo) * 0.45 || 1;
    const a = lo - pad;
    const b = hi + pad;
    const y = (val: number) =>
      padTop + plotH - ((val - a) / (b - a || 1)) * plotH;
    const path = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${cx(i).toFixed(1)} ${y(get(p)).toFixed(1)}`)
      .join(" ");
    return { y, path };
  };
  const tLine = lineFor((p) => p.t);
  const onLine = lineFor((p) => p.onTime);
  const showT = overlay === "turnaround" || overlay === "both";
  const showOn = overlay === "ontime" || overlay === "both";

  const gridLines = [0.25, 0.5, 0.75];

  // Export as PDF — uses the browser's print pipeline (Save as PDF), so no PDF
  // dependency is needed. A production build would render a chart-scoped PDF.
  const exportPdf = () => {
    window.print();
  };

  const overlayOpts: { v: Overlay; label: string }[] = [
    { v: "turnaround", label: "Turnaround" },
    { v: "ontime", label: "On-time" },
    { v: "both", label: "Both" },
    { v: "none", label: "None" },
  ];
  const menuItems: ActionItem[] = [
    { header: true, label: "Overlay line" },
    ...overlayOpts.map((o) => ({
      label: o.label,
      selected: overlay === o.v,
      onClick: () => setOverlay(o.v),
    })),
    { divider: true },
    { label: "View all reviews", icon: "reviews" as const, onClick: () => router.push("/reviews") },
    { label: "Export PDF", icon: "download" as const, onClick: exportPdf },
  ];

  const hp = hover != null ? points[hover] : null;

  return (
    <div className="widget">
      <div className="widget-head rv-head">
        <div className="rv-title">
          <h3>Review volume</h3>
          <span className="rv-badge">{periodLabel}</span>
        </div>
        <ActionMenu items={menuItems} />
      </div>

      <div className="rv-chart" ref={wrapRef} onMouseLeave={() => setHover(null)}>
        <svg width={w} height={H} role="img" aria-label="Review volume chart">
          {gridLines.map((g) => (
            <line
              key={g}
              className="rv-grid"
              x1={padX}
              x2={w - padX}
              y1={padTop + plotH * g}
              y2={padTop + plotH * g}
            />
          ))}
          <line
            className="rv-axis"
            x1={padX}
            x2={w - padX}
            y1={padTop + plotH}
            y2={padTop + plotH}
          />
          {points.map((d, i) => (
            <g key={d.key}>
              <rect
                className="rv-bar"
                x={cx(i) - barW / 2}
                y={barY(d.v)}
                width={barW}
                height={barH(d.v)}
                rx={Math.min(5, barW / 2)}
                style={{
                  animationDelay: `${i * 35}ms`,
                  // Full strength at rest; dim only the siblings while hovering one.
                  opacity: hover === null || hover === i ? 1 : 0.45,
                }}
              />
              {d.tick && (
                <text className="rv-xlabel" x={cx(i)} y={H - 8} textAnchor="middle">
                  {d.label}
                </text>
              )}
            </g>
          ))}

          {showT && (
            <>
              <path className="rv-line" d={tLine.path} pathLength={1} fill="none" />
              {points.map((d, i) => (
                <circle
                  key={d.key}
                  className="rv-pt"
                  cx={cx(i)}
                  cy={tLine.y(d.t)}
                  r={hover === i ? 4.5 : 3}
                />
              ))}
            </>
          )}
          {showOn && (
            <>
              {/* Dashed line can't draw via stroke-dashoffset (dasharray is spent
                  on the dashes), so it plots via a left-to-right clip wipe that
                  reveals the line + points in step with the turnaround draw. */}
              <clipPath id="rv-on-wipe">
                <rect className="rv-on-wipe" x={0} y={0} width={w} height={H} />
              </clipPath>
              <g clipPath="url(#rv-on-wipe)">
                <path className="rv-line rv-line--alt" d={onLine.path} fill="none" />
                {points.map((d, i) => (
                  <circle
                    key={d.key}
                    className="rv-pt rv-pt--alt"
                    cx={cx(i)}
                    cy={onLine.y(d.onTime)}
                    r={hover === i ? 4.5 : 3}
                  />
                ))}
              </g>
            </>
          )}

          {hover != null && (
            <line
              className="rv-guide"
              x1={cx(hover)}
              x2={cx(hover)}
              y1={padTop}
              y2={padTop + plotH}
            />
          )}
          {points.map((d, i) => (
            <rect
              key={d.key}
              x={padX + colW * i}
              y={0}
              width={colW}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>

        {hp && (
          <div
            className="rv-tip"
            style={{ left: Math.min(Math.max(cx(hover!), 78), w - 78) }}
          >
            <div className="rv-tip-x">{hp.label}</div>
            <div className="rv-tip-row">
              <span>
                <SeriesGlyph kind="bar" /> Completed
              </span>
              <b>{hp.v}</b>
            </div>
            <div className="rv-tip-row">
              <span>
                <SeriesGlyph kind="line" /> Turnaround
              </span>
              <b>{hp.t}m</b>
            </div>
            <div className="rv-tip-row">
              <span>
                <SeriesGlyph kind="dashed" /> On-time
              </span>
              <b>{hp.onTime}%</b>
            </div>
            <button
              type="button"
              className="rv-tip-btn"
              onClick={() =>
                router.push(`/reviews?period=${encodeURIComponent(hp.label)}`)
              }
            >
              View reviews <Icon name="chevron-right" size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Series-aware: a metric shows only when its series is drawn. Bars
          (Completed) are always present; the line metrics follow the overlay. */}
      <div className="rv-foot">
        <div className="rv-metric">
          <span className="rv-m-label">
            <SeriesGlyph kind="bar" /> Completed
          </span>
          <span className="rv-m-line2">
            <span className="rv-m-val">{completed}</span>
            <Delta
              value={prev.completed ? Math.round(((completed - prev.completed) / prev.completed) * 100) : 0}
              suffix="%"
              lowerIsBetter={false}
            />
          </span>
        </div>
        {showT && (
          <div className="rv-metric">
            <span className="rv-m-label">
              <SeriesGlyph kind="line" /> Avg turnaround
            </span>
            <span className="rv-m-line2">
              <span className="rv-m-val">{avgT}m</span>
              <Delta value={avgT - prev.avgT} suffix="m" lowerIsBetter={true} />
            </span>
          </div>
        )}
        {showOn && (
          <div className="rv-metric">
            <span className="rv-m-label">
              <SeriesGlyph kind="dashed" /> On-time
            </span>
            <span className="rv-m-line2">
              <span className="rv-m-val">{avgOn}%</span>
              <Delta value={avgOn - prev.avgOn} suffix="pts" lowerIsBetter={false} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
