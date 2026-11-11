# Parachute: current state (audit, 11 Nov 2026, main @ f1b8bcf)

Paths are under `app/src/`. This is a condensed version of the read-only audit.

## Demo states
- 9 personas (`data/seed/demo-personas.seed.ts`):
  - prospect, prospect-sales
  - pending-admin (Lakeside)
  - trial-admin (HCB). Note it holds 13 credits including a purchased pack, so it isn't a pure trial.
  - payg-admin-low (Cedar)
  - reviewer, approver
  - returning (invoiced)
  - enterprise-yc
- Store: `store/demo.store.ts`. Seed version is v22 (`data/adapters/mock-adapter.ts:45`).
- Ways in:
  - `/start` launcher page
  - `/demo/<id>`
  - `?persona=`
  - the user menu "Switch demo persona"
  - the sign-in "Demo accounts" panel
  - **DemoDock**: a floating flask chip (`components/organisms/DemoDock.tsx`) with Reset org, Approve, Complete next step, +5 credits, Low balance, Personas, E-mails and Show build notes. It is not on the auth pages.
- **No per-page state switcher.** These states have no toggle at all:
  - trial expiring or expired
  - credits expiring
  - back to pending
  - invoiced ↔ trial
  - zero balance
  - auto-reload on
- Entry routing is inconsistent. The user-menu switcher and the sign-in panel skip `resolveEntryRoute`.

## Auth and onboarding
- Keycloak-framed pages under `app/(auth)/auth/*`: create-account, verify (6-digit code), sign-in (identity-first), reset. mfa exists but nothing links to it.
- `/welcome` is one card (`OrgSetupForm.tsx`) asking for:
  - org name
  - Bank or lender / Appraisal firm
  - reviewers: Just me / 2–10 / 11+
  - reports a month: <50 / 50–200 / 200+
- Normal orgs see the callout "You start with a free sample review and 6 trial credits. No card needed." This is the orphan Cody flagged.
- 11+ reviewers or 200+ reports a month shows an optional "Book a call" callout. It is a toast only, with no scheduler. The org is created as `approval: pending`.
- **No invite step in onboarding.** Invite is checklist step 8 and goes to the Bouncer mock (`/launch/bouncer`).

## Get started (`/get-started`, `components/organisms/home/GetStarted.tsx`)
- Banners: PendingCallout, WelcomeCallout (with "Open the sample review"), JoinedCallout.
- `SetupChecklist.tsx`:
  - "N of 9" progress and "Earn up to 3 credits".
  - An Up next panel with a CTA, "Skip for now" (lasts only for the session) and a GuidePlayer video on the right.
  - Two groups, "First review" and "Ready for your team".
  - **Row actions only appear on hover**: `setup-checklist.css:285-308`, opacity 0 until :hover or :focus-within.
  - The reward is shown as a "🪙 +1" chip.
- Steps (`lib/setup-steps.ts`): sample_review, first_review, sign_workbook, bank_policy(+1), security_pack, checklist(+1), layout(+1), invite. The rewards cap at 3.
- Side cards (`HomeCards.tsx`): SampleCard, WalletCard (5 variants), SecurityPackCard (7 docs), GuidesCard.
- Routing: `lib/landing.ts` sends users to `/get-started` while setup is unfinished.

## Empty states
- `EmptyState`, `EmptyLine` and the Ghost* parts (3-level rule).
- `DashboardFirstRun`:
  - "Your dashboard fills in after your first review"
  - Start is disabled with a tooltip while approval is pending
  - Open sample
  - a 3-step list
- Reviews first run: "No reviews yet" plus a sample row.
- The sample banner's "Run your own report" is not gated.

## Billing (`/configure/billing`)
- Tabs:
  - Admin: Overview / Usage / Invoices / Settings, plus a hidden Plans tab.
  - Reviewer: Overview / My usage.
  - Invoiced: Usage / Invoices / Settings.
- Overview: BalanceHero (auto-reload chip), runway bar, ExpiryAlert, 4 facts, UsageCard, BalanceCard grant table, recent activity.
- **Add credits is a Dialog** (`components/organisms/wallet/TopUpModal.tsx`):
  - tiles 5/$750, 10/$1,400, 20/$2,600, and a Custom amount of 1–100 at tier rates
  - the card form
  - an auto-reload switch
  - While pending: a note and a **disabled Pay** button.
- Balance appears **only** in the sidebar `BalancePill`, not in the top header.
- Auto-reload rules differ between the dialog and Settings, and the balance is calculated two ways.

## Disabled actions
`START_LOCKED_REASON` "Opens when your organization is approved" covers:
- the sidebar Start button
- OrderButton
- DashboardFirstRun
- the Launchpad dropzone
- the command palette
- the "After approval" chip on the checklist

The tooltips are wrapped around native disabled buttons, so they may never show on hover.

## Learning content
- `lib/guides.ts`: 3 videos, all the same placeholder clip, and 2 real PDFs.
- Videos appear only in Up next and the Guides card.
- **No tour library, help centre, learning centre or trust centre.** The Support menu item and the bell do nothing.
- Security pack: `lib/security-pack.ts` lists 7 docs, but no files exist. `/configure/security` is the closest thing to a trust centre.

## Shell
- Sidebar: Start a review, then Get started (x/9 + bar), Dashboard, Reviews. The footer holds BalancePill and OrgCard, which leads to the /configure hub.
- Header: breadcrumbs, ⌘K search, bell, user menu.

## Design system (@realwired/ui 0.1.0, vendored)
- **Has:** Dialog, AlertDialog, Sheet, Popover, Toast, Tooltip, Callout, EmptyState, ProgressStages, Accordion, Disclosure, OptionCard, StepLine, StepRail, TaskFlow, SegmentedControl, StatusPill.
- **Missing:** Progress/Meter, a checklist widget, a tour/coachmark, a video player, a pricing-tile group.
- Icons are Tabler.
- No tour library is installed. The sibling project vendors-circle uses shepherd.js.

## LedgerWise precedents (`Desktop/ledgerwise-app`)
- `NullStateHero` (`components/molecules/NullStateHero`): empty list = title + one CTA + a video thumbnail that opens a modal, with a feature grid below. Used on every list and tab.
- `DemoModeToggle`: a header toggle "Demo: Empty | Data".
- `GetStartedContext`: steps with minute estimates; confetti; welcome modal.
- `FundingWelcomeModal`: a one-time multi-step modal when the state changes. Its "seen" flag is stored in sessionStorage.
