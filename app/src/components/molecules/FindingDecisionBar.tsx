"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/atoms";
import { ActionMenu, type ActionItem } from "./ActionMenu";
import { ResponseComposer, type ComposerMode } from "@/components/review/ResponseComposer";
import type { Finding, FindingState, Disposition, ResponseTemplate } from "@/types";

/** The disposition tag shown at the trailing edge once a decision is made. Keyed
 *  to the store `Disposition`; `removed` (Step 3) reads neutral. */
const DISP_TAG: Record<
  Exclude<Disposition, "pending">,
  { label: string; tone: "pass" | "flag" | "fail" | "info" | "muted"; icon: IconName }
> = {
  accepted: { label: "In workbook", tone: "pass", icon: "check-circle" },
  edited: { label: "Edited", tone: "flag", icon: "edit" },
  rejected: { label: "Returns to appraiser", tone: "fail", icon: "x-circle" },
  removed: { label: "Removed from workbook", tone: "muted", icon: "eye-off" },
};

/**
 * The shared finding decision core (F-118). One Accept · Edit · Reject inline bar
 * with the rest (Remove · Comment · Condition · Flag) folded behind the ⋯ overflow,
 * plus a trailing status tag. It owns the {@link ResponseComposer} overlay (Edit /
 * Reject / Comment open it inline below the row) and the a/e/r/c keyboard grammar.
 * Store-agnostic and props-driven — the host wires dispositions/flags to whichever
 * store owns them, so the SAME bar serves both the routed review (`FindingFocus`,
 * `variant="focus"` → pinned footer) and the run flow (`RunExceptions` accordion,
 * `variant="accordion"` → inline in the item body). The difference is spatial only;
 * both get the full action set.
 */
export function FindingDecisionBar({
  finding,
  state,
  property,
  responseTemplates,
  variant = "focus",
  keyboard = true,
  onDisposition,
  onComment,
  onToggleCondition,
  onToggleFlag,
}: {
  finding: Finding;
  state: FindingState;
  property: string;
  responseTemplates: ResponseTemplate[];
  variant?: "focus" | "accordion";
  /** Bind the a/e/r/c shortcuts while this bar is the active one (default on). */
  keyboard?: boolean;
  onDisposition: (disp: Disposition, reason?: string, templateId?: string) => void;
  onComment: (comment: string, templateId?: string) => void;
  onToggleCondition: () => void;
  onToggleFlag: () => void;
}) {
  const [composer, setComposer] = useState<ComposerMode | null>(null);
  const disp = state.disposition;
  const removed = disp === "removed";

  const openComposer = (mode: ComposerMode) => setComposer(mode);
  const accept = () => {
    setComposer(null);
    onDisposition("accepted");
  };

  // a / e / r / c shortcuts. Ignore while typing so the composer keeps its keys.
  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case "a":
          accept();
          break;
        case "e":
          openComposer("edit");
          break;
        case "r":
          openComposer("rejected");
          break;
        case "c":
          openComposer("comment");
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finding.id, keyboard]);

  const saveComposer = (text: string, templateId?: string) => {
    if (!composer) return;
    if (composer === "comment") {
      // A comment is an independent note — it does NOT set a disposition (F-140),
      // so it can accompany any decision (Accept + comment, Reject + comment, …).
      onComment(text, templateId);
    } else {
      onDisposition(composer === "edit" ? "edited" : "rejected", text, templateId);
    }
    setComposer(null);
  };

  const overflow: ActionItem[] = [
    {
      label: removed ? "Restore to workbook" : "Remove from workbook",
      icon: removed ? "eye" : "eye-off",
      onClick: () => onDisposition(removed ? "pending" : "removed"),
    },
    { label: "Comment", icon: "comment", onClick: () => openComposer("comment") },
    { divider: true },
    {
      label: state.condition ? "Remove from conditions" : "Add to conditions",
      icon: "checklist",
      onClick: onToggleCondition,
    },
    {
      label: state.flagged ? "Clear follow-up flag" : "Flag for follow-up",
      icon: "flag",
      onClick: onToggleFlag,
    },
  ];

  // The disposition tag + template-applied hint are redundant in the accordion
  // (the YOUR DECISION zone already states them); show them only in the routed
  // focus pane, which has no such zone.
  const showDispTag = variant === "focus";
  const tag = showDispTag && disp !== "pending" ? DISP_TAG[disp] : null;

  return (
    <div className={`fdb fdb--${variant}`}>
      <div className="fdb-row">
        <button
          className={`fdb-act fdb-act--accept${!composer && disp === "accepted" ? " on" : ""}`}
          onClick={accept}
        >
          <Icon name="check" size={variant === "accordion" ? 15 : 17} />
          Accept
        </button>
        <button
          className={`fdb-act fdb-act--edit${
            composer === "edit" || (!composer && disp === "edited") ? " on" : ""
          }`}
          onClick={() => openComposer("edit")}
        >
          <Icon name="edit" size={variant === "accordion" ? 15 : 17} />
          Edit
        </button>
        <button
          className={`fdb-act fdb-act--reject${
            composer === "rejected" || (!composer && disp === "rejected") ? " on" : ""
          }`}
          onClick={() => openComposer("rejected")}
        >
          <Icon name="reject" size={variant === "accordion" ? 15 : 17} />
          Reject
        </button>
        <ActionMenu items={overflow} tooltip="More actions" />

        {tag && (
          <span className="fdb-status">
            <span className={`fdb-disp fdb-disp--${tag.tone}`}>
              <Icon name={tag.icon} size={15} />
              {tag.label}
            </span>
          </span>
        )}
      </div>

      {/* Condition / flag / comment are callouts, not decisions — shown in the
          decision zone in the accordion variant; the focus pane has no such zone,
          so surface them here (F-142). Visible even with no disposition yet. */}
      {variant === "focus" && (state.condition || state.flagged || state.comment) && (
        <div className="fdb-notes">
          {state.condition && (
            <p className="fdb-note">
              <Icon name="checklist" size={13} /> Added to conditions
            </p>
          )}
          {state.flagged && (
            <p className="fdb-note fdb-note--flag">
              <Icon name="flag" size={13} /> Flagged for follow-up
            </p>
          )}
          {state.comment && (
            <p className="fdb-note">
              <Icon name="comment" size={13} /> {state.comment}
            </p>
          )}
        </div>
      )}

      {composer && (
        <ResponseComposer
          mode={composer}
          finding={finding}
          property={property}
          responses={responseTemplates}
          initialText={
            composer === "rejected" || composer === "edit"
              ? state.reason ?? ""
              : state.comment ?? ""
          }
          onSave={saveComposer}
          onCancel={() => setComposer(null)}
          showAppliedHint={showDispTag}
        />
      )}
    </div>
  );
}
