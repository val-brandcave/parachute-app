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
} from "@/types";

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
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  reviewId: null,
  findings: [],
  states: {},
  exhibits: null,
  isLoading: false,
  signature: null,
  filing: null,

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
    // A fresh review starts with a DRAFT workbook (no seal, not filed).
    set({
      reviewId,
      findings,
      states,
      exhibits,
      signature: null,
      filing: null,
      isLoading: false,
    });
  },

  setDisposition: (findingId, disp, reason, templateId) =>
    set((s) => ({
      states: {
        ...s.states,
        [findingId]: { ...s.states[findingId], disposition: disp, reason, templateId },
      },
    })),

  setComment: (findingId, comment) =>
    set((s) => ({
      states: {
        ...s.states,
        [findingId]: { ...s.states[findingId], comment },
      },
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
      return { states };
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
        suggestedDisposition: "commented",
        byReviewer: true,
        createdAt: Date.now(),
      };
      return {
        findings: [...s.findings, f],
        states: { ...s.states, [f.id]: { disposition: "pending" } },
      };
    }),

  signWorkbook: (sig) => set({ signature: sig, filing: null }),
  fileWorkbook: () => set((s) => (s.signature ? { filing: "filed" } : {})),
  returnWorkbook: () => set((s) => (s.signature ? { filing: "returned" } : {})),
  reopenWorkbook: () => set({ signature: null, filing: null }),
}));

/** Workbook tally derived from current dispositions. */
export function tally(states: Record<string, FindingState>) {
  const t = { accepted: 0, override: 0, rejected: 0, commented: 0, pending: 0 };
  Object.values(states).forEach((s) => {
    t[s.disposition] = (t[s.disposition] ?? 0) + 1;
  });
  return t;
}
