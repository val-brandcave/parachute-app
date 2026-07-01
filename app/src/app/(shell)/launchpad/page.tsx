"use client";

import { motion } from "framer-motion";
import { IntakeWidget } from "@/components/organisms";

/**
 * Launchpad (F-119 / D4) — the app's landing page and front door.
 *
 * The intake used to be buried mid-dashboard; Cody's repeat ask was to give the
 * drop zone its OWN full-page route reached from a primary nav action, with the
 * dashboard demoted to secondary. This is the 90%-user's first move: drop an
 * appraisal (or pull one from YouConnect) and go straight into the run flow.
 * Deliberately header-less — a single, prominent hero that reads as an invitation
 * to act, not a page to read. The "Launchpad" crumb in the app bar names it; the
 * "Welcome back" greeting lives on the Dashboard.
 */
export default function LaunchpadPage() {
  return (
    <div className="pagebody">
      <motion.div
        className="launchpad"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
      >
        <IntakeWidget variant="hero" />
      </motion.div>
    </div>
  );
}
