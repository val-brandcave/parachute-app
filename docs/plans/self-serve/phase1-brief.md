# Phase 1 — Keycloak-styled auth pages + org setup (prototype)

Repo `C:\Users\vvrsv\OneDrive\Desktop\parachute`, app in `app/`, branch `feat/self-serve-onboarding` (checked out). Do NOT commit, push or switch branches. Never `git add` anything under `docs/meetings/`. Windows + Git Bash; never redirect to `nul`. Write Python files with `encoding="utf-8"` (a non-UTF-8 write corrupted a file in Phase 0).

## Framing
A polished prototype with fully mocked data and logic. Make it look and flow right; numbers come from `src/lib/pricing.ts`; no backend concerns.

## Read first
1. `app/AGENTS.md` (house rules). Check `app/node_modules/next/dist/docs/` before using any Next API you're unsure of (route groups, redirects, `useSearchParams` + Suspense).
2. `docs/plans/self-serve/phase0-report.md` — what exists now (stores, personas, `session.signIn/verify`, `org.createOrg/requestSales/approve`, `wallet.grantTrial`, DemoDock, `loadSessionData()`).
3. `docs/plans/parachute-self-serve-onboarding-spec.md` §2, §4, §5 and `docs/plans/self-serve/screens-spec.md` Flow A and Flow B (exact copy, cast, states).
4. `docs/plans/self-serve/prototype-route-audit.md` §2.1, §2.2, §4, §5.
5. Visual reference — the approved canvas boards (light; each also has a `-dark` twin) as HTML files in `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\18a37024-3495-423c-bd1f-7e1fe12e2a4b\scratchpad\canvas\project\` and their renders in `…\scratchpad\canvas\proof\`: `A1-create-account`, `A2-verify`, `A3-sign-in`, `A4-reset`, `B1-org-setup`, `B2-path`, `B2b-talk-to-us`, `B3-pending`, `B4-ready`. LOOK at the PNGs (`--light` and `--dark`). Match them; they were built from the prototype's own measurements, so the app's existing classes (`.login-*`/start canvas, `.field`, `.ui-input`, `.ui-btn`, `SegmentedControl`) should get you there. Reuse; add new `.kc-*` / `.wel-*` classes in `globals.css` on tokens only.

## Build
1. **`(auth)` route group** — `app/src/app/(auth)/layout.tsx` with a `KeycloakFrame` template (`components/templates/KeycloakFrame.tsx`): the calm start/login canvas, theme-aware logo, one 420 card, "Secured by Realwired ID" line, footer "Realwired · Help · Privacy", plus a small persistent tag "Keycloak theme reference · RWT-1061" so devs know Parachute never renders this in production. Pages:
   - `/auth/create-account` (A1): work email, full name, password (helper "12 characters or more"), Create account, "or", Continue with Microsoft (`MicrosoftGlyph`), "Already have an account? Sign in". Submit → `session.verify` flow → `/auth/verify?email=…`.
   - `/auth/verify` (A2): 6 code boxes (auto-advance, paste fills all), Verify email, Resend code with a countdown, "Wrong address? Go back". Any 6 digits pass → `/welcome`.
   - `/auth/sign-in` (A3): identity-first email → Continue → password step (same card, "Not you?", "Forgot password?"). Under the card a quiet "Demo accounts" disclosure listing the signed-in personas (email shown); picking one or typing its email + any password signs in as that persona via `applyPersona` and routes to its `entryRoute`. Unknown email → the generic "E-mail or password is incorrect." (no enumeration).
   - `/auth/reset` (A4): email → "If that address has an account, a link is on its way."
   - `/auth/mfa`: 6-digit authenticator code card (simple; reuse the verify boxes).
   - `/login` → redirect to `/auth/sign-in` (keep the file as a redirect, or a `next.config.ts` redirect). Update `UserMenu` sign-out and anything else pointing at `/login`.
2. **`(onboarding)` route group** — `app/src/app/(onboarding)/layout.tsx` (standalone canvas, logo top-left, footer; mount `DemoDock` here too), hook `welcome/hooks/useWelcome.ts`, components in `components/organisms/onboarding/`:
   - `/welcome` (B1): step line "1 of 2 · Organization"; Organization name; "You are a" Bank or lender / Appraisal firm; reviewers Just me / 2–10 / 11+; reports Under 50 / 50–200 / 200+ (SegmentedControl `block`); helper "This only decides how we help you get started."; left aside "What happens next" on wide screens. Continue → `org.createOrg(profile)` (signs the prospect in as org_admin of the new org) → `/welcome/path`.
   - `/welcome/path` (B2 / B2b): two option cards; order and preselection depend on the bands (11+ or 200+ → "Talk to us" first + a "Flagged for sales" chip, B2b, with three time-slot chips under Book a call). "Start now with N trial credits" → if `org.flags.approvalGate` → `/welcome/pending`, else `wallet.grantTrial` → `/welcome/ready`. "Book a call" → `org.requestSales` + a toast "We'll be in touch", trial stays available.
   - `/welcome/pending` (B3): ProgressStages (Account created ✓ · Organization details ✓ · Approval active · Trial credits pending), warning status pill "Pending approval", "Open the sample review" (→ `/reviews/review-sample`), "Add a card now" link, "Need it sooner? Talk to us". DemoDock "Approve" advances it → `/welcome/ready`.
   - `/welcome/ready` (B4): "<Org> is ready", `N trial credits` chip (dashed), "~$X value", two option cards (Open the sample review / Run your first report), link "Add a card now", primary "Go to Home" → `/dashboard`.
   - `?step=path|pending|ready` on `/welcome` jumps for demos.
3. **Personas**: make the `prospect` persona land on `/auth/create-account` (fresh, signed out), `prospect-sales` on `/welcome` with 11+/200+ preset, `pending-admin` on `/welcome/pending`. Add an `approvalGate` toggle to the DemoDock ("Staff approval: on/off") so both B2 outcomes can be shown.
4. Breadcrumb/command-palette labels for the new routes where they apply (standalone pages have none; just make sure nothing crashes).

## Done means
- `npx tsc --noEmit` and `npx eslint src --ext .ts,.tsx` clean.
- Fresh `.next`, dev server; all new routes + `/login` redirect + `/start` + `/dashboard` return 200 with no server errors.
- Playwright walkthrough (Python; see `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\18a37024-3495-423c-bd1f-7e1fe12e2a4b\scratchpad\kit\tools\proof.py` for the setup): `/demo/prospect` → create account → verify (type 6 digits) → org setup → path → ready → Home; plus `/demo/prospect-sales` → path shows Talk to us first; plus gate on → pending → Approve → ready; plus sign-in with a demo account. Screenshot each screen in light, and B1 + A1 in dark, to `docs/plans/self-serve/phase1-shots/` is NOT allowed (keep screenshots out of the repo) — save them to `…\scratchpad\build\phase1-*.png`. LOOK at them next to the canvas proofs and fix visible differences (one or two rounds).
- Stop the dev server. Write `docs/plans/self-serve/phase1-report.md` (files added/changed, verified, deferred, notes for Phase 2). Reply with a concise summary.
