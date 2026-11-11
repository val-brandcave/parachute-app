import { PURCHASED_LIFE_MONTHS } from "@/lib/pricing";
import type { CreditLedgerEntry, CreditSource } from "@/types";

/**
 * "What's in your balance": one row per credit grant (trial grant, each earned
 * reward, each pack / refund / adjustment), with what is left of it after spend
 * order, the order it will be used in, and when it expires.
 *
 * Spend order is PC-16, soonest-expiring first: purchased (oldest pack first),
 * then earned (oldest first), then trial. Spend is applied in time order: each
 * debit draws only on credits that existed when it happened, which is what the
 * debit's recorded `paidFrom` says. `lib/wallet-view.ts` and `remainingFromLedger`
 * (wallet.store) both read this, so every total agrees.
 *
 * Expiry (lib/pricing.ts): trial and earned credits never expire (D2a, PC-17),
 * purchased credits last PURCHASED_LIFE_MONTHS. Refunds and adjustments sit in
 * the purchased bucket and do not expire.
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

/** PC-16: the bucket order a charge draws from. */
export const SPEND_ORDER: readonly CreditSource[] = ["purchased", "earned", "trial"];

function bucketOf(e: CreditLedgerEntry): CreditSource | null {
  if (e.credits <= 0) return null;
  if (e.kind === "trial_grant") return "trial";
  if (e.kind === "earned") return "earned";
  if (e.kind === "purchase" || e.kind === "refund" || e.kind === "adjustment") return "purchased";
  return null;
}

function expiryOf(e: CreditLedgerEntry, source: CreditSource): number | null {
  if (source !== "purchased" || e.kind !== "purchase") return null;
  const d = new Date(e.createdAt);
  d.setMonth(d.getMonth() + PURCHASED_LIFE_MONTHS);
  return d.getTime();
}

/** Grants with credits left, in the order they will be spent (PC-16; oldest first inside a bucket). */
function bySpendOrder<T extends { source: CreditSource; entry: CreditLedgerEntry }>(grants: readonly T[]): T[] {
  return [...grants].sort(
    (a, b) => SPEND_ORDER.indexOf(a.source) - SPEND_ORDER.indexOf(b.source) || a.entry.createdAt - b.entry.createdAt,
  );
}

export function balanceGrants(ledger: readonly CreditLedgerEntry[]): BalanceGrant[] {
  // Stable sort: rows with the same timestamp keep their ledger order.
  const sorted = [...ledger].sort((a, b) => a.createdAt - b.createdAt);
  const grants: BalanceGrant[] = [];
  // Spend that found nothing to draw on (only possible with hand-made ledgers) is settled by the next grant.
  let owed = 0;

  for (const e of sorted) {
    const source = bucketOf(e);
    if (source) {
      const take = Math.min(e.credits, owed);
      owed -= take;
      grants.push({
        id: e.id,
        source,
        entry: e,
        granted: e.credits,
        remaining: e.credits - take,
        useOrder: null,
        expiresAt: expiryOf(e, source),
      });
    } else if (e.credits < 0) {
      // Debits, rescans and negative adjustments are spend.
      let left = -e.credits;
      for (const g of bySpendOrder(grants)) {
        if (left <= 0) break;
        const take = Math.min(g.remaining, left);
        g.remaining -= take;
        left -= take;
      }
      owed += left;
    }
  }

  let n = 0;
  for (const g of bySpendOrder(grants)) if (g.remaining > 0) g.useOrder = ++n;
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
