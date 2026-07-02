"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button, Icon } from "@/components/atoms";
import { useWorkspaceStore } from "@/store";
import { WorkbookPreview } from "@/components/review/WorkbookPreview";
import type { Review } from "@/types";
import type { RunReviewType } from "@/store";
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
  reviewType = "technical",
  canFinish = true,
  pendingTypeLabel = null,
  onSign,
  onReviewFindings,
  onReturn,
}: {
  review: Review;
  ctx: RunContext;
  embedded: boolean;
  returnLabel: string | null;
  /** Which review type this workbook belongs to (scope only; two-type shell). */
  reviewType?: RunReviewType;
  /** False while another ordered review type is still unsigned — gates Return. */
  canFinish?: boolean;
  /** Label of the still-unsigned type, for the gated-Return note. */
  pendingTypeLabel?: string | null;
  onSign: () => void;
  onReviewFindings: () => void;
  onReturn: () => void;
}) {
  const { findings, states, exhibits, workbook, signature, filing } = useWorkspaceStore();
  const workbookDirty = useWorkspaceStore((s) => s.workbookDirty);
  const regenerate = useWorkspaceStore((s) => s.regenerate);
  const regeneratedAt = useWorkspaceStore((s) => s.regeneratedAt);
  const [dismissed, setDismissed] = useState(false);
  const [customizing, setCustomizing] = useState(false);

  // Compile sweep (D5 feedback, Jul 2): a fresh Regenerate — whether we just
  // arrived from Findings (mount, lazy init checks freshness) or clicked the
  // inline callout (stamp changes while mounted → adjust-during-render) —
  // plays a ~1.2s "recompiling" beat before the fresh document settles.
  const [compiling, setCompiling] = useState(
    () => regeneratedAt != null && Date.now() - regeneratedAt < 2500,
  );
  const [prevStamp, setPrevStamp] = useState(regeneratedAt);
  if (regeneratedAt !== prevStamp) {
    setPrevStamp(regeneratedAt);
    if (regeneratedAt != null) setCompiling(true);
  }
  useEffect(() => {
    if (!compiling) return;
    const t = setTimeout(() => setCompiling(false), 1250);
    return () => clearTimeout(t);
  }, [compiling]);

  // Document-toolbar state — zoom + a page indicator that tracks scroll.
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  // Count rendered sheets for "Page X of N"; a MutationObserver keeps it current
  // as Customize toggles sections in/out.
  useLayoutEffect(() => {
    const sc = stageRef.current;
    if (!sc) return;
    const count = () => {
      const n = sc.querySelectorAll(".wb-page").length;
      if (n) setPageCount(n);
    };
    count();
    if (typeof MutationObserver === "undefined") return;
    const mo = new MutationObserver(count);
    mo.observe(sc, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [ctx.ready]);

  const signed = !!signature;

  if (!ctx.ready || !review || !workbook) {
    return <div className="run-loading text-secondary">Compiling your workbook…</div>;
  }

  const showCallout = !dismissed && !signed && ctx.lowConfidenceCount > 0;

  const zoomBy = (d: number) =>
    setZoom((z) => Math.min(1.5, Math.max(0.7, +(z + d).toFixed(2))));
  const onStageScroll = () => {
    const sc = stageRef.current;
    if (!sc) return;
    const top = sc.getBoundingClientRect().top;
    let cur = 1;
    sc.querySelectorAll<HTMLElement>(".wb-page").forEach((el, i) => {
      if (el.getBoundingClientRect().top - top <= 120) cur = i + 1;
    });
    setPage(cur);
  };
  const goPage = (n: number) => {
    const target = Math.min(Math.max(1, n), pageCount);
    stageRef.current
      ?.querySelectorAll<HTMLElement>(".wb-page")
      [target - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="run-wb" data-review-type={reviewType}>
      <div className="run-wb-bar">
        <span className="run-wb-bar-label">
          Workbook
          <span className={`run-wb-bar-state run-wb-bar-state--${signed ? "final" : "draft"}`}>
            · {signed ? "FINAL" : "DRAFT"}
          </span>
        </span>
        <div className="run-ex-tools">
          <div className="run-ex-ctl" role="group" aria-label="Zoom">
            <button
              className="run-ex-ctl-btn"
              onClick={() => zoomBy(-0.1)}
              disabled={zoom <= 0.7}
              aria-label="Zoom out"
            >
              <Icon name="minus" size={15} />
            </button>
            <span className="run-ex-ctl-val">{Math.round(zoom * 100)}%</span>
            <button
              className="run-ex-ctl-btn"
              onClick={() => zoomBy(0.1)}
              disabled={zoom >= 1.5}
              aria-label="Zoom in"
            >
              <Icon name="add" size={15} />
            </button>
          </div>
          <span className="run-ex-tools-div" aria-hidden="true" />
          <div className="run-ex-ctl" role="group" aria-label="Pages">
            <button
              className="run-ex-ctl-btn"
              onClick={() => goPage(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <Icon name="chevron-left" size={16} />
            </button>
            <span className="run-ex-ctl-val">
              Page {Math.min(page, pageCount)}
              <span className="run-ex-ctl-of"> of {pageCount}</span>
            </span>
            <button
              className="run-ex-ctl-btn"
              onClick={() => goPage(page + 1)}
              disabled={page >= pageCount}
              aria-label="Next page"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="run-wb-main">
        <div
          className={`run-wb-stage scroll${compiling ? " is-compiling" : ""}`}
          ref={stageRef}
          onScroll={onStageScroll}
        >
          {compiling && (
            <div className="run-compile" role="status">
              <span className="ui-spinner" aria-hidden="true" />
              Folding your decisions in…
            </div>
          )}
          {embedded && (
            <div className="run-trust">
              <Icon name="sso" size={15} />
              <span>
                <b>Single document</b> · the signed result returns to {returnLabel ?? "YouConnect"}{" "}
                on sign. Extraction wrong? Correct it in Findings before signing.
              </span>
            </div>
          )}

          {workbookDirty && !signed && (
            <div className="run-dirty" role="status">
              <Icon name="refresh" size={16} />
              <span className="run-dirty-text">
                <b>Findings changed</b> since this workbook was compiled — regenerate to fold
                your latest decisions in.
              </span>
              <button className="run-dirty-cta" onClick={regenerate}>
                <Icon name="refresh" size={14} /> Regenerate
              </button>
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
                Review findings
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

          <div className="run-wb-zoom" style={{ zoom }}>
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
        </div>

        {customizing && <RunCustomizePanel onClose={() => setCustomizing(false)} />}
      </div>

      <footer className="run-foot">
        <div className="run-foot-actions">
          {signed ? (
            <>
              <Button variant="outline" size="sm" iconLeft="download">
                Download
              </Button>
              {canFinish ? (
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={embedded ? "forward" : "reviews"}
                  onClick={onReturn}
                >
                  {embedded ? `Return to ${returnLabel ?? "YouConnect"}` : "Go to reviews"}
                </Button>
              ) : (
                <span className="run-foot-gate">
                  <Icon name="clock" size={14} />
                  Sign {pendingTypeLabel ?? "all review types"} to finish
                </span>
              )}
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
