"use client";

import { cn, STATUS_META, relativeDue } from "@/lib/utils";
import { useReview } from "@/store/useReview";
import { Chip } from "@/components/atoms";

export type ReviewTab = "technical" | "administrative";
export type TechView = "findings" | "builder" | "workbook";

/**
 * Review-detail context bar. Technical / Administrative are IN-PAGE TABS (state,
 * not routes); Findings / Builder / Workbook are sub-views of the Technical tab.
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
  const st = review ? STATUS_META[review.status] : null;
  const due = review ? relativeDue(review.slaDueAt) : null;

  const subItems: { key: TechView; label: string }[] = [
    { key: "findings", label: "Findings" },
    { key: "builder", label: "Builder" },
    { key: "workbook", label: "Workbook" },
  ];

  return (
    <div className="revbar">
      <div className="revbar-tabs">
        <button
          className={cn("revtab", tab === "technical" && "on")}
          onClick={() => setTab("technical")}
        >
          Technical
          {review && review.openFindings > 0 && (
            <span className="revtab-b">{review.openFindings}</span>
          )}
        </button>
        <button
          className={cn("revtab", tab === "administrative" && "on")}
          onClick={() => setTab("administrative")}
        >
          Administrative
        </button>

        <div style={{ flex: 1 }} />
        {st && (
          <Chip
            tone={
              review!.status === "completed"
                ? "pass"
                : review!.status === "returned"
                  ? "flag"
                  : "info"
            }
          >
            {st.label}
          </Chip>
        )}
        {review && review.flaggedCount > 0 && (
          <Chip tone="flag">{review.flaggedCount} flagged</Chip>
        )}
        {due && review?.status !== "completed" && (
          <Chip tone={due.tone === "overdue" ? "fail" : "neutral"}>{due.label}</Chip>
        )}
      </div>

      {tab === "technical" && (
        <div className="revbar-sub">
          {subItems.map((s) => (
            <button
              key={s.key}
              className={cn("revsub", view === s.key && "on")}
              onClick={() => setView(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
