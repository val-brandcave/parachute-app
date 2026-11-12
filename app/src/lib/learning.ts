import type { SetupStepId } from "@/types";
import { PLACEHOLDER_VIDEO, stepVideo } from "@/lib/guides";

/**
 * Learning Center catalog (spec §5.11): the single source for every video and guide —
 * groups, durations, audience and the step / page / setting each one explains.
 * Every clip is PLACEHOLDER_VIDEO until Realwired supplies the real ones.
 * Replaces lib/guides.ts; `PLACEHOLDER_VIDEO` and `stepVideo` are re-exported for one release.
 */
export { PLACEHOLDER_VIDEO, stepVideo };

export type LearningAudience = "admin" | "reviewer" | "everyone";
export type VideoGroupId = "setup" | "running" | "findings" | "workbook" | "admin";

export interface LearningVideo {
  id: string;
  title: string;
  /** "m:ss" */
  duration: string;
  group: VideoGroupId;
  audience: LearningAudience;
  src: string;
  /** Get started step this video explains (Get started rows link here). */
  step?: SetupStepId;
}

export interface LearningGuide {
  id: string;
  title: string;
  audience: LearningAudience;
  /** File under /public, or null while the guide is a placeholder. */
  href: string | null;
  fileName?: string;
  placeholder?: boolean;
}

export const VIDEO_GROUPS: { id: VideoGroupId; title: string }[] = [
  { id: "setup", title: "Getting set up" },
  { id: "running", title: "Running a review" },
  { id: "findings", title: "Working with findings" },
  { id: "workbook", title: "Your workbook" },
  { id: "admin", title: "Admin" },
];

const v = (
  id: string,
  title: string,
  duration: string,
  group: VideoGroupId,
  audience: LearningAudience,
  step?: SetupStepId,
): LearningVideo => ({ id, title, duration, group, audience, src: PLACEHOLDER_VIDEO, ...(step ? { step } : {}) });

export const VIDEOS: LearningVideo[] = [
  v("create-org", "Create your organization", "2:40", "setup", "admin"),
  v("invite-team", "Invite your team", "1:55", "setup", "admin", "invite"),
  v("bank-policy", "Upload your bank policy", "3:30", "setup", "admin", "bank_policy"),
  v("review-defaults", "Choose review defaults", "5:10", "setup", "admin"),
  v("how-a-review-works", "How a review works", "1:15", "running", "everyone"),
  v("first-review", "Start your first review", "3:15", "running", "everyone", "first_review"),
  v("tech-vs-admin", "Technical vs Administrative", "4:20", "running", "everyone"),
  v("from-youconnect", "Sending a report from YouConnect", "5:05", "running", "everyone"),
  v("credits-a-review-uses", "What credits a review uses", "2:10", "running", "everyone"),
  v("finding-citation", "Writing a finding with a citation", "4:45", "findings", "reviewer", "tutorial"),
  v("response-library", "Using the response library", "3:50", "findings", "reviewer"),
  v("return-to-appraiser", "Returning a report to the appraiser", "4:30", "findings", "reviewer"),
  v("reading-workbook", "Reading the workbook", "6:30", "workbook", "everyone"),
  v("editing-blocks", "Editing blocks inline", "4:15", "workbook", "reviewer"),
  v("signing-exporting", "Signing and exporting", "4:05", "workbook", "everyone", "sign_workbook"),
  v("buying-credits", "Buying credits and auto-reload", "3:40", "admin", "admin"),
  v("usage-by-person", "Reading usage by person", "2:55", "admin", "admin"),
  v("mapping-checklist", "Mapping a checklist", "1:30", "admin", "admin", "checklist"),
  v("workbook-layouts", "Custom workbook layouts", "6:10", "admin", "admin", "layout"),
  v("security-pack", "Sending the security pack to IT", "3:05", "admin", "admin", "security_pack"),
];

export const GUIDES: LearningGuide[] = [
  {
    id: "reviewer-guide",
    title: "Reviewer quick-start",
    audience: "reviewer",
    href: "/guides/parachute-reviewer-guide.pdf",
    fileName: "parachute-reviewer-guide.pdf",
  },
  {
    id: "admin-guide",
    title: "Admin guide: setup, credits and billing",
    audience: "admin",
    href: "/guides/parachute-admin-guide.pdf",
    fileName: "parachute-admin-guide.pdf",
  },
  { id: "checklist-reference", title: "Review checklist reference", audience: "everyone", href: null, placeholder: true },
];

export function videoById(id: string): LearningVideo | undefined {
  return VIDEOS.find((x) => x.id === id);
}

/** The video a Get started step links to. */
export function videoForStep(id: SetupStepId): LearningVideo | undefined {
  return VIDEOS.find((x) => x.step === id);
}
