import { create } from "zustand";

/**
 * The run flow (the full-page takeover opened from the dashboard intake widget or
 * the YouConnect embedded handoff). The sidebar exposes two *destinations* —
 * Workbook (home) and Exceptions; Customize and Sign are *actions on the workbook*
 * (a right-docked edit panel and an inline seal block at the document's foot), not
 * separate spokes. Progress is the pre-nav boot stage.
 */
export type RunSpoke =
  | "triage" // auto-rejected intake gate — confirm rejection or override & admit
  | "confirm" // pre-review gate — confirm the extracted identity + review type
  | "progress" // S-E live progress (classify → review → compile)
  | "workbook" // S-A home base — also hosts Customize (edit mode) + the Sign modal
  | "exceptions"; // S-B Ashore-style proofing

/** How the run was started — drives the confirm step's source-aware framing. */
export type RunSource = "drop" | "yc";

/** Review types this run covers. The confirm gate is driven by a generic
 *  `ReviewTypeSpec` registry (see `RunConfirm`); this union is the registry's id
 *  space so future types slot in without re-typing. Only `technical` +
 *  `administrative` are *live* today — the rest render as "coming soon" cards and
 *  are never selectable yet. Technical is the built path; Administrative is
 *  captured for its (future) downstream workspace. */
export type RunReviewType =
  | "technical"
  | "administrative"
  | "evaluation"
  | "vendor_short"
  | "property_type_tech"
  | "environmental"
  | "residential";

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
  /** Per-type sign status (F-118). Each ordered review type owns its own output
   *  + independent sign, signed in any order; the run-level status reads from
   *  this ("Technical ✓ · Administrative ○"). Return/Finish is gated until every
   *  selected type is signed. Reset whenever `setReviewTypes` changes the set. */
  signedTypes: RunReviewType[];
  /** Administrative processing runs on its OWN timeline: the shared progress
   *  screen lands the reviewer on Technical while the Admin type is still being
   *  pre-filled. `adminReady` flips true when that in-tab processing completes,
   *  swapping the Admin tab from its scanning animation to its surfaces. Reset
   *  per-run + whenever the ordered set changes. */
  adminReady: boolean;
  /** Compliance checklist chosen at the confirm gate (Administrative only).
   *  Null = use the org-default. Defaults live in Templates; an explicit pick is
   *  a per-order override (audited), same rule as the Order flow. */
  checklistId: string | null;
  /** Workbook layout chosen at the confirm gate (Technical only). Null = inherit
   *  the org-default layout for the property's profile; a non-null id is a
   *  per-review override, mirroring `checklistId`. */
  layoutId: string | null;
  /** Read-only mode — a completed/signed review opened from the queue. Findings
   *  decisions are locked, the sign block shows the FINAL seal instead of the CTA,
   *  and the workbook offers Download. Set by `enterReview`, cleared by `openRun`. */
  readOnly: boolean;
  openRun: (
    reviewId: string,
    opts?: {
      startAt?: RunSpoke;
      docLabel?: string;
      display?: RunDisplay | null;
      source?: RunSource;
    },
  ) => void;
  /** Initialize the store for an EXISTING review opened at its route
   *  (`/reviews/[id]`) — mirrors `openRun` but leaves `open: false` (the route
   *  renders `RunExperience` directly; the global overlay stays hidden) and seeds
   *  the run state from the real review (spoke derived from status, real
   *  `reviewTypes`, identity overlay). `adminReady` is pre-set for post-pipeline
   *  spokes so the Admin processing animation never replays on an already-reviewed
   *  file; `signedTypes` is all types when `readOnly`. */
  enterReview: (opts: {
    reviewId: string;
    spoke: RunSpoke;
    display?: RunDisplay | null;
    source?: RunSource | null;
    reviewTypes?: RunReviewType[];
    readOnly?: boolean;
  }) => void;
  /** Commit the confirmed identity (from the confirm gate) for the rest of the run. */
  setDisplay: (display: RunDisplay) => void;
  setReviewTypes: (types: RunReviewType[]) => void;
  setChecklistId: (id: string | null) => void;
  setLayoutId: (id: string | null) => void;
  /** Mark one review type signed / re-open it (idempotent). */
  signType: (type: RunReviewType) => void;
  unsignType: (type: RunReviewType) => void;
  setAdminReady: (ready: boolean) => void;
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
  signedTypes: [],
  adminReady: false,
  checklistId: null,
  layoutId: null,
  readOnly: false,
  openRun: (reviewId, opts) =>
    set({
      open: true,
      reviewId,
      spoke: opts?.startAt ?? "confirm",
      docLabel: opts?.docLabel ?? null,
      display: opts?.display ?? null,
      source: opts?.source ?? null,
      reviewTypes: ["technical"],
      signedTypes: [],
      adminReady: false,
      checklistId: null,
      layoutId: null,
      readOnly: false,
    }),
  enterReview: ({ reviewId, spoke, display, source, reviewTypes, readOnly }) => {
    const types = reviewTypes?.length ? reviewTypes : ["technical" as RunReviewType];
    // Post-pipeline spokes land on a ready surface — never replay the Admin
    // processing animation for an already-reviewed file.
    const postPipeline = spoke === "workbook" || spoke === "exceptions";
    set({
      open: false, // the route renders RunExperience directly; overlay stays hidden
      reviewId,
      spoke,
      docLabel: null,
      display: display ?? null,
      source: source ?? null,
      reviewTypes: types,
      signedTypes: readOnly ? types : [],
      adminReady: postPipeline,
      checklistId: null,
      layoutId: null,
      readOnly: !!readOnly,
    });
  },
  setDisplay: (display) => set({ display }),
  // Changing the selected set invalidates any prior per-type signatures + resets
  // Admin processing.
  setReviewTypes: (reviewTypes) => set({ reviewTypes, signedTypes: [], adminReady: false }),
  setChecklistId: (checklistId) => set({ checklistId }),
  setLayoutId: (layoutId) => set({ layoutId }),
  signType: (type) =>
    set((s) =>
      s.signedTypes.includes(type) ? {} : { signedTypes: [...s.signedTypes, type] },
    ),
  unsignType: (type) =>
    set((s) => ({ signedTypes: s.signedTypes.filter((t) => t !== type) })),
  setAdminReady: (adminReady) => set({ adminReady }),
  go: (spoke) => set({ spoke }),
  close: () => set({ open: false }),
}));

/** Commit the confirm gate's choices and advance to the live pipeline, in place
 *  (no navigation). Shared by the routed intake review and the embedded YC session
 *  — the standalone-overlay drop/YC path instead creates a review + routes to it. */
export function beginRunInPlace(
  display: RunDisplay,
  types: RunReviewType[],
  opts?: { checklistId?: string | null; layoutId?: string | null },
) {
  const s = useRunStore.getState();
  s.setDisplay(display);
  s.setReviewTypes(types);
  s.setChecklistId(opts?.checklistId ?? null);
  s.setLayoutId(opts?.layoutId ?? null);
  s.go("progress");
}
