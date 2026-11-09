"use client";

import "./cost-summary.css";
import { useMemo } from "react";
import { useToast } from "@realwired/ui";
import { Button, CreditChip, Icon } from "@/components/atoms";
import { useOrgStore, useUsersStore, useWalletStore } from "@/store";
import { remainingFromLedger, sourcesFor } from "@/store/wallet.store";
import { useCurrentUser } from "@/lib/current-user";
import {
  CREDIT_PACKS,
  DEFAULT_PACK_ID,
  REVIEW_TYPE_COST,
  approxValue,
  costFor,
  formatUsd,
  packById,
} from "@/lib/pricing";
import type { ReviewType } from "@/types";

const TYPE_LABEL: Record<ReviewType, string> = {
  technical: "Technical",
  administrative: "Administrative",
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** What this review would cost the current org, and whether the wallet covers it. */
export interface RunCost {
  /** "wallet" = credits apply; "invoiced" = billed monthly; "sample" = never costs. */
  mode: "wallet" | "invoiced" | "sample";
  credits: number;
  balance: number;
  afterBalance: number;
  /** Paid wholly from trial credits (free run, list value shown). */
  trialOnly: boolean;
  /** Trial credits still unspent after this review (trial-only runs). */
  trialLeft: number;
  affordable: boolean;
}

export function useRunCost(types: readonly ReviewType[], sample: boolean): RunCost {
  const ledger = useWalletStore((s) => s.ledger);
  const invoiced = useOrgStore((s) => s.org?.billing === "invoiced");
  return useMemo(() => {
    const credits = costFor(types);
    const balance = ledger.reduce((sum, e) => sum + e.credits, 0);
    if (sample) return { mode: "sample", credits: 0, balance, afterBalance: balance, trialOnly: false, trialLeft: 0, affordable: true };
    if (invoiced) return { mode: "invoiced", credits, balance, afterBalance: balance, trialOnly: false, trialLeft: 0, affordable: true };
    const remaining = remainingFromLedger(ledger);
    const paidFrom = sourcesFor(remaining, credits);
    return {
      mode: "wallet",
      credits,
      balance,
      afterBalance: balance - credits,
      trialOnly: paidFrom.length === 1 && paidFrom[0] === "trial",
      trialLeft: remaining.trial - credits,
      affordable: balance >= credits,
    };
  }, [ledger, invoiced, sample, types]);
}

/** Left slot of the confirm footbar: what Start will spend. */
export function CostSummary({ cost }: { cost: RunCost }) {
  if (cost.mode === "sample") {
    return (
      <div className="cs-summary">
        <Icon name="coins" size={16} />
        <span>Sample · free</span>
      </div>
    );
  }
  if (cost.mode === "invoiced") {
    return (
      <div className="cs-summary">
        <Icon name="receipt" size={16} />
        <span>Billed monthly through Realwired</span>
      </div>
    );
  }
  if (cost.credits === 0) return <div className="cs-summary" />;

  const value = approxValue(cost.credits);
  if (!cost.affordable) {
    return (
      <div className="cs-summary">
        <Icon name="coins" size={16} />
        <span>This review uses</span>
        <CreditChip tone="credit">{plural(cost.credits, "credit")}</CreditChip>
        <CreditChip tone="money">{value}</CreditChip>
        <span className="cs-sep" aria-hidden="true" />
        <CreditChip tone="low">
          <Icon name="warn" size={13} />
          Balance {cost.balance}
        </CreditChip>
      </div>
    );
  }
  return (
    <div className="cs-summary">
      <Icon name="coins" size={16} />
      <span>This review uses</span>
      {cost.trialOnly ? (
        <>
          <CreditChip tone="trial">{plural(cost.credits, "trial credit")}</CreditChip>
          <CreditChip tone="money">list {value}</CreditChip>
          <span className="cs-sep" aria-hidden="true" />
          <span>Left after</span>
          <CreditChip tone="trial">{plural(cost.trialLeft, "trial credit")}</CreditChip>
        </>
      ) : (
        <>
          <CreditChip tone="credit">{plural(cost.credits, "credit")}</CreditChip>
          <CreditChip tone="money">{value}</CreditChip>
          <span className="cs-sep" aria-hidden="true" />
          <span>Balance after</span>
          <CreditChip tone="credit">{plural(cost.afterBalance, "credit")}</CreditChip>
        </>
      )}
    </div>
  );
}

/** Right-aligned pair on a review-type row: `[1 credit] [~$150]`. */
export function TypeCostChip({ type }: { type: ReviewType }) {
  const credits = REVIEW_TYPE_COST[type];
  return (
    <span className="cs-type-cost">
      <CreditChip tone="credit">{plural(credits, "credit")}</CreditChip>
      <CreditChip tone="money">{approxValue(credits)}</CreditChip>
    </span>
  );
}

/**
 * D3 / D3b — shown above the footbar when the balance can't cover the selected types.
 * org_admin: Add credits (opens C's modal) · Run X only · Ask your admin.
 * Everyone else: Run X only · Ask your admin (no purchase path).
 */
export function LowBalanceCallout({
  selected,
  cost,
  onRunOnly,
}: {
  selected: readonly ReviewType[];
  cost: RunCost;
  onRunOnly: (t: ReviewType) => void;
}) {
  const toast = useToast();
  const me = useCurrentUser();
  const admin = useUsersStore((s) =>
    s.allUsers.find((u) => u.role === "org_admin" && u.orgId === me.orgId),
  );
  const isAdmin = me.role === "org_admin";

  // Only offered when exactly one selected type fits the balance on its own.
  const fitting = selected.filter((t) => REVIEW_TYPE_COST[t] <= cost.balance);
  const runOnly = selected.length > 1 && fitting.length >= 1 ? fitting[0] : null;

  // Default pack, or the smallest one that covers the shortfall.
  const shortfall = cost.credits - cost.balance;
  const def = packById(DEFAULT_PACK_ID);
  const pack =
    def.credits >= shortfall ? def : (CREDIT_PACKS.find((p) => p.credits >= shortfall) ?? def);

  const askAdmin = () =>
    toast({
      title: `We emailed ${admin?.name ?? "your organization admin"}`,
      description: "They can add credits so you can start this review.",
      tone: "success",
    });

  return (
    <div className="cs-callout" role="status">
      <Icon name="warn" size={17} />
      <div className="cs-callout-body">
        <div>
          <b>
            You have {plural(cost.balance, "credit")}. This review needs {cost.credits}.
          </b>
        </div>
        <div>Your upload is saved as a draft and nothing has been charged.</div>
        <div className="cs-callout-actions">
          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              iconLeft="add"
              onClick={() =>
                useWalletStore.getState().openTopUp({ reason: "low_balance", needed: cost.credits })
              }
            >
              Add {pack.credits} credits · {formatUsd(pack.priceUsd)}
            </Button>
          )}
          {runOnly && (
            <Button variant="outline" size="sm" onClick={() => onRunOnly(runOnly)}>
              Run {TYPE_LABEL[runOnly]} only · {plural(REVIEW_TYPE_COST[runOnly], "credit")}
            </Button>
          )}
          <button type="button" className="cs-callout-link" onClick={askAdmin}>
            Ask your admin
          </button>
          {!isAdmin && admin && <span className="cs-callout-note">We&apos;ll email {admin.name}</span>}
        </div>
      </div>
    </div>
  );
}
