"use client";

import { useEffect } from "react";
import { relativeDue } from "@/lib/utils";
import { pipelineView, outcomeView } from "@/lib/review-lifecycle";
import { useReview } from "@/store/useReview";
import { useUsersStore } from "@/store";
import { Chip, Icon, Tooltip, type ChipTone, type IconName } from "@/components/atoms";
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
 * Review-detail context bar. THREE stacked zones, so identity and navigation
 * never crowd one row (the convention rich object-detail headers follow —
 * GitHub / Linear / Stripe): (1) the property IDENTITY (address title + a
 * compact `type · bank · loan#` line + an ⓘ popover for engagement detail),
 * with derived status chips right-aligned; (2) the Technical / Administrative
 * TRACK TABS (`Tabs` molecule, sliding pill); (3) the Findings · Builder ·
 * Workbook SUB-VIEWS (underline tabs, deliberately a different shape). All chips
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
  const byId = useUsersStore((s) => s.byId);
  const users = useUsersStore((s) => s.users);
  const fetchUsers = useUsersStore((s) => s.fetchUsers);

  // The identity block names the reviewer, so ensure users are loaded here (the
  // Findings view doesn't fetch them; only Workbook/Builder did).
  useEffect(() => {
    if (!users.length) fetchUsers();
  }, [users.length, fetchUsers]);

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
  const reviewerName = review ? byId(review.assigneeId)?.name : undefined;

  return (
    <div className="revbar">
      {/* (1) property identity + status */}
      <div className="revhead">
        <div className="revid">
          <h1 className="revid-title">{review?.propertyAddress ?? "Review"}</h1>
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
              <Tooltip
                side="right"
                panel
                content={
                  <dl className="revid-pop">
                    <div className="revid-pop-h">Property &amp; engagement</div>
                    <PopRow label="Appraisal firm" value={review.appraisalFirm} />
                    <PopRow label="Reviewer" value={reviewerName ?? "Unassigned"} />
                    <PopRow
                      label="Order source"
                      value={review.source === "yc" ? "YouConnect" : "Manual upload"}
                    />
                    {due && <PopRow label="SLA" value={due.label} />}
                  </dl>
                }
              >
                <button className="revid-info" aria-label="Property and engagement details">
                  <Icon name="info" size={14} />
                </button>
              </Tooltip>
            </div>
          )}
        </div>

        <div className="revhead-chips">
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
      </div>

      {/* (2) track tabs */}
      <div className="revbar-tabs">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
      </div>

      {/* (3) Technical sub-views */}
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

function PopRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="revid-pop-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
