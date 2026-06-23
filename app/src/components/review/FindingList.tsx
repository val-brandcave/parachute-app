"use client";

import { Icon } from "@/components/atoms";
import { SEV_META } from "@/lib/utils";
import { tally } from "@/store";
import type { Finding, FindingState } from "@/types";

const DISP_DOT: Record<string, string> = {
  accepted: "pass",
  rejected: "fail",
  override: "flag",
  commented: "info",
  pending: "pending",
};

/**
 * The focus-mode list rail. A navigable index of findings (j/k + click) with a
 * severity cue, decision state, and a pinned slim Workbook summary in the foot —
 * the always-visible "where am I / what's left" surface. Selection drives the
 * focus pane on the right.
 */
export function FindingList({
  findings,
  states,
  selectedId,
  onSelect,
  total,
  onCompile,
}: {
  findings: Finding[];
  states: Record<string, FindingState>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  total: number;
  onCompile?: () => void;
}) {
  const t = tally(states);
  const decided = total - t.pending;
  const pct = total ? Math.round((decided / total) * 100) : 0;

  return (
    <aside className="fm-rail">
      <div className="fm-rail-list scroll">
        {findings.map((f) => {
          const st = states[f.id] ?? { disposition: "pending" };
          const sev = SEV_META[f.severity];
          const on = f.id === selectedId;
          return (
            <button
              key={f.id}
              className={`fm-row fm-row--${f.severity}${on ? " on" : ""}`}
              onClick={() => onSelect(f.id)}
              aria-current={on}
            >
              <span className="fm-row-main">
                <span className="fm-row-top">
                  <span className={`fm-row-sev fm-row-sev--${f.severity}`}>{sev.label}</span>
                  {f.byReviewer && <Icon name="user" size={12} className="fm-row-mine" />}
                  {st.flagged && <Icon name="flag" size={12} className="fm-row-flag" />}
                </span>
                <span className="fm-row-q">{f.question}</span>
                <span className="fm-row-cat">{f.category} · p.{f.page}</span>
              </span>
              <span className={`fm-row-state fm-row-state--${DISP_DOT[st.disposition]}`} />
            </button>
          );
        })}
        {findings.length === 0 && (
          <div className="fm-rail-empty">No findings match this filter.</div>
        )}
      </div>

      <div className="fm-wb">
        <div className="fm-wb-head">
          <Icon name="book" size={15} />
          Workbook
          <span className="fm-wb-sub">
            {decided}/{total}
          </span>
        </div>
        <div className="fm-wb-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <div className="fm-wb-tally">
          <span className="fm-wb-stat fm-wb-stat--pass">
            <b>{t.accepted}</b> accepted
          </span>
          <span className="fm-wb-stat fm-wb-stat--flag">
            <b>{t.override}</b> overridden
          </span>
          <span className="fm-wb-stat fm-wb-stat--fail">
            <b>{t.rejected}</b> rejected
          </span>
          <span className="fm-wb-stat">
            <b>{t.pending}</b> pending
          </span>
        </div>
        <button className="ui-btn ui-btn--primary ui-btn--sm ui-btn--block" onClick={onCompile}>
          <Icon name="document" size={15} />
          Compile workbook
        </button>
      </div>
    </aside>
  );
}
