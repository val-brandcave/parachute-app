import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { publishedVersion } from "@/lib/template-versions";
import type {
  Attestation,
  AttestationState,
  AttAnswer,
  ChecklistTemplate,
} from "@/types";

/**
 * One working attestation row for the Administrative review — the join of a
 * checklist item (its question/group/citation rule come from the org-default
 * checklist, the single source of truth) with the per-review AI pre-fill
 * (`aiAnswer`/`confidence`/`page`/`evidence`). Parallel to a Technical `Finding`.
 */
export interface AttestationRow {
  itemId: string;
  group: string;
  question: string;
  requireCitation: boolean;
  aiAnswer: AttAnswer;
  confidence: number;
  page: number;
  evidence: string;
  /** True when no AI pre-fill existed for the item (AI couldn't determine it). */
  unprefilled: boolean;
}

/** The reviewer's attestation certificate, applied when the form is signed.
 *  `sha` is a real SHA-256 over the attested answers — the tamper-evident seal
 *  the auditor-facing attestation PDF carries (mirrors WorkbookSignature). */
export interface AttestationSignature {
  name: string;
  designation: string;
  at: number; // epoch ms
  sha: string; // hex SHA-256 of the attested form
}

/** An item "needs attention" when the AI answered NO or wasn't confident
 *  (< 0.85) — the reviewer's judgment is most needed here. Mirrors the client
 *  mock's rule. Reused by the workspace, coverage panel and filter. */
export function attNeedsAttention(row: AttestationRow): boolean {
  return row.aiAnswer === "NO" || row.confidence < 0.85;
}

/** Progress tally over the attestation states. */
export function attTally(states: Record<string, AttestationState>) {
  const t = { attested: 0, pending: 0, changed: 0 };
  Object.values(states).forEach((s) => {
    if (s.confirmed) t.attested += 1;
    else t.pending += 1;
  });
  return t;
}

interface AdminState {
  reviewId: string | null;
  /** The checklist family the attestation was built from (for the doc header). */
  checklistName: string | null;
  checklistVersion: number | null;
  rows: AttestationRow[];
  states: Record<string, AttestationState>; // itemId -> attestation state
  isLoading: boolean;
  /** null = DRAFT; set = signed. Per-review; reset on load. */
  signature: AttestationSignature | null;

  loadAdmin: (reviewId: string) => Promise<void>;
  /** Set the reviewer's answer. Changing it away from the confirmed value
   *  re-opens the item (must be re-confirmed, with a reason if it differs from
   *  the AI's). */
  setAnswer: (itemId: string, answer: AttAnswer) => void;
  setReason: (itemId: string, reason: string) => void;
  /** Attest one item. No-op if the answer differs from the AI's without a
   *  reason (the audit trail requires one) — the UI gates this too. */
  confirm: (itemId: string) => void;
  /** Re-open a single attested item back to pending. */
  unconfirm: (itemId: string) => void;
  /** Bulk-attest every routine item where the reviewer still agrees with the AI
   *  (skips anything needing attention — those stay for explicit judgment). */
  confirmRoutine: () => void;

  // ---- Attestation lifecycle ----
  signAttestation: (sig: AttestationSignature) => void;
  reopenAttestation: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  reviewId: null,
  checklistName: null,
  checklistVersion: null,
  rows: [],
  states: {},
  isLoading: false,
  signature: null,

  loadAdmin: async (reviewId) => {
    if (get().reviewId === reviewId && get().rows.length) return;
    set({ isLoading: true });
    const [checklists, prefills] = await Promise.all([
      adapter.getAll<ChecklistTemplate>(Collections.CHECKLIST_TEMPLATES),
      adapter.getWhere<Attestation>(Collections.ATTESTATIONS, (a) => a.reviewId === reviewId),
    ]);

    // The Administrative review is built from the org-default checklist's
    // published snapshot — the same template authored in Templates.
    const family = checklists.find((c) => c.isDefault) ?? checklists[0];
    const version = family ? publishedVersion(family.versions) : undefined;
    const byItem = new Map(prefills.map((p) => [p.itemId, p]));

    const rows: AttestationRow[] = (version?.items ?? []).map((item) => {
      const ai = byItem.get(item.id);
      return {
        itemId: item.id,
        group: item.group,
        question: item.question,
        requireCitation: item.requireCitation,
        aiAnswer: ai?.aiAnswer ?? "NA",
        confidence: ai?.confidence ?? 0,
        page: ai?.page ?? 0,
        evidence:
          ai?.evidence ??
          "Parachute could not determine an answer for this item — review the source and attest manually.",
        unprefilled: !ai,
      };
    });

    const states: Record<string, AttestationState> = {};
    rows.forEach((r) => {
      states[r.itemId] = { answer: r.aiAnswer, confirmed: false };
    });

    set({
      reviewId,
      checklistName: family?.name ?? null,
      checklistVersion: version?.version ?? null,
      rows,
      states,
      signature: null,
      isLoading: false,
    });
  },

  setAnswer: (itemId, answer) =>
    set((s) => {
      const prev = s.states[itemId];
      if (!prev) return {};
      // Changing the answer re-opens the item; keeping the same answer is a no-op.
      if (prev.answer === answer) return {};
      return {
        states: { ...s.states, [itemId]: { ...prev, answer, confirmed: false } },
      };
    }),

  setReason: (itemId, reason) =>
    set((s) =>
      s.states[itemId]
        ? { states: { ...s.states, [itemId]: { ...s.states[itemId], reason } } }
        : {},
    ),

  confirm: (itemId) =>
    set((s) => {
      const st = s.states[itemId];
      const row = s.rows.find((r) => r.itemId === itemId);
      if (!st || !row) return {};
      const changed = st.answer !== row.aiAnswer;
      if (changed && !st.reason?.trim()) return {}; // reason required — UI gates this
      return { states: { ...s.states, [itemId]: { ...st, confirmed: true } } };
    }),

  unconfirm: (itemId) =>
    set((s) =>
      s.states[itemId]
        ? { states: { ...s.states, [itemId]: { ...s.states[itemId], confirmed: false } } }
        : {},
    ),

  confirmRoutine: () =>
    set((s) => {
      const states = { ...s.states };
      s.rows.forEach((row) => {
        const st = states[row.itemId];
        if (!st.confirmed && !attNeedsAttention(row) && st.answer === row.aiAnswer) {
          states[row.itemId] = { ...st, confirmed: true };
        }
      });
      return { states };
    }),

  signAttestation: (sig) => set({ signature: sig }),
  reopenAttestation: () => set({ signature: null }),
}));
