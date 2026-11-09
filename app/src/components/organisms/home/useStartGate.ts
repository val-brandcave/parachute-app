import { useApprovalPending } from "@/store";

/** Why "Start a review" is closed while Realwired confirms the organization. */
export const START_LOCKED_REASON = "Opens when your organization is approved";

/** Every "Start a review" entry point reads this: while the org waits for staff
 *  approval the action stays visible but disabled, with this reason. */
export function useStartGate(): { locked: boolean; reason: string } {
  const locked = useApprovalPending();
  return { locked, reason: START_LOCKED_REASON };
}
