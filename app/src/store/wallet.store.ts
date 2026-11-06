import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import {
  AUTO_RELOAD_DEFAULTS,
  EARN_CAP_CREDITS,
  EARN_REWARD_CREDITS,
  TRIAL_GRANT_CREDITS,
  costFor,
  packById,
  usd,
} from "@/lib/pricing";
import { rewardFor } from "@/lib/setup-steps";
import { DEFAULT_ORG_ID } from "@/lib/identity-defaults";
import { getCurrentUser } from "@/lib/current-user";
import {
  generateId,
  type CreditLedgerEntry,
  type CreditPackId,
  type LedgerKind,
  type ReviewType,
  type SetupStepId,
  type WalletSettings,
} from "@/types";
import { useOrgStore } from "./org.store";
import { useSessionStore } from "./session.store";

export type TopUpReason = "manual" | "low_balance";

/** Gross credits by origin, plus what has been spent. */
export interface BalanceBySource {
  trial: number;
  earned: number;
  purchased: number;
  /** refunds + adjustments */
  other: number;
  /** credits consumed (positive number) */
  used: number;
}

type NewEntry = Partial<
  Omit<CreditLedgerEntry, "id" | "orgId" | "createdAt" | "actorId" | "kind" | "credits">
> & {
  kind: LedgerKind;
  credits: number;
};

function defaultSettings(orgId: string): WalletSettings {
  return {
    id: orgId,
    orgId,
    createdAt: Date.now(),
    autoReload: false,
    reloadPackId: AUTO_RELOAD_DEFAULTS.packId,
    reloadBelow: AUTO_RELOAD_DEFAULTS.below,
    paymentMethod: null,
  };
}

interface WalletState {
  orgId: string | null;
  ledger: CreditLedgerEntry[];
  settings: WalletSettings | null;
  loading: boolean;

  /** Global top-up dialog + receipt dialog open state (mounted once in the shell). */
  topUpOpen: boolean;
  topUpReason: TopUpReason;
  /** Credits the blocked action needed, when opened from a low-balance state. */
  topUpNeeded: number | null;
  receiptId: string | null;

  fetchWallet: (orgId?: string | null) => Promise<void>;

  // --- Derived (never stored) ---
  balance: () => number;
  balanceBySource: () => BalanceBySource;
  cost: (types: readonly ReviewType[]) => number;
  /** Can the org run this? Invoiced orgs are billed outside the wallet, so always yes. */
  canAfford: (credits: number) => boolean;

  // --- Writes (all through the adapter) ---
  debitForReview: (args: {
    reviewId: string;
    types: readonly ReviewType[];
    loanNo?: string;
    sample?: boolean;
  }) => Promise<CreditLedgerEntry | null>;
  grantTrial: () => Promise<CreditLedgerEntry | null>;
  /** Idempotent per step and bounded by the earn cap. */
  award: (stepId: SetupStepId) => Promise<CreditLedgerEntry | null>;
  purchase: (packId: CreditPackId) => Promise<CreditLedgerEntry>;
  /** Free-form signed adjustment (demo "+5 credits", support goodwill). */
  adjust: (credits: number, note?: string) => Promise<CreditLedgerEntry>;
  setAutoReload: (
    patch: Partial<Pick<WalletSettings, "autoReload" | "reloadPackId" | "reloadBelow" | "monthlyCap">>,
  ) => Promise<void>;
  setPaymentMethod: (
    patch: Partial<Pick<WalletSettings, "paymentMethod" | "cardLast4" | "billingEmail">>,
  ) => Promise<void>;

  openTopUp: (opts?: { reason?: TopUpReason; needed?: number }) => void;
  closeTopUp: () => void;
  openReceipt: (receiptId: string) => void;
  closeReceipt: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => {
  const orgIdNow = () => get().orgId ?? useSessionStore.getState().orgId ?? DEFAULT_ORG_ID;

  const addEntry = async (e: NewEntry): Promise<CreditLedgerEntry> => {
    const entry: CreditLedgerEntry = {
      id: generateId(),
      createdAt: Date.now(),
      orgId: orgIdNow(),
      actorId: getCurrentUser().id,
      ...e,
    };
    const created = await adapter.create<CreditLedgerEntry>(Collections.CREDIT_LEDGER, entry);
    set((s) => ({ ledger: [...s.ledger, created] }));
    return created;
  };

  const patchSettings = async (patch: Partial<WalletSettings>) => {
    const existing = get().settings;
    const next = { ...(existing ?? defaultSettings(orgIdNow())), ...patch };
    if (existing) {
      await adapter.update<WalletSettings>(Collections.WALLET_SETTINGS, existing.id, patch);
    } else {
      await adapter.create<WalletSettings>(Collections.WALLET_SETTINGS, next);
    }
    set({ settings: next });
  };

  return {
    orgId: null,
    ledger: [],
    settings: null,
    loading: false,
    topUpOpen: false,
    topUpReason: "manual",
    topUpNeeded: null,
    receiptId: null,

    fetchWallet: async (orgId) => {
      const id = orgId === undefined ? useSessionStore.getState().orgId : orgId;
      if (!id) {
        set({ orgId: null, ledger: [], settings: null, loading: false });
        return;
      }
      set({ loading: true });
      const [ledger, settings] = await Promise.all([
        adapter.getWhere<CreditLedgerEntry>(Collections.CREDIT_LEDGER, (e) => e.orgId === id),
        adapter.getById<WalletSettings>(Collections.WALLET_SETTINGS, id),
      ]);
      ledger.sort((a, b) => a.createdAt - b.createdAt);
      let row = settings;
      if (!row) {
        row = defaultSettings(id);
        await adapter.create<WalletSettings>(Collections.WALLET_SETTINGS, row);
      }
      set({ orgId: id, ledger, settings: row, loading: false });
    },

    balance: () => get().ledger.reduce((sum, e) => sum + e.credits, 0),
    balanceBySource: () => {
      const out: BalanceBySource = { trial: 0, earned: 0, purchased: 0, other: 0, used: 0 };
      for (const e of get().ledger) {
        if (e.kind === "trial_grant") out.trial += e.credits;
        else if (e.kind === "earned") out.earned += e.credits;
        else if (e.kind === "purchase") out.purchased += e.credits;
        else if (e.kind === "debit" || e.kind === "rescan") out.used += -e.credits;
        else out.other += e.credits;
      }
      return out;
    },
    cost: (types) => costFor(types),
    canAfford: (credits) => {
      if (useOrgStore.getState().org?.billing === "invoiced") return true;
      return get().balance() >= credits;
    },

    debitForReview: async ({ reviewId, types, loanNo, sample }) => {
      if (sample) return null; // samples never cost anything
      if (useOrgStore.getState().org?.billing === "invoiced") return null; // billed outside the wallet
      if (get().ledger.some((e) => e.kind === "debit" && e.reviewId === reviewId)) return null;
      const credits = costFor(types);
      if (credits <= 0) return null;
      return addEntry({
        kind: "debit",
        credits: -credits,
        amountUsd: usd(credits),
        reviewId,
        loanNo,
        reviewTypes: [...types],
      });
    },

    grantTrial: async () => {
      if (get().ledger.some((e) => e.kind === "trial_grant")) return null;
      return addEntry({
        kind: "trial_grant",
        credits: TRIAL_GRANT_CREDITS,
        note: "Welcome trial credits",
      });
    },

    award: async (stepId) => {
      const reward = rewardFor(stepId);
      if (reward <= 0) return null;
      const earned = get().ledger.filter((e) => e.kind === "earned");
      if (earned.some((e) => e.setupStepId === stepId)) return null;
      const room = EARN_CAP_CREDITS - earned.reduce((s, e) => s + e.credits, 0);
      const credits = Math.min(EARN_REWARD_CREDITS, reward, room);
      if (credits <= 0) return null;
      return addEntry({ kind: "earned", credits, setupStepId: stepId, note: "Setup reward" });
    },

    purchase: async (packId) => {
      const pack = packById(packId);
      return addEntry({
        kind: "purchase",
        credits: pack.credits,
        amountUsd: pack.priceUsd,
        packId,
        receiptId: `RCT-${generateId().slice(0, 5).toUpperCase()}`,
        note: `${pack.credits}-credit pack`,
      });
    },

    adjust: async (credits, note) =>
      addEntry({ kind: "adjustment", credits, note: note ?? "Adjustment" }),

    setAutoReload: (patch) => patchSettings(patch),
    setPaymentMethod: (patch) => patchSettings(patch),

    openTopUp: (opts) =>
      set({
        topUpOpen: true,
        topUpReason: opts?.reason ?? "manual",
        topUpNeeded: opts?.needed ?? null,
      }),
    closeTopUp: () => set({ topUpOpen: false, topUpNeeded: null }),
    openReceipt: (receiptId) => set({ receiptId }),
    closeReceipt: () => set({ receiptId: null }),
  };
});
