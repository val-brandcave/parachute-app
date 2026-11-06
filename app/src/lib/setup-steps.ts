import type { SetupStepId } from "@/types";
import { EARN_REWARD_CREDITS, SETUP_REWARD_STEPS } from "@/lib/pricing";

export type SetupGroup = "workspace" | "learn";

export interface SetupStepDef {
  id: SetupStepId;
  group: SetupGroup;
  label: string;
  /** One line shown under the label. */
  desc: string;
  /** The existing place that completes the step. */
  href: string;
}

/**
 * The first-run checklist, in display order. Six steps in two groups. The type
 * `SetupStepId` also reserves `first_review` and `tutorial` for later phases;
 * they are deliberately not in this list yet.
 */
export const SETUP_STEPS: SetupStepDef[] = [
  { id: "branding", group: "workspace", label: "Add your logo and colors", desc: "Brand the workbooks your reviewers sign.", href: "/configure/organization" },
  { id: "layout", group: "workspace", label: "Choose a workbook layout", desc: "Pick the section order reviews start from.", href: "/configure/workbook-layouts" },
  { id: "checklist", group: "workspace", label: "Upload your compliance checklist", desc: "Powers the administrative review.", href: "/configure/checklists" },
  { id: "invite", group: "workspace", label: "Invite your team", desc: "Add reviewers and approvers.", href: "/launch/bouncer" },
  { id: "security_pack", group: "learn", label: "Send the security pack to IT", desc: "Everything your IT team asks for.", href: "/configure/security" },
  { id: "sample_review", group: "learn", label: "Open the sample review", desc: "See a finished workbook. No credits used.", href: "/reviews/review-sample" },
];

/** Credits a step pays out when first completed (0 = none). */
export function rewardFor(id: SetupStepId): number {
  return SETUP_REWARD_STEPS.includes(id) ? EARN_REWARD_CREDITS : 0;
}
