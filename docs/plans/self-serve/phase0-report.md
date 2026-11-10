# Phase 0 report

All paths under `C:\Users\vvrsv\OneDrive\Desktop\parachute\app`. Nothing committed.

## Added
- Lib: `src/lib/pricing.ts`, `identity-defaults.ts`, `setup-steps.ts`, `demo.ts`
- Stores: `wallet.store.ts`, `onboarding.store.ts` (+ `useSetupSteps()`), `demo.store.ts`, `session-data.ts` (`loadSessionData()`)
- Seeds: `credit-ledger`, `wallet-settings`, `setup-progress`, `demo-personas` (all `src/data/seed/*.seed.ts`)
- UI: `components/organisms/DemoDock.tsx`, `components/providers/ToastHost.tsx`, route `app/demo/[persona]/page.tsx`

## Changed
- `types/domain.types.ts`: new types; `UserRole` = org_admin | approver | reviewer; `User.orgId` (required), `Review.orgId?/sample?`, extended `Org`
- `lib/member-roles.ts`, `MembersPanel` (owner lock = org's first org_admin, "Account holder"), seeds (owner/admin -> org_admin, viewer -> reviewer)
- `collections.ts`, `seed/index.ts`, `mock-adapter.ts` (SEED_VERSION v16)
- `orgs/users/reviews.seed.ts`: org-001, org-hcb, org-cedar, org-lakeside; users user-dr/mo/pn, cr1/cr2, lv1; all 11 existing reviews `orgId: "org-001"`; `review-sample` (org-hcb)
- `session.store` (userId, orgId, role, auth, signIn/verify/signOut; `reset()` still only resets mode), `org.store` (org, fetchOrg, createOrg, patchOrg, requestSales, approve, setFlag; bankPolicy untouched), `users.store` (org-scoped `users` + `allUsers`, `fetchUsers(force)`), `reviews.store` (fetch scoped by session org; addReview stamps orgId)
- `lib/current-user.ts` (`useCurrentUser/useCurrentOrg/getCurrentUser/getCurrentOrg`, old consts kept); OrgCard, UserMenu, dashboard greeting switched
- `SeedProvider` (after seed: `?persona=` read once, else stored persona, else default data load), `AppShell` (mounts DemoDock), `UserMenu` (Switch demo persona + Reset this org), `/start` (persona cards grouped), `Icon.tsx` (+wallet, coins, receipt, shield, mail-forward, gift, bank, user-plus, switch, flask, restore), `globals.css` (appended demo block; `.start` now scrolls, card 520px), `app/layout.tsx` (ToastHost)
- `vendor/realwired-ui-0.1.0.tgz` repacked from `D:/worktrees/ds-now` (1.2 MB vs 113 KB, includes fonts/brand assets); `package-lock.json` updated. Old tarball backup: `scratchpad/build/old-ui.tgz`. tsc stayed clean after repack.

## Verified
- `npx tsc --noEmit` and `npx eslint src --ext .ts,.tsx`: clean.
- Dev server (fresh `.next`): `/start`, `/dashboard`, `/reviews`, `/demo/trial-admin`, `/demo/payg-admin-low`, `/configure/organization`, `/reviews/review-sample` all 200. Playwright run: no console or page errors.
- Behaviour: `/demo/trial-admin` lands on `/dashboard` as Dana ("Welcome back, Dana", org card "Harbor Community Bank / Bank"); queue shows only the sample review; dock shows "4 credits"; `/demo/payg-admin-low` lands on `/launchpad` as Cedar Ridge; `?persona=reviewer` applied once and URL cleaned (Marcus).
- Screenshots: `scratchpad/build/phase0-start.png`, `phase0-dashboard.png`, `phase0-dashboard-dock.png`, `phase0-sample.png`.
- Server stopped.

## Not exercised
- Reset org, approve, +5 credits, and the UserMenu persona list were not clicked in a browser (typechecked only). Dock panel layout was screenshotted.
- Dark theme of new UI not checked (tokens only).

## Deferred / notes for Phase 1
- Persona entry routes `/auth/*`, `/welcome/*` do not exist yet (404). `/launch/bouncer`, `/configure/security` (setup-step hrefs) also pending.
- `ToastProvider` cannot be imported in the server root layout (class component error), hence the `ToastHost` client wrapper.
- DemoDock is mounted in AppShell only; standalone pages (`/welcome/*`) need it mounted in their layout.
- Setup checklist has 6 steps (branding, layout, checklist, invite, security_pack, sample_review). `SetupStepId` also reserves `first_review`, `tutorial` (unused). Rewarded steps: invite, security_pack, sample_review (1 credit each, cap 3), in `pricing.ts`.
- `approveOrg` (dock) calls `org.approve` then `wallet.grantTrial`; real flow: `createOrg` -> `grantTrial` in `useWelcome`. `createOrg` does not sign anyone in; wallet/progress rows are created lazily on fetch.
- Not yet debiting: `RunModal`/`reviews/[id]` onStart (Phase 3). Sample review is still counted in dashboard "Needs my action" and queue counts (Phase 2 filter).
- `reviews.store.fetchReviews` and `users.store.fetchUsers` now scope by session org; any new per-org store should do the same and be added to `loadSessionData()`.
- In-memory workspace/admin stores (finding dispositions) are not reset by "Reset org".
- Standalone/YouConnect cards on `/start` now apply the `returning` / `enterprise-yc` personas first so no trial identity leaks into them.
- Gotcha: Python without `encoding="utf-8"` corrupted an em dash in `mock-adapter.ts` (fixed); Turbopack reports that as "failed to convert rope into string".
- Remaining `CURRENT_USER` call sites (RunExperience, RunSign, WorkbookPreview, QueueFilters, useReviewQueue "ME", RunModal/order.store assigneeId, profile page) still use the const, as instructed.
