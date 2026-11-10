# Self-serve v4: Get started as its own page + Billing & credits rework (brief)

Branch `feat/self-serve-onboarding-v2`, base commit a9dadc4. Approved by Val 9 Nov 2026.
Billing visual reference (interactive): https://claude.ai/artifact/Via4U2EaEtRTgTvDwSkZEz
(you can't open it; this brief describes it). Read `app/AGENTS.md` first. All numbers from `lib/pricing.ts`.
Build with the app's real components/tokens (Tabs, SegmentedControl, Button, Chip, CreditChip, Icon,
ActionMenu, Tooltip, Modal, `@realwired/ui`), light + dark, no mono, no hardcoded colors.

## Why (Val's decisions)
Self-serve orgs can run real reviews from minute one (6 trial credits, Start enabled unless approval
pending), so the Dashboard has a real job from day one and must not be replaced by the setup checklist.
- **Get started** = its own page `/get-started`, a left-rail item ABOVE Dashboard with a small count
  ("4/9"). Shown to EVERYONE (all roles) while setup is unfinished and not hidden. When finished or
  hidden it leaves the rail; the user menu "Setup guide" item brings it back (hidden → unhide + go there).
- Get started holds: the setup checklist card (welcome title + progress, built in v3) as main column;
  right column Sample, Wallet (trial), IT pack, Guides (the v3 `HcCard`s). Welcome / Pending / Joined
  callouts move here too.
- **Dashboard** is always the real dashboard (StatBar, trend chart, Needs my action, etc.) with a proper
  empty state. Drop the `stage === "new"` → FirstRunHome branch and `FIRST_RUN_STATBAR_MIN`.
  No Wallet card on Dashboard (sidebar Balance pill + Billing cover it).
- The sidebar bottom `SetupDock` is removed (the rail item replaces it).
- Landing: while setup is unfinished and not hidden → `/get-started` (new org after /welcome, sign-in,
  demo personas whose org is new). Otherwise → `/dashboard`.
- Billing: four tabs **Overview · Usage · Invoices · Settings** (Activity folds into Usage; Payment
  becomes Settings; Plans stays hidden behind its flag as a 5th tab exactly as today). Default chart
  grouping = review type. Runway + expiry alert yes. Spend control = monthly cap on auto-reload only (no
  per-person limit). Procurement block (PO number, tax ID, billing address, W-9) yes.

## Agent G: Get started route, nav, landing (port 3101, NEXT_DIST_DIR=.next-g)
Own: new `app/(shell)/get-started/page.tsx` (+ hook if needed), `components/organisms/home/*`
(FirstRunHome → becomes the Get started page body; keep HcCard cards as they are), `templates/AppShell.tsx`,
`organisms/SetupDock.tsx` (delete + its CSS), `organisms/UserMenu.tsx`, `molecules/Breadcrumbs.tsx`,
`organisms/CommandPalette*` (add "Get started" destination while visible), `(onboarding)/welcome/hooks/useWelcome.ts`,
`auth/SignInForm.tsx`, `app/demo/[persona]/page.tsx`, `app/start/page.tsx`, `EarnedToastHost.tsx`,
`data/seed/demo-personas.seed.ts` (entry routes), `app/globals.css` (you're the only one editing it).
- Rail item: label "Get started", icon e.g. `rocket`/`flag` (pick a distinct one, add to Icon map if
  needed), trailing small count "4/9" (tabular nums, quiet chip style; collapsed rail: icon + tiny count
  badge or tooltip "Get started, 4 of 9"). Active state like other nav items.
- A single helper (e.g. `useLandingRoute()` / `landingRouteFor()` in store or lib) decides /get-started vs
  /dashboard; use it everywhere instead of hardcoded "/dashboard" after sign-in/onboarding/demo.
  Persona `entryRoute` may stay as data but should resolve through the helper for new-stage orgs.
- `/dashboard#setup` links (from v3) → `/get-started`. Earned-credit toast "View" → /get-started.
- Get started for invoiced/YouConnect orgs: never shown (same as today's stage rule).
- When all steps are done the page shows a short done state ("You're set up") with "Go to Dashboard";
  the rail item disappears after that visit or when hidden. Keep it simple and honest.

## Agent D: Dashboard always on, empty state (port 3102, NEXT_DIST_DIR=.next-d)
Own: `app/(shell)/dashboard/page.tsx` + `dashboard/hooks/*`, `organisms/StatBar*`, `organisms/TrendChart*`,
`ActionNeeded`, `NewFromYouConnect`, `DashboardSkeleton`, `organisms/value/*` if needed, new
`app/(shell)/dashboard/dashboard.css` (import it from the page; do NOT edit globals.css; prefix `db-`).
- Remove the FirstRunHome branch: every org sees the real dashboard (greeting strip + period picker).
- Empty state when the org has no reviews of its own (the sample never counts): stat tiles show 0 with a
  muted hint where useful; the chart area becomes a designed empty state ("Your first review will show
  here", primary "Start a review" (respect the start gate / approval pending reason), secondary "Open the
  sample review"); Needs my action / YouConnect widgets show calm empty states. Use the existing
  `useStartGate` for Start. Pending-approval orgs: Start disabled with the reason, sample link works.
- Check with few reviews (1–2) that charts don't look broken (single bar, deltas vs zero = no "+∞%").
- Make sure no import of FirstRunHome remains in dashboard.

## Agent B1: Billing Overview + Usage + page shell (port 3103, NEXT_DIST_DIR=.next-b1)
Own: `app/(shell)/configure/billing/page.tsx`, `billing.css`, `organisms/billing/{OverviewTab,BalanceCard,
ActivityTable,useBilling,billing-data,index}.ts(x)`, NEW `organisms/billing/usage/*` (chart, breakdown,
ledger), `data/seed/*ledger*`/wallet seeds (history), `data/seed/reviews.seed.ts` only if needed for history.
Tabs per role: admin Overview · Usage · Invoices · Settings (+ Plans flag tab as today); reviewer/approver
Overview · My usage (read-only, their own usage + org balance); invoiced Usage · Invoices · Settings
(no balance). Keep `?tab=` routing; old `?tab=activity` → usage, `?tab=payment` → settings.
- **Overview**: balance hero (big number, "credits · enough for N full reviews", auto-reload status chip,
  runway bar + "At your last 30 days' pace (x credits a day), this lasts about N weeks" + "Runs out around
  {date}"; if no usage yet: say so plainly), expiry alert banner ONLY when credits with expiry < 30 days
  exist (use `balanceGrants`/`nextExpiring`), 4 facts with vs-previous-30-days deltas (Used last 30 days,
  Reviews run, Average per review (credits + $), Spent last 30 days (admin) / Your share (reviewer)),
  a compact usage chart (period toggle only), "What's in your balance" compact table (existing data),
  Recent activity (5 rows, "View all" → Usage).
- **Usage**: chart card: bespoke SVG (AGENTS chart pattern: gridlines, date x-labels tick-gated, themed
  hover tooltip, legend), stacked bars of credits per day (30d) / week (90d) / month (12m); group by
  **Review type** (default) · Person · Paid from (trial/earned/purchased, using spend order); 30d has a
  Daily / Cumulative toggle: cumulative = running total of last 30 days + dashed projection for the next
  30 days at the same pace in a shaded zone, end label "~N". Then "By {grouping}" table: name, reviews,
  credits, share bar, cost ($ via CREDIT_USD; "Free" for trial/earned), change vs previous period ("New"
  when previous 0). Then "Every credit movement": filter segmented All/Reviews/Top-ups/Refunds/Rewards
  (reviewer: All/Reviews/Refunds), person select (admins), search address/loan, Export CSV (existing),
  failed+refund folded into one ±0 row (existing), Receipt/Details row action (existing ReceiptDialog),
  pagination or "Show more". Invoiced: header strip of 3 cards (this month reviews + credits, next invoice
  estimate, committed volume if known else omit), amounts in $ instead of credits.
- **Data**: the chart needs history. Give the Cedar Ridge (payg) and Harbor seeds a plausible ledger
  history (Cedar ~12 months, 2–4 reviews per weekday, 4 people incl. existing users; Harbor ~2 weeks
  of trial use) generated deterministically in the seed (no Math.random at runtime in render). Keep
  current balances (Harbor 13, Cedar low = 1) consistent with existing personas and spend order. Do not
  bump SEED_VERSION yourself; tell me in the report (I bump once at integration).

## Agent B2: Billing Invoices + Settings (port 3104, NEXT_DIST_DIR=.next-b2)
Own: `organisms/billing/{PaymentTab,PaymentMethodsCard,AutoReloadCard,InvoicedBilling,StatementPaper,plans,PlansTab}.tsx`,
NEW `organisms/billing/invoices/*`, NEW `organisms/billing/settings/*`, NEW `organisms/billing/billing-settings.css`,
`app/(shell)/configure/billing/statement/*`, `store/wallet.store.ts` (settings fields only), `types/*` (new
billing settings fields), the mock adapter only if a new settings field needs persisting (tell me).
Export `InvoicesTab` and `SettingsTab` from the billing barrel via a NEW `organisms/billing/tabs.ts`
(B1 imports from there; agree names exactly: `InvoicesTab({ b, invoiced })`, `SettingsTab({ b, invoiced })`
where `b = ReturnType<typeof useBilling>`).
- **Invoices**: Receipts table (date, receipt #, for, paid with, amount, Paid chip, Download PDF action
  that opens the existing receipt dialog / print-ready view) for every purchase; Monthly statements table
  (period, reviews, credits used, purchased $, Download → existing statement route); invoiced orgs:
  Invoices table (period, reviews, credits, amount, Due/Paid chip, Download) with "Net 30, sent to {email}".
  Note line: receipts and statements carry the PO number, tax ID and billing address from Settings.
- **Settings** (label/description rows, the AGENTS settings style): Payment method (existing card UI);
  Auto-reload (existing behaviour: when below N, buy pack, monthly limit + "This month: $X of $Y used by
  auto-reload"); Alerts (toggles: balance below N credits, credits expire within 14 days, monthly spend
  passes $X; recipients field); Billing contact (existing "Hand billing to someone else"); For your
  finance team (PO number, tax ID (EIN), billing address; buttons "Realwired W-9" (download a placeholder
  PDF you add at `public/billing/realwired-w9.pdf`, mark `*.pdf` binary already set) and "Security pack"
  (→ /configure/security)). Invoiced: Billing terms note instead of payment/auto-reload; alerts = spend only.
  Persist new fields through the store → adapter (mock localStorage) like existing settings.
- Reviewers never see Invoices/Settings.

## Everyone
- Stay inside your files. If you must touch another agent's file, don't: write it in your report.
- Own dev server only (ports above). 3000/3001 are Val's: never kill them. Stop yours when done.
- Screenshots light + dark of every state you own into
  `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\b392157a-bf67-4268-9514-2175f34b1704\scratchpad\v4\<agent>\`,
  look at them critically, iterate. Personas: /demo/trial-admin, /demo/payg-admin-low, /demo/reviewer,
  /demo/pending-admin, new org via /demo/prospect → /welcome → Continue. Check the persona list in
  `data/seed/demo-personas.seed.ts` for an invoiced one.
- `npx tsc --noEmit` + `npx eslint` on your files clean; zero console errors; `git checkout app/tsconfig.json`;
  no commit. Report: `docs/plans/self-serve/v4-report-<g|d|b1|b2>.md` (changes, screenshots, cross-file asks,
  dead code removed, open questions).
- Copy: plain, sentence case, no em dashes, no "→" in button text, numbers from pricing.ts.
