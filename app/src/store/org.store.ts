import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { DEFAULT_ORG_ID } from "@/lib/identity-defaults";
import { generateId, type BankPolicyDoc, type Org, type OrgFlags, type OrgProfile } from "@/types";
import { useSessionStore } from "./session.store";

/**
 * Org-level settings that aren't templates (those live in templates.store).
 *
 * Bank policy (F-123): the short policy document whose rules are applied on the
 * pipeline's final pass. It is ORG CONFIG — uploaded once in Settings →
 * Compliance — never asked for per run; the run confirm gate only *references*
 * it (read-only inherited row, like the workbook layout). Persisted through the
 * adapter (`getBankPolicy` / `setBankPolicy`).
 */
export type { BankPolicyDoc } from "@/types";

/** The stage org every /welcome run and scenario rebuilds (PC-19). */
export const STAGE_ORG_ID = "org-hcb";

/** Seeded org policy — the org IS the bank (Meridian Trust). */
const DEFAULT_POLICY: BankPolicyDoc = {
  name: "Meridian Trust — Appraisal Review Policy.pdf",
  sizeLabel: "1.1 MB",
  updatedAt: "Jun 12, 2026",
};

/** Write-through to the adapter; the in-memory value is already set. */
function persist(doc: BankPolicyDoc | null) {
  adapter.setBankPolicy(doc).catch((e) => console.error("bank policy save failed", e));
}

/** What `/welcome` collects to create a workspace. */
export interface NewOrgInput {
  name: string;
  profile: OrgProfile;
  /** First org_admin (becomes the billing contact). */
  adminId?: string;
  /** Hold the workspace for staff approval (RWT-1031): set from needsStaffApproval(profile). */
  approvalGate?: boolean;
}

interface OrgState {
  bankPolicy: BankPolicyDoc | null;
  setBankPolicy: (doc: BankPolicyDoc) => void;
  removeBankPolicy: () => void;
  /** Align the (single, adapter-backed) policy with the session's org: a
   *  trial / pay-as-you-go org has one only once it has uploaded it. */
  syncBankPolicy: (hasPolicy: boolean) => void;

  /** The current org record (profile, billing model, approval, flags). */
  org: Org | null;
  /** Load an org (default: the session's org) through the adapter. */
  fetchOrg: (orgId?: string) => Promise<Org | null>;
  /** Create a workspace from the `/welcome` setup form. Does not sign anyone in. */
  createOrg: (input: NewOrgInput) => Promise<Org>;
  patchOrg: (patch: Partial<Org>) => Promise<void>;
  /** "Talk to us" — record that the prospect asked for sales. */
  requestSales: (note?: string) => Promise<void>;
  /**
   * Create or update the stage org `org-hcb` from `/welcome` (PC-19): same id every
   * time, so demo resets don't pile up orgs. Starts it fresh: clears its ledger,
   * setup progress, reviews and invites (members are kept).
   */
  upsertStageOrg: (input: NewOrgInput) => Promise<Org>;
  /** Enterprise: a call booked from `/welcome/call`. Also marks sales requested. */
  bookCall: (slot: { at: number; label: string }) => Promise<void>;
  /** Staff approval. Also grants the trial credits once (no-op if already granted). */
  approve: () => Promise<void>;
  setFlag: (flag: keyof OrgFlags, value: boolean) => Promise<void>;
}

export const useOrgStore = create<OrgState>((set, get) => ({
  // Seeded default until the adapter answers (hydrateBankPolicy, below, runs at load).
  bankPolicy: DEFAULT_POLICY,
  setBankPolicy: (doc) => {
    persist(doc);
    set({ bankPolicy: doc });
  },
  removeBankPolicy: () => {
    persist(null);
    set({ bankPolicy: null });
  },
  syncBankPolicy: (hasPolicy) => {
    const org = get().org;
    if (!org || org.billing === "invoiced") return;
    if (!hasPolicy) {
      set({ bankPolicy: null });
    } else if (!get().bankPolicy) {
      set({
        bankPolicy: {
          name: `${org.name} — Appraisal Review Policy.pdf`,
          sizeLabel: "0.9 MB",
          updatedAt: "Nov 8, 2026",
        },
      });
    }
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
      flags: { approvalGate, membersInBouncer: true, welcomeBanner: true },
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
  upsertStageOrg: async ({ name, profile, adminId, approvalGate = false }) => {
    const existing = await adapter.getById<Org>(Collections.ORGS, STAGE_ORG_ID);
    // A new workspace starts empty: drop the stage org's credits, setup progress,
    // reviews and invites. Members stay (the invite step's "already a member" case
    // reads them). A persona switch restores the seed via resetOrgRows().
    for (const c of [Collections.CREDIT_LEDGER, Collections.SETUP_PROGRESS, Collections.REVIEWS, Collections.INVITES]) {
      const rows = await adapter.getWhere<{ id: string; orgId?: string }>(c, (r) => r.orgId === STAGE_ORG_ID);
      for (const r of rows) await adapter.remove(c, r.id);
    }
    const fields = {
      name,
      profile,
      billing: "trial" as const,
      approval: approvalGate ? ("pending" as const) : ("none" as const),
      flags: { ...existing?.flags, approvalGate, membersInBouncer: true, welcomeBanner: true },
      billingContactId: adminId ?? existing?.billingContactId,
    };
    const org = existing
      ? await adapter.update<Org>(Collections.ORGS, STAGE_ORG_ID, { ...fields, updatedAt: Date.now() })
      : await adapter.create<Org>(Collections.ORGS, {
          id: STAGE_ORG_ID,
          brandPrimary: "#10344c",
          brandAccent: "#2a6f7f",
          brandFont: "Inter",
          createdAt: Date.now(),
          ...fields,
        });
    set({ org });
    return org;
  },
  bookCall: async (slot) => {
    const current = get().org;
    if (!current?.profile) return;
    await get().patchOrg({
      profile: { ...current.profile, salesRequested: true, callBookedAt: slot.at, callSlot: slot.label },
    });
  },
  approve: async () => {
    await get().patchOrg({ approval: "approved" });
    // Lazy: wallet.store imports this store, so a static import would be circular.
    const { useWalletStore } = await import("./wallet.store");
    await useWalletStore.getState().grantTrial();
  },
  setFlag: async (flag, value) => {
    const current = get().org;
    if (!current) return;
    await get().patchOrg({ flags: { ...current.flags, [flag]: value } });
  },
}));

/** Load the stored policy once at startup. The mock adapter answers on the next
 *  microtask, before first render, so this matches the old synchronous read. A
 *  value set in the meantime (setBankPolicy / syncBankPolicy) wins. */
let policyTouched = false;
useOrgStore.subscribe((s, prev) => {
  if (s.bankPolicy !== prev.bankPolicy) policyTouched = true;
});
adapter
  .getBankPolicy()
  .then((doc) => {
    if (policyTouched || doc === undefined) return;
    useOrgStore.setState({ bankPolicy: doc });
  })
  .catch(() => {
    /* API adapter not wired yet: keep the seeded default */
  });
