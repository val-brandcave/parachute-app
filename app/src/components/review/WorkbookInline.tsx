"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/atoms";
import { SEV_META } from "@/lib/utils";
import { generateId } from "@/types";
import { ResponseComposer, type ComposerMode } from "./ResponseComposer";
import { GridCell } from "./WorkbookExhibits";
import type { Comment, LedgerPatch } from "@/store";
import {
  isIsoDate,
  formatActionDeadline,
  type WbSection,
  type WbSectionType,
  type WbCondition,
  type WbActionItem,
} from "@/lib/workbook-config";
import type {
  Disposition,
  Finding,
  FindingState,
  ResponseTemplate,
  WbAdjustmentRow,
  WbSwot,
  WorkbookExhibits as WorkbookExhibitsData,
} from "@/types";

/**
 * Inline workbook editing (Phase 2a, F-143/F-144) — the pieces that turn the
 * compiled document into the decision surface. The workbook host passes these
 * actions down; everything renders on paper tokens inside `.wb-doc`.
 */
export interface WorkbookEditingActions {
  responses: ResponseTemplate[];
  onDisposition: (
    findingId: string,
    disp: Disposition,
    reason?: string,
    templateId?: string,
  ) => void;
  onComment: (findingId: string, comment: string, templateId?: string) => void;
  onToggleFlag: (findingId: string) => void;
  onUpdateSection: (id: string, patch: Partial<WbSection>) => void;
  onAddCompRow: () => void;
  onDeleteCompRow: (comp: string) => void;
  onUpdateCompRow: (comp: string, patch: Partial<WbAdjustmentRow>) => void;
  // ---- on-canvas structure (section chrome, Phase 2a.5) ----
  onToggleSection: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onDuplicateSection: (id: string) => void;
  onMoveSectionBefore: (id: string, beforeId: string | null) => void;
  /** Insert a fresh section of `type` before `beforeId` (null = end). */
  onInsertSection: (type: WbSectionType, beforeId: string | null) => void;
  /** Open the reviewer-finding composer for a findings CHAPTER (section id) —
   *  the finding is a first-class object added to that chapter, not content
   *  dropped at a cursor position. */
  onRequestAddFinding: (sectionId: string | null) => void;
  /** Replace one SWOT quadrant's items (inline card editing). */
  onUpdateSwot: (quadrant: keyof WbSwot, items: string[]) => void;
  /** Patch the cap-rate exhibit (structured point/band editing). */
  onUpdateCapRate: (patch: Partial<WorkbookExhibitsData["capRate"]>) => void;
  /** Bring an excluded finding back into the workbook (audited as "Restored"). */
  onRestoreFinding: (findingId: string) => void;
  /** Reword a reviewer's OWN finding body (never the AI's). */
  onEditReviewer: (findingId: string, text: string) => void;
  /** Delete a reviewer's OWN finding. */
  onRemoveReviewer: (findingId: string) => void;
  // ---- Comments anywhere (Phase 2b) — margin pins on any block ----
  /** All block-anchored comments (the pin filters to its own anchor). */
  comments: Comment[];
  /** Post a comment against a block (section/finding/prose). */
  onAddComment: (anchorId: string, anchorLabel: string, body: string) => void;
  /** Remove a comment (audited). */
  onDeleteComment: (id: string) => void;
  // ---- Conditions / action items authoring (F-151) ----
  /** Persist the materialized conditions list (+ audit). */
  onCommitConditions: (next: WbCondition[], log: LedgerPatch) => void;
  /** Persist the materialized action-items list (+ audit). */
  onCommitActionItems: (next: WbActionItem[], log: LedgerPatch) => void;
}

/** An assignable owner for an action item — the external fee appraiser (default)
 *  or an internal teammate. `value` is what's stored; `label` may append "(You)". */
export interface OwnerOption {
  label: string;
  value: string;
  kind: "firm" | "person";
}

const fmtTime = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/** "Edited by reviewer" provenance pip (audit layer 1) — carried on prose blocks
 *  and rewritten findings; hover spells out who and when. */
export function ProvenancePip({
  label,
  by,
  at,
  tone = "edit",
}: {
  label: string;
  by?: string;
  at?: number;
  tone?: "edit" | "user";
}) {
  return (
    <span
      className={`wb-pip wb-pip--${tone}`}
      title={by ? `${label} — ${by}${at ? ` · ${fmtTime(at)}` : ""}` : label}
    >
      <Icon name="edit" size={11} />
      {label}
    </span>
  );
}

/**
 * A finding living IN the document (wireframe screen 1): severity + title +
 * citation chip, the finding text, and an inline Concur / Edit / Reject /
 * Delete bar while undecided — or the decided line + Undo once dispositioned.
 * Edit flips the block into the shared composer where it stands (no side
 * panel — the HubSpot click-to-edit mechanic without the inspector).
 */
export function WorkbookFindingBlock({
  f,
  state,
  property,
  reviewerName,
  actions,
}: {
  f: Finding;
  state: FindingState | undefined;
  property: string;
  reviewerName: string;
  actions: WorkbookEditingActions;
}) {
  const [composer, setComposer] = useState<ComposerMode | null>(null);
  const disp = state?.disposition ?? "pending";
  const decided = disp === "accepted" || disp === "edited";
  const text = disp === "edited" && state?.reason ? state.reason : f.analysis;

  const save = (t: string, templateId?: string) => {
    if (composer === "comment") actions.onComment(f.id, t, templateId);
    // Reviewer's own finding: Edit reweords the finding itself, never a disposition.
    else if (f.byReviewer && composer === "edit") actions.onEditReviewer(f.id, t);
    else if (composer)
      actions.onDisposition(f.id, composer === "edit" ? "edited" : "rejected", t, templateId);
    setComposer(null);
  };

  return (
    <div
      className={`wb-fblock wb-fblock--${f.severity}${f.byReviewer ? " is-user" : ""}`}
      data-finding={f.id}
    >
      {/* Identity: title first, then ONE quiet meta row — severity is doubly
          coded (spine color + small word), citation and authorship live here.
          All decision/provenance STATE lives in the footer, nowhere else. */}
      <div className="wb-fblock-q">{f.question}</div>
      <div className="wb-fblock-meta">
        <span className={`wb-fmeta-sev wb-fmeta-sev--${f.severity}`}>
          {SEV_META[f.severity].label}
        </span>
        <span className="wb-fmeta-sep" aria-hidden="true">
          ·
        </span>
        <span className="wb-fmeta-cite" title="Opens the cited span in Source (Phase 2b)">
          Cited p.{f.page}
        </span>
        {f.byReviewer && (
          <>
            <span className="wb-fmeta-sep" aria-hidden="true">
              ·
            </span>
            <span className="wb-fmeta-user">Added by {reviewerName}</span>
          </>
        )}
      </div>

      <p className="wb-fblock-text">{text}</p>

      {!composer && (
        <div className="wb-fblock-foot">
          {f.byReviewer ? (
            /* Reviewer's own finding: manage it (no Concur/Reject — you authored it). */
            <div className="wb-fblock-bar">
              <button className="wb-fbtn" onClick={() => setComposer("edit")}>
                <Icon name="edit" size={14} /> Edit
              </button>
              <button
                className="wb-fbtn wb-fbtn--no"
                onClick={() => actions.onRemoveReviewer(f.id)}
                title="Remove your finding"
              >
                <Icon name="trash" size={14} /> Remove
              </button>
              <span className="wb-fblock-aux">
                <button
                  className={`wb-faux${state?.comment ? " on" : ""}`}
                  onClick={() => setComposer("comment")}
                  aria-label="Comment"
                  title="Comment"
                >
                  <Icon name="comment" size={14} />
                </button>
                <button
                  className={`wb-faux${state?.flagged ? " on" : ""}`}
                  onClick={() => actions.onToggleFlag(f.id)}
                  aria-label={state?.flagged ? "Clear follow-up flag" : "Flag for follow-up"}
                  title="Flag for follow-up"
                >
                  <Icon name="flag" size={14} />
                </button>
              </span>
            </div>
          ) : decided ? (
            <div className="wb-fblock-decided">
              <Icon name="check-circle" size={14} />
              <span>
                {disp === "edited" ? (
                  <>
                    Concurred with edits —{" "}
                    <span
                      className="wb-fdec-prov"
                      title={`Original AI finding: ${f.analysis}`}
                    >
                      rewritten by you
                    </span>
                  </>
                ) : (
                  "Concurred"
                )}
                {state?.decidedAt ? ` · ${fmtTime(state.decidedAt)}` : ""}
              </span>
              <button
                className="wb-fblock-undo"
                onClick={() => actions.onDisposition(f.id, "pending")}
              >
                Undo
              </button>
            </div>
          ) : (
            <div className="wb-fblock-bar">
              <button
                className="wb-fbtn wb-fbtn--go"
                onClick={() => actions.onDisposition(f.id, "accepted")}
              >
                <Icon name="check" size={14} /> Concur
              </button>
              <button className="wb-fbtn" onClick={() => setComposer("edit")}>
                <Icon name="edit" size={14} /> Edit
              </button>
              <button className="wb-fbtn wb-fbtn--no" onClick={() => setComposer("rejected")}>
                <Icon name="reject" size={14} /> Reject
              </button>
              <button
                className="wb-fbtn"
                onClick={() => actions.onDisposition(f.id, "removed")}
                title="Excluded from the workbook, retained in the audit record"
              >
                <Icon name="trash" size={14} /> Delete
              </button>
              <span className="wb-fblock-aux">
                <button
                  className={`wb-faux${state?.comment ? " on" : ""}`}
                  onClick={() => setComposer("comment")}
                  aria-label="Comment"
                  title="Comment"
                >
                  <Icon name="comment" size={14} />
                </button>
                <button
                  className={`wb-faux${state?.flagged ? " on" : ""}`}
                  onClick={() => actions.onToggleFlag(f.id)}
                  aria-label={state?.flagged ? "Clear follow-up flag" : "Flag for follow-up"}
                  title="Flag for follow-up"
                >
                  <Icon name="flag" size={14} />
                </button>
              </span>
            </div>
          )}
          {state?.comment && (
            <p className="wb-fblock-note">
              <Icon name="comment" size={12} /> &ldquo;{state.comment}&rdquo;
            </p>
          )}
        </div>
      )}

      {composer && (
        <ResponseComposer
          mode={composer}
          finding={f}
          property={property}
          responses={actions.responses}
          initialText={
            composer === "comment"
              ? state?.comment ?? ""
              : composer === "edit"
                ? state?.reason ?? f.analysis
                : state?.reason ?? ""
          }
          onSave={save}
          onCancel={() => setComposer(null)}
        />
      )}
    </div>
  );
}

/**
 * Prose edit-in-place (wireframe callout 9): click the paragraph → caret in
 * place (plain text, no toolbar — "crayons"), ✓/blur commits, Esc cancels.
 */
export function EditableProse({
  text,
  display,
  edited,
  className = "wb-prose",
  onCommit,
}: {
  /** The plain text seeded into the editor. */
  text: string;
  /** What to render while idle (defaults to the text; lets the conclusion keep
   *  its derived rich markup until first edited). */
  display?: React.ReactNode;
  edited?: { by: string; at: number };
  className?: string;
  onCommit: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (!editing || !ref.current) return;
    // Focus and park the caret at the end of the block.
    ref.current.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [editing]);

  const commit = () => {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const t = ref.current?.innerText.trim() ?? "";
    setEditing(false);
    if (t && t !== text.trim()) onCommit(t);
  };

  if (editing) {
    return (
      <div className="wb-eprose is-editing">
        <div
          ref={ref}
          className={className}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Edit narrative"
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              cancelled.current = true;
              setEditing(false);
            }
          }}
        >
          {text}
        </div>
        <div className="wb-eprose-ctl">
          {/* preventDefault on mousedown so blur doesn't commit first */}
          <button onMouseDown={(e) => e.preventDefault()} onClick={commit}>
            <Icon name="check" size={12} /> Done
          </button>
          <span>Esc to cancel</span>
        </div>
      </div>
    );
  }

  return (
    <div className="wb-eprose">
      {edited && <ProvenancePip label="Edited by reviewer" by={edited.by} at={edited.at} />}
      <div
        className={`${className} wb-eprose-idle`}
        role="button"
        tabIndex={0}
        title="Click to edit"
        onClick={() => setEditing(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setEditing(true);
          }
        }}
      >
        {display ?? text}
      </div>
    </div>
  );
}

/**
 * Conditions of Approval (F-151) — the batched corrections sent to the fee
 * appraiser. The list derives from the conditioned findings until the reviewer
 * touches it; the first edit materializes an authored list (a condition's
 * WORDING is authored separately from the raw finding text). Read-only prints
 * the numbered list; edit mode adds click-to-edit wording, per-row remove, and
 * a ＋Add for standalone conditions (no source finding).
 */
export function ConditionsBlock({
  conditions,
  editing,
  onCommit,
}: {
  conditions: WbCondition[];
  editing: boolean;
  onCommit: (next: WbCondition[], log: LedgerPatch) => void;
}) {
  const rewordCondition = (id: string, text: string) => {
    const before = conditions.find((c) => c.id === id)?.text ?? "";
    if (before === text) return;
    onCommit(
      conditions.map((c) => (c.id === id ? { ...c, text } : c)),
      { action: "Reworded a condition", before, after: text, icon: "edit", kind: "edit" },
    );
  };
  const removeCondition = (id: string) => {
    const gone = conditions.find((c) => c.id === id);
    onCommit(conditions.filter((c) => c.id !== id), {
      action: "Removed a condition",
      target: gone?.text,
      icon: "trash",
      kind: "exclude",
    });
  };
  const addCondition = () => {
    const fresh: WbCondition = { id: generateId(), text: "New condition — click to edit" };
    onCommit([...conditions, fresh], {
      action: "Added a condition",
      target: "Reviewer-added condition",
      icon: "add",
      kind: "structure",
    });
  };

  return (
    <>
      {conditions.length > 0 ? (
        <>
          <p className="wb-prose">
            Approval is recommended subject to the following condition
            {conditions.length === 1 ? "" : "s"} being satisfied prior to funding:
          </p>
          <ol className="wb-conditions">
            {conditions.map((c, i) => (
              <li key={c.id}>
                <span className="wb-cond-id">C{i + 1}</span>
                <div className="wb-cond-body">
                  <div className="wb-cond-text">
                    {editing ? (
                      <GridCell
                        raw={c.text}
                        display={c.text}
                        onCommit={(v) =>
                          v.trim() ? rewordCondition(c.id, v.trim()) : removeCondition(c.id)
                        }
                      />
                    ) : (
                      c.text
                    )}
                  </div>
                  <div className="wb-cond-src">
                    {c.sourceFindingId
                      ? `${c.category ?? "Finding"} · p.${c.page}`
                      : "Reviewer-added condition"}
                  </div>
                </div>
                {editing && (
                  <button
                    className="wb-rowdel is-shown"
                    onClick={() => removeCondition(c.id)}
                    aria-label="Remove this condition"
                    title="Remove condition"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                )}
              </li>
            ))}
          </ol>
        </>
      ) : (
        editing && (
          <p className="wb-prose wb-muted">
            No conditions yet — add the corrections the appraiser must resolve before funding.
          </p>
        )
      )}
      {editing && (
        <button className="wb-addrow" onClick={addCondition}>
          <Icon name="add" size={13} /> Add condition
        </button>
      )}
    </>
  );
}

/**
 * Conclusion action items (F-151) — the tracked asks, each with a structured
 * owner (the fee appraiser by default, reassignable to a teammate) and a
 * deadline (an authored date, or the severity phrase until dated). Derives from
 * dispositions until first edited, then materializes into an authored list.
 */
export function ActionItemsBlock({
  items,
  editing,
  owners,
  showTiming = true,
  onCommit,
}: {
  items: WbActionItem[];
  editing: boolean;
  owners: OwnerOption[];
  /** Show the per-item due/timing (client ref's "Show due/timing column"; the
   *  ⚙ settings toggle). When off, the deadline field/label is hidden. */
  showTiming?: boolean;
  onCommit: (next: WbActionItem[], log: LedgerPatch) => void;
}) {
  const defaultOwner = owners.find((o) => o.kind === "firm")?.value ?? owners[0]?.value ?? "";
  const patch = (id: string, partial: Partial<WbActionItem>, log: LedgerPatch) =>
    onCommit(items.map((a) => (a.id === id ? { ...a, ...partial } : a)), log);
  const removeItem = (id: string) => {
    const gone = items.find((a) => a.id === id);
    onCommit(items.filter((a) => a.id !== id), {
      action: "Removed an action item",
      target: gone?.text,
      icon: "trash",
      kind: "exclude",
    });
  };
  const rewordItem = (id: string, text: string) => {
    const before = items.find((a) => a.id === id)?.text ?? "";
    if (before === text) return;
    patch(id, { text }, { action: "Reworded an action item", before, after: text, icon: "edit", kind: "edit" });
  };
  const reassign = (id: string, owner: string) =>
    patch(id, { owner }, { action: "Reassigned an action item", target: owner, icon: "user", kind: "edit" });
  const setDeadline = (id: string, deadline: string) =>
    patch(id, { deadline }, {
      action: "Set an action-item deadline",
      target: formatActionDeadline(deadline),
      icon: "calendar",
      kind: "edit",
    });
  const addItem = () => {
    const fresh: WbActionItem = {
      id: generateId(),
      text: "New action item — click to edit",
      owner: defaultOwner,
      deadline: "",
    };
    onCommit([...items, fresh], { action: "Added an action item", icon: "add", kind: "structure" });
  };

  if (!items.length && !editing) {
    return (
      <p className="wb-prose wb-muted">
        No outstanding action items — all findings were reconciled without conditions.
      </p>
    );
  }

  return (
    <>
      {items.length > 0 ? (
        <ol className={`wb-actions-list${editing ? " is-editing" : ""}`}>
          {items.map((a, i) => {
            const owner = owners.find((o) => o.value === a.owner);
            const ownerKind = owner?.kind ?? "firm";
            return (
              <li key={a.id}>
                <span className="wb-act-id">A{i + 1}</span>
                <div className="wb-act-main">
                  <div className="wb-act-text">
                    {editing ? (
                      <GridCell
                        raw={a.text}
                        display={a.text}
                        onCommit={(v) => (v.trim() ? rewordItem(a.id, v.trim()) : removeItem(a.id))}
                      />
                    ) : (
                      a.text
                    )}
                  </div>
                  <div className="wb-act-meta">
                    {editing ? (
                      <span className="wb-act-field">
                        <Icon
                          name={ownerKind === "firm" ? "org" : "user"}
                          size={13}
                          className="wb-act-field-ic"
                        />
                        <select
                          className="wb-act-owner-sel"
                          value={a.owner}
                          onChange={(e) => reassign(a.id, e.target.value)}
                          aria-label="Action-item owner"
                        >
                          {owners.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </span>
                    ) : (
                      <span className={`wb-act-owner wb-act-owner--${ownerKind}`}>
                        <Icon name={ownerKind === "firm" ? "org" : "user"} size={12} />
                        {a.owner}
                      </span>
                    )}
                    {showTiming &&
                      (editing ? (
                        <span className="wb-act-field">
                          <Icon name="calendar" size={13} className="wb-act-field-ic" />
                          <input
                            type="date"
                            className="wb-act-date-in"
                            value={isIsoDate(a.deadline) ? a.deadline : ""}
                            onChange={(e) => setDeadline(a.id, e.target.value)}
                            aria-label="Action-item deadline"
                          />
                        </span>
                      ) : (
                        <span className={`wb-act-due${a.deadline ? "" : " is-unset"}`}>
                          {formatActionDeadline(a.deadline)}
                        </span>
                      ))}
                  </div>
                </div>
                {editing && (
                  <button
                    className="wb-rowdel is-shown"
                    onClick={() => removeItem(a.id)}
                    aria-label="Remove this action item"
                    title="Remove action item"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="wb-prose wb-muted">
          No action items yet — add the corrections the appraiser must address.
        </p>
      )}
      {editing && (
        <button className="wb-addrow" onClick={addItem}>
          <Icon name="add" size={13} /> Add action item
        </button>
      )}
    </>
  );
}
