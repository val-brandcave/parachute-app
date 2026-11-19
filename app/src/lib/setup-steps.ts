import type { OrgKind, ReviewType, SetupSectionId, SetupStepId } from "@/types";
import { EARN_CAP_CREDITS, EARN_REWARD_CREDITS, SETUP_REWARD_SECTIONS, type earnWindow } from "@/lib/pricing";

/**
 * Get started v4 (spec §5.2): eight steps in three sections, in board order. The copy
 * and the per-step metadata live HERE so components stay presentational. Every number
 * comes from `pricing.ts`. `sample_review` stays in the `SetupStepId` union for stored
 * data but is no longer a step (PC-4).
 */

/** What the right-hand side of a step row carries (legacy; v4 rows show only the button). */
export type SetupSide = "free" | "cost" | "reward" | "none" | "tick";

/** Context some step copy depends on. */
export interface SetupCtx {
  /** The org is still on trial credits. */
  trial: boolean;
  /** First name of an approver in the org, if there is one. */
  approverFirst: string | null;
  /** Bank or appraisal firm: changes the own-rules copy. Defaults to bank. */
  kind?: OrgKind;
  /** Enterprise org waiting on its call / Realwired confirmation. */
  pending?: boolean;
}

export interface SetupSectionDef {
  id: SetupSectionId;
  title: (kind: OrgKind) => string;
  /** `org` = the org's short name ("Harbor"), used by the pending copy. */
  sub: (kind: OrgKind, pending: boolean, org?: string) => string;
  /** Pays EARN_REWARD_CREDITS once every step is done inside the earn window. */
  reward: boolean;
}

export const SETUP_SECTIONS: SetupSectionDef[] = [
  {
    id: "first_review",
    title: () => "Run your first review",
    sub: (_kind, pending, org) =>
      pending
        ? `Your trial credits are held until ${org ?? "your organization"} is confirmed. Clicking explains why.`
        : "Upload a commercial appraisal and see every figure checked.",
    reward: true,
  },
  {
    id: "own_rules",
    title: (kind) => (kind === "appraisal_firm" ? "Make it your firm's review" : "Make it your bank's review"),
    sub: (_kind, pending) =>
      pending
        ? "You can do all of this now, so your first review cites your rules."
        : "Findings cite your rules, and the workbook carries your name.",
    reward: true,
  },
  {
    id: "team",
    title: () => "Bring your team",
    sub: () => "Reviews move faster when nobody waits on one person.",
    reward: false,
  },
];

export function sectionDef(id: SetupSectionId): SetupSectionDef {
  return SETUP_SECTIONS.find((s) => s.id === id)!;
}

export interface SetupStepDef {
  id: SetupStepId;
  section: SetupSectionId;
  /** Short name (used by the nav, toasts and the legacy checklist). */
  label: string;
  /** Short past-tense name for toasts and done lines. */
  doneLabel: string;
  /** The row copy (board text). */
  desc: (ctx: SetupCtx) => string;
  /** Rough minutes to finish. */
  minutes: number;
  video?: { label: string; length: string };
  doc?: { label: string; kind: "pack" | "pdf" };
  side: SetupSide;
  /** The row's button. `label` may vary by org kind via `actionLabel`. */
  action?: { label: string; href: string };
  actionLabel?: (ctx: SetupCtx) => string;
  /** Label of the action once done or in progress ("Open review", "Manage team"). */
  continueLabel?: string;
  /** Needs an org_admin; other roles see "Ask <admin>" instead of the action. */
  adminOnly?: boolean;
  /** Starts a review: a Start site (§5.5) — locked while pending / out of credits. */
  startsReview?: boolean;
  /** Its href is derived from the org's first non-sample review (spec §5.2 real-app adaptations). */
  derivedHref?: "first_review" | "sign_workbook";
}

/** Types a "full review" runs. */
export const FULL_REVIEW_TYPES: ReviewType[] = ["technical", "administrative"];

/** The pre-ticked account line. Done for every org; NOT counted in the 8. */
export const ACCOUNT_STEP = { id: "account" as SetupStepId, doneLabel: "Account created" };

/** Bridge into Realwired Admin (Bouncer), where members and invites live. */
export const INVITE_HREF = "/launch/bouncer?to=members&return=/dashboard";

export const TRUST_HREF = "/trust";

export const SETUP_STEPS: SetupStepDef[] = [
  {
    id: "first_review",
    section: "first_review",
    label: "Run your first review",
    doneLabel: "First review run",
    desc: () => "Upload an appraisal to start your first review",
    minutes: 10,
    side: "cost",
    action: { label: "Upload appraisal", href: "/launchpad" },
    continueLabel: "Open review",
    startsReview: true,
    derivedHref: "first_review",
  },
  {
    id: "tutorial",
    section: "first_review",
    label: "Take the tour",
    doneLabel: "Tour taken",
    desc: () => "Take the 2-minute tour to learn how to concur with or reject a finding",
    minutes: 2,
    side: "free",
    // Lands on the first own review so the tour begins inside the takeover (§5.13).
    action: { label: "Start tour", href: "/reviews" },
    derivedHref: "first_review",
  },
  {
    id: "sign_workbook",
    section: "first_review",
    label: "Sign the workbook",
    doneLabel: "Workbook signed",
    desc: () => "Sign the workbook so it's ready to send to the lender",
    minutes: 3,
    side: "tick",
    action: { label: "Sign workbook", href: "/reviews" },
    derivedHref: "sign_workbook",
  },
  {
    id: "bank_policy",
    section: "own_rules",
    label: "Upload your policy",
    doneLabel: "Policy uploaded",
    desc: ({ kind }) =>
      kind === "appraisal_firm"
        ? "Upload your review guidelines so findings cite your rules"
        : "Upload your credit policy so findings cite your rules",
    minutes: 3,
    side: "reward",
    action: { label: "Upload policy", href: "/configure/organization" },
    actionLabel: ({ kind }) => (kind === "appraisal_firm" ? "Upload guidelines" : "Upload policy"),
    adminOnly: true,
  },
  {
    id: "checklist",
    section: "own_rules",
    label: "Publish your checklist",
    doneLabel: "Compliance checklist published",
    desc: () => "Publish your compliance checklist for administrative reviews",
    minutes: 12,
    side: "reward",
    action: { label: "Start checklist", href: "/configure/checklists" },
    continueLabel: "Continue",
    adminOnly: true,
  },
  {
    id: "layout",
    section: "own_rules",
    label: "Brand your workbook",
    doneLabel: "Workbook layout published",
    desc: () => "Brand your workbook with your logo and labels",
    minutes: 5,
    side: "reward",
    action: { label: "Edit layout", href: "/configure/workbook-layouts" },
    continueLabel: "Continue",
    adminOnly: true,
  },
  {
    // Completes when an invite is accepted (bouncer store).
    id: "invite",
    section: "team",
    label: "Invite a reviewer",
    doneLabel: "Teammate joined",
    desc: () => "Invite a reviewer so reviews don't wait on you",
    minutes: 2,
    side: "none",
    action: { label: "Invite", href: INVITE_HREF },
    continueLabel: "Manage team",
    adminOnly: true,
  },
  {
    id: "security_pack",
    section: "team",
    label: "Send the Trust Center to IT",
    doneLabel: "Trust Center sent to IT",
    desc: ({ pending }) =>
      pending
        ? "Send the Trust Center link to IT so vendor approval runs alongside the call"
        : "Send the Trust Center link to IT for vendor approval",
    minutes: 1,
    side: "none",
    action: { label: "Send to IT", href: TRUST_HREF },
    adminOnly: true,
  },
];

export function stepDef(id: SetupStepId): SetupStepDef | undefined {
  return SETUP_STEPS.find((s) => s.id === id);
}

export function stepsIn(section: SetupSectionId): SetupStepDef[] {
  return SETUP_STEPS.filter((s) => s.section === section);
}

/** Credits a section pays out when all its steps are done (0 = none). */
export function sectionReward(section: SetupSectionId): number {
  return SETUP_REWARD_SECTIONS.includes(section) ? EARN_REWARD_CREDITS : 0;
}

/** Does `section` pay its reward now? All its steps done, the window still open
 *  (open or ending) and not already awarded. Pure. */
export function sectionRewardDue(
  done: SetupStepId[],
  section: SetupSectionId,
  win: ReturnType<typeof earnWindow>,
  awarded: SetupSectionId[],
): boolean {
  if (sectionReward(section) <= 0) return false;
  if (win.state === "closed") return false;
  if (awarded.includes(section)) return false;
  return stepsIn(section).every((s) => done.includes(s.id));
}

/** Most credits setup can ever earn (spec §4). */
export const SETUP_EARN_CAP = EARN_CAP_CREDITS;
