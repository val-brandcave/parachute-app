# Phase 3 report (coordinator)

Built by three parallel agents from `phase3-brief.md`. Detail per workstream is in `phase3-report-a.md` (cost at Start + debit), `phase3-report-b.md` (`/configure/billing` E1–E6 + seeds) and `phase3-report-c.md` (Add credits modal, Receipt dialog, hook-ups).

## Coordinator work
- **Foundation (before dispatch):**
  - Wallet store: spend order (`remainingBySource`, `remainingFromLedger`, `sourcesFor`). Debits record `paidFrom` and a `receiptId`, and are $0 when paid fully from trial credits. Auto-reload runs within the monthly cap.
  - `pricing.ts`: auto-reload defaults (10-pack, below 2, cap $3,000), `EARNED_LIFE_DAYS`, `PURCHASED_LIFE_MONTHS`, `DEFAULT_PACK_ID`.
  - Ledger type: `paidFrom` and `auto`.
  - Billing links now route to `/configure/billing`.
  - `next.config.ts` reads `NEXT_DIST_DIR` so parallel dev servers don't share `.next`. The `.next-*` dirs are gitignored.
- **Integration:**
  - **Receipt button:** added to the signed-workbook footer (`RunWorkbook.tsx`); it shows when the review has a debit.
  - **Home wallet:** shares the billing expiry line, replacing the hard-coded "nothing expires soon".
  - **Welcome pages:** "Add a card" goes to `/configure/billing?tab=payment`.
  - **Demo dock:** it no longer sits on the run cost footbar, and the persona label drops its stale credit count.
  - **Seed data:** the setup-progress bank-policy date now matches the ledger, and the seed version is `v19`.
  - **Reverted:** `app/tsconfig.json`, which `next dev` had rewritten.
- **Z-index:** C raised the library modal and toast tiers above the run takeover (z 120) in `wallet.css`. This applies app-wide; the order is unchanged.

## Verified
- `npx tsc --noEmit` and `npx eslint src --ext .ts,.tsx`: clean.
- Combined walk on one dev server (`scratchpad/build/walk-int.py`), zero console or page errors:
  - Cedar Ridge at 1 credit: D3 → Add 10 credits → Pay → the callout clears and Start enables (balance after 9) → Start creates the review → the Activity tab shows the debit and the top-up → Receipt opens.
  - Billing for trial-admin (E1), reviewer (E4) and enterprise-yc (E5) renders.
  - Home reads 13 credits and agrees with the pill and E1.
- Screenshots: session scratchpad `build/phase3-*.png` and `phase3-int-*.png`.

## Differences from the canvas (accepted)
- HCB balance is 13 (trial 1 / earned 1 / purchased 11), not 9 (1/2/6). The canvas split is impossible under trial-first spend order.
- Pack prices come from `pricing.ts`: the 10-pack is $1,400 ("Save 7%"), where the canvas shows $1,500. This is Ed's call.
- D3b is a full-page state rather than an inset. The first-card fields sit inline in the Add credits dialog.
- The Payment tab holds one card, because settings store a single `cardLast4`.

## Open / for Phase 4
- 905 Bayview Ave and 41 Mill Pond Ln exist only as ledger rows, not as reviews. Cedar's older ledger rows read "Review LN-…".
- A new review started from the demo PDF inherits its loan # (HCB-26-0918) for any org.
- The blank-confirm fix lives in `RunExperience`, which builds a stand-in when `review-001` isn't in the org's scope. A cleaner fix belongs in the reviews store.
- Backend: the balance check and debit are client-side mocks. The real product needs an atomic reserve-and-debit at Start.
