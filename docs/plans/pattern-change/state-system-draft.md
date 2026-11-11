# Prototype state system: draft (11 Nov 2026)

> **Reconciliation note (added after the accuracy review, 11 Nov).** Trial credits **never expire**, per decision D2a on 9 Nov. The trial stays at **6 credits (3 full reviews)**. The proposed 14-day window applies only to *earning* the 2 bonus full reviews. In §1.2 and §1.4:
> - Replace the wallet values `trial_expiring` / `trial_expired` with **`bonus_open`** (days left to earn) and **`bonus_closed`** (window over; trial credits remain).
> - Drop the 30-day trial lifetime from the `fresh`/`trial` ledger recipes.
>
> There is **no per-person credit limit** anywhere.

**Status:** design draft, nothing built. Implements direction **A1** (state pill, fill, hide, Prototype Index) and **A2** (enterprise vs PLG decided and routed in-app) from `docs/meetings/processed-calls/parachute-app-review-nov-10-2026-processed.md`. Model: Kelsey's Equisant (`INDEX.md` §3, frames 034530–035044).
**Inputs:** `docs/references/pattern-audit-nov-2026/parachute-current-state.md`; code on `feat/self-serve-onboarding-v2` @ f1b8bcf (`store/demo.store.ts`, `data/seed/demo-personas.seed.ts`, `components/organisms/DemoDock.tsx`, `lib/landing.ts`, `lib/demo.ts`, `lib/pricing.ts`, `app/(onboarding)/welcome/hooks/useWelcome.ts`, `app/(shell)/*`).

---

## 0. What's wrong today (short)

| Problem | Where | Effect |
|---|---|---|
| State lives in **9 personas spread over 4 orgs** (Meridian, HCB, Cedar, Lakeside). To change state you switch person *and* org. | `demo-personas.seed.ts`, `orgs.seed.ts` | You can't show "same bank, now low on credits". It feels like a Figma prototype (Cody). |
| **5 ways in** (`/start`, `/demo/<id>`, `?persona=`, user-menu switcher, sign-in "Demo accounts"). Only 3 of them go through `resolveEntryRoute`. | `lib/landing.ts`, `SignInForm.tsx:159` | The same persona lands on different pages depending on how you picked it. |
| DemoDock offers **actions** (approve, +5, low balance, complete next step), not **states**. You can't name or undo a state, and it's absent from auth pages. | `DemoDock.tsx` | No way to go back to pending. No zero, expiring, trial-expired or auto-reload-on state. Nothing for auth. |
| HCB "trial" holds 13 credits, including a purchased pack | `credit-ledger.seed.ts` | The canonical trial persona isn't a pure trial. |
| Enterprise vs PLG: `needsSalesFirst` already decides it (`lib/pricing.ts`), but **routing ignores it**. Everyone goes to `/get-started`, and the only difference is an optional toast-only "Book a call". | `useWelcome.ts`, `OrgSetupForm.tsx` | Cody's critique #2–3: the condition is invisible and enterprise goes down the PLG path. |

---

## 1. Model

### 1.1 Two layers: a global **scenario** + per-page **page states**

- **Scenario** = one typed record of global axes. It's the single source of truth for "what world are we in". Changing it rebuilds the **stage org's** rows (org, members, ledger, wallet settings, setup progress, reviews). The whole app then reacts through its normal stores: sidebar, BalancePill (and later the top-nav credits pill), banners, locks and routing. This is what Equisant does: picking a pill option changes nav locks, badges and the "Finish setup" FAB app-wide.
- **Page state** = a *named preset* on one screen, shown in that screen's pill. It's a **partial scenario** (`set`) plus an optional **page-local view** (`view`, e.g. `tab=invoices`, `variant=wrong-code`, `step=payment`) for things that aren't world state: form errors, tabs, checkout steps, auth variants.
- The pill **derives** its selected option from the current scenario and view. It picks the first state whose `set` and `view` both match, so it never stores its own selection. If nothing matches (someone changed an axis in the scenario popover), the pill shows a hollow dot labelled "Custom".

> Recommendation: **axes are canonical; pills are shortcuts into them.** I rejected two alternatives:
> 1. *Page-local fakes*: a pill that only re-renders the page. Cody wants the state to hold across the app: "trigger the conditions… then route".
> 2. *Personas only*: today's model. It's the Figma problem.

### 1.2 The axes

| Axis | Values | Store or seed it writes | Notes |
|---|---|---|---|
| **audience** | `plg` · `enterprise` · `youconnect` | `org.profile` (team/volume bands), `org.flags.salesRequested`, `session.mode` | `plg`: bands under the threshold. `enterprise`: `11+`/`200+`, the sales route. `youconnect`: the Meridian org in `embedded` mode, invoiced (the YC case is never self-serve). |
| **lifecycle** | `prospect` · `verified` · `pending` · `approved` · `suspended`* | `session.auth` (`anonymous`/`verified`/`signed_in`), `org.approval` | `prospect` means no session (auth pages). `verified` means signed up with no org yet (`/welcome`). `pending` means sales-flagged and waiting, with the trial held. *`suspended` is proposed and needs a decision from Ed (non-payment or compliance hold). It would need `ApprovalState` to gain `"suspended"`. Mark it **Planned** in the index. |
| **wallet** | `held` · `fresh` · `trial` · `trial_expiring` · `trial_expired` · `healthy` · `low` · `zero` · `invoiced` | `CREDIT_LEDGER` rows (built, never a stored balance), `org.billing` | Details in §1.4. `held` = pending, trial not granted yet. `fresh` = trial granted, nothing spent ("Never used"). |
| **wallet modifiers** | `autoReload` on/off · `expiring` on/off · `paymentMethod` none/card | `WALLET_SETTINGS`; ledger backdating | These are toggles, not values, because they combine with `healthy`, `low` and `zero`. |
| **setup** | `fresh` (1/9) · `mid` (4/9) · `almost` (8/9) · `done` · `hidden` | `SETUP_PROGRESS.completed`, `homeDismissedAt`, `prefs.setupHiddenBy` | `done`/`hidden` take `/get-started` out of the nav and landing (`setupGuideVisible`). |
| **role** | `org_admin` · `reviewer` · `approver` | `session.signIn({ userId, role })`, swapping to that role's seeded user in the stage org | HCB already has all three (Dana `user-dr`, Marcus `user-mo`, approver). Reviewers see read-only billing (Overview/My usage). |
| **data** | `empty` · `populated` · `busy` | `REVIEWS` for the stage org (the sample `review-sample` is untouched) | `empty`: no own reviews, so the 3-level empty rule fires. `populated`: a fixture set of about 8 rows in mixed phases. `busy`: populated plus overdue, auto-rejected and running rows (to show queue urgency). |

### 1.3 Normalisation rules (the axes aren't independent)

`normalize(scenario)` runs before every apply. It returns the corrected scenario, and the popover greys out impossible combinations with a one-line reason. They are greyed, never hidden, and clicking one explains why (A7, applied to our own tooling).

| If | Then |
|---|---|
| lifecycle = `prospect` or `verified` | no org exists. wallet, setup, role and data don't apply (the popover shows "—"). |
| lifecycle = `pending` | wallet is forced to `held` and data to `empty` (Start is locked). Audience must be `enterprise` (the 9 Nov decision: only sales-flagged orgs wait, `needsStaffApproval`). |
| audience = `youconnect` | wallet = `invoiced`, setup = `done`, mode = `embedded` on `/youconnect`. Lifecycle is fixed at `approved`. |
| audience = `enterprise` and lifecycle = `approved` | wallet defaults to `invoiced` (contract). `healthy` is allowed for a "prepaid enterprise" variant. **Open question for Ed.** |
| wallet = `invoiced` | autoReload and expiring are off; the billing tabs become Usage/Invoices/Settings. |
| role ≠ `org_admin` | the wallet still applies (it's org-wide), but the controls render in their read-only form. |
| setup = `done` or `hidden` | the `/get-started` pill states are disabled with "Setup is finished. Pick Fresh or Mid to see it." |

### 1.4 Wallet axis → ledger recipes (built by `buildLedger(sc, now)`)

`now` = the moment of the click (in an event handler, never in render). Lifetimes come from `lib/pricing.ts`: trial 30 days, earned 90 days, purchased 12 months.

| Value | Ledger built | Derived balance | What the user sees |
|---|---|---|---|
| `held` | none | 0 (pending) | Balance "Pending"; Add credits → validation explaining the wait (A7) |
| `fresh` | trial_grant 6 @ now−1h | 6 trial | "6 trial credits, expire in 30 days" |
| `trial` | trial_grant 6 @ now−8d; 2 debits; earned 1 | 5 (trial 4, earned 1) | the normal trial |
| `trial_expiring` | trial_grant 6 @ now−26d; 3 debits | 3 trial, **4 days left** | expiry alert, runway warning |
| `trial_expired` | trial_grant 6 @ now−31d; 2 debits | 0 (4 lapsed) | "Your trial credits expired"; buy CTA |
| `healthy` | trial (spent) + pack20 @ now−20d; 6 debits | 14 purchased | calm Overview |
| `low` | pack10 @ now−60d; 9 debits | **1** (≤ `alertLowBelow`) | low banner; Start of a 2-credit review → top-up validation |
| `zero` | pack10; 10 debits | **0** | Start blocked with validation; nav pill red |
| `invoiced` | debits only, `paidFrom` none | n/a | Usage/Invoices tabs |
| +`expiring` | adds earned 2 @ now−84d (or purchased @ now−11.5mo) | +2, expiring in 6 days | ExpiryAlert, "credits expiring" chip |
| +`autoReload` | settings `autoReload: true, reloadPackId: pack10, below: 2`; on `low` also adds an `auto: true` purchase row | | "Auto-reload on" chip; on `low` the history shows the auto top-up |

Precondition: the audit found **the balance is calculated two ways** and auto-reload rules differ between the dialog and Settings. Fix that first, or the pill will put the app in states that disagree with themselves.

### 1.5 The stage org

One org takes every self-serve state: **`org-stage`**, i.e. Harbor Community Bank, Dana Reyes (the org Cody saw). It's rebuilt from the scenario on every apply, using the existing per-org `replaceRows` from `lib/demo.ts`, so other orgs, prefs and theme survive. The YouConnect audience uses the existing **Meridian (`org-001`)**, which is read-only from the scenario's point of view. Cedar and Lakeside are retired as persona orgs. Their seeds can stay as `populated` review fixtures that get re-keyed. `/welcome` **upserts `org-stage`** instead of generating a random org id, which ends the "runtime org gets deleted on reset" special case in `resetOrgRows`.

### 1.6 Presets: what the 9 personas become

A preset is a named full scenario plus an entry screen. The personas map onto presets like this:

| Old persona | Preset (audience · lifecycle · wallet · setup · role · data) | Entry |
|---|---|---|
| prospect | plg · prospect | `/auth/create-account` |
| prospect-sales | enterprise · verified | `/welcome` (wand pre-fills 11+) |
| pending-admin | enterprise · pending · held · fresh · admin · empty | landing → `/get-started` |
| trial-admin | plg · approved · **trial** (was 13 credits; now a pure trial) · mid · admin · populated | landing |
| payg-admin-low | plg · approved · low · done · admin · populated | `/launchpad` |
| reviewer | plg · approved · trial · mid · reviewer · populated | landing |
| approver | plg · approved · healthy · done · approver · busy | `/reviews` |
| returning | enterprise · approved · invoiced · done · admin · populated | `/launchpad` |
| enterprise-yc | youconnect · approved · invoiced · done · admin · populated | `/youconnect` |

New presets that fill gaps: **PLG zero balance**, **PLG trial expiring**, **Enterprise call booked**, **Enterprise approved (pre-configured)**, **Suspended** (Planned).

---

## 2. Page-by-page state table

How to read it: the **Pill** column lists the options left to right. The first item is the page label (not clickable, as in Equisant's `Refunds / Gated / Null / Active`). **Sets** is the scenario patch and/or view param. **Missing today** means states that no toggle can reach now. ✚ = route doesn't exist yet.

### 2.1 Auth (Keycloak theme reference, `app/(auth)/auth/*`)

Auth states are view-only: `?variant=`, read by the form. Lifecycle is forced to `prospect`.

| Route | Pill | Sets | Missing today |
|---|---|---|---|
| `/auth/sign-in` | Sign in / **Default** / SSO domain / Email instead / Wrong password / Locked out / Invited | view `variant` = `default`·`sso`·`email`·`bad-creds`·`locked`·`invited`. `sso`: email at harborcb.com → "Your org signs in with YouConnect/Microsoft". `invited`: a banner naming the org. | All except Default and the bad-credentials error (reachable only by typing). Remove the "Demo accounts" panel. |
| `/auth/create-account` | Create account / **Default** / Email in use / Invited by teammate / Invited by Realwired | `variant`. The two invited variants pre-fill the email, lock it and show who invited (the enterprise post-call path). | Every variant except client-side validation |
| `/auth/verify` | Verify / **Code sent** / Wrong code / Code expired / Resent | `variant` | Error variants |
| `/auth/reset` | Reset / **Request** / Link sent / New password / Link expired | `variant` | Everything but Request (check) |
| `/auth/mfa` | MFA / **Authenticator** / Wrong code / Recovery code | `variant` | Unlinked page: link it from the sign-in `default` flow when `org.flags.mfa` is set. |

Fill wand: on all five (email, name, password ≥12, code `482913`).

### 2.2 Onboarding

| Route | Pill | Sets | Missing today |
|---|---|---|---|
| `/welcome` | Welcome / **Self-serve** / Enterprise | `audience` plus answers. **Self-serve** = 2–10, Under 50. **Enterprise** = 11+, 200+. It doesn't submit, so the routing preview shows (§5). Lifecycle = `verified`. | Showing the condition. Today it's the `?preset=large` URL hack plus an optional toast. |
| ✚ `/welcome/call` | Book a call / **Pick a time** / Booked / Skipped (book later) | `view step`; *Booked* sets `org.profile.callBookedAt` and lifecycle `pending` | The whole page: today "Book a call" is a toast with no scheduler. |
| ✚ `/welcome/invite` (optional, see the audit "no invite step") | Invite / **Empty** / 2 invited / Skipped | view; *2 invited* writes Bouncer invites | Whole step (it's only checklist step 8 today) |
| `/welcome/path`, `/pending`, `/ready` | (none) | redirect | Listed as **Retired** in the index. Reuse none of them; delete them once old links are gone. |

### 2.3 Get started (`/get-started`; it becomes one column under A3)

| Pill | Sets | Missing today |
|---|---|---|
| Get started / **PLG · New** / PLG · Mid-setup / PLG · Almost done / Enterprise · Call booked / Enterprise · Pre-configured / Trial expiring | New: `plg, approved, fresh, setup:fresh`. Mid: `trial, mid`. Almost: `almost` (one step left, then the completion moment). Call booked: `enterprise, pending, held, fresh`. Pre-configured: `enterprise, approved, invoiced, setup:mid`, where Realwired has done checklist and layout, with the banner "Set up by Jordan Blake from Realwired from your agreement" (the Equisant 034927 analog). Trial expiring: `trial_expiring, mid` (the deadline headline goes urgent). | Enterprise variants (today the only one is the pending banner), Almost done / completion, trial expiring, and Pre-configured with fewer steps. Pending → approved is one-way today: there's no way back to pending. |

Role note: if role is reviewer, the page shows the reviewer subset (no billing steps). Pill states stay the same and role comes from the scenario popover.

### 2.4 Dashboard, Launchpad, Reviews

| Route | Pill | Sets | Missing today |
|---|---|---|---|
| `/dashboard` | Dashboard / **First run** / Pending approval / Populated / Busy / Zero balance | First run: `approved, data:empty`. Pending: `pending, held, empty`, where Start is a **lock icon + validation on click** (A7) and never disabled. Populated: `data:populated, healthy`. Busy: `busy`. Zero: `zero, populated` (Start → validation + Add credits). | Busy, Zero and Low are reachable only through Cedar (another org). Validation on click is missing (it's a tooltip on a disabled button today). |
| `/launchpad` | Start a review / **Ready** / Pending approval / Not enough credits / Auto-reload covers it / Invoiced | `approved, healthy` · `pending` · `low` (2-credit review vs 1) · `low + autoReload` · `invoiced` | Not enough credits is only via Cedar; auto-reload is unreachable. |
| `/reviews` | Reviews / **Empty** / Sample only / Populated / Busy / Filtered to none | `data` axis. *Filtered to none* = view `q=zzz` (the search-empty line). | Busy (needs-action heavy) and filtered-none aren't one click away. |
| `/reviews/[id]` | Review / **Running** / Ready / Returned / Signed · Technical / Admin only / Both tracks | Picks a fixture id per state (`view id`). The route param changes, so the pill navigates. The track is a view (`track=admin`). | No switch today; you have to find the right row. The Returned state is dormant (client Q1), so mark it **Planned**. |
| Run takeover (RunModal, global) | Run / **Confirm** / Progress / Workbook / Not enough credits at Start | `run.store` spoke; *Not enough credits* = `zero` + confirm | The credits-at-Start validation state |

### 2.5 Configure

| Route | Pill | Sets | Missing today |
|---|---|---|---|
| `/configure` (hub) | Configure / **Admin** / Reviewer | `role` | Reviewer view of the hub |
| `/configure/organization` | Organization / **Self-serve** / Enterprise (managed) | `audience`. Enterprise shows fields as "Managed by Realwired". | Managed variant |
| `/configure/defaults` | Review defaults / **Org defaults** / Not set up (fresh org) | `setup` | Fresh-org empty state |
| `/configure/workbook-layouts` (+ `/view`) | Layouts / **Default only** / Custom published / Draft in progress | `setup` (the `layout` step and the in-progress note) | Draft-in-progress isn't reachable with HCB |
| `/configure/responses` | Responses / **Empty** / Populated | `data` | Empty |
| `/configure/checklists` (+ `[id]`) | Checklists / **None published** / Draft 18 of 24 / Published | `setup` (`checklist` step and `inProgress`) | Published without completing the step by hand |
| `/configure/security` (until the Trust Center replaces it) | Security / **Not sent** / Sent / Link expired | `onboarding.securitySends` | Link expired |
| `/profile` | Profile / **Admin** / Reviewer / SSO user (no password) | `role`; view `sso` | SSO variant |

### 2.6 Billing & credits (`/configure/billing`; A8–A11)

The tabs stay as `?tab=`. The pill sets the **wallet** world, and the tab is a view the state may also set.

| Tab / route | Pill | Sets | Missing today |
|---|---|---|---|
| **Overview** (admin) | Billing / **Never used** / Trial / Trial expiring / Trial expired / Healthy / Low / Zero / Pending approval / Invoiced / Auto-reload on / Credits expiring | the wallet values in §1.4. *Auto-reload on* = `healthy + autoReload`. *Credits expiring* = `healthy + expiring`. *Invoiced* jumps the tab to `usage` (Overview doesn't exist when invoiced). | Never used (pure), Trial expiring, Trial expired, Zero, Auto-reload on, Credits expiring, back to Pending, Invoiced ↔ trial (all listed as missing in the audit) |
| **Usage** | Usage / **No usage** / This month / By person / By review type | `data` + view `group` | No-usage empty state; by-person grouping (Apollo 040719) |
| **Invoices** | Invoices / **None** / Receipts (card) / Statements (invoiced) / Payment failed | wallet + `paymentMethod`. *Payment failed* = a failed auto-reload row (Planned). | None, Payment failed |
| **Settings** | Settings / **No card** / Card on file / Auto-reload on / Auto-reload hit monthly cap / Invoice billing | `paymentMethod`, `autoReload`, cap-reached ledger | No card, cap reached |
| **Plans** (hidden) | Plans / **Hidden** / Shown | `org.flags.plansTab` | It's a flag today with no toggle |
| Reviewer **Overview / My usage** | Billing / **Healthy** / Low / Zero | wallet with `role: reviewer` | Low and zero as a reviewer ("ask your admin" copy) |
| `/configure/billing/statement` | Statement / **This month** / Empty month | view `month` | Empty month |
| ✚ Top-nav credits pill + popover (A8) | (driven by the page's pill, no pill of its own) | n/a | The component itself |
| ✚ `/configure/billing/credits` "What are credits?" (A9) | Credits / **Default** / Enterprise (talk to sales emphasised) | `audience` | Whole page |
| ✚ **Full-page checkout** `/checkout/credits` (A10) | Checkout / **Choose amount** / Payment / Review / Paid / Pending approval / Card declined / Over custom max → sales | view `step` = `amount`·`payment`·`review`·`done`. *Pending*: `pending` (Pay stays enabled; clicking explains the wait, A7). *Declined*: view `error=card`. *Over max*: amount 150 > `CUSTOM_CREDITS.max`. | Whole page (replaces `TopUpModal` as the primary path) |

### 2.7 Trust & Learning (future)

| Route | Pill | Sets | Missing today |
|---|---|---|---|
| ✚ `/trust` Trust Center (A6) | Trust Center / **Public** (signed out) / Signed in / Pack sent to IT / NDA-gated doc | lifecycle; `securitySends` | Whole page. Today the closest thing is `/configure/security` plus the SecurityPackCard. |
| ✚ `/learn` Learning Center (A5) | Learn / **All** / Admin track / Reviewer track / Watched some | `role`; view `progress` | Whole page |
| ✚ Contextual video in empty states and the first-visit tour (A5) | Shown on the host page through its *Empty* / *First run* state, plus a global popover toggle "Reset tours" | `prefs.toursSeen = {}` | Both patterns |

### 2.8 Emails, integrations and prototype-only

| Route | Pill | Sets | Missing today |
|---|---|---|---|
| `/emails` | Emails / Verify / Ready / Earned / Low balance / Receipt + **✚ Call booked / Approved (enterprise) / Trial expiring / Credits expiring / Zero balance / Auto-reload charged** | view `id` (the page already does `pick(id)`) | the six ✚ templates |
| `/youconnect` | YouConnect / **Inbox** / New delivery / Already in queue | `audience: youconnect`; view | Already in queue (second review) |
| `/launch` | Handoff / **Arriving** / Error (no access) | view | Error |
| `/launch/bouncer`, `/bouncer` | Bouncer / **Members** / Invite pending / SSO enforced | `bouncer.store` | SSO enforced |
| `/start`, `/demo/[persona]` | (none) | redirect (§3.4) | n/a |
| `/styleguide`, `/components` | (none) | n/a | Index group "Design system" |

---

## 3. Controls UI spec

### 3.1 The pill (`ProtoPill`)

| Aspect | Spec |
|---|---|
| Placement | Fixed at **top centre**, 10px below the viewport edge, rendered in a portal to `document.body` (house rule). It sits over the header's breadcrumb gap, never over the ⌘K search or the user menu. On narrow viewports it collapses to `label ▾`. |
| Layers | z-index **210**, above the overlay tier (200), so it still works on top of RunModal, checkout and dialogs (Equisant keeps it visible on modals too). |
| Anatomy | `[Page label] │ state · state · state … │ ✦ wand │ ⚙ scenario ▾ │ ⌗ index │ 👁 hide`. Segments use the `SegmentedControl` sliding thumb (Framer `layoutId`). If there are more than 6 states, overflow goes into a `+N ▾` menu. |
| Selection | Derived (§1.1). Clicking runs `applyPageState(screen, state)`, which normalises, rebuilds the stage org, reloads the stores, sets the view params with `router.replace` (no history spam) and shows a 1-second inline "Applied" tick. A state that navigates (`/reviews/[id]`, Invoiced → `tab=usage`) routes there. |
| Status marks | States the page doesn't render yet show as a **Planned** dashed segment. Clicking one opens a small card with "Not built yet" and the spec link. It's never disabled. |
| Copy | Equisant-style short labels (≤ 2 words). The full description goes in a `compact` Tooltip. |
| No-pill pages | Show only `⚙ ⌗ 👁` (scenario, index, hide). |

### 3.2 Scenario popover (⚙): replaces DemoDock

- **Axes:** six labelled `SegmentedControl`s (§1.2) plus the three modifier switches. Impossible values are greyed with a reason (§1.3).
- **Presets:** a list of the presets (§1.6). Picking one applies the scenario and goes to its entry through `resolveEntryRoute`.
- **Actions** (everything the dock had): **Approve now** (pending → approved, with trial grant or contract), **Complete next step**, **+5 credits**, **Spend 1 credit**, **Reset stage org** (rebuild from the current scenario), **Open e-mails**, **Show build notes** switch, **Reset tours**.
- **Copy link:** copies `location + ?s=<encoded scenario>`. On load, `?s=` is applied once and stripped, the same as `clearPersonaParam` does now.
- **Footer:** "Stage org: Harbor Community Bank · Dana Reyes (admin)".

### 3.3 Fill wand (✦)

- Fills the visible form with good demo data. **It never submits.** **Shift-click** fills it with *invalid* data instead, so the validation states (A7) can be shown live.
- Mechanism: the page registers a handler with `useProtoFill(screenId, { valid, invalid })`. The wand calls the handler for the current screen. If the page registers none, the wand isn't rendered.
- Data depends on audience: on `/welcome`, Enterprise fills 11+ and 200+ and Self-serve fills 2–10 and Under 50.

| Forms with a wand |
|---|
| `/auth/create-account` · `/auth/sign-in` · `/auth/verify` · `/auth/reset` · `/auth/mfa` |
| `/welcome` · ✚ `/welcome/call` (picks the first free slot) · ✚ `/welcome/invite` (2 colleagues) |
| ✚ `/checkout/credits` (amount 10, card 4242…, billing address, PO, tax ID) · Billing **Settings** (billing email, PO, tax ID, address, alerts) |
| `/configure/organization` · Security pack send (IT email + note) · Bouncer invite |
| RunConfirm / Order upload (the identity fields) |

### 3.4 Hide toggle, persistence, keyboard

| Control | Spec |
|---|---|
| Hide (👁) | Removes the pill, the build notes and every prototype annotation (including the §5 routing note). Persisted in `localStorage` `parachute:proto:hidden`. `?controls=0` in a link forces it hidden for screen-shares and recordings, and isn't persisted. |
| Coming back | While hidden, nothing is drawn (like Equisant). Press the shortcut to restore. The first time you hide, a toast shows the shortcut. |
| Kill switch | `NEXT_PUBLIC_DEMO_PERSONAS=0` (the existing flag; rename it to `NEXT_PUBLIC_PROTOTYPE_CONTROLS` and keep the old name as an alias) removes every control, `/prototype` and the presets. |
| Shortcuts (read with `e.code`, ignored while typing in a field, so they're Mac-safe) | **Ctrl/⌘ + .** shows or hides the controls · **Alt + 1…9** picks page state n · **Alt + [ / ]** goes to the previous or next state · **Alt + F** fills (Alt + Shift + F fills invalid) · **Alt + S** opens the scenario popover · **Alt + I** opens the Prototype Index. They're listed in the ⌘K palette under "Prototype". |

### 3.5 What happens to DemoDock, `/start` and the personas

| Today | Recommendation |
|---|---|
| **DemoDock** (`organisms/DemoDock.tsx`, mounted in AppShell and the onboarding layout, not on auth) | **Replace.** Its actions move into the scenario popover. Delete the component and the `.demo-dock*` CSS. The pill mounts in AppShell, the onboarding layout **and KeycloakFrame**, so auth gets controls for the first time. |
| **`/start` launcher** | **Redirect to `/prototype`.** The two "entry path" cards become the Flows tab's first two flows (Standalone and Embedded). |
| **`/demo/<id>`, `?persona=`** | **Keep as aliases.** `<id>` resolves to a preset, which goes through `enterPreset()` → `resolveEntryRoute`. Old shared links still work. |
| **User-menu "Switch demo persona"** | **Remove.** The scenario popover is the only switcher. |
| **Sign-in "Demo accounts" panel** | **Remove.** The auth pill and the presets cover it. It was also one of the paths that skips `resolveEntryRoute`. |
| `demo-personas.seed.ts` | **Becomes the presets block** of `lib/prototype-registry.ts`. Ids stay the same so aliases keep working. |

---

## 4. Prototype Index

| Aspect | Spec |
|---|---|
| Route | **`/prototype`** (canonical). Add an **`/index`** alias to match Equisant if the App Router serves a segment named `index` cleanly. Test this first; if it doesn't, add a redirect in `next.config`. Outside the shell (no sidebar), like `/emails`. |
| Header | Logo + "Prototype Index", search (placeholder "Search pages, routes, states, tags", `/` to focus), counter "**N of M screens**", **Open prototype ▾** (the presets), **Copy current scenario link**. |
| Tabs | **Screens** · **Flows** · **States** (a flat list of every page state, filterable to Built/Planned; this is the A11 checklist). |
| Left rail | The groups, with counts: **Auth · Onboarding · Get started · Reviews · Billing & credits · Configure · Trust & Learning · Emails** · Integrations (YouConnect, Launch, Bouncer) · Design system. |
| Screen card | Thumbnail (static `/public/proto-thumbs/<screenId>.png`, made by a Playwright script; grey placeholder plus an icon if missing) · **title** · **route** · **status** badge `Built` / `Variant` / `Planned` / `Retired` · **states**: count + the first 4 as chips, each one a deep link that applies the state and opens the route · **flows** "In 2 flows" · **audiences** (PLG / Ent / YC dots) · **roles** if limited (e.g. "Admin only") · a "Has wand" mark. |
| Card actions | Click → open in the current scenario. A chip → open in that state. A `⋯` menu → copy the deep link (`/prototype/go?screen=billing&state=low`). |
| Flows tab | Ordered steps, each a `(screen, state)` pair, with a "Play" that walks through them using **Alt + ]** across screens. Initial flows: **PLG sign-up** (create → verify → welcome Self-serve → get-started New), **Enterprise sign-up** (create → verify → welcome Enterprise → call Pick → Booked → get-started Call booked → [Approve] → Pre-configured), **First review** (launchpad → run Confirm → Progress → Workbook → Sign), **Buy credits** (billing Low → checkout Amount → Payment → Review → Paid → Overview Healthy), **Out of credits at Start**, **Reviewer day** (reviews Populated → review Ready → Sign), **YouConnect embedded** (youconnect → launch → run → return), **Trust Center hand-off to IT**. |
| Data source | **Generated** from `lib/prototype-registry.ts`. No hand-kept list. A dev-only check warns in the console if a `page.tsx` route has no registry entry, or if a registry route has no page and isn't marked Planned. |

### 4.1 Registry shape (`lib/prototype-registry.ts`)

```ts
export type Audience = "plg" | "enterprise" | "youconnect";
export type Lifecycle = "prospect" | "verified" | "pending" | "approved" | "suspended";
export type WalletState = "held" | "fresh" | "trial" | "trial_expiring" | "trial_expired"
  | "healthy" | "low" | "zero" | "invoiced";
export type SetupState = "fresh" | "mid" | "almost" | "done" | "hidden";
export type DataState = "empty" | "populated" | "busy";

export interface Scenario {
  audience: Audience; lifecycle: Lifecycle; wallet: WalletState;
  autoReload: boolean; expiring: boolean; paymentMethod: "none" | "card" | "invoice";
  setup: SetupState; role: UserRole; data: DataState;
}

export type BuildStatus = "built" | "variant" | "planned" | "retired";
export type GroupId = "auth" | "onboarding" | "get-started" | "reviews" | "billing"
  | "configure" | "trust-learning" | "emails" | "integrations" | "design-system";

export interface PageState {
  id: string;                       // "low"
  label: string;                    // "Low"
  description?: string;             // tooltip + index
  set?: Partial<Scenario>;          // world patch
  view?: Record<string, string>;    // page-local: tab, variant, step, id
  status: BuildStatus;              // planned = dashed segment
}

export interface ScreenDef {
  id: string;                       // "billing"
  title: string;                    // "Billing & credits"
  route: string;                    // "/configure/billing"  (pattern ok: "/reviews/[id]")
  group: GroupId;
  status: BuildStatus;
  pillLabel?: string;               // first, inert segment; defaults to title
  states: PageState[];              // [] = no pill segments
  fill?: true;                      // wand available
  roles?: UserRole[]; audiences?: Audience[];
  tags?: string[]; thumb?: string;
}

export interface FlowDef { id: string; title: string; audience?: Audience;
  steps: { screen: string; state?: string; note?: string }[]; }

export interface Preset { id: string; label: string; description: string;
  scenario: Scenario; entry: string; legacyPersonaId?: string; }

export const SCREENS: ScreenDef[]; export const FLOWS: FlowDef[]; export const PRESETS: Preset[];
export function screenForPath(pathname: string): ScreenDef | undefined;
export function activeState(screen: ScreenDef, sc: Scenario, view: URLSearchParams): PageState | undefined;
```

Both the pill (`screenForPath(usePathname())`) and the index read this file, so one edit adds a state in both places.

---

## 5. Enterprise vs PLG routing

### 5.1 The rule (one function, already half there)

`routeForProfile(profile)` in `lib/pricing.ts` wraps the existing `needsSalesFirst`:

> **Enterprise** if `teamBand === "11+"` (reviewers ≥ `SALES_THRESHOLDS.reviewers` = 11) **or** `volumeBand === "200+"` (reports a month ≥ `SALES_THRESHOLDS.reportsPerMonth` = 200). **Otherwise PLG.** YouConnect is never decided here: it comes from the entry mode (`/youconnect` → `/launch`), not from answers.

- **Fix the band labels.** Today it's "50–200" and "200+", so 200 sits in both. Relabel them "50–199" and "200+". Labels come from `SALES_THRESHOLDS` so they can't drift.
- Threshold numbers stay placeholders for Ed (`lib/pricing.ts`).
- Open question for Ed: is it OR, as now, or should one signal alone send a team to sales? Keep OR for now.

### 5.2 Showing the condition (Cody: "how the user gets determined")

| Layer | What shows |
|---|---|
| **Product UI** on `/welcome` (always) | When an answer crosses a threshold, the Continue button relabels live to **"Continue: book your setup call"**. A one-line callout replaces the optional "Book a call" box: "Teams with 11+ reviewers or 200+ reports a month get a guided setup with a Realwired specialist." The triggering answer gets a small petrol marker. Below the threshold, the button reads "Continue to Parachute". |
| **Prototype annotation** (only while the controls are visible, shown as a build note) | A strip under the form: `Route: Enterprise · because Reviewers = 11+ (≥ 11)`. Or `Route: Self-serve · Reviewers 2–10 < 11, Reports Under 50 < 200`. Each value updates as answers change. This is the "show the condition" deliverable. |

### 5.3 What each audience sees after `/welcome`

| Step | PLG | Enterprise | YouConnect |
|---|---|---|---|
| Org created | `approval: "none"` (instant), `billing: trial` | `approval: "pending"`, `flags.approvalGate`, `profile.salesRequested` | none (Meridian exists) |
| Credits | trial 6 granted now (`grantTrial`) | **held**: no trial and no purchase (Add credits / Pay → validation "Opens after your setup call", never disabled) | invoiced |
| Next route | **`/get-started`** (New: one column, deadline + "Earn up to 3 credits") | **`/welcome/call`** → pick a slot (Realwired scheduler mock; "I'll book later" link) → Booked → **`/get-started` (Call booked)** | `/youconnect` → `/launch` → embedded run |
| Get started content | full checklist (sample, first review, sign, policy, security, checklist, layout, invite) | status hero "Your setup call: Thu 14 Nov, 10:00 with Jordan Blake" + a short "Before your call" list (invite IT, Trust Center, policy upload). First review is **locked with a lock icon + explanation**. | n/a |
| Approval | n/a | Staff approves (popover **Approve now** or the Get started pill → *Pre-configured*). Then billing becomes invoiced (default), checklist and layout are pre-filled with "Set up by Realwired" banners, fewer steps remain, and an email goes out ("approved") | n/a |
| Landing afterwards | `landingRoute()` | `landingRoute()` | `/youconnect` |

### 5.4 Pill shortcuts into the routing

| Where | Shortcut |
|---|---|
| `/welcome` pill **Self-serve / Enterprise** | Sets the audience and fills the answers on either side of the threshold. You can watch the button and annotation flip. You still click Continue to see the route happen, and that click is the demo moment. |
| `/welcome/call` pill | Pick a time / Booked / Skipped |
| `/get-started` pill | PLG · New … Enterprise · Call booked / Pre-configured. Applying a state rebuilds the stage org, so there's no need to replay sign-up. |
| Index → Flows → **Enterprise sign-up** | Plays the whole route. |
| Presets | "Enterprise · call booked", "Enterprise · approved" |

---

## 6. Implementation notes

### 6.1 Files

| Add | Purpose |
|---|---|
| `src/lib/prototype-registry.ts` | `SCREENS`, `FLOWS`, `PRESETS`, `screenForPath`, `activeState` (§4.1) |
| `src/lib/prototype/scenario.ts` | types, `DEFAULT_SCENARIO`, `normalize`, `encode`/`decode` for `?s=` |
| `src/lib/prototype/scenario-builder.ts` | pure `buildOrg / buildLedger / buildWalletSettings / buildSetupProgress / buildReviews / buildMembers (sc, now)` |
| `src/data/seed/scenario-fixtures.seed.ts` | review fixtures for `populated`/`busy` (re-keyed from Meridian and Cedar rows), the ledger recipe constants and the stage org base |
| `src/store/prototype.store.ts` | `scenario`, `hidden`, `applyScenario`, `applyPageState`, `applyPreset`, `fill` handler registry. Replaces `demo.store.ts`. |
| `src/components/organisms/prototype/` | `ProtoPill.tsx`, `ScenarioPopover.tsx`, `ProtoKeys.tsx` (shortcuts), `RoutingNote.tsx` (§5.2), `useProtoFill.ts`, `useProtoView.ts`, `prototype.css` (tokens only) |
| `src/app/prototype/page.tsx` (+ `go/page.tsx` for deep links, + the `/index` alias) | Prototype Index |
| `src/app/(onboarding)/welcome/call/page.tsx` | Enterprise call booking |
| `scripts/proto-thumbs.mjs` | Playwright: visit each screen and default state, write the PNGs |

| Change | What |
|---|---|
| `components/templates/AppShell.tsx`, `app/(onboarding)/layout.tsx`, `components/templates/KeycloakFrame.tsx` | Mount `ProtoPill` + `ProtoKeys` instead of `DemoDock` (auth gains them) |
| `components/organisms/DemoDock.tsx`, `store/demo.store.ts` | Delete once the popover is at parity |
| `data/seed/demo-personas.seed.ts` | Fold into `PRESETS` (ids kept) |
| `lib/demo.ts` | Export a generic `replaceRows`; `resetOrgRows` → `rebuildStageOrg(sc)`; drop the runtime-org delete path |
| `lib/landing.ts` | Add `enterPreset()`/`entryFor()`; **every** entry goes through `resolveEntryRoute` |
| `app/start/page.tsx`, `app/demo/[persona]/page.tsx` | Redirect / alias (§3.5) |
| `components/organisms/auth/SignInForm.tsx` + the user menu | Remove the persona switchers |
| auth forms (`*Form.tsx`) | Read `?variant=`; register fills |
| `app/(onboarding)/welcome/hooks/useWelcome.ts`, `OrgSetupForm.tsx` | `routeForProfile`, live button label, `RoutingNote`, upsert `org-stage`, route enterprise to `/welcome/call` |
| `lib/pricing.ts` | `routeForProfile`; band labels from `SALES_THRESHOLDS` |
| `types/domain.types.ts` | `ApprovalState` + `"suspended"` (if Ed agrees); `OrgProfile.callBookedAt?`; `OrgFlags.plansTab` already exists |
| `store/wallet.store.ts` | **First**: one balance computation and one auto-reload rule (§1.4 precondition) |
| `app/(shell)/configure/billing/page.tsx`, `useStartGate.ts`, and pages with disabled actions | Read view params; lock + validation instead of disabled (A7), so the Pending / Zero states demo correctly |
| `app/emails/content.ts` | Six new templates (§2.8) |
| `data/adapters/mock-adapter.ts` | `SEED_VERSION` **v22 → v23** |
| `components/organisms/CommandPalette` | "Prototype" group (index, scenario, hide) |

### 6.2 Risks

| Risk | Mitigation |
|---|---|
| **Seed version bump** (v22 → v23) wipes every viewer's local data, including Ed's half-done walkthroughs and the hosted site's visitors | Bump once, at the end of P1 (batch all seed changes). Say so in the release note. Presets make any state one click away again. |
| **Entry-route inconsistency** (the user menu and the sign-in panel skip `resolveEntryRoute`) | Delete both and route every entry through `enterPreset()`. Add a dev assertion that no `router.push(persona.entryRoute)` remains. |
| The rebuilt stage org drifts from what `/welcome` created (random org ids today) | `/welcome` upserts the fixed `org-stage` id. `rebuildStageOrg` touches only that id (and never Meridian). |
| Ledger recipes disagree with the derived meters (the two-balance bug, spend order trial → earned → purchased) | Fix the wallet store first. Unit-test each recipe: `balance()` and `remainingBySource()` must equal the table in §1.4. |
| `Date.now()` in builders vs React 19's pure-render rule | Builders take `now` as an argument and are called only from click handlers or effects. Seeds keep fixed epochs. |
| Pill collides with RunModal, checkout and dialogs; z-order fights | Fixed z 210 tier, documented. Dialog focus traps must leave the pill reachable only by its shortcut (not by Tab). |
| A shared `?s=` link overwrites a viewer's own scenario | Apply once, strip the param, and show a toast "Switched to <preset> · Undo". |
| Building pills for **future** pages (checkout, Trust, Learn) ahead of the pages | Register them as `planned`. The index shows them dashed and they're never broken links. |
| `/index` as an App Router segment | Use `/prototype` as canonical; the alias is optional. |
| Hosted prototype (Vercel, `SITE_PASSWORD` gate): controls visible to the client | Intended (Cody presents with them). Hide via `?controls=0` or the env kill switch when needed. |

### 6.3 Rough size and phasing

| Phase | Scope | Size |
|---|---|---|
| **P0** | Wallet store: one balance, one auto-reload rule; recipe tests | 0.5–1 d |
| **P1** | Scenario types, builder, `prototype.store`, registry for **existing** routes, pill, scenario popover (DemoDock parity), shortcuts, hide; delete DemoDock and the persona switchers; `/start` redirect; seed v23 | 3–4 d |
| **P2** | Fill wand handlers (about 12 forms) + auth `?variant=` states | 1.5 d |
| **P3** | Prototype Index (Screens / Flows / States, search, deep links, thumbnail script) | 1.5–2 d |
| **P4** | Enterprise routing: `routeForProfile`, live condition + RoutingNote, `/welcome/call`, enterprise Get started variants, approval path, emails | 2 d |
| **P5** | Missing **existing-page** states: billing (expiring, expired, zero, auto-reload, cap, no card), A7 lock + validation, reviews busy/filtered | 2 d |
| Later | Pills for checkout / Trust / Learn / credits explainer land with those pages (registered as Planned now) | (with each page) |

**Total for P0–P5: about 11–13 days.** P1 alone gives Cody the Equisant demo on today's pages.

### 6.4 Open questions (log them in the client-questions doc)

1. Enterprise after approval: invoiced by default, or prepaid credits? (§1.3)
2. Is `suspended` a real state? What triggers it and what does the user see?
3. Sales rule: OR (current) or AND? Are 11 / 200 final?
4. Enterprise: is the call *required* before using the app, or can people book later and look around while pending? (The draft allows "book later" and keeps them pending.)
5. Trial expired: do unused trial credits lapse silently, or does an email warn at 7 days and 1 day?
