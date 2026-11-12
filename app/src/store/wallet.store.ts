import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import {
  AUTO_RELOAD_DEFAULTS,
  EARN_CAP_CREDITS,
  EARN_REWARD_CREDITS,
  TRIAL_GRANT_CREDITS,
  costFor,
  customPriceUsd,
  packById,
  usd,
} from "@/lib/pricing";
import { sectionDef, sectionReward } from "@/lib/setup-steps";
import { SPEND_ORDER } from "@/lib/wallet-breakdown";
import { autoReloadDue, walletView } from "@/lib/wallet-view";
import { DEFAULT_ORG_ID } from "@/lib/identity-defaults";
import { getCurrentUser } from "@/lib/current-user";
import {
  generateId,
  type CreditLedgerEntry,
  type CreditPackId,
  type CreditSource,
  type LedgerKind,
  type ReviewType,
  type SetupSectionId,
  type WalletSettings,
} from "@/types";
import { useOrgStore } from "./org.store";
import { useSessionStore } from "./session.store";

/** Credits still spendable, by origin, after the PC-16 spend order (purchased, oldest pack first →
 *  earned → trial). Refunds and adjustments sit in the purchased bucket. */
export interface RemainingBySource {
  trial: number;
  earned: number;
  purchased: number;
}

/** Same numbers as `walletView().bySource` (lib/wallet-view.ts), which is the one derivation. */
export function remainingFromLedger(ledger: readonly CreditLedgerEntry[]): RemainingBySource {
  // `now` only feeds runway and month figures, which this does not read.
  return { ...walletView(ledger, { now: 0 }).bySource };
}

/** Which buckets a charge of `credits` would draw from, in spend order (PC-16). */
export function sourcesFor(remaining: RemainingBySource, credits: number): CreditSource[] {
  const out: CreditSource[] = [];
  let left = credits;
  for (const k of SPEND_ORDER) {
    if (left <= 0) break;
    if (remaining[k] > 0) {
      out.push(k);
      left -= remaining[k];
    }
  }
  return out;
}

/** A pending "Add credits" request, consumed by CheckoutLauncher. */
export interface TopUpIntent {
  /** Shortfall in credits (cost − balance), never the full cost (RF2). */
  needed?: number;
  /** Credit request being fulfilled (phase 4). */
  request?: string;
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
    monthlyCap: AUTO_RELOAD_DEFAULTS.monthlyCap,
    paymentMethod: null,
  };
}

interface WalletState {
  orgId: string | null;
  ledger: CreditLedgerEntry[];
  settings: WalletSettings | null;
  loading: boolean;

  /** "Add credits" was asked for (spec §5.6). CheckoutLauncher (mounted once in AppShell)
   *  turns it into a /checkout/credits navigation and clears it. `needed` is the SHORTFALL. */
  topUpIntent: TopUpIntent | null;
  receiptId: string | null;

  fetchWallet: (orgId?: string | null) => Promise<void>;

  // --- Derived (never stored) ---
  balance: () => number;
  cost: (types: readonly ReviewType[]) => number;

  // --- Writes (all through the adapter) ---
  debitForReview: (args: {
    reviewId: string;
    types: readonly ReviewType[];
    loanNo?: string;
    sample?: boolean;
  }) => Promise<CreditLedgerEntry | null>;
  grantTrial: () => Promise<CreditLedgerEntry | null>;
  /** Pay a finished section's reward (Get started v4). Idempotent per section and bounded by
   *  the earn cap. The earn-window check is the caller's (`sectionRewardDue`). */
  awardSection: (id: SetupSectionId) => Promise<CreditLedgerEntry | null>;
  /** Buy a pack, or a custom amount priced at its tier rate (`customPriceUsd`). */
  purchase: (choice: CreditPackId | { credits: number }) => Promise<CreditLedgerEntry>;
  /** Free-form signed adjustment (demo "+5 credits", support goodwill). */
  adjust: (credits: number, note?: string) => Promise<CreditLedgerEntry>;
  setAutoReload: (
    patch: Partial<Pick<WalletSettings, "autoReload" | "reloadPackId" | "reloadBelow" | "monthlyCap">>,
  ) => Promise<void>;
  setPaymentMethod: (
    patch: Partial<Pick<WalletSettings, "paymentMethod" | "cardLast4" | "billingEmail">>,
  ) => Promise<void>;

  /** Finance details and alert preferences (Billing > Settings). */
  setBillingSettings: (patch: Partial<Omit<WalletSettings, "id" | "orgId" | "createdAt">>) => Promise<void>;

  /** Records the intent only; CheckoutLauncher routes to checkout. Callers unchanged. */
  openTopUp: (opts?: { needed?: number; request?: string }) => void;
  clearTopUpIntent: () => void;
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
    topUpIntent: null,
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

    // `now` only feeds runway and month figures, which balance does not read.
    balance: () => walletView(get().ledger, { now: 0 }).balance,
    cost: (types) => costFor(types),

    debitForReview: async ({ reviewId, types, loanNo, sample }) => {
      if (sample) return null; // samples never cost anything
      if (useOrgStore.getState().org?.billing === "invoiced") return null; // billed outside the wallet
      if (get().ledger.some((e) => e.kind === "debit" && e.reviewId === reviewId)) return null;
      const credits = costFor(types);
      if (credits <= 0) return null;
      const paidFrom = sourcesFor(remainingFromLedger(get().ledger), credits);
      const entry = await addEntry({
        kind: "debit",
        credits: -credits,
        // Trial credits are free runs: $0 charged (the list value shows on the receipt).
        amountUsd: paidFrom.length === 1 && paidFrom[0] === "trial" ? 0 : usd(credits),
        reviewId,
        loanNo,
        reviewTypes: [...types],
        paidFrom,
        receiptId: `RCT-${generateId().slice(0, 5).toUpperCase()}`,
      });
      // Auto-reload: top up once when the balance drops below the threshold, within the monthly cap.
      const st = get().settings;
      if (st && autoReloadDue(get().ledger, st, Date.now())) {
        const pack = packById(st.reloadPackId);
        await addEntry({
          kind: "purchase",
          credits: pack.credits,
          amountUsd: pack.priceUsd,
          packId: pack.id,
          auto: true,
          receiptId: `RCT-${generateId().slice(0, 5).toUpperCase()}`,
          note: `Auto-reload · ${pack.credits}-credit pack`,
        });
      }
      return entry;
    },

    grantTrial: async () => {
      if (get().ledger.some((e) => e.kind === "trial_grant")) return null;
      return addEntry({
        kind: "trial_grant",
        credits: TRIAL_GRANT_CREDITS,
        note: "Welcome trial credits",
      });
    },

    awardSection: async (id) => {
      const reward = sectionReward(id);
      if (reward <= 0) return null;
      const earned = get().ledger.filter((e) => e.kind === "earned");
      if (earned.some((e) => e.setupSectionId === id)) return null;
      const room = EARN_CAP_CREDITS - earned.reduce((s, e) => s + e.credits, 0);
      const credits = Math.min(EARN_REWARD_CREDITS, reward, room);
      if (credits <= 0) return null;
      return addEntry({ kind: "earned", credits, setupSectionId: id, note: `Setup reward · ${sectionDef(id).title(useOrgStore.getState().org?.profile?.kind ?? "bank")}` });
    },

    purchase: async (choice) => {
      const receiptId = `RCT-${generateId().slice(0, 5).toUpperCase()}`;
      if (typeof choice === "object") {
        return addEntry({
          kind: "purchase",
          credits: choice.credits,
          amountUsd: customPriceUsd(choice.credits),
          receiptId,
          note: `${choice.credits} credits`,
        });
      }
      const pack = packById(choice);
      return addEntry({
        kind: "purchase",
        credits: pack.credits,
        amountUsd: pack.priceUsd,
        packId: choice,
        receiptId,
        note: `${pack.credits}-credit pack`,
      });
    },

    adjust: async (credits, note) =>
      addEntry({ kind: "adjustment", credits, note: note ?? "Adjustment" }),

    setAutoReload: (patch) => patchSettings(patch),
    setPaymentMethod: (patch) => patchSettings(patch),
    setBillingSettings: (patch) => patchSettings(patch),

    openTopUp: (opts) =>
      set({
        topUpIntent: {
          ...(opts?.needed !== undefined ? { needed: opts.needed } : {}),
          ...(opts?.request ? { request: opts.request } : {}),
        },
      }),
    clearTopUpIntent: () => set({ topUpIntent: null }),
    openReceipt: (receiptId) => set({ receiptId }),
    closeReceipt: () => set({ receiptId: null }),
  };
});
