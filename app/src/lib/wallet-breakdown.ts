import { EARNED_LIFE_DAYS, PURCHASED_LIFE_MONTHS } from "@/lib/pricing";
import type { CreditLedgerEntry, CreditSource } from "@/types";

/**
 * "What's in your balance": one row per credit grant (trial grant, each earned
 * reward, each pack / refund / adjustment), with what is left of it after spend
 * order, the order it will be used in, and when it expires.
 *
 * Spend order matches `remainingFromLedger` in wallet.store: trial → earned →
 * purchased, oldest grant first inside each bucket. Totals per bucket therefore
 * equal `remainingBySource()`.
 *
 * Expiry (lib/pricing.ts): trial credits do not expire (decision D2a), earned
 * credits last EARNED_LIFE_DAYS, purchased credits PURCHASED_LIFE_MONTHS.
 * Refunds and adjustments sit in the purchased bucket and do not expire.
 */
export interface BalanceGrant {
  id: string;
  source: CreditSource;
  /** The ledger row that granted these credits. */
  entry: CreditLedgerEntry;
  granted: number;
  remaining: number;
  /** 1-based position in spend order among grants with credits left; null once used up. */
  useOrder: number | null;
  /** Epoch ms, or null when the credits never expire. */
  expiresAt: number | null;
}

const DAY = 86_400_000;

function bucketOf(e: CreditLedgerEntry): CreditSource | null {
  if (e.credits <= 0) return null;
  if (e.kind === "trial_grant") return "trial";
  if (e.kind === "earned") return "earned";
  if (e.kind === "purchase" || e.kind === "refund" || e.kind === "adjustment") return "purchased";
  return null;
}

function expiryOf(e: CreditLedgerEntry, source: CreditSource): number | null {
  if (source === "trial") return null;
  if (source === "earned") return e.createdAt + EARNED_LIFE_DAYS * DAY;
  if (e.kind !== "purchase") return null;
  const d = new Date(e.createdAt);
  d.setMonth(d.getMonth() + PURCHASED_LIFE_MONTHS);
  return d.getTime();
}

export function balanceGrants(ledger: readonly CreditLedgerEntry[]): BalanceGrant[] {
  const order: CreditSource[] = ["trial", "earned", "purchased"];
  const sorted = [...ledger].sort((a, b) => a.createdAt - b.createdAt);
  // Negative adjustments are treated as spend, like debits.
  let used = sorted
    .filter((e) => e.credits < 0)
    .reduce((s, e) => s + -e.credits, 0);

  const grants: BalanceGrant[] = [];
  for (const source of order) {
    for (const e of sorted) {
      if (bucketOf(e) !== source) continue;
      const take = Math.min(e.credits, used);
      used -= take;
      grants.push({
        id: e.id,
        source,
        entry: e,
        granted: e.credits,
        remaining: e.credits - take,
        useOrder: null,
        expiresAt: expiryOf(e, source),
      });
    }
  }
  let n = 0;
  for (const g of grants) if (g.remaining > 0) g.useOrder = ++n;
  return grants;
}

/** The grant with credits left that expires soonest, or null when nothing left expires. */
export function nextExpiring(grants: readonly BalanceGrant[]): BalanceGrant | null {
  return (
    grants
      .filter((g) => g.remaining > 0 && g.expiresAt !== null)
      .sort((a, b) => (a.expiresAt ?? 0) - (b.expiresAt ?? 0))[0] ?? null
  );
}
