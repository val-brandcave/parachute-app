"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/atoms";

/** Administrative pipeline stages (compliance-checklist framing), distinct from
 *  the Technical pipeline copy. */
const ADMIN_STAGES = [
  "Reading the compliance checklist",
  "Matching evidence to each item",
  "Pre-filling attestations",
  "Flagging items that need a closer look",
];

/** Per-stage dwell (ms). The animation OWNS the reveal: it walks every stage,
 *  then fires `onDone` (+700ms to admire the final check) so the run shell flips
 *  `adminReady` and swaps in the surfaces. Nothing can populate mid-run. */
const STAGE_MS = 1400;

const WRAP_V = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.03 } },
};
const ITEM_V = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
} as const;

/**
 * In-tab Administrative processing (F-118). Shown in the Admin tab body while the
 * compliance pipeline runs on its own timeline — no side rail yet (the rail +
 * surfaces slide in once processing completes, matching the initial full-screen
 * progress pattern). A compact sibling of the Technical `RunProgress` hero.
 *
 * `onDone` fires once, after every stage has visibly completed — the run shell
 * uses it to flip `adminReady`, so the attestations never reveal mid-animation.
 */
export function RunAdminProgress({ onDone }: { onDone?: () => void }) {
  const [stage, setStage] = useState(0);

  // `onDone` must be stable (the caller memoizes it) so a parent re-render can't
  // restart the stage timers. Mirrors the Technical RunProgress.
  useEffect(() => {
    const timers = ADMIN_STAGES.map((_, i) =>
      setTimeout(() => setStage(i + 1), STAGE_MS * (i + 1)),
    );
    const done = setTimeout(() => onDone?.(), STAGE_MS * ADMIN_STAGES.length + 700);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className="run-progress">
      <motion.div className="run-progress-inner" variants={WRAP_V} initial="hidden" animate="show">
        <motion.div className="run-scan" variants={ITEM_V} aria-hidden="true">
          <span className="run-scan-glow" />
          <Icon name="scan" size={30} />
          <span className="run-scan-line" />
        </motion.div>

        <motion.h2 className="run-progress-title" variants={ITEM_V}>
          Running the administrative review…
        </motion.h2>
        <motion.p className="run-progress-doc" variants={ITEM_V}>
          Attesting the appraisal against your compliance checklist
        </motion.p>

        <motion.div className="run-stages" variants={ITEM_V} role="status" aria-live="polite">
          {ADMIN_STAGES.map((label, i) => {
            const done = i < stage;
            const active = i === stage;
            const s = done ? "done" : active ? "active" : "idle";
            return (
              <div key={label} className={`run-st run-st--${s}`}>
                <div className="run-st-row">
                  <span className="run-st-label">{label}</span>
                  <span className="run-st-ind">
                    <AnimatePresence initial={false}>
                      {done ? (
                        <motion.span
                          key="done"
                          className="run-st-check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 520, damping: 24 }}
                        >
                          <Icon name="check-circle" size={18} />
                        </motion.span>
                      ) : active ? (
                        <motion.span
                          key="active"
                          className="run-st-dot"
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: [1, 0.6, 1], opacity: [1, 0.5, 1] }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                        />
                      ) : (
                        <motion.span
                          key="idle"
                          className="run-st-ring"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                    </AnimatePresence>
                  </span>
                </div>
                <span className="run-st-bar">
                  <motion.span
                    className="run-st-bar-fill"
                    initial={{ width: "0%" }}
                    animate={{ width: done || active ? "100%" : "0%" }}
                    transition={{
                      duration: active ? STAGE_MS / 1000 : done ? 0.3 : 0.2,
                      ease: active ? "easeInOut" : "easeOut",
                    }}
                  />
                </span>
              </div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
