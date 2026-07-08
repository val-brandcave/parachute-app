"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/atoms";
import { SeverityChip } from "@/components/molecules";
import { ResponseComposer, type ComposerMode } from "./ResponseComposer";
import type { WbSection, WbSectionType } from "@/lib/workbook-config";
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
    else if (composer)
      actions.onDisposition(f.id, composer === "edit" ? "edited" : "rejected", t, templateId);
    setComposer(null);
  };

  return (
    <div
      className={`wb-fblock wb-fblock--${f.severity}${f.byReviewer ? " is-user" : ""}`}
      data-finding={f.id}
    >
      <div className="wb-fblock-head">
        <SeverityChip severity={f.severity} />
        <span className="wb-fblock-q">{f.question}</span>
        <span className="wb-fblock-cite" title="Opens the cited span in Source (Phase 2b)">
          Cited · p.{f.page}
        </span>
        {disp === "edited" && (
          <ProvenancePip label="Rewritten by reviewer" by={reviewerName} at={state?.decidedAt} />
        )}
        {f.byReviewer && <ProvenancePip label="Reviewer-added" tone="user" />}
      </div>

      <p className="wb-fblock-text">{text}</p>
      {state?.comment && !composer && (
        <p className="wb-find-comment">Reviewer note: {state.comment}</p>
      )}

      {!composer &&
        (decided ? (
          <div className="wb-fblock-decided">
            <Icon name="check-circle" size={14} />
            <span>
              {disp === "edited" ? "Concurred with edits" : "Concurred"} · {reviewerName}
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
        ))}

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
