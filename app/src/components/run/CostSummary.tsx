"use client";

import "./cost-summary.css";
import { useMemo } from "react";
import { CreditChip, Icon } from "@/components/atoms";
import { useOrgStore, useWalletView } from "@/store";
import { sourcesFor } from "@/store/wallet.store";
import { REVIEW_TYPE_COST, approxValue, costFor } from "@/lib/pricing";
import type { ReviewType } from "@/types";

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
  const wallet = useWalletView();
  const invoiced = useOrgStore((s) => s.org?.billing === "invoiced");
  return useMemo(() => {
    const credits = costFor(types);
    const { balance, bySource: remaining } = wallet;
    if (sample) return { mode: "sample", credits: 0, balance, afterBalance: balance, trialOnly: false, trialLeft: 0, affordable: true };
    if (invoiced) return { mode: "invoiced", credits, balance, afterBalance: balance, trialOnly: false, trialLeft: 0, affordable: true };
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
  }, [wallet, invoiced, sample, types]);
}

/**
 * Left slot of the confirm footbar: what Start will spend. Display only: when the
 * balance is short, Start review opens the credits lock dialog over Review setup
 * (spec §5.5). The old LowBalanceCallout and its toast-only "Ask your admin" are
 * gone; a reviewer's ask is the dialog's request body (T4.1).
 */
export function CostSummary({ cost }: { cost: RunCost }) {
  if (cost.mode === "sample") {
    return (
      <div className="cs-summary">
        <Icon name="wallet" size={16} />
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
        <Icon name="wallet" size={16} />
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
      <Icon name="wallet" size={16} />
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
