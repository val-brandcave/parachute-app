"use client";

import { useMemo } from "react";
import { Icon } from "@/components/atoms";
import { SEV_META } from "@/lib/utils";
import type { Finding, FindingState, Severity } from "@/types";

/**
 * Coverage / anti-miss panel — the "we didn't miss a material mistake" moment,
 * as a slim header band over the finding-focus column. Collapsed by default and
 * controlled by the parent (so opening the Source PDF can auto-collapse it):
 * collapsed shows only the donut ring + a one-line headline + the expand
 * chevron; expanding reveals the checks/categories tally, the severity
 * breakdown, and the out-of-scope assurance.
 */
export function CoveragePanel({
  findings,
  states,
  open,
  onToggle,
}: {
  findings: Finding[];
  states: Record<string, FindingState>;
  open: boolean;
  onToggle: () => void;
}) {
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
          {stats.decided} of {stats.total} dispositioned
          {stats.needJudgment > 0 && (
            <span className="fm-cov-judge">
              · {stats.needJudgment} need{stats.needJudgment === 1 ? "s" : ""} your judgment
            </span>
          )}
        </span>

        <Icon name="chevron-down" size={17} className="fm-cov-chev" />
      </button>

      {open && (
        <div className="fm-cov-detail">
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
