import type { SetupProgress } from "@/types";

const T0 = 1_785_000_000_000;
const DAY = 86_400_000;
const HOUR = 3_600_000;

/** Harbor's workspace: created with the trial grant two days before load (matches the ledger). */
const HCB_START = Date.now() - 2 * DAY;

/** One row per org (`id` === `orgId`). org-hcb is the Get started v4 Mid state: 2 of 8 done
 *  (`first_review` on 220 Commerce Way, `invite` — Marcus Ortiz joined), the checklist draft in progress;
 *  org-cedar is mid-setup; org-001 (invoiced) is fully set up; org-lakeside has
 *  not started. The pre-ticked "account" line is always done and not counted. */
export const seedSetupProgress: SetupProgress[] = [
  {
    id: "org-hcb",
    orgId: "org-hcb",
    createdAt: HCB_START,
    completed: {
      account: HCB_START,
      first_review: HCB_START + 20 * HOUR,
      invite: HCB_START + 26 * HOUR,
    },
    completedBy: {
      account: "user-dr",
      first_review: "user-dr",
      invite: "user-dr",
    },
    inProgress: {
      checklist: { note: "Draft saved · 18 of 24 items mapped", href: "/configure/checklists" },
    },
  },
  {
    id: "org-cedar",
    orgId: "org-cedar",
    createdAt: T0 - 60 * DAY,
    completed: {
      account: T0 - 60 * DAY,
      sample_review: T0 - 59 * DAY,
      first_review: T0 - 40 * DAY,
      sign_workbook: T0 - 38 * DAY,
      bank_policy: T0 - 52 * DAY,
      security_pack: T0 - 50 * DAY,
      invite: T0 - 55 * DAY,
    },
    completedBy: {
      account: "user-cr1",
      sample_review: "user-cr1",
      first_review: "user-cr2",
      sign_workbook: "user-cr2",
      bank_policy: "user-cr1",
      security_pack: "user-cr1",
      invite: "user-cr1",
    },
    inProgress: {
      checklist: { note: "Draft saved · 9 of 24 items mapped", href: "/configure/checklists" },
    },
  },
  {
    id: "org-001",
    orgId: "org-001",
    createdAt: 1_737_000_000_000,
    completed: {
      account: 1_737_000_000_000,
      sample_review: 1_737_000_000_000,
      first_review: 1_737_000_000_000,
      sign_workbook: 1_737_000_000_000,
      bank_policy: 1_737_000_000_000,
      security_pack: 1_760_000_000_000,
      checklist: 1_737_000_000_000,
      layout: 1_737_000_000_000,
      invite: 1_737_000_000_000,
    },
    homeDismissedAt: 1_737_100_000_000,
  },
  {
    id: "org-lakeside",
    orgId: "org-lakeside",
    createdAt: T0 + 20 * DAY,
    completed: { account: T0 + 20 * DAY },
  },
];
