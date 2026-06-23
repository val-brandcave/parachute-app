"use client";

import { relativeDue } from "@/lib/utils";
import { pipelineView, outcomeView } from "@/lib/review-lifecycle";
import { useReview } from "@/store/useReview";
import { Chip, Icon, type ChipTone, type IconName } from "@/components/atoms";
import { Tabs } from "@/components/molecules";

export type ReviewTab = "technical" | "administrative";
/** The three Technical sub-views (decision 2026-06-22, revised): **Findings ·
 *  Builder · Workbook**. Findings = the decision surface; Builder = the layout/
 *  section authoring tool; Workbook = the compiled, signable doc. (This reverses
 *  the earlier Builder→Workbook "Edit mode" fold — a 3-pane builder is a place,
 *  not a rail toggle; full record in parachute-v2-review-details-spec.md §2/§4.5.) */
export type TechView = "findings" | "builder" | "workbook";

const SUB_VIEWS: { value: TechView; label: string; icon: IconName }[] = [
  { value: "findings", label: "Findings", icon: "reviews" },
  { value: "builder", label: "Builder", icon: "filter" },
  { value: "workbook", label: "Workbook", icon: "book" },
];

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
        <div className="revsub">
          {SUB_VIEWS.map((s) => (
            <button
              key={s.value}
              className={`revsub-tab${view === s.value ? " on" : ""}`}
              onClick={() => setView(s.value)}
              aria-current={view === s.value}
            >
              <Icon name={s.icon} size={15} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
