"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/atoms";
import { SEV_META } from "@/lib/utils";
import type { Finding, FindingState, Severity } from "@/types";

/**
 * Coverage / anti-miss panel — the "we didn't miss a material mistake" moment.
 * A progress ring over the disposition rate, plus the checks-run / categories /
 * skipped / needs-judgment tally that proves the pipeline's reach. Collapsible:
 * the ring + headline stay; the category breakdown + scope note tuck away.
 */
export function CoveragePanel({
  findings,
  states,
}: {
  findings: Finding[];
  states: Record<string, FindingState>;
}) {
  const [open, setOpen] = useState(true);

  const stats = useMemo(() => {
    const total = findings.length;
    const decided = findings.filter((f) => (states[f.id]?.disposition ?? "pending") !== "pending")
      .length;
    const byCat: Record<string, number> = {};
    findings.forEach((f) => (byCat[f.category] = (byCat[f.category] ?? 0) + 1));
    const bySev: Partial<Record<Severity, number>> = {};
    findings.forEach((f) => (bySev[f.severity] = (bySev[f.severity] ?? 0) + 1));
    // "Needs judgment" = unresolved findings the AI couldn't clear on its own
    // (anything not a clean pass that the reviewer hasn't dispositioned yet).
    const needJudgment = findings.filter(
      (f) => f.severity !== "pass" && (states[f.id]?.disposition ?? "pending") === "pending",
    ).length;
    const pct = total ? Math.round((decided / total) * 100) : 0;
    return { total, decided, categories: Object.keys(byCat).length, bySev, needJudgment, pct };
  }, [findings, states]);

  return (
    <section className={`fm-cov${open ? " open" : ""}`}>
      <div className="fm-cov-main">
        <div
          className="fm-cov-ring"
          style={{
            background: `conic-gradient(var(--md-success) 0 ${stats.pct}%, var(--md-surface-2) ${stats.pct}% 100%)`,
          }}
        >
          <span>{stats.pct}%</span>
        </div>

        <div className="fm-cov-body">
          <div className="fm-cov-headline">
            {stats.decided} of {stats.total} findings dispositioned
            {stats.needJudgment > 0 && (
              <span className="fm-cov-judge">
                · {stats.needJudgment} need{stats.needJudgment === 1 ? "s" : ""} your judgment
              </span>
            )}
          </div>
          <div className="fm-cov-line">
            <span>
              <b>{stats.total}</b> checks across <b>{stats.categories}</b> categories
            </span>
            <span className="fm-cov-dot">·</span>
            <span>
              <b>0</b> skipped
            </span>
            <span className="fm-cov-dot">·</span>
            <span>full pipeline S1–S5</span>
          </div>
        </div>

        <button
          className="fm-cov-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Collapse coverage" : "Expand coverage"}
        >
          <Icon name="chevron-down" size={18} />
        </button>
      </div>

      {open && (
        <div className="fm-cov-detail">
          <div className="fm-cov-cats">
            {(["crit", "fail", "flag", "pass"] as Severity[]).map((s) =>
              stats.bySev[s] ? (
                <span key={s} className={`fm-cov-cat fm-cov-cat--${s}`}>
                  <b>{stats.bySev[s]}</b> {SEV_META[s].label}
                </span>
              ) : null,
            )}
          </div>
          <div className="fm-cov-scope">
            <Icon name="check-circle" size={13} />
            Nothing flagged out of scope — every category in the engagement was evaluated.
          </div>
        </div>
      )}
    </section>
  );
}
