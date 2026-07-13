"use client";

import { useEffect, useRef } from "react";
import { Chip, Icon, type ChipTone } from "@/components/atoms";
import { ConfidenceMeter } from "@/components/molecules";
import { attNeedsAttention, type AttestationRow } from "@/store";
import type { AttAnswer, AttestationState } from "@/types";

/**
 * Inline attestation rows (Phase 2c) — the Administrative twin of
 * `WorkbookInline`. The compiled attestation document keeps its compliance-form
 * TABLE (the bank's checklist is the artifact), but each row becomes the
 * decision surface: the Answer cell is a live Yes / No / N-A control with the
 * one-click-attest semantics of `AttestationDecisionBar`, and clicking a row
 * expands an evidence zone (AI suggestion + confidence + quoted span) with the
 * required divergence reason. Structure is deliberately LOCKED — the checklist
 * is org-authored in Templates; only answers and reasons are editable here.
 * Everything renders on paper tokens inside `.wb-doc`.
 */

const ANS_LABEL: Record<AttAnswer, string> = { YES: "Yes", NO: "No", NA: "N/A" };
const ANS_TONE: Record<AttAnswer, ChipTone & ("pass" | "fail" | "neutral")> = {
  YES: "pass",
  NO: "fail",
  NA: "neutral",
};
const ANSWERS: AttAnswer[] = ["YES", "NO", "NA"];

/** The attestation actions the document rows drive — same store the Source
 *  rail's decision bar writes, so the two surfaces can never disagree. */
export interface AttestationDocActions {
  onSetAnswer: (itemId: string, a: AttAnswer) => void;
  onSetReason: (itemId: string, reason: string) => void;
  onConfirm: (itemId: string) => void;
  onUnconfirm: (itemId: string) => void;
  /** Cite deep-link: open the Source view at this item's cited span. */
  onOpenSource: (itemId: string) => void;
}

/**
 * One checklist item as a pair of table rows: the form row (number · question ·
 * live answer · cite) and, while open, an expansion row carrying the evidence
 * and the divergence reason. `open` is host-controlled so the sign-gate callout
 * can cycle rows open from outside.
 */
export function AttestationDocRow({
  r,
  state,
  index,
  open,
  actions,
  onSetOpen,
}: {
  r: AttestationRow;
  state: AttestationState;
  index: number;
  open: boolean;
  actions: AttestationDocActions;
  onSetOpen: (itemId: string | null) => void;
}) {
  const changed = state.answer !== r.aiAnswer;
  const needs = attNeedsAttention(r) && !state.confirmed;
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  // A divergent pick opens the reason zone — park the caret there so the
  // required note is one keystroke away, never a hunt.
  useEffect(() => {
    if (open && changed && !state.confirmed) reasonRef.current?.focus();
  }, [open, changed, state.confirmed]);

  // One-click model (shared with AttestationDecisionBar): choosing the AI's
  // answer attests immediately; a divergent answer sets it and opens the row
  // for the required reason.
  const choose = (a: AttAnswer) => {
    if (state.confirmed && state.answer === a) return;
    actions.onSetAnswer(r.itemId, a);
    if (a === r.aiAnswer) {
      actions.onSetReason(r.itemId, "");
      actions.onConfirm(r.itemId);
    } else {
      onSetOpen(r.itemId);
    }
  };
  const cancelChange = () => {
    actions.onSetAnswer(r.itemId, r.aiAnswer);
    actions.onSetReason(r.itemId, "");
  };

  return (
    <>
      <tr
        className={`attdoc-tr${open ? " is-open" : ""}${needs ? " is-needs" : ""}`}
        data-att-item={r.itemId}
      >
        <td className="attdoc-n">{index + 1}</td>
        <td>
          <button
            className="attdoc-qbtn"
            onClick={() => onSetOpen(open ? null : r.itemId)}
            aria-expanded={open}
          >
            <span className="attdoc-qtext">{r.question}</span>
            {needs && (
              <span className="attdoc-needs">
                <Icon name="flag" size={10} /> Needs attention
              </span>
            )}
            <Icon name="chevron-down" size={13} className={`attdoc-chev${open ? " on" : ""}`} />
          </button>
          {state.confirmed && changed && (
            <div className="attdoc-changed">
              <b>Changed from {ANS_LABEL[r.aiAnswer]}</b> — {state.reason}
            </div>
          )}
        </td>
        <td className="attdoc-ans-col">
          <div className="attdoc-ansctl" role="group" aria-label="Your answer">
            {ANSWERS.map((a) => {
              const committed = state.answer === a && (state.confirmed || changed);
              const suggested = !state.confirmed && !changed && a === r.aiAnswer;
              return (
                <button
                  key={a}
                  className={`attdoc-ansbtn${committed ? ` on--${ANS_TONE[a]}` : ""}${
                    suggested ? " is-suggested" : ""
                  }`}
                  onClick={() => choose(a)}
                  aria-pressed={committed}
                  title={
                    suggested ? `AI suggests ${ANS_LABEL[a]} — click to attest` : undefined
                  }
                >
                  {ANS_LABEL[a]}
                </button>
              );
            })}
          </div>
        </td>
        <td className="attdoc-cite">
          {r.page > 0 ? (
            <button
              className="attdoc-citebtn"
              onClick={() => actions.onOpenSource(r.itemId)}
              title="Open the cited span in Source"
            >
              p.{r.page}
            </button>
          ) : (
            "—"
          )}
        </td>
      </tr>

      {open && (
        <tr className="attdoc-xrow">
          <td colSpan={4}>
            <div className="attdoc-x">
              <div className="attdoc-x-ai">
                <span className="attdoc-x-sug">
                  <Icon name="ai" size={12} /> AI suggests{" "}
                  <Chip tone={ANS_TONE[r.aiAnswer]}>{ANS_LABEL[r.aiAnswer]}</Chip>
                </span>
                {!r.unprefilled && <ConfidenceMeter value={r.confidence} />}
              </div>
              <blockquote className="attdoc-x-evi">
                <Icon name="quote" size={12} /> {r.evidence}
              </blockquote>

              {state.confirmed ? (
                <div className="attdoc-x-done">
                  <Icon name="check-circle" size={13} />
                  Attested{changed ? " (changed)" : ""}
                  <button
                    className="attdoc-x-reopen"
                    onClick={() => actions.onUnconfirm(r.itemId)}
                  >
                    Re-open
                  </button>
                </div>
              ) : changed ? (
                <div className="attdoc-x-reason">
                  <label className="attdoc-x-lbl" htmlFor={`attdoc-reason-${r.itemId}`}>
                    <Icon name="edit" size={12} />
                    Reason for changing from {ANS_LABEL[r.aiAnswer]} · required for the audit
                    trail
                  </label>
                  <textarea
                    ref={reasonRef}
                    id={`attdoc-reason-${r.itemId}`}
                    className="attdoc-x-input"
                    value={state.reason ?? ""}
                    onChange={(e) => actions.onSetReason(r.itemId, e.target.value)}
                    placeholder="Why does your answer differ from the AI&rsquo;s suggestion?"
                    rows={2}
                  />
                  <div className="attdoc-x-foot">
                    <button className="attdoc-x-cancel" onClick={cancelChange}>
                      Cancel
                    </button>
                    <button
                      className="attdoc-x-confirm"
                      onClick={() => actions.onConfirm(r.itemId)}
                      disabled={!state.reason?.trim()}
                    >
                      <Icon name="check" size={13} /> Confirm change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="attdoc-x-hint">
                  Click the suggested answer to attest in one click — or pick a different one
                  and note why.
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
