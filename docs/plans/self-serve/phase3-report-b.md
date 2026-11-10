# Phase 3 report, workstream B: `/configure/billing` (E1-E6) and seeds v18

All paths under `C:\Users\vvrsv\OneDrive\Desktop\parachute\app`. Nothing committed. Nothing under `docs/meetings/` touched.

## Added
- Route `src/app/(shell)/configure/billing/page.tsx` (+ `billing.css`, prefix `bl-`) and `.../billing/statement/page.tsx`.
- `src/components/organisms/billing/`: `useBilling.ts`, `billing-data.ts` (activity rows, CSV, expiry line, statement builders, card expiry helper), `plans.ts` (`PLANS` source, dollars from `CREDIT_USD`), `BalanceCard`, `AutoReloadCard`, `PaymentMethodsCard`, `OverviewTab` (+ `ReviewerBilling`), `ActivityTable`, `PaymentTab` (card form, billing contact, hand-over), `PlansTab`, `InvoicedBilling`, `StatementPaper`, barrel `index.ts`.

## Changed
- `/configure` hub: "Billing & credits" card (wallet icon). `Breadcrumbs.tsx`: label map entry + `Billing & credits > Monthly statement`.
- `/configure/organization`: Billing tab removed. `BillingPanel.tsx` deleted and its barrel export removed (nothing else used it).
- Seeds, `SEED_VERSION` is now **v18** (`mock-adapter.ts`): `credit-ledger.seed.ts`, `wallet-settings.seed.ts` (`orgs.seed.ts` needed no change).

## Seed decisions (HCB, consistent with Phase 2 C2)
Ledger: trial grant +6, 41 Mill Pond Ln (HCB-26-0890) debit -1 then refund +1, 220 Commerce Way (HCB-26-0918) -2 (`review-hcb-1`), 18 Lighthouse Rd (HCB-26-0907) -1 (`review-hcb-2`), 905 Bayview Ave (HCB-26-0899) -1, earned +1 (bank policy, matches setup progress), 10-credit pack (RCT-41010, $1,400 from `pricing.ts`). Every debit/purchase/refund has a `receiptId`; debits have `paidFrom` and `reviewTypes`.
- **Resulting balance is 13: trial 1 / earned 1 / purchased 11**, not the canvas's 9 (1 / 2 / 6). The canvas split is impossible under the trial > earned > purchased spend order (it would leave trial credits unspent while purchased ones are used), and a second earned credit would contradict the Phase 2 setup progress (checklist still "doing"). Home, the sidebar pill and E1 all read 13 (checked). Home still reads sensibly (4 of 8, wallet card 13 credits).
- Reviews seed was not touched: 905 Bayview Ave and 41 Mill Pond Ln have no review rows (only `loanNo` and the address in the ledger note), so C's receipt dialog cannot look up a review for them and must fall back to the ledger note (`"<address> - <detail>"`). 
- HCB settings: card 4242, `billing@harborcb.com`, auto-reload off, pack10, below 2, cap $3,000. Cedar Ridge: 1 credit, card 4242, auto-reload off, same defaults, its debits got receipts/`paidFrom`.

## Behaviour
- **URL contract:** `/configure/billing?tab=overview|activity|payment|plans` (admins, wallet orgs) and `?tab=usage|invoices` (invoiced orgs). Unknown values fall back to the first tab. `/configure/billing/statement?month=YYYY-MM` for the statement.
- **Roles:** org_admin on trial/payg gets E1-E3; reviewer/approver gets E4 (balance + meter, no dollars, no payment methods, activity credits only, "Ask your admin" toast "We emailed <admin>"); invoiced orgs get E5 (Usage / Invoices, no wallet).
- Add credits and Receipt call `openTopUp({ reason: "manual" })` and `openReceipt(receiptId)` only; no dialogs built here.
- Auto-reload edits save immediately through `setAutoReload` (no Save/Cancel as on the E2 board). Switch is disabled until a card exists ("Add a card first" link goes to `?tab=payment`).
- Payment tab: one card model (settings hold one `cardLast4`), so "Replace card" instead of a two-card list; inline form accepts anything well-formed, saves via `setPaymentMethod`, with the hosted-form note. Expiry is kept in localStorage per org (`parachute:billing:card-exp:<org>`; the settings row has no expiry field), seeded 4242 shows 08/28. Billing email editable. Address is a static block per demo org. "Hand billing to someone else" lists org members and sets `org.billingContactId`.
- Plans: tab always visible; lock + "Hidden · flag" chip when `org.flags.plansTab` is off, with a "Preview (demo)" link that flips the flag via `setFlag`.
- Activity: real CSV download (ledger-derived), "Monthly statement" opens the E6 route. Statement is a page route (not a dialog): white paper in both themes, grouped by loan reference, month selector when more than one month has activity, **CSV**, **Download PDF** (`window.print()` with a print stylesheet that shows only the paper). Fully refunded debits are left off the statement.
- E5: reviews count and Technical/Administrative counts are derived from the org's non-sample reviews. Meridian's seeded reviews are dated June, so for the demo they are all treated as "this month" and their dates are re-based to the demo today (6 Nov 2026); that is prototype-only and commented in `billing-data.ts`. Amounts are list value per review type (11 reviews, $2,550 on this seed, canvas said 14 / $3,750).

## Verified
- `npx tsc --noEmit` clean; `npx eslint` clean on my files, the configure pages, Breadcrumbs and seeds.
- Playwright (`scratchpad/build/walkB.py`), zero console and page errors: trial-admin E1 overview numbers, activity tab, CSV (9 lines), Receipt and Add credits click through to C's dialogs (both present), auto-reload on with fields, card replace, hand-billing list, Plans locked then preview, E6 statement; dark E1/E6; reviewer E4 with toast; enterprise-yc E5 (+ invoices, statement, dark); Cedar (1 credit, card on file); hub card; organization page has 3 tabs.
- Dev server on 3102 stopped, `.next-b` deleted.
- Screenshots (1440 wide) in `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\67537008-86c0-4f6d-a19f-25346e534647\scratchpad\build\`: `phase3-E1-light.png`, `phase3-E2-light.png` (+ `E2-addcard`, `E2-hand`), `phase3-E3-light.png` (+ `E3-locked`), `phase3-E4-light.png`, `phase3-E5-light.png` (+ `E5-statement`), `phase3-E6-light.png`, `phase3-E1-dark.png`, `phase3-E5-dark.png`, `phase3-E6-dark.png`, plus `phase3-E1-activity-light.png`, `phase3-cedar-light.png`, `phase3-hub-light.png`, `phase3-home-light.png`. One fix round after the canvas comparison (column widths, big-number alignment, statement group label, refunded debit).

## Differences from the canvas
- Balance 13 (1/1/11) instead of 9; activity has 8 ledger events with a separate refund row (canvas folded it into a "±0" row with a "Details" button; here the refund row has Receipt).
- Payment tab: one card, instant-save auto-reload, no "Make default" / `...` row menu, no Mastercard.
- Invoiced page has no sidebar in the screenshot because the `enterprise-yc` persona runs in the embedded shell.
- Pack price follows `pricing.ts` (10 credits ~$1,400), not the board's ~$1,500; Team allowance is `20 credits x CREDIT_USD x 0.9` (~$2,700).

## For other workstreams / coordinator
- **C:** ReceiptDialog must handle ledger entries with no `reviewId` (Bayview, Mill Pond, Cedar's two debits): use the entry's `loanNo` and the ledger note (`"<address>, <city> - <detail>"`). Refund entry id `led-hcb-3` has `receiptId` RCT-40891 and no `reviewTypes`.
- **C:** DemoDock trial-admin label still says "Trial admin, 5 credits"; HCB now has 13.
- **Coordinator:** `tsconfig.json` is rewritten by `next dev` (reformatted `lib`, extra `include` entries for `.next-a/b/c`); revert it after the three dev servers are stopped (`git checkout app/tsconfig.json`).
- Backend dependencies (one line each): card tokenisation / payment provider, invoice and statement PDF generation, receipt email, billing-contact change audit, plan entitlements.

## Coordinator review fixes (round 2)
- Dates: HCB seed rows now sit between 6 Nov 09:12 and 7 Nov evening (nothing after 8 Nov). Table, CSV and E5 use day-month ("7 Nov"; CSV "7 Nov 2026"). Earned-credit expiry is now 5 Feb 2027. Note: Phase 2's setup-progress still dates the bank-policy step 9 Nov, a small mismatch with the earned row (not my file). `SEED_VERSION` stays v18; a browser that already seeded v18 needs its localStorage cleared to pick up the new dates.
- Refund pairing: the failed run and its refund are one row (Credits "±0", Refund chip, By "System", action "Details" which calls `openReceipt` with the refund's `receiptId`); sums still add up (-1 + 1 = 0, balance 13). The CSV keeps both raw rows.
- Balance card: first column is 1.12fr and the meta line is `nowrap`, so "credits · ~$1,950 value · about 6 full reviews" sits beside the number at 1440 (light and dark). Payment card row kept on one line.
- Loan references: computed style is Inter (body face), `letter-spacing: normal`, tabular figures via `font-feature-settings: "tnum"`; no monospace. The hyphens look wide only because that is Inter's glyph.
- Re-shot `phase3-E1-light.png` and `phase3-E1-dark.png` (same folder as before). tsc and eslint clean, zero console errors.
