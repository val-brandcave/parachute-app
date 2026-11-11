/**
 * THE wallet derivation (spec §6 P0). Every balance, meter, runway and low-tone
 * reader goes through `walletView()` / `useWalletView()`; nothing else sums the
 * ledger. Built on `balanceGrants()` (lib/wallet-breakdown.ts), with the PC-16
 * spend order: purchased packs (oldest first), then earned, then trial.
 */
import { AUTO_RELOAD_DEFAULTS, LOW_BALANCE_AT, REVIEW_TYPE_COST, costFor, packById } from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { balanceGrants, type BalanceGrant } from "@/lib/wallet-breakdown";
import type { ApprovalState, BillingModel, CreditLedgerEntry, Review, ReviewType, WalletSettings } from "@/types";

const DAY = 86_400_000;
const FULL_REVIEW_COST = costFor(FULL_REVIEW_TYPES);
/** Runway reads the pace of the last this-many days. */
const PACE_DAYS = 30;

export interface WalletView {
  balance: number;
  bySource: { trial: number; earned: number; purchased: number };
  /** Full reviews (every review type) the balance pays for. */
  fullReviews: number;
  /** Credits spent in the current calendar month (net of refunds). */
  usedThisMonth: number;
  runwayDays: number | null;
  runsOutOn: number | null;
  /** Credits a week at the last-30-day pace (0 when nothing was used). */
  pacePerWeek: number;
  /** When the last debit (a review start) happened, or null. */
  lastDebitAt: number | null;
  /** ok above LOW_BALANCE_AT, low at or under it, zero at 0. */
  lowTone: "ok" | "low" | "zero";
  /** Enterprise org waiting for approval: credits are held. */
  held: boolean;
  grants: BalanceGrant[];
}

export interface UsagePeriod {
  from: number;
  to: number;
}

/** Calendar month of `now` (local time), as [from, to). */
function monthOf(now: number): UsagePeriod {
  const d = new Date(now);
  return {
    from: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
    to: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(),
  };
}

const isSpend = (e: CreditLedgerEntry) => e.kind === "debit" || e.kind === "rescan";

/** The debit a refund gives back (same review, else same loan), so it nets out against the right type and person. */
function refundedDebit(ledger: readonly CreditLedgerEntry[], r: CreditLedgerEntry): CreditLedgerEntry | undefined {
  const match = (e: CreditLedgerEntry) =>
    e.kind === "debit" &&
    e.createdAt <= r.createdAt &&
    ((r.reviewId !== undefined && e.reviewId === r.reviewId) || (r.loanNo !== undefined && e.loanNo === r.loanNo));
  return [...ledger].reverse().find(match);
}

/** Split `credits` across review types by their cost; leftovers go to the last type. */
function splitByType(credits: number, types: readonly ReviewType[] | undefined): Partial<Record<ReviewType, number>> {
  const t = Array.from(new Set(types ?? []));
  if (t.length === 0) return {};
  if (t.length === 1) return { [t[0]]: credits };
  const sum = costFor(t);
  const out: Partial<Record<ReviewType, number>> = {};
  let left = credits;
  t.forEach((type, i) => {
    const share = i === t.length - 1 ? left : Math.round((credits * REVIEW_TYPE_COST[type]) / sum);
    out[type] = share;
    left -= share;
  });
  return out;
}

/** Net credits used per row in the period: spend positive, refunds negative. */
function usageRows(ledger: readonly CreditLedgerEntry[], period: UsagePeriod) {
  const rows: { credits: number; types?: ReviewType[]; userId: string }[] = [];
  for (const e of ledger) {
    if (e.createdAt < period.from || e.createdAt >= period.to) continue;
    if (isSpend(e)) rows.push({ credits: -e.credits, types: e.reviewTypes, userId: e.actorId });
    else if (e.kind === "refund" && e.credits > 0) {
      const d = refundedDebit(ledger, e);
      rows.push({ credits: -e.credits, types: e.reviewTypes ?? d?.reviewTypes, userId: d?.actorId ?? e.actorId });
    }
  }
  return rows;
}

export function walletView(
  ledger: readonly CreditLedgerEntry[],
  opts: { now: number; approval?: ApprovalState; billing?: BillingModel },
): WalletView {
  const { now } = opts;
  const grants = balanceGrants(ledger);
  const bySource = { trial: 0, earned: 0, purchased: 0 };
  for (const g of grants) bySource[g.source] += g.remaining;
  const balance = bySource.trial + bySource.earned + bySource.purchased;

  const pace = usageByType(ledger, { from: now - PACE_DAYS * DAY, to: now }).total / PACE_DAYS;
  const runwayDays = pace > 0 ? balance / pace : null;
  const runsOutOn = runwayDays === null ? null : now + Math.ceil(runwayDays) * DAY;

  // Invoiced orgs are billed outside the wallet, so they never read low.
  const lowTone: WalletView["lowTone"] =
    opts.billing === "invoiced" ? "ok" : balance <= 0 ? "zero" : balance <= LOW_BALANCE_AT ? "low" : "ok";

  return {
    balance,
    bySource,
    fullReviews: Math.floor(balance / FULL_REVIEW_COST),
    usedThisMonth: usageByType(ledger, monthOf(now)).total,
    runwayDays,
    runsOutOn,
    pacePerWeek: pace * 7,
    lastDebitAt: ledger.reduce<number | null>(
      (m, e) => (e.kind === "debit" || e.kind === "rescan" ? Math.max(m ?? 0, e.createdAt) : m),
      null,
    ),
    lowTone,
    held: opts.approval === "pending",
    grants,
  };
}

/** Credits used per review type in [from, to). Refunds net out. */
export function usageByType(
  ledger: readonly CreditLedgerEntry[],
  period: UsagePeriod,
): { technical: number; administrative: number; total: number } {
  const out = { technical: 0, administrative: 0, total: 0 };
  for (const r of usageRows(ledger, period)) {
    out.total += r.credits;
    const split = splitByType(r.credits, r.types);
    out.technical += split.technical ?? 0;
    out.administrative += split.administrative ?? 0;
  }
  return out;
}

/** Credits used per person in [from, to), highest first. Refunds net out. */
export function usageByPerson(
  ledger: readonly CreditLedgerEntry[],
  period: UsagePeriod,
): { userId: string; credits: number }[] {
  const by = new Map<string, number>();
  for (const r of usageRows(ledger, period)) by.set(r.userId, (by.get(r.userId) ?? 0) + r.credits);
  return [...by]
    .filter(([, credits]) => credits !== 0)
    .map(([userId, credits]) => ({ userId, credits }))
    .sort((a, b) => b.credits - a.credits || a.userId.localeCompare(b.userId));
}

/** True when auto-reload should buy now: below `reloadBelow` after a debit, within `monthlyCap`. */
export function autoReloadDue(
  ledger: readonly CreditLedgerEntry[],
  settings: WalletSettings,
  now: number,
): boolean {
  if (!settings.autoReload) return false;
  const last = [...ledger].sort((a, b) => a.createdAt - b.createdAt).at(-1);
  if (!last || !isSpend(last)) return false;
  if (walletView(ledger, { now }).balance >= settings.reloadBelow) return false;
  const month = monthOf(now);
  const autoSpent = ledger
    .filter((e) => e.kind === "purchase" && e.auto && e.createdAt >= month.from && e.createdAt < month.to)
    .reduce((s, e) => s + (e.amountUsd ?? 0), 0);
  const cap = settings.monthlyCap ?? AUTO_RELOAD_DEFAULTS.monthlyCap;
  return autoSpent + packById(settings.reloadPackId).priceUsd <= cap;
}

/** The one sentence that states the spend order (PC-16). */
export function spendOrderSentence(): string {
  return "Credits that expire soonest are used first: purchased packs (oldest first), then earned, then trial.";
}

/**
 * Invoiced orgs have no wallet ledger: their usage is their reviews. This turns every
 * non-sample review into a synthetic debit (one per review, its types' cost), re-based so
 * the newest review lands on `anchor` (seeded reviews sit months back). Feed the result to
 * `walletView` / `usageByType` / `usageByPerson` so the header pill, popover and Billing
 * read ONE derivation for invoiced orgs too (RF3). Pure.
 */
export function invoicedSpendEntries(reviews: readonly Review[], anchor: number): CreditLedgerEntry[] {
  const list = reviews.filter((r) => !r.sample);
  if (list.length === 0) return [];
  const newest = Math.max(...list.map((r) => r.orderedAt));
  return list.map((r) => ({
    id: `inv-${r.id}`,
    orgId: r.orgId ?? "",
    kind: "debit" as const,
    credits: -costFor(r.reviewTypes),
    reviewId: r.id,
    loanNo: r.loanNo,
    reviewTypes: [...r.reviewTypes],
    actorId: r.assigneeId,
    note: r.propertyAddress,
    createdAt: anchor - (newest - r.orderedAt),
  }));
}
