"use client";

import { Icon } from "@/components/atoms";
import { attNeedsAttention, attTally, type AttestationRow } from "@/store";
import type { AttestationState, AttAnswer } from "@/types";

/** Answer → the rail's short label + state-dot tone. */
const ANS: Record<AttAnswer, { label: string; tone: string }> = {
  YES: { label: "Yes", tone: "pass" },
  NO: { label: "No", tone: "fail" },
  NA: { label: "N/A", tone: "na" },
};

/**
 * The attestation list rail — the Administrative twin of `FindingList`. A
 * navigable index of checklist items (j/k + click) showing the current answer,
 * its group, and an attestation-state dot (attested → answer tone · needs
 * attention → flag · pending → hollow). The foot pins a slim progress summary
 * and the jump to Preview & sign. Same `.fm-rail` shell as Technical.
 */
export function AttestationList({
  rows,
  states,
  selectedId,
  onSelect,
  onPreview,
}: {
  rows: AttestationRow[];
  states: Record<string, AttestationState>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPreview?: () => void;
}) {
  const total = rows.length;
  const t = attTally(states);
  const attention = rows.filter(
    (r) => attNeedsAttention(r) && !states[r.itemId]?.confirmed,
  ).length;
  const pct = total ? Math.round((t.attested / total) * 100) : 0;

  return (
    <aside className="fm-rail">
      <div className="fm-rail-list scroll">
        {rows.map((r) => {
          const st = states[r.itemId] ?? { answer: r.aiAnswer, confirmed: false };
          const on = r.itemId === selectedId;
          const needs = attNeedsAttention(r) && !st.confirmed;
          const dot = st.confirmed ? ANS[st.answer].tone : needs ? "flag" : "pending";
          return (
            <button
              key={r.itemId}
              className={`fm-row fm-row--${ANS[st.answer].tone}${on ? " on" : ""}`}
              onClick={() => onSelect(r.itemId)}
              aria-current={on}
            >
              <span className="fm-row-main">
                <span className="fm-row-top">
                  <span className={`fm-row-sev fm-row-sev--${ANS[st.answer].tone}`}>
                    {ANS[st.answer].label}
                  </span>
                  {needs && <Icon name="flag" size={12} className="fm-row-flag" />}
                </span>
                <span className="fm-row-q">{r.question}</span>
                <span className="fm-row-cat">{r.group}</span>
              </span>
              <span className={`fm-row-state fm-row-state--${dot}`} />
            </button>
          );
        })}
        {rows.length === 0 && <div className="fm-rail-empty">No items match this filter.</div>}
      </div>

      <div className="fm-wb">
        <div className="fm-wb-head">
          <Icon name="checklist" size={15} />
          Attestation
          <span className="fm-wb-sub">
            {t.attested}/{total}
          </span>
        </div>
        <div className="fm-wb-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <div className="fm-wb-tally">
          <span className="fm-wb-stat fm-wb-stat--pass">
            <b>{t.attested}</b> attested
          </span>
          <span className="fm-wb-stat fm-wb-stat--flag">
            <b>{attention}</b> need attention
          </span>
          <span className="fm-wb-stat">
            <b>{t.pending}</b> pending
          </span>
        </div>
        <button className="ui-btn ui-btn--primary ui-btn--sm ui-btn--block" onClick={onPreview}>
          <Icon name="document" size={15} />
          Preview &amp; sign
        </button>
      </div>
    </aside>
  );
}
