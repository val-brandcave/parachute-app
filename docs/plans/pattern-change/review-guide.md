# Pattern change: review guide for Val (12 Nov 2026)

Branch `feat/pattern-change`, built against `spec.md` with `build-plan.md`. Six commits:
phases 0–5 plus `fix(pattern-change): final review`. Nothing is merged or pushed.

Run it: `cd app && npm run dev`, open http://localhost:3000/prototype. The Prototype Index
lists every screen, its states and the nine flows; `walkthrough.md` is a presenter script
over those flows. Each phase reset demo data once (seed v23, v24): if a page looks stale,
open the scenario popover (state pill, bottom centre) → **Reset org**.

## What changed, per phase

**Phase 0 · Foundation** (`972aa2b`): every number in `lib/pricing.ts` (new trial/earn/pack
constants); `lib/wallet-view.ts` as the one balance derivation; PC-16 spend order (soonest
expiring first); motion tokens (`lib/motion.ts`, `MotionProvider`, confetti); the scenario
core for the prototype controls; the `Illustration` atom and `--ill-*` tokens; mount points.

**Phase 1 · Onboarding** (`81d0acb`): option C org setup on `/welcome` (team size + volume
route to self-serve or enterprise), the invite step (chips, role select, domain check),
book a call, the set-up interstitial, and the Keycloak → onboarding card glide.

**Phase 2 · Get started v4** (`11699ed`): one column, 8 steps in 3 sections, earn pills
(2 credits per finished section, cap 4, 14-day window), pending tracker, all-done card,
welcome line + confetti; header credits pill + popover; Trust Center and Learning Center
rows above Balance; the sample review is URL-only (PC-4).

**Phase 3 · Checkout and billing** (`469a90f`): full-page checkout `/checkout/credits`
(Amount · Payment · Review · Paid, safe return path, Review setup types carried back);
every "Add credits" routes there with the shortfall prefilled; Billing band and states
(low, zero, held, invoiced), auto-reload offer, How credits work tab, Usage donut.

**Phase 4 · Lock-then-explain** (`1329e7e`): `LockDialog` over everything (z 140, above the
review); every Start site explains on click instead of greying out; credits short/zero
dialogs with "Run Technical only" (PC-32); reviewer credit requests end to end.

**Phase 5 · Help and prototype controls** (`6f993fb`): react-joyride tours (first-review
tour in the takeover, page tours with header chips); Trust Center and Learning Center pages;
empty-state videos; the state pill + scenario popover replace DemoDock, `/start` and the
persona switcher; the Prototype Index; AGENTS.md updated.

**Final review fixes**: a whole-branch review found two real bugs, both fixed. (1) Get
started's "Start tour" / "Sign workbook" with no review of your own opened "Only admins can
buy credits"; it now opens its own "Run a review first" dialog with Upload. (2) An invoiced
reviewer's numbers disagreed (popover 0, table listing teammates' reviews); all three now read
one derivation filtered to the reviewer. Also: one `checkoutBlock()` rule for the launcher and
the checkout page, dead wallet API removed, the popover's Ask explains when a request is
already sent. Details in `reports/final-review-fixes.md`.

## Routes and personas to try

Presets are one click from the state pill's Scenario menu or the Index; `/demo/<id>` also works.

| Preset (`/demo/<id>`) | Try |
|---|---|
| `prospect` → `/auth/create-account` | Sign-up, verify (any 6 digits but 000000), `/welcome` self-serve (wand) |
| `prospect-sales` | `/welcome` enterprise (Shift-wand), book a call |
| `pending-admin` | Get started held state; every Start explains "after your call"; Approve now in the popover |
| `trial-admin` (Harbor, default) | `/get-started`, `/reviews`, a review + the tour, `/trust`, `/learn` |
| `self-serve-low`, `self-serve-zero` | Header pill tones, Billing low/zero, Start → credits dialog → checkout with the shortfall |
| `payg-admin-low` | Short at Start: "You need 1 more credit", Run Technical only |
| `reviewer`, `reviewer-request-waiting` | Reviewer can't buy: Ask the admin; admin sees the request card in the popover |
| `approver` | Get started rows that need a review of your own |
| `returning`, `invoiced-reviewer` | Invoiced: no credits to buy, usage only |
| `enterprise-yc` | YouConnect embedded run |
| `bonus-ending`, `bonus-closed`, `enterprise-call-booked`, `enterprise-confirmed` | Billing and Get started edge states |

Check in light and dark (user menu), at 1440 and 390.

## Known gaps

- **Mobile shell:** at 390 px the sidebar stays open (desktop-first, pre-existing).
- **Legacy persona pill state:** the nine old `/demo/<id>` aliases keep their seeded org
  (Lakeside, Cedar). The pill shows the preset's state, not the alias's data (e.g. Cedar's
  empty Reviews while the pill says "Populated"). Use the non-legacy presets for state demos.
- **Dev-only console warning:** a hard load of a `/welcome` step logs a React "unique key"
  warning from Next's Turbopack devtools. It doesn't occur under `next dev --webpack` or in
  production; smoke ignores that exact message.
- **Placeholders:** Trust documents, video files and illustrations in some spots are
  placeholders until Realwired supplies content. Thumbnails for the Index aren't generated.
- **Hand-off notes (minor, not reachable today):** `useWelcome` writes through the adapter
  (should move into `users.store`); the header pill's 30-day pace window uses the time of
  first mount (no shared clock yet); section awards and setup completions aren't serialised
  if two land at once.
- **Smaller deferred items** (all minor, none visible in a normal demo): invoiced usage reads
  every review in local data without an org filter (pre-existing); the request card never
  shows in the invoiced/held admin popover; "Ask Dana" on the approval dialog leaves no
  record; the fill wand's registry flags can drift from the forms; RoutingNote hard-codes
  the 11+ / 200+ band ids; Sign-in's inline error lacks `aria-invalid`; a second identical
  `?s=` link in the same tab is ignored; no state is marked "planned" yet, so the Index's
  "not built yet" toast has nothing to show; Index thumbnails aren't generated
  (`scripts/proto-thumbs.mjs` needs Node Playwright).

## Open questions

- **For Realwired:** PC-30 to PC-38, Q-E17 and Q-E18 are in
  `client-questions-addendum.md`. They belong in `parachute-v2-client-questions.md`, which
  has your pending edit and wasn't committed; fold them in when ready.
- **For you at the walkthrough:** every "Accepted for build, revisit at walkthrough" decision
  in spec §2 (PC-1, PC-12, PC-16 spend order among them).
- **Pill position:** it sits at the bottom centre, not the top as spec §6 drew it. At the top
  it covered the header and the tab bands.

## Rulings I made (from the build ledger)

- HCB's real debit sits on 220 Commerce Way, not 4410 Bayside (that is the sample review).
- HCB trial and setup dates are relative to load (now − 2 days), so "12 days left" always holds.
- Get started shows for trial, pay-as-you-go, and invoiced orgs that asked sales (`setupEligible`).
- Section rewards check the earn window when a step completes; enterprise orgs earn nothing
  before approval.
- `?motion=1` sticks for the session (for recording demos).
- The invoiced balance and usage read the same derivation as the header pill (RF3).
- Checkout Back/Exit carry the review types back to Review setup.
- The Esc guard in the review ignores Esc while any dialog is open.
- "Own review" for the first-review tour means the org's own non-sample review, not the
  signed-in user's.
- The Learning catalog adds "How a review works" and "Mapping a checklist" (the empty states
  use them).
- The fill registry lives in its own small store (`proto-fill.store.ts`).
- No seed bump for the phase 5 fixtures (built on apply, never seeded).
- The client-questions items went to an addendum file (your standing rule on that doc).
