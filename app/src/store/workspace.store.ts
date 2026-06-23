import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { generateId } from "@/types";
import type { Finding, FindingState, Disposition, Severity } from "@/types";

/** Short status code shown on a finding pill, derived from its severity. */
const SEV_STATUS: Record<Severity, string> = {
  crit: "CRITICAL",
  fail: "FAIL",
  flag: "FLAG",
  pass: "PASS",
  na: "N/A",
};

interface WorkspaceState {
  reviewId: string | null;
  findings: Finding[];
  states: Record<string, FindingState>; // findingId -> disposition state
  isLoading: boolean;

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
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  reviewId: null,
  findings: [],
  states: {},
  isLoading: false,

  loadReview: async (reviewId) => {
    if (get().reviewId === reviewId && get().findings.length) return;
    set({ isLoading: true });
    const findings = await adapter.getWhere<Finding>(
      Collections.FINDINGS,
      (f) => f.reviewId === reviewId,
    );
    const states: Record<string, FindingState> = {};
    findings.forEach((f) => {
      states[f.id] = { disposition: "pending" };
    });
    set({ reviewId, findings, states, isLoading: false });
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
}));

/** Workbook tally derived from current dispositions. */
export function tally(states: Record<string, FindingState>) {
  const t = { accepted: 0, override: 0, rejected: 0, commented: 0, pending: 0 };
  Object.values(states).forEach((s) => {
    t[s.disposition] = (t[s.disposition] ?? 0) + 1;
  });
  return t;
}
