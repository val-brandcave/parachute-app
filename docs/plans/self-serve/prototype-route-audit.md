# Parachute v2 prototype — onboarding/PLG structure audit

Read-only audit of `C:\Users\vvrsv\OneDrive\Desktop\parachute\app` on branch `feat/design-system-consume` (HEAD `1db63d7`), 6 Nov 2026. Purpose: plan where the self-serve onboarding, wallet, sample review, security pack and Bouncer handoff live so Diego's team can read the prototype's structure without surprises. Nothing was edited, run, installed or built.

Scope agreed with Ed on 3 Nov 2026 (see `docs/meetings/processed-calls/parachute-nov-03-2026-processed.md`, D2–D14). Commercial numbers (price, trial size, seat cut-off) are indicative and should be data, not copy.

---

## 1. Current state (factual)

### 1.1 Stack and conventions that bind the plan

- Next.js 16.2.9 App Router, React 19, TypeScript, Tailwind v4 (tokens in `src/app/globals.css`, 16,067 lines), Zustand 5, Framer Motion 12, Tabler icons via the `Icon` atom. Path alias `@/*` → `src/*`. No `middleware.ts` (checked `app/` and `src/`). The only server-side routing is `next.config.ts`: `/` → 307 `/start`.
- `@realwired/ui` 0.1.0 is consumed from `vendor/realwired-ui-0.1.0.tgz` (`package.json` `"@realwired/ui": "file:vendor/realwired-ui-0.1.0.tgz"`). Loaded in `src/app/layout.tsx` in this order: `globals.css` → `@realwired/ui/styles.css` → `@realwired/ui/themes/parachute.css` → `realwired-bridge.css` (points `--rw-font-display/--rw-font-sans` at the `next/font` variables). `<html data-brand="parachute">`.
- Rules in `AGENTS.md`: atomic folders with barrels; tokens only; `.ui-*` classes in `globals.css`, no CSS modules; portal every floating layer; global overlays mounted once in the shell and driven by a store (`RunModal`, `CommandPalette`); the data path is **Page → page hook → Zustand store → adapter → mock(localStorage) | api(stub)**; no `Date.now()` in render; light + dark; no monospace; surface taxonomy = route for places, `BottomSheet` for focused tasks on a place, `StepperModal` for linear commits.
- Memory rule (26 Aug): Ed cancelled the design-system retrofit, so `feat/design-system-consume` stays off `main`. The 4 Nov memory says onboarding should be designed with `@realwired/ui`. See §7 for the branch question.

### 1.2 Route map (every route file under `src/app`)

Legend — Shell: inside `(shell)/layout.tsx` → `AppShell` (sidebar + header). Standalone: full-viewport, no shell. Lib: imports from `@realwired/ui`.

| Route | File | Shell | Purpose | Components / stores | Lib |
|---|---|---|---|---|---|
| `/` | `next.config.ts` redirect | — | 307 → `/start` | — | — |
| `/start` | `app/start/page.tsx` | Standalone | **Demo entry fork**: "Enter from YouConnect" → `/youconnect`; "Standalone sign-in" → `session.reset()` + `/login` | `Logo`, `Icon`, `YouConnectGlyph`; `useSessionStore` | no (app `.start-*` CSS) |
| `/login` | `app/login/page.tsx` | Standalone | SSO-first card (YouConnect primary, Microsoft, generic SSO, disclosed email form). Every button → `router.push("/launchpad")`. No auth state is set. | `Logo`, `Icon`, glyphs; local state only | no (`.sso`, `.login-email-toggle`, `.field`) |
| `/launch` | `app/launch/page.tsx` | Standalone | SSO handoff interstitial YouConnect → Parachute (`.hf` bridge: peers + drifting doc chip + 3 `run-st` step rows); timers → `/launchpad` at 3.6 s | `YouConnectGlyph`, `ParachuteGlyph`, `Icon` | no |
| `/youconnect` | `app/youconnect/page.tsx` | Standalone | Mock of the uConnect request record (external product UI). "Run Parachute" → `session.setMode("embedded", {returnLabel:"YouConnect"})` + `run.openRun(DEMO_RUN_REVIEW_ID,{startAt:"confirm",source:"yc"})` + `/launch` | `useSessionStore`, `useRunStore`; `.ycm-*` CSS | no |
| `/styleguide` | `app/styleguide/page.tsx` | Standalone | Palette decision surface; flagged 🗑️ remove before handoff | static | no |
| `/launchpad` | `(shell)/launchpad/page.tsx` | Shell | Landing page after sign-in ("Start a review"): `IntakeWidget` hero (Drop / From YouConnect) → `run.openRun(DEMO_RUN_REVIEW_ID, {startAt:"confirm"})` | `IntakeWidget` (`useRunStore`, `useOrderStore.deliveries`) | no |
| `/dashboard` | `(shell)/dashboard/page.tsx` + `hooks/useDashboard.ts` | Shell | Greeting (`CURRENT_USER.firstName`), `PeriodPicker`, `StatBar` (5 tiles), `TrendChart`, `ActionNeeded`, `NewFromYouConnect`. KPIs are mock-derived from the period volume. | app `PageHeader`, app `StatBar`, `dashboard-widgets`, `DashboardSkeleton`; `useReviewsStore` | no |
| `/reviews` | `(shell)/reviews/page.tsx` + `hooks/useReviewQueue.ts` | Shell | Team queue: lifecycle tabs, search, Filters modal, `OrderButton`, `ReviewTable` (derived state via `lib/review-lifecycle.ts`) | `ReviewTable`, `QueueFilters`, `ActiveFilters`; `useReviewsStore`, `useUsersStore` | **yes**: `PageHeader`, `PageBody`, `SearchInput`, `Tabs` |
| `/reviews/[id]` | `(shell)/reviews/[id]/page.tsx` | Shell route, but portals a `.run` takeover to `document.body` | The review IS the run wizard: `runEntry(review)` → spoke (triage / confirm / progress / workbook) + readOnly for completed; renders `RunExperience` | `useReview`, `useRunStore.enterReview`, `useReviewsStore.updateReview`, `beginRunInPlace` | no |
| `/configure` | `(shell)/configure/page.tsx` | Shell | Hub of 5 cards: Organization · Review defaults · Workbook layouts · Response library · Compliance checklists (`.cfg-card`) | `Icon`, `Link` | no (library `HubCard` exists but is unused) |
| `/configure/organization` | `(shell)/configure/organization/page.tsx` | Shell | Tabs **Identity · Branding · Members · Billing** (`pagehead` + app `Tabs`). Identity = logo (`AvatarUpload` → `identity.store`), name inputs (static), bank policy (`org.store`). | `MembersPanel`, `BrandingPanel`, `BillingPanel`; `useIdentityStore`, `useOrgStore` | no |
| `/configure/defaults` | `(shell)/configure/defaults/page.tsx` | Shell | Tabs Intake / Deliverables; default checklist (bound to `templates.store`), SLA, quality gate, confidence | `useTemplatesStore` | no |
| `/configure/workbook-layouts` | `.../workbook-layouts/page.tsx` + `hooks/useWorkbookLayouts.ts` | Shell | Versioned families table | `FamilyTable`; `useTemplatesStore` | no |
| `/configure/workbook-layouts/view` | `.../view/page.tsx` | Shell | Single layout viewer (`?v=`) | app `PageHeader` | no |
| `/configure/responses` | `.../responses/page.tsx` + `hooks/useResponseLibrary.ts` | Shell | Response library table + modal editor | `ResponseTable`, `ResponseModal` | no |
| `/configure/checklists` | `.../checklists/page.tsx` + hooks | Shell | Checklist families + upload dropzone → `ChecklistUploadWizard` | `FamilyTable` | no |
| `/configure/checklists/[id]` | `.../checklists/[id]/page.tsx` | Shell | Mapper (`?v=`) | `ChecklistItemRow`, `ChecklistItemModal`, `TemplateHealthRail` | no |
| `/profile` | `(shell)/profile/page.tsx` | Shell | Tabs Account · Preferences (theme/density live) · Notifications (local state) | `AvatarUpload`, `SegmentedControl`; `usePrefsStore`, `useIdentityStore` | no |
| `/components` | `(shell)/components/page.tsx` | Shell | Dev showcase of app atoms/molecules | — | no |

Not present despite mentions in `AGENTS.md`: `/reviews/[id]/triage` has no route file; triage is the `triage` spoke inside `RunExperience`. `/order`, `/settings`, `/templates` no longer exist (renamed to `/configure/*` on 13 Jul).

Shell wiring (`src/components/templates/AppShell.tsx`): library `AppShell` with `nav = [Dashboard, Reviews]`, `navAction` = `SidebarAction` "Start a review" → `/launchpad`, `sidebarFooter = <OrgCard>` (→ `/configure`), header `start = <Breadcrumbs>`, `end = SearchTrigger + bell IconButton + UserMenu`; `chromeless={mode === "embedded"}`; mounts `CommandPalette` and `RunModal` once. `⌘K` toggles the palette.

### 1.3 Session / entry model

- `src/store/session.store.ts` — `mode: "full" | "embedded"`, `returnLabel`, `setMode`, `reset`. That is the whole session: **no user id, no org id, no auth state, no role**. In-memory only (lost on reload).
- Entry handoffs:
  - `/start` → Standalone: `reset()` → `/login` → any button → `/launchpad` (mode stays `full`).
  - `/start` → Embedded: `/youconnect` → "Run Parachute": `setMode("embedded")`, `openRun(DEMO_RUN_REVIEW_ID …)`, `/launch` → 3.6 s → `/launchpad`, where `RunModal` is already open inside a chromeless shell. Closing/signing in embedded mode → `resetSession()` + `/youconnect` (`RunModal.onExit`, `RunExperience` sealedNote).
  - `UserMenu` "Sign out" → `/login`.
- `RunModal.onStart` (standalone): `addReview({... assigneeId: CURRENT_USER.id, status:"running", slaDueAt: now + 10 d})` → `close()` → `/reviews/{id}`. The routed page's `onStart` (`reviews/[id]/page.tsx`) instead `updateReview` + `beginRunInPlace`. **These two `onStart`s are the two places a credit debit must happen.**
- `RunConfirm` (`components/run/RunConfirm.tsx`) ends with a sticky `.run-cf-footbar` → `.run-cf-footbar-inner` holding Cancel (ghost) + "Start review" (primary, `iconLeft="parachute"`, `disabled={!canStart}`). `canStart = selected.length > 0 && (!showIdentity || address)`. Source framing: `yc` vs `drop`.

### 1.4 Signed-in user and org

- `src/lib/current-user.ts` exports two **consts**: `CURRENT_USER` (`user-001` Val Vinnakota, email, initials, designation, signatureName) and `CURRENT_ORG` (`Meridian Trust Bank, N.A.`, kind "Organization", initials "MT"). Not a store.
- 16 files read them (counts): `RunExperience` 9, `profile/page` 6, `OrgCard` 4, `WorkbookPreview` 3, `UserMenu` 3, `configure/organization/page` 3, `order.store` 2, `RunSign` 2, `RunModal` 2, `RunAttestationPreview` 2, `MembersPanel` 2, `BrandingPanel` 2, `QueueFilters` 2, `useReviewQueue` 2, `dashboard/page` 2. `OrgCard` and `UserMenu` already accept `name/sub/initials` / `name/email` props with the consts as defaults, so they are the easiest to re-point.
- `seedOrgs` (`src/data/seed/orgs.seed.ts`): one org `org-001` with `name, brandPrimary, brandAccent, brandFont`. `Org` type (`types/domain.types.ts`) has nothing about plan, size, approval or kind.
- `src/store/org.store.ts` holds only `bankPolicy` and **persists to its own localStorage key `parachute:org:bank-policy`, bypassing the adapter** (a documented F-123 shortcut; worth not copying for the wallet).
- `src/store/identity.store.ts` = in-memory avatars (user/org).

### 1.5 Roles model

`UserRole = "owner" | "admin" | "reviewer" | "viewer"` (`types/domain.types.ts`), `MemberStatus = active | invited | deactivated`. `src/lib/member-roles.ts` has `ROLE_ORDER`, `ASSIGNABLE_ROLES` (admin/reviewer/viewer), `ROLE_META` (label/desc/tone), `STATUS_META`. `seedUsers` = 7 members of org-001 (owner Val, admin Jordan Chen, reviewers Priya / Marcus / Samir(invited) / Elena(deactivated), viewer Dana). No `orgId` on `User`. **Production (CIM) roles are reviewer / approver / org_admin** — the prototype has no `approver` and no `org_admin`; "owner" and "viewer" do not exist in production.

### 1.6 Billing and members today

- Billing = `components/organisms/BillingPanel.tsx`, rendered as the Billing tab of `/configure/organization`. Static: "Enterprise $1,200/month", 6 of 8 seats bar, Visa •••• 4242, 6 paid invoices with no-op buttons. CSS `.bill-*`.
- Members = `components/organisms/MembersPanel.tsx` + `InviteMemberModal.tsx` on the Members tab; backed by `useUsersStore` (`inviteMember / changeRole / setStatus / removeMember`, in-memory after first load). In production members live in Bouncer (RWT-1028).

### 1.7 Data layer

```
src/data/collections.ts     STORAGE_PREFIX "parachute"; Collections: users, orgs, reviews, findings,
                            attestations, yc_deliveries, responseTemplates, checklistTemplates,
                            workbookLayouts, workbookExhibits
src/data/adapters/types.ts  DataAdapter: getAll/getById/getWhere/create/createMany/update/remove/seed/clear
src/data/adapters/index.ts  adapter = NEXT_PUBLIC_DATA_SOURCE === "api" ? apiAdapter : mockAdapter
src/data/adapters/mock-adapter.ts  localStorage "<prefix>:<collection>"; SEED_VERSION "v15";
                            seed() reseeds when the stamp differs; clear() removes EVERY key
                            starting with "parachute" (so it also wipes parachute:density /
                            parachute:theme / parachute:org:bank-policy)
src/data/adapters/api-adapter.ts   stub, every method throws
src/data/seed/index.ts      seedAll: users, orgs, reviews, findings, attestations, yc_deliveries,
                            responseTemplates, checklistTemplates, workbookLayouts, workbookExhibits
src/components/providers/SeedProvider.tsx  calls adapter.seed() client-side before rendering
```

Stores (`src/store/`): `reviews.store` (fetch/add/update via adapter), `users.store`, `templates.store`, `workspace.store` (findings/workbook, reuses `review-001` content for any review without its own — `DEMO_CONTENT_ID`), `admin.store` (attestations), `order.store` (Order stepper draft + YC inbox), `run.store` (spoke machine, `DEMO_RUN_REVIEW_ID = "review-001"`, `beginRunInPlace`), `session.store`, `prefs.store` (theme/density/navCollapsed, localStorage), `org.store` (bank policy), `identity.store`. Barrel `store/index.ts`.

Seeded reviews: review-001/002/004 in_review, 003/007 running, 005 completed, 008 autorejected, 009–012 intake (YC). All belong implicitly to the one org.

### 1.8 Command palette and breadcrumbs

`CommandPalette.tsx` `NAV`: Start a review `/launchpad`, Dashboard, Reviews, Configure, Workbook layouts, Response library, Org workbook layout (`/configure/workbook-layouts/view`), Compliance checklists, Review defaults, Organization; plus review search and one action (Start a review). `Breadcrumbs.tsx` resolves labels from `TOP_LABELS` (launchpad/dashboard/reviews/configure/profile/components/styleguide) and `CONFIG_SECTIONS` (organization/defaults/workbook-layouts/responses/checklists). **Both need entries for every new route.**

### 1.9 Prefs / theme

`prefs.store.ts`: `density`, `theme` (light/dark/system → `resolveTheme`), `navCollapsed`; `DensityProvider` applies `data-density` / `data-theme` on `<html>`. `UserMenu` has the theme segment; `/profile` Preferences tab too.

### 1.10 `@realwired/ui` — what the vendored build actually exports

Vendored 0.1.0 (`node_modules/@realwired/ui/dist/components/*/index.d.ts`):
- atoms: Avatar, Button, Card(+Header/Title/Description), Checkbox, Chip (tones info/accent/danger/neutral/success/warning/critical/muted, `dot`), Divider, Icon, IconButton, Input, Kbd, Skeleton, Spinner, Switch, Tooltip
- molecules: ActionMenu, Breadcrumbs, FileRow, HubCard (icon/title/description/tags/href), SearchInput, SectionCard (title/description/action), SegmentedControl, StatCard (label/value/caption/icon/delta), StatusPill, Tabs
- feedback: EmptyState (icon/title/description/action/secondaryAction), ErrorState, LoadingOverlay, LoadingRegion, PageSkeleton, ProgressStages (stages[{id,label,detail,status,progress}])
- organisms: AppHeader, AppShell (`sidebarFooter`, `navAction`, `chromeless`, `collapsed`), DataTable (tanstack), LinkContext, nav helpers, PageHeader/PageBody, Sidebar, SidebarAction, SidebarNav, StatBar, TableSkeleton

**Not in the vendored build** but present in the current design-system checkout `D:\worktrees\ds-now\packages\ui\src\components` (still versioned 0.1.0): `Callout` (tones info/warning/danger/success/accent, `action`, `onDismiss`), `HandoffBridge` (`from/to: {mark,name}`, `arrived`, `payloadIcon`), `OptionCard` (radio/checkbox, description, icon, soon, note, meta), `Disclosure`, `CountPill`, `CoverageBar`, `StepRail`, `StepLine`, `TaskFlow`, `Dropzone`, `UserMenu`, `DashboardGrid`, `SettingsShell`, overlays `Dialog / AlertDialog / Sheet / Toast / Popover`, and the `widgets/*` chart set (`StatViz`, `BarViz`, `DonutViz`, `WidgetFrame`…). Using any of these in the prototype means re-packing the tarball per `vendor/README.md` ("Refreshing it during development") — a Phase 0 decision (§6).

### 1.11 Compact tree of `src/`

```
src/
  app/
    layout.tsx (fonts, DS css, SeedProvider, DensityProvider)   globals.css   realwired-bridge.css
    start/  login/  launch/  youconnect/  styleguide/           ← standalone
    (shell)/layout.tsx → AppShell
      launchpad/  dashboard/{page,hooks/useDashboard}  reviews/{page,hooks,[id]/page}
      configure/{page, organization, defaults, workbook-layouts(+view), responses, checklists(+[id]), */hooks}
      profile/  components/
  components/
    atoms/ (Button Chip Icon Input Modal ConfirmDialog Tooltip Switch Skeleton primitives BrandGlyph …)
    molecules/ (Tabs SegmentedControl StatCard Breadcrumbs ActionMenu PeriodPicker QueueFilters PipelineTracker AvatarUpload …)
    organisms/ (OrgCard UserMenu CommandPalette SearchTrigger StatBar ReviewTable IntakeWidget dashboard-widgets
                MembersPanel InviteMemberModal BrandingPanel BillingPanel StepperModal BottomSheet OrderButton Skeletons)
    templates/ (AppShell PageHeader FamilyTable ChecklistUploadWizard ResponseModal …)
    run/ (RunModal RunExperience RunConfirm RunTriage RunWorkbook RunSign RunCustomize SourceDoc RunAdminProgress …)
    review/ (WorkbookInline WorkbookPreview AttestationDocInline …)
    providers/ (SeedProvider DensityProvider)   shell/PageTransition.tsx   Logo.tsx   Stub.tsx
  data/ collections.ts  adapters/{types,index,mock-adapter,api-adapter}  seed/*.seed.ts  appraisal-doc.ts  source-pages.ts
  lib/ current-user.ts member-roles.ts review-lifecycle.ts template-versions.ts workbook*.ts tokens.ts utils.ts
  store/ index.ts session reviews users templates workspace admin order run prefs org identity useReview
  types/ common.types.ts domain.types.ts index.ts
```

---

## 2. Proposed route map for the new flows

Principles: keep `(shell)` untouched for signed-in pages; put everything pre-session in new standalone route groups; keep the "mock external product" pattern already used by `/youconnect` for Keycloak and Bouncer; derive first-run state from org data, not from a separate dashboard route; mount global money dialogs the way `RunModal` is mounted.

### 2.1 Mock Keycloak (CIM) screens — `src/app/(auth)/auth/*`

- New route group `(auth)` with `layout.tsx` rendering a `KeycloakFrame` template (standalone, same calm canvas as `/start` and `/login`, Parachute-themed Keycloak card, a small persistent "Keycloak theme reference — rendered by CIM in production (RWT-1061)" tag so no engineer mistakes it for a Parachute-owned form).
- Routes: `/auth/sign-in`, `/auth/create-account`, `/auth/verify` (email verification sent / enter code), `/auth/reset`, `/auth/mfa`. Each is a single card; navigation between them is plain links, exactly as Keycloak pages link.
- `/login`: keep the file but turn it into a redirect to `/auth/sign-in` (or a `next.config.ts` redirect) so existing links (`UserMenu` sign-out, `/start`) keep working. Alternative — keep `/login` as the SSO-first Parachute card and only add the Keycloak set — rejected: RWT-1130 removed Parachute's own login, so showing two sign-ins would mislead the devs.
- Sign-in submit does not validate credentials; it calls `applyPersona()` (§4) for the account typed/picked and routes to that persona's first screen. Create-account → `/auth/verify` → `/welcome`.

### 2.2 Onboarding (Parachute-owned, after the token) — `src/app/(onboarding)/welcome/*`

Standalone (no shell), same canvas, a slim step line at the top (`ProgressStages` from the library, or `StepLine` once the tarball is refreshed).

| Route | Purpose |
|---|---|
| `/welcome` | Org setup form, one page: org name · bank or appraisal firm (`OptionCard` ×2) · reviewers 1 / 2–10 / 11+ · reports a month <50 / 50–200 / 200+ · "How should we bill you?" (card now / invoice later — only shown when the two bands stay small). Continue → routing. |
| `/welcome/path` | Routing outcome, never blocking: **Start with N trial credits** (primary when ≤10 reviewers and <200/month) and **Talk to us** (always present; primary when 11+ or 200+; captures a note, shows "we'll call you", then still lets them continue to the trial). Copy variables come from `org.store` thresholds. |
| `/welcome/pending` | Waiting state if staff approval is kept (RWT-1031): "Your workspace is being reviewed" with what they can already do (download the security pack, open the sample review read-only, watch the 3 videos). A demo-only "Approve now" control in the persona dock advances it. |
| `/welcome/ready` | "You're set — N credits on your wallet" + the two first moves: Open your first-run Home → `/dashboard`; Try the sample review → `/reviews/review-sample`. |

Alternative `/onboarding/*` — same thing with a longer word; `/welcome` matches Cody's "Welcome" step and reads well in a browser bar. Why not a `StepperModal`? It is a modal that must mount inside a page; onboarding has no host page yet, and deep-linking to `/welcome/pending` from an e-mail is a real need.

### 2.3 First-run Home vs populated dashboard — stay on `/dashboard`

- `useDashboard` gains `orgStage` derived from stores: `new` (no non-sample review has completed and setup not dismissed) → render `FirstRunHome`; `active` → the current period-scoped dashboard. No new route; the devs keep one Home.
- `FirstRunHome` = greeting/congrats line, `SetupChecklist` (two short lists: "Set up your workspace" and "Learn the review", each step a row with verified state, credit reward, and a link into the existing place that completes it — Branding tab, Workbook layouts, Compliance checklists, Members/Bouncer, Security pack, Sample review), a `WalletCard` (balance, "1 credit = 1 review type"), the `SecurityPackCard`, a "Watch / read" row (3 video stubs + PDF guide stub), and the `ValueDashboardPlaceholder` tile (§2.8).
- Dock on other pages: when `orgStage === "new"` and not dismissed, `AppShell` passes a compact `SetupDock` into `sidebarFooter` above `OrgCard` (collapsed rail → a `CountPill`-style ring with the remaining count; expanded → "3 of 7 done · +3 credits to earn" with a link to `/dashboard`). Dismiss = `onboarding.store.dismissDock()`; the full checklist stays on Home until complete.
- Post-sign-in landing: today `/login` → `/launchpad`. New orgs should land on `/dashboard` (first-run Home); returning users keep `/launchpad`. Implement in `applyPersona` / sign-in submit as `entryRoute`, not in the shell.

### 2.4 Sample review — a seeded review at `/reviews/review-sample`

- `reviews.seed.ts` gains `review-sample` (fictional "12 Harbor View Lane, Example Bank, LN-SAMPLE", `sample: true`, status `in_review`, both types, assigned to the signed-in user). Because `workspace.store` and `admin.store` fall back to `review-001` content for any review without its own, the sample is fully clickable at zero content cost.
- Banner: `RunExperience` renders a `Callout` (tone accent) under `.run-head` when `review.sample`: "Sample review — a fictional appraisal so you can see a finished workbook. No credits are used." Queue row gets a `Chip` "Sample" (from `ReviewTable` via `review-columns.ts`), and `lifecycle`/StatBar counts exclude samples (`review-lifecycle.ts` helpers accept a filter; one line).
- Start/Sign on a sample never debits; sign completes normally so the user sees the sealed state.

### 2.5 Wallet and billing — new `/configure/billing` (recommended)

- A new Configure card "Credits & billing" → `/configure/billing`, tabs **Wallet · Activity · Payment · Plans**(hidden unless `org.flags.plansTab`). Replace the static `BillingPanel` on `/configure/organization` with a one-line pointer ("Billing moved → Credits & billing"), or just remove the Billing tab. Members tab stays under Organization but becomes read-only with a "Manage members in Bouncer →" action (§2.7).
- Why its own route rather than the Organization tab: org_admin-only surface with its own global dialogs; the Jul 14 "Members & billing" block splits naturally once members leave for Bouncer; a wallet balance is something people deep-link to from a low-balance e-mail.
- Wallet tab: balance (credits and ≈$), cost table (Technical 1 · Administrative 1 · both 2; from `wallet.store.pricing`), packs 5/10/20 (`OptionCard`), auto-reload opt-in (`Switch` + threshold), trial/earned summary. Activity tab: `DataTable` of `CreditLedgerEntry` (date · what · loan # · credits ± · $ · receipt). Payment tab: card on file / invoice-direct / ACH (mock). Plans tab: subscription variants, flag-gated.
- Global dialogs mounted once in `AppShell` next to `RunModal`, driven by `wallet.store`: `TopUpModal` (`topUpOpen`, packs + auto-reload + mock pay; reviewer sees the "Ask your admin" variant), `ReceiptDialog` (`receiptId`). Opening from anywhere = `useWalletStore.getState().openTopUp({reason:"low_balance", needed: 2})`.
- Reviewer / approver: wallet read-only; buy buttons replaced by "Ask your org admin" (shows admin names from `users.store`).

### 2.6 Cost at Start — inside the existing `RunConfirm` footbar

- Left side of `.run-cf-footbar-inner` gets a `CostLine` molecule: "2 credits · ≈$300 · 5 left after" that recomputes from `selected` types. Embedded/YC sessions (`session.mode === "embedded"` or org `billing === "invoiced"`) show "Billed through YouConnect / monthly invoice" instead.
- Blocked state when `balance < cost`: `canStart` also requires `wallet.canAfford(cost)` (sample reviews and invoiced orgs bypass); the footbar shows a `Callout` (warning) "You need 2 credits, you have 1" with inline **Add credits** (org_admin → `openTopUp`) or **Ask your admin** (reviewer). After a successful mock top-up the Callout clears and Start enables without leaving the gate.
- Debit at the two `onStart`s (§1.3): `wallet.debitForReview({reviewId, types, loanNo})` → ledger entry `kind:"debit"`. Re-scans after send-back are free (per Ed) — model as a `rescan` entry with 0 credits so it appears in Activity.

### 2.7 Invite team → Bouncer bridge

- `/launch/bouncer` (sibling of the existing `/launch` page, standalone): the same `.hf` bridge with Parachute → Bouncer marks (`HandoffBridge` once vendored; otherwise reuse `/launch`'s markup via a shared `BridgeScreen` template extracted from `launch/page.tsx`), then routes to `/bouncer`.
- `/bouncer` — a mock of the Bouncer customer-area invite screen, in the `/youconnect` style (clearly another product's UI; "Return to Parachute" → `/dashboard`). Inviting there marks the setup step done through a tiny `window.postMessage`-free shortcut: the mock page calls `useUsersStore.inviteMember` + `onboarding.store.complete("invite")` directly (prototype-only).
- `MembersPanel` keeps its table but drops Invite/role mutations behind a flag `MEMBERS_IN_BOUNCER` (default true): header action becomes "Manage in Bouncer →" (`/launch/bouncer`). `InviteMemberModal` stays in the repo for the YC-era path.

### 2.8 Security pack

- New Configure card "Security & IT pack" → `/configure/security`: three placeholder documents (`FileRow`: Architecture overview · Data handling · Security white paper, with "draft" chips and a note that Ed supplies content), "Download all (zip)" stub, **Send to your IT team** (`SendToItModal`: emails + message, marks `securityPackSentAt`). Also a `SecurityPackCard` on first-run Home and a link on `/welcome/pending`.
- Why a route rather than an Organization tab: different audience (IT, not the org admin's identity settings), linked from three places, and the "Send to IT" action earns a credit.

### 2.9 Value dashboard placeholder

No route. `ValueDashboardPlaceholder` organism on the populated `/dashboard` (above `TrendChart`): three `StatCard`s (hours saved · maths checks run · issues caught) rendered as skeleton/`EmptyState` "Arrives with engine v2" until `NEXT_PUBLIC_ENGINE_V2=1`, then fed by a `value.seed.ts` stub shaped like whatever JSON Ed sends.

### 2.10 Final route table

| Route | Shell / standalone | Owner (prod) | Who sees it | New / existing |
|---|---|---|---|---|
| `/` → `/start` | redirect | prototype | everyone (demo) | existing |
| `/start` | standalone | prototype only | demo users; becomes the **Demo personas** launcher | existing, extended |
| `/demo/[persona]` | standalone (redirecting) | prototype only | deep links | new |
| `/auth/sign-in` | standalone `(auth)` | **Keycloak** (CIM) | anyone | new (replaces `/login` body) |
| `/auth/create-account` | standalone `(auth)` | Keycloak | prospect | new |
| `/auth/verify` | standalone `(auth)` | Keycloak | prospect | new |
| `/auth/reset` | standalone `(auth)` | Keycloak | any user | new |
| `/auth/mfa` | standalone `(auth)` | Keycloak | any user | new |
| `/login` | redirect → `/auth/sign-in` | — | — | existing, becomes redirect |
| `/welcome` | standalone `(onboarding)` | **Parachute** | prospect (first user = org_admin) | new |
| `/welcome/path` | standalone | Parachute | prospect | new |
| `/welcome/pending` | standalone | Parachute (approval in Bouncer staff area) | prospect awaiting approval | new |
| `/welcome/ready` | standalone | Parachute | new org_admin | new |
| `/launch` | standalone | Parachute (SSO interstitial) | YC users | existing |
| `/launch/bouncer` | standalone | Parachute → Bouncer handoff | org_admin | new |
| `/bouncer` | standalone mock | **Bouncer** | org_admin | new (mock) |
| `/youconnect` | standalone mock | YouConnect | YC users | existing |
| `/launchpad` | shell | Parachute | returning reviewers/admins | existing |
| `/dashboard` | shell | Parachute | all roles; first-run Home for `orgStage === "new"` | existing, branched |
| `/reviews` | shell | Parachute | all roles | existing (Sample chip) |
| `/reviews/[id]` | shell (portaled takeover) | Parachute | all roles; `/reviews/review-sample` = sample | existing (cost footbar, sample banner) |
| `/configure` | shell | Parachute | org_admin (others see fewer cards) | existing (+2 cards) |
| `/configure/organization` | shell | Parachute (Members → Bouncer) | org_admin | existing (Billing tab removed, Members read-only) |
| `/configure/billing` | shell | Parachute | org_admin (read-only for others) | new |
| `/configure/security` | shell | Parachute | org_admin, approver | new |
| `/configure/defaults`, `/workbook-layouts(+/view)`, `/responses`, `/checklists(+/[id])` | shell | Parachute | org_admin/approver (reviewers read) | existing |
| `/profile` | shell | Parachute | all | existing |
| `/components`, `/styleguide` | dev | — | devs | existing (styleguide still 🗑️) |

Nav: `AppShell` NAV stays `Dashboard · Reviews`; `OrgCard` → `/configure` unchanged. Add `/configure/billing` and `/configure/security` to `CommandPalette.NAV`, `Breadcrumbs.CONFIG_SECTIONS`, and `TOP_LABELS` for `welcome`, `auth`, `bouncer`, `demo`.

---

## 3. State and data plan

### 3.1 New domain types (`src/types/domain.types.ts`, additive)

```ts
export type OrgKind = "bank" | "appraisal_firm";
export type TeamBand = "1" | "2-10" | "11+";
export type VolumeBand = "lt50" | "50-200" | "200+";
export type BillingModel = "trial" | "payg" | "invoiced";      // invoiced = YC/enterprise, no wallet
export type ApprovalState = "none" | "pending" | "approved";   // "none" when the gate is off
export interface OrgProfile { kind: OrgKind; teamBand: TeamBand; volumeBand: VolumeBand;
  salesRequested?: boolean; salesNote?: string; }
export interface OrgFlags { plansTab?: boolean; membersInBouncer?: boolean; approvalGate?: boolean; }
export interface Org extends BaseEntity {               // existing fields kept
  name: string; brandPrimary: string; brandAccent: string; brandFont: string;
  profile?: OrgProfile; billing?: BillingModel; approval?: ApprovalState; flags?: OrgFlags;
  securityPackSentAt?: Timestamp; onboardedAt?: Timestamp; }

export type LedgerKind = "trial_grant" | "earned" | "purchase" | "debit" | "rescan" | "refund" | "adjustment";
export interface CreditLedgerEntry extends BaseEntity { orgId: UUID; kind: LedgerKind; credits: number; // signed
  amountUsd?: number; reviewId?: UUID; loanNo?: string; reviewTypes?: ReviewType[];
  setupStepId?: SetupStepId; packId?: CreditPackId; receiptId?: string; actorId: UUID; note?: string; }
export type CreditPackId = "pack5" | "pack10" | "pack20";
export interface WalletSettings { orgId: UUID; autoReload: boolean; reloadPackId: CreditPackId;
  reloadBelow: number; paymentMethod: "card" | "invoice" | "ach" | null; cardLast4?: string; }

export type SetupStepId = "branding" | "layout" | "checklist" | "invite" | "security_pack"
  | "sample_review" | "first_review" | "tutorial";
export interface SetupProgress { orgId: UUID; completed: Partial<Record<SetupStepId, Timestamp>>;
  dockDismissedAt?: Timestamp; homeDismissedAt?: Timestamp; }

export type UserRole = "org_admin" | "approver" | "reviewer";   // see 3.4
export interface User { /* existing */ orgId: UUID; }
export interface Review { /* existing */ sample?: boolean; orgId?: UUID; }
```

Wallet **balance is derived** (sum of ledger credits), never stored — same rule as the queue's derived state. Pricing (`1 credit ≈ $150`, pack prices, trial grant size, reward per step) lives in one constants file `src/lib/pricing.ts` so every number Ed may change is data.

### 3.2 Collections and seeds

- `collections.ts` + `credit_ledger`, `wallet_settings`, `setup_progress`. Bump `SEED_VERSION` to `v16`.
- Seeds: `orgs.seed.ts` grows to the demo orgs below; `users.seed.ts` gets `orgId` on every user plus the new personas; `credit-ledger.seed.ts`, `wallet-settings.seed.ts`, `setup-progress.seed.ts`; `reviews.seed.ts` gets `orgId` and `review-sample`. `seedAll` adds the three new collections after users/orgs.
- Demo orgs (`orgs.seed.ts`): `org-001` Meridian Trust (returning, `billing:"invoiced"` via YC, approved) · `org-trial` Harbor Point Appraisal LLC (firm, 2–10, <50, `trial`, 4 credits left) · `org-payg-low` Cedar Ridge Community Bank (bank, 2–10, 50–200, `payg`, 1 credit, auto-reload off) · `org-pending` Lakeside Valuation (firm, 1, <50, `trial`, `approval:"pending"`) · `org-enterprise` Meridian via YouConnect is `org-001` itself · `org-new` is **not seeded** — created by `/welcome` at runtime (so "brand-new prospect" is a real create, demoing the store path).

### 3.3 New stores (all through the adapter)

| Store | State | Actions | Used by |
|---|---|---|---|
| `wallet.store.ts` | `ledger[]`, `settings`, `topUpOpen` + `topUpReason`, `receiptId` | `fetchWallet(orgId)`, `balance()` (derived), `cost(types)`, `canAfford`, `debitForReview`, `grantTrial`, `award(stepId)` (idempotent per step), `purchase(packId)`, `setAutoReload`, `openTopUp/closeTopUp`, `openReceipt` | billing page hook, `RunConfirm` footbar, `TopUpModal`, `FirstRunHome` |
| `onboarding.store.ts` | `progress` (`SetupProgress`), derived `steps[]` (id, label, done, reward, href) | `fetchProgress(orgId)`, `complete(stepId)` (also calls `wallet.award`), `dismissDock`, `dismissHome`, `verify()` (re-derives steps like "branding" from `identity`/`templates` stores so a step a user did organically still counts) | dashboard hook, `SetupDock`, `/welcome/ready`, the places that complete steps |
| `org.store.ts` (extend) | `org: Org \| null` (from adapter) + existing `bankPolicy` | `fetchOrg(orgId)`, `createOrg(profile)` (from `/welcome`), `patchOrg`, `requestSales`, `approve()` (demo), `setFlag` | `/welcome/*`, `OrgCard`, billing, gates |
| `session.store.ts` (extend) | + `userId`, `orgId`, `role`, `auth: "anonymous" \| "verified" \| "signed_in"` | `signIn({userId, orgId})`, `signOut()`; `reset` keeps mode semantics | `useCurrentUser`, guards |
| `demo.store.ts` (prototype-only) | `personaId`, `dockOpen` | `apply(personaId)`, `resetOrg(orgId)`, `toggleDock` | `/start`, `/demo/[persona]`, `UserMenu` |

Page hooks: `useBilling()` under `(shell)/configure/billing/hooks/`, `useSecurityPack()`, `useWelcome()` under `(onboarding)/welcome/hooks/`, and `useDashboard` extended with `orgStage` + `setupSteps`. Pages never import the adapter (house rule).

### 3.4 Existing code that must change (kept minimal)

1. `src/lib/current-user.ts` — keep the exported consts as **fallback defaults** and add `getCurrentUser()` / `getCurrentOrg()` (read `session.store` + `users`/`org` stores via `getState()`) and a `useCurrentUser()` hook. Migrate the 16 call sites over time; the four that matter for demos are `OrgCard`, `UserMenu`, `dashboard/page` (greeting) and `RunModal`/`order.store` (`assigneeId`). The rest can stay on the const until a persona that signs a workbook needs their own name (`RunSign`, `RunExperience`).
2. `types/domain.types.ts` `UserRole` → `org_admin | approver | reviewer`; `lib/member-roles.ts` `ROLE_ORDER/ASSIGNABLE_ROLES/ROLE_META` updated (org_admin: "Manages the workspace, billing and members"; approver: "Signs off reviews"; reviewer: "Performs reviews"). Seeds remap owner/admin → org_admin, viewer → reviewer (or drop Dana). `MembersPanel` owner lock → "first org_admin" lock. This is the one breaking change; do it in Phase 0 so the devs never see the prototype-only roles beside production ones.
3. `Review` + `sample?`/`orgId?`; `review-lifecycle.ts` nothing structural — add `isSample(r)` and filter samples out of counts in `useReviewQueue`/`useDashboard`.
4. `RunConfirm.tsx` footbar (cost line + blocked callout), `RunModal.onStart` and `reviews/[id]/page.tsx` `onStart` (debit), `RunExperience` head (sample banner).
5. `AppShell.tsx`: mount `TopUpModal` + `ReceiptDialog`; `sidebarFooter` → `<>{dock}<OrgCard/></>` when first-run.
6. `configure/page.tsx` CARDS +2; `configure/organization/page.tsx` drop Billing tab; `CommandPalette.NAV`, `Breadcrumbs` maps.
7. `mock-adapter.ts` `SEED_VERSION` v16; `collections.ts`; `seed/index.ts`.
8. `next.config.ts`: `/login` → `/auth/sign-in` redirect (optional; a page-level redirect also works).

### 3.5 Things that are risky for the dev team's reading of the repo

- `org.store` bypasses the adapter for `bankPolicy` (own localStorage key). Do not copy that pattern for the wallet; put ledger/settings/progress in collections so the "flip to API" story stays true.
- `mock-adapter.clear()` wipes every `parachute*` key including prefs. A "reset demo org" must not call `seed(true)`; it should re-seed only that org's rows (§4.4).
- Prices/trial/thresholds must be data (`lib/pricing.ts`, `org.flags`), because the numbers are unconfirmed (D5, D6, D3).
- Label the Keycloak and Bouncer screens as mocks of other products in the file header and on-screen, as `/youconnect` already does, so nobody builds them in Parachute.
- Keep the persona switcher in files named `demo*` with one env flag (§4.5) so it can be deleted in one commit.

---

## 4. Demo-ability via fake credentials (persona switcher)

### 4.1 Persona list — `src/data/seed/demo-personas.seed.ts`

| id | Label | user / org | auth / org state | Lands on | Shows |
|---|---|---|---|---|---|
| `prospect` | Brand-new prospect | no user yet (`/auth/create-account` pre-filled "alex@harborpointappraisal.com") | anonymous → verified | `/auth/create-account` → `/auth/verify` → `/welcome` | account creation, org setup, routing, trial grant, ready, first-run Home |
| `prospect-sales` | Large prospect | same, but answers 11+ / 200+ | — | `/welcome` with bands preset | "Talk to us" primary + still able to start trial |
| `pending-admin` | Org admin awaiting approval | `user-p01` / `org-pending` | signed_in, `approval:"pending"` | `/welcome/pending` | waiting state; demo "Approve now" |
| `trial-admin` | org_admin, trial org, 4 credits | `user-t01` / `org-trial` | signed_in, `trial`, 3 of 7 setup steps done | `/dashboard` (first-run Home) | checklist + earn, wallet card, sample review, security pack, cost at Start with enough balance |
| `payg-admin-low` | org_admin, paid org, 1 credit, auto-reload off | `user-c01` / `org-payg-low` | signed_in, `payg` | `/launchpad` | blocked Start (needs 2), inline top-up, receipt, ledger |
| `reviewer` | Reviewer in the trial org | `user-t02` / `org-trial` | signed_in, role reviewer | `/launchpad` | cost line, "Ask your admin", no buy buttons, read-only wallet |
| `approver` | Approver in the paid org | `user-c02` / `org-payg-low` | signed_in, role approver | `/reviews` | sign-off path, wallet read-only, security pack visible |
| `enterprise-yc` | Meridian via YouConnect (invoiced) | `user-001` / `org-001`, `mode:"embedded"` | signed_in, `invoiced` | `/youconnect` | existing J1 path; footbar "Billed through YouConnect"; `/configure/billing` shows a usage statement, no wallet |
| `returning` | Existing `user-001` returning (today's demo) | `user-001` / `org-001` | signed_in, `approval:"approved"`, setup complete | `/launchpad` | everything as it is today; populated dashboard + value placeholder |

Each entry: `{ id, label, description, userId?, orgId?, mode, entryRoute, preset?: { org?: Partial<Org>; ledger?: CreditLedgerEntry[]; progress?: SetupProgress } }`. Presets are the seed rows for that org, so "reset" is just re-applying them.

### 4.2 Where selection happens

- `/start` (already the demo launcher) lists the personas as `OptionCard`s grouped "Sign up" / "Signed in" / "From YouConnect", with the existing two cards kept at the top. Picking one = `demo.apply(id)`.
- `/auth/sign-in` card: a quiet "Demo accounts ▾" `Disclosure` under the form listing the signed-in personas (email shown, password irrelevant); typing a listed email and pressing Sign in also resolves to that persona. Keycloak-looking, but clearly labelled demo.
- `UserMenu`: a "Switch demo persona" item (above Sign out) opening a small `ActionMenu` of personas plus "Reset this org". Rendered only when `NEXT_PUBLIC_DEMO_PERSONAS !== "0"`.
- A floating `DemoDock` (bottom-right chip "Demo: trial-admin · reset · approve · +credits") so Ed can push state while presenting without leaving the page. Same env flag.

### 4.3 Applying a persona (`src/lib/demo.ts` → `demo.store.apply`)

1. `session.signIn({ userId, orgId, role })` or `signOut()` for prospects; `session.setMode(mode)`.
2. If `preset` exists, write it through the adapter (`update` org row; `remove` + `createMany` that org's ledger/progress rows) and refetch `org`, `wallet`, `onboarding`, `users`, `reviews`.
3. `identity.store` avatars cleared; `run.store.close()`; `order.store.close()`.
4. `router.push(entryRoute)`.
Persist `personaId` in `localStorage["parachute:demo:persona"]` so a reload stays in character; `SeedProvider` re-applies it after `seed()` (one `useEffect`, prototype-only).

### 4.4 Reset

`demo.resetOrg(orgId)` re-applies that org's seed rows for `orgs`, `credit_ledger`, `wallet_settings`, `setup_progress`, and deletes reviews with `orgId === id && !seeded` (the ones created at runtime). It never calls `adapter.seed(true)`, so theme/density and the other orgs survive. "Reset to brand-new" for `org-new` = delete the org + its user and `apply("prospect")`.

### 4.5 Deep links

- `/demo/[persona]` — a standalone page that calls `apply(params.persona)` in an effect and shows a one-line "Switching to …" then redirects. Example links for Ed: `/demo/payg-admin-low`, `/demo/pending-admin`.
- `?persona=` on any route is read once by `SeedProvider` and forwarded to `apply` (so `/reviews/review-sample?persona=trial-admin` works).
- Also honour `?step=` on `/welcome` (`path`, `pending`, `ready`) for jumping into the middle.

### 4.6 Strip-ability

Everything demo-only lives in: `src/data/seed/demo-personas.seed.ts`, `src/lib/demo.ts`, `src/store/demo.store.ts`, `src/app/start/`, `src/app/demo/`, `src/components/organisms/DemoDock.tsx`, the `Disclosure` in `/auth/sign-in`, one `UserMenu` item, the `SeedProvider` effect, and the env flag `NEXT_PUBLIC_DEMO_PERSONAS`. Grep for `demo` and `DEMO_` finds all of it.

---

## 5. Component placement

| New UI part | Folder | From `@realwired/ui`? | Notes |
|---|---|---|---|
| `KeycloakFrame` (auth card shell, theme tag) | `components/templates/` | app-local | Lib `Card` for the card; `Logo` atom. Library candidate as an "external theme reference" frame. |
| Sign-in / create / verify / reset / MFA forms | `components/organisms/auth/*` | `Input`, `Button`, `Checkbox`, `Divider` | app-local composition; MFA uses 6 `Input`s. |
| `OrgSetupForm` (name, kind, bands, billing method) | `components/organisms/onboarding/` | `OptionCard` (after tarball refresh; else app `.run-cf-opt` pattern), `Input`, `SectionCard` | the `.run-cf-opt` checkbox cards in `RunConfirm` are the house pattern for pick-one cards. |
| `PathChoice` (trial vs talk to us) | `components/organisms/onboarding/` | `Card`, `Button`, `Callout` | |
| `PendingState`, `ReadyState` | `components/organisms/onboarding/` | `EmptyState` (size lg), `ProgressStages` | |
| `WelcomeStepLine` | `components/molecules/` | `ProgressStages` now; `StepLine` later | |
| `FirstRunHome` | `components/organisms/` | — composition | lives beside `dashboard-widgets.tsx` |
| `SetupChecklist` (two lists, reward pills) | `components/organisms/` | `Chip` for "+1 credit", `Checkbox`-look via `Icon check-circle` | library candidate ("ChecklistCard") |
| `SetupDock` (rail footer) | `components/organisms/` | `CountPill` (later) / app `Chip` | passed into `AppShell sidebarFooter` |
| `WalletCard` | `components/molecules/` | `StatCard` | balance + caption "1 credit = 1 review type" |
| `CostLine` (footbar) | `components/molecules/` | `Chip`, `Tooltip` | library candidate |
| `LowBalanceCallout` | `components/molecules/` | `Callout` (tone warning, `action`) | app-local `.ui-callout` until vendored |
| `TopUpModal` | `components/organisms/` | app `Modal` atom (lib `Dialog` later), `OptionCard`, `Switch` | mounted in `AppShell` |
| `ReceiptDialog` | `components/organisms/` | app `Modal`; `FileRow` for the PDF stub | |
| `CreditLedgerTable` | `components/organisms/` | `DataTable` | numeric column meta for credits/$ |
| `PlansPanel` (hidden) | `components/organisms/` | `OptionCard`, `SectionCard` | flag-gated |
| `SecurityPackPanel`, `SecurityPackCard`, `SendToItModal` | `components/organisms/` | `FileRow`, `SectionCard`, `HubCard`, app `Modal` | |
| `SampleBanner` | `components/run/` | `Callout` (accent) | under `.run-head` |
| `BridgeScreen` (generalised `/launch`) | `components/templates/` | `HandoffBridge` once vendored | until then extract the `.hf` markup from `launch/page.tsx` |
| `BouncerMock` | `app/bouncer/page.tsx` only | — | same treatment as `/youconnect` |
| `ValueDashboardPlaceholder` | `components/organisms/` | `StatCard`, `EmptyState` | later `StatViz` widgets |
| `DemoDock`, persona cards | `components/organisms/DemoDock.tsx`, `/start` | `Chip`, `ActionMenu`, `OptionCard` | prototype-only |
| Configure hub cards | existing `.cfg-card` | library `HubCard` is the equivalent — migrate the hub when convenient, not in this scope |

Icons to add to `atoms/Icon.tsx`: `wallet`/`coins`, `receipt`, `shield`, `mail-forward`, `gift`/`award`, `building-bank`, `users-plus` (Tabler names exist for all).

---

## 6. Phased implementation plan

### Phase 0 — scaffolding, roles, seeds, persona switcher (M)

Files: `types/domain.types.ts` (types in §3.1), `lib/member-roles.ts` (production roles), `data/collections.ts`, `data/seed/{orgs,users,reviews}.seed.ts` (+`orgId`, demo orgs/users, `review-sample`), `data/seed/{credit-ledger,wallet-settings,setup-progress,demo-personas}.seed.ts`, `data/seed/index.ts`, `data/adapters/mock-adapter.ts` (v16), `lib/pricing.ts`, `store/{session,org}.store.ts` (extend), `store/{wallet,onboarding,demo}.store.ts`, `lib/current-user.ts` (+`getCurrentUser`, `useCurrentUser`), `lib/demo.ts`, `app/start/page.tsx` (persona cards), `app/demo/[persona]/page.tsx`, `components/organisms/DemoDock.tsx`, `UserMenu` item, `SeedProvider` re-apply effect, `OrgCard`/`UserMenu`/`dashboard` greeting on `useCurrentUser`.
Decision to take first: refresh `vendor/realwired-ui-0.1.0.tgz` from `D:\worktrees\ds-now` (gets Callout/OptionCard/HandoffBridge/Disclosure/CountPill/Dialog/Toast) or stay app-local for those; the plan above assumes a refresh, with app-local fallbacks named.
Demo at end: pick any persona from `/start` or `/demo/<id>`; org card, greeting and queue change with it; reset works; roles read reviewer/approver/org_admin everywhere.

### Phase 1 — Keycloak-themed auth + org setup + routing + pending/ready (M)

Files: `app/(auth)/layout.tsx`, `app/(auth)/auth/{sign-in,create-account,verify,reset,mfa}/page.tsx`, `components/templates/KeycloakFrame.tsx`, `components/organisms/auth/*`, `app/login/page.tsx` → redirect, `app/(onboarding)/layout.tsx`, `app/(onboarding)/welcome/{page,path,pending,ready}/page.tsx` + `hooks/useWelcome.ts`, `components/organisms/onboarding/*`, `org.store.createOrg/requestSales/approve`, `wallet.store.grantTrial`, `Breadcrumbs` labels, `globals.css` small `.kc-*`/`.wel-*` blocks on tokens.
Demo at end: prospect → create account → verify → org setup → both routing outcomes → pending (approve from dock) → ready with N credits → first screen. Returning persona → sign-in → `/launchpad`.

### Phase 2 — first-run Home, checklist + earn, sample review, security-pack stub (M)

Files: `dashboard/hooks/useDashboard.ts` (`orgStage`, steps), `components/organisms/{FirstRunHome,SetupChecklist,SetupDock,WalletCard,SecurityPackCard,ValueDashboardPlaceholder}.tsx`, `AppShell.tsx` (`sidebarFooter` dock), `onboarding.store.verify` wiring into `BrandingPanel` save, `templates.store` publish, `/bouncer` invite, security-pack send, sample sign; `app/(shell)/configure/security/page.tsx` + `hooks/useSecurityPack.ts`, `components/organisms/{SecurityPackPanel,SendToItModal}.tsx`, `configure/page.tsx` card, `CommandPalette`, `Breadcrumbs`; `RunExperience` sample banner, `review-columns.ts` Sample chip, `useReviewQueue`/`useDashboard` sample filter.
Demo at end: trial-admin lands on Home with 3/7 done, completes "Send security pack to IT" and "Open the sample review", watches credits tick +1 each, dismisses the dock; Home flips to the populated dashboard for `returning`.

### Phase 3 — wallet/billing, cost at Start, top-up, ledger/receipts (L)

Files: `app/(shell)/configure/billing/page.tsx` + `hooks/useBilling.ts`, `components/organisms/{TopUpModal,ReceiptDialog,CreditLedgerTable,PlansPanel}.tsx`, `components/molecules/{CostLine,LowBalanceCallout}.tsx`, `RunConfirm.tsx` footbar, `RunModal.tsx` + `reviews/[id]/page.tsx` debit, `AppShell.tsx` mounts, `configure/organization/page.tsx` (drop Billing tab, Members read-only + Bouncer link), remove or retire `BillingPanel.tsx`, `configure/page.tsx` card, palette/crumbs, `globals.css` `.wallet-*`.
Demo at end: payg-admin-low opens Start → blocked → Add credits inline → pack 5 → Start enabled → debit appears in Activity with loan # → receipt dialog; reviewer sees "Ask your admin"; enterprise-yc sees "Billed through YouConnect" and a usage statement; Plans tab appears when the flag is on.

### Phase 4 — Bouncer bridge, hidden plans polish, value placeholder data, cleanup (S–M)

Files: `app/launch/bouncer/page.tsx`, `components/templates/BridgeScreen.tsx` (extract from `launch/page.tsx`, both routes use it), `app/bouncer/page.tsx`, `MembersPanel` flag, `ValueDashboardPlaceholder` behind `NEXT_PUBLIC_ENGINE_V2` with `value.seed.ts` once Ed's JSON arrives, e-mail stubs (optional `/auth/email-preview` for the Keycloak e-mail theme RWT-1062), `docs/plans/parachute-onboarding-plan.md` + `AGENTS.md` paragraph, `feedback-log.md` rows for 3 Nov, remove `/styleguide`.
Demo at end: Invite team → bridge → Bouncer mock → back with the step done; full persona tour in one sitting.

Order rationale: Phase 0 first because every later phase needs a persona to be demoed in; auth/onboarding before wallet because the wallet's trial grant is created there; sample review and Home before cost-at-Start because the blocked state is only meaningful once a user has somewhere to spend and earn.

---

## 7. Risks / things to confirm

1. **Branch base.** Memory says `feat/design-system-consume` stays off `main` (Ed cancelled the retrofit on 26 Aug) and also says onboarding should use `@realwired/ui`. Decide: build on a branch cut from `feat/design-system-consume` (plan above) and accept it will not merge to `main`, or build app-local on `main`. The plan keeps new components thin so either works, but the library-dependent parts (Callout, OptionCard, HandoffBridge, DataTable) need the tarball refreshed from `D:\worktrees\ds-now`.
2. **Approval gate.** RWT-1031 keeps staff approval; Ed wants instant card sign-up. `/welcome/pending` plus `org.flags.approvalGate` lets both be demoed; the devs need the decision.
3. **Numbers are variables**: trial size (Ed 2–3, Cody 5), seat cut-off (5 or 10), one-type price, two revisions, reward per step (Ed: "keep it low, one"). All in `lib/pricing.ts`; do not bake into copy.
4. **Role mapping** owner/admin/viewer → org_admin/approver/reviewer is a breaking type change; it touches `MembersPanel`, `InviteMemberModal`, seeds. Confirm `approver` semantics (signs off? can they order?) before gating buttons on it.
5. **Members in Bouncer.** `MembersPanel` keeps working locally; the Bouncer mock is a placeholder. Confirm whether Parachute should show members at all (read-only mirror) or only the link.
6. **Wallet backing.** RWT-963 sends pricing to RM after each analysis; no ticket for card/wallet/processor. The ledger shape is a proposal; keep it in the adapter so the API adapter can map it.
7. **`clear()` wipes prefs** and `org.store` bypasses the adapter; the reset action must avoid `seed(true)`.
8. **Post-login landing** moves from `/launchpad` to `/dashboard` for new orgs only; F-119/F-127 keep `/launchpad` as the primary action. Confirm Ed is fine with Home being the first screen for first-run.
9. **Security-pack copy** ("we never access it, never use it for training") needs Realwired sign-off before it reads as a claim; keep placeholder wording.
10. **Password-protecting the Vercel prototypes** (D1) is unrelated to code but gates sharing any of this with Ed.
