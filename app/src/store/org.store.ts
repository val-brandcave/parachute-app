import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { DEFAULT_ORG_ID } from "@/lib/identity-defaults";
import { generateId, type Org, type OrgFlags, type OrgProfile } from "@/types";
import { useSessionStore } from "./session.store";

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

/** What `/welcome` collects to create a workspace. */
export interface NewOrgInput {
  name: string;
  profile: OrgProfile;
  /** First org_admin (becomes the billing contact). */
  adminId?: string;
  /** Hold the workspace for staff approval (RWT-1031). Off = instant sign-up. */
  approvalGate?: boolean;
}

interface OrgState {
  bankPolicy: BankPolicyDoc | null;
  setBankPolicy: (doc: BankPolicyDoc) => void;
  removeBankPolicy: () => void;

  /** The current org record (profile, billing model, approval, flags). */
  org: Org | null;
  /** Load an org (default: the session's org) through the adapter. */
  fetchOrg: (orgId?: string) => Promise<Org | null>;
  /** Create a workspace from the `/welcome` setup form. Does not sign anyone in. */
  createOrg: (input: NewOrgInput) => Promise<Org>;
  patchOrg: (patch: Partial<Org>) => Promise<void>;
  /** "Talk to us" — record that the prospect asked for sales. */
  requestSales: (note?: string) => Promise<void>;
  /** Staff approval (demo control). */
  approve: () => Promise<void>;
  setFlag: (flag: keyof OrgFlags, value: boolean) => Promise<void>;
}

export const useOrgStore = create<OrgState>((set, get) => ({
  bankPolicy: initialPolicy(),
  setBankPolicy: (doc) => {
    persist(doc);
    set({ bankPolicy: doc });
  },
  removeBankPolicy: () => {
    persist(null);
    set({ bankPolicy: null });
  },

  org: null,
  fetchOrg: async (orgId) => {
    const id = orgId ?? useSessionStore.getState().orgId ?? DEFAULT_ORG_ID;
    const org = await adapter.getById<Org>(Collections.ORGS, id);
    set({ org });
    return org;
  },
  createOrg: async ({ name, profile, adminId, approvalGate = false }) => {
    const org: Org = {
      id: `org-${generateId().slice(0, 8)}`,
      name,
      brandPrimary: "#10344c",
      brandAccent: "#2a6f7f",
      brandFont: "Inter",
      createdAt: Date.now(),
      profile,
      billing: "trial",
      approval: approvalGate ? "pending" : "none",
      flags: { approvalGate, membersInBouncer: true },
      billingContactId: adminId,
    };
    const created = await adapter.create<Org>(Collections.ORGS, org);
    set({ org: created });
    return created;
  },
  patchOrg: async (patch) => {
    const current = get().org;
    if (!current) return;
    const updated = await adapter.update<Org>(Collections.ORGS, current.id, {
      ...patch,
      updatedAt: Date.now(),
    });
    set({ org: updated });
  },
  requestSales: async (note) => {
    const current = get().org;
    if (!current?.profile) return;
    await get().patchOrg({
      profile: { ...current.profile, salesRequested: true, salesNote: note },
    });
  },
  approve: async () => {
    await get().patchOrg({ approval: "approved" });
  },
  setFlag: async (flag, value) => {
    const current = get().org;
    if (!current) return;
    await get().patchOrg({ flags: { ...current.flags, [flag]: value } });
  },
}));
