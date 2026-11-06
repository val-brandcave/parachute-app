# Phase 2 — First-run Home, setup checklist, sample review, security pack (prototype)

Repo `C:\Users\vvrsv\OneDrive\Desktop\parachute`, app in `app/`, branch `feat/self-serve-onboarding` (checked out). Do NOT commit, push or switch branches. Never `git add` anything under `docs/meetings/`. Windows + Git Bash; never redirect to `nul`. Write Python files with `encoding="utf-8"`. Long Bash heredocs failed in Phase 1; use the Write tool for files.

## Framing
A polished prototype with fully mocked data and logic. Make it look and flow right. Every number (credits, thresholds, rewards) comes from `src/lib/pricing.ts`; nothing hard-coded in copy. Backend dependencies get one line in the report, never a blocker.

## Read first
1. `app/AGENTS.md` (house rules). Check `app/node_modules/next/dist/docs/` for any Next API you're unsure of.
2. `docs/plans/self-serve/phase0-report.md` and `phase1-report.md` — what exists (stores `wallet`, `onboarding` + `useSetupSteps()`, `demo`, `session`, `org`; `loadSessionData()`; `DemoDock`; `ToastHost`; personas; `lib/setup-steps.ts`; `lib/current-user.ts`).
3. `docs/plans/parachute-self-serve-onboarding-spec.md` §2 (Earned, Checklist, Education rows), §5, §8 and `docs/plans/self-serve/screens-spec.md` Flow C and Flow F (exact copy, cast, states).
4. Visual reference — approved canvas boards (each has a `-dark` twin), HTML in `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\18a37024-3495-423c-bd1f-7e1fe12e2a4b\scratchpad\canvas\project\` and renders in `…\canvas\proof\`: `C1-home-fresh`, `C2-home-progress`, `C3-sample-review`, `C4-dock`, `F1-security-pack`, `F2-security-sent`. LOOK at the PNGs (`--light` and `--dark`). The boards were built from the prototype's own measurements, so existing classes (page band, `.card`, dashboard grid, sidebar, `.ui-btn`, `Chip`, `StatusPill`, `FileRow`, Callout) should get you there. Reuse first; new classes in `globals.css` on tokens only (no mono, navy primaries, petrol for links/focus, small captions in ink-2).

## Build

### 1. Setup steps aligned to the spec (`lib/setup-steps.ts`, `lib/pricing.ts`, `types`)
Replace the Phase 0 list. Two groups, in this order, copy from C1:
- **First review**: `sample_review` Open the sample review (Free, ~2 min, ▶ What you'll get · 1:10, **Open sample**) · `first_review` Run your first report (cost chip = `costFor(both types)` credits, ~10 min, ▶ Upload and start · 1:15, **Upload** → opens the existing Start a review flow) · `sign_workbook` Sign your first workbook ("Only approvers sign. <approver first name> can, or make yourself an approver.", ~3 min, "Tick only").
- **Ready for your team**: `bank_policy` Upload your bank policy (+1 credit, ~3 min, ▶ Why policy matters · 0:50, **Upload** → wherever the org's bank policy is uploaded today) · `security_pack` Send the security pack to your IT team (No credit, ~1 min, "What's in the pack", **Send** → `/configure/security`) · `checklist` Publish your compliance checklist (+1 credit, ~12 min, ▶ Mapping a checklist · 1:30, ⤓ Admin guide PDF, **Start** → `/configure/checklists`) · `layout` Publish a custom workbook layout (+1 credit, ~5 min, **Start** → `/configure/workbook-layouts`).
- "Account created · <name>, <date time>" is a pre-ticked done line at the top (it counts as done). The header count is derived from the list length (day one = "1 of 8"); the canvas said "of 6" before the layout step was added — note this in the report.
- `SETUP_REWARD_STEPS = ["bank_policy", "checklist", "layout"]`, `EARN_CAP_CREDITS` 3 (spec §2). Add to `SetupStepId`: `account`, `sign_workbook`, `bank_policy`; keep `branding`, `invite`, `tutorial` in the type but out of the list. Add step metadata (minutes, video label/length, doc link, side kind: free / cost / reward / none / tick-only) to the step defs, not to components. Add a `FIRST_RUN_STATBAR_MIN = 5` constant (completed reviews before the StatBar appears).
- Each step can show a "doing" state with a meta line (C2: "Priya has it · 220 Commerce Way", "Draft saved · 18 of 24 items mapped") — derive from data where easy, otherwise allow a seeded `inProgress` note in `SetupProgress`.

### 2. Verified completion hooks (call `onboarding.complete(stepId)`; idempotent, award is capped)
`sample_review`: opening `/reviews/review-sample`. `first_review`: starting any non-sample review (hook both `onStart`s; no debit — Phase 3). `sign_workbook`: a review is signed. `bank_policy`: org bank policy uploaded/saved. `checklist`: a checklist published AND set as default. `layout`: a custom workbook layout published. `security_pack`: Send pack on `/configure/security`.
An earned credit shows ONE quiet toast (C2, bottom-right): "<Step done label> — 1 credit added to <Org>." with a **View** action (→ Home), and the sidebar balance ticks. No confetti.

### 3. First-run Home (`/dashboard`)
`useDashboard` derives `orgStage`: `"new"` for trial/payg orgs while setup is not complete and Home isn't dismissed; `"active"` otherwise (and always for invoiced/YouConnect orgs like Meridian org-001, so the `returning` and `enterprise-yc` personas keep today's dashboard unchanged). `new` → `FirstRunHome` (C1/C2):
- Page band "Welcome, <first name>." (C2: "Welcome back, …" once anything beyond Account created is done) + right side "Getting set up · N of M" with a segment bar; no PeriodPicker.
- Left (1.75fr): `SetupChecklist` organism — title, "Earn up to +3 credits for setup" (C2: "N of M done · +X credit earned of up to +3"), ⋯ menu (Hide setup guide). Done line collapses all done steps with who ("by Dana Reyes, Marcus Ortiz") and a Show toggle. Groups with "0 of 3" / "N left". First open step gets the "Next" tag and the primary button; others secondary. Under it, **Recent reviews** (2–3 rows, View all) only once the org has non-sample reviews.
- Right (1fr): See a finished review card · `WalletCard` (big balance, "trial credits"/"credits", "About N full reviews · ~$X value", segmented meter Trial / Earned / Purchased with legend, Billing link → toast "Billing opens in Phase 3" is fine, or `/configure/billing` if it exists) · `SecurityPackCard` "For your IT team" (Download pack → toast; Email to IT → `/configure/security#send`) · Guides card (3 videos + Reviewer/Admin guide PDFs; clicking opens a toast/placeholder, no real media).
- StatBar and TrendChart hidden until `FIRST_RUN_STATBAR_MIN` completed non-sample reviews.
- Sidebar footer: balance pill ("Balance · 6 trial" dashed chip while all trial; "5 credits" filled once mixed) above the OrgCard, for trial/payg orgs; none for invoiced orgs. Check whether Phase 0 already added one before building.

### 4. Checklist dock (C4)
`SetupDock` in the sidebar footer above the balance pill on shell pages other than `/dashboard`, while stage is `new` and the user hasn't hidden it: progress ring N/M · "Getting set up" · "Next: <next step>" · chevron. Click → popover listing the remaining steps with their actions. ⋯ menu: "Hide setup guide" / "Email me this list" (toast) with the note "Hiding is per user; reopens from Help → Setup guide." Hiding is PER USER (store in prefs keyed by user id, not in `SetupProgress`). Add "Setup guide" to the user menu (or the Help menu if one exists) to reopen it.

### 5. Sample review (C3) and counts
- The sample is org-agnostic: every trial/payg org (including orgs created at runtime by `/welcome`) sees `review-sample`; invoiced orgs don't. Do this in the reviews store scoping, not by cloning.
- Exclude `sample: true` from every count: dashboard stats, "Needs my action", queue tab counts, recent reviews, StatBar thresholds. In the queue it shows with a "Sample" chip.
- `/reviews/review-sample`: full-width info banner under the run toolbar: "Sample review · 4410 Bayside Office Park is a fictional property. Explore freely — nothing here uses credits." + ghost **Run your own report** (opens Start a review). Workbook cover marked "SAMPLE". Dark keeps white paper.
- Make sure a fresh org from the `prospect` flow lands on C1 with its own numbers (no seeded Meridian counts).

### 6. `/configure/security` (F1/F2)
New route in `(shell)/configure/security`, a card on `/configure` ("Security pack"), plus the Home card and the Pending page link (B3 "Need it sooner?" stays; add a quiet "Security pack for your IT team" link if natural). Page band "Security pack" + **Send to IT** primary (scrolls/focuses the send card) + ghost **Download all** (toast). Intro line and the 7 FileRows from screens-spec F1 (SOC 2 row: "Request access" + NDA). Right column: **Send to IT** card (email prefilled `it-vendor@<org domain>`, note textarea, **Send pack**, expiry line) · **Known gaps, stated plainly** (placeholder bullets, "Ed owns this content") · Vendor Due Diligence Portal link. Send → success Callout "Sent to <email> · <date time> · link expires <+30 days>" + a "Sent log" list (persist per org, e.g. a field on `SetupProgress` or a small collection) + `complete("security_pack")`. Keep the content strings in one data file (`lib/security-pack.ts`) so Ed can edit them.

### 7. Seeds and personas
- `trial-admin` (Dana, HCB) = the C2 state: done Account created, Sample review opened, First report run (Dana), Bank policy uploaded (+1, Marcus); `sign_workbook` doing ("Priya has it · 220 Commerce Way"); `checklist` doing ("Draft saved · 18 of 24 items mapped"); ledger trial 6 − 2 used + 1 earned = 5 credits; HCB reviews 220 Commerce Way (awaiting signature) and 18 Lighthouse Rd (completed) for Recent reviews. Bump `SEED_VERSION`.
- `prospect` → new org → C1 (1 of 8, 6 trial credits). `payg-admin-low` (Cedar Ridge) shows a sensible mid-setup state. `reviewer` / `approver` see the checklist read-only where an action needs org_admin (admin-only steps say "Ask Dana" instead of a button).
- DemoDock: add "Complete next step" (calls `complete` on the next open step, so the toast + tick can be demoed) next to the existing actions.

## Done means
- `npx tsc --noEmit` and `npx eslint src --ext .ts,.tsx` clean.
- Fresh `.next`, dev server; `/dashboard` (trial-admin, prospect-created org, returning, enterprise-yc), `/reviews`, `/reviews/review-sample`, `/configure`, `/configure/security`, `/welcome/*` return 200 with no server errors.
- Playwright walkthrough (Python; setup in `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\18a37024-3495-423c-bd1f-7e1fe12e2a4b\scratchpad\build\walk.py` and `…\scratchpad\kit\tools\proof.py`), zero console/page errors: `/demo/prospect` → sign-up → org → ready → Home (C1) → open sample (banner, step ticks) → back to Home; `/demo/trial-admin` → Home (C2) → Reviews (dock, popover, hide menu, hide, reopen via Setup guide) → `/configure/security` → Send pack (F2) → toast; DemoDock "Complete next step" earns a credit up to the cap and no further; `returning` persona dashboard unchanged.
- Screenshots at 1440 wide to `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\4be00963-e518-49af-b2bd-03054f97ef4e\scratchpad\build\phase2-*.png` (NOT in the repo): C1, C2 (with toast), C3, C4 (popover open), F1, F2 in light; C1, C3, F1 in dark. LOOK at them next to the canvas proofs and fix visible differences (one or two rounds).
- Stop the dev server. Write `docs/plans/self-serve/phase2-report.md` (added/changed, behaviour, verified, deferred/differences from the canvas, notes for Phase 3). Reply with a concise summary listing the screenshot paths.
