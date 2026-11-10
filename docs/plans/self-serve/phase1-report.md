# Phase 1 report

All paths under `C:\Users\vvrsv\OneDrive\Desktop\parachute\app`. Nothing committed.

## Added
- Template: `src/components/templates/KeycloakFrame.tsx` (calm canvas, theme-aware logo, 420 card, "Secured by Realwired ID", footer, persistent "Keycloak theme reference · RWT-1061" tag)
- Molecule: `src/components/molecules/CodeBoxes.tsx` (6 boxes, auto-advance, paste fills all)
- Auth organisms (`src/components/organisms/auth/`): `CreateAccountForm`, `VerifyCodeForm`, `SignInForm` (+ `DemoAccounts`), `ResetForm`, `MfaForm`, barrel
- Onboarding organisms (`src/components/organisms/onboarding/`): `OrgSetupForm` (+ `WelcomeStepLine`, `WelcomeAside`), `PathChoice`, `PendingState`, `ReadyState`, barrel
- Routes: `src/app/(auth)/layout.tsx`, `(auth)/auth/{create-account,verify,sign-in,reset,mfa}/page.tsx`; `src/app/(onboarding)/layout.tsx` (mounts `DemoDock`), `(onboarding)/welcome/{page,path,pending,ready}`, hook `(onboarding)/welcome/hooks/useWelcome.ts`
- CSS: `.kc-*` and `.wel-*` blocks, `.demo-dock-toggle`, `.ui-seg--block` appended to `globals.css` (tokens only)

## Changed
- `next.config.ts`: `/login` redirects to `/auth/sign-in`; `app/login/page.tsx` deleted. `start/page.tsx` and `UserMenu` sign-out point at `/auth/sign-in`.
- `session.store`: `email`/`name` fields, `verify(who?)` carries the sign-up identity until `/welcome` creates the user.
- `demo.store`: `approvalGate` (persisted in localStorage) + `setApprovalGate` (also flips `flags.approvalGate` on the current org). `DemoDock`: "Staff approval on/off" switch.
- `SegmentedControl`: `block` and `label` props. `lib/pricing.ts`: `needsSalesFirst()`, `approxValue()`.
- Personas: `prospect-sales` now lands on `/welcome?preset=large` (11+ / 200+). `prospect` -> `/auth/create-account`, `pending-admin` -> `/welcome/pending` (already).

## Behaviour
- Create account -> `session.verify` -> `/auth/verify?email=` -> any 6 digits -> `/welcome` -> `createOrg` (new org + new org_admin user, signed in, `loadSessionData`) -> `/welcome/path`.
- Path: size bands decide order and preselection (B2 vs B2b with three slot chips and "Flagged for sales"). Start -> gate on: org set `pending` -> `/welcome/pending`; gate off: `wallet.grantTrial` -> `/welcome/ready`. Book a call -> `org.requestSales` + toast; trial stays available. Pending follows the dock's Approve to ready.
- `/welcome?step=path|pending|ready` creates a demo Harbor Community Bank org if none and jumps.
- Sign-in: identity-first; demo persona email + any password applies the persona and routes to its `entryRoute`; a user created by the sign-up flow also signs in (-> `/dashboard`); anything else gives "E-mail or password is incorrect." Microsoft button = `returning` persona.
- Other routes without a workspace redirect to `/welcome`.

## Verified
- `npx tsc --noEmit`, `npx eslint src --ext .ts,.tsx`: clean (after deleting `.next`).
- Fresh dev server: `/auth/{create-account,verify,sign-in,reset,mfa}`, `/login` (307 -> 200), `/welcome`, `/welcome/{path,pending,ready}`, `/start`, `/dashboard`, `/reviews/review-sample` all 200; dev log has no errors.
- Playwright (`scratchpad/build/walk.py`), zero console/page errors: prospect -> create -> verify (typed 6 digits) -> setup -> path -> ready -> Home; prospect-sales (path shows Talk to us first, "Book the call and continue" -> ready); gate on via dock -> pending -> Approve -> ready; sign-in with unknown email (generic error), demo accounts list, typed persona email -> dashboard; reset; mfa.
- Screenshots in `scratchpad/build/phase1-*.png` (light for every screen, A1/B1/B2 dark), compared with the canvas proofs. One fix round: onboarding logo size, a missing space in the pending copy, radio ring contrast, aside text colour. Server stopped.

## Deferred / differences from the canvas
- "Refresh status" on pending (canvas only) not built; the brief did not list it.
- Pending stages are a small custom `.wel-stage-*` list rather than the library `ProgressStages` (the library version is a long-wait interstitial and did not match the canvas timeline).
- "Add a card now" shows a toast ("Cards open with Billing"); the `/configure/billing` route is Phase 3. "Run your first report" goes to `/dashboard`.
- Dark theme only checked for A1, B1, B2. MFA is not linked from sign-in (reachable at `/auth/mfa?next=`).
- Template chips show only the `.ftl` name (the "RWT-1061" lives in the persistent tag).

## Notes for Phase 2
- A new org's `/dashboard` still shows seeded Meridian-style numbers (Needs my action 3, Completed 22) and `/reviews/review-sample` is scoped to org-hcb, so a freshly created org does not own the sample review. The Phase 2 org scoping / sample visibility must cover runtime-created orgs.
- `approval` is set to `pending` at Start (not at `createOrg`) when the gate is on, so the dock toggle works at any point before Start.
- `session.reset()` still resets mode only; sign-out in `UserMenu` just routes to `/auth/sign-in` (stored persona is re-applied on reload).
- Writing files via long Bash heredocs failed twice with a parse error in this environment; the Write tool worked.
