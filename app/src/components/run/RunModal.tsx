"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  useRunStore,
  useSessionStore,
  useReviewsStore,
  beginRunInPlace,
} from "@/store";
import { CURRENT_USER } from "@/lib/current-user";
import type { ReviewType } from "@/types";
import { RunExperience, type RunStartHandler } from "./RunExperience";

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
  const embedded = mode === "embedded";

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
      close();
      router.push(`/reviews/${created.id}`);
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
          <RunExperience reviewId={reviewId} onExit={onExit} onStart={onStart} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
