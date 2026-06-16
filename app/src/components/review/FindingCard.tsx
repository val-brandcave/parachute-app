"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn, SEV_META, formatPct } from "@/lib/utils";
import { Icon } from "@/components/atoms";
import { useWorkspaceStore } from "@/store";
import type { Finding, FindingState } from "@/types";

const AUDIT_TAG_CLASS = {
  CONFIRMED: "conf",
  CORRECTED: "corr",
  FLAGGED: "flag",
} as const;

export function FindingCard({
  finding,
  state,
  onCite,
  defaultOpen,
}: {
  finding: Finding;
  state: FindingState;
  onCite: (page: number) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [composer, setComposer] = useState<
    null | "override" | "rejected" | "commented"
  >(null);
  const [draft, setDraft] = useState("");
  const { setDisposition, setComment } = useWorkspaceStore();

  const sev = SEV_META[finding.severity];
  const disp = state.disposition;

  const act = (kind: "accepted" | "override" | "rejected" | "commented") => {
    if (kind === "accepted") {
      setDisposition(finding.id, "accepted");
      return;
    }
    // override / reject / comment need a reason
    setComposer(kind);
    setDraft(state.reason ?? state.comment ?? "");
  };

  const saveComposer = () => {
    if (!composer) return;
    if (composer === "commented") {
      setComment(finding.id, draft);
      setDisposition(finding.id, "commented", draft);
    } else {
      setDisposition(finding.id, composer, draft);
    }
    setComposer(null);
  };

  return (
    <div
      className={cn(
        "finding",
        `sev-${finding.severity}`,
        disp === "rejected" && "disp-rejected",
        finding.byReviewer && "reviewer",
      )}
    >
      <div className="f-head" onClick={() => setOpen((o) => !o)}>
        <div className="q">
          <div className="cat">
            {finding.category}
            {finding.material && " · Material"}
            {finding.byReviewer && " · Added by reviewer"}
          </div>
          {finding.question}
        </div>
        <div className="badges">
          <span className={cn("chip", sev.chip)}>
            <Icon name={sev.icon} size={15} />
            {sev.label}
          </span>
          <span className="f-conf">Confidence {formatPct(finding.confidence)}</span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="f-body">
              <div className="f-section">
                <div className="t">Finding</div>
                <div style={{ lineHeight: 1.6 }}>{finding.analysis}</div>
              </div>
              <div className="f-section">
                <div className="t">
                  Evidence
                  <span
                    className="page-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCite(finding.page);
                    }}
                  >
                    <Icon name="book" size={14} style={{ marginLeft: 4 }} />{" "}
                    p.{finding.page}
                  </span>
                </div>
                <div className="f-evidence">{finding.evidence}</div>
              </div>
              <div className="f-section">
                <div className="t">AI audit trail</div>
                <div className="audit">
                  <span className={cn("tag", AUDIT_TAG_CLASS[finding.auditTag])}>
                    {finding.auditTag}
                  </span>
                  {finding.auditText}
                </div>
              </div>

              {composer && (
                <div className="composer">
                  <textarea
                    autoFocus
                    placeholder={
                      composer === "rejected"
                        ? "Reason for rejecting (sent to the appraiser)…"
                        : composer === "override"
                          ? "Your corrected wording / reason for disagreeing…"
                          : "Add a comment…"
                    }
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <div className="row">
                    <button
                      className="btn btn-text btn-sm"
                      onClick={() => setComposer(null)}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-filled btn-sm" onClick={saveComposer}>
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="f-actions">
        <button
          className={cn("act", disp === "accepted" && "sel-accept")}
          onClick={() => act("accepted")}
        >
          <Icon name="check" size={17} />
          {finding.severity === "pass" ? "Accept" : "Agree"}
        </button>
        <button
          className={cn("act", disp === "override" && "sel-override")}
          onClick={() => act("override")}
        >
          <Icon name="edit" size={17} />
          Disagree / edit
        </button>
        <button
          className={cn("act", disp === "rejected" && "sel-reject")}
          onClick={() => act("rejected")}
        >
          <Icon name="reject" size={17} />
          Reject
        </button>
        <button className="act" onClick={() => act("commented")}>
          <Icon name="comment" size={17} />
          Comment
        </button>

        {disp !== "pending" && (
          <span
            className="disp-tag"
            style={{
              color:
                disp === "accepted"
                  ? "var(--md-success)"
                  : disp === "rejected"
                    ? "var(--md-error)"
                    : "var(--md-warn)",
            }}
          >
            <Icon
              name={
                disp === "accepted"
                  ? "check-circle"
                  : disp === "rejected"
                    ? "x-circle"
                    : "edit"
              }
              size={16}
            />
            {disp === "accepted"
              ? "In workbook"
              : disp === "rejected"
                ? "Rejected"
                : disp === "override"
                  ? "Overridden"
                  : "Commented"}
          </span>
        )}
      </div>
    </div>
  );
}
