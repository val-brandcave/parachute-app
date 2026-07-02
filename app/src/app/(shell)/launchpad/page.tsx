"use client";

import { IntakeWidget } from "@/components/organisms";

/**
 * Launchpad (F-119 / D4 · F-126) — the app's landing page and front door,
 * reached from the rail's "Start a review" primary action (F-127).
 *
 * Viewport-locked and card-less, scale-matched to the scientist reference
 * (Cody, Jul 2): a compact centered column on a full-height canvas — animated
 * emblem, modest headline, one fixed-footprint stage shared by both intake
 * modes (so the toggle never leaves the fold). The 90%-user's first move: drop
 * an appraisal (or pull one from YouConnect) and go straight into the run flow.
 * The "Start a review" crumb names the page; the "Welcome back" greeting lives
 * on the Dashboard.
 */
export default function LaunchpadPage() {
  return (
    <div className="launchpad">
      <IntakeWidget />
    </div>
  );
}
