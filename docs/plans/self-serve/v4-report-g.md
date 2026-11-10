# v4 report: Agent G (Get started route, nav, landing)

## Changes
- New `/get-started` page (`app/(shell)/get-started/page.tsx`) rendering `GetStarted` (renamed from `FirstRunHome`, `organisms/home/GetStarted.tsx`): Pending / Welcome / Joined callouts, checklist as main column, Sample, Wallet, IT pack, Guides on the right. Done state ("You're set up", Go to Dashboard) when every step is done. Invoiced orgs and users who hid the guide are sent to /dashboard.
- Rail item "Get started" (rocket icon, tabular "4/9" badge) above Dashboard in `AppShell`, only while `useSetupGuideVisible()` (stage new and not hidden). Collapsed rail shows the library's icon + dot badge.
- `lib/landing.ts` (new): `landingRoute()`, `resolveEntryRoute()`, `setupGuideVisible()`, `useSetupGuideVisible()`. Used by SignInForm, `/demo/[persona]`, `/start`, UserMenu persona switch, `useWelcome` (submit + ?step=pending). Persona entry `/dashboard` resolves through it. Reviewer persona entry changed to `/dashboard` (so it lands on Get started); payg-admin-low stays on `/launchpad` on purpose (shows the Start block).
- User menu "Setup guide" now unhides and goes to /get-started. Earned-credit toast "View" goes to /get-started. Breadcrumb and command palette ("Get started" while visible) added.
- `SetupChecklist`: removed the `#setup` scroll effect and the `id`-driven hash logic.

## Dead code removed
`SetupDock.tsx` and its `.sb-dock*` / `.sb-bar*` CSS, `RecentReviews` + `pillFor` + `.hm-recent*` CSS, the `FirstRunHome` name and export. (`FIRST_RUN_STATBAR_MIN` in `lib/setup-steps.ts` is untouched: I don't own that file's other users, Agent D drops its dashboard use. Safe to delete at integration.)

## Verified (Chrome, light + dark, 1440x900, zero console errors, tsc + eslint clean)
new org after /welcome, trial-admin (expanded + collapsed), reviewer, pending-admin, payg-admin-low (lands on /launchpad, rail item present), returning (invoiced: no rail item), hide (toast, redirect to /dashboard, rail item gone), user menu Setup guide (back to /get-started, rail back), all-done state (rail item gone).
Screenshots: `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\b392157a-bf67-4268-9514-2175f34b1704\scratchpad\v4\g\` (trial-admin, trial-admin-collapsed, new-org, reviewer, pending-admin, payg-admin-low, returning, after-hide-dashboard, usermenu-light, done; -light/-dark).

## Cross-file asks / open questions
- `app/(auth)/auth/mfa/page.tsx` defaults `next` to /dashboard and `app/(onboarding)/welcome/{path,pending,ready}/page.tsx` redirect to /dashboard: not in my list; swap to `landingRoute()` if those flows matter.
- `app/bouncer/return-path.ts` DEFAULT_RETURN and `INVITE_HREF` (`setup-steps.ts`) still return to /dashboard; fine, but could be /get-started.
- Collapsed-rail tooltip reads "Get started" (the library owns it); the count isn't in the tooltip.
- I used `git mv` / `git rm`, so those renames are staged; nothing committed.
