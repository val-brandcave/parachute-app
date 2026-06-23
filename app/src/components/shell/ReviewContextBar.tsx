"use client";

import { useEffect, useState } from "react";
import { relativeDue } from "@/lib/utils";
import { pipelineView, outcomeView } from "@/lib/review-lifecycle";
import { useReview } from "@/store/useReview";
import { useUsersStore } from "@/store";
import { Chip, Icon, type ChipTone } from "@/components/atoms";
import { SegmentedControl, Tabs } from "@/components/molecules";
import { ReviewSummaryModal } from "@/components/review/ReviewSummaryModal";

export type ReviewTab = "technical" | "administrative";
/** The three Technical sub-views (decision 2026-06-22, revised): **Findings ·
 *  Builder · Workbook**. Findings = the decision surface; Builder = the layout/
 *  section authoring tool; Workbook = the compiled, signable doc. (This reverses
 *  the earlier Builder→Workbook "Edit mode" fold — a 3-pane builder is a place,
 *  not a rail toggle; full record in parachute-v2-review-details-spec.md §2/§4.5.) */
export type TechView = "findings" | "builder" | "workbook";

const SUB_VIEWS: { value: TechView; label: string }[] = [
  { value: "findings", label: "Findings" },
  { value: "builder", label: "Builder" },
  { value: "workbook", label: "Workbook" },
];

const TRACK_LABELS: Record<ReviewTab, string> = {
  technical: "Technical",
  administrative: "Administrative",
};

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
 * Review-detail context bar. TWO stacked zones, collapsed from three so the
 * header stops eating vertical real estate (the convention rich object-detail
 * headers follow — GitHub / Linear / Stripe place state + scope on the identity
 * line): (1) the IDENTITY row — address title with derived status chips right
 * beside it, a compact `type · bank · loan#` line, and the Technical /
 * Administrative TRACK as a right-aligned `SegmentedControl` (rendered ONLY when
 * the review actually has both tracks — a lone track would be a redundant
 * switch); (2) the Findings · Builder · Workbook SUB-VIEWS as the `Tabs`
 * molecule (sliding pill, the app's house in-page tab pattern — replaces the
 * old underline shape now that the track no longer occupies its own pill band).
 * All chips read DERIVED state (`pipelineView` / `outcomeView`), never the raw
 * status.
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
  const byId = useUsersStore((s) => s.byId);
  const users = useUsersStore((s) => s.users);
  const fetchUsers = useUsersStore((s) => s.fetchUsers);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // The identity block names the reviewer, so ensure users are loaded here (the
  // Findings view doesn't fetch them; only Workbook/Builder did).
  useEffect(() => {
    if (!users.length) fetchUsers();
  }, [users.length, fetchUsers]);

  // Which deliverables this review actually has → whether the track switch is
  // even meaningful. A review with only a Technical track shows no switch.
  const tracks: ReviewTab[] = review?.reviewTypes ?? ["technical"];
  const showTrackSwitch = tracks.length > 1;
  const trackOptions = tracks.map((t) => ({ value: t, label: TRACK_LABELS[t] }));

  // Sub-views as the house pill tabs; Findings carries its open-count.
  const subTabs = SUB_VIEWS.map((s) => ({
    value: s.value,
    label: s.label,
    count:
      s.value === "findings" && review && review.openFindings > 0
        ? review.openFindings
        : undefined,
  }));

  const pipe = review ? pipelineView(review) : null;
  const outcome = review ? outcomeView(review) : null;
  const due = review ? relativeDue(review.slaDueAt) : null;
  const reviewerName = review ? byId(review.assigneeId)?.name : undefined;

  return (
    <div className="revbar">
      {/* (1) identity row — title + status chips · meta line · track switch */}
      <div className="revhead">
        <div className="revid">
          <div className="revid-titlerow">
            <h1 className="revid-title">{review?.propertyAddress ?? "Review"}</h1>
            <div className="revhead-chips">
              {pipe && (
                <Chip tone={pipeTone(review!)} dot>
                  {pipe.label}
                </Chip>
              )}
              {outcome && <Chip tone={outcome.tone}>{outcome.label}</Chip>}
              {due && review?.status !== "completed" && (
                <Chip tone={due.tone === "overdue" ? "fail" : "neutral"}>
                  {due.label}
                </Chip>
              )}
            </div>
          </div>
          {review && (
            <div className="revid-meta">
              <span>{review.propertyType}</span>
              <span className="revid-dot" aria-hidden>
                ·
              </span>
              <span>{review.bank}</span>
              <span className="revid-dot" aria-hidden>
                ·
              </span>
              <span className="revid-loan">Loan #{review.loanNo}</span>
              <button className="revid-link" onClick={() => setDetailsOpen(true)}>
                View details
                <Icon name="chevron-right" size={13} />
              </button>
            </div>
          )}
        </div>

        {showTrackSwitch && (
          <div className="revtrack">
            <SegmentedControl options={trackOptions} value={tab} onChange={setTab} />
          </div>
        )}
      </div>

      {/* (2) Technical sub-views — pill tabs (the house in-page pattern) */}
      {tab === "technical" && (
        <div className="revsub">
          <Tabs tabs={subTabs} value={view} onChange={setView} />
        </div>
      )}

      {review && (
        <ReviewSummaryModal
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          review={review}
          reviewerName={reviewerName ?? "Unassigned"}
        />
      )}
    </div>
  );
}
