"use client";

import { CreditChip, Icon, Tooltip, type CreditChipTone } from "@/components/atoms";
import { costFor } from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { balanceGrants } from "@/lib/wallet-breakdown";
import { cn } from "@/lib/utils";
import { useApprovalPending, useOrgStore, useWalletStore } from "@/store";
import { useSetupActions } from "./home";

/** Sidebar footer pill above the OrgCard: "6 trial" while every credit is trial, "13 credits" once
 *  mixed or bought, amber "1 credit" when low and amber "Pending" while approval is open. */
export function BalancePill({ collapsed }: { collapsed: boolean }) {
  const billing = useOrgStore((s) => s.org?.billing);
  const ledger = useWalletStore((s) => s.ledger);
  const pending = useApprovalPending();
  const { billing: openBilling } = useSetupActions();
  if (billing !== "trial" && billing !== "payg") return null;

  const live = balanceGrants(ledger).filter((g) => g.remaining > 0);
  const balance = live.reduce((n, g) => n + g.remaining, 0);
  const allTrial = live.length > 0 && live.every((g) => g.source === "trial");
  const low = balance < costFor(FULL_REVIEW_TYPES);
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
