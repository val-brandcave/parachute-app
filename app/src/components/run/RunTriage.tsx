"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Icon } from "@/components/atoms";
import type { Review } from "@/types";

const WRAP_V = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
} as const;
const ITEM_V = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.34, ease: "easeOut" } },
} as const;

/**
 * Auto-rejected intake gate — the wizard's pre-`confirm` spoke. Parachute stopped
 * the report at an automated compliance check before the pipeline; the reviewer
 * either confirms the rejection (returns it to the appraiser) or overrides with an
 * audited reason, which admits it and flows on into the confirm/setup gate. Same
 * centered `.run-cf` shell as the confirm step, with an error-toned failed-criterion
 * card. Replaces the old design-system-debt `/reviews/[id]/triage` page.
 */
export function RunTriage({
  review,
  onReject,
  onOverride,
}: {
  review: Review;
  /** Confirm the auto-reject and leave (route → back to the queue). */
  onReject: () => void;
  /** Admit the report to review → advance to the confirm/setup gate. */
  onOverride: () => void;
}) {
  const [overriding, setOverriding] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="run-cf scroll">
      <motion.div className="run-cf-inner" variants={WRAP_V} initial="hidden" animate="show">
        <motion.div className="run-cf-head" variants={ITEM_V}>
          <span className="run-tri-badge">
            <Icon name="reject" size={13} /> Auto-rejected · SLA paused
          </span>
          <h2 className="run-cf-title">Intake triage</h2>
          <p className="run-cf-sub">
            Parachute stopped this report at intake, before the review pipeline. Confirm the
            rejection to return it to the appraiser, or override to admit it to review.
          </p>
        </motion.div>

        {/* The failed automated criterion — error-toned so it reads as a block, not a note. */}
        <motion.div className="run-cf-card run-tri-fail" variants={ITEM_V}>
          <span className="run-tri-fail-label">
            <Icon name="warn" size={14} /> Failed intake criterion
          </span>
          <div className="run-tri-fail-title">Appraisal certification is unsigned</div>
          <p className="run-tri-fail-body">
            The certification page (p.8) is present, but no appraiser signature or license number
            was detected. {review.bank}&rsquo;s auto-reject policy returns unsigned reports to the
            appraiser before review.
          </p>
        </motion.div>

        {/* The decision. */}
        <motion.div className="run-cf-card" variants={ITEM_V}>
          <span className="run-cf-card-head">Your call</span>
          <p className="run-cf-card-sub">
            {overriding
              ? "Overrides are recorded in the audit trail with your reason."
              : "Confirming returns the report to the appraiser. Overriding admits it and continues to setup."}
          </p>

          <AnimatePresence mode="wait" initial={false}>
            {!overriding ? (
              <motion.div
                key="choose"
                className="run-tri-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
              >
                <Button variant="outline" size="sm" iconLeft="undo" onClick={onReject}>
                  Confirm rejection &amp; return
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft="unlock"
                  onClick={() => setOverriding(true)}
                >
                  Override &amp; admit
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="override"
                className="run-tri-override"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                <label className="field">
                  <span>Reason for override (audited)</span>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Document why this report should proceed despite the failed criterion…"
                    rows={3}
                    autoFocus
                  />
                </label>
                <div className="run-tri-override-foot">
                  <Button variant="ghost" size="sm" onClick={() => setOverriding(false)}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    iconRight="forward"
                    disabled={!reason.trim()}
                    onClick={onOverride}
                  >
                    Admit &amp; set up review
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
