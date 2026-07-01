"use client";

import { Icon } from "@/components/atoms";
import { SeverityChip, ConfidenceMeter, FindingDecisionBar } from "@/components/molecules";
import { useWorkspaceStore, useTemplatesStore } from "@/store";
import type { Finding, FindingState } from "@/types";

const AUDIT_TAG_CLASS = {
  CONFIRMED: "conf",
  CORRECTED: "corr",
  FLAGGED: "flag",
} as const;

/**
 * The finding focus pane — one finding shown in full inside the focus-mode
 * workspace. Severity + confidence + page-cite + evidence + AI audit trail, then
 * the shared {@link FindingDecisionBar} pinned at the foot (Accept · Edit · Reject
 * inline, Remove/Comment/Condition/Flag behind ⋯). The bar owns the response
 * composer + a/e/r/c keyboard grammar; this pane just wires it to the workspace
 * store. Extracted from the old inline footer (F-118) so the run flow shares the
 * exact same decision core.
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

  const isReviewerFinding = !!finding.byReviewer;

  return (
    <article className="fm-focus">
      <div className="fm-focus-body scroll">
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
            <span className="fm-meta-sep" aria-hidden />
            <ConfidenceMeter value={finding.confidence} />
            <span className="fm-meta-sep" aria-hidden />
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
      </div>

      <FindingDecisionBar
        finding={finding}
        state={state}
        property={property}
        responseTemplates={responses}
        variant="focus"
        onDisposition={(disp, reason, templateId) =>
          setDisposition(finding.id, disp, reason, templateId)
        }
        onComment={(comment) => setComment(finding.id, comment)}
        onToggleCondition={() => toggleCondition(finding.id)}
        onToggleFlag={() => toggleFlag(finding.id)}
      />
    </article>
  );
}
