# Self-serve v2 — report C (wallet card, billing breakdown, sidebar balance)

## Changed files
- NEW `app/src/components/organisms/wallet/WalletCard.tsx` + `wallet-card.css` (own file, imported by the component); `wallet/index.ts` exports `WalletCard`.
- `components/organisms/billing/BalanceCard.tsx`: now "What's in your balance" (number, "about N full reviews", worth about $X for admins, spend-order sentence, table from `balanceGrants`). Meter and legend removed. "Show used (n)" toggle for fully used grants.
- `billing/OverviewTab.tsx`: balance card full width, Auto-reload + Payment methods side by side below (`.bl-two`). Reviewer view: same table without dollars; the "Ask your admin" block sits under the table.
- `billing/billing-data.ts`: `expiryLine` re-implemented on `balanceGrants`/`nextExpiring` (same signature, HomeCards' old caller still compiles); new `spendOrderSentence`, `daysUntil`, `expiryLabel`.
- `app/(shell)/configure/billing/billing.css`: removed `.bl-balance--split`, added breakdown styles and `.bl-two`.
- `components/organisms/BalancePill.tsx`: `CreditChip` (all-trial `trial` "6 trial", mixed `credit` "13 credits", low `low` "1 credit", pending `low` "Pending").
- `app/globals.css`: removed dead `.sb-balance-chip*` rules only (Edit tool).

## Behaviour
- WalletCard states: pending (greyed 6, dashed pips), low (Low chip, Add credits opens top-up with `low_balance` + needed), all-trial (pips = real progress, "Add a card"), mixed/paid (one sentence + "See what's in your balance"). Purchase actions hidden for non-admins. No bar, no legend.
- Expiry chip "in N days" (amber) when <= 14 days from `DEMO_TODAY`; trial = "No expiry".

## Verified
- `tsc --noEmit` clean, eslint clean for my files, /dashboard and /configure/billing 200, no console errors across all screenshot runs.
- Screenshots (light + dark, 1440x1000): `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\b392157a-bf67-4268-9514-2175f34b1704\scratchpad\v2\c\` — `wallet-{all-trial,trial-admin,mixed,payg-low,pending}-*.png`, `billing-admin-*`, `billing-admin-after-credits-*`, `billing-reviewer-*`, `pill-{trial,mixed,low,pending}-*`, `dash-*`. Scripts: `shots.py`, `shots2.py` there.
- The "in N days" chip was not exercised: no seeded grant is within 14 days of 6 Nov (code path is simple).

## Differences from the boards
- Real `PageHeader`/tabs/`.card` instead of the board chrome. Pack label is "Pack of N" via `packById`; refunds/adjustments (not on the board) show as `credit` chips with their note.

## Requests for others
- B: `HomeCards.tsx` no longer needs `expiryLine`/meter; once the old `WalletCard` is deleted there, `.meter*` CSS in globals.css (and the `su-pill` leftovers) is dead if nothing else uses it. I left it.
- Coordinator: `next dev` rewrote `app/tsconfig.json`.

## Open questions
- Low threshold is "< cost of a full review (2)". A trial org with 1 credit left therefore shows the Low state rather than all-trial.
