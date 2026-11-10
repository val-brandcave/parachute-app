# v4 report: Agent B1 (Billing Overview, Usage, page shell)

## Changes
- **Page shell** (`app/(shell)/configure/billing/page.tsx`): admin Overview, Usage, Invoices, Settings (+ Plans behind its flag, as before); reviewer and approver Overview, My usage; invoiced admin Usage, Invoices, Settings (no balance); invoiced non-admin gets Usage only. `?tab=activity` goes to usage, `?tab=payment` to settings. `InvoicesTab` / `SettingsTab` come from B2's `organisms/billing/tabs.ts` (the file existed, real imports are wired).
- **Usage** (`organisms/billing/usage/*`, `usage.css`): `UsageChart` is a bespoke SVG: stacked bars per day (30d), week (90d, 13 weeks) or month (12m); group by Review type (default), Person (top 4 plus Others) or Paid from; Daily / Cumulative toggle on 30d (stacked cumulative areas plus a dashed same-pace projection in a shaded zone, end label "~N"); legend that doubles as a series toggle with per-series totals; y gridlines, tick-gated x labels counted back from today; portaled fixed-position tooltip (row per group, total credits, dollars or "Free", flips at the edge, dismisses on scroll/resize); keyboard focus per column with arrow keys; reduced-motion safe. Then "By {grouping}" table (reviews, credits, share bar, cost or "Free", change vs previous or "New"; the comparison is hidden when history does not cover the previous period), then "Every credit movement" (All / Reviews / Top-ups / Refunds / Rewards, person select for admins, search, Export CSV of the filtered rows, Receipt/Details, Show more in steps of 25). Reviewers: own usage only, All / Reviews / Refunds. Invoiced: three-card header strip (month so far, next invoice estimate, average per review; committed volume omitted, not known), chart and tables in dollars.
- **Overview** (`OverviewTab.tsx`): balance hero (number, "enough for N full reviews", auto-reload chip with Change / Turn on link to Settings), runway bar plus "At your last 30 days' pace (x credits a day), this lasts about N weeks" and "Runs out around {date}" (plain message when there is no recent usage), expiry banner only when expiring credits are within 30 days, four facts with vs previous 30 days, compact chart (period toggle only), "What's in your balance" (hero number moved out; used grants capped to the last 8), Recent activity (5 rows, View all goes to Usage). Reviewer variant keeps the ask-your-admin block and shows their own facts and share.
- **Data**: `credit-ledger.seed.ts` Cedar Ridge now has about 12 months of generated history (seeded PRNG, weekdays 10 Nov 2025 to 6 Nov 2026, 2 to 4 reviews a day rising over the year, 4 people, ~770 rows, packs bought as needed, ends at exactly 1 credit). Harbor's trial grant moved to 24 Oct and its debits spread over two weeks; the order of rows, balances (13 = trial 1 / earned 1 / purchased 11) and receipt ids are unchanged, so the email previews still resolve.
- `billing-data.ts`: `ActivityRow.byId`, `invoicedActivity()`; `ActivityTable` got `showSource` / `showCredits` and inline grid templates (wider Types and By columns).

## SEED_VERSION bump needed
Yes. `data/adapters/mock-adapter.ts` SEED_VERSION (now "v21") must be bumped once at integration, otherwise existing browsers keep the old ledger and users. Changed seeds: `credit-ledger.seed.ts`, `users.seed.ts`.

## Cross-file asks / notes
- `users.seed.ts` (not on my list, nobody else's either): added two Cedar reviewers, Naomi Fischer (`user-cr3`) and Eli Whitaker (`user-cr4`), so Cedar has four people in the usage history. They also appear in Cedar's members list.
- B2 files now dead (I did not touch them): `InvoicedBilling.tsx`, `PaymentTab.tsx` (barrel exports removed), `AutoReloadCard.tsx` (only PaymentTab used it), `PaymentMethodsCard.tsx` (unused). Delete at integration. `wallet/WalletCard.tsx` still links to `?tab=payment`; it works through the alias, better to point it at `?tab=settings`.
- Removed dead code: `useBilling.exportCsv`, `expiryLine`, `BalanceCard` hero number and `aside` prop, old Activity tab block in the page.
- The 90 days option is 13 whole weeks (91 days); the summary says "last 13 weeks".

## Verified
tsc clean; eslint clean on all files I touched; zero console errors across every state below (Chrome, 1440 wide; 768 and 390 checked for the chart, the 390 shell itself is not mobile yet). Server on 3103 stopped, `tsconfig.json` restored, nothing committed.
Screenshots: `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\b392157a-bf67-4268-9514-2175f34b1704\scratchpad\v4\b1\`
- Cedar (payg-admin-low): cedar-usage-light/dark, cedar-cumulative-light, cedar-cumulative-dark-hover, cedar-12m-person-light/dark, cedar-90d-source-dark, cedar-overview-light/dark, cedar-ledger-light/dark, usage-legend-off-light, usage-narrow-768
- Harbor (trial-admin): harbor-overview-light/dark, harbor-usage-light/dark, overview-expiry-alert-light (injected an expiring earned credit)
- Reviewer: reviewer-overview-light/dark, reviewer-usage-light/dark
- Invoiced (returning): invoiced-usage-light/dark

## Open questions
- Expiry banner cannot appear with the seeds as they stand (no credit expires within 30 days); verified by editing one grant's date in localStorage.
- "Spent, last 30 days" is dollars of top-ups bought, not dollars of credits used (the chart carries the latter).
- Harbor can only show about two weeks of sparse history: 6 trial credits cap the number of runs.
