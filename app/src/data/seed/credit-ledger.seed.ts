import type { CreditLedgerEntry } from "@/types";
import { TRIAL_GRANT_CREDITS, CREDIT_USD } from "@/lib/pricing";

const T0 = 1_785_000_000_000;
const DAY = 86_400_000;

/**
 * Wallet movements per org. Balance is derived from these rows — never stored.
 *  org-hcb    trial: +6 grant, one 2-credit review → 4 left
 *  org-cedar  pay-as-you-go: a 5-pack, two 2-credit reviews → 1 left
 *  org-001    invoiced via YouConnect → no wallet rows
 *  org-lakeside  awaiting approval → nothing granted yet
 */
export const seedCreditLedger: CreditLedgerEntry[] = [
  {
    id: "led-hcb-1",
    orgId: "org-hcb",
    kind: "trial_grant",
    credits: TRIAL_GRANT_CREDITS,
    actorId: "user-dr",
    note: "Welcome trial credits",
    createdAt: T0,
  },
  {
    id: "led-hcb-2",
    orgId: "org-hcb",
    kind: "debit",
    credits: -2,
    loanNo: "LN-20418",
    reviewTypes: ["technical", "administrative"],
    actorId: "user-dr",
    note: "Harborview Plaza — Technical + Administrative",
    createdAt: T0 + 2 * DAY,
  },
  {
    id: "led-cedar-1",
    orgId: "org-cedar",
    kind: "purchase",
    credits: 5,
    amountUsd: 5 * CREDIT_USD,
    packId: "pack5",
    receiptId: "RCT-10021",
    actorId: "user-cr1",
    note: "5-credit pack",
    createdAt: T0 - 40 * DAY,
  },
  {
    id: "led-cedar-2",
    orgId: "org-cedar",
    kind: "debit",
    credits: -2,
    loanNo: "LN-8812",
    reviewTypes: ["technical", "administrative"],
    actorId: "user-cr2",
    createdAt: T0 - 30 * DAY,
  },
  {
    id: "led-cedar-3",
    orgId: "org-cedar",
    kind: "debit",
    credits: -2,
    loanNo: "LN-8840",
    reviewTypes: ["technical", "administrative"],
    actorId: "user-cr2",
    createdAt: T0 - 12 * DAY,
  },
];
