# v2 report, stream A (onboarding, approval rule, demo plumbing)

## Changed files
- `app/src/app/(onboarding)/welcome/page.tsx`, `hooks/useWelcome.ts`: one card; `WelcomeAside` dropped (it repeated the new reassurance line).
- `app/src/components/organisms/onboarding/OrgSetupForm.tsx`, `index.ts`: no step line; reassurance line or inline sales `Callout`; button "Continue to Parachute".
- `welcome/path|ready|pending/page.tsx`: now `redirect("/dashboard")`.
- Deleted: `PathChoice`, `PendingState`, `ReadyState`, `useWelcomePath/Pending/Ready`, `CALL_SLOTS`, `useWorkspace`.
- `store/demo.store.ts`, `DemoDock.tsx`: `approvalGate` plumbing and the dock toggle removed. `approveOrg` already flips approval and grants the trial.
- `store/org.store.ts`: comment only (`approvalGate` input is now fed by `needsStaffApproval`).
- `data/seed/orgs.seed.ts`: Lakeside is 11+ / 50-200, `salesRequested`, pending, no trial. `demo-personas.seed.ts`: `pending-admin` entry `/dashboard`. `mock-adapter.ts`: SEED_VERSION v21.
- `globals.css`: removed dead `.wel-steps/.wel-dash/.wel-aside/.wel-opt*/.wel-slot*/.wel-go/.wel-stage*` etc. and `.demo-dock-toggle*`; added `.wel-sales`, `.wel-reassure`.

## Behaviour
- Submit creates the workspace with `approvalGate = needsStaffApproval(profile)`. Not gated: `approval: "none"`, `grantTrial()`. Gated: `approval: "pending"`, no grant. Then `/dashboard`.
- Sales box shows when team is 11+ or volume is 200+. "Book a call" confirms in place (box copy changes, toast "Call requested"); the org is created with `profile.salesRequested = true` if it was pressed (no org exists before submit).
- `?step=pending` kept: creates a gated 11+ workspace and goes to `/dashboard`. Other `?step=` values dropped.

## Verified (port 3101)
- tsc and eslint clean for my files.
- `/demo/prospect` -> `/welcome` -> Continue -> `/dashboard`, "6 trial credits".
- `/demo/prospect-sales` -> sales box (and booked state) -> Continue -> `/dashboard`, pending callout (B's) and Wallet "6 trial credits on the way".
- `/demo/pending-admin` lands on `/dashboard`; `/welcome/path|ready|pending` all redirect to `/dashboard`.
- Dock Approve: balance 0 -> 6 credits. No console errors.
- Screenshots: `scratchpad/v2/a/` (welcome small/large/booked, light and dark; dashboards; dock).

## Differences from the board
Board used hand-drawn tinted boxes; built with the existing `.wel-card`, `SegmentedControl`, `Callout` (info tone, calendar icon) and `Button`. No board tag labels or step line.

## Requests for others
- B: `welcomeDismissedBy` banner should skip seeded orgs; orgs created by `/welcome` have `approval: "none"` (not `"approved"`) and `createdAt` after the seed epoch, so `org.approval !== "approved"` identifies them if useful.

## Open questions
- Ungated orgs keep `approval: "none"` as before (not `"approved"`); say if the dock Approve should also show for them (it does not).

## Coordinator fixes (9 Nov)
- Sales box is the `Callout` (info tone, calendar icon, Book a call `Button` as `action`); copy is now title + one line. Booked state unchanged.
- Subtitle: "Three quick answers, then you're in."
- Approve stays pending-only. Re-shot welcome-large and welcome-large-booked, light and dark.
