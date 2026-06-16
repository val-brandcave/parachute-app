"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, Chip } from "@/components/atoms";
import { ActionMenu, type ActionItem } from "@/components/molecules";
import { cn, relativeDue, STATUS_META } from "@/lib/utils";
import { reviewHref, STATUS_TONE } from "./ReviewTable";
import type { Review } from "@/types";

/** Action-needed widget: the most urgent items waiting on the reviewer. */
export function ActionNeeded({ reviews }: { reviews: Review[] }) {
  return (
    <div className="widget">
      <div className="widget-head">
        <h3>Action needed</h3>
        <Link href="/reviews" className="link">
          View all <Icon name="chevron-right" size={14} />
        </Link>
      </div>
      <div className="widget-body">
        {reviews.length === 0 ? (
          <div className="widget-empty">You&apos;re all caught up. 🎉</div>
        ) : (
          reviews.map((r) => {
            const due = relativeDue(r.slaDueAt);
            const tone =
              r.status === "autorejected"
                ? { bg: "var(--md-error-c)", c: "var(--md-error)", icon: "checklist" as const }
                : due.tone === "overdue"
                  ? { bg: "var(--md-error-c)", c: "var(--md-error)", icon: "warn" as const }
                  : { bg: "var(--md-warn-c)", c: "var(--md-warn)", icon: "flag" as const };
            return (
              <Link key={r.id} href={reviewHref(r)} className="an-row">
                <span className="an-ic" style={{ background: tone.bg, color: tone.c }}>
                  <Icon name={tone.icon} size={17} />
                </span>
                <span className="an-main">
                  <div className="t">{r.propertyAddress}</div>
                  <div className="s">
                    {STATUS_META[r.status].label} · {r.propertyType} · Loan #{r.loanNo}
                  </div>
                </span>
                <span
                  className={
                    "due2 " + (r.status !== "completed" && due.tone !== "ok" ? due.tone : "")
                  }
                >
                  {due.label}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

/** Recent reviews: compact recent-activity list. */
export function RecentReviews({ reviews }: { reviews: Review[] }) {
  return (
    <div className="widget">
      <div className="widget-head">
        <h3>Recent reviews</h3>
        <Link href="/reviews" className="link">
          View all <Icon name="chevron-right" size={14} />
        </Link>
      </div>
      <div className="widget-body">
        {reviews.map((r) => (
          <Link key={r.id} href={reviewHref(r)} className="rc-row">
            <span className="rc-main">
              <div className="t">{r.propertyAddress}</div>
              <div className="s">
                {r.propertyType} · Loan #{r.loanNo}
              </div>
            </span>
            <Chip tone={STATUS_TONE[r.status]}>{STATUS_META[r.status].label}</Chip>
            <Icon name="chevron-right" size={16} style={{ color: "var(--md-on-surface-v)" }} />
          </Link>
        ))}
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

  const exportCsv = () => {
    const rows = [
      ["Period", "Completed", "Avg turnaround (min)", "On-time (%)"],
      ...points.map((d) => [d.label, d.v, d.t, d.onTime]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "review-volume.csv";
    a.click();
    URL.revokeObjectURL(url);
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
    { label: "Export CSV", icon: "download" as const, onClick: exportCsv },
  ];

  const hp = hover != null ? points[hover] : null;

  return (
    <div className="widget">
      <div className="widget-head rv-head">
        <div className="rv-head-left">
          <div className="rv-title">
            <h3>Review volume</h3>
            <span className="rv-badge">{periodLabel}</span>
          </div>
          <div className="rv-legend">
            <span className="rv-leg">
              <SeriesGlyph kind="bar" /> Completed
            </span>
            <span className={cn("rv-leg", !showT && "rv-leg--off")}>
              <SeriesGlyph kind="line" /> Turnaround
            </span>
            <span className={cn("rv-leg", !showOn && "rv-leg--off")}>
              <SeriesGlyph kind="dashed" /> On-time
            </span>
          </div>
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
                style={{ animationDelay: `${i * 35}ms`, opacity: hover === i ? 1 : 0.85 }}
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

      <div className="rv-foot">
        <div className="rv-metric">
          <span className="rv-m-label">
            <SeriesGlyph kind="bar" /> Completed
          </span>
          <span className="rv-m-val">{completed}</span>
          <Delta
            value={prev.completed ? Math.round(((completed - prev.completed) / prev.completed) * 100) : 0}
            suffix="%"
            lowerIsBetter={false}
          />
        </div>
        <div className="rv-metric">
          <span className="rv-m-label">
            <SeriesGlyph kind="line" /> Avg turnaround
          </span>
          <span className="rv-m-val">{avgT}m</span>
          <Delta value={avgT - prev.avgT} suffix="m" lowerIsBetter={true} />
        </div>
        <div className="rv-metric">
          <span className="rv-m-label">
            <SeriesGlyph kind="dashed" /> On-time
          </span>
          <span className="rv-m-val">{avgOn}%</span>
          <Delta value={avgOn - prev.avgOn} suffix="pts" lowerIsBetter={false} />
        </div>
      </div>
    </div>
  );
}
