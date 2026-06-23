"use client";

import { relativeDue } from "@/lib/utils";
import { pipelineView, outcomeView } from "@/lib/review-lifecycle";
import { useReview } from "@/store/useReview";
import { Chip, type ChipTone } from "@/components/atoms";
import { Tabs, SegmentedControl } from "@/components/molecules";

export type ReviewTab = "technical" | "administrative";
/** Findings + Workbook are the two Technical sub-views. The former "Builder" is
 *  now an Edit-layout mode ON the Workbook (full authoring lives in Templates →
 *  Workbook Layout), so there is no separate Builder sub-view. */
export type TechView = "findings" | "workbook";

/** A review's pipeline phase → a single status chip tone (derived, never the raw
 *  `status`). Mirrors lib/review-lifecycle so the bar agrees with the queue. */
function pipeTone(r: NonNullable<ReturnType<typeof useReview>>): ChipTone {
  const pv = pipelineView(r);
  if (pv.mode === "dots")
    return pv.tone === "ready" ? "pass" : pv.tone === "done" ? "neutral" : "info";
  return pv.tone === "fail"
    ? "fail"
    : pv.tone === "warn"
      ? "flag"
      : pv.tone === "info"
        ? "info"
        : "neutral";
}

/**
 * Review-detail context bar. Technical / Administrative are IN-PAGE TABS (state,
 * not routes); Findings / Workbook are sub-views of the Technical tab. All chips
 * read DERIVED state (`pipelineView` / `outcomeView`), never the raw status.
 */
export function ReviewContextBar({
  reviewId,
  tab,
  setTab,
  view,
  setView,
}: {
  reviewId: string;
  tab: ReviewTab;
  setTab: (t: ReviewTab) => void;
  view: TechView;
  setView: (v: TechView) => void;
}) {
  const review = useReview(reviewId);

  const tabs: { value: ReviewTab; label: string; count?: number }[] = [
    {
      value: "technical",
      label: "Technical",
      count: review && review.openFindings > 0 ? review.openFindings : undefined,
    },
    { value: "administrative", label: "Administrative" },
  ];

  const pipe = review ? pipelineView(review) : null;
  const outcome = review ? outcomeView(review) : null;
  const due = review ? relativeDue(review.slaDueAt) : null;

  return (
    <div className="revbar">
      <div className="revbar-tabs">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />

        <div style={{ flex: 1 }} />

        {pipe && (
          <Chip tone={pipeTone(review!)} dot>
            {pipe.label}
          </Chip>
        )}
        {outcome && <Chip tone={outcome.tone}>{outcome.label}</Chip>}
        {due && review?.status !== "completed" && (
          <Chip tone={due.tone === "overdue" ? "fail" : "neutral"}>{due.label}</Chip>
        )}
      </div>

      {tab === "technical" && (
        <div className="revbar-sub">
          <SegmentedControl
            options={[
              { value: "findings", label: "Findings" },
              { value: "workbook", label: "Workbook" },
            ]}
            value={view}
            onChange={setView}
          />
        </div>
      )}
    </div>
  );
}
