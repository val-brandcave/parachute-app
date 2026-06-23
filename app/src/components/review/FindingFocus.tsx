"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/atoms";
import { SeverityChip, ConfidenceMeter, ActionMenu, type ActionItem } from "@/components/molecules";
import { useWorkspaceStore, useTemplatesStore } from "@/store";
import { ResponseComposer, type ComposerMode } from "./ResponseComposer";
import type { Finding, FindingState } from "@/types";

const AUDIT_TAG_CLASS = {
  CONFIRMED: "conf",
  CORRECTED: "corr",
  FLAGGED: "flag",
} as const;

const DISP_TAG = {
  accepted: { label: "In workbook", tone: "pass", icon: "check-circle" },
  override: { label: "Overridden", tone: "flag", icon: "edit" },
  rejected: { label: "Rejected — returns to appraiser", tone: "fail", icon: "x-circle" },
  commented: { label: "Commented", tone: "info", icon: "comment" },
} as const;

/**
 * The finding focus pane — one finding shown in full inside the focus-mode
 * workspace. Severity + confidence + page-cite + evidence + AI audit trail, then
 * a decision-#4 action bar: two always-visible primaries (Agree/Accept · Reject)
 * with the rest (Disagree & edit, Comment, conditions, flag) folded into the ⋯
 * overflow. Reject / Disagree open the response-template composer. Keyboard:
 * a = agree/accept · o = disagree & edit · r = reject · c = comment.
 */
export function FindingFocus({
  finding,
  state,
  property,
  onCite,
}: {
  finding: Finding;
  state: FindingState;
  property: string;
  onCite: (page: number) => void;
}) {
  const { setDisposition, setComment, toggleCondition, toggleFlag } = useWorkspaceStore();
  const responses = useTemplatesStore((s) => s.responses);
  const [composer, setComposer] = useState<ComposerMode | null>(null);

  const disp = state.disposition;
  const isReviewerFinding = !!finding.byReviewer;
  const acceptLabel = isReviewerFinding ? "Accept" : "Agree";

  const openComposer = (mode: ComposerMode) => setComposer(mode);

  const accept = () => {
    setComposer(null);
    setDisposition(finding.id, "accepted");
  };

  // a / o / r / c shortcuts. Ignore while typing in a field so the composer and
  // the Add-finding modal keep their keys.
  useEffect(() => {
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
        case "o":
          openComposer("override");
          break;
        case "r":
          openComposer("rejected");
          break;
        case "c":
          openComposer("commented");
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finding.id]);

  const saveComposer = (text: string, templateId?: string) => {
    if (!composer) return;
    if (composer === "commented") {
      setComment(finding.id, text);
      setDisposition(finding.id, "commented", text, templateId);
    } else {
      setDisposition(finding.id, composer, text, templateId);
    }
    setComposer(null);
  };

  const overflow: ActionItem[] = [
    { label: "Disagree & edit", icon: "edit", onClick: () => openComposer("override") },
    { label: "Comment", icon: "comment", onClick: () => openComposer("commented") },
    { divider: true },
    {
      label: state.condition ? "Remove from conditions" : "Add to conditions",
      icon: "checklist",
      onClick: () => toggleCondition(finding.id),
    },
    {
      label: state.flagged ? "Clear follow-up flag" : "Flag for follow-up",
      icon: "flag",
      onClick: () => toggleFlag(finding.id),
    },
  ];

  const tag = disp !== "pending" ? DISP_TAG[disp] : null;

  return (
    <article className="fm-focus scroll">
      <header className="fm-focus-head">
        <div className="fm-focus-eyebrow">
          <span className="fm-cat">{finding.category}</span>
          {finding.material && <span className="fm-pip fm-pip--material">Material</span>}
          {isReviewerFinding && <span className="fm-pip fm-pip--mine">Added by you</span>}
          {state.condition && <span className="fm-pip fm-pip--cond">In conditions</span>}
          {state.flagged && (
            <span className="fm-pip fm-pip--flag">
              <Icon name="flag" size={11} /> Flagged
            </span>
          )}
        </div>
        <h2 className="fm-focus-q">{finding.question}</h2>
        <div className="fm-focus-meta">
          <SeverityChip severity={finding.severity} />
          <ConfidenceMeter value={finding.confidence} />
          <button className="fm-cite" onClick={() => onCite(finding.page)}>
            <Icon name="book" size={14} />
            View source · p.{finding.page}
          </button>
        </div>
      </header>

      <section className="fm-sec">
        <div className="fm-sec-t">Finding</div>
        <p className="fm-prose">{finding.analysis}</p>
      </section>

      <section className="fm-sec">
        <div className="fm-sec-t">
          Evidence
          <button className="fm-cite fm-cite--inline" onClick={() => onCite(finding.page)}>
            <Icon name="quote" size={13} />
            p.{finding.page}
          </button>
        </div>
        <blockquote className="fm-evidence">{finding.evidence}</blockquote>
      </section>

      <section className="fm-sec">
        <div className="fm-sec-t">
          <Icon name="ai" size={13} />
          AI audit trail
        </div>
        <div className="fm-audit">
          <span className={`fm-audit-tag ${AUDIT_TAG_CLASS[finding.auditTag]}`}>
            {finding.auditTag}
          </span>
          {finding.auditText}
        </div>
      </section>

      {composer ? (
        <ResponseComposer
          mode={composer}
          finding={finding}
          property={property}
          responses={responses}
          initialText={composer === "rejected" || composer === "override" ? state.reason ?? "" : state.comment ?? ""}
          onSave={saveComposer}
          onCancel={() => setComposer(null)}
        />
      ) : (
        <footer className="fm-actions">
          <button
            className={`fm-act fm-act--accept${disp === "accepted" ? " on" : ""}`}
            onClick={accept}
          >
            <Icon name="check" size={17} />
            {acceptLabel}
            <kbd className="fm-kbd">a</kbd>
          </button>
          <button
            className={`fm-act fm-act--reject${disp === "rejected" ? " on" : ""}`}
            onClick={() => openComposer("rejected")}
          >
            <Icon name="reject" size={17} />
            Reject
            <kbd className="fm-kbd">r</kbd>
          </button>
          <ActionMenu items={overflow} tooltip="More actions" />

          {tag && (
            <span className={`fm-disp fm-disp--${tag.tone}`}>
              <Icon name={tag.icon} size={15} />
              {tag.label}
            </span>
          )}
        </footer>
      )}
    </article>
  );
}
