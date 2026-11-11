"use client";

import { CreditChip, Icon, Tooltip, type CreditChipTone } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { useApprovalPending, useOrgStore, useWalletView } from "@/store";
import { useSetupActions } from "./home";

/** Sidebar footer pill above the OrgCard: "6 trial" while every credit is trial, "13 credits" once
 *  mixed or bought, amber at or under LOW_BALANCE_AT (wallet-view lowTone) and amber "Pending" while
 *  approval is open. */
export function BalancePill({ collapsed }: { collapsed: boolean }) {
  const billing = useOrgStore((s) => s.org?.billing);
  const wallet = useWalletView();
  const pending = useApprovalPending();
  const { billing: openBilling } = useSetupActions();
  if (billing !== "trial" && billing !== "payg") return null;

  const { balance, bySource } = wallet;
  const allTrial = balance > 0 && bySource.trial === balance;
  const low = wallet.lowTone !== "ok";
  const noun = `credit${balance === 1 ? "" : "s"}`;

  let tone: CreditChipTone;
  let label: string;
  if (pending) {
    tone = "low";
    label = "Pending";
  } else if (low) {
    tone = "low";
    label = `${balance} ${noun}`;
  } else if (allTrial) {
    tone = "trial";
    label = `${balance} trial`;
  } else {
    tone = "credit";
    label = `${balance} ${noun}`;
  }

  const pill = (
    <button
      type="button"
      className={cn("sb-balance", collapsed && "is-collapsed")}
      onClick={openBilling}
      aria-label={`Balance ${label} · open billing`}
    >
      <Icon name="wallet" size={16} />
      {!collapsed && <span className="sb-balance-l">Balance</span>}
      {!collapsed && (
        <CreditChip tone={tone} size="sm">
          {label}
        </CreditChip>
      )}
    </button>
  );
  return (
    <Tooltip content={collapsed ? `Balance · ${label} · open billing` : "Balance · open billing"} side="right" block>
      {pill}
    </Tooltip>
  );
}
