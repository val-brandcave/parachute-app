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

interface WorkspaceState {
  reviewId: string | null;
  findings: Finding[];
  states: Record<string, FindingState>; // findingId -> disposition state
  exhibits: WorkbookExhibits | null; // analytical exhibits for the compiled workbook
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
  }) => void;

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
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  reviewId: null,
  findings: [],
  states: {},
  exhibits: null,
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
    set((s) => ({
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
      workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
    })),

  setComment: (findingId, comment) =>
    set((s) => ({
      states: {
        ...s.states,
        [findingId]: { ...s.states[findingId], comment },
      },
      workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
    })),

  toggleCondition: (findingId) =>
    set((s) => ({
      states: {
        ...s.states,
        [findingId]: {
          ...s.states[findingId],
          condition: !s.states[findingId]?.condition,
        },
      },
      workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
    })),

  toggleFlag: (findingId) =>
    set((s) => ({
      states: {
        ...s.states,
        [findingId]: {
          ...s.states[findingId],
          flagged: !s.states[findingId]?.flagged,
        },
      },
      workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
    })),

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

  addReviewerFinding: (input) =>
    set((s) => {
      const severity = input.severity ?? "flag";
      const f: Finding = {
        id: generateId(),
        reviewId: s.reviewId ?? "",
        category: input.category,
        severity,
        status: SEV_STATUS[severity],
        confidence: 1,
        page: input.page,
        question: input.question,
        analysis: input.analysis,
        evidence: "Reviewer-authored finding.",
        auditTag: "FLAGGED",
        auditText: "Added manually by the reviewer.",
        material: true,
        suggestedDisposition: "accepted",
        byReviewer: true,
        createdAt: Date.now(),
      };
      return {
        findings: [...s.findings, f],
        states: { ...s.states, [f.id]: { disposition: "pending" } },
        workbookDirty: s.compiledAt != null ? true : s.workbookDirty,
      };
    }),

  signWorkbook: (sig) => set({ signature: sig, filing: null }),
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
    set((s) =>
      s.workbook
        ? {
            workbook: {
              ...s.workbook,
              sections: s.workbook.sections.map((sec) =>
                sec.id === id ? { ...sec, enabled: !sec.enabled } : sec,
              ),
            },
          }
        : {},
    ),

  deleteSection: (id) =>
    set((s) =>
      s.workbook
        ? {
            workbook: {
              ...s.workbook,
              sections: s.workbook.sections.filter((sec) => sec.id !== id),
            },
          }
        : {},
    ),

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
    set((s) =>
      s.workbook
        ? {
            workbook: {
              ...s.workbook,
              sections: s.workbook.sections.map((sec) =>
                sec.id === id ? { ...sec, ...patch } : sec,
              ),
            },
          }
        : {},
    ),

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
      return { workbook: { ...s.workbook, sections: next } };
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
      return { workbook: { ...s.workbook, sections: list } };
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
      return { workbook: { ...s.workbook, sections: next } };
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
      return { exhibits: { ...s.exhibits, adjustmentGrid: [...rows, fresh] } };
    }),

  deleteCompRow: (comp) =>
    set((s) =>
      s.exhibits
        ? {
            exhibits: {
              ...s.exhibits,
              adjustmentGrid: s.exhibits.adjustmentGrid.filter((r) => r.comp !== comp),
            },
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
          }
        : {},
    ),
}));

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
