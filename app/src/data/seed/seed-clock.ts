/**
 * The seeds' "now". Was a frozen 19 Jun 2026 (1781827200000), so by November every seeded
 * open review read "Overdue 140d+". Now: the start of today (UTC), taken once when the seed
 * module loads, the same way credit-ledger.seed.ts anchors Harbor's trial to Date.now().
 * Whole days keep it stable through a session; the gaps between seeded dates are unchanged.
 * Not called during render: seeds are written to storage, and pages read the stores.
 */
const DAY = 86_400_000;
export const SEED_NOW = Math.floor(Date.now() / DAY) * DAY;
