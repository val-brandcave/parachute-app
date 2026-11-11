"use client";

import { useMemo, useState } from "react";
import { invoicedSpendEntries, walletView, type WalletView } from "@/lib/wallet-view";
import { useOrgStore } from "./org.store";
import { useReviewsStore } from "./reviews.store";
import { useWalletStore } from "./wallet.store";

/**
 * The current org's wallet, derived once (lib/wallet-view.ts). `now` comes from a
 * lazy useState so render stays pure (React 19). Invoiced orgs have no ledger: their
 * usage comes from their reviews (`invoicedSpendEntries`, anchored on `now`), the same
 * source Billing reads, so the header pill and Billing agree (RF3).
 */
export function useWalletView(): WalletView {
  const ledger = useWalletStore((s) => s.ledger);
  const reviews = useReviewsStore((s) => s.reviews);
  const org = useOrgStore((s) => s.org);
  const [now] = useState(() => Date.now());
  const invoiced = org?.billing === "invoiced";
  const source = useMemo(() => (invoiced ? invoicedSpendEntries(reviews, now) : ledger), [invoiced, reviews, now, ledger]);
  return useMemo(
    () => walletView(source, { now, approval: org?.approval, billing: org?.billing }),
    [source, now, org?.approval, org?.billing],
  );
}
