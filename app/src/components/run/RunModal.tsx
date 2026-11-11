"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  useRunStore,
  useSessionStore,
  useReviewsStore,
  useOnboardingStore,
  useWalletStore,
  beginRunInPlace,
} from "@/store";
import { CURRENT_USER } from "@/lib/current-user";
import type { ReviewType } from "@/types";
import { costFor } from "@/lib/pricing";
import { RunExperience, type RunStartHandler } from "./RunExperience";
import { RunAddCreditsContext, type RunAddCreditsHandler } from "./RunConfirm";
import { checkoutBlock, useLaunchCheckout } from "@/components/organisms/CheckoutLauncher";

// Re-exported for the run subviews that still import the shared context shape.
export type { RunContext } from "./RunExperience";

/** SLA window stamped on a freshly-started review (prototype default). */
const DEFAULT_SLA_DAYS = 10;

/**
 * The global run overlay — the `.run` full-page takeover, mounted once in
 * `AppShell` and driven by `useRunStore.open`. It hosts the wizard for the two
 * transient entries that have no route yet: the drop / dashboard-YouConnect
 * CONFIRM gate (standalone), and the embedded YouConnect SSO session end-to-end.
 *
 * Route-on-Start (standalone): clicking "Start review" creates the running review
 * and navigates to `/reviews/[id]`, where the routed wizard takes over — so from
 * that point the review is a real member of the queue. The embedded session has no
 * queue, so it advances in place and returns to YouConnect on close.
 */
export function RunModal() {
  const router = useRouter();
  const open = useRunStore((s) => s.open);
  const reviewId = useRunStore((s) => s.reviewId);
  const close = useRunStore((s) => s.close);
  const source = useRunStore((s) => s.source);
  const mode = useSessionStore((s) => s.mode);
  const resetSession = useSessionStore((s) => s.reset);
  const addReview = useReviewsStore((s) => s.addReview);
  const updateReview = useReviewsStore((s) => s.updateReview);
  const embedded = mode === "embedded";
  const launchCheckout = useLaunchCheckout();

  const onExit = () => {
    close();
    if (embedded) {
      resetSession();
      router.push("/youconnect");
    }
  };

  const onStart: RunStartHandler = (display, types) => {
    // Embedded (single-document SSO) has no queue — advance in place.
    if (embedded) {
      beginRunInPlace(display, types);
      return;
    }
    // Balance is checked at Start only. The confirm gate already disables Start when
    // short; this is the backstop (balance changed underneath). Nothing is created.
    const wallet = useWalletStore.getState();
    const need = costFor(types as ReviewType[]);
    if (!wallet.canAfford(need)) {
      onAddCredits({ display, types, needed: need - wallet.balance() });
      return;
    }
    // Standalone: the drop / dashboard-YC pick becomes a real running review the
    // moment Start is clicked. Create it, then route into it — the wizard resumes
    // on the routed page at the pipeline-progress spoke.
    (async () => {
      const created = await addReview({
        propertyAddress: display.address,
        propertyType: display.propertyType,
        bank: display.bank,
        appraisalFirm: display.firm,
        loanNo: display.loanNo,
        status: "running",
        // The confirm gate only offers the two live types (technical /
        // administrative) — both valid ReviewType members.
        reviewTypes: types as ReviewType[],
        assigneeId: CURRENT_USER.id,
        source: source === "yc" ? "yc" : "manual",
        riskRating: "moderate",
        openFindings: 0,
        flaggedCount: 0,
        worstSeverity: null,
        pipelineStage: 1,
        slaDueAt: Date.now() + DEFAULT_SLA_DAYS * 86_400_000,
      });
      void useOnboardingStore.getState().complete("first_review");
      void wallet.debitForReview({
        reviewId: created.id,
        types: types as ReviewType[],
        loanNo: display.loanNo || undefined,
      });
      close();
      router.push(`/reviews/${created.id}`);
    })();
  };

  // Draft before checkout (spec §5.6): the drop / YC pick has no review yet, and
  // run.store doesn't survive a reload, so keep the upload as an `intake` review with
  // the chosen types and come back to it (`/reviews/<id>` → intake → Review setup).
  // Embedded YouConnect runs never reach checkout.
  // One draft per overlay run: a double click, or the callout then the Start backstop,
  // reuses the draft (in flight or created) instead of adding a second intake review.
  const draftRef = useRef<{ runId: string | null; id: Promise<string> } | null>(null);
  const onAddCredits: RunAddCreditsHandler = ({ display, types, needed }) => {
    if (embedded || checkoutBlock()) {
      launchCheckout({ needed }); // explains (embedded / role) or no-ops (invoiced); creates nothing
      return;
    }
    const reviewTypes = types as ReviewType[];
    const existing = draftRef.current?.runId === reviewId ? draftRef.current : null;
    if (existing) {
      void (async () => {
        const id = await existing.id;
        await updateReview(id, { reviewTypes });
        close();
        launchCheckout({ needed, returnTo: `/reviews/${id}`, types: reviewTypes });
      })();
      return;
    }
    const id = addReview({
      propertyAddress: display.address,
      propertyType: display.propertyType,
      bank: display.bank,
      appraisalFirm: display.firm,
      loanNo: display.loanNo,
      status: "intake",
      reviewTypes,
      assigneeId: CURRENT_USER.id,
      source: source === "yc" ? "yc" : "manual",
      riskRating: null,
      openFindings: 0,
      flaggedCount: 0,
      worstSeverity: null,
      pipelineStage: 0,
      slaDueAt: Date.now() + DEFAULT_SLA_DAYS * 86_400_000,
    }).then((d) => d.id);
    draftRef.current = { runId: reviewId, id };
    void (async () => {
      const draftId = await id;
      close();
      launchCheckout({ needed, returnTo: `/reviews/${draftId}`, types: reviewTypes });
    })();
  };

  return (
    <AnimatePresence>
      {open && reviewId && (
        <motion.div
          className="run"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-label="Review run"
        >
          <RunAddCreditsContext.Provider value={onAddCredits}>
            <RunExperience reviewId={reviewId} onExit={onExit} onStart={onStart} />
          </RunAddCreditsContext.Provider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
