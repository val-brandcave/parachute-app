"use client";

import { useMemo, useState } from "react";
import { invoicedSpendEntries, walletView, type WalletView } from "@/lib/wallet-view";
import type { CreditLedgerEntry } from "@/types";
import { useOrgStore } from "./org.store";
import { useReviewsStore } from "./reviews.store";
import { useWalletStore } from "./wallet.store";

/**
 * The entries every wallet number reads, and the `now` they are anchored on. Wallet orgs:
 * the ledger. Invoiced orgs have no ledger: their usage comes from their reviews
 * (`invoicedSpendEntries`, anchored on `now`), the same source Billing reads, so the header
 * pill, the popover's "You used" line and Billing agree (RF3). `now` comes from a lazy
 * useState so render stays pure (React 19).
 */
export function useWalletSource(): { source: CreditLedgerEntry[]; now: number } {
  const ledger = useWalletStore((s) => s.ledger);
  const reviews = useReviewsStore((s) => s.reviews);
  const invoiced = useOrgStore((s) => s.org?.billing === "invoiced");
  const [now] = useState(() => Date.now());
  const source = useMemo(() => (invoiced ? invoicedSpendEntries(reviews, now) : ledger), [invoiced, reviews, now, ledger]);
  return { source, now };
}

/** The current org's wallet, derived once (lib/wallet-view.ts) from `useWalletSource`. */
export function useWalletView(): WalletView {
  const { source, now } = useWalletSource();
  const org = useOrgStore((s) => s.org);
  return useMemo(
    () => walletView(source, { now, approval: org?.approval, billing: org?.billing }),
    [source, now, org?.approval, org?.billing],
  );
}
