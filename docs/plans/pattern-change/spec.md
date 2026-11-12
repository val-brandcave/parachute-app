# Pattern change: implementation spec (onboarding, Get started, credits, checkout, billing states, Trust and Learning, tours, state controls)

**Status:** reconciled and accepted for build, Nov 11, 2026. Val: "most of it checks out… go ahead and plan, spec and implement". PC-8, PC-24, PC-28 and PC-29 are **confirmed**; every other PC row is **accepted for build, to revisit at the walkthrough**; PC-30 to PC-38 are **proposed** by the reconciliation pass (§11) with the recommended option used here. Nothing is built yet.
**Branch:** `feat/pattern-change`, cut from `main` at `d023d83` (v2 / `feat/self-serve-onboarding-v2` merged via PR #29 on 11 Nov). One commit per build phase (§8).
**Build plan:** `build-plan.md` (this folder): tasks, interfaces, verification and the orchestration for parallel agents.
**Visual source of truth:** `docs/plans/pattern-change/proposed-screens/index.html` (board 1, frames 1–19) and `proposed-screens/part2.html` (board 2). Copy in this spec is taken from those boards. Where this spec changes board copy, the row says so and why. **The boards simplify the real app.** Where a board's drawn chrome differs from the real shell or the real review takeover, build to the real app (§5.0) and the section names the board frame by id.
**Inputs:** `state-system-draft.md` (with its reconciliation note), `review-findings.md`, `icon-map.md`, `illustration-guide.md` (all in this folder); the four reconciliation audits in `reconcile/` (A review surface and locks, B credits and checkout, C shell and design system, D onboarding, Get started and tours); `docs/references/pattern-audit-nov-2026/parachute-current-state.md`; `app/AGENTS.md`; the self-serve spec `docs/plans/parachute-self-serve-onboarding-spec.md`.
**Paths:** relative to `app/src/` unless they start with `app/` or `docs/`. **(new)** marks a file that does not exist yet. Every other path was checked against the tree on Nov 11.

---

## 1. Summary and goals

One column, one direction, one unit. A new customer signs up, answers three questions, sees in the app whether they are routed to self-serve or to a setup call, invites their team, and lands on a one-column Get started page with two earnable sections. Credits sit in the header with a popover that translates them into full reviews. Every blocked action stays clickable and explains itself. Buying credits is a full-page checkout. Billing shows every state. Trust Center and Learning Center are always-available pages linked just above the sidebar Balance row. Empty pages get a short video in place of the ghost preview, key pages offer an opt-in tour, and the prototype gets page-level state controls and an index.

| # | Goal | Measured by |
|---|---|---|
| G1 | Get started reads as one path | One column; one filled navy button per section; no side cards; no hover-only actions |
| G2 | Earning is understood without a legend | Rewards named in full reviews ("Earn 1 free review", "2 credits" beside it); no coin glyph anywhere |
| G3 | Balance is always visible in one unit | Header credits pill + popover on every shell page; sidebar Balance row kept |
| G4 | Nothing is disabled | Every blocked action has `aria-disabled="true"`, a lock or hourglass glyph and a click that opens the reason |
| G5 | Enterprise vs self-serve is decided and visible in-app | `/welcome` shows the rule live and routes enterprise to `/welcome/call` |
| G6 | Any state is one click away | State pill on every registered screen and the Prototype Index at `/prototype` (phase 5); DemoDock personas until then |
| G7 | Buying is calm | Full-page checkout: Amount, Payment, Review, Paid; a saved card skips Payment |
| G8 | Help is always one click away | `/trust` and `/learn` pages; videos in never-used empty states; opt-in tours |

**House rules that apply to every surface** (from `app/AGENTS.md` plus this change):

- [ ] No monospace font anywhere (numbers use Inter with `tabular-nums`).
- [ ] Inputs: white fill in light mode; the existing theme-aware dark override stays.
- [ ] Primary buttons navy (`--grad-primary`); petrol only for accents, links, focus and the one AI cue.
- [ ] Tabler icons through the `Icon` atom (`components/atoms/Icon.tsx`); add new names to its map.
- [ ] No hardcoded content widths; content fills the pane.
- [ ] Never disable an action: click, then explain. `aria-disabled="true"` plus a reason (`aria-describedby`).
- [ ] No hover-only actions. Every row action is visible at rest.
- [ ] `text-wrap: pretty` on short copy (headings, paragraphs, list items, pills, callouts, dialog bodies, button labels that can wrap).
- [ ] Every commercial number from `lib/pricing.ts`; never typed into copy.
- [ ] Tokens only, both themes; every floating layer in a portal with fixed positioning.
- [ ] Reuse before inventing: the real shell slots, `PageHeader` bands, tool strips and `@realwired/ui` parts (Popover, Dialog, Callout, OptionCard, SectionCard, Accordion, FileRow, FactGrid, Tabs, `PageHeader toolbar`). A new variant is built **in the app**, wrapping the DS part where one exists, and carries a `// DS-candidate: <name> — <why>` comment; every one is listed in Appendix A. The vendored `@realwired/ui` tarball is not edited or repacked in this change.
- [ ] New CSS goes in the owning feature's stylesheet (pattern: `setup-checklist.css`, `wallet.css`, `usage.css`), never in another agent's file; `app/globals.css` changes go through the coordinator.

---

## 2. Decisions

"Change" = reverses something already agreed or built. Status values: **Confirmed by Val**; **Accepted for build (11 Nov) — revisit at walkthrough** (built as written, Val re-checks it in the walkthrough); **Proposed (reconcile, 11 Nov)** (a decision the reconciliation audits forced; built with the recommended option unless Val says otherwise).

| ID | Decision | Recommended (used in this spec) | Alternatives | Change? | Status |
|---|---|---|---|---|---|
| PC-1 | Get started pattern | One column; three sections with earn pills and "x of y"; every action visible; next step per section is the filled navy button | Accordion without rewards; keep two columns | Yes (replaces two-column page) | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-2 | Trial and rewards | Trial stays 6 credits (3 full reviews), never expires. Earn 1 full review (2 credits) per finished section, two sections, in the first 14 days | 1 free full review + earn 1 (2 credits trial); 2 free + earn 1 (4 credits trial) | Yes: earn cap 3 → 4 credits, per-section instead of per-step, adds a 14-day earn window | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-3 | Tour reward | Finishing the first-review tour is a step in "Run your first review"; finishing that section earns the review | Separate reward for the tour alone | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-4 | Sample review | Removed from Get started, Reviews and every banner. The tour runs on the customer's own first review. The `review-sample` seed and route stay, unlinked, so old links work | Keep only as a Learning Center tour | Yes: reverses E3 (built in `285dc5b`) | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-5 | Balance location | Add a header credits pill + popover; keep the sidebar Balance row; Trust Center and Learning Center links sit just above it | Header only (Trust and Learning then need a new anchor) | Yes: adds a second balance surface | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-6 | One unit | The header and popover show credits only. Rewards are worded in full reviews with "2 credits" beside them. No separate trial chip | Separate "free reviews" counter | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-7 | Buying credits | Full-page checkout at `/checkout/credits` (Amount, Payment, Review, Paid). Every Add credits entry opens it with the amount filled in. `TopUpModal` is deleted | A large dialog with an order summary | Yes: replaces the dialog | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-8 | Checkout chrome | Focused page outside the shell: logo, horizontal 3-step stepper, "Exit checkout", sticky order summary (board 2 frames; board 1's Amount step was redrawn in the same frame on 11 Nov). Apollo nearly does this (header hidden, nav collapsed to icons); we drop the nav too, so nothing competes with finishing and Exit returns to where the user started | Inside the shell with breadcrumbs; `StepperModal` | No | **Confirmed by Val (11 Nov)** |
| PC-9 | Who pays how | Default by org type: appraisal firms prepay (wallet, optional auto-reload); banks prepay and always see "Prefer a monthly invoice? Talk to us" in checkout and billing | Every bank invoiced after a call | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-10 | Enterprise after approval | Trial credits are released and earning opens (as the pending page promises); Realwired then sets billing to prepaid (default) or invoiced (a pill state) | Invoiced by default with no trial | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-11 | Lock-then-explain | Every blocked action is clickable, shows a lock (something to buy or a role) or an hourglass (waiting on Realwired), and opens a dialog with the reason and a way through | Tooltips on disabled buttons (today) | Yes | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-12 | Setup entry | Keep Get started as a nav item with "n/8" and a bar | Floating "Finish setup" panel bottom-right | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-13 | Prototype states | One scenario + page pills, fill wand, hide toggle, Prototype Index; DemoDock, `/start`, the user-menu switcher and the sign-in "Demo accounts" panel are retired | Add pills but keep personas and DemoDock | Yes | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-14 | Tours | Opt-in "Take a 1-minute tour" chip on the first visit to Reviews, a review, Checklists, Workbook layouts and Billing; a 4-step first-review tour that completes a setup step; built on react-joyride | First review only; driver.js | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-15 | Illustrations | Direction C ("Drafted"): spots (tier 1) and scenes (tier 2) from `illustrations/` | A (heavy ink) or B (wireframe) | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-16 | Spend order | Soonest-expiring first: purchased (oldest pack first), then earned, then trial. Matches the board copy and stops paid credits lapsing while free ones sit unused | Keep trial → earned → purchased and rewrite the board copy | Yes: reverses the Nov 6 order in `AGENTS.md` | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-17 | Earned credit lifetime | Earned (bonus) credits never expire, like trial credits (board: "Trial and bonus credits · Never expire") | Keep 90 days | Yes | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-18 | "Running low" | One constant, `LOW_BALANCE_AT = 3`: low when 1–3 credits are left. Drives the pill tone, banners and the default low-balance email | Low = below one full review (today's sidebar rule) | Yes: unifies two rules | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-19 | Stage org | The scenario rebuilds the existing `org-hcb` (Harbor Community Bank) instead of a new `org-stage` id; `/welcome` upserts it | New `org-stage` id (state draft §1.5) | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-20 | Bonus window in the state model | A wallet *modifier* `bonus: open · ending · closed` instead of wallet values `bonus_open` / `bonus_closed` (it combines with fresh, trial and low) | Wallet values per the draft's reconciliation note | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-21 | How credits work | A billing tab `?tab=credits` for every role and billing model; `/configure/billing/credits` redirects to it | A standalone page only | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-22 | Trust Center icon | `IconShieldCheck` (registry key `shield`). `IconShieldLock` (key `sso`) already means SSO in the app | `IconShieldLock` as in `icon-map.md` | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-23 | Invite step | `/welcome/invite`, step 2 for self-serve; enterprise invites from Get started while pending | Invite only on Get started | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-24 | Onboarding layout | Option C: the card stays vertically centred. Book a call uses the same card as the other steps, with the scheduler under the 2-segment progress bar. The side panel's content changes per step and the panel does not stretch. Motion absorbs the centred card's height jumps (`proposed-screens/onboarding-layout-compare.html`) | A (centred; Book a call in its own split layout); B (anchored near the top; panel stretched to the card) | Yes: Book a call loses its split layout | **Confirmed by Val (11 Nov)** |
| PC-25 | Transitions | Screen-to-screen transitions and micro-interactions with `framer-motion` (already installed), using shared tokens in `lib/motion.ts`. No new motion dependency. Numbers in `motion-contract.md`; implementation in `motion-spec.md` | React `<ViewTransition>` (experimental in Next 16); CSS only | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-26 | Hand-off to the app | An Apollo-style "Setting up your workspace" interstitial between the last onboarding step and Get started. It is state inside the onboarding frame, not a route, and lasts 1.2–2.4 s | Route straight to Get started; a route `/welcome/setting-up` | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-27 | Celebration | Confetti (`canvas-confetti`) once per user when **self-serve** onboarding lands on Get started, plus a small burst when a section earns its review. Enterprise doesn't fire on landing; it fires on approval (pending Q-C9). Never under reduced motion | No confetti; confetti for both paths on landing | No | Accepted for build (11 Nov) — revisit at walkthrough |
| PC-28 | Usage chart | Donut by review type on Billing → Usage; ranked bar list by person; bars everywhere for balance (header popover, Overview hero/runway, sidebar). A donut needs a real finite total, which only spend in a period has; the prepaid balance has no fixed total (`proposed-screens/part2.html#billing-usage`) | Donut for balance (Apollo, over a fixed renewing allowance: `references/pattern-audit-nov-2026/apollo/10-credit-usage-overview.jpg`, `12-usage-details-illustrated-empty-states.jpg`) | No | **Confirmed by Val (11 Nov)** |
| PC-29 | Invite input | One row per person: email + role dropdown (Reviewer default, one-line role descriptions) + remove; 3 rows to start; paste a list fills rows; "Set all to" above 3 rows; inner scroll; per-row errors and a partial-success summary. No CSV in onboarding: past 10 rows a nudge offers the setup call (import a list or connect SSO), never blocking; CSV import belongs on Members later | Email chips + one role for the batch (board until 11 Nov); chips + per-chip role menu; CSV upload in onboarding | Yes: replaces chips + one role | **Confirmed by Val (11 Nov)** |
| PC-30 | Header order | Real shell order: `SearchTrigger` (field-style ⌘K) · `CreditsPill` · bell · `UserMenu`. The boards' pill-first order with a search icon button is a simplification of the chrome (audits B §4, C §4) | Board order: pill · search icon · bell · avatar | No | **Accepted by Val (11 Nov)** |
| PC-31 | Z-index tiers with the review takeover | `.run` 120 · **tour overlay 126, tour tooltip 128** · run Sign modal and `--rw-z-overlay` 130 · `--rw-z-modal` 140 (`LockDialog`, anything over a review) · toast 150 · tooltip 160 · popovers 200 · confetti 201 · prototype pill 210. A tour stops before any dialog opens (Sign, Lock, checkout). Replaces the earlier "tour 205" (audit A §4; audit D's "above 130" would cover the Sign and Lock dialogs) | Tour at 205, above every dialog | Yes: tour tier moves from 205 to 126/128 | **Accepted by Val (11 Nov)** |
| PC-32 | "Run Technical only" in the short-credits dialog | **Starts the review now** with the single type (the board's "Uses your 1 credit now"), through an `onRunOnly(type)` callback that `RunConfirm` supplies | Re-select only, as `LowBalanceCallout` does today | Yes: today it only changes the selection | **Accepted by Val (11 Nov)** |
| PC-33 | Billing band | Billing moves onto the Reviews page band (DS `PageHeader toolbar` + DS `Tabs`); "Add credits" stays the band's primary (house pattern: the band hosts the page's primary action), not inside the hero as board 2 draws it. Plans (flag-gated) stays. Invoiced keeps "Download statement" in the band; "Export CSV" lives on the Usage filter row. Invoiced reviewer gets tabs Usage · How credits work | "Add credits" in the hero (board 2) | Yes: band changes from local `PageHeader` + `.qtabs` to the DS band | **Accepted by Val (11 Nov)** |
| PC-34 | Usage tab composition | Filter row → donut card + by-person card (PC-28) → `LedgerSection`. The `UsageChart` bar chart, its by-source grouping and `BreakdownTable` leave the Usage tab; the compact `UsageCard` on Overview stays | Keep the bar chart below the donut | Yes: removes built parts from Usage | **Accepted by Val (11 Nov)** |
| PC-35 | Earn pill colour | Navy-selected (`--md-selected` / `ui-chip--accent`), done = success tone. Petrol stays reserved for links, focus and the one AI cue (AGENTS); the board's petrol tint is out of date | Petrol tint (board) | No | **Accepted by Val (11 Nov)** |
| PC-36 | Get started page band | Get started keeps a bodied hero (h1 in the page body, thin progress bar under it) and no `.pagehead` band, as the board draws it. It is the only shell page without a band | Add a `.pagehead` band like other pages | No | **Accepted by Val (11 Nov)** |
| PC-37 | Reviews level-1 upload | An in-page upload zone that opens the `RunModal` confirm gate the same way the Launchpad dropzone does (shared `useIntakeStart()` hook extracted from `IntakeWidget`); a `LockedAction` while pending. The header `OrderButton` stays | A button that links to `/launchpad` | No (new surface) | **Accepted by Val (11 Nov)** |
| PC-38 | Tour chip placement and page-tour scope | A review's chip and "Tour, n of 4" sit in the run top bar (`.run-head`); page chips sit in a shell header slot beside `Breadcrumbs`, driven by route patterns in `lib/tours.ts` (Checklists and Workbook layouts have no `PageHeader`). A chip shows only when its first target exists (Reviews: once the queue has rows). Page tours keep only on-page targets (§5.13) | Chip in `PageHeader` (spec before reconcile) | No | **Accepted by Val (11 Nov)** |

---

## 3. Glossary (use these words, and only these, on screen)

| Term | Meaning | On screen | Never say |
|---|---|---|---|
| **Credit** | One review type (Technical or Administrative) on one report. `CREDIT_USD` = $150 list. The only balance unit | "4 credits", "1 credit" | coin, token, unit, "+1" |
| **Full review** | Technical + Administrative on one report = 2 credits ($300 list) | "about 2 full reviews", "5 full reviews" | "report credit", "document" |
| **Single review** | One review type on one report = 1 credit | "10 single reviews", "Technical or administrative only · 1 credit" | "half review" |
| **Trial credits** | 6 credits granted when the org is approved. Never expire | "6 trial credits never expire" | "trial ends", "expires in" |
| **Earn** | Finishing a Get started section adds one full review (2 credits) to the balance, inside the 14-day bonus window. Earned credits behave like any other credit and never expire (PC-17) | "Earn 1 free review · 2 credits" → "1 free review earned" | "+1 coin", "reward points" |
| **Bonus window** | The 14 days after the trial grant in which sections can earn. Only earning closes; credits stay | "12 days left to earn" | "trial expiring" |
| **Held** | Enterprise org waiting for its setup call: trial credits reserved, not spendable | "Credits after your call", "On hold" | "0 credits" |
| **Charged at Start** | A credit is used when a review starts; refunded if it fails on Realwired's side | "Uses 2 credits", "When a review starts" | "used when a review completes" |

There is **no per-person credit limit** anywhere. Reviewers share the org balance and see their own usage.

---

## 4. Pricing constants (`lib/pricing.ts`)

| Constant | Old | New | Notes |
|---|---|---|---|
| `TRIAL_GRANT_CREDITS` | `6` | `6` (unchanged) | 3 full reviews |
| `TRIAL_EXPIRY_DAYS` | `30` | **delete** | Unused today; trial never expires (D2a). Deleting it stops it creeping back |
| `EARN_REWARD_CREDITS` | `1` (per step) | **`2`** (per section) | One full review = `costFor(FULL_REVIEW_TYPES)` |
| `EARN_CAP_CREDITS` | `3` | **`4`** | 2 sections × 2 credits |
| `SETUP_REWARD_STEPS` | `["bank_policy", "checklist", "layout"]` | **delete**, replaced by `SETUP_REWARD_SECTIONS` | |
| `SETUP_REWARD_SECTIONS` (new) | — | `["first_review", "own_rules"]` | Section ids from `lib/setup-steps.ts` |
| `EARN_WINDOW_DAYS` (new) | — | `14` | Starts at the trial grant (for enterprise, at approval) |
| `EARN_ENDING_DAYS` (new) | — | `2` | "Bonus window ending" banner threshold |
| `EARNED_LIFE_DAYS` | `90` | **delete** (PC-17) | `lib/wallet-breakdown.ts` `expiryOf()` returns `null` for `earned`; `app/emails/content.ts` line about earned lifetime rewritten |
| `LOW_BALANCE_AT` (new) | — (`ALERT_DEFAULTS.lowBelow = 3` in `components/organisms/billing/settings/settings-data.ts`; `< costFor(full)` in `BalancePill.tsx`) | `3` | PC-18. `settings-data.ts` reads it; the pill, popover and banners use it |
| `INVOICED_CREDIT_USD` (new) | — | `140` | Placeholder for Ed; invoiced Usage hero ("billed at $140 each") |
| `CREDIT_USD`, `REVIEW_TYPE_COST`, `CREDIT_PACKS`, `CUSTOM_CREDITS`, `creditRateUsd`, `AUTO_RELOAD_DEFAULTS` (`pack10`, below `2`, cap `3000`), `PURCHASED_LIFE_MONTHS` (`12`), `SALES_THRESHOLDS` (`11` / `200`) | — | unchanged | Auto-reload copy derives the times-a-month figure from the cap: `floor(3000 / 1400)` = **2** (the board says 3; see §10 Q-E10) |
| `VOLUME_BAND_LABEL` (new) | labels hardcoded in `useWelcome.ts` ("50–200") | `{ lt50: "Under 50", "50-200": "50–199", "200+": "200+", unsure: "I'm not sure yet" }` built from `SALES_THRESHOLDS` | Fixes the 200 overlap. Value key `"50-200"` stays for stored data |
| `routeForProfile(profile)` (new) | — | `"enterprise"` if `teamBand === "11+"` or `volumeBand === "200+"`, else `"self_serve"`. `"unsure"` routes self-serve | Wraps `needsSalesFirst`; `needsStaffApproval` keeps calling it |
| `earnWindow(grantAt, now)` (new) | — | `{ endsAt, daysLeft, state: "open" \| "ending" \| "closed" }` | Pure; `now` passed in (React 19 purity) |

Acceptance:
- [ ] `grep -rn "TRIAL_EXPIRY_DAYS\|EARNED_LIFE_DAYS\|SETUP_REWARD_STEPS" app/src` returns nothing.
- [ ] No screen hardcodes 2, 3, 4, 6, 14, 140 or a price in copy.

---

## 5. Surfaces

### 5.0 Surface model (reconcile, 11 Nov)

The boards draw everything inside the shell. The real app has three kinds of surface, and every section below builds to these:

| Surface | What it is | Chrome | Consequence |
|---|---|---|---|
| Shell page | `app/(shell)/**` inside `AppShell` (DS `RwAppShell`) | Sidebar (`navAction` Start, Get started n/8, Dashboard, Reviews, footer `BalancePill` + `OrgCard`; Configure is reached via the OrgCard) · header (`Breadcrumbs` · `SearchTrigger` · bell · `UserMenu`) · a page band (DS `PageHeader` on Reviews, local `.pagehead` elsewhere) | Credits pill, resource links, page tours and lock dialogs live here |
| **Review takeover** | `/reviews/[id]` (portaled `.run`, `role="dialog"`, `position: fixed; inset: 0; z-index: 120`) and the global `RunModal` (same `.run`, mounted once in `AppShell`) | `.run-head` (logo mark · address · sub-line · close) · optional Technical/Administrative tabs · left rail Workbook · Source · document toolbar `.run-wb-bar` · sticky footer `.run-foot` (`Sign & finalize`). **No sidebar, header, credits pill, crumbs or `PageHeader`.** Start is the full-page **"Review setup"** (`RunConfirm`) with the `CostSummary` footbar | Anything that opens over a review uses the lifted tiers (`--rw-z-modal` 140; PC-31). The in-run balance is `CostSummary`, not a pill. Esc handling must not close the review under a dialog (§5.5) |
| Focused page | Outside `(shell)`: `(onboarding)`, `(auth)`, and the new `app/checkout` | Own top bar; no sidebar | Must mount what it needs from `AppShell` itself (`LockDialog`, `ReceiptDialog`, prototype pill) |

Embedded YouConnect sessions are the review takeover in `embedded` mode: invoiced, no wallet check by design, so no lock dialog and no checkout ever opens there.

### 5.1 Onboarding: `/welcome`, invite step, book-a-call

**Routes**

| Route | File | Status |
|---|---|---|
| `/welcome` | `app/(onboarding)/welcome/page.tsx` | change |
| `/welcome/invite` | `app/(onboarding)/welcome/invite/page.tsx` **(new)** | new; self-serve step 2 |
| `/welcome/call` | `app/(onboarding)/welcome/call/page.tsx` **(new)** | new; enterprise step 2 |
| `/welcome/path`, `/welcome/pending`, `/welcome/ready` | existing pages | Already `redirect("/get-started")` today (audit D §1.1); keep that target. Registry status Retired; delete after one release |
| (frame) | `app/(onboarding)/welcome/layout.tsx` **(new)** + `app/(onboarding)/welcome/template.tsx` **(new)** | The layout holds the persistent `OnboardingFrame`; the template runs each step's enter animation (`motion-spec.md` §2.2) |

**Layout (option C, PC-24)**

- One card for every step, **vertically centred** in `.wel-main`, with a 2-segment progress bar at the top of the card.
- Book a call is in the same card: the scheduler sits under the progress bar. Its own split layout is gone.
- A side panel sits beside the card, centred on it vertically. It **does not stretch** to the card's height. Its content changes per step (copy below).
- The centred card changes height between steps (measured title jumps at 1280 × 820: Org setup 187 px, enterprise answers 135 px, Invite 246 px, Book a call 295 px). The card's height animates and the centred position glides with it (T3). Anchoring the card at 13% down the screen was tried and overflowed the tallest step on a laptop, which is part of why centred + motion won.
- **Verify email → Org setup is a deliberate layout change:** one card with no panel becomes a card plus a panel. This is good UX. It marks the hand-off from identity (Realwired ID, Keycloak) to product setup. It is animated as one continuous move (T2): the card glides from the centre to the left column, then the panel enters from the right.
- At 390 px the panel stacks under the card (unchanged rule).

**Components**

| Action | Path | What |
|---|---|---|
| change | `components/organisms/onboarding/OrgSetupForm.tsx` | Volume gains "I'm not sure yet"; optional call box replaced by the live routing line; button relabels live; remove the "free sample review" reassurance; submit never `disabled` (today `disabled={!canContinue}` at l.107; empty name → inline field error on click). **There is no side panel today** (`/welcome` is one 560 px card): `StepPanel` and the two-column `.wel-stage` are new, and `OnboardingFrame` renders them |
| change | `app/(onboarding)/welcome/hooks/useWelcome.ts` | `routeForProfile`; labels from `VOLUME_BAND_LABEL`; drop `?preset=large` and `?step=pending` hacks (the pill replaces them); upsert `org-hcb` (PC-19; today `createWorkspace` makes a new org id on every submit, `useWelcome.ts:54-84`, so demo resets pile up orgs); route self-serve → `/welcome/invite`, enterprise → `/welcome/call` through `useStepNav().go()` (exit before push) |
| add | `components/organisms/onboarding/OnboardingFrame.tsx` **(new)** | Persistent card shell (measured-height animation), 2-segment progress bar, side panel, step direction, `useStepNav()`, T2 entry from the verify hand-off, `mode: "steps" \| "interstitial"` |
| add | `components/organisms/onboarding/StepPanel.tsx` **(new)** (was `ProofPanel.tsx`) | The side panel. Content per step (copy below): illustration, title, list. Product proof only, no customer names |
| add | `components/organisms/onboarding/InviteStep.tsx` **(new)** | Invite rows (PC-29): `InviteRow` (email input, `RoleSelect` listbox, remove), "Add another", "Paste a list" (also on paste into any row: split on comma, semicolon, space, newline; dedupe with a note), "Set all to" above 3 rows, inner scroll after about 5.5 rows, bigger-team nudge past 10 rows. Sends through `useBouncerStore.sendInvites(invites: {email, role}[])`, one call with per-invite roles; renders per-row results |
| change | `store/bouncer.store.ts` | `sendInvites` takes `{ email, role }[]` and returns a per-email result (`sent` · `already_member` · `already_invited` · `invalid` · `wrong_domain`); the existing `(emails, role)` callers (Bouncer mock `InviteDialog`) map to it |
| add | `components/organisms/onboarding/CallBooking.tsx` **(new)** | Mock scheduler (5 days × 8 slots) **inside the card**, under the progress bar; booked state with scene `25-scene-call-booked`. The "What happens next" list moves to the side panel |
| add | `components/organisms/onboarding/SetupInterstitial.tsx` **(new)** | "Setting up your workspace" interstitial (PC-26; copy and timing in `motion-spec.md` §5) |
| add | `components/organisms/prototype/RoutingNote.tsx` **(new)** | Build-note strip under the form (visible only while prototype controls are shown) |
| change | `types/domain.types.ts` | `VolumeBand` + `"unsure"`; `OrgProfile.callBookedAt?: Timestamp`, `OrgProfile.callSlot?: string` |
| change | `store/org.store.ts` | `bookCall(slot)` sets `callBookedAt`/`callSlot` and `salesRequested`; **`approve()` grants the trial** (today only `store/demo.store.ts:69-70`, the DemoDock, does, so retiring DemoDock would otherwise strand enterprise orgs with no trial) |
| change | `app/bouncer/_components/InviteDialog.tsx` | Maps its `(emails, role)` call onto the new `sendInvites({email, role}[])` shape (one role for every row) |
| change | `app/(onboarding)/layout.tsx` | Mount `ProtoPill` instead of `DemoDock` (phase 5; `DemoDock` stays mounted until then) |

**States** (pill: Welcome / **Self-serve** / Enterprise; Book a call / **Pick a time** / Booked / Book later; Invite / **Empty** / 2 invited / Skipped)

| State | What shows |
|---|---|
| Self-serve answers | Routing line hidden; button "Continue to Parachute" |
| Enterprise answers (11+ or 200+) | Callout (info, `calendar` icon) appears; the triggering answer gets a petrol marker; button relabels "Book a call" |
| "I'm not sure yet" | Self-serve route; small line "We'll offer a call later if you need one." |
| Invite: default | 3 rows; first email focused; role Reviewer on each; primary "Send invites" until a row has an email, then "Send N invites" (N = non-empty rows) |
| Invite: empty send | Click with no emails → inline "Add at least one work email, or skip for now" on row 1, shake; nothing is `disabled` |
| Invite: row errors | "Enter a work email" (invalid), "Use a harborcb.com address" (wrong domain, when Bouncer restricts domains; Q-E16) under the row; send is blocked only for those rows |
| Invite: pasted list | Rows fill from the paste; "Set all to [Role]" appears above the list; list scrolls inside the card; count "12 people"; past 10 rows the info callout "**Inviting a bigger team?** We can import a list or connect your sign-in system on a short call. Book a call →" (opens `/welcome/call` without changing the route decision) |
| Invite: partial success | Sent rows clear; failed rows stay with their reason ("Already in Harbor Community Bank", "Already invited"); summary "11 invites sent · 1 already a member"; primary becomes "Continue" and "Skip for now" hides |
| Invite: sent | Toast "2 invites sent"; the interstitial (PC-26), then `/get-started`; "Skip for now" takes the same path; the "Invite a reviewer" step completes when an invite is accepted (existing rule) |
| Call: pick | Slot grid; Book button names the slot |
| Call: booked | Scene 25 at 320 px in the card; the interstitial, then `/get-started` (pending state) |
| Call: book later | Link "I'll book later" → the interstitial (no booking line) → `/get-started` pending with "Book your setup call" in the tracker |

**Copy** (from board 1 frames 3–6)

| Element | Copy |
|---|---|
| Title / sub | "Set up your organization" / "Three quick answers, then you're in." |
| Questions | "Organization name" · "You are a": Bank or lender / Appraisal firm · "How many people will review reports?": Just me / 2–10 / 11+ · "Reports a month, roughly": Under 50 / 50–199 / 200+ / I'm not sure yet |
| Side panel · Org setup | Title "What Parachute checks"; rows: "Every figure traced to its page in the appraisal" · "Your credit policy and compliance checklist applied" (appraisal firm: "Your review guidelines and compliance checklist applied") · "A signed workbook you can send to the lender" |
| Side panel · Invite | Spot `15-request-sent`; title "What your team gets"; check rows: "An email to join Harbor Community Bank, no account setup on their side" · "Reviews they start come out of the shared credit balance" · "You can change anyone's role later in Members" |
| Side panel · Book a call | Scene `25-scene-call-booked`; title "What happens next"; numbered rows: 1 "**You get into Parachute straight away.** Upload your policy and invite your team while you wait." 2 "**On the call, we confirm Harbor's account** and run your first review with you." 3 "**Your 6 trial credits open** once the account is confirmed, usually that day." In the booked state the card shows scene 25, so the panel drops its illustration (one illustration per view) |
| Enterprise callout | **"Teams your size start with a short call"** "We'll set up your policy and checklist with you, then open your trial credits." Button: "Book a call" |
| Routing note (prototype only) | "Route: Enterprise · because Reviewers = 11+ (≥ 11)" / "Route: Self-serve · Reviewers 2–10 < 11, Reports Under 50 < 200" |
| Invite | "Who else reviews reports?" / "We'll invite them to Harbor Community Bank. They can start once you're in." Column labels "Work email" · "Role"; placeholder "name@harborcb.com"; role options "Reviewer · Runs reviews and accepts or flags findings", "Approver · Signs workbooks before they go to the lender", "Admin · Manages members, billing and credits"; links "Add another" · "Paste a list"; "Set all to"; "Skip for now" (ghost) · "Send 2 invites" (primary, count live) |
| Call (in the card, option C) | 2-segment progress bar (both filled); "Book Harbor's setup call"; "Twenty minutes with Realwired's onboarding team, so your first review uses your own rules." (option B's shorter lede; the "Teams your size" line already appears in the enterprise callout one step earlier). Header "November 2026 · Eastern Time"; day row Thu 12 · Fri 13 · Mon 16 · Tue 17 · Wed 18; 8 time slots; button "Book Fri, Nov 13 at 10:00 AM"; footer "Can't find a time? I'll book later" (link). "What happens next" is in the side panel (above) |
| Step 2 of 2 | The 2-segment progress bar replaces the "Step 2 of 2" eyebrow on Invite and Book a call. The bar carries `role="img"` and `aria-label="Step 2 of 2"` (visually hidden text), so the step count is still announced |

**Acceptance**
- [ ] Changing an answer across the threshold flips the callout, marker and button label without submitting.
- [ ] "50–199" label; 200 is in exactly one band.
- [ ] Continue/Book/Send are never `disabled`; validation appears on click.
- [ ] Self-serve: trial granted at org creation, lands on `/welcome/invite`, then `/get-started` (fresh).
- [ ] Enterprise: `approval: "pending"`, no trial grant, lands on `/welcome/call`, then `/get-started` (pending).
- [ ] No "sample review" mention anywhere in onboarding.
- [ ] Invite (PC-29): mixed roles go out in one send; pasting 12 emails gives 12 rows with "Set all to" and inner scroll; past 10 rows the nudge shows and never blocks; per-row errors and the partial-success summary match the board; the role listbox works by keyboard (arrows, Enter, Esc) with `aria-expanded`.
- [ ] Fill wand fills both sides of the threshold (Self-serve: 2–10 / Under 50; Enterprise: 11+ / 200+).
- [ ] Option C: every step, Book a call included, is one centred card under the 2-segment progress bar; the side panel changes per step and never stretches to the card's height.
- [ ] T2: Verify → Org setup reads as one continuous move (card glides from centre to the left column, then the panel enters), about 600 ms.
- [ ] T3/T3b: step content leaves and enters in the direction of travel; card height and the centred position glide (no snap at 187–295 px jumps); the panel content cross-fades; browser back enters from the left.
- [ ] T4/T5: the last step hands off to the interstitial, then to Get started, with focus on each new `h1`.
- [ ] Micro-interactions per `motion-spec.md` §4; busy buttons hold their width; validation shakes on click; nothing is `disabled`.
- [ ] Reduced motion: no travel, 120 ms fades, instant height. `?motion=0` and Playwright run with motion off.

### 5.2 Get started v4 (`/get-started`)

**Route:** `app/(shell)/get-started/page.tsx` (unchanged file; renders `GetStarted`).

**Components**

| Action | Path | What |
|---|---|---|
| rewrite | `components/organisms/home/GetStarted.tsx` | One column: bodied hero (PC-36: h1 in the body, no `.pagehead` band) → sections → "More resources". Drop `WelcomeCallout` (sample) but reuse its `welcomeDismissedBy` / `org.flags.welcomeBanner` gate for the welcome line; keep `JoinedCallout`; `PendingCallout` becomes `PendingTracker`; drop the two-column `home-grid` and the side cards |
| change | `components/organisms/Skeletons.tsx` (`GetStartedSkeleton`) | One column, matching the new page (today it is the two-column `home-grid`) |
| rewrite | `components/organisms/home/SetupChecklist.tsx` → split into `SetupSection.tsx` **(new)** + `SetupRow.tsx` **(new)**; delete `UpNext`, `DoneLine` | Sections, rows, earn pill |
| add | `components/organisms/home/EarnPill.tsx` **(new)** | "Earn 1 free review · 2 credits" (gift) ↔ "1 free review earned" (check); hidden for invoiced orgs and after the window closes. Local `Chip` + `Icon`; colour per PC-35 (navy-selected; done = success) |
| add | `components/organisms/home/PendingTracker.tsx` **(new)** | Three-step tracker card (Signed up · Call booked · Confirmed), reused by the lock dialog, so it stays width-fluid. Try DS `StepLine` first; build locally if it can't show a "current" ring with a caption on an unreached step (`// DS-candidate`) |
| add | `components/organisms/home/ResourceCards.tsx` **(new)** | Learning Center · Trust Center · How credits work (spots `04b`, `03b`, `01b`, 120 px, panel on) |
| add | `components/organisms/home/AllDone.tsx` **(new)** | Completion card (replaces `DoneCard`) |
| delete | `components/organisms/home/HomeCards.tsx` (`SampleCard`, `SecurityPackCard`, `GuidesCard`) | Content moves to Trust Center and Learning Center |
| delete | `components/organisms/wallet/WalletCard.tsx` | Trial lives in the credits pill |
| keep | `components/organisms/home/GuideVideo.tsx` | Player reused by Learning Center and empty-state videos |
| change | `components/organisms/home/setup-checklist.css`, `home-cards.css` | Remove the hover-reveal rules (`setup-checklist.css` lines ~285–308); remove two-column `home-grid` |
| change | `lib/setup-steps.ts` | Sections, new step list, org-kind copy (below). `SetupStepDef.group` (`first` · `team`) becomes `section` (`first_review` · `own_rules` · `team`); `tutorial` is already in the `SetupStepId` union and is added to the list |
| change | `store/onboarding.store.ts` | `complete()` awards per section via `useWalletStore.awardSection()`; `useSetupSummary` counts 8 steps (drop the `+1` for the pre-ticked `account`, `onboarding.store.ts:199,209`); `useOrgStage`/`setupGuideVisible` also show Get started for approved enterprise orgs with unfinished setup |
| change | `lib/landing.ts` | `setupGuideVisible()` accepts `invoiced` when `org.profile.salesRequested` and setup unfinished |
| change | `components/templates/AppShell.tsx` | Nav label "Get started n/8" (count from summary) |

**Steps** (`lib/setup-steps.ts`; 8 steps, 3 sections)

| Section id | Title (bank / appraisal firm) | Sub | Reward | Steps (row copy · button) |
|---|---|---|---|---|
| `first_review` | "Run your first review" | "Upload a commercial appraisal and see every figure checked." | Earn 1 free review · 2 credits | `first_review` "Upload an appraisal to start your first review" · Upload appraisal (done: address + "Open review") · `tutorial` "Take the 2-minute tour to learn how to accept or flag a finding" · Start tour · `sign_workbook` "Sign the workbook so it's ready to send to the lender" · Sign workbook |
| `own_rules` | "Make it your bank's review" / "Make it your firm's review" | "Findings cite your rules, and the workbook carries your name." (pending: "You can do all of this now, so your first review cites your rules.") | Earn 1 free review · 2 credits | `bank_policy` "Upload your credit policy so findings cite your rules" · Upload policy (firm: "Upload your review guidelines so findings cite your rules" · Upload guidelines) · `checklist` "Publish your compliance checklist for administrative reviews" · Start checklist · `layout` "Brand your workbook with your logo and labels" · Edit layout |
| `team` | "Bring your team" | "Reviews move faster when nobody waits on one person." | Chip "Recommended" (no reward) | `invite` "Invite a reviewer so reviews don't wait on you" · Invite (done: "Marcus Ortiz joined on Nov 11" · Manage team) · `security_pack` "Send the Trust Center link to IT for vendor approval" · Send to IT (pending: "…so vendor approval runs alongside the call") |

`sample_review` leaves `SETUP_STEPS` (the id stays in the `SetupStepId` union for stored data). `security_pack` now routes to `/trust` and completes on "Send to IT".

Real-app adaptations (audit D §2): the done `first_review` row's address and "Open review" href, and the "Sign workbook" href, are **derived** from the reviews store (the first non-sample review of the org; no new field). With no own review yet, "Sign workbook" opens the lock dialog (role-style, "Run a review first"). "Open review" and "Start tour" land on `/reviews/<id>`, so the tour begins in the review takeover (§5.13), not the shell. Every Start-a-review row (Upload appraisal) is a Start site (§5.5). Row copy "accept or flag a finding" becomes **"concur with or reject a finding"** (the real verbs).

**States** (pill: Get started / **Self-serve · New** / Self-serve · Mid-setup / Almost done / All done / Enterprise · Call booked / Enterprise · Book later / Enterprise · Confirmed / Bonus ending / Bonus closed; role from the scenario popover)

| State | Header band | Sections |
|---|---|---|
| New (board 10 left) | "Your trial includes 3 full reviews. Earn 2 more in your first 14 days." + link "Visit Trust Center"; progress "0 of 8 done · 14 days left to earn". **On arrival from self-serve onboarding:** an inline, dismissible welcome line above the sections, "You're in. 6 trial credits are ready." (number from `TRIAL_GRANT_CREDITS`), and confetti 200 ms after the page lands (PC-27, once per user) | First row of each section is the filled navy button; earn pills on two sections |
| Mid (board 7) | same; "2 of 8 done · 12 days left to earn" | Done rows show check + meta; next row per section is navy |
| Almost done | "7 of 8 done" | One row left |
| All done (board 10 right) | Card with spot `08b-signed-workbook` 120 px: **"All 8 done"** "You earned 2 free reviews. Harbor is set up." "4 credits were added to your balance. Get started leaves the sidebar now; the Learning Center and Trust Center stay where they are." Buttons "Go to Dashboard" (primary) · "Start a review" (outline). Collapsed summaries: "Run your first review · 3 of 3, 1 free review earned" etc. | |
| Enterprise · Call booked (board 9; the pending lock widens from `first_review` alone to the whole "Run your first review" section, `tutorial` and `sign_workbook` included) | `PendingTracker`: "Call booked for Friday, Nov 13 at 10:00 AM ET" "Your 6 trial credits are held for Harbor and open as soon as Realwired confirms the account." Buttons "Change call" · "Add to calendar". Tracker: Signed up Nov 11 · 2 Call booked Fri, Nov 13 · 3 Confirmed Usually same day. Line: "Get Harbor ready before your call on Friday." Progress: "1 of 8 done · your 14 days to earn start when Harbor is confirmed" | "Run your first review" shows an hourglass pill "Unlocks after your call" and sub "Your trial credits are held until Harbor is confirmed. Clicking explains why."; its buttons carry a trailing hourglass and open the lock dialog |
| Enterprise · Book later | Tracker step 2 reads "Book your setup call" with a primary "Book a call" → `/welcome/call` | as above |
| Enterprise · Confirmed | Callout success "Harbor is confirmed. Your 6 trial credits are ready." then the Mid layout; prepaid by default (PC-10) | Earn pills shown; for an invoiced variant, pills hidden |
| Bonus ending (≤ 2 days) | Progress line turns amber: "2 days left to earn" | Pills unchanged |
| Bonus closed | Progress "Bonus window closed · you earned 1 free review"; earn pills hidden on unfinished sections | Rows stay actionable |
| Reviewer role | Admin-only rows show an outline "Ask Dana" instead of the action (sends a note, toast "Dana gets your note") | |

**Rules**
- [ ] Every row shows its button at rest; the first not-done row of each section is `variant="primary"` (navy), the rest `outline`.
- [ ] No hover or focus-only reveal remains in `setup-checklist.css`.
- [ ] No sample, wallet, guides or IT-documents side cards.
- [ ] Earn pill: gift icon 14 px, `aria-hidden`; text carries meaning; never a bare number; no coin glyph.
- [ ] Section reward fires once when all its steps are done inside the window; toast via `EarnedToastHost`: "1 free review earned · 2 credits added".
- [ ] Progress bar is a thin bar under the band; numbers from `useSetupSummary`.
- [ ] Copy adapts to `org.profile.kind`.
- [ ] Days-left computed in an effect or event, never `Date.now()` in render.
- [ ] Welcome line: shown only on the arrival visit from self-serve onboarding (not on reload, not for enterprise); not a modal or toast; enters with opacity + y 8 px; dismissal stored in `prefs.welcomeDismissedBy` (freed by deleting `WelcomeCallout`); shown under reduced motion too.
- [ ] Confetti: `celebrate("onboarding", userId)` from `lib/celebrate.ts`, fired by `GetStarted` when the arrival is self-serve. It fires once per user (`prefs.celebratedBy`); never for enterprise on landing; never with reduced motion or motion off. Enterprise fires `celebrate("approval")` the first time the user sees the Confirmed state, pending Q-C9.
- [ ] Section burst: when a section earns its review, `burstFrom(earnPill)` plays a single 30-particle burst alongside the existing toast.
- [ ] On arrival, focus moves to the Get started `h1`.

### 5.3 Header credits pill and popover

**Components**

| Action | Path | What |
|---|---|---|
| add | `components/organisms/CreditsPill.tsx` **(new)** | Header pill: local `CreditChip` gains tones `zero` · `held` · `invoiced` (`// DS-candidate`) as the trigger of a DS `Popover` (`align="end"`, `width` 340, Radix portal, flip, Esc, focus return). Radix does not close on scroll, so the pill adds a capture-phase scroll + resize close (AGENTS popover rule) |
| add | `components/organisms/CreditsPopover.tsx` **(new)** | Content per state |
| add | `lib/wallet-view.ts` **(new)** | Pure derivations: `balance`, `fullReviews`, `usedThisMonth`, `runway` (days at the last-30-day pace), `lowTone`, `earnLine`, `usageByType(period)`, `usageByPerson(period)` (PC-28; both from ledger spend entries in the period); used by pill, popover, sidebar Balance and Billing so numbers never disagree |
| change | `components/templates/AppShell.tsx` | `header.end`: `SearchTrigger` · `CreditsPill` · bell · `UserMenu` (PC-30; keep the field-style `SearchTrigger`) |
| change | `components/organisms/BalancePill.tsx` | Read `lib/wallet-view.ts`; pending label "On hold"; low from `LOW_BALANCE_AT`; **drop the `N trial` label and the `trial` tone** (label is always "N credits", PC-6). It stays hidden for invoiced and YouConnect orgs (today's rule) while the header pill shows the invoiced "used" state |
| change | `components/organisms/UserMenu.tsx` | Add "Invite your team" (admins) → `INVITE_HREF` (phase 2); remove "Switch demo persona" (phase 5, with DemoDock) |

**States**

| State | Pill (icon `wallet` 14 px unless noted) | Popover |
|---|---|---|
| Trial / healthy (board 11) | "4 credits" | "Harbor Community Bank" · **"4 credits"** "about 2 full reviews" · trial sub-line "Trial credits · never expire" (trial only) · "At this month's pace, that lasts about 2 weeks." · "Used 2 this month" · cost rows "Full review · 2 credits", "Technical or administrative only · 1 credit" · earn line (gift) "Earn 2 more free reviews in the next 12 days." → `/get-started` · buttons "View usage" (outline) · "Add credits" (primary) |
| Low (1–3) | amber text "3 credits" | adds "Running low" chip and runway "runs out Thursday" |
| Zero | red text "0 credits" (icon `wallet-off`) | spot `01-credits` 48 px; "New reviews can't start. Reviews already running finish normally." · "Add credits" |
| Held (pending) | hourglass, "Credits after your call" | spot `09-approval-pending` 48 px; "Your 6 trial credits are held for Harbor and open once Realwired confirms the account." · "View call details" → `/get-started` |
| Request waiting (admin; part 2) | normal | "Team credits · Running low · 2 left · used 20 since Oct 14 · runs out Thursday" (board 2 `#admin-request` said "2 of 22 left"; a prepaid balance has no fixed total, PC-28); request card "Marcus Ortiz asked for more credits" + note + "2 h ago"; "Add credits" (opens checkout with `pack10` and `request=<id>`) · "Dismiss"; footer "View usage" · "How credits work" |
| Invoiced | `file-invoice`, "38 credits used" | "November so far · 38 credits used · Estimated $5,320 · Next statement Dec 1" · "View usage" |
| Reviewer | same pill | Team balance and "You used 7 this month"; "Ask Dana for more credits" instead of Add credits |
| YouConnect embedded | not rendered (chromeless) | — |
| Inside a review (`.run`) | not visible (the takeover covers the header, §5.0) | The in-run balance is `CostSummary` in the Review setup footbar. Do not add a pill to `.run-head` |

**Acceptance**
- [ ] One unit only: the pill never shows reviews, dollars or a second chip.
- [ ] Pill, sidebar Balance, Billing hero, popover **and the Review setup `CostSummary`** show the same number in every scenario (one derivation; `useRunCost` reads `lib/wallet-view.ts`).
- [ ] Popover is keyboard-reachable; Esc returns focus to the pill.
- [ ] "Add credits" opens `/checkout/credits` with the default pack (or the request's pack).

### 5.4 Sidebar: Trust Center and Learning Center above Balance

| Action | Path | What |
|---|---|---|
| add | `components/organisms/SidebarResourceLinks.tsx` **(new)** | Two nav-style rows: "Trust Center" (`shield`, PC-22) → `/trust`; "Learning Center" (`school`, new) → `/learn`; active state from pathname; collapsed = icon + tooltip |
| change | `components/templates/AppShell.tsx` | `sidebarFooter`: `SidebarResourceLinks` → `BalancePill` → `OrgCard` |

- [ ] Rows share the nav row geometry (DS `SidebarAction asChild` + `next/link`, 19 px icons), so icons sit in the nav icon column. The boards' separate `.sb-res` block with 16 px icons is a simplification; don't copy it.
- [ ] Visible for every role and billing model, during and after setup.

### 5.5 Lock-then-explain pattern

**Components**

| Action | Path | What |
|---|---|---|
| add | `store/lock.store.ts` **(new)** | `openLock(reason: LockReason, opts?: { returnFocus?: HTMLElement \| null })`, `close()`; `LockReason = { kind: "approval" } \| { kind: "credits"; needed: number; have: number; types: ReviewType[]; resume?: string; onRunOnly?: (type: ReviewType) => void } \| { kind: "role"; action: string; admin: string }`. `needed` is the **shortfall** (cost − balance), never the full cost. `onRunOnly` carries PC-32 |
| add | `components/molecules/LockedAction.tsx` **(new)** | Wraps any trigger (local `Button`, `SidebarAction asChild`, a row button): keeps its look, adds trailing `lock` or `hourglass-high` 14 px, `aria-disabled="true"`, `aria-describedby` a visually-hidden reason; `onClick` → `openLock`. Never sets `disabled`. Extracted from the inline `start-locked` pattern in `AppShell` (`// DS-candidate`) |
| add | `components/organisms/LockDialog.tsx` **(new)** | Store-driven DS `Dialog size="sm"` with `hideTitle` and a local centred body (art, title, copy, options via DS `OptionCard type="radio"`), **portaled at `--rw-z-modal` (140) so it shows over the review takeover** (PC-31). Mounted once in `AppShell`, once in `app/checkout/layout.tsx` and once in `app/(onboarding)/layout.tsx`. Not `AlertDialog` (its single icon can't hold a 96–104 px spot). Close/Back returns focus to the trigger |
| change | `components/organisms/home/useStartGate.ts` | Returns `{ locked, reason, explain() }`; `START_LOCKED_REASON` becomes "Opens after Harbor's setup call" (org name from the store) |
| change | `components/run/RunExperience.tsx` | **Esc guard:** the document-level Esc at `:562-574` closes the whole review unless a `.ui-menu-pop` is open. Extend it to skip when any `[role="dialog"]` other than the `.run` itself is open (covers `LockDialog`, `ReceiptDialog`, the Sign modal and today's `TopUpModal`) |

**Start sites (the real list, audit A §3).** Each one replaces `disabled` + Tooltip with `LockedAction` (approval) and never sets `disabled`:

| # | Site | File |
|---|---|---|
| 1 | Sidebar primary "Start a review" | `components/templates/AppShell.tsx` (`navAction`; collapsed rail: click → dialog, not the library tooltip) |
| 2 | Reviews header `OrderButton` | `components/organisms/OrderButton.tsx` |
| 3 | Dashboard first-run block | `components/organisms/dashboard-widgets.tsx` (`DashboardFirstRun`) |
| 4–5 | Command palette "Go to" Start and the Start action | `components/organisms/CommandPalette.tsx` |
| 6–7 | Launchpad dropzone **and** "From YouConnect" delivery rows | `components/organisms/IntakeWidget.tsx` (`:72-96`, `:286-302`) |
| 8 | Get started Upload row | `components/organisms/home/SetupRow.tsx` (new in §5.2) |
| 9 | Queue "Run" on intake rows → Review setup | `components/run/RunConfirm.tsx` reads `useStartGate()` (today the gate checks the wallet only, so a pending org can reach Start through the queue) |
| 10 | Reviews level-1 upload zone (PC-37) | `app/(shell)/reviews/page.tsx` **(new surface)** |
| 11 | **Start review** (the commit) | `components/run/RunConfirm.tsx` → `RunModal.onStart` / `app/(shell)/reviews/[id]/page.tsx` `onStart` |

Not Start sites: the `/launchpad` breadcrumb lock chip (`components/molecules/Breadcrumbs.tsx:103-107`) becomes a plain reason line; the sample banner "Run your own report" stays inside the unlinked sample (PC-4); `/launch` and embedded YouConnect have no gate by design (§5.0).

**Review setup (the real "Start", `components/run/RunConfirm.tsx` + `CostSummary.tsx`)**

| Change | What |
|---|---|
| Never disabled | Today `disabled={!canStart && !short}` (`:428`) disables Start for zero types or an empty address. Start stays clickable; on click show the existing inline note (`:294-298`) and focus the first gap |
| Approval | Start while the org is pending → `LockDialog` approval variant over the takeover |
| Short / zero | `LockDialog` credits variant **over the Review setup page**; the page stays visible behind the scrim; Back returns focus to Start review. `LowBalanceCallout` and its 500 ms auto-scroll (`:194-198`, `:404-412`) are deleted |
| Run Technical only (PC-32) | `RunConfirm` passes `onRunOnly(type)`; the dialog calls it and the review starts now with one type |
| Backstops | `RunModal.onStart` (`:246-253`) and `/reviews/[id]` `onStart` (`:63-70`) call `openLock({ kind: "credits", … })` instead of `openTopUp` |
| Draft before checkout | See §5.6 "Return path". The selection survives the trip to checkout and back |
| Reviewer | The credits variant for non-admins writes a `CreditRequest` (§5.9); it replaces the toast-only "Ask your admin" (`CostSummary.tsx:167-172`) |

**Board notes.** Board 2 `#start-low-balance` frame 1 draws Start as a 560 px dialog over the Reviews queue: build it as the full-page Review setup in the takeover (its costline maps onto `CostSummary`, nothing new); frame 2's dialog opens **over** that page and does not replace it. Board 2 `#billing-zero` is two things: Billing at zero (a page state, no dialog) and the "You're out of credits" dialog over the Review setup page. Board 1 `#lock-explain` (shell, sidebar Start) is correct as drawn. Board 1 `#lock-explain-reviewer` is correct in the shell; the same approval variant now also fires from Review setup.

**Dialog variants** (spot at 96–104 px above the title, panel off; never a scene)

| Kind | Glyph / spot | Copy | Actions |
|---|---|---|---|
| Approval, admin (board 12) | hourglass / `09b` | **"Credits open when Harbor is confirmed"** "Teams your size start with a short call. You booked one for Friday, Nov 13 at 10:00 AM ET. After it, Realwired sets up your billing and Start a review opens." + `PendingTracker` | "Change call" (outline) · "Got it" (primary) |
| Approval, not booked | hourglass / `09b` | "Book Harbor's setup call to open credits" "Teams your size start with a short call. After it, Realwired sets up your billing and Start a review opens." | "Book a call" (primary) · "Not now" |
| Approval, reviewer (board 13) | hourglass / `09b` | "Reviews open after Harbor's setup call" "Dana Reyes booked Harbor's setup call for Friday, Nov 13. Reviews open once Realwired confirms the account, usually the same day." | "Ask Dana" (outline) · "Got it" |
| Credits short, admin (part 2) | lock / `10b` | **"You need 1 more credit"** "Technical and Administrative together use 2 credits. Harbor Community Bank has 1." Options: "Add 1 credit and run the full review · $150 · one credit at the single-credit rate. Checkout opens with 1 credit filled in and brings you back here when it's paid." / "Run Technical only · 1 credit · Uses your 1 credit now." (the board's "You can add the Administrative review to this report later" is dropped: types are committed once at Start and no add-a-type path exists; Q-E18) Note: "Running low often? Turn on auto-reload to add 10 credits when you drop below 2." | "Back" (ghost) · "Run Technical only (1 credit)" (outline) · "Add 1 credit" (primary) |
| Credits zero, admin (part 2) | `wallet-off` / `01b` | **"You're out of credits"** "This review uses 2 credits. Harbor Community Bank has 0." Options: "10 credits · 5 full reviews · $140 a credit · $1,400" / "2 credits · Just this review · $150 a credit · $300". "Your report stays uploaded. It starts as soon as the payment goes through." Link "How credits work" | "Not now" · "Continue to checkout" |
| Credits, reviewer | lock / `10b` → `15-request-sent` after sending | "You need 1 more credit" + "Only admins can buy credits. Dana Reyes gets your request by email and in Parachute." Note field "Note for Dana (optional)" placeholder "For example: 3 reports due Friday" | "Ask Dana for more credits" (primary) → confirmation "Requested · Dana will be notified" |
| Role (e.g. reviewer clicks Add credits) | lock / `10b` | "Only admins can buy credits" "Dana Reyes manages billing for Harbor Community Bank." | "Ask Dana" · "Got it" |

**Acceptance**
- [ ] `grep -rn "disabled={locked\|disabled={!canPay\|disabled={!canStart" app/src` returns nothing.
- [ ] Every locked control has `aria-disabled="true"` and a reason reachable by screen readers.
- [ ] Hourglass for waiting on Realwired; lock for credits or roles (icon-map §4).
- [ ] Credits dialog "Add …" opens checkout with `credits=<needed>` (or the chosen pack) and `return=<current path>`; after Paid, the review resumes at Start with the same selection.
- [ ] The uploaded report is kept as a draft while the dialog or checkout is open: an `intake` review with the selected `reviewTypes` exists before the user leaves for checkout, and survives a reload (§5.6).
- [ ] The dialog opens over the review takeover (z 140), the Review setup page stays visible behind the scrim, and Esc closes only the dialog, never the review.
- [ ] Start review, Pay and every Start site are never `disabled` (zero types or an empty address explain inline on click).
- [ ] Embedded YouConnect runs never open a lock dialog or checkout.
- [ ] Optional sweep: the locked column toggles in `components/organisms/ReviewTable.tsx` move to `aria-disabled` + reason.

### 5.6 Full-page checkout (`/checkout/credits`)

**Route:** `app/checkout/credits/page.tsx` **(new)** + `app/checkout/layout.tsx` **(new)** (outside `(shell)`, focused chrome, PC-8). The `(onboarding)` layout is not reusable (one centred card + footer); copy only the `.wel-top` logo treatment and the `.run-head` geometry (logo · title · exit) for the top bar. The root `app/layout.tsx` already provides `SeedProvider`, `ToastHost` and `DensityProvider`, so stores hydrate with no extra wiring. **The checkout layout mounts what it needs from `AppShell`:** `LockDialog` (pending org or reviewer landing on the URL), `ReceiptDialog` (Paid → "View receipt") and the prototype pill (phase 5). No `RunModal`, no `CheckoutLauncher`.
Query: `step=amount|payment|review|done`, `credits=<n>` or `pack=<id>`, `return=<path>`, `types=<technical,administrative>` (carried back to Review setup), `request=<creditRequestId>`, prototype-only `error=card`.

**Return path (audit B §3)**

- `return` is validated by `safeReturn(raw)` in `lib/checkout.ts` **(new)**: it must start with `/`, must not start with `//`, must not point at `/checkout`; otherwise it falls back to `/configure/billing`. This prevents an open redirect in the hand-off code.
- `CheckoutLauncher` builds `return` from `usePathname()` + `useSearchParams()` at the moment `openTopUp` fires, `encodeURIComponent`-encoded. It never opens checkout in an embedded YouConnect session or for an invoiced org.
- Steps use `router.push`, so browser Back walks the steps. Pay success uses `router.replace(…step=done)`, so Back can't land on Review and pay twice. "Exit checkout" is `router.push(return)`, never `router.back()` (deep links and email CTAs have no history).
- **Draft before checkout.** The drop / YouConnect overlay run creates nothing before Start today (`RunModal.tsx:67-90`), and `run.store` is in memory only. Before leaving for checkout from Review setup, the overlay run calls `addReview({ status: "intake", reviewTypes: selected, … })` and sets `return=/reviews/<newId>&types=…`. On return, `runEntry` maps `intake → confirm`, so Review setup reopens with the same selection (read from `types=`, else the draft's `reviewTypes`). The routed review does the same with its existing id. These intake drafts are the "Waiting to start" count on Billing at zero.
- A hard reload on checkout keeps the wallet (adapter-backed) and the draft (it is a review), so nothing depends on `run.store` surviving.

**Components**

| Action | Path | What |
|---|---|---|
| add | `components/organisms/checkout/CheckoutShell.tsx` **(new)** | Top bar: logo · stepper "1 Amount · 2 Payment · 3 Review" (numbers; done steps show `check`) · "Exit checkout" (returns to `return` or `/configure/billing`). Body frame: check DS `TaskFlow presentation="page"` with `aside` = summary first; else a local `1fr 336px` grid |
| add | `components/molecules/HStepper.tsx` **(new)** | Horizontal numbered stepper (numbers, `check` when done, connector lines). No DS or local equivalent exists (`StepRail` is vertical, `StepperModal` is PC-8's rejected option) (`// DS-candidate`) |
| add | `components/molecules/SelectTile.tsx` **(new)** | One selectable tile (2 px navy border + `--md-selected` when on, check disc) for packs, call slots and onboarding answers. Use DS `OptionCard` instead if it lays out 4-up (`// DS-candidate`) |
| add | `components/organisms/checkout/AmountStep.tsx` **(new)** | Pack tiles from `CREDIT_PACKS` + Custom (`CUSTOM_CREDITS`, `customPriceUsd`), outcome translation, cost block |
| add | `components/organisms/checkout/PaymentStep.tsx` **(new)** | Saved card radio / new card; billing contact; extra receipt email; PO number; auto-reload opt-in |
| add | `components/organisms/checkout/ReviewStep.tsx` **(new)** | Line items, balance now/after, editable rows, terms checkbox, "Pay $1,400" |
| add | `components/organisms/checkout/PaidStep.tsx` **(new)** | Confirmation, scene `24-scene-checkout-success` 280 px below the confirmation line, three next-action cards |
| add | `components/organisms/checkout/OrderSummary.tsx` **(new)** | Sticky right column (icons only, no art). Board 2 `#checkout-payment` / `#checkout-review` draw a wallet top-up illustration in the summary: the board is wrong (one illustration per view, none on form steps) and is listed for redraw (§11) |
| add | `components/organisms/checkout/CostBlock.tsx` **(new)** | "What does a review cost?" rows; shared with How credits work |
| add | `app/checkout/credits/hooks/useCheckout.ts` **(new)** | Draft from query (`initialChoice(needed)` moves here from `TopUpModal`: the smallest pack that covers `needed`, else Custom); `pay()` → `useWalletStore.purchase()`, optional `setAutoReload`, `setPaymentMethod`, `setBillingSettings` (the same setters Billing → Settings uses, so the two never disagree; add `WalletSettings.receiptCc` for "Also send receipts to"; `billingEmail` and `poNumber` exist), request fulfilment (phase 4) |
| change | `store/wallet.store.ts` | `openTopUp({ reason, needed })` keeps its signature but only records intent; `components/organisms/CheckoutLauncher.tsx` **(new)**, mounted in `AppShell`, routes to checkout and clears it (callers unchanged). **Bug to fix at the caller:** `CostSummary`'s `LowBalanceCallout` passes the full cost as `needed` (`CostSummary.tsx:191`), not the shortfall, so "Add 1 credit" would prefill wrong |
| change | `app/emails/content.ts` | The low-balance and zero-balance "Add credits" CTAs get `href: "/checkout/credits?pack=pack10"` (today they have none, `:176`) |
| change | `components/organisms/CommandPalette.tsx` | Add actions "Add credits" (admins, wallet orgs) and "How credits work" |
| delete | `components/organisms/wallet/TopUpModal.tsx`, `components/organisms/wallet/topup-chips.css` | Replaced. `ReceiptDialog.tsx` stays |
| change | `components/organisms/wallet/index.ts`, `components/templates/AppShell.tsx` | Drop `TopUpModal` export and mount |

**Copy and states**

| Step | Copy (boards 1 frame 16, board 2) |
|---|---|
| Amount | "How many credits do you need?" "Credits are shared across Harbor Community Bank. Each review type uses one." Tiles: "5 credits · $750 · $150 each" / "10 credits · $1,400 · $140 each · Save 7%" / "20 credits · $2,600 · $130 each · Save 13%" / "Custom · Any amount · from $150 each". Outcome: "5 full reviews · Both review types on each report" or "10 single reviews · One review type on each report". Reassurance: "Purchased credits last 12 months · Shared across your organization · Receipt emailed to you". Cost block: "What does a review cost?" Technical review "Every figure checked against the appraisal and your policy" 1 credit $150; Administrative review "Your compliance checklist, item by item" 1 credit $150; Both on one report "A full review, the usual choice for a commercial loan" 2 credits $300; link "How credits work" |
| Summary (all steps) | "Your order" · "10 credits $1,400" · "Price per credit $140" · "Current balance 4 credits" · "After purchase 14 credits" · "About 7 full reviews" · "Due today $1,400" · CTA "Next: Payment" / "Continue to review" / "Pay $1,400" · "Prefer a monthly invoice? Talk to us" |
| Payment | "Payment" "Pay by card now, or add a PO number so your accounts team can match the receipt." "Pay with": "Visa ending in 4242 · Expires 08/28 · Dana Reyes · Saved card" / "Use a new card · Visa, Mastercard, American Express or Discover" (Card number, Expiry, Security code). "Billing contact · Receipts go to this person": Name, Email, "Also send receipts to (optional)", "PO number (optional)" placeholder "For example PO-2026-1184", help "Printed on the receipt and the monthly statement." Auto-reload: "Turn on auto-reload" "Add 10 credits ($1,400) to this card when the balance drops below 2, so a review never stops at Start. Change or turn it off any time in Billing settings." chip "Optional". "Back" · "Continue to review" |
| Review | "Review and pay" "Check the order. Nothing is charged until you select Pay." Table: Item · Quantity · Price per credit · Amount → "Credit pack, 10 credits · Valid 12 months, until Nov 11, 2027 · 10 · $140 (was $150) · $1,400.00"; Sales tax $0.00; Total. "Your balance": "Now 1 credit · Not enough for a full review" / "After you pay 11 credits · 5 full reviews, with 1 credit left". Rows with "Change": Paying with · Receipt to · PO number · Auto-reload (Off · Turn on). Terms: "I agree to the credit terms. Purchased credits last 12 months and are shared across Harbor Community Bank." "Back" · "Pay $1,400" |
| Paid | "Paid $1,400.00" **"10 credits added"** "Your balance is now 11 credits, enough for 5 full reviews. We emailed receipt R-2026-0412 to dana.reyes@harborcb.com and ap@harborcb.com." Facts: Balance 1 → 11 credits · Valid until Nov 11, 2027 · Paid with Visa ending in 4242 · PO number. "What next": Start a review / View receipt / Set up auto-reload (only if it was skipped). With `return`: primary becomes "Back to your review" |
| Errors and edge states | Pay without terms → inline "Agree to the credit terms to pay" and focus the checkbox. `error=card` → callout fail "Your card was declined. Try another card or ask your bank." on Payment. Custom > 100 → "Over 100 credits? Talk to sales for volume pricing" with "Talk to us". Pending org → Pay opens the approval lock dialog. Reviewer reaching the URL → role lock dialog (Ask Dana) |

**Acceptance**
- [ ] A saved card skips Payment (Amount → Review); the stepper still lets you open Payment.
- [ ] Every Add credits entry (header popover, billing band, Invoices empty state, Review setup credits dialog, the email CTAs, the command palette; `ExpiryAlert` now offers "Start a review" instead, §5.8) lands here with the right amount; `needed` is always the shortfall.
- [ ] `return` survives the round trip: leaving from Review setup and paying lands back on `/reviews/<id>` at Review setup with the same types selected, also after a hard reload on checkout.
- [ ] A `return` of `//evil.example`, `https://…` or `/checkout/…` falls back to `/configure/billing`.
- [ ] Pay is never `disabled`.
- [ ] Prices come from `creditRateUsd` / `customPriceUsd`; the "single credit" option uses `creditRateUsd(1)`.
- [ ] Summary column is sticky and the content column fills the rest (no max width).
- [ ] No illustrations on Amount, Payment or Review.

### 5.7 How credits work (`/configure/billing?tab=credits`)

| Action | Path | What |
|---|---|---|
| add | `components/organisms/billing/CreditsExplainer.tsx` **(new)** | Hero (text left, scene `20-scene-how-credits-work` 420 px right), cost cards, zero/expiry blocks, FAQ (`Accordion`), sales panel with spot `12b` |
| change | `app/(shell)/configure/billing/page.tsx` | Add tab "How credits work" for admin (Overview · Usage · Invoices · Settings · How credits work, plus the flag-gated Plans tab, unchanged), reviewer (Overview · My usage · How credits work), invoiced admin (Usage · Invoices · Settings · How credits work) and **invoiced reviewer** (Usage · How credits work; today a bare `UsageTab` with no band). Board 1 `#how-credits-work` draws tabs without Overview and a crumb "› How credits work": both are stale; tabs are not crumbs |
| add | `app/(shell)/configure/billing/credits/page.tsx` **(new)** | Redirect to `?tab=credits` |

**Copy** (board 1 frame 17; corrected where flagged)

- Title "How credits work"; lead "One credit pays for one review type on one appraisal. Buy them in packs, share them across your team, and see exactly where each one went."
- "What a review costs": Technical review · 1 credit · $150 at list price · "Every figure traced to its page and checked against your policy." / Administrative review · 1 credit · "Your compliance checklist, item by item." / Full review, both types · 2 credits · $300 · "What most commercial loans need."
- "When you reach zero": "Reviews already running finish as normal. New reviews wait until someone adds credits. Admins get an email when 3 credits are left." (board said 2; now `LOW_BALANCE_AT`)
- "When credits expire": "Purchased credits last 12 months from the day you buy them. Trial and earned credits don't expire. We use the credits that expire soonest first." (board said "oldest first"; corrected to PC-16)
- FAQ: "When is a credit used?" → "When a review starts. If a review fails to run on our side, the credit goes back to your balance." · "Who can spend credits?" → "Anyone on your team who starts a review. Credits come from one shared balance, and Billing shows who used what." · "Can we pay by invoice instead of card?" → "Yes, for larger teams. Talk to us and Realwired sets up monthly invoicing." · "What happens to unused credits?" → "Purchased credits last 12 months; trial and earned credits stay until you use them." · "Do appraisers need an account?" → "No. Only your reviewers sign in."
- Sales panel: "Need an invoice or a larger volume?" "Monthly invoicing, 100+ credits, or a contract for several branches." "Talk to sales".
- Enterprise pill state: sales panel moves to the top.

- [ ] All numbers from `lib/pricing.ts`.
- [ ] Reachable from popover, checkout, lock dialogs, Get started resources and the Learning Center.

### 5.8 Billing states (`/configure/billing`)

**Layout source:** board 2 frames (`#billing-trial`, `#billing-low`, `#billing-zero`, `#billing-expiring`, `#billing-invoiced`, `#billing-usage`, `#reviewer-billing`). Board 1 `#billing-pill` (frame 21, three equal cards) is a pill demo, not a layout: keep the real Overview structure (`BalanceHero` with runway bar → `Facts` → compact `UsageCard` → `BalanceCard` → Recent activity).

**Components:** `components/organisms/billing/OverviewTab.tsx` (`BalanceHero`, `Facts`, `ExpiryAlert`, `ReviewerBilling`), `components/organisms/billing/BalanceCard.tsx`, `components/organisms/billing/useBilling.ts`, `components/organisms/billing/usage/UsageTab.tsx`, `components/organisms/billing/invoices/InvoicesTab.tsx`, `components/organisms/billing/settings/AutoReloadSection.tsx`, `app/(shell)/configure/billing/page.tsx`. Add `components/organisms/billing/BonusNotice.tsx` **(new)** and `components/organisms/billing/AutoReloadOffer.tsx` **(new)**. Every number via `lib/wallet-view.ts`.

**Band (PC-33):** Billing moves onto the library page band, the same as Reviews: DS `PageHeader toolbar` + DS `Tabs`, then "Prefer a monthly invoice? Talk to us" (link) · "How credits work" (link) · "Add credits" (primary, the band's action) on every admin wallet tab. Board 2 puts "Add credits" inside the hero; build it in the band. Invoiced admins keep "Download statement" in the band (statement access stays; Invoices rows open it too). While pending, "Add credits" is a `LockedAction` (approval) on the page, not only inside a dialog.

**Fixes the states need (audit B §2):** low tone keys off `LOW_BALANCE_AT` via `wallet-view.lowTone`, not `runwayWarn` (runway days); `spendOrderSentence` (`billing-data.ts:253`, "Trial and earned credits are used first") is rewritten to the PC-16 order; the never-used Overview links the sample review (`OverviewTab.tsx:235`) and loses that link (PC-4); "Waiting to start" counts the org's `intake` drafts (§5.6); `ExpiryAlert`'s action changes from "Add credits" to **"Start a review"** (spending the expiring credits is the point; board 2 `#billing-expiring`).

| Pill state | Overview content (board 2) | Illustration |
|---|---|---|
| Never used (`fresh`) | Balance **"6 trial credits"** "About 3 full reviews. Trial credits never expire, so there's no clock on using them." Bonus notice: "Earn 2 more full reviews by finishing setup. 14 days left to complete the tasks on Get started." · "Open Get started". "When you need more": pack row. Usage by person: EmptyLine "Nothing used yet. Each person's usage shows here once they start a review." Activity: "Trial credits added · Nov 1 · +6" | none |
| Trial | as above with 4 credits, usage rows, "12 days left" | none |
| Healthy | calm hero, facts, runway, breakdown, activity | none |
| Low | **"3 credits · Running low"** "Enough for 1 full review. At your pace of about 9 credits a week, this runs out on Thursday." Facts: Used this month 11 · Weekly pace ~9 · Runs out Thu, Nov 13 · Auto-reload Off. `AutoReloadOffer`: "Never stop at Start" "Auto-reload adds credits to Visa ending in 4242 before you run out, so reviewers aren't blocked mid-week." "10 credits when below 2 · $1,400 each time · up to 2 times a month" · "Turn on auto-reload" · "Change amount". Breakdown "Used soonest-expiring first". Usage by person. Receipts | `14-credits-expiring` 96 px in the offer card |
| Zero | **"0 credits · Out of credits"** "New reviews can't start. Reviews already running finish normally." Facts: Used this month 22 · Ran out Today, 9:40 AM · Waiting to start 2 reports · Auto-reload Off | `01b-credits` 120 px |
| Pending | Hero "On hold" with `PendingTracker`; Add credits is a `LockedAction` (approval) | `09b-approval-pending` 120 px (same slot as zero) |
| Invoiced | Tabs Usage · Invoices · Settings · How credits work; hero **"November so far · 38 credits used"** "Harbor Community Bank moved to monthly invoicing in August, after a call with Realwired. Credits are counted as reviews start and billed at $140 each. There's no balance to top up. Next statement on Dec 1." Facts: Estimated so far $5,320 · Last month 51 credits · Reports reviewed 21 · Payment terms Net 30. Invoices list; Usage by person (Person · Role · Reports · Technical · Administrative · Share · Credits); "Export CSV" | none |
| Auto-reload on | Chip "Auto-reload on · 10 below 2"; low variant shows the auto top-up row in activity | none |
| Credits expiring | Banner: "3 credits expire in 6 days, on Nov 17. They're from the 5-credit pack bought Nov 17, 2025. We use credits that expire soonest first, so 2 reviews this week use them up." · "Start a review". Hero 14 credits "Enough for 7 full reviews…"; runway bar with the expiring slice; breakdown rows with expiry dates; "Trial and bonus credits · Never expire · 2" | none (`ExpiryAlert` stays) |
| Bonus ending / closed | `BonusNotice` (also on Dashboard): ending "2 days left to earn your bonus reviews" "You've earned 1 of 2 bonus full reviews. Finish "Make it your bank's review" before Nov 13 to earn the other one. Your trial credits stay either way." + next step's button (board said "Upload your bank policy"; corrected because the reward is per section). Closed: "The bonus window has closed" "You earned 1 bonus full review. Your 4 credits are still yours and never expire. When you need more, packs start at 5 credits for $750." "Talk to us about invoicing" · "Add credits" | none |
| Reviewer · Healthy / Low / Zero / Requested | Tabs Overview · My usage · How credits work. "Team balance · 2 credits · Running low" "Shared by everyone at Harbor Community Bank. Enough for 1 full review. Dana Reyes manages billing." Facts: You used 7 this month · Team used 11 · Runs out About Thursday · Admin Dana Reyes. "Need more credits?" "Only admins can buy credits. Dana Reyes gets your request by email and in Parachute, with a button to add credits." Note field → "Ask Dana for more credits". Usage table. Requested: tracker "You asked Dana Reyes for more credits 9:12 AM · Dana opened the request 9:40 AM · Credits added Waiting", note echoed, "We'll tell you when credits land." "Send a reminder" · "Cancel request" | `15-request-sent` 104 px in the requested state |

**Acceptance**
- [ ] Every row above is reachable from the Billing pill in one click and survives a reload.
- [ ] Amber only for low and expiring; red only at zero.
- [ ] Invoiced has no balance, runway or Add credits.
- [ ] "Prefer a monthly invoice? Talk to us" visible on every admin wallet tab and in checkout (PC-9).
- [ ] The 3-level empty rule still governs Usage and Invoices (EmptyState / EmptyLine).
- [ ] Usage tab (PC-28): the donut's two slices and the by-person total both equal `usedThisMonth` for the selected period (board: 12 in November); the balance is never drawn as a donut.

**Usage tab (PC-28, board 2 `#billing-usage`)**

Admin tab "Usage" (and the invoiced Usage tab below its hero). Component: `components/organisms/billing/usage/UsageTab.tsx`; add `components/organisms/billing/usage/UsageDonut.tsx` **(new)** and `components/organisms/billing/usage/UsageByPerson.tsx` **(new)**. Both are local, hand-built: DS `DonutViz` takes palette indices, not the `--viz-*` tokens, and DS `BarViz` is a chart, not a text list.

**Composition (PC-34):** filter row → "Credits used" donut card + "By person" card → `LedgerSection`. `UsageChart` (bars), the by-source grouping and `BreakdownTable` leave the Usage tab; the compact `UsageCard` on Overview stays.

| Part | Spec |
|---|---|
| Filter | One row above the cards: "Period · November 2026" (month picker, current month default) · "Export CSV" |
| Card "Credits used in November" | Donut, 2 slices: Technical, Administrative, in that fixed order from 12 o'clock clockwise. Ring 22 px on a 180 px chart, 2 px surface gap between slices, no slice labels. Centre: "12" (display, `tabular-nums`) over "credits used". Sub-header shows the range ("Nov 1 to Nov 11") |
| Series colours | Tokens `--viz-tech` `#1d5592` and `--viz-admin` `#0a9fae` (dark `#3a74c0` / `#14a7b6`). Brand navy `#10344c` and petrol `#2a6f7f` fail the dataviz validator's lightness band and chroma floor, so these are the nearest passing steps of the same hues. Light pair: normal-vision ΔE 21.6, CVD ΔE 21.2, both ≥ 3:1 on white. Colour always means review type, never rank |
| Legend | Always shown, beside the donut: swatch · type · share ("67%") · "8 credits" · "= 4 full reviews"; then Administrative 4 · 33% · "= 2 full reviews"; Total 12 · "= 6 full reviews". Footnote: "1 credit is one review type on one report. A full review, Technical and Administrative, is 2 credits." Text uses text tokens, never the series colour |
| Card "By person" | Ranked horizontal bar list, most credits first, one hue (`--md-primary`): avatar · name · bar (≤ 12 px, 4 px rounded end, square at the start, scaled to the top person) · "4 credits". Total row. Not a donut: 5+ reviewers make slices unreadable and names need room. Board: Marcus Ortiz 4, Dana Reyes 3, L. Chen 2, Priya Shah 2, Tom Walsh 1 = 12 |
| Empty period | Each card shows one EmptyLine, "No credits used yet this period." No empty ring, no zero bars. A never-used workspace still gets the level-1 EmptyState (§5.12) |
| Data | `usageByType(period)` and `usageByPerson(period)` in `lib/wallet-view.ts`: spend entries in the ledger within the period, grouped by review type and by actor. Refunds net out. Full-review equivalent = credits ÷ `costFor(FULL_REVIEW_TYPES)` (2) |
| Accessibility | The donut SVG has `role="img"` and an `aria-label` sentence ("12 credits used in November: Technical 8 credits (67%), Administrative 4 credits (33%).") plus a visually hidden `<table>` with the same rows; the centre label is `aria-hidden`. Per-slice tooltip is information only, never an action, and the legend carries every value without hover. By-person is a list with the value as text in each row |

**Acceptance (Usage tab)**
- [ ] Changing the period updates the donut, legend, centre label and by-person list together, and their totals agree.
- [ ] Slice colours follow the review type across periods (a period with only Technical use still shows Technical in `--viz-tech`).
- [ ] Screen reader reads the `aria-label` sentence and the hidden table; nothing needs hover.
- [ ] Empty period shows the one-line empty in both cards.

### 5.9 Reviewer credit request flow

| Action | Path | What |
|---|---|---|
| add | `types/domain.types.ts` | `CreditRequest { id; orgId; requesterId; note?; createdAt; status: "open" \| "opened" \| "fulfilled" \| "dismissed" \| "cancelled"; openedAt?; resolvedAt?; remindedAt? }` |
| add | `data/collections.ts` | `CREDIT_REQUESTS: "credit_requests"` |
| add | `store/credit-request.store.ts` **(new)** | `request(note)`, `remind(id)`, `cancel(id)`, `markOpened(id)`, `dismiss(id)`, `fulfil(id)`; one open request per requester |
| add | `data/seed/credit-requests.seed.ts` **(new)** | One open request from Marcus (`user-mo`) in the "Request waiting" scenario only |
| change | `components/organisms/billing/OverviewTab.tsx` (`ReviewerBilling`) | Request form and tracker |
| change | `app/emails/content.ts` | "Marcus asked for more credits" email to the admin |

Flow: reviewer asks (the credits `LockDialog` over Review setup, or Billing; both write the same record) → admin popover shows the request (opening it sets `opened`) → "Add credits" → checkout with `request=<id>` → Paid sets `fulfilled` → reviewer sees "Credits added" and a toast on next load. "Dismiss" → reviewer sees "Dana closed your request" with "Ask again".

An admin inside a review can't see the pill (§5.0), so the request also goes out as the "Marcus asked for more credits" email; a bell entry is a follow-up (§11).

- [ ] No per-person limit introduced.
- [ ] The request survives reload (adapter-backed) and appears for the admin only.

### 5.10 Trust Center (`/trust`)

| Action | Path | What |
|---|---|---|
| add | `app/(shell)/trust/page.tsx` **(new)** | Signed-in page |
| add | `app/shared/trust/[token]/page.tsx` **(new)** | Public view for IT (no account), same content, no shell; "Shared by Dana Reyes, Harbor Community Bank" |
| add | `components/organisms/trust/TrustCenter.tsx` **(new)** | Hero (text left, scene `21-scene-trust-center` 420 px right) · Documents list (icons only) · "At a glance" facts · contact line |
| add | `components/organisms/trust/SendToItDialog.tsx` **(new)** | Moves the send flow from `app/(shell)/configure/security/hooks/useSecurityPack.ts` (keep the hook, re-home it to `components/organisms/trust/useTrustSend.ts` **(new)**); completes `security_pack` |
| change | `lib/security-pack.ts` | Becomes the Trust Center data: board's six documents first, then "Data handling and no-training statement" and "GLBA safeguards mapping" kept unless Realwired says otherwise; facts with `placeholder: true` |
| change | `app/(shell)/configure/security/page.tsx` | Redirect to `/trust` |
| change | `app/(shell)/configure/page.tsx` | Security card → "Trust Center" linking to `/trust` |

**Copy** (board 1 frame 18): "Trust Center" "Everything your IT and vendor-management team needs to approve Parachute. Send them one link; they don't need an account." "Send to IT" (primary) · "Copy link". Documents: SOC 2 Type II report "Independent audit of our security controls · PDF, updated Sep 2026" "Request access" · Security overview "Hosting, encryption, access control and monitoring · PDF, 12 pages" Download · Data processing agreement "How we handle borrower and property data · PDF, ready to sign" · Penetration test summary "Third-party test, findings and fixes · PDF, Jul 2026" · Subprocessors "Every vendor that touches your data, and why · Web page, updated monthly" View · Vendor questionnaire "SIG Lite, pre-filled · Spreadsheet". "At a glance": Hosting (Placeholder) · Encryption "At rest and in transit" · Sign-in "Realwired ID, SSO" · Data retention "Set by your bank" · Uptime, 90 days "99.98%" (Placeholder). Footer "Questions from IT go to security@realwired.com." (Placeholder).

**States** (pill: Trust Center / **Signed in** / Public / Sent to IT / Link expired)

- [ ] Every fact Realwired hasn't supplied shows a "Placeholder" chip. Hosting shows only "Placeholder" until Realwired confirms the provider (the current pack and the board disagree; Q-E8).
- [ ] "Request access" opens a short request form (NDA-gated), never a dead link.
- [ ] Linked from the sidebar, the Get started header ("Visit Trust Center"), resources row and the `team` section.

### 5.11 Learning Center (`/learn`)

| Action | Path | What |
|---|---|---|
| add | `app/(shell)/learn/page.tsx` **(new)** | Page |
| add | `lib/learning.ts` **(new)** | Single source for every video and guide: groups, durations, audience (`admin` · `reviewer` · `everyone`), related step / page / setting ids. Replaces `lib/guides.ts` (keep `PLACEHOLDER_VIDEO`, `stepVideo` re-exported for one release) |
| add | `components/organisms/learn/LearningCenter.tsx` **(new)** | Hero with scene `22-scene-learning-center` 420 px · search · filter chips All / Admin / Reviewer · "Continue where you left off" · groups · "PDF guides" · "Page tours" (re-run any tour) |
| add | `components/organisms/learn/VideoCard.tsx` **(new)** | Thumbnail + duration + watched state; opens `GuidePlayer` |
| change | `store/prefs.store.ts` | `videoProgress: Record<userId, Record<videoId, { seconds; done }>>` |

**Copy** (board 2): "Learning Center" "Short videos and printable guides for every part of Parachute. Watch one when you get stuck, or send a guide to someone new on the team." Search placeholder: "Search videos and guides, for example "sign a workbook"". Groups: Getting set up (Create your organization 2:40 · Invite your team 1:55 · Upload your bank policy 3:30 · Choose review defaults 5:10) · Running a review (Start your first review 3:15 · Technical vs Administrative 4:20 · Sending a report from YouConnect 5:05 · What credits a review uses 2:10) · Working with findings (Writing a finding with a citation 4:45 · Using the response library 3:50 · Returning a report to the appraiser 4:30) · Your workbook (Reading the workbook 6:30 · Editing blocks inline 4:15 · Signing and exporting 4:05) · Admin (Buying credits and auto-reload 3:40 · Reading usage by person 2:55 · Custom workbook layouts 6:10 · Sending the security pack to IT 3:05). "PDF guides · Print them or pass them on": Reviewer quick-start (Reviewer) · Admin guide: setup, credits and billing (Admin) · Review checklist reference (Everyone).

- [ ] All videos use `PLACEHOLDER_VIDEO` until Realwired supplies clips; the two existing PDFs (`app/public/guides/parachute-reviewer-guide.pdf`, `parachute-admin-guide.pdf`) back the first two guides; the checklist reference is marked placeholder.
- [ ] Search filters titles and groups; an empty search result uses `EmptyLine` with "Clear search".
- [ ] Progress persists per user; "Continue where you left off" hides when nothing is in progress.
- [ ] Each Get started row links to its video (from `lib/learning.ts`).

### 5.12 Empty-state videos and first-time-setting videos

The 3-level empty rule (`components/molecules/EmptyState.tsx`, `docs/plans/self-serve/v6-brief.md`) stays. **The video replaces only the decorative ghost preview at level 1.** Levels 2 and 3 are unchanged.

| Action | Path | What |
|---|---|---|
| change | `components/molecules/EmptyState.tsx` | New prop `media?: ReactNode`, rendered in the preview slot, **not** `aria-hidden`; `preview` and `media` are mutually exclusive (backwards-compatible) |
| add | `components/organisms/EmptyVideo.tsx` **(new)** | Poster + title + duration ("How a review works · 1:15"); plays inline via `GuidePlayer`; data from `lib/learning.ts` |
| add | `components/organisms/SettingVideoHint.tsx` **(new)** | Small card beside a setting the first time it is changed: title, duration, "Watch" · "Dismiss"; seen flag in prefs `hintsSeen` |

| Page (order of build) | File | Level-1 content |
|---|---|---|
| Reviews (board 1 frame 14 `#reviews-empty`) | `app/(shell)/reviews/page.tsx` | Title "Every figure checked against the appraisal" "Upload a commercial appraisal. Parachute traces each number to its page and drafts the findings for you to concur with or reject." Upload zone "Upload an appraisal PDF · up to 300 pages" (**new**, PC-37: opens the `RunModal` confirm gate through `useIntakeStart()`; a `LockedAction` while pending). Media: "How a review works · 1:15". Footnote "Dana and Marcus see this until Harbor's first review is in." The sample aside ("Open the sample") goes (PC-4). Reviews has no title row and its toolbar is hidden at level 1, so **no tour chip on the empty page** (PC-38); the header `OrderButton` stays |
| Checklists | `app/(shell)/configure/checklists/page.tsx` | Promote the current EmptyLine to a level-1 `EmptyState` when the org has none: "Your compliance checklist lives here" + "Upload a checklist" + media "Mapping a checklist · 1:30" |
| Workbook layouts | `app/(shell)/configure/workbook-layouts/page.tsx` | Level 1 when only the default exists: "Make the workbook yours" + "Start from a built-in layout" + media "Custom workbook layouts · 6:10" |
| Billing (Usage / Invoices never used) | `components/organisms/billing/usage/UsageTab.tsx`, `components/organisms/billing/invoices/InvoicesTab.tsx` | Replace `GhostBars` preview with media "What credits a review uses · 2:10" / "Buying credits and auto-reload · 3:40" |

First-time-setting videos (`SettingVideoHint`): auto-reload switch (`components/organisms/billing/settings/AutoReloadSection.tsx`, "Buying credits and auto-reload"), review defaults (`app/(shell)/configure/defaults/page.tsx`, "Choose review defaults"), checklist "Set as default" (`app/(shell)/configure/checklists/[id]/page.tsx`, "Mapping a checklist"), layout Publish (`app/(shell)/configure/workbook-layouts/view/page.tsx`, "Custom workbook layouts").

- [ ] Level 1 never shows tabs, filters, headers or totals (unchanged rule).
- [ ] Video controls are keyboard-operable; captions placeholder noted.
- [ ] Hint shows once per user per setting; never blocks the control.

### 5.13 Tours (react-joyride)

| Action | Path | What |
|---|---|---|
| add dep | `app/package.json` | `react-joyride@3.2.0` (MIT), pinned. Peer range `react 16.8 - 19` verified 11 Nov (audit D §1.3). **v3 is a new major: build to the v3 API, not v2 examples.** Fallback if it misbehaves: DS `Popover` + `PopoverAnchor` on the `data-tour` target plus a spotlight ring, behind the same `lib/tours.ts` contract |
| add | `lib/tours.ts` **(new)** | Tour definitions: id, route pattern, steps (target `data-tour` selector, title, body, placement), `completesStep?` |
| add | `store/tour.store.ts` **(new)** | `start(id)`, `stop()`, active step; seen state in prefs |
| add | `components/organisms/tour/TourHost.tsx` **(new)** | Mounts Joyride once in `AppShell` **and** once inside the review takeover (`RunExperience`), because `.run` covers the shell's stacking context; both portal to `document.body` at the PC-31 tier (overlay 126, tooltip 128). Custom `tooltipComponent` = `TourTooltip` (title, body, dots, Skip / Next with local `Button`; `// DS-candidate`); "Skip tour" is a real button; spotlight dim uses a token; respects reduced motion. Inside `aria-modal` `.run` the tooltip must be focusable. Check spotlight rects inside the CSS-`zoom`ed `.run-wb-zoom` and its scroll container |
| add | `components/molecules/TourChip.tsx` **(new)** | "Take a 1-minute tour" chip: local `Button size="sm" variant="outline"` with a petrol icon + dismiss `IconButton` (no new chip type). Rendered in a **shell header slot beside `Breadcrumbs`** for page tours (route match from `lib/tours.ts`), and in **`.run-head`** (between the title block and the close X) for the review tour, which also shows "Tour, n of 4" there (PC-38). Shown on first visit only, and only when the tour's first target exists |
| change | `store/prefs.store.ts` | `toursSeen: Record<userId, Record<tourId, "done" \| "dismissed">>` |
| change | target files | Add `data-tour="…"` attributes (no behavior change): `components/review/WorkbookInline.tsx` (first `.wb-fmeta-cite`, first pending `.wb-fblock-bar`), `components/run/RunWorkbook.tsx` (`.run-wb-viewmode`, the footer `Sign & finalize` at `:507`), `components/run/RunExperience.tsx` (`.run-head` chip slot), `app/(shell)/reviews/page.tsx`, `app/(shell)/configure/checklists/page.tsx`, `app/(shell)/configure/workbook-layouts/page.tsx`, `components/organisms/billing/OverviewTab.tsx`, `app/(shell)/configure/billing/page.tsx`. **Not** `components/molecules/FindingDecisionBar.tsx` (orphaned: only `run/_archive/RunExceptions.tsx` imports it), **not** `components/run/RunSign.tsx` (the seal modal, not the trigger), **not** `app/(shell)/reviews/[id]/page.tsx` (it only renders the portal) |

| Tour | Where | Steps (title · body) |
|---|---|---|
| `first-review` (4, completes `tutorial`) | The user's own review, in the takeover; started from Get started "Start tour" (`?tour=first-review`) or the `.run-head` chip; `.run-head` shows "Tour, 2 of 4". **Starts only** on spoke `workbook`, Technical track, `ctx.ready` (after `RunProgress` auto-advances); never on `confirm`, `progress` or `triage`; on a two-type run it switches to the Technical tab first | 1 "Every figure, traced" · "Click any cited figure to open its page in the appraisal, beside the workbook." → first `.wb-fmeta-cite` (the Source pane docks on the **right**, `RunWorkbook.tsx:132`; board 1 `#tour` draws it on the left) (card art: scene `23-scene-first-review` 280 px) 2 "Concur or reject" · "Concur to keep a finding as written. Edit to put it in your own words, or Reject it with a reason." → first pending `.wb-fblock-bar`, ringing Concur (spot `07b`) 3 "This is the workbook" · "Your decisions edit it in place. Preview shows exactly what gets signed." → `.run-wb-viewmode` (spot `08b`) 4 "Sign when it's right" · "Sign & finalize seals the workbook so it's ready for the lender." → footer `Sign & finalize` (spot `08b`). "Only approvers sign" is dropped: `RunSign` has no role gate (Q-E17). The tour ends before the Sign modal opens |
| `reviews` (3) | `/reviews`, chip only once the queue has rows | Start a review (`OrderButton`) · Tabs and search · Row actions (first row's action cell) |
| `checklists` (2) | `/configure/checklists` | Upload (`button.cfg-uploadzone`) · Set as default (the first row's `⋯` trigger). "Map items" lives inside `ChecklistUploadWizard` after a file is picked, so it moves to the video |
| `workbook-layouts` (2) | `/configure/workbook-layouts` | Your default layout (the default `FamilyTable` row) · Open it to edit sections and publish (that row's open action). Edit/Publish live on `/configure/workbook-layouts/view`; tours are per route |
| `billing` (4) | `/configure/billing` | Balance (`section.ov-hero`) · Runway (`.ov-runway`) · Usage (the Usage tab trigger; by-person is not on Overview) · Add credits (band action) |

- [ ] Tours are opt-in; nothing auto-starts.
- [ ] Missing targets are skipped, never crash.
- [ ] Finishing `first-review` calls `onboarding.complete("tutorial")`; skipping does not.
- [ ] Every tour re-runs from Learning Center → "Page tours"; scenario popover "Reset tours" clears `toursSeen`.
- [ ] Tooltip renders in a portal at the PC-31 tour tier (overlay 126, tooltip 128): above the review takeover (120), below the Sign modal (130), `LockDialog` (140), popovers (200), confetti (201) and the prototype pill (210). Any dialog opening stops the tour.
- [ ] "First visit to a review" (chip) = the first time the user reaches spoke `workbook` on their own review, not the first route hit.
- [ ] Every target in `lib/tours.ts` exists on its route in the default populated scenario (checked by the phase 5 smoke script).

### 5.14 Illustrations

| Action | Path | What |
|---|---|---|
| add | `components/atoms/Illustration.tsx` **(new)** + `components/atoms/illustrations/*.tsx` **(new)** | Each SVG from `docs/plans/pattern-change/illustrations/` as an inline React component (needed for `currentColor` and the `--ill-*` variables). Props: `name`, `size`, `panel`, `title` (else `aria-hidden`) |
| change | `app/globals.css` | `--ill-paper`, `--ill-accent`, `--ill-tint`, `--ill-shadow`, `--ill-shadow-strong`, `--ill-muted`, `--ill-stroke`, `--ill-stroke-scene` for light and dark (values in `illustration-guide.md` §3) |
| change | `app/AGENTS.md` | Record the illustration exception to "no ad-hoc inline SVG" and the tier rules |

Placement (from `illustration-guide.md` §6, with this spec's adjustments):

| Surface | File | Size |
|---|---|---|
| Get started header | none | — |
| Get started resources | `04b`, `03b`, `01b` (How credits work card; the guide listed `12b`, but the board's third card is How credits work) | 120 px, panel on |
| Get started all done | `08b-signed-workbook` | 120 px |
| Credits popover zero / held | `01-credits` / `09-approval-pending` | 48 px |
| Lock dialogs | `10b`, `09b`, `01b`; `15-request-sent` after asking | 96–104 px, panel off |
| Checkout Paid | `24-scene-checkout-success` | 280 px |
| How credits work hero / sales panel | `20-scene-how-credits-work` / `12b` | 420 px / 120 px |
| Trust Center hero | `21-scene-trust-center` | 420 px |
| Learning Center hero | `22-scene-learning-center` | 420 px |
| Book a call booked | `25-scene-call-booked` | 320 px |
| Billing low / zero / pending | `14-credits-expiring` / `01b` / `09b` | 96 / 120 / 120 px |
| First-review tour step 1 | `23-scene-first-review` (moved here: the Reviews empty state now carries the video) | 280 px |

- [ ] One illustration per view at most; never a scene in a dialog; no illustration on checkout form steps.
- [ ] No state colours, text or numbers inside art; light and dark both checked.
- [ ] `IconCoins` removed from `SetupChecklist.tsx`, `DemoDock.tsx`, `components/run/CostSummary.tsx`; then `coins` removed from the `Icon` map.

**Icons to add to `components/atoms/Icon.tsx`:** `school` (IconSchool), `hourglass-high` (IconHourglassHigh), `circle-dashed` (IconCircleDashed), `progress` (IconProgress), `file-search` (IconFileSearch), `messages` (IconMessages), `calendar-event` (IconCalendarEvent), `wand` (IconWand), `switch-horizontal` (IconSwitchHorizontal), `sitemap` (IconSitemap), `wallet-off` (IconWalletOff), `file-invoice` (IconFileInvoice), `arrow-up-right` (IconArrowUpRight), `stack-2` (IconStack2), `calculator` (IconCalculator), `receipt-refund` (IconReceiptRefund). Names checked against `@tabler/icons-react` 3.44 in `icon-map.md`.

### 5.15 Motion and transitions

Numbers live in `motion-contract.md`; the implementation lives in `motion-spec.md`. This section is the summary.

| Piece | What | Where |
|---|---|---|
| Tokens | `ease.standard` `cubic-bezier(0.2, 0, 0, 1)` for most motion, plus `ease.enter` and `ease.exit`; durations 150 / 280 / 480 ms; entrance = opacity + 12 px; 60 ms stagger, under 400 ms in total; no bounce on UI | `lib/motion.ts` **(new)** |
| Reduced motion and tests | `MotionConfig reducedMotion="user"` app-wide. Reduced motion: no travel, 120 ms fades, instant height, no confetti. Motion is off under Playwright (`navigator.webdriver`), with `?motion=0`, or with `NEXT_PUBLIC_MOTION=0` | `components/providers/MotionProvider.tsx` **(new)**, `app/layout.tsx` |
| T1 Sign-up → Verify | Content swap inside the Keycloak card; card height glides | `KeycloakFrame`, auth forms |
| T2 Verify → Org setup | The card moves from the centre to the left column, then the panel enters (about 600 ms). Different route groups, so this is exit, then enter with a matching first frame | `VerifyCodeForm` → `OnboardingFrame` |
| T3 / T3b Steps | Directional content swap; card height and centred position glide; panel content cross-fades. Browser back gets enter only | `welcome/layout.tsx` + `welcome/template.tsx` |
| T4 / T5 Hand-off | Card and panel leave → interstitial (PC-26) → shell arrives (sidebar then page) → Get started | `SetupInterstitial`, `AppShell`, `GetStarted` |
| Micro-interactions | Press, threshold callout and label swap, email chips, validation shake, busy button, slot select, verify code | `motion-spec.md` §4 |
| Celebration | Self-serve confetti once per user on landing; section burst on earning; enterprise on approval (Q-C9). Canvas at z 201, `pointer-events: none` | `lib/celebrate.ts` **(new)**, `canvas-confetti` 1.9.4 |
| Z-index | Full tier list in PC-31: `.run` 120 · tour 126/128 · 130 · 140 · toast 150 · tooltip 160 · popovers 200 · confetti 201 · pill 210. `motion-spec.md` §6.5's "tour 205" is superseded | `app/globals.css` tier variables (coordinator) |

- [ ] Every transition and micro-interaction uses `lib/motion.ts`; no inline durations or easings in onboarding, Get started or the shell arrival.
- [ ] Transform and opacity only, except the card's measured height and short inline height reveals.
- [ ] The acceptance checklist in `motion-spec.md` §10 passes.

---

## 6. State system (condensed from `state-system-draft.md`)

**Model.** One global **scenario** (typed record) + per-page **page states** (named partial scenarios plus an optional view param). Axes are canonical; pills are shortcuts. Applying a state normalizes the scenario, rebuilds the stage org `org-hcb` (PC-19) through `lib/demo.ts` row replacement, reloads stores and sets view params with `router.replace`. The pill derives its selection; no match shows "Custom".

| Axis | Values |
|---|---|
| audience | `self_serve` · `enterprise` · `youconnect` |
| lifecycle | `prospect` · `verified` · `pending` · `approved` · `suspended` (Planned, Q-E6) |
| wallet | `held` · `fresh` (6, nothing spent) · `trial` (4) · `healthy` (14) · `low` (3) · `short` (1) · `zero` (0) · `invoiced` |
| modifiers | `bonus: open · ending · closed` (PC-20) · `autoReload` · `expiring` · `paymentMethod: none · card · invoice` · `request: none · open` |
| setup | `fresh` (0/8) · `mid` (2/8) · `almost` (7/8) · `done` · `hidden` |
| role | `org_admin` · `approver` · `reviewer` |
| data | `empty` · `populated` · `busy` |

**Normalization** (impossible combinations are shown, and explain themselves when clicked): prospect/verified → no org; pending → wallet `held`, data `empty`, audience `enterprise`; youconnect → invoiced, done, approved; invoiced → no autoReload, no expiring, bonus hidden; setup done/hidden → Get started pill explains "Setup is finished. Pick New or Mid to see it."

**Ledger recipes** (`buildLedger(sc, now)`, `now` from the click): `fresh` trial 6 @ now−1h · `trial` trial 6 @ now−2d, 1 full-review debit (Get started board: 4 credits, 2/8) · `healthy` trial (spent) + pack20 @ now−20d, 6 debits → 14 · `low` pack10 + pack5 history → 3 (2 trial + 1 purchased, part-2 board) · `short` → 1 · `zero` → 0 · `+expiring` pack5 @ now−359d with 3 left · `+autoReload` settings on, `low` adds an `auto: true` purchase row · `bonus` sets the trial grant date so `earnWindow()` returns open (12 d), ending (2 d) or closed.

**Controls**

| Control | Spec |
|---|---|
| Pill (`ProtoPill`) | Top centre, portal, z 210 (above the 200 overlay tier). `[Page label] │ states │ wand │ scenario ▾ │ index │ hide`. Planned states are dashed and open "Not built yet". Short labels; description in a compact tooltip. Icon `switch-horizontal` |
| Scenario popover | Six axes + modifiers, presets, actions (Approve now, Complete next step, Add 5 credits, Spend 1 credit, Reset org, Open emails, Build notes, Reset tours and celebrations, Replay arrival), "Copy link" (`?s=`). Replaces DemoDock (which stays mounted until phase 5). DS `Popover` for the panel; local `SegmentedControl` for axes |
| Fill wand | `useProtoFill(screenId, { valid, invalid })`; Shift-click fills invalid; never submits. Icon `wand` |
| Hide | `localStorage` `parachute:proto:hidden`; `?controls=0` forces hidden without persisting; icon `eye-off` |
| Keys | Ctrl/Cmd + . toggle · Alt + 1…9 state · Alt + [ / ] prev/next · Alt + F fill · Alt + S scenario · Alt + I index (read via `e.code`, ignored in fields) |
| Kill switch | `NEXT_PUBLIC_PROTOTYPE_CONTROLS=0` (alias of `NEXT_PUBLIC_DEMO_PERSONAS`) removes everything |

**Registry file** `lib/prototype-registry.ts` **(new)**: `SCREENS`, `FLOWS`, `PRESETS`, `screenForPath()`, `activeState()`; shapes per draft §4.1 with the axis changes above. Both the pill and the index read it; a dev-only check warns when a `page.tsx` has no entry. Planned screens (checkout, Trust, Learn) are registered before they are built.

**Prototype Index** `/prototype` (`app/prototype/page.tsx` **(new)**, `app/prototype/go/page.tsx` **(new)** for deep links): header "Prototype Index", search "Search pages, routes, states, tags", counter "N of M screens", "Copy scenario link", "Open prototype ▾" (presets). Left rail groups with counts (Auth · Onboarding · Get started · Reviews · Billing & credits · Configure · Trust & Learning · Emails · Integrations · Design system) and a Status filter (Built / Planned). Tabs Screens · Flows · States. Card: thumbnail, title, route, status badge (Built · Variant · Planned · Retired), state chips (deep links), "In N flows", audience dots, "Has wand". Flows: Self-serve sign-up · Enterprise sign-up · First review · Buy credits · Out of credits at Start · Reviewer asks for credits · Reviewer day · YouConnect embedded · Trust Center hand-off to IT. Thumbnails from `scripts/proto-thumbs.mjs` **(new)** (grey placeholder if missing).

**Presets** (old persona id kept as alias): prospect → self-serve · prospect · prospect-sales → enterprise · verified · pending-admin → enterprise · pending · held · trial-admin → self-serve · approved · trial · mid · admin · populated · payg-admin-low → low · done · reviewer → trial · mid · reviewer · approver → healthy · done · approver · busy · returning → enterprise · approved · invoiced · done · enterprise-yc → youconnect. New: Self-serve zero, Bonus ending, Bonus closed, Enterprise call booked, Enterprise confirmed, Reviewer request waiting, Suspended (Planned).

**Files**

| Action | Path |
|---|---|
| add | `lib/prototype/scenario.ts`, `lib/prototype/scenario-builder.ts`, `lib/prototype-registry.ts`, `store/prototype.store.ts`, `components/organisms/prototype/{ProtoPill,ScenarioPopover,ProtoKeys,RoutingNote,useProtoFill,useProtoView}.tsx`, `components/organisms/prototype/prototype.css`, `data/seed/scenario-fixtures.seed.ts` (all **new**) |
| change | `components/templates/AppShell.tsx`, `app/(onboarding)/layout.tsx`, `components/templates/KeycloakFrame.tsx`, `app/checkout/layout.tsx` (mount pill + keys; auth gains controls) |
| change | `lib/demo.ts` (generic `replaceRows`; `rebuildStageOrg(sc)`), `lib/landing.ts` (`enterPreset()`; every entry through `resolveEntryRoute`), `app/start/page.tsx` (redirect to `/prototype`), `app/demo/[persona]/page.tsx` (alias to preset) |
| change | `components/organisms/auth/*Form.tsx` (read `?variant=`, register fills); `components/organisms/auth/SignInForm.tsx` + `app/(auth)/auth/sign-in/page.tsx` (remove `DemoAccounts`); `components/organisms/UserMenu.tsx` (remove persona switcher); `components/organisms/CommandPalette.tsx` ("Prototype" group) |
| delete | `components/organisms/DemoDock.tsx`, `store/demo.store.ts` (after popover parity); `data/seed/demo-personas.seed.ts` folds into `PRESETS` |

**Precondition (phase 0, P0):** one balance derivation and one auto-reload rule.
- Balance: `useWalletStore.balance()` sums the ledger while `BalancePill` sums `balanceGrants()` remainders. Make `lib/wallet-view.ts` (built on `balanceGrants`) the only source; `balance()` delegates to it.
- Spend order: implement PC-16 in **both** `remainingFromLedger`/`sourcesFor` (`store/wallet.store.ts`) and `balanceGrants` (`lib/wallet-breakdown.ts`).
- Auto-reload: `TopUpModal` falls back to a hardcoded `2` and ignores the monthly cap while `AutoReloadSection` and the store use `AUTO_RELOAD_DEFAULTS`. Checkout and Settings both write through `setAutoReload` with `AUTO_RELOAD_DEFAULTS`; the store rule (below threshold after a debit, within `monthlyCap`) is the one rule.
- Unit tests per ledger recipe: `balance()`, `remainingBySource()` and the breakdown total agree.
- Every balance reader moves to `lib/wallet-view.ts` (audit B §1b found three derivations): `BalancePill`, `WalletCard`, `BalanceHero` / `useBilling` (`balanceGrants()` remainders), `TopUpModal`, `DemoDock:27` and `DashboardFirstRun` (`dashboard-widgets.tsx:149`, raw ledger sums), `useRunCost` in `CostSummary.tsx:42-62` (its own sum).
- Copy that states the spend order follows PC-16: `spendOrderSentence` in `components/organisms/billing/billing-data.ts:253` ("Trial and earned credits are used first") is rewritten.
- Low tone keys off `LOW_BALANCE_AT` (`wallet-view.lowTone`) everywhere; `OverviewTab`'s `runwayWarn` (runway days) stops deciding the low tone.
- Phase 0 of §8 delivers all of this before any new UI.

---

## 7. Data and seeds

| Change | Where |
|---|---|
| HCB becomes a pure trial: trial grant 6, one full-review debit on its first review (4410 Bayside Office Park, a real HCB review, not the sample), 4 credits; drop the purchased pack from the HCB trial ledger | `data/seed/credit-ledger.seed.ts` |
| Setup progress for HCB: `first_review` + `invite` done (2 of 8); Marcus joined Nov 11 | `data/seed/setup-progress.seed.ts` |
| `sample_review` removed from step lists; `review-sample` seed kept, unlinked | `lib/setup-steps.ts`, `data/seed/reviews.seed.ts` (unchanged record) |
| Lakeside and Cedar retired as persona orgs; their reviews re-keyed into `populated` / `busy` fixtures | `data/seed/scenario-fixtures.seed.ts` **(new)**, `data/seed/orgs.seed.ts` |
| Credit requests collection + seed (empty by default; the "Request waiting" record comes from the scenario builder, so no seed bump) | `data/collections.ts`, `data/seed/credit-requests.seed.ts` **(new)**, `data/seed/index.ts` |
| Types: `VolumeBand` + `"unsure"`; `OrgProfile.callBookedAt`, `callSlot`; `CreditRequest`; `CreditLedgerEntry.setupSectionId?` (section rewards); `SetupSectionId`; `WalletSettings.receiptCc?` (checkout "Also send receipts to") | `types/domain.types.ts` |
| Prefs: `celebratedBy`, `toursSeen`, `hintsSeen`, `videoProgress`, `protoHidden` | `store/prefs.store.ts` |
| Emails: call booked · enterprise confirmed · bonus ending · bonus closed · credits expiring · zero balance · auto-reload charged · credit request (to admin) · request fulfilled (to reviewer); "earned" email reworded to full reviews; low-balance and zero-balance "Add credits" CTAs get `href: "/checkout/credits?pack=pack10"` | `app/emails/content.ts` |
| **Seed version** `SEED_VERSION` `"v22"` → **`"v23"`**, bumped **once**, in the phase 2 foundation task (T2.0), with every seed change above batched (HCB ledger, setup progress, `sample_review` out of the lists). Phases 0 and 1 change no seed rows. Phase 4 adds the empty `credit_requests` collection without a bump. Any later row change bumps to v24 with a release note | `data/adapters/mock-adapter.ts` line 45 |

Release note to ship with v23: "This update resets demo data in your browser. Use the state pill or the Prototype Index to get back to any state in one click."

---

## 8. Phasing and build-agent split

Six phases, ordered by **how soon Val can see the app change**. Each phase leaves the app working and ends in one commit on `feat/pattern-change`. Tasks, interfaces and verification steps are in `build-plan.md`; this section is the ownership contract.

**Ownership model.**
- Each phase opens with a **coordinator foundation task** (T*n*.0). The coordinator owns every shared file: `app/package.json`, `app/src/app/globals.css`, `components/templates/AppShell.tsx`, the barrels (`components/{atoms,molecules,organisms}/index.ts`, `store/index.ts`, `components/organisms/{home,wallet,billing,onboarding}/index.ts`), `types/domain.types.ts`, `lib/pricing.ts`, `store/wallet.store.ts`, `store/prefs.store.ts`, `data/**`, unless the phase table below hands one to a named task for that phase. In T*n*.0 it pre-creates every stub, export and mount point the phase's agents need, with the final props, so agents never touch a shared file. Owners fill stubs and never edit barrels, except that an owner who deletes a file removes that file's own export line (one such owner per barrel per phase).
- Then the phase's owner tasks run **in parallel**, each with an exclusive file list. **No two tasks that run at the same time own the same file** (a coordinator task that finishes before the owners are dispatched may hand a file on to one of them). Anything outside a task's list is requested from the coordinator in the task report.
- New CSS goes in the owner's feature stylesheet (created in its own folder), never in `globals.css`.
- Each task writes `docs/plans/pattern-change/reports/<phase>-<task>.md` (place · before → after · deviations · DS-candidates added · open items).
- Gate per phase (coordinator): `npx tsc --noEmit`, `npx eslint src`, `npm test`, the route smoke script with screenshots, the house-rule greps, then **Val looks at it in the browser**, then one commit. Before committing: `git checkout app/tsconfig.json` (`next dev` rewrites it). Never commit `docs/meetings/`.

### Phase 0 · Foundation (no new UI)

| Task | Owner | Owns (exclusive) | Delivers |
|---|---|---|---|
| T0.1 | coordinator | `app/package.json`, `app/package-lock.json`, `app/vitest.config.mts` **(new)**, `app/scripts/smoke.py` **(new)**, `.gitignore` | `vitest@3.2.4` + `npm test`; `canvas-confetti@1.9.4`, `@types/canvas-confetti@1.9.0`; the Python Playwright smoke script (`channel="chrome"`); `app/.smoke/` ignored |
| T0.2 | coordinator | `types/domain.types.ts`, `lib/pricing.ts` (+ `.test.ts`), `components/atoms/Icon.tsx`, `components/atoms/Illustration.tsx` + `components/atoms/illustrations/**` **(new)**, `app/globals.css`, `store/prefs.store.ts`, `store/lock.store.ts` **(new)**, stubs `lib/wallet-view.ts` + `store/useWalletView.ts` **(new)**, barrels | §4 new constants and the `TRIAL_EXPIRY_DAYS` deletion (`EARNED_LIFE_DAYS` goes in T0.3 with its importers); `EARN_REWARD_CREDITS` 1 → 2, `EARN_CAP_CREDITS` 3 → 4 and the `SETUP_REWARD_STEPS` deletion wait for T2.0, where per-section awarding lands, `routeForProfile`, `earnWindow`, `VOLUME_BAND_LABEL`; every new type; every new icon; illustration atom + `--ill-*`, `--viz-*`, `text-wrap: pretty` and the PC-31 z-tier variables; new prefs fields; the lock store with the final `LockReason` |
| T0.3 | agent W | `lib/wallet-view.ts` + `store/useWalletView.ts` (stubs from T0.2) + test, `lib/pricing.ts` (`EARNED_LIFE_DAYS` deletion only), `store/wallet.store.ts`, `lib/wallet-breakdown.ts`, `components/organisms/BalancePill.tsx`, `components/organisms/billing/{useBilling.ts,OverviewTab.tsx,billing-data.ts}`, `components/organisms/billing/settings/settings-data.ts`, `components/organisms/wallet/{TopUpModal.tsx,WalletCard.tsx}`, `components/organisms/DemoDock.tsx`, `components/organisms/dashboard-widgets.tsx`, `components/run/CostSummary.tsx`, `app/emails/content.ts` | §6 P0: one derivation, PC-16 spend order, one auto-reload rule, every reader migrated, spend-order and earned-lifetime copy (numbers and copy only) |
| T0.4 | agent M | `lib/motion.ts` **(new)** + test, `lib/celebrate.ts` **(new)**, `components/providers/MotionProvider.tsx` **(new)**, `app/layout.tsx` | `motion-spec.md` §1, §6, §8 |
| T0.5 | agent S | `lib/prototype/scenario.ts` **(new)**, `lib/prototype/scenario-builder.ts` **(new)** + test, `lib/prototype-registry.ts` **(new)** | §6 axes, `normalize`, `buildLedger(sc, now)` recipes, registry types + Get started / Billing / Dashboard entries (no UI yet) |
| T0.6 | coordinator | `components/templates/AppShell.tsx`, stub files `CreditsPill.tsx`, `SidebarResourceLinks.tsx`, `LockDialog.tsx`, `CheckoutLauncher.tsx`, `HeaderChipSlot.tsx`, `tour/TourHost.tsx`, `prototype/ProtoPill.tsx` (all **new**, render `null`), `lib/prototype/recipes.test.ts` **(new)** | Every mount point in place (header order per PC-30); recipe cross-check (scenario recipe → wallet-view numbers) |

Parallel: T0.3 ∥ T0.4 ∥ T0.5 after T0.1 → T0.2. T0.6 last.

### Phase 1 · Onboarding

| Task | Owner | Owns (exclusive) | Delivers |
|---|---|---|---|
| T1.0 | coordinator | `components/atoms/Button.tsx` (`busy`), `components/molecules/SegmentedControl.tsx` (`press`), `components/atoms/ProgressBar.tsx` **(new)**, `components/molecules/SelectTile.tsx` **(new)**, `store/bouncer.store.ts`, `app/bouncer/_components/InviteDialog.tsx`, `store/org.store.ts`, `components/organisms/home/useArrivalCelebration.ts` **(new)** + its one-line call in `home/GetStarted.tsx`, stubs `onboarding/{OnboardingFrame,StepPanel,SetupInterstitial,InviteStep,CallBooking}.tsx`, `onboarding/useStepNav.ts`, `molecules/RoleSelect.tsx`, barrels | Shared parts and store contracts: `sendInvites({email, role}[])`, `bookCall(slot)`, `approve()` grants the trial, `org-hcb` upsert; the arrival confetti hook |
| T1.1 | agent H1 | `app/(onboarding)/welcome/**` (`layout.tsx`, `template.tsx` new; `page.tsx`, `invite/page.tsx`, `call/page.tsx` new; `hooks/useWelcome.ts`), `components/organisms/onboarding/{OnboardingFrame,StepPanel,SetupInterstitial,OrgSetupForm}.tsx` + `useStepNav.ts` (fills the stubs), `onboarding/onboarding.css` **(new)** | §5.1 option C frame, side panel, 2-segment bar, live routing, interstitial; T2 entry, T3/T3b, T4, T5 exit |
| T1.2 | agent H2 | `onboarding/{InviteStep,InviteRow}.tsx`, `components/molecules/RoleSelect.tsx` **(new)**, `lib/invites.ts` **(new)** + test, `onboarding/invite.css` **(new)** | PC-29 invite rows |
| T1.3 | agent H3 | `onboarding/CallBooking.tsx`, `lib/call-slots.ts` **(new)** + test, `onboarding/call.css` **(new)**, `app/emails/content.ts` | Book a call in the card; call-booked and enterprise-confirmed emails |
| T1.4 | agent I1 | `components/templates/KeycloakFrame.tsx`, `components/organisms/auth/{CreateAccountForm,VerifyCodeForm}.tsx`, `components/molecules/CodeBoxes.tsx`, `app/(auth)/layout.tsx` | T1, the exit half of T2, verify-code micro-interactions |

Parallel: T1.1 ∥ T1.2 ∥ T1.3 ∥ T1.4 after T1.0.

### Phase 2 · Get started v4, header credits, sidebar links

| Task | Owner | Owns (exclusive) | Delivers |
|---|---|---|---|
| T2.0 | coordinator | `lib/setup-steps.ts` (+ test), `lib/pricing.ts`, `store/onboarding.store.ts`, `store/wallet.store.ts` (`awardSection`), `lib/landing.ts`, `components/templates/AppShell.tsx` (n/8), `data/seed/{credit-ledger,setup-progress}.seed.ts`, `data/adapters/mock-adapter.ts` (v23), barrels | Sections and 8 steps, section rewards (`EARN_REWARD_CREDITS` 2, `EARN_CAP_CREDITS` 4, `SETUP_REWARD_STEPS` deleted) and the earn window, enterprise Get started visibility, seeds v23 |
| T2.1 | agent A | `components/organisms/home/**` except `useStartGate.ts` and `index.ts`, `app/(shell)/get-started/page.tsx`, `components/organisms/Skeletons.tsx`, `components/organisms/wallet/WalletCard.tsx` (delete) + `wallet/index.ts`, `components/organisms/EarnedToastHost.tsx` | §5.2 every state, welcome line, section burst |
| T2.2 | agent B | `CreditsPill.tsx`, `CreditsPopover.tsx` **(new)**, `components/atoms/CreditChip.tsx`, `BalancePill.tsx`, `SidebarResourceLinks.tsx`, `UserMenu.tsx`, `app/(shell)/trust/page.tsx` + `app/(shell)/learn/page.tsx` (stubs), `components/organisms/credits-chrome.css` **(new)** | §5.3, §5.4 |
| T2.3 | agent X | `components/organisms/dashboard-widgets.tsx`, `components/organisms/billing/OverviewTab.tsx`, `app/(shell)/reviews/page.tsx`, plus any other non-A/B file that links `review-sample` | PC-4 sweep (sample links at `dashboard-widgets.tsx:179`, `OverviewTab.tsx:235`, the Reviews sample aside) |

Parallel: T2.1 ∥ T2.2 ∥ T2.3 after T2.0.

### Phase 3 · Checkout and billing

| Task | Owner | Owns (exclusive) | Delivers |
|---|---|---|---|
| T3.0 | coordinator | `app/checkout/layout.tsx` **(new)**, `lib/checkout.ts` **(new)** + test, `components/organisms/checkout/CostBlock.tsx` **(new)**, `checkout/index.ts` + stubs for T3.1's components and `molecules/HStepper.tsx`, `store/wallet.store.ts` (intent-only `openTopUp`, `receiptCc`), `components/templates/AppShell.tsx` (drop `TopUpModal` mount), `lib/prototype-registry.ts` (checkout entries), barrels | Checkout frame, `safeReturn`, `initialChoice`, `checkoutHref`, the shared cost block |
| T3.1 | agent F1 | `app/checkout/credits/**`, `components/organisms/checkout/**` except `CostBlock.tsx` and `index.ts`, `components/molecules/HStepper.tsx` (fills the stub) | §5.6 every step and error state |
| T3.2 | agent F2 | `components/organisms/billing/**`, `app/(shell)/configure/billing/**` | §5.7, §5.8 (PC-33 band, PC-34 Usage), donut + by-person |
| T3.3 | agent F3 | `components/organisms/CheckoutLauncher.tsx`, `components/organisms/wallet/{TopUpModal.tsx,topup-chips.css}` (delete) + `wallet/index.ts`, `components/run/{CostSummary,RunModal,RunConfirm}.tsx`, `app/(shell)/reviews/[id]/page.tsx`, `app/emails/content.ts`, `components/organisms/CommandPalette.tsx` | Every `openTopUp` lands on checkout; `needed` = shortfall; draft before checkout; `types=` resume; email CTAs; palette actions |

Parallel: T3.1 ∥ T3.2 ∥ T3.3 after T3.0.

### Phase 4 · Lock-then-explain and reviewer requests

| Task | Owner | Owns (exclusive) | Delivers |
|---|---|---|---|
| T4.0 | coordinator | `components/molecules/LockedAction.tsx` **(new)**, `components/organisms/home/useStartGate.ts`, `lib/lock-reasons.ts` **(new)** + test, `lib/credit-requests.ts` **(new)** + test, `store/credit-request.store.ts` **(new)**, `data/collections.ts`, `data/seed/{credit-requests.seed.ts (new),index.ts}`, `components/run/RunExperience.tsx` (Esc guard), `lib/review-lifecycle.ts` (triage link), `components/templates/AppShell.tsx` (sidebar Start), `app/(onboarding)/layout.tsx` + `app/checkout/layout.tsx` (`LockDialog` mounts), stub `components/organisms/useIntakeStart.ts`, barrels | The lock primitives, the request store, the two bug fixes |
| T4.1 | agent C1 | `components/organisms/LockDialog.tsx`, `components/organisms/lock/**` **(new)** | Every §5.5 dialog variant at z 140 |
| T4.2 | agent C2 | `components/organisms/{OrderButton,IntakeWidget,CommandPalette,dashboard-widgets}.tsx`, `components/organisms/useIntakeStart.ts` (fills the stub), `components/organisms/home/SetupRow.tsx`, `components/molecules/Breadcrumbs.tsx`, `app/(shell)/reviews/page.tsx`, `app/(shell)/configure/billing/page.tsx` | Every shell Start site and the pending Add credits as `LockedAction`; PC-37 upload zone |
| T4.3 | agent C3 | `components/run/{RunConfirm,CostSummary,RunModal}.tsx`, `app/(shell)/reviews/[id]/page.tsx` | Review setup: never disabled, approval check, credits dialog over the takeover, `onRunOnly`, `LowBalanceCallout` deleted |
| T4.4 | agent C4 | `components/organisms/billing/OverviewTab.tsx`, `components/organisms/CreditsPopover.tsx`, `app/checkout/credits/hooks/useCheckout.ts`, `app/emails/content.ts` | §5.9 request form, tracker, popover card, fulfilment, emails |

Parallel: T4.1 ∥ T4.2 ∥ T4.3 ∥ T4.4 after T4.0.

### Phase 5 · Help and prototype controls

| Task | Owner | Owns (exclusive) | Delivers |
|---|---|---|---|
| T5.0 | coordinator | `app/package.json` (`react-joyride@3.2.0`), `lib/tours.ts` **(new)** + test, `store/tour.store.ts` **(new)**, `lib/learning.ts` **(new)** + test, `lib/prototype/presets.ts` **(new, stub)** + its re-export from `lib/prototype-registry.ts`, `components/molecules/EmptyState.tsx` + `empty-state.css` (`media`), `components/run/{RunExperience,RunWorkbook}.tsx` + `components/review/WorkbookInline.tsx` (`data-tour`, `.run-head` chip slot, in-run `TourHost` mount), stubs `molecules/TourChip.tsx`, `organisms/{EmptyVideo,SettingVideoHint}.tsx`, barrels | Tour and learning contracts; every review-takeover target |
| T5.1 | agent K | `components/organisms/tour/**`, `components/molecules/TourChip.tsx` (fills the stub), `components/organisms/HeaderChipSlot.tsx` | §5.13 |
| T5.2 | agent G | `app/(shell)/{trust,learn}/**`, `app/shared/trust/**` **(new)**, `components/organisms/{trust,learn}/**` **(new)**, `lib/security-pack.ts`, `lib/guides.ts`, `app/(shell)/configure/security/**`, `app/(shell)/configure/page.tsx` | §5.10, §5.11 |
| T5.3 | agent J | `components/organisms/{EmptyVideo,SettingVideoHint}.tsx` (fills the stubs), `app/(shell)/reviews/page.tsx`, `app/(shell)/configure/{checklists,workbook-layouts}/**`, `app/(shell)/configure/defaults/page.tsx`, `components/organisms/billing/**`, `app/(shell)/configure/billing/page.tsx` | §5.12 and the page `data-tour` attributes from `lib/tours.ts` |
| T5.4 | agent D | `components/organisms/prototype/{ProtoPill,ScenarioPopover,ProtoKeys,useProtoView}.tsx`, `prototype/prototype.css`, `store/prototype.store.ts` **(new)**, `lib/prototype/presets.ts` (stub from T5.0), `components/organisms/DemoDock.tsx` (delete), `components/templates/AppShell.tsx`, `app/(onboarding)/layout.tsx`, `app/checkout/layout.tsx`, `lib/demo.ts`, `lib/landing.ts`, `data/seed/{demo-personas,scenario-fixtures,orgs}.seed.ts`, `app/start/page.tsx`, `app/demo/[persona]/page.tsx`, `components/organisms/UserMenu.tsx` | Pill, scenario popover at DemoDock parity, presets (personas become `legacyPersonaId` aliases), hide + keys; DemoDock retired. Stops importing `useDemoStore` in its files |
| T5.5 | agent I2 | `app/prototype/**` **(new)**, `scripts/proto-thumbs.mjs` **(new)**, `components/organisms/prototype/{useProtoFill,RoutingNote}.tsx`, `lib/prototype-registry.ts`, `components/organisms/auth/**`, `app/(auth)/**`, `components/templates/KeycloakFrame.tsx`, `components/organisms/CommandPalette.tsx`, `components/organisms/onboarding/{OrgSetupForm,InviteStep,CallBooking}.tsx` (fill registration only) | Prototype Index, fill wand, auth `?variant=` states, `DemoAccounts` removed |

Parallel: T5.1 ∥ T5.2 ∥ T5.3 ∥ T5.4 ∥ T5.5 after T5.0. **T5.9 Final (coordinator):** delete `store/demo.store.ts`, its `store/index.ts` export and the `SeedProvider` use once T5.4 and T5.5 have removed theirs; `app/AGENTS.md` (§9 items, the stale "Nav = Dashboard · Reviews · Templates · Settings" line, the `openTopUp` → checkout rule, the illustration and DS-candidate rules), Appendix A checked against `grep -rn "DS-candidate:" app/src`, the feedback log, client questions (PC-30+, Q-E17, Q-E18), and one walkthrough script over the Index flows.

Phase-to-old-agent map, for anyone reading older notes: A → T2.1, B → T2.2, C → T4.*, D → T5.4, E (copy pass) → each phase's reviewer step, F → T3.*, G → T5.2, H → T1.1–T1.3, I → T1.4 + T5.5, J → T5.3, K → T5.1, L (illustrations) → T0.2 (atom) + each surface owner places its own art.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Seed v23 wipes every viewer's local demo data, including the hosted site | Bump once in phase 2 (T2.0); release note; presets restore any state in one click (phase 5) and DemoDock personas do until then |
| Balance computed two ways; spend order changes in two files | P0 first, with recipe tests; `lib/wallet-view.ts` is the single derivation |
| react-joyride 3.2.0 is a new major (peer range `react 16.8 - 19` verified 11 Nov, so React 19.2 is fine) | Build to the v3 API; fallback is DS `Popover` + `PopoverAnchor` with a spotlight ring behind the same `lib/tours.ts` contract |
| Things that open over a review render behind it (`.run` is z 120, portaled to body) or Esc closes the whole review under them | PC-31 tiers; `LockDialog` at 140; Esc guard in `RunExperience`; smoke checks in phase 4 and 5 (`elementFromPoint` hits the dialog; Esc leaves `.run` mounted) |
| A blocked Start loses the user's selection on the way to checkout (`run.store` and `RunConfirm` state are in memory only) | Draft `intake` review before leaving + `types=` in `return` (§5.6); round-trip smoke after a hard reload |
| Parallel agents in one working tree collide on barrels (`components/*/index.ts`, `store/index.ts`), `AppShell.tsx`, `globals.css` and `package.json` | Coordinator owns them and pre-creates every export, stub and mount in the phase's foundation task; new CSS goes in feature stylesheets |
| Changing locked decisions (earn cap, sample removal, spend order, earned expiry) without sign-off | All are rows in §2 marked Change and pending; nothing ships to Realwired until Val confirms |
| `AppShell.tsx` and billing files are hot spots for parallel agents | Coordinator creates every mount point in phase 0; billing files have one owner per phase (§8); no two agents own a file in the same phase |
| Pending enterprise org must still see Get started; invoiced orgs are excluded by `setupGuideVisible` today | Coordinator updates `lib/landing.ts` and `useOrgStage` in T2.0 |
| Board numbers disagree across frames (low shown as 1, 2 and 3 credits; auto-reload "3 times a month" vs a $3,000 cap) | Recipes fixed in §6 (`low` 3, `short` 1); auto-reload copy derives from the cap; differences listed in agent reports |
| Board copy that would be wrong under the model ("oldest credits first", "Upload your bank policy to earn") | Corrected in §5.7 and §5.8 and flagged here |
| Placeholder security facts read as real claims | "Placeholder" chip on every unconfirmed fact; hosting provider withheld until confirmed |
| Prototype controls visible to Realwired on the hosted build | Intended for presenting; `?controls=0` and the env kill switch for interviews and recordings |
| Pill z-index fights with checkout, RunModal, tours | Fixed tiers (PC-31): `.run` 120, tour 126/128, run overlays 130, `LockDialog` 140, toast 150, tooltip 160, popovers 200, celebration 201 (confetti canvas, `pointer-events: none`), pill 210 |
| `Date.now()` in builders and window math | Builders and `earnWindow` take `now`; called from handlers or effects only |
| `/shared/trust/[token]` is a public route on a password-gated site | Covered by the existing `SITE_PASSWORD` gate on the hosted prototype |
| Route transitions in the App Router: a layout's `AnimatePresence` around `children` exits the new page, not the old one; `(auth)` → `(onboarding)` → `(shell)` share no layout; the card can land a Suspense commit late, so framer `layout` misses the height change | Persistent frame in `welcome/layout.tsx`, enter via `welcome/template.tsx`, exit before `router.push`; measured card height; T2 and T5 cross groups with a one-shot hand-off and a matching first frame. Browser back gets enter only (accepted). No internal Next APIs. `<ViewTransition>` held as a T2-only fallback that needs Val's sign-off (`motion-spec.md` §2, §9) |
| Motion in tests: agents' Playwright checks wait on, or screenshot, half-finished animations; exit-before-push slows navigation | `motionOff()` under `navigator.webdriver`, `?motion=0` or `NEXT_PUBLIC_MOTION=0` sets `MotionGlobalConfig.skipAnimations`; navigation still fires; `?motion=1` forces motion on for recordings |
| Confetti over-use cheapens it, or replays for returning testers | Three moments only (self-serve landing, enterprise approval if Cody agrees, a section earning its review); once per user via `prefs.celebratedBy`; one-shot arrival flag, so reloads and pill jumps never fire it; never under reduced motion; no confetti for the All done card, invites or purchases |

---

## 10. Open questions

### For Realwired (Ed) (log in `docs/plans/parachute-v2-client-questions.md`)

| ID | Question | Default in this spec |
|---|---|---|
| Q-E1 | Trial shape: keep 3 full reviews and earn 2 more, 1 + 1, or 2 + 1? | 3 + 2 |
| Q-E2 | Can a small bank prepay by card, or should every bank be offered invoicing up front? | Banks prepay, invoicing on request |
| Q-E3 | Pay as you go: a card charged per review, or prepaid packs only? | Packs only |
| Q-E4 | After the setup call, are enterprise orgs invoiced, or can they prepay? | Trial released, then prepaid unless invoiced is agreed |
| Q-E5 | How many free re-checks after an appraiser's corrections are included? | Not shown on screen |
| Q-E6 | Is a suspended org real (non-payment, compliance hold), and what does the user see? | Planned only |
| Q-E7 | Which tool books the setup call? | Mock scheduler |
| Q-E8 | Trust Center facts: hosting provider, SOC 2 date, uptime figure, security contact, which documents (the current pack lists seven, the new page six) | All marked placeholder |
| Q-E9 | Sales rule: either signal (OR) or both? Are 11 reviewers and 200 reports final? | OR, 11 / 200 |
| Q-E10 | Auto-reload monthly cap: $3,000 (2 reloads of a 10-pack) or 3 reloads? | $3,000 |
| Q-E11 | Invoiced rate per credit ($140 in the mock) | $140 placeholder |
| Q-E12 | Earned credits: never expire (proposed) or 90 days? | Never |
| Q-E13 | Real customer logos or quotes for the sign-up proof panel, with permission | Product proof only |
| Q-E14 | Video clips and the review-checklist PDF for the Learning Center | Placeholder clip |
| Q-E15 | The dashboard data dictionary, and who the interview participants are (appraisal firms, banks, both) | Dashboard unchanged in this spec |
| Q-E16 | Bouncer invite API (Ed, 10 Nov: "think of Bouncer as an API"): one call for many emails? A role per invite? Domain restriction? Per-email results (already a member, already invited)? A CSV import or SSO/SCIM for large teams? Does it replace D10 (invites only inside Bouncer) for onboarding? | Batch call, role per invite, per-email results; same-domain only; CSV and SSO handled by Realwired after the setup call |
| Q-E17 | Should signing be limited to approvers? The tour copy said "Only approvers sign", but `RunSign` has no role gate | No gate; the copy is dropped |
| Q-E18 | Can a review type be added to a report after Start ("add the Administrative review later")? Types are committed once at Start today | No; the copy is dropped |

### For Cody

| ID | Question | Default in this spec |
|---|---|---|
| Q-C1 | The second onboarding step is the invite step (email verification already exists in sign-up). Confirm | Invite step |
| Q-C2 | Sample review: gone entirely, or kept as a Learning Center tour? | Gone; seed kept unlinked |
| Q-C3 | Illustration direction C with scenes and spots? | Yes |
| Q-C4 | Floating "Finish setup" panel, or Get started stays a nav item? | Nav item |
| Q-C5 | Checkout outside the shell (focused) or inside it? | Outside |
| Q-C6 | Spend order soonest-expiring first, changing the Nov 6 rule? | Yes |
| Q-C7 | Bonus window as a modifier rather than wallet values in the state model? | Modifier |
| Q-C8 | Which "important settings" get a first-time video beyond the four listed in §5.12? | Those four |
| Q-C9 | Confetti for enterprise when Realwired approves the org and releases the trial: yes or no? | Yes, once, the first time the user sees the Confirmed state |

---

## 11. Reconciliation log (11 Nov)

Every finding from the four audits in `reconcile/` (A review surface and locks · B credits and checkout · C shell and design system · D onboarding, Get started and tours), and what it changed. "Follow-up" = not changed in this spec; tracked here.

### 11.1 Findings → spec changes

| # | Audit | Finding | Spec change |
|---|---|---|---|
| R1 | A §1, C §4 | A review is a full-viewport `.run` takeover (z 120, portaled), not a shell page; no sidebar, header, pill, crumbs or `PageHeader` | New §5.0 surface model; §5.3 "inside a review" row; §5.5 dialog over the takeover |
| R2 | A §1.3, B §4 | Start is the full-page "Review setup" (`RunConfirm`), not a dialog over the queue | §5.5 Review setup table and board notes |
| R3 | A §2, B §4 | B2 `#start-low-balance` draws Start as a dialog over Reviews; frame 2's dialog "replaces" frame 1 | §5.5 board notes: build over Review setup; dialog over the page. Board redraw: follow-up (R-F2) |
| R4 | A §2 | B2 `#billing-zero` puts the out-of-credits dialog over Billing | §5.5 board notes: split into Billing at zero + the dialog over Review setup. Board retitle: follow-up (R-F3) |
| R5 | A §4 | Things that open over a review need the lifted tiers; Joyride's default z renders behind `.run` | PC-31 tier list; §5.5 `LockDialog` at 140; §5.13 acceptance; §5.15 z row; §9 |
| R6 | A §4 | Esc in the review closes the whole review even with a dialog on top | §5.5 Esc guard in `RunExperience.tsx`; bug B2 below |
| R7 | A §3 | Start-site list in the spec was wrong (a non-existent empty-state upload; missing Get started row, queue Run, YC rows) | §5.5 real Start-site table |
| R8 | A §4 | `RunConfirm` checks the wallet but not approval: a pending org reaches Start via the queue | §5.5 site 9 and Review setup "Approval" row |
| R9 | A §4 | Start is truly `disabled` for zero types / empty address | §5.5 "Never disabled" row and acceptance |
| R10 | A §4 | "Run Technical only" only re-selects today; the board says it starts now | PC-32; `LockReason.onRunOnly` |
| R11 | A §4 | "You can add the Administrative review later" has no backing path | Copy dropped in §5.5; Q-E18 |
| R12 | A §1.4, B §3 | "Report kept as a draft" is false: nothing exists before Start and `run.store` isn't persisted | §5.6 "Draft before checkout" (intake review + `types=`); §5.5 acceptance; §9 |
| R13 | A §4, B §1a | Reviewer "Ask your admin" is a toast only | §5.5 Review setup "Reviewer" row; §5.9 flow writes one record from either place |
| R14 | A §4 | Embedded YouConnect runs have no wallet check | §5.0: no lock or checkout there, by design; §5.5 acceptance |
| R15 | A §2, D §2, D §3 | B1 `#tour` draws the review in the shell, source left, a Findings list with Accept/Disagree, Sign in the header | §5.13 targets, copy and start condition rewritten to the takeover. Board redraw: follow-up (R-F1) |
| R16 | A §4, D §3 | Tour targets named orphaned/wrong files (`FindingDecisionBar`, `RunSign`, `[id]/page.tsx`); `WorkbookInline.tsx` had no owner | §5.13 target list; T5.0 owns the run targets |
| R17 | A §4, D §3 | Tour copy uses verbs the app doesn't have; step 3 contradicts the inline workbook | §5.13 copy (Concur/Edit/Reject, "This is the workbook"); §5.2 row copy |
| R18 | A §4 | "Only approvers sign" is not enforced | Copy dropped; Q-E17 |
| R19 | A §4, D §3 | The first-review tour must wait for spoke `workbook` + `ctx.ready`, Technical track | §5.13 start condition |
| R20 | A §4 | "First visit to a review" undefined | §5.13 acceptance (first time on spoke `workbook`) |
| R21 | B §1a | Every buy goes through `openTopUp`; `TopUpModal` already branches by role | §5.6 keeps the signature; `CheckoutLauncher` reroutes |
| R22 | B §1a | `CostSummary` passes the full cost as `needed` | §5.5 `LockReason.needed` = shortfall; §5.6 bug note; bug B1 below |
| R23 | B §1a | Low-balance email CTA has no href | §5.6 and §7 emails |
| R24 | B §1a | No Add credits / How credits work in the command palette | §5.6 palette actions |
| R25 | B §1b, §6 | Three balance derivations (`balanceGrants` remainders, raw ledger sums, `remainingOf`) | §6 P0 reader list; phase 0 |
| R26 | B §2 | Billing state gaps (fresh hero, trial wording, low, short, zero, pending lock, bonus, requests, donut, credits tab) | §5.8 unchanged in scope; band and fixes paragraph added |
| R27 | B §2 | `spendOrderSentence` contradicts PC-16 | §5.8 fixes; §6 P0 |
| R28 | B §2 | Low tone keys off runway days (`runwayWarn`), not `LOW_BALANCE_AT` | §5.8 fixes; §6 P0 |
| R29 | B §2 | Fate of `UsageCard`/`UsageChart`/by-source/`BreakdownTable`/`LedgerSection` unspecified | PC-34 |
| R30 | B §2 | Invoiced reviewer has no tabs; Plans tab and "Download statement" unaddressed | PC-33; §5.7 tab matrix |
| R31 | B §2 | Checkout's Payment step duplicates Settings fields | §5.6: same setters; `receiptCc` added |
| R32 | B §3 | No existing layout fits checkout; checkout must mount `LockDialog`, `ReceiptDialog`, the pill | §5.6 route paragraph; §6 files |
| R33 | B §3 | `return` needs validation (open redirect), push/replace rules, and `types=` | §5.6 return path; `lib/checkout.ts` |
| R34 | B §3 | Embedded and invoiced must never open checkout | §5.6 `CheckoutLauncher` guard |
| R35 | B §4, C §4 | Header order: spec and board disagree | PC-30 |
| R36 | B §4 | Sidebar Balance shows "4 trial"; board shows "4 credits" | §5.3 `BalancePill` row (PC-6) |
| R37 | B §4 | Header pill shows for invoiced while sidebar Balance is hidden | §5.3 `BalancePill` row |
| R38 | B §4 | B2 checkout summary draws an illustration; §5.6 says no art | §5.6 `OrderSummary` row (spec wins). Board fix: follow-up (R-F4) |
| R39 | B §4 | B1 `#how-credits-work` tabs/crumb are stale | §5.7 tab matrix note |
| R40 | B §4 | B1 `#billing-pill` (3 cards) is a pill demo, not a layout | §5.8 layout source |
| R41 | B §4 | "Add credits" in the band (spec) vs in the hero (B2) | PC-33 |
| R42 | B §4 | B2 `#billing-low` "oldest first", "3 times a month" | Already corrected (PC-16, Q-E10); unchanged |
| R43 | B §4 | `ExpiryAlert` action: board "Start a review" vs code "Add credits" | §5.8 fixes: "Start a review" |
| R44 | B §4 | "2 of 22 left" implies a fixed total | §5.3 request row reworded |
| R45 | B §5 | Sample links in `OverviewTab.tsx:235` and `dashboard-widgets.tsx:179` | §5.8 fixes; T2.3 PC-4 sweep |
| R46 | B §5, C §2 | AGENTS.md nav line is stale (real nav: Get started · Dashboard · Reviews; Configure via OrgCard) | §8 T5.9 |
| R47 | C §1 | The vendored DS now ships Dialog, Popover, Callout, OptionCard, SectionCard, Accordion, FileRow, FactGrid, `PageHeader toolbar` | §1 reuse rule; §5.3, §5.5, §5.6, §5.8 name the DS parts |
| R48 | C §5 | Build new variants in the app (option B) with a migration list; don't repack the DS | §1 rule; Appendix A |
| R49 | C §3 | Radix Popover doesn't close on scroll (AGENTS rule) | §5.3 `CreditsPill` row |
| R50 | C §3 | Lock dialog: DS `Dialog` + local centred body, not `AlertDialog` | §5.5 `LockDialog` row |
| R51 | C §3 | `PendingTracker`: try DS `StepLine` first | §5.2 row |
| R52 | C §3, §6 | Earn pill colour conflict (petrol tint vs navy-selected) | PC-35 |
| R53 | C §3, §4 | Billing should move onto the DS page band, like Reviews | PC-33 |
| R54 | C §3 | Donut/bars: DS `DonutViz`/`BarViz` don't fit the token rule | §5.8 Usage note |
| R55 | C §3 | Tour chip: reuse `Button`, no new chip type | §5.13 `TourChip` row |
| R56 | C §3 | Role descriptions need a two-line listbox; DS `Select` options are label-only | `RoleSelect` (Appendix A); §8 T1.2 |
| R57 | C §3 | No horizontal stepper anywhere | §5.6 `HStepper`; Appendix A |
| R58 | C §3 | One selectable tile covers packs, slots and answers | §5.6 `SelectTile`; Appendix A |
| R59 | C §4 | Boards' button pill radius, chip radius and paddings are simplifications | §1 rule (build to real geometry); no restyle |
| R60 | C §4 | Sidebar resource rows: board 16 px icons vs real 19 px | §5.4 |
| R61 | C §6 | Get started is the only shell page without a band | PC-36 |
| R62 | C §6 | Two tab implementations and two bands; don't add a third | §1 reuse rule; PC-33 |
| R63 | D §1.1 | There is no side panel today; `/welcome` is one card | §5.1 `OrgSetupForm` row |
| R64 | D §1.1 | Retired welcome routes already redirect to `/get-started` | §5.1 routes row |
| R65 | D §1.1, §4 | `createWorkspace` makes a new org per submit | §5.1 `useWelcome` row (PC-19) |
| R66 | D §4 | `approve()` doesn't grant the trial; only DemoDock does | §5.1 `org.store` row; T1.0 |
| R67 | D §1.1 | Bouncer `InviteDialog` must map to the new `sendInvites` | §5.1 new row |
| R68 | D §2 | `GetStartedSkeleton` is two-column | §5.2 new row |
| R69 | D §2 | `useSetupSummary` counts the pre-ticked account (+1) | §5.2 `onboarding.store` row |
| R70 | D §2 | `group` → `section`; `tutorial` already in the union | §5.2 `setup-steps` row |
| R71 | D §2 | "Open review" / "Sign workbook" need a review id | §5.2 real-app adaptations (derived) |
| R72 | D §2 | Pending lock must widen to the whole first section | §5.2 states row |
| R73 | D §2, A §2 | Reviews level-1 upload doesn't exist | PC-37; §5.12 Reviews row |
| R74 | D §3.2 | Reviews/checklists/layouts/billing page tours target things not on the page | PC-38; §5.13 page tours |
| R75 | D §3.2 | Checklists and Workbook layouts have no `PageHeader` to hold a chip | PC-38 (shell header slot) |
| R76 | D §1.3 | `react-joyride@3.2.0` peer range covers React 19; v3 is a new major | §5.13 dep row; §9 |
| R77 | D §1.3 | `canvas-confetti` not installed | Phase 0 T0.1 |
| R78 | D §2 | `WelcomeCallout` gate (`welcomeDismissedBy`, `welcomeBanner`) can be reused for the welcome line | §5.2 `GetStarted` row |
| R79 | D §4 | Fast path: Get started visuals are the most visible change for the least plumbing | §8 phase order (phase 2 right after onboarding, per Val) |

### 11.2 Real bugs found (fixed in the build)

| # | Bug | Where | Fixed in |
|---|---|---|---|
| B1 | `LowBalanceCallout` passes the full review cost as `needed`, not the shortfall, so "Add 1 credit" prefills wrong | `components/run/CostSummary.tsx:191` | T3.3 (caller), pinned by `lib/lock-reasons.test.ts` in T4.0 |
| B2 | Esc inside a review closes the whole review even when a dialog (`TopUpModal`, later `LockDialog`) is on top | `components/run/RunExperience.tsx:562-574` | T4.0 |
| B3 | `autorejected` rows link to `/reviews/<id>/triage`, a route that doesn't exist (`runEntry` already maps `autorejected → triage` on `/reviews/[id]`) | `lib/review-lifecycle.ts:259` | T4.0 (link to `/reviews/<id>`) |
| B4 | Sample-review links survive PC-4 | `components/organisms/billing/OverviewTab.tsx:235`, `components/organisms/dashboard-widgets.tsx:179`, the Reviews level-1 aside | T2.3 |
| B5 | Pending org can reach Start through the queue "Run" (no approval check in Review setup) | `components/run/RunConfirm.tsx`, `lib/review-lifecycle.ts:243-251` | T4.3 |
| B6 | "Your upload is saved as a draft" copy is false | `components/run/CostSummary.tsx:183` | T3.3 (made true), T4.3 (callout deleted) |
| B7 | Balance computed three ways (pill vs dialog vs Get started vs Billing) | §6 P0 list | T0.3 |
| B8 | Auto-reload: `TopUpModal` hardcodes `2` and ignores the monthly cap | `components/organisms/wallet/TopUpModal.tsx` | T0.3 |
| B9 | Low-balance email CTA has no href | `app/emails/content.ts:176` | T3.3 |
| B10 | Every `/welcome` submit creates a new org, so demo resets pile up orgs | `app/(onboarding)/welcome/hooks/useWelcome.ts:54-84` | T1.0 / T1.1 (`org-hcb` upsert) |
| B11 | Enterprise approval releases no trial outside DemoDock | `store/org.store.ts:151` | T1.0 |
| B12 | Start is `disabled` for zero types / empty address (against the never-disabled rule) | `components/run/RunConfirm.tsx:428` | T4.3 |

### 11.3 Follow-ups (not changed in the spec)

| # | Follow-up | Owner |
|---|---|---|
| R-F1 | Redraw board 1 `#tour` on the review takeover: no sidebar/header, workbook centre with inline findings, Concur · Edit · Reject · Delete, Source docked right, footer `Sign & finalize`, "Tour, n of 4" in `.run-head` | Board owner |
| R-F2 | Redraw board 2 `#start-low-balance` frame 1 as the Review setup page (top bar, centred column, `CostSummary` footbar); frame 2's dialog over it | Board owner |
| R-F3 | Retitle board 2 `#billing-zero`; split into Billing at zero + the dialog over Review setup | Board owner |
| R-F4 | Remove the illustration from board 2 checkout summaries (`#checkout-payment`, `#checkout-review`) | Board owner |
| R-F5 | Board 1 `#reviews-empty`: drop the tour chip on the empty page; the upload zone opens Review setup | Board owner |
| R-F6 | Board 1 `#how-credits-work` and `#billing-pill`: tabs start with Overview; mark frame 21 as a pill demo | Board owner |
| R-F7 | Boards: header order per PC-30, earn pill per PC-35, "Add credits" in the billing band per PC-33 | Board owner |
| R-F8 | Credit request reaching an admin who is inside a review: a bell entry (today email only) | Later phase |
| R-F9 | Optional sweep: `ReviewTable` locked column toggles → `aria-disabled` + reason (§5.5) | Later phase |
| R-F10 | DS migration of Appendix A items, after the build, with Cody and Diego | Val → Cody/Diego |
| R-F11 | Log PC-30 to PC-38, Q-E17 and Q-E18 in `docs/plans/parachute-v2-client-questions.md` where Realwired needs to weigh in | T5.9 |

---

## Appendix A. DS-candidate migration list

Built in the app for this change (audit C §5, option B). Each file carries `// DS-candidate: <name> — <why>`. After the build, Val takes this list to Cody and Diego; nothing here edits or repacks `@realwired/ui`. Prototype-only items (`ProtoPill`, `ScenarioPopover`, Prototype Index, `RoutingNote`, `useProtoFill`) never go to the DS.

| Candidate | App file (phase) | Built from | Why it belongs in the DS |
|---|---|---|---|
| `ProgressBar` / `SegmentBar` (`segments` mode) | `components/atoms/ProgressBar.tsx` (T1.0) | new; consolidates the sidebar `--gs-pct-n` bar and `setup-checklist.css` bar | DS has no plain progress bar or meter (`CoverageBar` means something else) |
| Horizontal numbered `Stepper` | `components/molecules/HStepper.tsx` (T3.1) | new | DS `StepRail` is vertical; `TaskFlow` assumes a rail |
| `LockedAction` | `components/molecules/LockedAction.tsx` (T4.0) | local `Button` / DS `SidebarAction asChild` | The never-disabled rule is cross-product |
| `Button busy` | `components/atoms/Button.tsx` (T1.0) | local `Button` | DS `Button` has no busy state |
| `EmptyState media` slot | `components/molecules/EmptyState.tsx` (T5.0) | local `EmptyState` | DS `EmptyState` has no preview or media slot |
| `Dialog` centred-art layout | `components/organisms/LockDialog.tsx` + `lock/**` (T4.1) | DS `Dialog size="sm" hideTitle` + local body | DS dialog headers are left-aligned with no art slot |
| `CreditChip` tone set (`credit · trial · money · free · low · zero · held · invoiced`) | `components/atoms/CreditChip.tsx` (T2.2) | local `CreditChip` | DS `Chip` tones are generic |
| `TourTooltip` | `components/organisms/tour/TourTooltip.tsx` (T5.1) | local `Button` | Nothing tour-like in the DS |
| Selectable tile | `components/molecules/SelectTile.tsx` (T1.0) | new (or DS `OptionCard` if it lays out 4-up) | Packs, time slots and onboarding answers share one look |
| `Popover` close-on-scroll | `components/organisms/CreditsPill.tsx` (T2.2) | DS `Popover` + capture-phase scroll listener | AGENTS popover rule; Radix doesn't close on scroll |
| `RoleSelect` (two-line listbox options) | `components/molecules/RoleSelect.tsx` (T1.2) | DS `Popover` | DS `Select` options are label-only |
| `PendingTracker` | `components/organisms/home/PendingTracker.tsx` (T2.1) | DS `StepLine` if it fits, else local | Only if built locally (no "current" state in `StepLine`) |
| `SegmentedControl press` | `components/molecules/SegmentedControl.tsx` (T1.0) | local `SegmentedControl` | Press feedback per the motion contract |
| `UsageDonut` (token-coloured 2-slice donut) | `components/organisms/billing/usage/UsageDonut.tsx` (T3.2) | hand-built SVG | DS `DonutViz` can't take `--viz-*` tokens |
| `Illustration` atom | `components/atoms/Illustration.tsx` (T0.2) | inline SVG components | Shared art system across products, if Realwired adopts direction C |
| `TourChip` (chip with an action + dismiss) | `components/molecules/TourChip.tsx` (T5.1) | local `Chip` | No DS chip carries an action and a dismiss (added in the build) |
| `Chip` leading `icon` + `ref` | `components/organisms/home/EarnPill.tsx` (T2.1) | DS `Chip` | The DS chip takes neither a leading icon nor a ref (added in the build) |
| `Button` label swap (cross-fade, width held) | `components/organisms/onboarding/OrgSetupForm.tsx` (T1.1) | local `Button` | Motion contract label swap; DS `Button` has no label transition (added in the build) |
| Pass-through `data-*` on `Tabs` triggers / table rows | `components/organisms/useTourTarget.ts` (T5.3) | DOM stamping hook | Tour targets need a stable attribute the DS parts don't forward (added in the build) |
| `Tooltip` tier prop | `components/organisms/prototype/ProtoPill.tsx` (T5.4) | DS `Tooltip` | A tooltip over a z-210 surface; the pill itself stays prototype-only (added in the build) |
