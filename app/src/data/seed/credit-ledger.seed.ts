import type { CreditLedgerEntry } from "@/types";
import { TRIAL_GRANT_CREDITS, CREDIT_USD, packById } from "@/lib/pricing";

const T0 = 1_785_000_000_000;
const DAY = 86_400_000;
const HOUR = 3_600_000;
/** 6 Nov 2026, 09:12 local: the demo's "account created" moment. Every HCB row sits on or before 7 Nov so nothing is dated after the demo's "today" (8 Nov). */
const NOV6 = new Date(2026, 10, 6, 9, 12).getTime();

const PACK10 = packById("pack10");

/**
 * Wallet movements per org. Balance is derived from these rows - never stored.
 *
 *  org-hcb    trial grant +6, four real reports (220 Commerce Way 2, 18 Lighthouse Rd 1,
 *             905 Bayview Ave 1, 41 Mill Pond Ln 1 then refunded), +1 earned (bank policy),
 *             a 10-credit pack → 13 credits: trial 1 / earned 1 / purchased 11.
 *             (The canvas shows 9 as 1 / 2 / 6; that split cannot happen under the
 *             trial > earned > purchased spend order, so the seed derives its own numbers.)
 *  org-cedar  pay-as-you-go: a 5-pack, two 2-credit reviews → 1 left (low-balance demo)
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
    createdAt: NOV6,
  },
  {
    id: "led-hcb-2",
    orgId: "org-hcb",
    kind: "debit",
    credits: -1,
    amountUsd: 0,
    loanNo: "HCB-26-0890",
    reviewTypes: ["technical"],
    paidFrom: ["trial"],
    receiptId: "RCT-40890",
    actorId: "user-dr",
    note: "41 Mill Pond Ln, Suffolk - Technical",
    createdAt: NOV6 + 2 * HOUR,
  },
  {
    id: "led-hcb-3",
    orgId: "org-hcb",
    kind: "refund",
    credits: 1,
    amountUsd: 0,
    loanNo: "HCB-26-0890",
    receiptId: "RCT-40891",
    actorId: "user-dr",
    note: "41 Mill Pond Ln, Suffolk - failed on our side, refunded",
    createdAt: NOV6 + 3 * HOUR,
  },
  {
    id: "led-hcb-4",
    orgId: "org-hcb",
    kind: "debit",
    credits: -2,
    amountUsd: 0,
    reviewId: "review-hcb-1",
    loanNo: "HCB-26-0918",
    reviewTypes: ["technical", "administrative"],
    paidFrom: ["trial"],
    receiptId: "RCT-40918",
    actorId: "user-dr",
    note: "220 Commerce Way, Norfolk - Technical + Administrative",
    createdAt: NOV6 + 5 * HOUR,
  },
  {
    id: "led-hcb-5",
    orgId: "org-hcb",
    kind: "debit",
    credits: -1,
    amountUsd: 0,
    reviewId: "review-hcb-2",
    loanNo: "HCB-26-0907",
    reviewTypes: ["technical"],
    paidFrom: ["trial"],
    receiptId: "RCT-40907",
    actorId: "user-dr",
    note: "18 Lighthouse Rd, Newport News - Technical",
    createdAt: NOV6 + 20 * HOUR,
  },
  {
    id: "led-hcb-6",
    orgId: "org-hcb",
    kind: "debit",
    credits: -1,
    amountUsd: 0,
    loanNo: "HCB-26-0899",
    reviewTypes: ["technical"],
    paidFrom: ["trial"],
    receiptId: "RCT-40899",
    actorId: "user-mo",
    note: "905 Bayview Ave, Hampton - Technical",
    createdAt: NOV6 + 26 * HOUR,
  },
  {
    id: "led-hcb-7",
    orgId: "org-hcb",
    kind: "earned",
    credits: 1,
    setupStepId: "bank_policy",
    actorId: "user-mo",
    note: "Setup reward",
    createdAt: NOV6 + 30 * HOUR,
  },
  {
    id: "led-hcb-8",
    orgId: "org-hcb",
    kind: "purchase",
    credits: PACK10.credits,
    amountUsd: PACK10.priceUsd,
    packId: "pack10",
    receiptId: "RCT-41010",
    actorId: "user-dr",
    note: `${PACK10.credits}-credit pack`,
    createdAt: NOV6 + 36 * HOUR,
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
    amountUsd: 2 * CREDIT_USD,
    loanNo: "LN-8812",
    reviewTypes: ["technical", "administrative"],
    paidFrom: ["purchased"],
    receiptId: "RCT-10022",
    actorId: "user-cr2",
    createdAt: T0 - 30 * DAY,
  },
  {
    id: "led-cedar-3",
    orgId: "org-cedar",
    kind: "debit",
    credits: -2,
    amountUsd: 2 * CREDIT_USD,
    loanNo: "LN-8840",
    reviewTypes: ["technical", "administrative"],
    paidFrom: ["purchased"],
    receiptId: "RCT-10023",
    actorId: "user-cr2",
    createdAt: T0 - 12 * DAY,
  },
];
