"use client";

import { useState } from "react";
import { Button, Illustration } from "@/components/atoms";
import type { LockCtx } from "../LockDialog";
import { ReviewerRequestBody } from "./ReviewerRequestBody";

/**
 * Role variant (spec §5.5): a non-admin reached a buy action (e.g. Add credits).
 * "Ask <admin>" turns the dialog into the credit request (same record as Billing, §5.9).
 */
export function RoleBody({ ctx }: { ctx: LockCtx }) {
  const [asking, setAsking] = useState(false);
  if (asking) return <ReviewerRequestBody ctx={ctx} title={`Ask ${ctx.adminFirst} for more credits`} />;
  return (
    <div className="lock-body">
      <span className="lock-art" data-spot="10b-locked-feature">
        <Illustration name="10b-locked-feature" size={100} />
      </span>
      <h2 className="lock-title">Only admins can buy credits</h2>
      <p className="lock-copy">
        {ctx.adminLead} manages billing for {ctx.orgName}.
      </p>
      <div className="lock-acts">
        <Button variant="outline" iconLeft="send" onClick={() => setAsking(true)}>
          Ask {ctx.adminFirst}
        </Button>
        <Button onClick={ctx.close}>Got it</Button>
      </div>
    </div>
  );
}
