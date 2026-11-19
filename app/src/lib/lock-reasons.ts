import type { ApprovalState, BillingModel, ReviewType, UserRole } from "@/types";
import type { LockReason } from "@/store/lock.store";
import { costFor } from "@/lib/pricing";

/**
 * Why "Start a review" is locked right now (spec §5.5), or null when it can start.
 * Pure. `needed` is the SHORTFALL (cost − balance), never the full cost (RF2).
 * Order: embedded (YouConnect bills outside the wallet) → never locked here;
 * pending approval → approval; invoiced → never credit-locked; short → credits.
 * `role` is carried for the dialog (a reviewer gets the request body), not a lock of its own:
 * anyone on the team may start a review.
 */
export function lockReasonForStart(i: {
  approval: ApprovalState | undefined;
  balance: number;
  types: ReviewType[];
  role: UserRole;
  embedded: boolean;
  billing?: BillingModel;
}): LockReason | null {
  if (i.embedded) return null;
  if (i.approval === "pending") return { kind: "approval" };
  if (i.billing === "invoiced") return null;
  const cost = costFor(i.types);
  if (cost <= 0 || i.balance >= cost) return null;
  return { kind: "credits", needed: cost - Math.max(0, i.balance), have: Math.max(0, i.balance), types: [...i.types] };
}
