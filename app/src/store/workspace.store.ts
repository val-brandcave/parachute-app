import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { generateId } from "@/types";
import type {
  Finding,
  FindingState,
  Disposition,
  Severity,
  WorkbookExhibits,
  WbAdjustmentRow,
} from "@/types";
import type {
  WorkbookConfig,
  WbSection,
  WbDocSettings,
  WbCondition,
  WbActionItem,
} from "@/lib/workbook-config";

/** Short status code shown on a finding pill, derived from its severity. */
const SEV_STATUS: Record<Severity, string> = {
  crit: "CRITICAL",
  fail: "FAIL",
  flag: "FLAG",
  pass: "PASS",
  na: "N/A",
};

/** The reviewer's certification stamp, applied when the workbook is signed.
 *  `sha` is a real SHA-256 over the compiled content (computed in the Sign
 *  handler) — the tamper-evident seal the auditor-facing PDF carries. */
export interface WorkbookSignature {
  name: string;
  designation: string;
  at: number; // epoch ms
  sha: string; // hex SHA-256 of the compiled workbook
}

/** How a signed workbook was disposed of: filed to the lender, or returned to
 *  the fee appraiser with the batched revision letter. `returned` is built but
 *  the queue's `returned` state stays dormant pending client Q1. */
export type WorkbookFiling = "filed" | "returned";

/** Who performed an action, for the activity ledger. `you` = the signed-in
 *  reviewer (the drawer resolves the display name); `ai` = Parachute; `system`
 *  = automatic recompute/pagination. */
export type ActivityActor = "you" | "ai" | "system";

/** One entry in the in-app activity ledger (audit layer 3 — the complete,
 *  ordered record an examiner can ask for). Every mutating action appends one;
 *  edits carry a `before`→`after` so the diff is legible without leaving the
 *  drawer. Kept per-review; reset on `loadReview`. */
export interface ActivityEntry {
  id: string;
  at: number; // epoch ms — stamped in the action (never in render)
  actor: ActivityActor;
  /** Short verb phrase — "Concurred with", "Rewrote", "Excluded", "Commented on". */
  action: string;
  /** What was acted on — a finding question, a section title, a comp label. */
  target?: string;
  /** Optional before→after for content edits (rewrites, renames, cell edits). */
  before?: string;
  after?: string;
  /** Icon hint for the drawer row. */
  icon?: string;
  /** Coarse kind → the row's accent tone in the drawer. */
  kind?: "decision" | "edit" | "structure" | "comment" | "exclude" | "system" | "sign";
}

/** The audit fields an authoring action supplies for its ledger entry — the
 *  store stamps `id`/`at` and pins `actor` to the reviewer. */
export type LedgerPatch = Omit<ActivityEntry, "id" | "at" | "actor">;

/** A reviewer comment anchored to ANY block (F-142 note model, generalized in
 *  Phase 2b — no longer findings-only). `anchorId` is a section / finding /
 *  block id; `anchorLabel` is the human label shown in the thread header and
 *  the ledger. Rendered as a margin pin + thread popover. */
export interface Comment {
  id: string;
  anchorId: string;
  anchorLabel: string;
  body: string;
  by: ActivityActor;
  at: number; // epoch ms
}

interface WorkspaceState {
  reviewId: string | null;
  findings: Finding[];
  states: Record<string, FindingState>; // findingId -> disposition state
  exhibits: WorkbookExhibits | null; // analytical exhibits for the compiled workbook
  /** Activity ledger (audit layer 3) — newest first. Reset per-review. */
  activity: ActivityEntry[];
  /** Block-anchored reviewer comments (margin pins). Reset per-review. */
  comments: Comment[];
  isLoading: boolean;
  /** Workbook lifecycle — null signature = DRAFT; set = signed; `filing` records
   *  the terminal disposition. Per-review; reset whenever a new review loads. */
  signature: WorkbookSignature | null;
  filing: WorkbookFiling | null;
  /** Per-review Workbook layout/section config authored in the Builder. Null
   *  until the Builder/Workbook derives the default from the inherited org
   *  layout (`ensureWorkbook`); reset on `loadReview` so it never leaks across
   *  reviews. Drives what the compiled doc renders. */
  workbook: WorkbookConfig | null;
  /** Section id order captured when the workbook was first seeded — the canonical
   *  order that "Reset order" (in Customize) restores after drag-reordering. */
  defaultSectionOrder: string[];
  /** Regenerate model (D5 — the workbook reflects finding edits only after an
   *  explicit Regenerate). `compiledAt` is stamped when the workbook is first
   *  derived; any finding change after that flips `workbookDirty`, which drives
   *  the "Findings changed — regenerate" callout + the Findings footer's
   *  "Regenerate workbook" affordance. Reset per-review on `loadReview`. */
  workbookDirty: boolean;
  compiledAt: number | null;
  /** Stamped ONLY by an explicit Regenerate (not the initial compile) — drives
   *  the preview's one-shot "compile sweep" feedback. */
  regeneratedAt: number | null;

  loadReview: (reviewId: string) => Promise<void>;
  setDisposition: (
    findingId: string,
    disp: Disposition,
    reason?: string,
    templateId?: string,
  ) => void;
  setComment: (findingId: string, comment: string) => void;
  toggleCondition: (findingId: string) => void;
  toggleFlag: (findingId: string) => void;
  acceptAllPasses: () => void;
  addReviewerFinding: (input: {
    category: string;
    question: string;
    analysis: string;
    page: number;
    severity?: Severity;
    /** The quoted source span, when created from a Source selection (evidence-
     *  first). Becomes the finding's cited evidence; absent for output-first adds. */
    evidence?: string;
  }) => string;
  /** Restore an excluded finding back to undecided (nothing truly vanishes). */
  restoreFinding: (findingId: string) => void;
  /** Reword / re-classify a reviewer's OWN finding (never the AI's). Audited. */
  updateReviewerFinding: (
    findingId: string,
    patch: { question?: string; analysis?: string; severity?: Severity },
  ) => void;
  /** Delete a reviewer's OWN finding outright (it was never AI output). Audited. */
  deleteReviewerFinding: (findingId: string) => void;

  // ---- Comments anywhere (F-142 note, generalized — Phase 2b) ----
  /** Post a comment against any block; appends a ledger entry. */
  addComment: (anchorId: string, anchorLabel: string, body: string) => void;
  /** Remove a comment (its removal is itself audited). */
  deleteComment: (id: string) => void;

  // ---- Workbook lifecycle ----
  signWorkbook: (sig: WorkbookSignature) => void;
  fileWorkbook: () => void;
  returnWorkbook: () => void;
  /** Reopen a signed/filed workbook back to DRAFT (clears the seal). */
  reopenWorkbook: () => void;

  // ---- Workbook layout config (the Builder) ----
  /** Seed the config from the inherited org default if it isn't set yet. */
  ensureWorkbook: (config: WorkbookConfig) => void;
  /** Re-derive the config from the inherited default, discarding edits. */
  resetWorkbook: (config: WorkbookConfig) => void;
  /** Recompile: clear the dirty flag and re-stamp `compiledAt` (D5 Regenerate). */
  regenerate: () => void;
  /** Move a section up/down within the order. */
  moveSection: (id: string, dir: -1 | 1) => void;
  /** Replace the whole section order (drag-to-reorder in the Builder / Customize). */
  reorderSections: (sections: WbSection[]) => void;
  /** Restore the section order captured when the workbook was first seeded. */
  resetSectionOrder: () => void;
  toggleSection: (id: string) => void;
  deleteSection: (id: string) => void;
  /** Append a new section (id stamped here). Returns the new id. */
  addSection: (section: Omit<WbSection, "id">) => string;
  updateSection: (id: string, patch: Partial<WbSection>) => void;
  updateSettings: (patch: Partial<WbDocSettings>) => void;

  // ---- On-canvas structure edits (inline workbook chrome, F-144) ----
  /** Insert a new section before `beforeId` (null = append). Returns the id. */
  insertSectionAt: (section: Omit<WbSection, "id">, beforeId: string | null) => string;
  /** Drop a dragged section before `beforeId` (null = move to the end). */
  moveSectionBefore: (id: string, beforeId: string | null) => void;
  /** Copy a section (new id, "(copy)" title) right after the original. */
  duplicateSection: (id: string) => void;
  /** Replace one SWOT quadrant's items (inline card editing). */
  updateSwotQuadrant: (
    quadrant: "strengths" | "weaknesses" | "opportunities" | "threats",
    items: string[],
  ) => void;
  /** Patch the cap-rate exhibit (structured point/band editing — never free-draw). */
  updateCapRate: (patch: Partial<WorkbookExhibits["capRate"]>) => void;

  // ---- Comp-grid repeater (inline workbook editing, F-144) ----
  /** Append a fresh "Comparable N" row with neutral defaults — appears instantly. */
  addCompRow: () => void;
  deleteCompRow: (comp: string) => void;
  /** Patch a row's cells; the adjusted $/SF re-derives unless patched directly. */
  updateCompRow: (comp: string, patch: Partial<WbAdjustmentRow>) => void;

  // ---- Conditions / action items authoring (materialize-on-edit, F-151) ----
  /** Persist the materialized conditions-of-approval list onto the conditions
   *  section and log the change. `next` is the full array (the caller seeds it
   *  from the derived list on first edit). */
  commitConditions: (next: WbCondition[], log: LedgerPatch) => void;
  /** Persist the materialized action-items list onto the conclusion section and
   *  log the change. */
  commitActionItems: (next: WbActionItem[], log: LedgerPatch) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  reviewId: null,
  findings: [],
  states: {},
  exhibits: null,
  activity: [],
  comments: [],
  isLoading: false,
  signature: null,
  filing: null,
  workbook: null,
  defaultSectionOrder: [],
  workbookDirty: false,
  compiledAt: null,
  regeneratedAt: null,

  loadReview: async (reviewId) => {
    if (get().reviewId === reviewId && get().findings.length) return;
    set({ isLoading: true });
    const [findings, exhibits] = await Promise.all([
      adapter.getWhere<Finding>(Collections.FINDINGS, (f) => f.reviewId === reviewId),
      adapter.getById<WorkbookExhibits>(Collections.WORKBOOK_EXHIBITS, reviewId),
    ]);
    const states: Record<string, FindingState> = {};
    findings.forEach((f) => {
      states[f.id] = { disposition: "pending" };
    });
    // A fresh review starts with a DRAFT workbook (no seal, not filed) and an
    // unseeded config — the Builder/Workbook derives the inherited default on
    // mount via `ensureWorkbook`.
    set({
      reviewId,
      findings,
      states,
      exhibits,
      activity: [],
      comments: [],
      signature: null,
      filing: null,
      workbook: null,
      workbookDirty: false,
      compiledAt: null,
      regeneratedAt: null,
      isLoading: false,
    });
  },

  setDisposition: (findingId, disp, reason, templateId) =>
    set((s) => {
      const target = fq(s.findings, findingId);
      const analysis = s.findings.find((f) => f.id === findingId)?.analysis;
      const log: Record<Disposition, ActivityEntry | null> = {
        accepted: entry({ actor: "you", action: "Concurred with", target, icon: "check", kind: "decision" }),
        edited: entry({
          actor: "you",
          action: "Rewrote",
          target,
          before: analysis,
          after: reason,
          icon: "edit",
          kind: "edit",
        }),
        rejected: entry({ actor: "you", action: "Rejected", target, before: reason, icon: "reject", kind: "decision" }),
        removed: entry({
          actor: "you",
          action: "Excluded",
          target,
          icon: "trash",
          kind: "exclude",
        }),
        pending: entry({ actor: "you", action: "Reopened", target, icon: "undo", kind: "decision" }),
      };
      const ledger = log[disp];
      return {
        states: {
          ...s.states,
          [findingId]: {
            ...s.states[findingId],
            disposition: disp,
            reason,
            templateId,
            decidedAt: disp === "pending" ? undefined : Date.now(),
          },
        },
        activity: ledger ? [ledger, ...s.activity] : s.activity,
        workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
      };
    }),

  setComment: (findingId, comment) =>
    set((s) => ({
      states: {
        ...s.states,
        [findingId]: { ...s.states[findingId], comment },
      },
      activity: comment
        ? [
            entry({
              actor: "you",
              action: "Commented on",
              target: fq(s.findings, findingId),
              after: comment,
              icon: "comment",
              kind: "comment",
            }),
            ...s.activity,
          ]
        : s.activity,
      workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
    })),

  toggleCondition: (findingId) =>
    set((s) => {
      const on = !s.states[findingId]?.condition;
      return {
        states: {
          ...s.states,
          [findingId]: { ...s.states[findingId], condition: on },
        },
        activity: [
          entry({
            actor: "you",
            action: on ? "Added as a condition" : "Cleared the condition on",
            target: fq(s.findings, findingId),
            icon: "checklist",
            kind: "decision",
          }),
          ...s.activity,
        ],
        workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
      };
    }),

  toggleFlag: (findingId) =>
    set((s) => {
      const on = !s.states[findingId]?.flagged;
      return {
        states: {
          ...s.states,
          [findingId]: { ...s.states[findingId], flagged: on },
        },
        activity: [
          entry({
            actor: "you",
            action: on ? "Flagged for follow-up" : "Cleared the flag on",
            target: fq(s.findings, findingId),
            icon: "flag",
            kind: "decision",
          }),
          ...s.activity,
        ],
        workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
      };
    }),

  acceptAllPasses: () =>
    set((s) => {
      const states = { ...s.states };
      s.findings
        .filter((f) => f.severity === "pass")
        .forEach((f) => {
          if (states[f.id].disposition === "pending")
            states[f.id] = { ...states[f.id], disposition: "accepted" };
        });
      return { states, workbookDirty: s.compiledAt != null ? true : s.workbookDirty };
    }),

  addReviewerFinding: (input) => {
    const id = generateId();
    const severity = input.severity ?? "flag";
    const cited = input.evidence?.trim();
    set((s) => {
      const f: Finding = {
        id,
        reviewId: s.reviewId ?? "",
        category: input.category,
        severity,
        status: SEV_STATUS[severity],
        confidence: 1,
        page: input.page,
        question: input.question,
        analysis: input.analysis,
        // Evidence-first adds carry the quoted source span; output-first adds
        // fall back to the generic attribution line.
        evidence: cited ? `“${cited}”` : "Reviewer-authored finding.",
        // Raw span (unquoted) → re-matched on the Source doc to re-highlight it.
        citedSpan: cited || undefined,
        auditTag: "FLAGGED",
        auditText: cited
          ? `Created by the reviewer from a source span on p.${input.page}.`
          : "Added manually by the reviewer.",
        material: true,
        suggestedDisposition: "accepted",
        byReviewer: true,
        createdAt: Date.now(),
      };
      return {
        findings: [...s.findings, f],
        // A reviewer's own finding is INCLUDED by definition — it starts
        // "accepted" (not pending), so it never adds to the undecided sign-gate
        // count and never shows Concur/Reject (you authored it).
        states: { ...s.states, [f.id]: { disposition: "accepted", decidedAt: Date.now() } },
        activity: [
          entry({
            actor: "you",
            action: cited ? "Created a finding from the source" : "Added a finding",
            target: input.question,
            after: cited,
            icon: "add",
            kind: "structure",
          }),
          ...s.activity,
        ],
        workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
      };
    });
    return id;
  },

  updateReviewerFinding: (findingId, patch) =>
    set((s) => {
      const prev = s.findings.find((f) => f.id === findingId);
      if (!prev) return {};
      const severity = patch.severity ?? prev.severity;
      const next: Finding = {
        ...prev,
        ...patch,
        severity,
        status: SEV_STATUS[severity],
      };
      const reworded =
        patch.analysis != null && patch.analysis.trim() !== prev.analysis.trim();
      return {
        findings: s.findings.map((f) => (f.id === findingId ? next : f)),
        activity: [
          entry({
            actor: "you",
            action: "Edited their finding",
            target: next.question,
            before: reworded ? prev.analysis : undefined,
            after: reworded ? next.analysis : undefined,
            icon: "edit",
            kind: "edit",
          }),
          ...s.activity,
        ],
        workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
      };
    }),

  deleteReviewerFinding: (findingId) =>
    set((s) => {
      const f = s.findings.find((x) => x.id === findingId);
      if (!f) return {};
      const states = { ...s.states };
      delete states[findingId];
      return {
        findings: s.findings.filter((x) => x.id !== findingId),
        states,
        // Its anchored comments go with it.
        comments: s.comments.filter((c) => c.anchorId !== findingId),
        activity: [
          entry({
            actor: "you",
            action: "Removed their finding",
            target: f.question,
            icon: "trash",
            kind: "structure",
          }),
          ...s.activity,
        ],
        workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
      };
    }),

  restoreFinding: (findingId) =>
    set((s) => ({
      states: {
        ...s.states,
        [findingId]: { ...s.states[findingId], disposition: "pending", decidedAt: undefined },
      },
      activity: [
        entry({
          actor: "you",
          action: "Restored",
          target: fq(s.findings, findingId),
          icon: "undo",
          kind: "decision",
        }),
        ...s.activity,
      ],
      workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
    })),

  // ---- Comments anywhere ----
  addComment: (anchorId, anchorLabel, body) =>
    set((s) => {
      const text = body.trim();
      if (!text) return {};
      return {
        comments: [
          ...s.comments,
          { id: generateId(), anchorId, anchorLabel, body: text, by: "you", at: Date.now() },
        ],
        activity: [
          entry({
            actor: "you",
            action: "Commented on",
            target: anchorLabel,
            after: text,
            icon: "comment",
            kind: "comment",
          }),
          ...s.activity,
        ],
      };
    }),

  deleteComment: (id) =>
    set((s) => {
      const c = s.comments.find((x) => x.id === id);
      if (!c) return {};
      return {
        comments: s.comments.filter((x) => x.id !== id),
        activity: [
          entry({
            actor: "you",
            action: "Removed a comment on",
            target: c.anchorLabel,
            before: c.body,
            icon: "trash",
            kind: "comment",
          }),
          ...s.activity,
        ],
      };
    }),

  signWorkbook: (sig) =>
    set((s) => ({
      signature: sig,
      filing: null,
      activity: [
        entry({
          actor: "you",
          action: "Signed & sealed the workbook",
          icon: "check-circle",
          kind: "sign",
        }),
        ...s.activity,
      ],
    })),
  fileWorkbook: () => set((s) => (s.signature ? { filing: "filed" } : {})),
  returnWorkbook: () => set((s) => (s.signature ? { filing: "returned" } : {})),
  reopenWorkbook: () => set({ signature: null, filing: null }),

  // ---- Workbook layout config (the Builder) ----
  // First derivation counts as the initial compile → stamp `compiledAt` so later
  // finding edits register as dirty (D5). Idempotent: only seeds once.
  ensureWorkbook: (config) =>
    set((s) =>
      s.workbook
        ? {}
        : {
            workbook: config,
            defaultSectionOrder: config.sections.map((sec) => sec.id),
            compiledAt: Date.now(),
            // Seed the ledger with the compile event — the ground truth every
            // reviewer edit is measured against.
            activity: [
              entry({
                actor: "ai",
                action: "Compiled the workbook from the source appraisal",
                icon: "ai",
                kind: "system",
              }),
            ],
          },
    ),
  resetWorkbook: (config) => set({ workbook: config }),
  regenerate: () =>
    set({ workbookDirty: false, compiledAt: Date.now(), regeneratedAt: Date.now() }),

  moveSection: (id, dir) =>
    set((s) => {
      if (!s.workbook) return {};
      const list = s.workbook.sections;
      const i = list.findIndex((sec) => sec.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return {};
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return { workbook: { ...s.workbook, sections: next } };
    }),

  reorderSections: (sections) =>
    set((s) => (s.workbook ? { workbook: { ...s.workbook, sections } } : {})),

  resetSectionOrder: () =>
    set((s) => {
      if (!s.workbook) return {};
      const order = s.defaultSectionOrder;
      const byId = new Map(s.workbook.sections.map((sec) => [sec.id, sec]));
      // Sections in the captured default order, then any created since (not in the
      // snapshot) appended so nothing is dropped.
      const ordered = [
        ...order.map((id) => byId.get(id)).filter((sec): sec is WbSection => !!sec),
        ...s.workbook.sections.filter((sec) => !order.includes(sec.id)),
      ];
      return { workbook: { ...s.workbook, sections: ordered } };
    }),

  toggleSection: (id) =>
    set((s) => {
      if (!s.workbook) return {};
      const sec = s.workbook.sections.find((x) => x.id === id);
      const willHide = !!sec?.enabled;
      return {
        workbook: {
          ...s.workbook,
          sections: s.workbook.sections.map((x) =>
            x.id === id ? { ...x, enabled: !x.enabled } : x,
          ),
        },
        activity: [
          entry({
            actor: "you",
            action: willHide ? "Hid the section" : "Restored the section",
            target: sec?.title,
            icon: willHide ? "eye-off" : "eye",
            kind: "structure",
          }),
          ...s.activity,
        ],
      };
    }),

  deleteSection: (id) =>
    set((s) => {
      if (!s.workbook) return {};
      const title = sq(s.workbook.sections, id);
      return {
        workbook: {
          ...s.workbook,
          sections: s.workbook.sections.filter((sec) => sec.id !== id),
        },
        activity: [
          entry({ actor: "you", action: "Deleted the section", target: title, icon: "trash", kind: "structure" }),
          ...s.activity,
        ],
      };
    }),

  addSection: (section) => {
    const id = generateId();
    set((s) =>
      s.workbook
        ? { workbook: { ...s.workbook, sections: [...s.workbook.sections, { ...section, id }] } }
        : {},
    );
    return id;
  },

  updateSection: (id, patch) =>
    set((s) => {
      if (!s.workbook) return {};
      const prev = s.workbook.sections.find((sec) => sec.id === id);
      // Only a title change (rename) is a reviewer-legible edit worth logging;
      // silent category/derived patches don't clutter the ledger.
      const renamed = patch.title != null && prev && patch.title !== prev.title;
      return {
        workbook: {
          ...s.workbook,
          sections: s.workbook.sections.map((sec) =>
            sec.id === id ? { ...sec, ...patch } : sec,
          ),
        },
        activity: renamed
          ? [
              entry({
                actor: "you",
                action: "Renamed a section",
                before: prev!.title,
                after: patch.title,
                icon: "edit",
                kind: "edit",
              }),
              ...s.activity,
            ]
          : s.activity,
      };
    }),

  updateSettings: (patch) =>
    set((s) =>
      s.workbook
        ? { workbook: { ...s.workbook, settings: { ...s.workbook.settings, ...patch } } }
        : {},
    ),

  // ---- On-canvas structure edits (inline workbook chrome, F-144) ----
  insertSectionAt: (section, beforeId) => {
    const id = generateId();
    set((s) => {
      if (!s.workbook) return {};
      const next = [...s.workbook.sections];
      const at = beforeId ? next.findIndex((sec) => sec.id === beforeId) : -1;
      next.splice(at < 0 ? next.length : at, 0, { ...section, id });
      return {
        workbook: { ...s.workbook, sections: next },
        activity: [
          entry({ actor: "you", action: "Added a section", target: section.title, icon: "add", kind: "structure" }),
          ...s.activity,
        ],
      };
    });
    return id;
  },

  moveSectionBefore: (id, beforeId) =>
    set((s) => {
      if (!s.workbook || id === beforeId) return {};
      const list = [...s.workbook.sections];
      const from = list.findIndex((sec) => sec.id === id);
      if (from < 0) return {};
      const [moved] = list.splice(from, 1);
      const at = beforeId ? list.findIndex((sec) => sec.id === beforeId) : -1;
      list.splice(at < 0 ? list.length : at, 0, moved);
      return {
        workbook: { ...s.workbook, sections: list },
        activity: [
          entry({ actor: "you", action: "Reordered the section", target: moved.title, icon: "grip", kind: "structure" }),
          ...s.activity,
        ],
      };
    }),

  duplicateSection: (id) =>
    set((s) => {
      if (!s.workbook) return {};
      const i = s.workbook.sections.findIndex((sec) => sec.id === id);
      if (i < 0) return {};
      const src = s.workbook.sections[i];
      const copy: WbSection = { ...src, id: generateId(), title: `${src.title} (copy)` };
      const next = [...s.workbook.sections];
      next.splice(i + 1, 0, copy);
      return {
        workbook: { ...s.workbook, sections: next },
        activity: [
          entry({ actor: "you", action: "Duplicated the section", target: src.title, icon: "copy", kind: "structure" }),
          ...s.activity,
        ],
      };
    }),

  updateSwotQuadrant: (quadrant, items) =>
    set((s) =>
      s.exhibits
        ? { exhibits: { ...s.exhibits, swot: { ...s.exhibits.swot, [quadrant]: items } } }
        : {},
    ),

  updateCapRate: (patch) =>
    set((s) =>
      s.exhibits
        ? { exhibits: { ...s.exhibits, capRate: { ...s.exhibits.capRate, ...patch } } }
        : {},
    ),

  // ---- Comp-grid repeater (inline workbook editing, F-144) ----
  addCompRow: () =>
    set((s) => {
      if (!s.exhibits) return {};
      const rows = s.exhibits.adjustmentGrid;
      // Next comp number = one past the highest existing "Comparable N".
      const n =
        rows.reduce((max, r) => {
          const m = r.comp.match(/(\d+)\s*$/);
          return m ? Math.max(max, parseInt(m[1], 10)) : max;
        }, 0) + 1;
      const fresh = withDerivedAdj({
        comp: `Comparable ${n}`,
        unadj: 350,
        location: 0,
        condition: 0,
        quality: 0,
        adj: 350,
      });
      return {
        exhibits: { ...s.exhibits, adjustmentGrid: [...rows, fresh] },
        activity: [
          entry({ actor: "you", action: "Added a comparable", target: fresh.comp, icon: "add", kind: "edit" }),
          ...s.activity,
        ],
      };
    }),

  deleteCompRow: (comp) =>
    set((s) =>
      s.exhibits
        ? {
            exhibits: {
              ...s.exhibits,
              adjustmentGrid: s.exhibits.adjustmentGrid.filter((r) => r.comp !== comp),
            },
            activity: [
              entry({ actor: "you", action: "Removed a comparable", target: comp, icon: "trash", kind: "edit" }),
              ...s.activity,
            ],
          }
        : {},
    ),

  updateCompRow: (comp, patch) =>
    set((s) =>
      s.exhibits
        ? {
            exhibits: {
              ...s.exhibits,
              adjustmentGrid: s.exhibits.adjustmentGrid.map((r) =>
                r.comp === comp
                  ? patch.adj != null
                    ? { ...r, ...patch }
                    : withDerivedAdj({ ...r, ...patch })
                  : r,
              ),
            },
            activity: [
              entry({ actor: "you", action: "Edited an adjustment on", target: comp, icon: "edit", kind: "edit" }),
              ...s.activity,
            ],
          }
        : {},
    ),

  // ---- Conditions / action items authoring (materialize-on-edit, F-151) ----
  commitConditions: (next, log) =>
    set((s) => {
      if (!s.workbook) return {};
      const sec = s.workbook.sections.find((x) => x.type === "conditions");
      if (!sec) return {};
      return {
        workbook: {
          ...s.workbook,
          sections: s.workbook.sections.map((x) =>
            x.id === sec.id ? { ...x, conditions: next } : x,
          ),
        },
        activity: [entry({ actor: "you", ...log }), ...s.activity],
        workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
      };
    }),

  commitActionItems: (next, log) =>
    set((s) => {
      if (!s.workbook) return {};
      const sec = s.workbook.sections.find((x) => x.type === "conclusion");
      if (!sec) return {};
      return {
        workbook: {
          ...s.workbook,
          sections: s.workbook.sections.map((x) =>
            x.id === sec.id ? { ...x, actions: next } : x,
          ),
        },
        activity: [entry({ actor: "you", ...log }), ...s.activity],
        workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
      };
    }),
}));

/** Build a fresh ledger entry — id + timestamp stamped here (an action context,
 *  never render). Kept tiny so every action can prepend one inline. */
function entry(partial: Omit<ActivityEntry, "id" | "at">): ActivityEntry {
  return { id: generateId(), at: Date.now(), ...partial };
}

/** Resolve a finding's question for a ledger target label. */
function fq(findings: Finding[], id: string): string {
  return findings.find((f) => f.id === id)?.question ?? "a finding";
}

/** Resolve a section's title for a ledger target label. */
function sq(sections: WbSection[] | undefined, id: string): string {
  return sections?.find((s) => s.id === id)?.title ?? "a section";
}

/** Adjusted $/SF re-derives from the unadjusted value + the three signed %
 *  adjustments — the "table never breaks" guarantee of structured row editing. */
function withDerivedAdj(row: WbAdjustmentRow): WbAdjustmentRow {
  const adj = row.unadj * (1 + (row.location + row.condition + row.quality) / 100);
  return { ...row, adj: Math.round(adj * 100) / 100 };
}

/** Workbook tally derived from current dispositions. */
export function tally(states: Record<string, FindingState>) {
  const t = { accepted: 0, edited: 0, rejected: 0, removed: 0, pending: 0 };
  Object.values(states).forEach((s) => {
    t[s.disposition] = (t[s.disposition] ?? 0) + 1;
  });
  return t;
}
