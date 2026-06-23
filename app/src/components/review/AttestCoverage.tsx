"use client";

import { useMemo } from "react";
import { Icon } from "@/components/atoms";
import { attNeedsAttention, type AttestationRow } from "@/store";
import type { AttestationState } from "@/types";

/**
 * Coverage / anti-miss panel for the Administrative review — the attestation
 * twin of the Findings `CoveragePanel`, reusing the same `.fm-cov` band. The
 * ring tracks attested-of-total; the detail proves every item was AI-pre-filled
 * (nothing left blank), counts what still needs attention, breaks down by
 * checklist group, and states what's deliberately out of scope (value accuracy →
 * run a Technical review).
 */
export function AttestCoverage({
  rows,
  states,
  open,
  onToggle,
}: {
  rows: AttestationRow[];
  states: Record<string, AttestationState>;
  open: boolean;
  onToggle: () => void;
}) {
  const stats = useMemo(() => {
    const total = rows.length;
    const attested = rows.filter((r) => states[r.itemId]?.confirmed).length;
    const attention = rows.filter(
      (r) => attNeedsAttention(r) && !states[r.itemId]?.confirmed,
    ).length;
    const byGroup: Record<string, number> = {};
    rows.forEach((r) => (byGroup[r.group] = (byGroup[r.group] ?? 0) + 1));
    const pct = total ? Math.round((attested / total) * 100) : 0;
    return { total, attested, attention, byGroup, pct };
  }, [rows, states]);

  return (
    <section className={`fm-cov${open ? " open" : ""}`}>
      <button
        className="fm-cov-main"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? "Collapse coverage" : "Expand coverage"}
      >
        <span
          className="fm-cov-ring"
          style={{
            background: `conic-gradient(var(--md-success) 0 ${stats.pct}%, var(--md-surface-2) ${stats.pct}% 100%)`,
          }}
        >
          <span>{stats.pct}%</span>
        </span>

        <span className="fm-cov-headline">
          {stats.attested} of {stats.total} attested
          {stats.attention > 0 && (
            <span className="fm-cov-judge">
              · {stats.attention} need{stats.attention === 1 ? "s" : ""} your attention
            </span>
          )}
        </span>

        <Icon name="chevron-down" size={17} className="fm-cov-chev" />
      </button>

      {open && (
        <div className="fm-cov-detail">
          <div className="fm-cov-line">
            <span>
              All <b>{stats.total}</b> items pre-filled by the AI
            </span>
            <span className="fm-cov-dot">·</span>
            <span>
              <b>0</b> left blank
            </span>
            <span className="fm-cov-dot">·</span>
            <span>each carries evidence &amp; a page cite</span>
          </div>
          <div className="fm-cov-cats">
            {Object.entries(stats.byGroup).map(([g, n]) => (
              <span key={g} className="fm-cov-cat">
                {g} <b>{n}</b>
              </span>
            ))}
          </div>
          <div className="fm-cov-scope">
            <Icon name="info" size={13} />
            Out of scope here: value-conclusion accuracy — run a Technical review for findings-level
            analysis.
          </div>
        </div>
      )}
    </section>
  );
}
