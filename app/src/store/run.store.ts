import { create } from "zustand";

/**
 * The run flow (the full-page takeover opened from the dashboard intake widget or
 * the YouConnect embedded handoff). The sidebar exposes two *destinations* —
 * Workbook (home) and Exceptions; Customize and Sign are *actions on the workbook*
 * (a right-docked edit panel and an inline seal block at the document's foot), not
 * separate spokes. Progress is the pre-nav boot stage.
 */
export type RunSpoke =
  | "confirm" // pre-review gate — confirm the extracted identity + review type
  | "progress" // S-E live progress (classify → review → compile)
  | "workbook" // S-A home base — also hosts Customize (edit mode) + the Sign modal
  | "exceptions"; // S-B Ashore-style proofing

/** How the run was started — drives the confirm step's source-aware framing. */
export type RunSource = "drop" | "yc";

/** Review types this run covers. Technical is the built path; Administrative is
 *  captured here for later (its downstream workspace is a future task). */
export type RunReviewType = "technical" | "administrative";

/** The seeded demo review that drives the run flow's findings + workbook. A
 *  dropped/standalone file is cosmetic in the prototype — the content is real
 *  seed data so the flow is fully clickable. */
export const DEMO_RUN_REVIEW_ID = "review-001";

/** Identity of the property the user actually picked/dropped. The run flow reuses
 *  the demo review's findings as mock content, but overlays this identity on the
 *  header + workbook so the chosen property carries through end-to-end. Null =
 *  use the demo review's own identity. */
export interface RunDisplay {
  address: string;
  propertyType: string;
  bank: string;
  loanNo: string;
  firm: string;
}

interface RunState {
  open: boolean;
  reviewId: string | null;
  spoke: RunSpoke;
  /** Cosmetic label of what was dropped/selected, shown in the progress step. */
  docLabel: string | null;
  display: RunDisplay | null;
  source: RunSource | null;
  reviewTypes: RunReviewType[];
  openRun: (
    reviewId: string,
    opts?: {
      startAt?: RunSpoke;
      docLabel?: string;
      display?: RunDisplay | null;
      source?: RunSource;
    },
  ) => void;
  /** Commit the confirmed identity (from the confirm gate) for the rest of the run. */
  setDisplay: (display: RunDisplay) => void;
  setReviewTypes: (types: RunReviewType[]) => void;
  go: (spoke: RunSpoke) => void;
  close: () => void;
}

export const useRunStore = create<RunState>((set) => ({
  open: false,
  reviewId: null,
  spoke: "confirm",
  docLabel: null,
  display: null,
  source: null,
  reviewTypes: ["technical"],
  openRun: (reviewId, opts) =>
    set({
      open: true,
      reviewId,
      spoke: opts?.startAt ?? "confirm",
      docLabel: opts?.docLabel ?? null,
      display: opts?.display ?? null,
      source: opts?.source ?? null,
      reviewTypes: ["technical"],
    }),
  setDisplay: (display) => set({ display }),
  setReviewTypes: (reviewTypes) => set({ reviewTypes }),
  go: (spoke) => set({ spoke }),
  close: () => set({ open: false }),
}));
