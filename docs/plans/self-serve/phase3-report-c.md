# Phase 3, Workstream C: Add credits modal, Receipt dialog, hook-ups

## Added
- `app/src/components/organisms/wallet/TopUpModal.tsx`, `ReceiptDialog.tsx`, `wallet.css`, `index.ts` (class prefixes `tu-`, `rc-`; the paper rows are `rc-item` because `.rc-row` already exists in globals.css).

## Changed
- `templates/AppShell.tsx`: mounts `<TopUpModal />` and `<ReceiptDialog />` once, after `EarnedToastHost`.
- `organisms/BalancePill.tsx`: aria-label "Balance <label> · open billing"; tooltip "Balance · open billing" (expanded and collapsed).
- `organisms/DemoDock.tsx`: new "Low balance" action (adjusts so the balance is 1; disabled for invoiced orgs).
- `organisms/ReviewTable.tsx` (`RowMenu`, the queue row ⋯ menu): "Receipt" item when the wallet ledger has a debit with a `receiptId` for that review.
- `organisms/onboarding/PendingState.tsx` and `ReadyState.tsx`: "Add a card now" routes to `/configure/billing?tab=payment`. `onAddCard` is now optional and ignored.

## Behaviour
- **TopUpModal (D4)**: library `Dialog`. Title "Add credits". In the `low_balance` reason it shows "This review needs N credits. You have M." Three pack cards come from `CREDIT_PACKS` (full reviews = `floor(credits / costFor(FULL_REVIEW_TYPES))`, note chip from the pack). The default is `DEFAULT_PACK_ID`, or the smallest pack covering `topUpNeeded` if that is larger. A card on file shows "VISA •••• last4 · Change". "Change", or no card, shows the inline card form (name, number, expiry, CVC, hosted-form note). Validation is well-formed only. Paying with a new card calls `setPaymentMethod({ paymentMethod: "card", cardLast4 })`. The auto-reload switch writes `setAutoReload` immediately. Pay shows a ~600 ms pending state, then `purchase(packId)`, then closes with the toast "<n> credits added · Balance <b>" and a **Receipt** action. Non-admins get a small "Ask your admin" dialog (emails the org admin found in the users store).
- **ReceiptDialog (D5)**: looks the entry up by `receiptId`.
  - Debit: address, loan, types, credits, amount ("$0 · list ~$300" for trial runs), paid from, running balance after, re-scan note, started by.
  - Purchase: pack, amount, card, auto-reload flag, balance after.
  - Refund: credits and amount returned, reason (the entry note, else "Failed on our side · refunded").
  - Adjustment: a generic fallback.
  - Paper is fixed white in both themes. **Download PDF** is `window.print()` with a print stylesheet that prints only the paper. **Email receipt** shows the toast "Sent to <billingEmail>". An unknown id shows a "could not find that receipt" dialog.

## Verified (Playwright, port 3103, no console or page errors)
- `trial-admin` → Low balance (pill reads "1 credit", aria "… · open billing") → upload on `/launchpad` → D3 callout → Add 10 credits opens the modal (light and dark). Modal checks: context line, default pack, Change opens the card form, form filled, auto-reload switch on, Pay, toast, Receipt action opens the purchase receipt.
- Queue ⋯ → Receipt on the 220 Commerce Way row opens the debit receipt.
- `npx tsc --noEmit` clean. `npx eslint` clean on all my files.
- Dev server stopped, `.next-c` deleted.

Screenshots (in `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\67537008-86c0-4f6d-a19f-25346e534647\scratchpad\build\`):
`phase3-D4-light.png` (over A's D3), `phase3-D4-firstcard-light.png`, `phase3-D5-light.png` (debit), `phase3-D5-purchase-light.png`, `phase3-D4-dark.png`, `phase3-D5-dark.png`.

## Differences from the canvas
- The first-purchase card fields are inline in the same dialog (the canvas shows a second inset card). "Change" with a card on file opens the same form, with "Keep using •••• 4242" to go back.
- Pack prices come from `pricing.ts` (pack10 is $1,400, the canvas shows $1,500). The expiry in the payment row is dropped because settings only hold `cardLast4`.
- The receipt shows our `RCT-XXXXX` id and no "signed by" line.
- The property line is `propertyAddress` as stored; the seed already includes the city for HCB reports, but `Review` has no separate city field.

## Cross-workstream notes and requests
1. **z-index (important)**: `.run` (A's takeover) is z-index 120, above the library's modal (60) and toast (70) tiers. A Dialog opened from inside it was hidden with no scrim, and its toast Receipt action was unclickable. Fix: `wallet.css` lifts `--rw-z-overlay/modal/dropdown-in-modal/overlay-in-modal/modal-in-modal/toast/tooltip` above 120 with their order unchanged, under `:root`. It applies app-wide, so other library modals and toasts now also sit above the run takeover. Alternative if the coordinator prefers: lower `.run` below 60.
2. **B**: the Payment tab must read `?tab=payment` (onboarding "Add a card now" routes there). B's page should call `openTopUp({ reason: "manual" })` for Add credits and `openReceipt(entry.receiptId)` for the Activity row action. Both work today.
3. **Onboarding hook (optional cleanup)**: `app/(onboarding)/welcome/hooks/useWelcome.ts` still defines the old `addCard` toast and passes it as `onAddCard`. It is now ignored and can be deleted. I did not edit it (not my file).
4. **A**: the review page has no workbook-bar ⋯ menu outside A's files, so the review-side Receipt entry point was not added. The D5 mock shows a "Receipt" button on the workbook footbar. Insertion point: the signed workbook footer in `src/components/run/**` (next to "View source"), calling `useWalletStore.getState().openReceipt(receiptId)` with the review's debit entry.
5. **tsconfig.json**: `next dev` with `NEXT_DIST_DIR` rewrites `app/tsconfig.json` (adds `.next-*/types` includes). It shows as modified in git status. Revert it after all three workstreams finish (`git checkout app/tsconfig.json`).
6. **Receipt balance**: "Balance after" is the running sum of the ledger up to the entry. After B's seeds v18 it will match the E1 story. The seeded HCB debit receipt currently reads "4 credits" after the 220 Commerce Way run (v17 seed).
7. Backend dependencies (one line each): the card form needs a hosted payment provider, receipts and emailing need a billing service, and PDF needs server rendering (the prototype uses print).
