# Reconcile B: credits, checkout and billing vs the real app

**Date:** Nov 11, 2026 · **Scope:** spec §2, §4, §5.3–§5.9, §6, §8 against `app/src` on `feat/pattern-change` (head `d023d83`) · **Read-only audit.**
Paths are relative to `app/src/` unless they start with `docs/`. Boards: B1 = `proposed-screens/index.html`, B2 = `proposed-screens/part2.html` (section ids in `#…`).

---

## 1. Entry points: buying credits and seeing the balance

Every purchase today goes through **one store action**, `useWalletStore.openTopUp({ reason, needed })` (`store/wallet.store.ts:325`), which flips `topUpOpen`. **`TopUpModal`** is mounted once in `AppShell` (`components/templates/AppShell.tsx:211`). It branches on the session role: `org_admin` gets the purchase `TopUpDialog`; any other role gets **`AskAdminDialog`** (toast only). This means every caller below already reaches a role-aware surface. Moving to checkout only has to change what `openTopUp` does, as spec §5.6's `CheckoutLauncher` proposes.

### 1a. "Add credits" / purchase triggers

| file:line | Surface | Audience | Today | Proposed target |
|---|---|---|---|---|
| `app/(shell)/configure/billing/page.tsx:137` | Billing page band, `actions` slot | Admin, wallet orgs (trial/payg). Not rendered for invoiced or non-admins | `b.openTopUp` → `openTopUp({reason:"manual"})` → TopUpModal. Not locked while pending: the modal shows a disabled lock button instead | Checkout `?pack=pack10&return=/configure/billing?tab=<tab>`. Pending → `LockedAction` (approval) |
| `components/organisms/billing/OverviewTab.tsx:185` (rendered via `:248`) | `ExpiryAlert` callout on Overview | Admin only (`ReviewerBilling` passes no `onBuy`) | "Add credits" (tonal) → TopUpModal | B2 `#billing-expiring` swaps the action to **"Start a review"**. Spec §5.8 keeps `ExpiryAlert`. Decide which (see §5) |
| `components/organisms/billing/invoices/InvoicesTab.tsx:229` | Invoices tab level-1 EmptyState | Admin, wallet org, no purchases and no use | "Add credits" → TopUpModal | Checkout, `return=/configure/billing?tab=invoices` (§5.6 acceptance lists it) |
| `components/organisms/wallet/WalletCard.tsx:57,107` | Get started wallet card, low state (`GetStarted.tsx:213`, until setup is done) | Admin. Reviewers get "View balance" plus "Ask {admin}" meta | `openTopUp({reason:"low_balance", needed: fullCost − balance})` | **Deleted** by agent A (§8). The replacement entry is the header popover |
| `components/run/CostSummary.tsx:191` (`LowBalanceCallout`, shown from `run/RunConfirm.tsx:406`) | Run confirm gate, inline callout when short | Admin gets "Add N credits · $X". Others get "Ask your admin" (toast) | `openTopUp({reason:"low_balance", needed: cost.credits})`. Note: `needed` is the full cost, not the shortfall | Callout removed. `LockDialog` credits variant → checkout `credits=<shortfall>` or a pack, with `return=<run path>` (§5.5) |
| `components/run/RunModal.tsx:65` | Start backstop, overlay run (drop or YC pick from `/launchpad`, `IntakeWidget.tsx:80`) | Any role (the modal branches) | `openTopUp` when `!canAfford`. Nothing is created yet | `openLock({kind:"credits"})` (agent C) → checkout. Return target = the page under the overlay (see §3) |
| `app/(shell)/reviews/[id]/page.tsx:68` | Start backstop, routed review | Any role | `openTopUp` when `!canAfford` | Same as above, `return=/reviews/<id>` |
| `app/emails/content.ts:176` | Low-balance email CTA | Admin | `{kind:"cta", label:"Add credits"}`, **no href** | Point the CTA at `/checkout/credits?pack=pack10` (spec §7 emails row doesn't say) |
| `components/organisms/DemoDock.tsx:75` | Prototype dock "+5 credits" | Presenter | `adjust(+5)`, no purchase | Moves into the scenario popover (§6, PC-13). Not a buying entry |

**Missing today (spec adds):** header pill/popover "Add credits" (§5.3), popover request card (§5.9), lock dialogs (§5.5), B2 `#billing-low` `AutoReloadOffer`, B2 `#trial-ending` closed-bonus "Add credits", Paid "Set up auto-reload". There is **no** Add credits in the command palette (`CommandPalette.tsx` has no billing or credits actions). Consider adding "Add credits" and "How credits work" there; spec §5.6 doesn't mention it.

### 1b. Places that tell the user about the balance

| file:line | Surface | Audience | Shows today |
|---|---|---|---|
| `components/organisms/BalancePill.tsx:13` (mounted `AppShell.tsx:190`) | Sidebar footer "Balance" row → `/configure/billing` | **trial/payg only** (returns `null` for invoiced/YC); every role | `CreditChip`: "6 trial" when all-trial, "Pending" while approval is open, amber when `< costFor(full)` (= 2) |
| `components/organisms/wallet/WalletCard.tsx` | Get started card (pending / low / healthy, with runway) | All roles while setup is open | Big number, tokens, runway, "Add credits" (admin) |
| `components/organisms/dashboard-widgets.tsx:149-163` | `DashboardFirstRun` status line | Wallet orgs before the first own review | "You have N credits, enough for about M full reviews". Also links the **sample review** (`:179`, conflicts with PC-4) |
| `components/organisms/home/GetStarted.tsx:104,140` | Trial-granted and pending lines | Self-serve | "6 trial credits added…", "We'll email … when your 6 trial credits…" |
| `components/organisms/value/ValueStrip.tsx:120-122` | Dashboard value strip | Dashboard viewers | Credits spent + link `/configure/billing?tab=activity` (an alias of `usage`) |
| `components/run/CostSummary.tsx` (`CostSummary`, `TypeCostChip`) | Run confirm footbar | Starter | Cost in credits, `~$` value, affordability |
| `components/organisms/billing/OverviewTab.tsx:51` `BalanceHero`, `:292` `ReviewerBilling` | Billing | Admin and reviewer | Balance, "enough for N full reviews", runway bar, auto-reload chip. Reviewer gets "Ask your admin" (toast) |
| Receipts: `ReviewTable.tsx:136`, `run/RunWorkbook.tsx:481`, `InvoicesTab.tsx:65`, `OverviewTab.tsx:282`, `usage/UsageTab.tsx:139` | `openReceipt(id)` → `ReceiptDialog` (mounted only in `AppShell.tsx:212`) | Admin | Receipt dialog |

**Derivation drift (confirms §6 P0):** `BalancePill`, `WalletCard` and `BalanceHero` use `balanceGrants()` remainders. `TopUpModal`, `DemoDock:27` and `DashboardFirstRun:149` sum the raw ledger. `useBilling` uses `remainingOf`. Add `DashboardFirstRun` and `DemoDock` to the `lib/wallet-view.ts` migration list.

---

## 2. Billing today vs spec §5.8

**Route and tabs today** (`app/(shell)/configure/billing/page.tsx`). Tab state is `?tab=` via `router.replace`, with aliases `activity→usage` and `payment→settings`. Sub-route `/configure/billing/statement?month=`. Breadcrumb "Configure › Billing & credits"; tabs are not crumbs.

| Persona | Tabs today | Band actions today | Spec §5.7/§5.8 |
|---|---|---|---|
| Admin, wallet | Overview · Usage · Invoices · Settings · **Plans** (behind `org.flags.plansTab` or build notes; locked chip "Hidden · flag") | "Add credits" | Overview · Usage · Invoices · Settings · How credits work; band also gets "Prefer a monthly invoice? Talk to us" + "How credits work" links. **Plans isn't mentioned:** say whether it stays (it's the flag-gated future pricing tab) |
| Reviewer/approver, wallet | Overview · My usage | none | Overview · My usage · How credits work |
| Admin, invoiced | Usage · Invoices · Settings | **"Download statement"** → `/configure/billing/statement` | Usage · Invoices · Settings · How credits work; B2 `#billing-invoiced` shows "Export CSV". Spec drops Download statement without saying so |
| Reviewer, invoiced | **No tabs, no PageHeader**: bare `UsageTab` | none | Not specified. Add a row (suggest Usage · How credits work) |

**States today vs the §5.8 list**

| §5.8 state | Exists today? | Where / gap |
|---|---|---|
| Never used / fresh | Partial | `OverviewTab` level-1 EmptyState only when `ledger.length === 0`. With the v23 seed, fresh has a +6 trial row, so the spec's fresh hero is **new**. The empty block links the sample review (`OverviewTab.tsx:235`, PC-4 conflict) |
| Trial | Partial | Hero has no "trial" wording, bonus notice or pack row. `BonusNotice` is new |
| Healthy | Yes | `BalanceHero` + `Facts` + `UsageCard` (compact) + `BalanceCard` + Recent activity |
| Low | Partial | Only the runway bar turns `is-low` (`runwayWarn` on days, not on `LOW_BALANCE_AT`). No "Running low" title, no `AutoReloadOffer`, no illustration |
| Short (1) | No | Not distinct from low |
| Zero | No | No "Out of credits" hero or facts ("Waiting to start" needs a count of held drafts, which no store tracks) |
| Pending | Partial | Level-1 EmptyState with an "is waiting for approval" status line. No `PendingTracker` hero. "Add credits" is not locked on the page (only inside the modal) |
| Invoiced | Yes (different) | Usage-first hero exists in `UsageTab invoiced`; check copy and facts against B2. `INVOICED_CREDIT_USD` is new |
| Auto-reload on | Yes | Chip "Auto-reload on · N credits below X" in `BalanceHero` |
| Credits expiring | Yes | `ExpiryAlert` (30-day window). Copy says "Credits that expire first are used first", which already fits PC-16. `BalanceCard` breakdown has expiry dates |
| Bonus ending / closed | No | New `BonusNotice` |
| Reviewer healthy/low/zero | Partial | `ReviewerBilling` (hero, facts, breakdown, "Your recent activity"). Ask is a toast, not a request |
| Reviewer requested | No | Needs §5.9 store |
| Usage donut + by-person (PC-28) | No | `UsageTab` today = `UsageCard` (bespoke SVG bar chart `UsageChart.tsx`, group by type/person/source, daily/cumulative) + `BreakdownTable` + `LedgerSection`. Spec adds `UsageDonut` + `UsageByPerson`. **Say whether the existing bar chart, the "source" grouping and `LedgerSection` stay below or are replaced**; spec §5.8 is silent |
| How credits work tab | No | New `CreditsExplainer` |

**Settings tab** (not in §5.8 but touched by checkout): `AutoReloadSection`, `PaymentSection` + `AddCardForm`, `ContactSection`, `FinanceSection` (W-9), `AlertsSection` (`ALERT_DEFAULTS.lowBelow`), `TermsSection`. Checkout's Payment step duplicates card, billing contact, extra receipt email, PO and auto-reload. Write them through the same setters (`setPaymentMethod`, `setBillingSettings`, `setAutoReload`) so Settings and checkout never disagree. `WalletSettings` (`types/domain.types.ts:111`) already has `billingEmail` and `poNumber`. Only "also send receipts to" is new (`alertEmails` exists, but it is for alerts, so add a `receiptCc` field rather than reuse it).

**pricing.ts today:** `TRIAL_EXPIRY_DAYS`, `EARN_REWARD_CREDITS=1`, `EARN_CAP_CREDITS=3`, `SETUP_REWARD_STEPS`, `EARNED_LIFE_DAYS=90` still exist (matches spec §4 "old"). `DEFAULT_PACK_ID="pack10"`, `CUSTOM_CREDITS {1,100}`. `TopUpModal.initialChoice()` (smallest pack covering `needed`, else Custom) is worth moving into `useCheckout` for the `credits=<n>` query.

---

## 3. Layout reuse and the return path

**What exists outside the shell**

| Group / route | Chrome | Fit for checkout |
|---|---|---|
| `app/(onboarding)/layout.tsx` | `.wel`: logo top-left, centred card, footer "Secured by Realwired ID", mounts `DemoDock` | **No.** Centred single card plus footer. Checkout is a 2-column (content + sticky summary) full-width page. Reuse only the **logo bar treatment** (`.wel-top`) |
| `app/(auth)/layout.tsx` | Passthrough; pages use `KeycloakFrame` | No (Keycloak theme reference) |
| `app/bouncer/layout.tsx` | `.bx`, separate product | No |
| `app/launch`, `app/start`, `app/youconnect` | Standalone pages | No |
| Run takeover header `components/run/RunExperience.tsx:586` (`.run-head`: logo mark · title · close `IconButton`) | In-shell overlay, not a layout | **Closest pattern** for the slim focused top bar with an exit. Copy its geometry for `CheckoutShell` |
| `StepperModal` | Vertical row steps, modal | PC-8 rejects it. **No horizontal numbered stepper exists**, so `CheckoutShell`'s stepper is genuinely new (consider a molecule so onboarding's progress and future flows can share it) |

**Recommendation:** keep the spec's `app/checkout/layout.tsx` (or a `(focus)` route group if more focused flows are expected). Both sit under the same root `app/layout.tsx`, which already provides `SeedProvider`, `ToastHost` and `DensityProvider`, so stores hydrate and toasts work with no extra wiring. The checkout layout **must also mount what `AppShell` mounts that checkout needs**:
- `ReceiptDialog` (Paid → "View receipt"), or make "View receipt" route to `/configure/billing?tab=invoices&receipt=<id>`.
- `LockDialog` (pending org or reviewer landing on the URL, §5.6 errors row). Spec §5.5 only lists the AppShell and onboarding mounts.
- The prototype pill/`DemoDock` (§6 lists AppShell, onboarding and KeycloakFrame; add checkout).
- No `RunModal` and no `CheckoutLauncher` (already on the page).

**Return path with the real router**
- Moving between `(shell)` and `app/checkout` is a soft navigation under one root layout, so **Zustand stores survive** (including `run.store`, which is in memory only and not persisted). A hard reload on checkout keeps the wallet (adapter/localStorage) but **loses any open run draft**.
- `CheckoutLauncher` (in AppShell) builds `return` from `usePathname()` + `useSearchParams()` at the moment `openTopUp` fires. Encode it with `encodeURIComponent`.
- **Validate `return`**: it must start with `/`, must not start with `//`, and must not point at `/checkout`. Otherwise fall back to `/configure/billing`. This prevents an open redirect, which matters even for a prototype that gets handed off.
- Steps: `router.push` per step, so browser Back walks the steps. On Pay success, `router.replace(…step=done)` so Back can't land on Review and pay twice. "Exit checkout" = `router.push(return)`, not `router.back()`, because deep links and email CTAs have no history.
- **Routed review** (`/reviews/[id]`): `return=/reviews/<id>`. `enterReview` re-derives the spoke from `status`, so an un-started review re-opens at confirm, but the **type selection is lost** (local state in `RunConfirm`). To meet §5.5 "resumes at Start with the same selection", carry `types=` in the return URL or stash it in `run.store` before leaving.
- **Overlay run** (`RunModal`, opened from `/launchpad` or the dashboard): the review isn't created until Start (`RunModal.tsx:67-90`, `DEMO_RUN_REVIEW_ID`). `return=/launchpad`. On soft navigation, `run.store.open` is still `true`, so the overlay re-appears at confirm on return. That works by accident, so make it explicit (keep `open`, `display`, `docLabel` and `reviewTypes` in the store across checkout). §5.5's "uploaded report kept as a draft" has **no backing store today**. Either persist the run draft or create an `intake` review before routing to checkout.
- Embedded (YouConnect) mode: invoiced, no wallet, so checkout should never open. Guard it in `CheckoutLauncher`.

---

## 4. Board vs reality

| Board frame | What the board draws | Real app | Action |
|---|---|---|---|
| B1 `#credits-popover`, `#how-credits-work`, `#billing-pill`, `#get-started` (header) | `hd-end` order: **credits pill · search · bell · avatar** | `AppShell.tsx` header end: `SearchTrigger` (icon button) · bell · `UserMenu`. Start = `Breadcrumbs` | Spec §5.3 says `SearchTrigger · CreditsPill · bell · UserMenu`, which **disagrees with the board**. Pick one (board order puts the pill first) |
| Same frames (sidebar) | Start a review · Get started 2/8 · Dashboard · Reviews · Trust Center · Learning Center · Balance "4 credits" · org card | Real: `navAction` Start a review (→ `/launchpad`) · Get started n/8 (when visible) · Dashboard · Reviews · footer `BalancePill` · `OrgCard` (→ `/configure`). **Configure is reached only via the OrgCard**; AGENTS.md's "Dashboard · Reviews · Templates · Settings" nav is stale | Structure matches once `SidebarResourceLinks` lands. Board Balance reads **"4 credits"** but `BalancePill` shows **"4 trial"** when all-trial: under PC-6 drop the trial label. §5.3's BalancePill row doesn't say so |
| B1 `#credits-popover` | Popover under header pill, with View usage / Add credits | Nothing in the header. Sidebar pill links straight to Billing | New (§5.3). Note: real pill is **hidden for invoiced** orgs, but §5.3 has an invoiced pill state ("38 credits used"). Confirm the header pill shows for invoiced while the sidebar Balance stays hidden |
| B1 `#checkout-amount`, B2 `#checkout-payment`, `#checkout-review`, `#checkout-success` | Focused page: logo · 3-step stepper · Exit · sticky summary. Paid has no stepper | `TopUpModal` dialog: packs + custom, saved card / new card, "Need invoicing? Talk to us", toast with Receipt on success | New route. B2 Payment/Review summary has "Change amount" and a "Saving vs. $150" row and an illustration in the summary ("Wallet top-up: a coin going into the wallet"). **§5.6 says "Summary: icons only, no art"**, which conflicts with the B2 summary art |
| B1 `#how-credits-work` | Crumb "Configure › Billing & credits › **How credits work**"; band tabs **Usage · Invoices · Settings · How credits work** (no Overview) + Add credits | Tabs aren't crumbs; admin wallet tabs start with Overview | Treat B1 tabs as stale. Spec's Overview-first list wins. Crumb stays "Billing & credits" unless Breadcrumbs learns tabs |
| B1 `#billing-pill` (frame 21) | Banner + 3 equal cards (Balance · November so far · Runway) + activity table; tabs without Overview | Real Overview = `BalanceHero` (with runway bar) + `Facts` + compact `UsageCard` + `BalanceCard` + Recent activity | B1 frame 21 is a **pill demo, not a layout spec**. Point §5.8 at B2 frames for layout so builders don't rebuild Overview as 3 cards |
| B2 `#billing-trial`, `#billing-low`, `#billing-zero`, `#billing-expiring` | Page band: tabs + "Prefer a monthly invoice? Talk to us" + "How credits work" links; "Add credits" sits **inside the hero card**, not in the band | Real band: tabs left, "Add credits" primary right (`PageHeader actions`) | §5.8 says band = tabs · links · **Add credits primary**, but the board puts Add credits in the hero. Pick one (house pattern: `.pagehead` hosts the primary action) |
| B2 `#billing-low` | "Balance breakdown · **Used oldest first**"; "up to **3** times a month" | `BalanceCard` + `spendOrderSentence` ("Trial and earned credits are used first") | Spec already corrects to soonest-expiring (PC-16) and "2 times" (Q-E10). `spendOrderSentence` in `billing-data.ts:253` must be rewritten too; **add it to §6 P0** |
| B2 `#billing-expiring` | Banner action "Start a review"; copy "Purchased credits are used before trial credits, oldest first" | `ExpiryAlert` action "Add credits" | See §1a row 2 |
| B2 `#billing-invoiced` | Band: tabs + "Export CSV" | Band action "Download statement" | Keep statement access (Invoices rows already open it) and say so |
| B2 `#billing-usage` | Period picker + Export CSV, donut + by-person | Bar chart `UsageCard` with by/view toggles + `BreakdownTable` + `LedgerSection` | See §2 Usage row |
| B2 `#reviewer-billing` | Tabs Overview · My usage · How credits work; note field + "Ask Dana" | Overview · My usage; "Ask your admin" toast | New request flow (§5.9) |
| B2 `#admin-request` | Popover over **Dashboard**; "Team credits · 2 of 22 left" | — | New. "2 of 22" implies a denominator; PC-28 says a balance has no fixed total, so reword (e.g. "2 left · used 20 since Oct 14") |
| B2 `#start-low-balance` | Confirm as a **dialog over Reviews**, "Uses 2 credits · you have 1", Start live | Confirm is the full-page `RunConfirm` takeover (`.run`) with a sticky footbar; Start already stays clickable when short (`disabled={!canStart && !short}`) and shows the callout | Board chrome is schematic. Keep the takeover; only swap the callout for `LockDialog` |
| B2 `#trial-ending` | `BonusNotice` on Dashboard | No bonus concept in code | New |

---

## 5. Recommended spec edits

1. **§5.3 header order:** align with the board (`CreditsPill · SearchTrigger · bell · UserMenu`) or mark the board as out of date. Today they disagree.
2. **§5.3 / §5.4 BalancePill:** add "drop the `N trial` label and the `trial` tone; label is always `N credits` (PC-6)". State that the sidebar Balance stays **hidden for invoiced/YC** while the header pill shows the invoiced "used" state.
3. **§5.5 / §5.6 mounts:** `app/checkout/layout.tsx` mounts `LockDialog`, `ReceiptDialog` (or route "View receipt" to Invoices) and the prototype pill. Add these to C1's stub list.
4. **§5.6 return contract:** `return` must be a same-origin path (starts with `/`, not `//`, not `/checkout`), defaulting to `/configure/billing`. Steps use `router.push`; Paid uses `router.replace`; Exit uses `router.push(return)`. Carry `types=` (or stash in `run.store`) so a blocked Start resumes with the same selection.
5. **§5.5 "report kept as a draft":** name the mechanism. The overlay run (`RunModal`) creates nothing before Start and `run.store` isn't persisted. Either create an `intake` review before routing to checkout, or persist the run draft. Otherwise this acceptance item can't pass on reload.
6. **§5.6 `CheckoutLauncher`:** guard embedded mode and invoiced orgs; move `TopUpModal.initialChoice()` into `useCheckout`; note that `CostSummary` passes the **full cost** as `needed`, not the shortfall. Fix that at the caller or the "Add 1 credit" option prefills wrong.
7. **§5.6 summary art:** reconcile "icons only, no art" with the B2 summary illustration (drop it from the boards, or allow it).
8. **§5.8 tabs:** add a row for **invoiced reviewer** (no tabs today). Say whether **Plans** (flag-gated) stays. Say whether invoiced "Download statement" survives next to "Export CSV".
9. **§5.8 band vs hero:** decide where "Add credits" lives (band per spec, hero per B2) and fix the losing side. Name B2 as the layout source; B1 `#billing-pill` is a pill demo only.
10. **§5.8 Usage:** state the fate of `UsageCard`/`UsageChart` (bars, by-source grouping), `BreakdownTable` and `LedgerSection` once the donut lands.
11. **§5.8 expiring:** pick "Start a review" (board) or "Add credits" (code) for the `ExpiryAlert` action.
12. **§6 P0 list:** add `billing-data.ts:253 spendOrderSentence` (spend-order copy), `DashboardFirstRun` (`dashboard-widgets.tsx:149`) and `DemoDock:27` raw-ledger sums, and `runwayWarn` vs `LOW_BALANCE_AT` (Overview low tone keys off runway days, not the constant).
13. **§5.2 / §5.8 PC-4 sweep:** the sample-review links in `OverviewTab.tsx:235` and `dashboard-widgets.tsx:179` are in agents F and C files respectively. List them so PC-4 is complete.
14. **§7 emails:** give the low-balance and zero-balance "Add credits" CTAs an href to `/checkout/credits?pack=pack10` (today: no href).
15. **§8 ownership:** `components/organisms/dashboard-widgets.tsx` is owned by C. Make sure F's checkout work doesn't need it. `ValueStrip.tsx` links `?tab=activity` (alias, fine). Optional: add "Add credits" and "How credits work" to `CommandPalette` (owned by C).
16. **AGENTS.md (final step):** the "Nav = Dashboard · Reviews · Templates · Settings" line is stale (real nav = Get started · Dashboard · Reviews; Configure via OrgCard). Fix it in the §9 AGENTS update together with the `openTopUp` → checkout rule.
