# v4 report: Agent B2 (Billing Invoices + Settings)

## Built
- `organisms/billing/tabs.ts` exports `InvoicesTab({ b, invoiced })` and `SettingsTab({ b, invoiced })` (B1 imports from here; it is not in `index.ts`).
- **Invoices** (`invoices/InvoicesTab.tsx`): wallet orgs get Receipts (every purchase, Download PDF opens the existing receipt dialog; first 8 then Show all) and Monthly statements (period, reviews, credits used, purchased $, Download goes to the statement route with `?month=`). Invoiced orgs get an Invoices table (period, reviews, credits, amount, Due/Paid chip, Download), "Net 30, sent to {email}". Note line about PO, tax ID and address.
- **Settings** (`settings/*`, label/description rows, changes save as you make them with an inline "Saved"): Payment method, Auto-reload (threshold, pack, monthly limit with "This month: $X of $Y"), Alerts (low balance + threshold, expiry within 14 days, monthly spend + $, recipients), Billing contact (email, hand billing over), For your finance team (PO, tax ID, billing address, Realwired W-9 download, Security pack to /configure/security). Invoiced: Billing terms instead of payment/auto-reload, alerts = spend only.
- Statement paper (`StatementPaper`) and the statement page now print Bill to, PO number and tax ID (page passes `billTo`; I own both).
- Persistence: new optional fields on `WalletSettings` (poNumber, taxId, billingAddress, alertLow, alertLowBelow, alertExpiry, alertSpend, alertSpendUsd, alertEmails); new `useWalletStore.setBillingSettings` goes through the existing `patchSettings` to the adapter. Mock adapter unchanged, no seed change, so no SEED_VERSION bump from me. Verified: PO survives reload and shows on the statement.
- `public/billing/realwired-w9.pdf`: placeholder PDF.
- CSS: `organisms/billing/billing-settings.css` (imported by both tabs).

## Screenshots (light + dark)
`C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\b392157a-bf67-4268-9514-2175f34b1704\scratchpad\v4\b2\` : trial-admin, payg-admin-low, returning (invoiced) x settings, invoices. 0 console errors. Taken on a temporary preview route (deleted).

## Cross-file asks for B1
- Wire `InvoicesTab`/`SettingsTab` from `@/components/organisms/billing/tabs`; reviewers never see them.
- Redirect `?tab=payment` to settings, `?tab=activity` to usage.
- After wiring, `PaymentTab.tsx` is dead (drop it and its `index.ts` export, then delete the file). `AutoReloadCard.tsx` and `PaymentMethodsCard.tsx` are still used by `OverviewTab`; their "Add a card" links point at `?tab=payment` and should point at `?tab=settings`.
- Alert defaults (low below 3, expiry 14 days, spend default = auto-reload monthly cap) live in `settings/settings-data.ts`; the alerts are stored only, nothing sends mail.

## Open questions
- Invoice rows for Sep/Oct are scaled from the current month (same as before); real history needs seeds.
- W-9 is a placeholder, Ed/Realwired to supply the real file.

tsc and eslint clean; server on 3104 stopped; tsconfig restored; no commit.
