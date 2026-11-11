"use client";

import { useMemo, useState } from "react";
import { walletView, type WalletView } from "@/lib/wallet-view";
import { useOrgStore } from "./org.store";
import { useWalletStore } from "./wallet.store";

/**
 * The current org's wallet, derived once (lib/wallet-view.ts). `now` comes from a
 * lazy useState so render stays pure (React 19).
 *
 * STUB (T0.2): wiring is final; T0.3 fills walletView().
 */
export function useWalletView(): WalletView {
  const ledger = useWalletStore((s) => s.ledger);
  const org = useOrgStore((s) => s.org);
  const [now] = useState(() => Date.now());
  return useMemo(
    () => walletView(ledger, { now, approval: org?.approval, billing: org?.billing }),
    [ledger, now, org?.approval, org?.billing],
  );
}
