"use client";

import { Fragment, useEffect } from "react";
import { Chip, Icon, type ChipTone } from "@/components/atoms";
import { ConfidenceMeter } from "@/components/molecules";
import { useAdminStore, attNeedsAttention, type AttestationRow } from "@/store";
import type { AttestationState, AttAnswer } from "@/types";

const ANS_LABEL: Record<AttAnswer, string> = { YES: "Yes", NO: "No", NA: "N/A" };
const ANS_TONE: Record<AttAnswer, ChipTone> = { YES: "pass", NO: "fail", NA: "neutral" };
const ANSWERS: AttAnswer[] = ["YES", "NO", "NA"];

/**
 * The attestation focus pane — one checklist item in full, the Administrative
 * twin of `FindingFocus`. Group + needs-attention cue, the question, the AI's
 * suggested answer + confidence + page cite, the quoted evidence (the scrolling
 * body), then the shared bottom-anchored decision bar: a Yes / No / N-A toggle
 * left, status right. Clicking the AI's suggested answer attests in **one
 * click**; choosing a different answer opens the inline reason field (submit on
 * the right) — the audit trail requires it. Keyboard: y / n / x choose, c
 * confirms a pending change.
 */
export function AttestationFocus({
  row,
  state,
  onCite,
}: {
  row: AttestationRow;
  state: AttestationState;
  onCite: (page: number) => void;
}) {
  const { setAnswer, setReason, confirm, unconfirm } = useAdminStore();

  const answer = state.answer;
  const changed = answer !== row.aiAnswer;
  const needs = attNeedsAttention(row) && !state.confirmed;
  const hasCite = row.page > 0;

  // One-click model: clicking the AI's suggested answer attests immediately
  // (no reason needed); a divergent answer just sets it and opens the reason.
  const choose = (a: AttAnswer) => {
    setAnswer(row.itemId, a);
    if (a === row.aiAnswer) {
      setReason(row.itemId, "");
      confirm(row.itemId);
    }
  };
  const cancelChange = () => {
    setAnswer(row.itemId, row.aiAnswer);
    setReason(row.itemId, "");
  };

  // y / n / x choose, c confirms a pending change. Ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case "y":
          choose("YES");
          break;
        case "n":
          choose("NO");
          break;
        case "x":
          choose("NA");
          break;
        case "c":
          confirm(row.itemId);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.itemId, row.aiAnswer]);

  return (
    <article className="fm-focus">
      <div className="fm-focus-body scroll">
        <header className="fm-focus-head">
          <div className="fm-focus-eyebrow">
            <span className="fm-cat">{row.group}</span>
            {row.requireCitation && <span className="fm-pip">Citation required</span>}
            {needs && (
              <span className="fm-pip fm-pip--flag">
                <Icon name="flag" size={11} /> Review closely
              </span>
            )}
          </div>
          <h2 className="fm-focus-q">{row.question}</h2>
          <div className="fm-focus-meta">
            {[
              <span key="ai" className="att-ai-sug">
                <Icon name="ai" size={14} />
                AI suggests
                <Chip tone={ANS_TONE[row.aiAnswer]}>{ANS_LABEL[row.aiAnswer]}</Chip>
              </span>,
              !row.unprefilled ? <ConfidenceMeter key="conf" value={row.confidence} /> : null,
              hasCite ? (
                <button key="cite" className="fm-cite" onClick={() => onCite(row.page)}>
                  <Icon name="book" size={14} />
                  View source · p.{row.page}
                </button>
              ) : null,
            ]
              .filter(Boolean)
              .map((node, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className="fm-meta-sep" aria-hidden />}
                  {node}
                </Fragment>
              ))}
          </div>
        </header>

        <section className="fm-sec">
          <div className="fm-sec-t">
            <Icon name="quote" size={13} />
            Evidence
            {hasCite && (
              <button className="fm-cite fm-cite--inline" onClick={() => onCite(row.page)}>
                p.{row.page}
              </button>
            )}
          </div>
          <blockquote className="fm-evidence">{row.evidence}</blockquote>
        </section>
      </div>

      <footer className="fm-actions">
        <div className="fm-actions-row">
          <span className="att-decide-label">Your answer</span>
          <div className="att-ans" role="group" aria-label="Your answer">
            {ANSWERS.map((a) => {
              const committed = answer === a && (state.confirmed || changed);
              const suggested = !state.confirmed && !changed && a === row.aiAnswer;
              return (
                <button
                  key={a}
                  className={`att-ans-opt${committed ? ` on--${ANS_TONE[a]}` : ""}${
                    suggested ? " is-suggested" : ""
                  }`}
                  onClick={() => choose(a)}
                  aria-pressed={committed}
                >
                  {ANS_LABEL[a]}
                </button>
              );
            })}
          </div>

          {state.confirmed ? (
            <span className="fm-disp fm-disp--pass">
              <Icon name="check-circle" size={15} />
              Attested{changed ? " (changed)" : ""}
              <button className="att-reopen" onClick={() => unconfirm(row.itemId)}>
                Re-open
              </button>
            </span>
          ) : changed ? (
            <span className="fm-disp fm-disp--flag">
              <Icon name="edit" size={15} />
              Reason required
            </span>
          ) : (
            <span className="att-hint">Tap your answer to attest</span>
          )}
        </div>

        {changed && !state.confirmed && (
          <div className="att-reason">
            <label className="att-reason-lbl" htmlFor={`att-reason-${row.itemId}`}>
              <Icon name="edit" size={14} />
              You changed the AI&rsquo;s answer ({ANS_LABEL[row.aiAnswer]} → {ANS_LABEL[answer]}) — add
              a reason for the audit trail.
            </label>
            <textarea
              id={`att-reason-${row.itemId}`}
              className="ui-textarea"
              value={state.reason ?? ""}
              onChange={(e) => setReason(row.itemId, e.target.value)}
              placeholder="Why does your answer differ from the AI&rsquo;s suggestion?"
              rows={2}
              autoFocus
            />
            <div className="att-reason-foot">
              <button className="ui-btn ui-btn--ghost ui-btn--sm" onClick={cancelChange}>
                Cancel
              </button>
              <button
                className="att-confirm"
                onClick={() => confirm(row.itemId)}
                disabled={!state.reason?.trim()}
              >
                <Icon name="check" size={16} />
                Confirm change
              </button>
            </div>
          </div>
        )}
      </footer>
    </article>
  );
}
