"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useReview } from "@/store/useReview";
import { useRunStore, useReviewsStore, beginRunInPlace } from "@/store";
import { runEntry } from "@/lib/review-lifecycle";
import type { ReviewType } from "@/types";
import { RunExperience, type RunStartHandler } from "@/components/run/RunExperience";

/**
 * The review details page IS the run wizard. It seeds the run store for this
 * review (spoke derived from status — triage · confirm · progress · workbook — and
 * read-only for completed) and renders `RunExperience` as a full-page `.run`
 * takeover. The global overlay stays hidden here (`enterReview` leaves `open`
 * false); the close X and post-sign finish route back to the queue.
 */
export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const review = useReview(id);

  const enterReview = useRunStore((s) => s.enterReview);
  const storeReviewId = useRunStore((s) => s.reviewId);
  const updateReview = useReviewsStore((s) => s.updateReview);

  // Seed the run store once per review id (not on every review-object change, so
  // an in-run status flip can't reset the spoke mid-flight).
  useEffect(() => {
    if (!review || storeReviewId === review.id) return;
    const { spoke, readOnly } = runEntry(review);
    enterReview({
      reviewId: review.id,
      spoke,
      readOnly,
      // RunSource frames the confirm gate (yc vs. dropped upload); a manual-source
      // review maps to the "drop" framing.
      source: review.source === "yc" ? "yc" : "drop",
      reviewTypes: review.reviewTypes,
      display: {
        address: review.propertyAddress,
        propertyType: review.propertyType,
        bank: review.bank,
        loanNo: review.loanNo,
        firm: review.appraisalFirm,
      },
    });
  }, [review, storeReviewId, enterReview]);

  const backToQueue = () => router.push("/reviews");

  // Route Start: the review already exists — flip it to running + commit the
  // chosen types, then advance to the pipeline in place.
  const onStart: RunStartHandler = (display, types, opts) => {
    if (review)
      updateReview(review.id, {
        status: "running",
        // The confirm gate only offers the two live ReviewType members.
        reviewTypes: types as ReviewType[],
        pipelineStage: 1,
      });
    beginRunInPlace(display, types, opts);
  };

  const ready = review && storeReviewId === review.id;

  // The `.run` takeover must cover the whole viewport — sidebar + header included.
  // As a route it renders inside the shell's content column, so it's portaled to
  // <body> (where the global overlay effectively lives) to escape that stacking
  // context. `typeof document` guards SSR — the codebase's portal idiom.
  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      className="run"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      role="dialog"
      aria-modal="true"
      aria-label="Review"
    >
      {ready ? (
        <RunExperience
          reviewId={review!.id}
          onExit={backToQueue}
          onStart={onStart}
          onTriageReject={backToQueue}
        />
      ) : (
        <div className="run-loading text-secondary">
          <span className="ui-spinner" aria-hidden="true" /> Loading review…
        </div>
      )}
    </motion.div>,
    document.body,
  );
}
