import type { SetupProgress } from "@/types";

const T0 = 1_785_000_000_000;
const DAY = 86_400_000;

/** One row per org (`id` === `orgId`). org-hcb is 3 of 6 steps in; org-001 and
 *  org-cedar are fully set up; org-lakeside has not started. */
export const seedSetupProgress: SetupProgress[] = [
  {
    id: "org-hcb",
    orgId: "org-hcb",
    createdAt: T0,
    completed: {
      branding: T0 + 1 * DAY,
      layout: T0 + 1 * DAY,
      checklist: T0 + 2 * DAY,
    },
  },
  {
    id: "org-cedar",
    orgId: "org-cedar",
    createdAt: T0,
    completed: {
      branding: T0 - 55 * DAY,
      layout: T0 - 55 * DAY,
      checklist: T0 - 54 * DAY,
      invite: T0 - 53 * DAY,
      security_pack: T0 - 50 * DAY,
      sample_review: T0 - 52 * DAY,
    },
    homeDismissedAt: T0 - 45 * DAY,
  },
  {
    id: "org-001",
    orgId: "org-001",
    createdAt: T0,
    completed: {
      branding: 1_737_000_000_000,
      layout: 1_737_000_000_000,
      checklist: 1_737_000_000_000,
      invite: 1_737_000_000_000,
      security_pack: 1_760_000_000_000,
      sample_review: 1_737_000_000_000,
    },
    homeDismissedAt: 1_737_100_000_000,
  },
  {
    id: "org-lakeside",
    orgId: "org-lakeside",
    createdAt: T0,
    completed: {},
  },
];
