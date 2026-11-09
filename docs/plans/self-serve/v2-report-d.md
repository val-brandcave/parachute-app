# v2 report D: chips in the run, top-up and receipt

## Changed files
- `app/src/components/run/CostSummary.tsx`: footbar and type rows use `CreditChip`; `.cs-chip*` removed.
- `app/src/components/run/cost-summary.css`: dropped `.cs-chip*`; added `.cs-sep`, `.cs-type-cost`, selected-row override for the credit chip.
- `app/src/components/organisms/wallet/TopUpModal.tsx`: pack exact price (no "~", from CREDIT_PACKS) = `money` chip, savings note = `free` chip (sm).
- `app/src/components/organisms/wallet/topup-chips.css` (new): placement only, plus selected-pack contrast.
- `ReceiptDialog.tsx`: unchanged. Its amounts are all label/value rows (table cells), and the receipt is a paper document, so plain text is the rule.

## Behaviour
- Footbar: "This review uses [2 credits] [~$300] | Balance after [11 credits]". Trial-only: trial chips + "list ~$300", then "Left after [4 trial credits]". Short balance: credit + money chips, then a `low` chip "Balance 1".
- Type rows: [1 credit] [~$150], credit chip lifts onto the surface on the selected (navy-tinted) row.
- Top-up packs: the big number and "credits" stay hero text; price and savings are chips. Context line, header description, button labels (Pay $X, Add 10 credits · $1,400) stay plain.
- All numbers come from `lib/pricing.ts` helpers, unchanged.

## Verified
tsc clean, eslint clean on my files. Screenshots (light and dark, 1440x1000) on port 3104: trial-admin confirm, payg-admin-low confirm with callout, Billing top-up with a pack selected, in `scratchpad/v2/d/` (confirm-*, lowbal-*, topup-*, topup-sel-*). No console errors.

## Ad-hoc pills in files I do not own (suggested tone)
- `components/organisms/billing/InvoicedBilling.tsx:38` invoice status Paid/Due: `free` for Paid, `low` for Due (status chips)
- `InvoicedBilling.tsx:57-58` "Technical {n}" / "Administrative {n}" counts: `credit` (or plain text)
- `InvoicedBilling.tsx:66` "Due 5 Dec": `low`
- `components/organisms/billing/AutoReloadCard.tsx:97` "Off · opt-in": `money` (neutral status)
- `components/organisms/home/SetupChecklist.tsx:33,38` "No credit": `money`/neutral; `:25` "In progress": `low`; `:40` "Tick only": neutral (B owns, already in brief)
- `components/organisms/billing/PaymentMethodsCard.tsx:34`, `PaymentTab.tsx:193` "Default": neutral `money`
- `billing/PlansTab.tsx:34` plan tag: leave (not a quantity)
- `app/(shell)/configure/security/page.tsx:66,138` pack version / owner: leave (not credits or money)
- `billing/ActivityTable.tsx:74-75`, `StatementPaper.tsx:72,87`, `ValueStrip.tsx:117`: table cells and hero figures, plain text per rule. No change.

## Requests for others
None required. `wallet.css` still holds now-overridden `.tu-pack-p` / `.tu-pack-note` colour rules; harmless, can be trimmed by whoever owns it.
