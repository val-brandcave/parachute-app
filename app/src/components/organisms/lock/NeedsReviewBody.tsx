"use client";

import { Button, Illustration } from "@/components/atoms";
import { SETUP_STEPS } from "@/lib/setup-steps";
import type { LockCtx } from "../LockDialog";

/** Where "Upload appraisal" goes: the same href as the Get started first_review step. */
const UPLOAD_HREF = SETUP_STEPS.find((s) => s.id === "first_review")?.action?.href ?? "/launchpad";

/**
 * Needs-review variant (spec §5.5): Take the tour and Sign the workbook both happen inside
 * a review of the org's own, so before the first one there is nothing to open. Nothing to
 * buy or ask for: the way forward is uploading an appraisal.
 */
export function NeedsReviewBody({ ctx }: { ctx: LockCtx }) {
  return (
    <div className="lock-body">
      <span className="lock-art" data-spot="10b-locked-feature">
        <Illustration name="10b-locked-feature" size={100} />
      </span>
      <h2 className="lock-title">Run a review first</h2>
      <p className="lock-copy">
        The tour and signing happen inside a review of your own. Upload an appraisal to start one, then come back here.
      </p>
      <div className="lock-acts">
        <Button variant="ghost" onClick={ctx.close}>
          Close
        </Button>
        <Button iconLeft="upload" onClick={() => ctx.leave(UPLOAD_HREF)}>
          Upload appraisal
        </Button>
      </div>
    </div>
  );
}
