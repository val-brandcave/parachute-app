"use client";

import { CreditChip, Icon, Tooltip, type CreditChipTone } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { useOrgStore, useWalletView } from "@/store";
import { useSetupActions } from "./home";
import "./credits-chrome.css";

/** Sidebar footer pill above the OrgCard (spec §5.3). Always "N credits" (PC-6: no trial label or tone):
 *  navy tint when healthy, amber at or under LOW_BALANCE_AT, red at zero, neutral "On hold" while approval
 *  is open. Hidden for invoiced and YouConnect orgs; the header pill carries their "used" state. */
export function BalancePill({ collapsed }: { collapsed: boolean }) {
  const billing = useOrgStore((s) => s.org?.billing);
  const wallet = useWalletView();
  const { billing: openBilling } = useSetupActions();
  if (billing !== "trial" && billing !== "payg") return null;

  const { balance } = wallet;
  const noun = `credit${balance === 1 ? "" : "s"}`;

  let tone: CreditChipTone;
  let label: string;
  if (wallet.held) {
    tone = "held";
    label = "On hold";
  } else {
    tone = wallet.lowTone === "zero" ? "zero" : wallet.lowTone === "low" ? "low" : "credit";
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
