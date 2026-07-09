"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button, Icon } from "@/components/atoms";
import { StatusPill, SegmentedControl } from "@/components/molecules";
import { ActionMenu } from "@/components/molecules/ActionMenu";
import { useWorkspaceStore, useTemplatesStore } from "@/store";
import { WorkbookPreview } from "@/components/review/WorkbookPreview";
import { AddFindingModal, type NewFinding } from "@/components/review/AddFindingModal";
import { newSection, unroutedCategories, type WbSection } from "@/lib/workbook-config";
import type { Review } from "@/types";
import type { RunReviewType } from "@/store";
import type { RunContext } from "./RunModal";
import { RunCustomizePanel } from "./RunCustomize";
import { RunActivityPanel } from "./RunActivity";

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
  const {
    findings,
    states,
    exhibits,
    workbook,
    signature,
    filing,
    setDisposition,
    setComment,
    toggleFlag,
    updateSection,
    addCompRow,
    deleteCompRow,
    updateCompRow,
    toggleSection,
    deleteSection,
    duplicateSection,
    moveSectionBefore,
    insertSectionAt,
    moveCategoryToSection,
    updateSwotQuadrant,
    updateCapRate,
    addReviewerFinding,
    restoreFinding,
    updateReviewerFinding,
    deleteReviewerFinding,
    comments,
    addComment,
    deleteComment,
    commitConditions,
    commitActionItems,
  } = useWorkspaceStore();
  const regeneratedAt = useWorkspaceStore((s) => s.regeneratedAt);
  const responses = useTemplatesStore((s) => s.responses);
  const layouts = useTemplatesStore((s) => s.layouts);
  const saveLayoutFromWorkbook = useTemplatesStore((s) => s.saveLayoutFromWorkbook);

  // "＋ Add finding" composer, opened from a findings chapter's foot. `false` =
  // closed; otherwise the target findings section's id.
  const [addFindingAt, setAddFindingAt] = useState<string | null | false>(false);
  // "Save as template" (F-147) — brief confirmation state on the button.
  const [savedTemplate, setSavedTemplate] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  // Clean view (F-152): flips the editing chrome off so the reviewer sees the
  // exact signable deliverable — the true read-only render (findings compact, no
  // add affordances, no toolbars), not a cosmetic fade. A VIEW toggle (like
  // zoom), never an editing mode-flip; editing stays the default. Scroll position
  // is captured on toggle and restored after the re-layout so the viewport holds.
  const [cleanView, setCleanView] = useState(false);
  const savedScroll = useRef<number | null>(null);
  const setView = (v: "edit" | "clean") => {
    const next = v === "clean";
    if (next === cleanView) return;
    savedScroll.current = stageRef.current?.scrollTop ?? null;
    setCleanView(next);
  };
  // The right dock hosts one panel at a time — opening Activity closes Customize
  // and vice versa, so the workbook is never sandwiched between two docks.
  const [activityOpen, setActivityOpen] = useState(false);
  const openCustomize = () =>
    setCustomizing((v) => {
      if (!v) setActivityOpen(false);
      return !v;
    });
  const openActivity = () =>
    setActivityOpen((v) => {
      if (!v) setCustomizing(false);
      return !v;
    });
  const activityCount = useWorkspaceStore((s) => s.activity.length);

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
  // "Review them" (low-confidence banner) cycles through the undecided finding
  // blocks IN the document — the workbook is the decision surface, so the
  // banner never routes away from it.
  const attnIdx = useRef(0);
  const goNextPending = () => {
    const sc = stageRef.current;
    if (!sc) return;
    const pendingIds = findings
      .filter((f) => (states[f.id]?.disposition ?? "pending") === "pending")
      .map((f) => f.id);
    if (!pendingIds.length) return;
    const id = pendingIds[attnIdx.current % pendingIds.length];
    attnIdx.current += 1;
    const el = sc.querySelector<HTMLElement>(`[data-finding="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("is-attn");
    setTimeout(() => el.classList.remove("is-attn"), 1600);
  };
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

  // Restore scroll after a clean-view toggle re-lays-out the document, so the
  // reviewer's place in the doc holds across the fade.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (savedScroll.current != null && el) {
      el.scrollTo({ top: savedScroll.current });
      savedScroll.current = null;
    }
  }, [cleanView]);

  const signed = !!signature;

  if (!ctx.ready || !review || !workbook) {
    return <div className="run-loading text-secondary">Compiling your workbook…</div>;
  }

  // Reviewer-added finding (F-145): a finding is a first-class object added to
  // a specific findings CHAPTER — the composer opens from that chapter's foot
  // with its categories offered (plus "Reviewer Note" for uncategorized adds).
  const targetFindingsSection: WbSection | undefined =
    addFindingAt === false || addFindingAt === null
      ? undefined
      : workbook.sections.find((s) => s.id === addFindingAt);
  const addFindingCategories = targetFindingsSection
    ? Array.from(new Set([...(targetFindingsSection.categories ?? []), "Reviewer Note"]))
    : undefined;

  const handleAddFinding = (f: NewFinding) => {
    addReviewerFinding(f);
    // If the chosen category isn't in the target chapter yet (e.g. "Reviewer
    // Note"), append it THERE so the new block lands where the reviewer clicked.
    if (
      targetFindingsSection &&
      !(targetFindingsSection.categories ?? []).includes(f.category)
    )
      updateSection(targetFindingsSection.id, {
        categories: [...(targetFindingsSection.categories ?? []), f.category],
      });
  };

  // "Save as my template" (F-147): structure + theme only — content stays
  // per-review. Lands on the org's layout shelf for the F-133 confirm-gate tile.
  const saveTemplate = async () => {
    if (savedTemplate) return;
    const base = workbook.baseLayoutId
      ? layouts.find((l) => l.id === workbook.baseLayoutId)
      : undefined;
    await saveLayoutFromWorkbook({
      name: `My layout — saved ${new Date().toLocaleDateString([], { month: "short", day: "numeric" })}`,
      profile: base?.profile ?? "Commercial",
      theme: workbook.settings.theme,
      sections: workbook.sections.map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        enabled: s.enabled,
      })),
    });
    setSavedTemplate(true);
    setTimeout(() => setSavedTemplate(false), 2400);
  };

  // Clean view is a read-only preview, so the finding blocks it scrolls to
  // aren't decision blocks there — hide the callout while previewing.
  const showCallout = !dismissed && !signed && !cleanView && ctx.lowConfidenceCount > 0;
  // Categories whose findings no visible section routes — they'd silently drop
  // from the signable doc (exclusive routing), so warn instead.
  const unroutedCats =
    !signed && !cleanView ? unroutedCategories(workbook.sections, findings) : [];

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
          <StatusPill
            tone="neutral"
            icon={signed ? "check-circle" : undefined}
            indicatorTone={signed ? "pass" : undefined}
          >
            {signed ? "Final" : "Draft"}
          </StatusPill>
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
          {/* View mode (F-153) — a 2-state segmented Edit | Clean; the current
              state is always lit, never inferred from a flipping label. Clean =
              the exact signable deliverable (no editing chrome). Hidden once
              signed (a final doc is already clean). */}
          {!signed && (
            <>
              <span className="run-ex-tools-div" aria-hidden="true" />
              <span className="run-wb-viewmode">
                <SegmentedControl
                  options={[
                    { value: "edit", label: "Edit" },
                    { value: "clean", label: "Clean" },
                  ]}
                  value={cleanView ? "clean" : "edit"}
                  onChange={(v) => setView(v as "edit" | "clean")}
                />
              </span>
            </>
          )}

          {/* Panels (F-153) — Activity + Customize both drive the ONE right dock
              and are mutually exclusive, so they sit in a cluster where only the
              open one lights up. Activity (audit ledger, layer 3) stays after
              signing; Customize (the 20% behind one button, F-146) does not. */}
          <span className="run-ex-tools-div" aria-hidden="true" />
          <div className="run-wb-panels" role="group" aria-label="Panels">
            <button
              className={`run-wb-tbtn${activityOpen ? " is-active" : ""}`}
              onClick={openActivity}
              aria-expanded={activityOpen}
              aria-label="Activity ledger"
            >
              <Icon name="history" size={14} />
              Activity
              {activityCount > 1 && <span className="run-wb-tbtn-count">{activityCount}</span>}
            </button>
            {!signed && (
              <button
                className={`run-wb-tbtn${customizing ? " is-active" : ""}`}
                onClick={openCustomize}
                aria-expanded={customizing}
              >
                <Icon name="settings" size={14} /> Customize
              </button>
            )}
          </div>

          {/* Overflow (F-153) — tertiary/rare actions. Save as template (F-147)
              captures structure + theme, not content; too rare for prime space. */}
          {!signed && (
            <>
              {savedTemplate && (
                <span className="run-wb-saved" role="status">
                  <Icon name="check" size={13} /> Saved to templates
                </span>
              )}
              <ActionMenu
                tooltip="More actions"
                items={[
                  {
                    label: savedTemplate ? "Saved to templates" : "Save as template",
                    icon: savedTemplate ? "check" : "templates",
                    disabled: savedTemplate,
                    onClick: saveTemplate,
                  },
                ]}
              />
            </>
          )}
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

          {/* Direct edits are live (Decision E, Jul 7) — the dirty-callout /
              Regenerate loop left the primary flow; the compile beat above
              remains only for system recompute. */}
          {showCallout && (
            <div className="run-callout" role="status">
              <Icon name="warn" size={16} />
              <span className="run-callout-text">
                <b>{ctx.lowConfidenceCount} item{ctx.lowConfidenceCount === 1 ? "" : "s"}</b>{" "}
                need a closer look before you sign — review them?
              </span>
              <Button variant="tonal" size="sm" onClick={goNextPending}>
                Review them
              </Button>
              <button
                className="run-callout-x"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          )}

          {/* Exclusive routing (F-152): a category with no visible home would
              drop its findings from the signable doc — surface it, never drop
              silently. Not dismissible: it's a data-integrity gap to resolve. */}
          {unroutedCats.length > 0 && (
            <div className="run-callout" role="status">
              <Icon name="warn" size={16} />
              <span className="run-callout-text">
                <b>
                  {unroutedCats.length} finding categor{unroutedCats.length === 1 ? "y is" : "ies are"}
                </b>{" "}
                not shown in any section — {unroutedCats.join(", ")}. Route{" "}
                {unroutedCats.length === 1 ? "it" : "them"} from a findings section&rsquo;s ⚙ Settings.
              </span>
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
              editing={
                signed || cleanView
                  ? null
                  : {
                      responses,
                      onDisposition: setDisposition,
                      onComment: setComment,
                      onToggleFlag: toggleFlag,
                      onUpdateSection: updateSection,
                      onAddCompRow: addCompRow,
                      onDeleteCompRow: deleteCompRow,
                      onUpdateCompRow: updateCompRow,
                      onToggleSection: toggleSection,
                      onDeleteSection: deleteSection,
                      onDuplicateSection: duplicateSection,
                      onMoveSectionBefore: moveSectionBefore,
                      onInsertSection: (type, beforeId) =>
                        insertSectionAt(newSection(type), beforeId),
                      onRouteCategory: moveCategoryToSection,
                      onRequestAddFinding: (sectionId) => setAddFindingAt(sectionId),
                      onUpdateSwot: updateSwotQuadrant,
                      onUpdateCapRate: updateCapRate,
                      onRestoreFinding: restoreFinding,
                      onEditReviewer: (id, text) => updateReviewerFinding(id, { analysis: text }),
                      onRemoveReviewer: deleteReviewerFinding,
                      comments,
                      onAddComment: addComment,
                      onDeleteComment: deleteComment,
                      onCommitConditions: commitConditions,
                      onCommitActionItems: commitActionItems,
                    }
              }
            />
          </div>
        </div>

        {customizing && !signed && <RunCustomizePanel onClose={() => setCustomizing(false)} />}
        {activityOpen && (
          <RunActivityPanel
            reviewerName={ctx.reviewerName}
            onClose={() => setActivityOpen(false)}
          />
        )}
      </div>

      <AddFindingModal
        open={addFindingAt !== false}
        onClose={() => setAddFindingAt(false)}
        onSave={handleAddFinding}
        categories={addFindingCategories}
      />

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
              <Button variant="outline" size="sm" iconLeft="pdf" onClick={onReviewFindings}>
                View source
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
