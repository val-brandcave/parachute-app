"use client";

import { Icon, Tooltip } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { useOrgStore, useWalletStore } from "@/store";
import { useSetupActions } from "./home";

/** Sidebar footer pill above the OrgCard: dashed "6 trial" while every credit is
 *  trial, a filled "5 credits" once mixed or bought. Trial / pay-as-you-go only. */
export function BalancePill({ collapsed }: { collapsed: boolean }) {
  const billing = useOrgStore((s) => s.org?.billing);
  const ledger = useWalletStore((s) => s.ledger);
  const { billing: openBilling } = useSetupActions();
  if (billing !== "trial" && billing !== "payg") return null;

  const balance = ledger.reduce((sum, e) => sum + e.credits, 0);
  const nonTrial = ledger.some((e) => e.kind !== "trial_grant" && e.kind !== "debit" && e.credits > 0);
  const label = nonTrial ? `${balance} credit${balance === 1 ? "" : "s"}` : `${balance} trial`;

  const pill = (
    <button type="button" className={cn("sb-balance", collapsed && "is-collapsed")} onClick={openBilling} aria-label={`Balance ${label} · open billing`}>
      <Icon name="wallet" size={16} />
      {!collapsed && <span className="sb-balance-l">Balance</span>}
      <span className={cn("sb-balance-chip", nonTrial ? "is-solid" : "is-trial")}>{collapsed ? balance : label}</span>
    </button>
  );
  return (
    <Tooltip content={collapsed ? `Balance · ${label} · open billing` : "Balance · open billing"} side="right" block>
      {pill}
    </Tooltip>
  );
}
