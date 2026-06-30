"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/atoms";
import { useWorkspaceStore } from "@/store";
import { WorkbookPreview } from "@/components/review/WorkbookPreview";
import type { Review } from "@/types";
import type { RunContext } from "./RunModal";
import { RunCustomizePanel } from "./RunCustomize";

/**
 * S-A Workbook — the run flow's home base. The compiled workbook is the hero;
 * Customize docks an edit panel on the right (the workbook IS the live preview),
 * and the footer's primary CTA leads to the focused Sign & finalize step. A
 * (mode-conditional) trust strip and a dismissible low-confidence callout sit above
 * the document. Once signed, the footer flips to Download + Return.
 */
export function RunWorkbook({
  review,
  ctx,
  embedded,
  returnLabel,
  onSign,
  onReviewFindings,
  onReturn,
}: {
  review: Review;
  ctx: RunContext;
  embedded: boolean;
  returnLabel: string | null;
  onSign: () => void;
  onReviewFindings: () => void;
  onReturn: () => void;
}) {
  const { findings, states, exhibits, workbook, signature, filing } = useWorkspaceStore();
  const [dismissed, setDismissed] = useState(false);
  const [customizing, setCustomizing] = useState(false);

  const signed = !!signature;
  const blocked = ctx.pendingCount > 0;

  if (!ctx.ready || !review || !workbook) {
    return <div className="run-loading text-secondary">Compiling your workbook…</div>;
  }

  const showCallout = !dismissed && !signed && ctx.lowConfidenceCount > 0;

  return (
    <div className="run-wb">
      <div className="run-wb-main">
        <div className="run-wb-stage scroll">
          {embedded && (
            <div className="run-trust">
              <Icon name="sso" size={15} />
              <span>
                <b>Single document</b> · the signed result returns to {returnLabel ?? "YouConnect"}{" "}
                on sign. Extraction wrong? Correct it in Exceptions before signing.
              </span>
            </div>
          )}

          {showCallout && (
            <div className="run-callout" role="status">
              <Icon name="warn" size={16} />
              <span className="run-callout-text">
                <b>{ctx.lowConfidenceCount} item{ctx.lowConfidenceCount === 1 ? "" : "s"}</b>{" "}
                need a closer look before you sign — review them?
              </span>
              <button className="run-callout-cta" onClick={onReviewFindings}>
                Review exceptions
              </button>
              <button
                className="run-callout-x"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          )}

          <WorkbookPreview
            review={review}
            findings={findings}
            states={states}
            exhibits={exhibits}
            config={workbook}
            recommendation={ctx.recommendation}
            risk={ctx.risk}
            reviewerName={ctx.reviewerName}
            reviewedAt={review.orderedAt}
            signature={signature}
            filing={filing}
          />
        </div>

        {customizing && <RunCustomizePanel onClose={() => setCustomizing(false)} />}
      </div>

      <footer className="run-foot">
        <div className="run-foot-meta">
          {signed ? (
            <span className="run-foot-ok">
              <Icon name="check-circle" size={15} /> Signed &amp; sealed · workbook is FINAL
            </span>
          ) : blocked ? (
            <span className="run-foot-hint">
              <Icon name="clock" size={14} /> {ctx.pendingCount} finding
              {ctx.pendingCount === 1 ? "" : "s"} awaiting a decision
            </span>
          ) : (
            <span className="run-foot-ok">
              <Icon name="check-circle" size={15} /> All findings dispositioned — ready to sign
            </span>
          )}
        </div>

        <div className="run-foot-actions">
          {signed ? (
            <>
              <Button variant="outline" size="sm" iconLeft="download">
                Download
              </Button>
              <Button
                variant="primary"
                size="sm"
                iconLeft={embedded ? "forward" : "reviews"}
                onClick={onReturn}
              >
                {embedded ? `Return to ${returnLabel ?? "YouConnect"}` : "Go to reviews"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" iconLeft="quote" onClick={onReviewFindings}>
                Review findings
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconLeft="edit"
                className={customizing ? "is-active" : undefined}
                onClick={() => setCustomizing((v) => !v)}
              >
                Customize
              </Button>
              <Button variant="primary" size="sm" iconRight="forward" onClick={onSign}>
                Sign &amp; finalize
              </Button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
