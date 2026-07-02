import { create } from "zustand";

/**
 * Org-level settings that aren't templates (those live in templates.store).
 *
 * Bank policy (F-123): the short policy document whose rules are applied on the
 * pipeline's final pass. It is ORG CONFIG — uploaded once in Settings →
 * Compliance — never asked for per run; the run confirm gate only *references*
 * it (read-only inherited row, like the workbook layout).
 */
export interface BankPolicyDoc {
  name: string;
  /** Display size — mock layer keeps a formatted label, not bytes. */
  sizeLabel: string;
  /** Display date the doc was last replaced (e.g. "Jun 12, 2026"). */
  updatedAt: string;
}

const KEY = "parachute:org:bank-policy";

/** Seeded org policy — the org IS the bank (Meridian Trust). */
const DEFAULT_POLICY: BankPolicyDoc = {
  name: "Meridian Trust — Appraisal Review Policy.pdf",
  sizeLabel: "1.1 MB",
  updatedAt: "Jun 12, 2026",
};

function initialPolicy(): BankPolicyDoc | null {
  if (typeof window === "undefined") return DEFAULT_POLICY;
  const raw = window.localStorage.getItem(KEY);
  if (raw === "none") return null;
  if (raw) {
    try {
      return JSON.parse(raw) as BankPolicyDoc;
    } catch {
      /* fall through to the seed */
    }
  }
  return DEFAULT_POLICY;
}

function persist(doc: BankPolicyDoc | null) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, doc ? JSON.stringify(doc) : "none");
}

interface OrgState {
  bankPolicy: BankPolicyDoc | null;
  setBankPolicy: (doc: BankPolicyDoc) => void;
  removeBankPolicy: () => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  bankPolicy: initialPolicy(),
  setBankPolicy: (doc) => {
    persist(doc);
    set({ bankPolicy: doc });
  },
  removeBankPolicy: () => {
    persist(null);
    set({ bankPolicy: null });
  },
}));
