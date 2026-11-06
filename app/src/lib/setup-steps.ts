import type { ReviewType, SetupStepId } from "@/types";
import { EARN_CAP_CREDITS, EARN_REWARD_CREDITS, SETUP_REWARD_STEPS, costFor } from "@/lib/pricing";

/**
 * The first-run checklist ("Getting set up"), in display order. The copy and
 * the per-step metadata (minutes, video, doc, what the right-hand side shows)
 * live HERE so components stay presentational. Every number comes from
 * `pricing.ts`. `SetupStepId` also keeps `branding`, `invite` and `tutorial`
 * for later phases; they are deliberately not in this list.
 */

export type SetupGroup = "first" | "team";

export const SETUP_GROUP_LABEL: Record<SetupGroup, string> = {
  first: "First review",
  team: "Ready for your team",
};

/** What the right-hand pill on a step row shows.
 *  free: "Free" · cost: the credit cost chip · reward: "+N credit" ·
 *  none: "No credit" · tick: "Tick only" (it completes by doing, not by a button). */
export type SetupSide = "free" | "cost" | "reward" | "none" | "tick";

/** Context some step copy depends on. */
export interface SetupCtx {
  /** The org is still on trial credits. */
  trial: boolean;
  /** First name of an approver in the org, if there is one. */
  approverFirst: string | null;
}

export interface SetupStepDef {
  id: SetupStepId;
  group: SetupGroup;
  label: string;
  /** Short past-tense name for the "Account created · …" done line and toasts. */
  doneLabel: string;
  desc: (ctx: SetupCtx) => string;
  /** Rough minutes to finish, shown as "~3 min". */
  minutes: number;
  video?: { label: string; length: string };
  doc?: { label: string; kind: "pack" | "pdf" };
  side: SetupSide;
  /** The primary action. Absent = a tick-only step. */
  action?: { label: string; href: string };
  /** Label of the action while the step is in progress. */
  continueLabel?: string;
  /** Needs an org_admin; other roles see "Ask <admin>" instead of a button. */
  adminOnly?: boolean;
}

/** Types a "full review" runs. */
export const FULL_REVIEW_TYPES: ReviewType[] = ["technical", "administrative"];

/** Completed non-sample reviews before the Home StatBar and trend chart appear. */
export const FIRST_RUN_STATBAR_MIN = 5;

/** The pre-ticked first line. It counts as done but is not in `SETUP_STEPS`. */
export const ACCOUNT_STEP = { id: "account" as SetupStepId, doneLabel: "Account created" };

export const SETUP_STEPS: SetupStepDef[] = [
  {
    id: "sample_review",
    group: "first",
    label: "Open the sample review",
    doneLabel: "Sample review opened",
    desc: () => "See a finished review before you upload anything.",
    minutes: 2,
    video: { label: "What you’ll get", length: "1:10" },
    side: "free",
    action: { label: "Open sample", href: "/reviews/review-sample" },
  },
  {
    id: "first_review",
    group: "first",
    label: "Run your first report",
    doneLabel: "First report run",
    desc: ({ trial }) =>
      `Drop an appraisal PDF. Your first review uses ${costFor(FULL_REVIEW_TYPES)} ${trial ? "trial " : ""}credits.`,
    minutes: 10,
    video: { label: "Upload and start", length: "1:15" },
    side: "cost",
    action: { label: "Upload", href: "/launchpad" },
  },
  {
    id: "sign_workbook",
    group: "first",
    label: "Sign your first workbook",
    doneLabel: "First workbook signed",
    desc: ({ approverFirst }) =>
      approverFirst
        ? `Only approvers sign. ${approverFirst} can, or make yourself an approver.`
        : "Only approvers sign. Make yourself an approver, or invite one.",
    minutes: 3,
    side: "tick",
    continueLabel: "View",
  },
  {
    id: "bank_policy",
    group: "team",
    label: "Upload your bank policy",
    doneLabel: "Bank policy uploaded",
    desc: () => "Every review checks reports against it in the final pass.",
    minutes: 3,
    video: { label: "Why policy matters", length: "0:50" },
    side: "reward",
    action: { label: "Upload", href: "/configure/organization" },
    adminOnly: true,
  },
  {
    id: "security_pack",
    group: "team",
    label: "Send the security pack to your IT team",
    doneLabel: "Security pack sent",
    desc: () => "Architecture, data handling and SOC 2 details for vendor review.",
    minutes: 1,
    doc: { label: "What’s in the pack", kind: "pack" },
    side: "none",
    action: { label: "Send", href: "/configure/security" },
    adminOnly: true,
  },
  {
    id: "checklist",
    group: "team",
    label: "Publish your compliance checklist",
    doneLabel: "Compliance checklist published",
    desc: () => "Upload your checklist, map it once, set it as the default.",
    minutes: 12,
    video: { label: "Mapping a checklist", length: "1:30" },
    doc: { label: "Admin guide PDF", kind: "pdf" },
    side: "reward",
    action: { label: "Start", href: "/configure/checklists" },
    continueLabel: "Continue",
    adminOnly: true,
  },
  {
    id: "layout",
    group: "team",
    label: "Publish a custom workbook layout",
    doneLabel: "Workbook layout published",
    desc: () => "Start from a built-in layout and publish your own section order.",
    minutes: 5,
    side: "reward",
    action: { label: "Start", href: "/configure/workbook-layouts" },
    continueLabel: "Continue",
    adminOnly: true,
  },
];

export function stepDef(id: SetupStepId): SetupStepDef | undefined {
  return SETUP_STEPS.find((s) => s.id === id);
}

/** Credits a step pays out when first completed (0 = none). */
export function rewardFor(id: SetupStepId): number {
  return SETUP_REWARD_STEPS.includes(id) ? EARN_REWARD_CREDITS : 0;
}

/** Most credits setup can ever earn (spec §2). Re-exported for the checklist copy. */
export const SETUP_EARN_CAP = EARN_CAP_CREDITS;
