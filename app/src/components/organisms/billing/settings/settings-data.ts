import { AUTO_RELOAD_DEFAULTS } from "@/lib/pricing";
import type { WalletSettings } from "@/types";

/** Alert defaults used until an admin changes them. Expiry window is fixed at 14 days. */
export const ALERT_DEFAULTS = {
  low: true,
  lowBelow: 3,
  expiry: true,
  spend: false,
  spendUsd: AUTO_RELOAD_DEFAULTS.monthlyCap,
};
export const EXPIRY_ALERT_DAYS = 14;
export const LOW_BELOW_OPTIONS = [2, 3, 5, 10];

export function alertsOf(s: WalletSettings | null) {
  return {
    low: s?.alertLow ?? ALERT_DEFAULTS.low,
    lowBelow: s?.alertLowBelow ?? ALERT_DEFAULTS.lowBelow,
    expiry: s?.alertExpiry ?? ALERT_DEFAULTS.expiry,
    spend: s?.alertSpend ?? ALERT_DEFAULTS.spend,
    spendUsd: s?.alertSpendUsd ?? ALERT_DEFAULTS.spendUsd,
    emails: s?.alertEmails ?? "",
  };
}

/** Org addresses the prototype knows about; an admin's saved address wins. */
const ADDRESSES: Record<string, string> = {
  "org-hcb": "Harbor Community Bank\n500 Granby Street, Suite 1200\nNorfolk, VA 23510",
  "org-cedar": "Cedar Ridge Community Bank\n74 Mill Street\nCedar Ridge, VA 24101",
  "org-001": "Meridian Trust Bank, N.A.\n1 Meridian Plaza\nRichmond, VA 23219",
};
export function addressOf(s: WalletSettings | null, orgId?: string, orgName?: string): string {
  return s?.billingAddress ?? ADDRESSES[orgId ?? ""] ?? orgName ?? "";
}

/** "RCT-AB12" style ids and amounts, shared by receipts and statements. */
export const monthOf = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
