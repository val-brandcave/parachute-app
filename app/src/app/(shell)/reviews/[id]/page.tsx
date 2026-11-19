"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useReview } from "@/store/useReview";
import {
  useRunStore,
  useReviewsStore,
  useOnboardingStore,
  useWalletStore,
  beginRunInPlace,
} from "@/store";
import { useLockStore } from "@/store/lock.store";
import { checkoutHref } from "@/lib/checkout";
import { runEntry } from "@/lib/review-lifecycle";
import type { ReviewType } from "@/types";
import { RunExperience, type RunStartHandler } from "@/components/run/RunExperience";
import {
  RunAddCreditsContext,
  startLock,
  type RunAddCreditsHandler,
} from "@/components/run/RunConfirm";
import { currentCheckoutBlock, useLaunchCheckout } from "@/components/organisms/CheckoutLauncher";

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
  const launchCheckout = useLaunchCheckout();

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
    // Approval + balance are checked at Start only. Review setup already opens the lock
    // dialog; this is the backstop (state changed underneath). The sample never locks.
    const wallet = useWalletStore.getState();
    const lock = review?.sample
      ? null
      : startLock(display, types, wallet.balance(), (t) =>
            // Run-only: keep only the chosen type's template override (as RunConfirm does).
            onStart(display, [t], {
              checklistId: t === "administrative" ? (opts?.checklistId ?? null) : null,
              layoutId: t === "technical" ? (opts?.layoutId ?? null) : null,
            }), onAddCredits);
    if (lock) {
      useLockStore.getState().openLock(lock);
      return;
    }
    if (review)
      updateReview(review.id, {
        loanNo: display.loanNo || review.loanNo,
        status: "running",
        // The confirm gate only offers the two live ReviewType members.
        reviewTypes: types as ReviewType[],
        pipelineStage: 1,
      });
    if (review && !review.sample) {
      void useOnboardingStore.getState().complete("first_review");
      void wallet.debitForReview({
        reviewId: review.id,
        types: types as ReviewType[],
        loanNo: display.loanNo || undefined,
        sample: review.sample,
      });
    }
    beginRunInPlace(display, types, opts);
  };

  // Draft before checkout (spec §5.6): the review already exists, so keep its id —
  // commit the chosen types (an intake review is the draft), then leave for checkout
  // with `return=/reviews/<id>&types=…`. On return, intake → Review setup reads them.
  const onAddCredits: RunAddCreditsHandler = ({ display, types, needed, choice }) => {
    if (!review) return;
    if (currentCheckoutBlock()) {
      launchCheckout({ needed });
      return;
    }
    // Save the selection on any review that reopens at setup (confirm or triage spoke),
    // and only leave once it is stored, so a reload on checkout still has it.
    const { spoke } = runEntry(review);
    void (async () => {
      if (spoke === "confirm" || spoke === "triage")
        await updateReview(review.id, {
          loanNo: display.loanNo || review.loanNo,
          reviewTypes: types as ReviewType[],
        });
      const returnTo = `/reviews/${review.id}`;
      // The lock dialog's pick (custom amount or pack) wins; else checkout opens on the shortfall.
      if (choice) router.push(checkoutHref({ ...choice, returnTo, types: types as ReviewType[] }));
      else launchCheckout({ needed, returnTo, types: types as ReviewType[] });
    })();
  };

  // Opening the sample review completes "Open the sample review".
  useEffect(() => {
    if (id === "review-sample" && review?.sample) {
      void useOnboardingStore.getState().complete("sample_review");
    }
  }, [id, review?.sample]);

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
        <RunAddCreditsContext.Provider value={onAddCredits}>
          <RunExperience
            reviewId={review!.id}
            onExit={backToQueue}
            onStart={onStart}
            onTriageReject={backToQueue}
          />
        </RunAddCreditsContext.Provider>
      ) : (
        <div className="run-loading text-secondary">
          <span className="ui-spinner" aria-hidden="true" /> Loading review…
        </div>
      )}
    </motion.div>,
    document.body,
  );
}
