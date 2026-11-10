"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/atoms";
import "./empty-state.css";

/*
 * Empty states, one rule app-wide (approved 10 Nov 2026, see docs/plans/self-serve/v6-brief.md):
 *
 *   1. Never used        → <EmptyState>  one block for the whole page or tab. Hide tiles, charts,
 *                          tabs, search, filters, column headers, totals, export and pagination.
 *   2. Nothing in view   → <EmptyLine>   the section keeps its title + own controls; its body is
 *                          one sentence plus the way out ("Show 12 months").
 *   3. Filtered to none  → <EmptyLine>   same line naming the filter + "Clear"; keep the controls.
 *
 * Column headers never sit over nothing.
 */

type Tone = "warn" | "info";

export function EmptyState({
  title,
  children,
  actions,
  status,
  statusTone = "warn",
  preview,
  previewLabel = "What you'll see here",
  aside,
  layout = "stack",
  framed = true,
  className,
}: {
  /** One short sentence-case headline that says what will appear here. */
  title: ReactNode;
  /** One or two sentences: what this place is for. */
  children?: ReactNode;
  /** Primary first, then at most one secondary. */
  actions?: ReactNode;
  /** A state that blocks the primary action (approval wait, empty balance). Shown above the title. */
  status?: ReactNode;
  statusTone?: Tone;
  /** A decorative drawing of the filled page (use the Ghost* parts). Hidden from screen readers. */
  preview?: ReactNode;
  previewLabel?: string | null;
  /** Extra content under the actions: a sample card, a short step list. */
  aside?: ReactNode;
  /** "split" = text left, preview panel right (page-level hero). "stack" = centred, preview on top. */
  layout?: "split" | "stack";
  /** Draw the card frame. Turn off when the host already is a card. */
  framed?: boolean;
  className?: string;
}) {
  const body = (
    <div className="es-body">
      {status && (
        <div className={cn("es-status", `es-status--${statusTone}`)} role="status">
          <span className="es-status-dot" aria-hidden="true" />
          <span>{status}</span>
        </div>
      )}
      <h2 className="es-title">{title}</h2>
      {children && <div className="es-text">{children}</div>}
      {actions && <div className="es-actions">{actions}</div>}
      {aside && <div className="es-aside">{aside}</div>}
    </div>
  );

  const art = preview ? (
    <div className="es-preview" aria-hidden="true">
      {previewLabel && <span className="es-preview-label">{previewLabel}</span>}
      <div className="es-preview-art">{preview}</div>
    </div>
  ) : null;

  return (
    <section className={cn("es", `es--${layout}`, framed && "es--framed", className)}>
      {layout === "stack" ? (
        <>
          {art}
          {body}
        </>
      ) : (
        <>
          {body}
          {art}
        </>
      )}
    </section>
  );
}

/**
 * Levels 2 and 3: one quiet line inside a section or table that has nothing to show.
 * Never put column headers, a totals row or "Showing 0 of 0" around it.
 */
export function EmptyLine({
  children,
  action,
  icon,
  className,
}: {
  children: ReactNode;
  /** The way out: a wider range, clear the filter. A Button (ghost, sm) or a link. */
  action?: ReactNode;
  icon?: IconName;
  className?: string;
}) {
  return (
    <div className={cn("el", className)}>
      <span className="el-text">
        {icon && <Icon name={icon} size={15} />}
        <span>{children}</span>
      </span>
      {action && <span className="el-action">{action}</span>}
    </div>
  );
}

/* ---------- Ghost preview parts: decorative drawings of a filled page ---------- */

/** A row of stat tiles. */
export function GhostStats({ count = 4 }: { count?: number }) {
  return (
    <div className="gh-stats" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }, (_, i) => (
        <div className="gh-tile" key={i}>
          <i className="gh-line gh-line--label" />
          <i className="gh-line gh-line--num" style={{ width: `${40 + ((i * 17) % 30)}%` }} />
        </div>
      ))}
    </div>
  );
}

const BARS = [28, 44, 36, 58, 50, 70, 62, 84, 66, 78];

/** A bar chart with a trend line. */
export function GhostBars({ bars = BARS, height = 120 }: { bars?: number[]; height?: number }) {
  const n = bars.length;
  const pts = bars.map((h, i) => `${((i + 0.5) / n) * 100},${100 - h}`).join(" ");
  return (
    <div className="gh-chart" style={{ height }}>
      <div className="gh-bars">
        {bars.map((h, i) => (
          <i key={i} style={{ height: `${h}%` }} />
        ))}
      </div>
      <svg className="gh-trend" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points={pts} fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

/** Table-ish rows: a wide label, a meta cell and a status pill. */
export function GhostRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="gh-rows">
      {Array.from({ length: rows }, (_, i) => (
        <div className="gh-row" key={i}>
          <span className="gh-cell">
            <i className="gh-line gh-line--strong" style={{ width: `${88 - i * 12}%` }} />
            <i className="gh-line" style={{ width: `${58 - i * 6}%` }} />
          </span>
          <i className="gh-line" style={{ width: "70%" }} />
          <i className="gh-pill" />
        </div>
      ))}
    </div>
  );
}
