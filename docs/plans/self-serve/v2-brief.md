# Self-serve v2 — build brief (9 Nov 2026)

Branch: `feat/self-serve-onboarding-v2` (cut from `feat/self-serve-onboarding` at `a166e8b`; foundation commit `e95a43d`). Val will compare the two branches side by side before anything merges. **Do not commit, push, stash, reset or switch branches** — the coordinator commits.

App: `C:\Users\vvrsv\OneDrive\Desktop\parachute\app`. Read `app/AGENTS.md` first (tokens, atomic design, adapter rule, portals, no mono, light + dark). Its self-serve section explains the wallet ledger, spend order, setup steps and demo personas.

## What Val decided (9 Nov)

1. **Onboarding is one card, then the dashboard.** `/welcome` is the only setup screen. "How you'll get started" (`/welcome/path`) and "Ready" (`/welcome/ready`) go. For 11+ reviewers or 200+ reports a month, an optional "Talk to us / Book a call" box appears **inside the same card**. Continue goes to `/dashboard`.
2. **Approval wait:** self-serve teams are approved instantly. Only sales-flagged orgs (`needsStaffApproval(profile)` in `lib/pricing.ts`) wait, and they wait **on the dashboard** in a pending state (sample open, setup steps doable, Start a review disabled, trial credits arrive on approval). The `/welcome/pending` page goes.
3. **Arrival:** the dashboard shows a **one-time** "ready" banner (trial credits added, open the sample). Dismissible, never shown again for that user.
4. **Wallet:** no composition bar anywhere. Home wallet card = big number + "about N full reviews" + ONE sentence (trial and earned are used first; next expiry). A bar only during an all-trial balance, where it is real progress ("4 of 6 trial credits left"). Billing gets a **"What's in your balance"** breakdown: one row per grant, in the order credits are used, with what is left and when it expires.
5. **Chips = tinted by meaning** (`CreditChip` atom, foundation). A chip for a standalone quantity, price or status; plain text inside sentences, hero figures and table cells. **Legends are never chips.**

## Visual references — intent only

Board sources (HTML you can read): `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\b392157a-bf67-4268-9514-2175f34b1704\scratchpad\variants-canvas\project\` — `Setup-one-card.dc.html`, `Dash-trial.dc.html`, `Dash-pending.dc.html`, `Wallet-options.dc.html`, `Billing-breakdown.dc.html`.

**These boards show WHAT goes WHERE and the copy. They are NOT the look.** Val flagged that they use dated, hand-drawn patterns. Build with the app's real components and layout, e.g.:
- The greeting and "Getting set up · N of 9" stay in the existing **`PageHeader` strip** (`.pagehead`). Never a floating `h1` on the grey canvas.
- Banners are the `Callout` from `@realwired/ui` (see `JoinedCallout` in `FirstRunHome.tsx` for the pattern: `tone`, `action`, `onDismiss`), not hand-built tinted boxes.
- Buttons = `Button` atom; chips = `CreditChip` / `Chip`; icons = `Icon` atom (Tabler); cards = existing `.card` / `.hm-card` / `.bl-card` classes; tables = existing billing table styles.
- No hex values, no inline px layout. Tokens only. Light AND dark must both read well.

## Foundation (already on the branch — use, don't fork)

- `CreditChip` atom (`@/components/atoms`): tones `credit | trial | money | free | low`, sizes `sm | md`. CSS `.cchip*` at the end of `globals.css`.
- `lib/wallet-breakdown.ts`: `balanceGrants(ledger)` → grants in spend order with `remaining`, `useOrder`, `expiresAt` (trial never expires; earned `EARNED_LIFE_DAYS`; purchased `PURCHASED_LIFE_MONTHS`); `nextExpiring(grants)`.
- `needsStaffApproval(profile)` in `lib/pricing.ts`.
- `useApprovalPending()` from `@/store` — true while `org.approval === "pending"`.

## Workstreams and file ownership (strict)

Edit ONLY files you own. Need a change elsewhere? Put it under "Requests for others" in your report; the coordinator integrates. `globals.css` is shared: add your CSS as a clearly marked section, **use the Edit tool only** (never Write/sed/python on it), re-read right before each edit, and don't touch other sections.

### A — Onboarding (one card, approval rule, demo plumbing)
Owns: `app/(onboarding)/**`, `components/organisms/onboarding/**`, `store/org.store.ts`, `store/demo.store.ts`, `components/organisms/DemoDock.tsx`, `data/seed/demo-personas.seed.ts`, `data/seed/orgs.seed.ts`, `data/adapters/mock-adapter.ts` (SEED_VERSION only).
- `/welcome`: the one card. Org name, You are a, team size, reports a month, a one-line reassurance (sample + `TRIAL_GRANT_CREDITS` trial credits, no card), Continue ("Continue to Parachute"). No step indicator. Keep today's card shell (it continues the Realwired ID card) and its "What happens next" side note only if it still says something true; otherwise drop it.
- When the answers meet `needsStaffApproval`, show the inline sales box inside the card (Callout or the card's existing option style): one line on why, "Book a call" (records `requestSales`, confirms in place — e.g. "Call requested · we'll email you" — with a toast), and copy that says they can go in now and Realwired confirms larger organizations within one business day.
- Submit: create the workspace with `approvalGate = needsStaffApproval(profile)`; if not gated, `grantTrial()`; then `router.push("/dashboard")`. Gated orgs get `approval: "pending"` and no trial grant.
- `/welcome/path`, `/welcome/ready`, `/welcome/pending`: replace each page with a redirect to `/dashboard` (old links keep working). Delete `PathChoice`, `ReadyState`, `PendingState` and their now-dead CSS/hooks. `?step=` demo jumps: keep `?step=pending` only if trivial (create a gated workspace → `/dashboard`); drop the rest.
- Approval: `approveOrg` (demo dock) must flip approval AND grant the trial (check it already does). Remove the DemoDock "approval gate" toggle and `demo.store` `approvalGate` plumbing — the rule is now the profile. Keep the dock's Approve button for pending orgs.
- Personas: `pending-admin` (Lakeside Valuation) → `entryRoute: "/dashboard"`, its org must be profile 11+ (or 200+), `approval: "pending"`, no trial grant in seed. `prospect-sales` stays `/welcome?preset=large`. Bump `SEED_VERSION`.
- Verify: `/demo/prospect` → sign-up → `/welcome` → Continue → dashboard with credits; `/demo/prospect-sales` → sales box visible → Continue → dashboard pending; `/demo/pending-admin` lands on `/dashboard`; dock Approve grants 6 credits.

### B — Dashboard arrival, pending state, Start gating
Owns: `components/organisms/home/**` (all files — but the wallet card moves to C, see below), `app/(shell)/dashboard/**`, `store/prefs.store.ts`, `components/templates/AppShell.tsx`, `components/organisms/OrderButton.tsx`, `components/organisms/IntakeWidget.tsx`, `components/organisms/CommandPalette.tsx`, `components/molecules/Breadcrumbs.tsx`, `app/(shell)/launchpad/**`.
- **Welcome banner** (one-time, per user): at the top of `FirstRunHome`'s page body, a success `Callout`: "{Org} is ready" + "{N} trial credits added, about {M} full reviews. No card needed." Action "Open the sample review". Dismiss stores `welcomeDismissedBy[userId]` in `prefs.store` (same pattern as `setupHiddenBy`). Show only for an org that is not pending and still has its trial grant unspent-ish (simplest: trial grant exists and the user hasn't dismissed). Seeded `trial-admin` (Dana) should count as already dismissed — don't show it to returning seeded personas; it's for orgs created in this session (check `org.createdAt` vs the seed, or a flag A sets — coordinate via report if needed).
- **Pending state** (`useApprovalPending()`): a warning `Callout` at the top: "Realwired is confirming {Org}" + "Teams your size are confirmed within one business day. We'll email {email}, and your {N} trial credits arrive then. Meanwhile, open the sample review and get set up." Actions: "Book a call" (if not already requested) and "Open the sample review" (Callout takes one `action` — put the second as a ghost/link button in the body or pick the sample as the action; your call, keep it tidy).
- Greeting stays in `PageHeader` ("Welcome, {first}." / "Welcome back, …").
- **Start a review gating** while pending: sidebar Start button (AppShell), `OrderButton`, `IntakeWidget`, launchpad, command palette, breadcrumbs — disabled with a reason ("Opens when your organization is approved"), via Tooltip or helper text, not hidden. The sample stays openable.
- `SetupChecklist`: while pending, the "run your first review" step shows locked ("After approval", `CreditChip tone="low"`) instead of its Start action; other steps stay actionable. Apply `CreditChip` to the checklist's reward/cost pills and to `SampleCard`'s "Free · uses no credits".
- Move the wallet: delete `WalletCard` from `HomeCards.tsx`; in `FirstRunHome` import `WalletCard` from `@/components/organisms/wallet` (C creates it, no props). Until C lands it may not resolve — that's expected.

### C — Wallet card, Billing breakdown, sidebar balance
Owns: `components/organisms/wallet/index.ts` + NEW `components/organisms/wallet/WalletCard.tsx`, `components/organisms/billing/**`, `components/organisms/BalancePill.tsx`, `app/(shell)/configure/billing/**`.
- `WalletCard` (no props; reads stores), exported from the wallet barrel. States:
  - **pending** (`useApprovalPending`): greyed number `TRIAL_GRANT_CREDITS`, "trial credits on the way", dashed empty pips, "They arrive when Realwired confirms your organization, usually within one business day."
  - **all-trial**: big number, "trial credits · about M full reviews", pips = real progress (`remaining of TRIAL_GRANT_CREDITS`), line "X of 6 left. Finish setup to earn up to {EARN_CAP_CREDITS} more.", link "Add a card".
  - **low** (balance < cost of a full review): `CreditChip tone="low"` "Low" in the header, "{n} credit · not enough for a full review", a sentence, "Add credits" → `openTopUp({ reason: "low_balance", needed })`.
  - **mixed / paid**: big number, "credits · about M full reviews", ONE sentence from `balanceGrants` + `nextExpiring` (e.g. "Trial and earned credits are used first. Next expiry: 1 earned credit on 5 Feb 2027." / "Nothing expires soon."), link "See what's in your balance" → Billing.
  - Header "Wallet" + "Billing" link as today. No bar, no legend.
- **Billing → Overview → Balance card** becomes "What's in your balance": number + "about M full reviews · worth about $X" (admins only), the spend-order sentence, and a table from `balanceGrants`: Used (order number) · Credits from (`CreditChip`: trial/free/credit + a muted sub-line: granted date, setup step, or "Bought {date} by {name} · $X") · Left ("1 of 6") · Expires (date or "No expiry"; `CreditChip tone="low"` "in N days" when ≤ 14 days from `DEMO_TODAY`). Hide fully used grants behind a "Show used" toggle or omit them. Keep `AutoReloadCard` and `PaymentMethodsCard` beside/below — re-lay the three-up row so the breakdown gets the width it needs. `ReviewerBilling`: same table without dollars.
- Remove the meter/legend from `BalanceCard`; update `expiryLine` to use `balanceGrants`/`nextExpiring` (or replace its callers).
- `BalancePill`: `CreditChip` — all-trial → `trial` "6 trial"; mixed → `credit` "13 credits"; low → `low` "1 credit"; pending → `low` "Pending". Delete dead `.sb-balance-chip`/meter CSS only if nothing else uses it.

### D — Chips in the run, top-up and receipt
Owns: `components/run/**`, `components/organisms/wallet/TopUpModal.tsx`, `components/organisms/wallet/ReceiptDialog.tsx`.
- Apply the chip rule with `CreditChip`: run cost summary / Start footbar ("This review uses [2 credits] [~$300] | Balance after [11 credits]"), review-type picker rows ([1 credit] [~$150]), top-up packs (credits = `credit`, price = `money`, savings note = `free`), receipt line items where a standalone amount sits. Plain text inside sentences and table cells.
- Then grep the rest of `src/` for ad-hoc credit/price pills (`su-pill--cost`, `su-pill--earn`, hand-rolled credit spans) in files you do NOT own and list them (file:line + suggested tone) in your report for the coordinator.

## Every agent

- Use model-appropriate care: read the files you change in full first; match existing code style.
- Own dev server: from `app/`, `NEXT_DIST_DIR=.next-<a|b|c|d> npx next dev -p 310<1|2|3|4>` (A 3101, B 3102, C 3103, D 3104). Port 3000 is Val's — never stop it. Never kill node processes you didn't start. `next dev` with NEXT_DIST_DIR rewrites `app/tsconfig.json`: leave it; the coordinator restores it.
- Demo entry points: `/start`, `/demo/prospect`, `/demo/prospect-sales`, `/demo/pending-admin`, `/demo/trial-admin`, `/demo/payg-admin-low`, `/demo/reviewer`. Personas share one localStorage per origin, so your port is isolated from the others.
- Screenshots (Playwright, 1440×1000, light AND dark — dark via `document.documentElement.dataset.theme = "dark"`) to `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\b392157a-bf67-4268-9514-2175f34b1704\scratchpad\v2\<a|b|c|d>\`. Look at them against the board for the same spot and fix what's off (one or two rounds). Write screenshot scripts in that folder, not in the repo.
- Before reporting: `npx tsc --noEmit` and `npx eslint src --ext .ts,.tsx` from `app/` — clean for your files (another stream's in-flight breakage is OK; name it). Hit your routes (200, no console errors).
- Write `docs/plans/self-serve/v2-report-<a|b|c|d>.md`: changed files, behaviour, verified, differences from the board and why, requests for others, open questions. Reply with a short summary + screenshot paths.
- Copy: plain, short, no em-dash overuse, numbers from `lib/pricing.ts` only.
