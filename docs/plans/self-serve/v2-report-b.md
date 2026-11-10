# v2 report, stream B: dashboard arrival, pending state, Start gating

## Changed files
- `store/prefs.store.ts`: `welcomeDismissedBy` + `dismissWelcome(userId)` (localStorage `parachute:welcome-dismissed`, same shape as `setupHiddenBy`).
- `components/organisms/home/useStartGate.ts` (new): `useStartGate()` returns `{ locked, reason }`; reason "Opens when your organization is approved". Exported from the home barrel.
- `home/FirstRunHome.tsx`: `PendingCallout` (warning) and `WelcomeCallout` (success) above the page body; wallet now imported from `@/components/organisms/wallet`.
- `home/HomeCards.tsx`: old `WalletCard` removed; `SampleCard` pill is a `CreditChip tone="free"`. `home/index.ts` updated.
- `home/SetupChecklist.tsx`: reward/cost/free pills and the header and done-line earned pills use `CreditChip`. While pending, "Run your first report" shows `CreditChip tone="low"` "After approval", copy "Opens after approval.", no action, and is skipped for the "Next" tag. Header reads "You can do most of this while you wait".
- Start gating (disabled, visible, reason shown): `templates/AppShell.tsx` (sidebar action, Tooltip on the right), `organisms/OrderButton.tsx` (disabled + Tooltip), `organisms/IntakeWidget.tsx` (drop zone shows "Not open yet" + reason, YouConnect rows disabled, drops and clicks ignored), `organisms/CommandPalette.tsx` (Start items show the reason and do not run), `molecules/Breadcrumbs.tsx` (amber chip with the reason beside the "Start a review" crumb on /launchpad). `app/(shell)/launchpad/page.tsx` needed no change (it renders IntakeWidget).
- `globals.css`: one marked section "Self-serve v2 (B)" after `.intake-drop.busy` (banner spacing, locked states).

## Behaviour
- Welcome banner: shows only if the org has a `trial_grant` ledger entry, is not pending, the user has not dismissed it, and the org id is not in `seedOrgs`. So orgs made by /welcome in this session see it; seeded personas (Dana, Leah, Cedar) never do. Open the sample also dismisses it. Copy: "{Org} is ready" / "{N} trial credits added, about {M} full reviews. No card needed."
- Pending banner: "Realwired is confirming {Org}" with the sample as the action; "Book a call" is an inline `CalloutAction` in the sentence (calls `requestSales`, toast), replaced by "Call requested, we'll email you." once `salesRequested`.
- Greeting and "Getting set up · N of 9" stay in `PageHeader`.

## Verified
- `tsc --noEmit` clean, eslint clean for my files. Routes /dashboard, /launchpad, /reviews hit on :3102 with no console errors.
- Real flow on :3102: /demo/prospect -> create account -> verify -> /welcome -> Continue -> /dashboard with the banner and 6 trial credits (Agent A's flow was already live).
- /demo/pending-admin: pending callout, locked step, disabled sidebar Start with tooltip, locked launchpad, disabled Start on /reviews.
- /demo/trial-admin: no banner.
- Screenshots, light and dark, in `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\b392157a-bf67-4268-9514-2175f34b1704\scratchpad\v2\b\`: `trial-admin-*`, `fresh-welcome-*`, `pending-*`, `start-disabled-sidebar-*`, `start-disabled-launchpad-*`, `start-disabled-reviews-*`.

## Differences from the board
- Greeting in the white `PageHeader` strip, banners are `Callout`, not hand-built boxes.
- Pending "Book a call" is inline text, not a second button (Callout takes one action).
- Breadcrumbs: the crumb has no link, so the lock is a chip next to it on /launchpad only.

## Requests for others
- None blocking. `useStartGate` is imported by deep path (`@/components/organisms/home/useStartGate`) from AppShell, OrderButton, IntakeWidget, CommandPalette and Breadcrumbs to avoid a barrel cycle; coordinator may prefer to move it to `lib/` or `store/`.
- The seeded-org check imports `seedOrgs` into a component (breaks the adapter rule slightly). Cleaner: a `createdInSession` flag on `Org` set by `createOrg` (Agent A's store).
- My dev server on :3102 is still running.

## Open questions
- Should the sample review step count as "done" when opening it from the banner? It does today through the existing hook.

## Coordinator fixes (round 2)
- Sidebar Start, pending: now an element handed to `SidebarAction asChild` (same structure as the enabled link), so icon + label stay on one row at the same height. Expanded uses our Tooltip; collapsed puts the reason in the library tooltip label. Checked in both states (`start-disabled-sidebar-*`, `start-disabled-collapsed-*`).
- Pending callout is two lines: "Usually within one business day. We'll email {email} when your {N} trial credits arrive." then the inline "Book a call" or "Call requested."
- Checklist cost chip: `CreditChip tone="trial"` "2 trial credits" while earned + purchased = 0, else `tone="credit"` "2 credits". No other first-review cost in my files.
- Dev server on :3102 stopped.
