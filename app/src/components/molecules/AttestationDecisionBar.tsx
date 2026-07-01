"use client";

import { useEffect } from "react";
import { Icon, type ChipTone } from "@/components/atoms";
import type { AttestationRow } from "@/store";
import type { AttestationState, AttAnswer } from "@/types";

const ANS_LABEL: Record<AttAnswer, string> = { YES: "Yes", NO: "No", NA: "N/A" };
const ANS_TONE: Record<AttAnswer, ChipTone> = { YES: "pass", NO: "fail", NA: "neutral" };
const ANSWERS: AttAnswer[] = ["YES", "NO", "NA"];

/**
 * The shared attestation decision core (F-118) — the Administrative twin of
 * {@link FindingDecisionBar}. A Yes / No / N-A answer toggle: clicking the AI's
 * suggested answer attests in one click; a divergent answer opens the required
 * reason (the audit trail demands it) with a Confirm. Store-agnostic + props
 * driven, so the routed `AttestationFocus` and the run-flow `RunAttestations`
 * accordion can share it. Keyboard: y / n / x choose, c confirms a pending
 * change. `variant` is spatial only.
 */
export function AttestationDecisionBar({
  row,
  state,
  variant = "focus",
  keyboard = true,
  onSetAnswer,
  onSetReason,
  onConfirm,
  onUnconfirm,
}: {
  row: AttestationRow;
  state: AttestationState;
  variant?: "focus" | "accordion";
  keyboard?: boolean;
  onSetAnswer: (a: AttAnswer) => void;
  onSetReason: (reason: string) => void;
  onConfirm: () => void;
  onUnconfirm: () => void;
}) {
  const answer = state.answer;
  const changed = answer !== row.aiAnswer;

  // One-click model: the AI's answer attests immediately; a divergent answer
  // just sets it and opens the reason.
  const choose = (a: AttAnswer) => {
    onSetAnswer(a);
    if (a === row.aiAnswer) {
      onSetReason("");
      onConfirm();
    }
  };
  const cancelChange = () => {
    onSetAnswer(row.aiAnswer);
    onSetReason("");
  };

  useEffect(() => {
    if (!keyboard) return;
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
          onConfirm();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.itemId, row.aiAnswer, keyboard]);

  return (
    <div className={`adb adb--${variant}`}>
      <div className="adb-row">
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
            <button className="att-reopen" onClick={onUnconfirm}>
              Re-open
            </button>
          </span>
        ) : !changed ? (
          <span className="att-hint">Tap to attest</span>
        ) : null}
      </div>

      {changed && !state.confirmed && (
        <div className="att-reason">
          <label className="att-reason-lbl" htmlFor={`adb-reason-${row.itemId}`}>
            <Icon name="edit" size={14} />
            Reason for changing from {ANS_LABEL[row.aiAnswer]} · required for the audit trail
          </label>
          <textarea
            id={`adb-reason-${row.itemId}`}
            className="ui-textarea"
            value={state.reason ?? ""}
            onChange={(e) => onSetReason(e.target.value)}
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
              onClick={onConfirm}
              disabled={!state.reason?.trim()}
            >
              <Icon name="check" size={16} />
              Confirm change
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
