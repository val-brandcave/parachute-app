import type { CreditLedgerEntry } from "@/types";
import { TRIAL_GRANT_CREDITS, CREDIT_USD, packById } from "@/lib/pricing";

const DAY = 86_400_000;
const HOUR = 3_600_000;
/** 6 Nov 2026, 09:12 local. Harbor's setup reward and pack land here; every HCB row sits on or before 7 Nov. */
const NOV6 = new Date(2026, 10, 6, 9, 12).getTime();
/** 24 Oct 2026, 09:12 local: Harbor's workspace is two weeks old, so its usage chart has a real trial history. */
const OCT24 = new Date(2026, 9, 24, 9, 12).getTime();

const PACK10 = packById("pack10");

/**
 * Wallet movements per org. Balance is derived from these rows - never stored.
 *
 *  org-hcb    trial grant +6, four real reports (220 Commerce Way 2, 18 Lighthouse Rd 1,
 *             905 Bayview Ave 1, 41 Mill Pond Ln 1 then refunded), +1 earned (bank policy),
 *             a 10-credit pack → 13 credits: trial 1 / earned 1 / purchased 11.
 *             (The canvas shows 9 as 1 / 2 / 6; that split cannot happen under the
 *             trial > earned > purchased spend order, so the seed derives its own numbers.)
 *  org-cedar  pay-as-you-go: about 12 months of history (generated at the bottom of this file),
 *             2 to 4 reviews every weekday by four people, packs bought as needed, 1 credit left
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
    createdAt: OCT24,
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
    createdAt: OCT24 + 3 * DAY + HOUR,
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
    createdAt: OCT24 + 3 * DAY + 2 * HOUR,
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
    createdAt: OCT24 + 6 * DAY + 5 * HOUR,
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
    createdAt: OCT24 + 10 * DAY + 2 * HOUR,
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
    createdAt: OCT24 + 12 * DAY + 7 * HOUR,
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
];

/* ------------------------------------------------------------------------------------------
 * Cedar Ridge: a year of pay-as-you-go history, generated with a seeded PRNG so every load is identical.
 * Weekdays only, 2 to 4 reviews a day (busier toward the end), four people. Packs are bought when the
 * balance would go short; the total bought is chosen so the final balance is exactly 1 credit.
 * ------------------------------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STREETS = [
  "Oak Hollow Rd", "Maple Ave", "Ridge Line Dr", "Cedar Creek Ln", "Mill Street", "Old Quarry Rd", "Harvest Way", "Elm Park Blvd",
  "Lakeview Ct", "Fairgrounds Rd", "Depot St", "Birch Run", "Station Rd", "Orchard Ln", "Quail Hill Rd", "Main St",
];
const TOWNS = ["Ridgefield", "Marlow", "Fairview", "Cold Spring", "Eastbrook", "Pine Bluff", "Hartwell", "Dunmore", "Alder Grove", "Westfield"];
/** Share of Cedar's reviews run by each person: Henry, Naomi, Eli, Carla. */
const CEDAR_PEOPLE: [string, number][] = [
  ["user-cr2", 0.36],
  ["user-cr3", 0.3],
  ["user-cr4", 0.24],
  ["user-cr1", 0.1],
];
/** Days with no reviews (holidays), as "month-day". */
const CEDAR_OFF = new Set(["11-27", "11-28", "12-24", "12-25", "12-26", "12-31", "1-1", "1-19", "2-16", "5-25", "6-19", "7-3", "9-7"]);

type CedarTypes = ("technical" | "administrative")[];
interface CedarDebit {
  at: number;
  by: string;
  types: CedarTypes;
  addr: string;
  loanNo: string;
}
const typesNote = (t: CedarTypes) => (t.length === 2 ? "Technical + Administrative" : t[0] === "technical" ? "Technical" : "Administrative");

function cedarDebits(): CedarDebit[] {
  const rnd = mulberry32(20261106);
  const start = new Date(2025, 10, 10, 0, 0).getTime();
  const last = new Date(2026, 10, 6, 10, 30).getTime();
  const span = new Date(2026, 10, 5).getTime() - start;
  const out: CedarDebit[] = [];
  let loan = 5120;
  for (let d = new Date(start); d.getTime() <= last; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6 || CEDAR_OFF.has(`${d.getMonth() + 1}-${d.getDate()}`)) continue;
    const ramp = Math.min(1, Math.max(0, (d.getTime() - start) / span));
    const n = 2 + (rnd() < 0.3 + ramp * 0.3 ? 1 : 0) + (rnd() < 0.1 + ramp * 0.25 ? 1 : 0);
    const mins = Array.from({ length: n }, () => 8 * 60 + Math.floor(rnd() * 9 * 60)).sort((a, b) => a - b);
    for (const m of mins) {
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, m).getTime();
      const pr = rnd();
      let acc = 0;
      let by = CEDAR_PEOPLE[0][0];
      for (const [id, w] of CEDAR_PEOPLE) {
        acc += w;
        if (pr <= acc) {
          by = id;
          break;
        }
      }
      const tr = rnd();
      const types: CedarTypes = tr < 0.58 ? ["technical", "administrative"] : tr < 0.92 ? ["technical"] : ["administrative"];
      const num = 100 + Math.floor(rnd() * 880);
      const addr = `${num} ${STREETS[Math.floor(rnd() * STREETS.length)]}, ${TOWNS[Math.floor(rnd() * TOWNS.length)]}`;
      if (at > last) continue;
      out.push({ at, by, types, addr, loanNo: `LN-${loan++}` });
    }
  }
  // Total bought is a multiple of 5 and leaves exactly 1 credit: shave a few late two-type reviews down to one type.
  let total = out.reduce((s, x) => s + x.types.length, 0);
  for (let i = out.length - 1; i >= 0 && (total + 1) % 5 !== 0; i--) {
    if (out[i].types.length === 2) {
      out[i].types = [out[i].types[0]];
      total -= 1;
    }
  }
  return out;
}

const PACKS_BY_SIZE: Record<number, ReturnType<typeof packById>> = { 5: packById("pack5"), 10: packById("pack10"), 20: packById("pack20") };

function cedarLedger(): CreditLedgerEntry[] {
  const rnd = mulberry32(77031);
  const debits = cedarDebits();
  const target = debits.reduce((s, x) => s + x.types.length, 0) + 1;
  const rows: CreditLedgerEntry[] = [];
  let bought = 0;
  let balance = 0;
  let nPack = 0;
  let nDebit = 0;
  let packReceipt = 20000;
  let debitReceipt = 10000;
  for (const d of debits) {
    const need = d.types.length;
    while (balance < need) {
      const rem = target - bought;
      const sizes = [10, 20, 20, 10, 5].filter((s) => s <= rem);
      // When what is left fits in one pack, buy exactly that, so the balance lands on 1.
      const size = [5, 10, 20].includes(rem) ? rem : sizes[Math.floor(rnd() * sizes.length)];
      const pack = PACKS_BY_SIZE[size];
      rows.push({
        id: `led-cedar-p${++nPack}`,
        orgId: "org-cedar",
        kind: "purchase",
        credits: pack.credits,
        amountUsd: pack.priceUsd,
        packId: pack.id,
        receiptId: `RCT-${++packReceipt}`,
        actorId: "user-cr1",
        note: `${pack.credits}-credit pack`,
        createdAt: d.at - 20 * 60_000,
      });
      bought += pack.credits;
      balance += pack.credits;
    }
    rows.push({
      id: `led-cedar-d${++nDebit}`,
      orgId: "org-cedar",
      kind: "debit",
      credits: -need,
      amountUsd: need * CREDIT_USD,
      loanNo: d.loanNo,
      reviewTypes: d.types,
      paidFrom: ["purchased"],
      receiptId: `RCT-${++debitReceipt}`,
      actorId: d.by,
      note: `${d.addr} - ${typesNote(d.types)}`,
      createdAt: d.at,
    });
    balance -= need;
  }
  return rows;
}

seedCreditLedger.push(...cedarLedger());
