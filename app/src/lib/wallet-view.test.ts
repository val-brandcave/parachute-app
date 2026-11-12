import { describe, expect, it } from "vitest";
import * as pricing from "@/lib/pricing";
import { LOW_BALANCE_AT } from "@/lib/pricing";
import { balanceGrants } from "@/lib/wallet-breakdown";
import { remainingFromLedger, sourcesFor } from "@/store/wallet.store";
import type { CreditLedgerEntry, LedgerKind, WalletSettings } from "@/types";
import { autoReloadDue, invoicedSpendEntries, monthOf, spendOrderSentence, usageByPerson, usageByType, usedBy, walletView } from "./wallet-view";

const DAY = 86_400_000;
const NOW = new Date(2026, 10, 12, 12, 0).getTime();

let seq = 0;
function row(kind: LedgerKind, credits: number, at: number, extra: Partial<CreditLedgerEntry> = {}): CreditLedgerEntry {
  seq += 1;
  return { id: `e${seq}`, orgId: "org-t", actorId: "user-a", kind, credits, createdAt: at, ...extra };
}

const settings = (patch: Partial<WalletSettings> = {}): WalletSettings => ({
  id: "org-t",
  orgId: "org-t",
  createdAt: 0,
  autoReload: true,
  reloadPackId: "pack10",
  reloadBelow: 2,
  monthlyCap: 3000,
  paymentMethod: "card",
  ...patch,
});

describe("walletView", () => {
  it("fresh 6 trial → balance 6, fullReviews 3, lowTone ok", () => {
    const v = walletView([row("trial_grant", 6, NOW - 3_600_000)], { now: NOW });
    expect(v.balance).toBe(6);
    expect(v.fullReviews).toBe(3);
    expect(v.lowTone).toBe("ok");
    expect(v.bySource).toEqual({ trial: 6, earned: 0, purchased: 0 });
    expect(v.held).toBe(false);
    expect(v.runwayDays).toBeNull();
  });

  it("PC-16: purchased oldest pack first, then earned, then trial", () => {
    const trial = row("trial_grant", 6, NOW - 10 * DAY);
    const pack5 = row("purchase", 5, NOW - 8 * DAY, { packId: "pack5" });
    const pack10 = row("purchase", 10, NOW - 6 * DAY, { packId: "pack10" });
    const earned = row("earned", 2, NOW - 5 * DAY);
    const debit = row("debit", -7, NOW - 1 * DAY);
    const grants = balanceGrants([debit, earned, pack10, trial, pack5]);
    const left = Object.fromEntries(grants.map((g) => [g.id, g.remaining]));
    expect(left[pack5.id]).toBe(0);
    expect(left[pack10.id]).toBe(8);
    expect(left[earned.id]).toBe(2);
    expect(left[trial.id]).toBe(6);
    // useOrder follows the same order among grants with credits left.
    const order = grants.filter((g) => g.useOrder !== null).sort((a, b) => a.useOrder! - b.useOrder!);
    expect(order.map((g) => g.id)).toEqual([pack10.id, earned.id, trial.id]);
  });

  it("a debit only spends credits that existed when it happened", () => {
    const trial = row("trial_grant", 6, NOW - 10 * DAY);
    const debit = row("debit", -2, NOW - 9 * DAY);
    const pack5 = row("purchase", 5, NOW - 8 * DAY, { packId: "pack5" });
    const v = walletView([trial, debit, pack5], { now: NOW });
    expect(v.bySource).toEqual({ trial: 4, earned: 0, purchased: 5 });
  });

  it("sourcesFor follows PC-16", () => {
    expect(sourcesFor({ trial: 6, earned: 2, purchased: 8 }, 2)).toEqual(["purchased"]);
    expect(sourcesFor({ trial: 6, earned: 2, purchased: 1 }, 2)).toEqual(["purchased", "earned"]);
    expect(sourcesFor({ trial: 6, earned: 1, purchased: 1 }, 3)).toEqual(["purchased", "earned", "trial"]);
    expect(sourcesFor({ trial: 6, earned: 0, purchased: 0 }, 2)).toEqual(["trial"]);
  });

  it("balance equals sum of grant remainders equals remainingBySource total", () => {
    const ledgers: CreditLedgerEntry[][] = [
      [row("trial_grant", 6, NOW - 2 * DAY)],
      [row("trial_grant", 6, NOW - 9 * DAY), row("debit", -2, NOW - 3 * DAY)],
      [
        row("trial_grant", 6, NOW - 40 * DAY),
        row("debit", -2, NOW - 39 * DAY),
        row("earned", 1, NOW - 38 * DAY),
        row("debit", -2, NOW - 30 * DAY),
        row("purchase", 10, NOW - 20 * DAY),
        row("refund", 1, NOW - 19 * DAY),
        row("debit", -1, NOW - 2 * DAY),
      ],
      [
        row("trial_grant", 6, NOW - 60 * DAY),
        row("purchase", 20, NOW - 20 * DAY),
        row("debit", -2, NOW - 18 * DAY),
        row("rescan", -1, NOW - 17 * DAY),
        row("adjustment", -3, NOW - 10 * DAY),
        row("debit", -2, NOW - 5 * DAY),
      ],
      [row("trial_grant", 6, NOW - 9 * DAY), row("debit", -2, NOW - 8 * DAY), row("debit", -2, NOW - 7 * DAY), row("debit", -2, NOW - 6 * DAY)],
    ];
    for (const l of ledgers) {
      const v = walletView(l, { now: NOW });
      const grantsSum = balanceGrants(l).reduce((s, g) => s + g.remaining, 0);
      const r = remainingFromLedger(l);
      const ledgerSum = l.reduce((s, e) => s + e.credits, 0);
      expect(v.balance).toBe(grantsSum);
      expect(v.balance).toBe(r.trial + r.earned + r.purchased);
      expect(v.balance).toBe(v.bySource.trial + v.bySource.earned + v.bySource.purchased);
      expect(v.balance).toBe(ledgerSum);
    }
  });

  it("lowTone 4 ok · 3 low · 1 low · 0 zero", () => {
    expect(LOW_BALANCE_AT).toBe(3);
    const tone = (n: number) =>
      walletView(n > 0 ? [row("purchase", n, NOW - DAY)] : [], { now: NOW }).lowTone;
    expect(tone(4)).toBe("ok");
    expect(tone(3)).toBe("low");
    expect(tone(1)).toBe("low");
    expect(tone(0)).toBe("zero");
  });

  it("held while approval is pending", () => {
    expect(walletView([], { now: NOW, approval: "pending" }).held).toBe(true);
    expect(walletView([], { now: NOW, approval: "approved" }).held).toBe(false);
  });

  it("earned grants never expire", () => {
    const grants = balanceGrants([row("earned", 2, NOW - 400 * DAY), row("trial_grant", 6, NOW - 400 * DAY)]);
    expect(grants.every((g) => g.expiresAt === null)).toBe(true);
    const bought = balanceGrants([row("purchase", 5, NOW - DAY)]);
    expect(bought[0].expiresAt).not.toBeNull();
    expect("EARNED_LIFE_DAYS" in pricing).toBe(false);
  });

  it("runway from the last 30 days' pace", () => {
    const l = [row("purchase", 20, NOW - 40 * DAY), row("debit", -6, NOW - 10 * DAY)];
    const v = walletView(l, { now: NOW });
    expect(v.balance).toBe(14);
    expect(v.runwayDays).toBeCloseTo(70);
    expect(v.runsOutOn).toBe(NOW + Math.ceil(70) * DAY);
  });
});

describe("usage", () => {
  const from = NOW - 30 * DAY;
  const to = NOW;

  it("usageByType nets refunds; period is [from, to)", () => {
    const l = [
      row("debit", -2, from, { reviewId: "r1", reviewTypes: ["technical", "administrative"], actorId: "u1" }),
      row("debit", -1, from + DAY, { reviewId: "r2", reviewTypes: ["technical"], actorId: "u2" }),
      row("refund", 1, from + 2 * DAY, { reviewId: "r2", actorId: "admin" }),
      row("debit", -1, from + 3 * DAY, { reviewId: "r3", reviewTypes: ["administrative"], actorId: "u2" }),
      row("debit", -2, to, { reviewId: "r4", reviewTypes: ["technical", "administrative"], actorId: "u1" }),
      row("debit", -2, from - 1, { reviewId: "r0", reviewTypes: ["technical", "administrative"], actorId: "u1" }),
    ];
    expect(usageByType(l, { from, to })).toEqual({ technical: 1, administrative: 2, total: 3 });
  });

  it("usageByPerson sorts desc", () => {
    const l = [
      row("debit", -1, from + DAY, { reviewId: "r1", reviewTypes: ["technical"], actorId: "u1" }),
      row("debit", -2, from + DAY, { reviewId: "r2", reviewTypes: ["technical", "administrative"], actorId: "u2" }),
      row("debit", -2, from + 2 * DAY, { reviewId: "r3", reviewTypes: ["technical", "administrative"], actorId: "u3" }),
      row("debit", -1, from + 2 * DAY, { reviewId: "r4", reviewTypes: ["administrative"], actorId: "u2" }),
      row("refund", 2, from + 3 * DAY, { reviewId: "r3", actorId: "admin" }),
    ];
    expect(usageByPerson(l, { from, to })).toEqual([
      { userId: "u2", credits: 3 },
      { userId: "u1", credits: 1 },
    ]);
  });

  it("usedThisMonth counts the calendar month of now", () => {
    const monthStart = new Date(2026, 10, 1).getTime();
    const l = [
      row("purchase", 20, monthStart - 10 * DAY),
      row("debit", -2, monthStart - DAY, { reviewTypes: ["technical", "administrative"] }),
      row("debit", -2, monthStart + DAY, { reviewTypes: ["technical", "administrative"] }),
      row("debit", -1, monthStart + 2 * DAY, { reviewTypes: ["technical"] }),
    ];
    expect(walletView(l, { now: NOW }).usedThisMonth).toBe(3);
  });
});

describe("autoReloadDue", () => {
  it("autoReloadDue respects threshold and monthly cap", () => {
    const base = [row("purchase", 3, NOW - 5 * DAY)];
    // Below threshold after a debit → due.
    expect(autoReloadDue([...base, row("debit", -2, NOW - DAY)], settings(), NOW)).toBe(true);
    // At the threshold → not due (strictly below).
    expect(autoReloadDue([...base, row("debit", -1, NOW - DAY)], settings(), NOW)).toBe(false);
    // Switched off → never.
    expect(autoReloadDue([...base, row("debit", -2, NOW - DAY)], settings({ autoReload: false }), NOW)).toBe(false);
    // Last movement is not a debit → not due.
    expect(autoReloadDue([row("debit", -2, NOW - 6 * DAY), row("purchase", 1, NOW - DAY)], settings(), NOW)).toBe(false);
    // Two auto packs ($2,800) this month; a third ($1,400) would pass the $3,000 cap.
    const capped = [
      row("purchase", 10, NOW - 3 * DAY, { auto: true, amountUsd: 1400 }),
      row("purchase", 10, NOW - 2 * DAY, { auto: true, amountUsd: 1400 }),
      row("debit", -19, NOW - DAY),
    ];
    expect(autoReloadDue(capped, settings(), NOW)).toBe(false);
    // A higher cap allows it.
    expect(autoReloadDue(capped, settings({ monthlyCap: 5000 }), NOW)).toBe(true);
    // Last month's auto packs don't count against this month.
    const lastMonth = new Date(2026, 9, 20).getTime();
    const old = [
      row("purchase", 10, lastMonth, { auto: true, amountUsd: 1400 }),
      row("purchase", 10, lastMonth + DAY, { auto: true, amountUsd: 1400 }),
      row("debit", -19, NOW - DAY),
    ];
    expect(autoReloadDue(old, settings(), NOW)).toBe(true);
  });
});

describe("spendOrderSentence", () => {
  it("states the PC-16 order", () => {
    expect(spendOrderSentence()).toBe(
      "Credits that expire soonest are used first: purchased packs (oldest first), then earned, then trial.",
    );
  });
});

describe("invoicedSpendEntries", () => {
  const rev = (id: string, orderedAt: number, types: ("technical" | "administrative")[], sample = false) =>
    ({ id, orgId: "org-001", orderedAt, reviewTypes: types, assigneeId: "u1", loanNo: id, propertyAddress: id, sample }) as unknown as import("@/types").Review;
  it("one debit per non-sample review, re-based so the newest lands on the anchor", () => {
    const anchor = 1_800_000_000_000;
    const rows = invoicedSpendEntries(
      [rev("a", 1000, ["technical", "administrative"]), rev("b", 400, ["technical"]), rev("s", 2000, ["technical"], true)],
      anchor,
    );
    expect(rows.map((r) => [r.reviewId, r.credits, r.createdAt])).toEqual([
      ["a", -2, anchor],
      ["b", -1, anchor - 600],
    ]);
    expect(walletView(rows, { now: anchor, billing: "invoiced" }).usedThisMonth).toBe(3);
  });
  it("usedBy reads the same entries per person: a reviewer with no runs used 0, the org total is unchanged (RF3)", () => {
    const anchor = NOW;
    const rows = invoicedSpendEntries(
      [rev("a", 1000, ["technical", "administrative"]), rev("b", 400, ["technical"])].map((r, i) =>
        i === 1 ? ({ ...r, assigneeId: "u2" } as typeof r) : r,
      ),
      anchor,
    );
    const month = monthOf(anchor);
    expect(usedBy(rows, "u1", month)).toBe(2);
    expect(usedBy(rows, "u2", month)).toBe(1);
    expect(usedBy(rows, "u3", month)).toBe(0);
    expect(walletView(rows, { now: anchor, billing: "invoiced" }).usedThisMonth).toBe(3);
  });
});
