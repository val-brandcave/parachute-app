# v6 report B: Billing empty states

Files: `organisms/billing/{ActivityTable,BalanceCard,OverviewTab}.tsx`, `usage/{UsageTab,UsageCard,BreakdownTable,LedgerSection}.tsx`, `usage/usage.css`, `invoices/InvoicesTab.tsx`. No change to `EmptyState.tsx`.

## Changes
| Screen | Role / org | Level | Before -> after |
|---|---|---|---|
| Usage, no movements | pending-admin (never used) | 1 | chart, tables, export -> one `EmptyState` (GhostBars, warn status "waiting for approval", "Open the sample review") |
| Usage, reviewer/approver/invoiced with nothing of their own | "mine" or invoiced | 1 | same block, copy adapted (no credit/top-up talk for invoiced) |
| Usage chart, range has no usage | all | 2 | axes + empty bars -> title + controls + `EmptyLine` "No credits used in the last 30 days." + "Show 12 months" (only if 12 months has usage). Same on Overview compact chart |
| Usage breakdown, range has no reviews | all | 2 | table with 0 totals row -> heading and table hidden |
| Ledger filtered / searched to none | all | 3 | headers + "Showing 0 of 0" -> `EmptyLine` ("No refunds yet." / "Nothing matches ..."), tabs + search kept, "Show all" / "Clear search". Export CSV only when the view has rows. Whole section hidden if no rows at all |
| Overview, ledger empty | admin | 1 | zero balance, zero facts, empty chart -> one `EmptyState` (header "Add credits" is the primary, so only "Open the sample review" in block) |
| Overview, ledger empty | reviewer/approver | 1 | -> `EmptyState` "Your organization has no credits yet" + "Ask your admin" |
| Overview recent activity | all | 2 | table of nothing -> section hidden (admin) / `EmptyLine` (reviewer); footer "Showing latest N of M" only when more than 5 |
| Balance card | all | 2 | headers over "No credits yet" -> `EmptyLine` (+ "Show recently used" if all spent) |
| Invoices, no purchase and no usage | wallet admin | 1 | empty tables -> `EmptyState` "Receipts and statements appear after your first top-up" + Add credits |
| Receipts only empty / Statements | wallet admin | 2 | receipts -> `EmptyLine`; statements hidden when no usage (no more fake current-month row) |
| Invoices, invoiced org with no reviews | invoiced | 1 | invented invoices -> `EmptyState` |
| ActivityTable | - | - | now renders nothing when given no rows (callers own the empty line) |

Settings > payment: "No card on file" is already one calm line with its action, left as is.
Filled states (payg-admin-low 98 credits, approver, reviewer, trial-admin, returning/Meridian) checked unchanged.

## Screenshots (light + dark, 1440x900)
Folder: `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\4068bd9e-78ed-43c9-b97a-908e2b01b409\scratchpad\v6\b\`
- `pending-admin-{usage,overview,invoices}-{light,dark}.png` (level 1)
- `payg-ledger-refunds-*.png`, `payg-ledger-search-*.png` (level 3)
- `payg-usage-chart-empty-*.png`, `payg-overview-chart-empty-*.png` (level 2; reached with a temporary hash hook, since removed)
- filled: `{trial-admin,payg-admin-low,reviewer,approver,returning,enterprise-yc}-{usage,overview,invoices}-*.png`

## Open questions
- Pending-admin keeps "Add credits" enabled (unchanged behaviour); the status line only says reviews wait on approval. Should top-up also be gated?
- Reviewer/approver personas all have usage, so their level-1 "mine" block was not captured (same component as pending-admin Usage).
- Overview "Recent activity" footer no longer prints when 5 or fewer rows (was "Showing the latest N of N").

## Cross-requests
None.
