# Realwired engineering recon — what exists around the real Parachute (read 6 Nov 2026)

Read-only pass over Realwired's Confluence (DEV space) and Jira (RWT). Nothing was changed. Raw notes in `notes-raw.md` beside this file; the full text of the CIM Target Architecture / Decisions pages in `cim-pages.txt`.

Sources (Confluence)
- Charter: https://realwired.atlassian.net/wiki/spaces/DEV/pages/296288279
- CIM Global Plan (updated 2026-11-03): https://realwired.atlassian.net/wiki/spaces/DEV/pages/452689921
- Onboarding runbook (rev 2026-10-05): https://realwired.atlassian.net/wiki/spaces/DEV/pages/410157060
- Parachute Standalone AS-IS (system page): https://realwired.atlassian.net/wiki/spaces/DEV/pages/353599511
- Parachute Standalone — Identity Architecture (updated 2026-10-22, S4 closed 2026-11-04): https://realwired.atlassian.net/wiki/spaces/DEV/pages/355631106
- CIM — Target Architecture: https://realwired.atlassian.net/wiki/spaces/DEV/pages/355532802
- CIM — Decisions (ADR-009..014): https://realwired.atlassian.net/wiki/spaces/DEV/pages/355926017
- Systems index (repo list): https://realwired.atlassian.net/wiki/spaces/DEV/pages/346816514
- Central Identity Manager AS-IS: https://realwired.atlassian.net/wiki/spaces/DEV/pages/355893249
- API Contract: https://realwired.atlassian.net/wiki/spaces/DEV/pages/356614145
- Parachute Standalone — Decisions: https://realwired.atlassian.net/wiki/spaces/DEV/pages/355631140

---

## 1. Repositories (GitHub org `RealWired`)

| System | Repo | Notes |
|---|---|---|
| Parachute backend | `RealWired/parachute-api` | Laravel ^13 / PHP 8.3, PostgreSQL, Redis sessions, spatie/laravel-activitylog, Scribe + Spectator (OpenAPI at `parachute-api/docs/api/openapi.yaml`). Deployed in k8s namespace `parachute` (deploys `parachute-api`, `-worker`, `-scheduler`). Dev: https://parachute-dev.realwired.com |
| Parachute frontend | `RealWired/parachute-ui` | React SPA (Vite), Vitest + sharded Playwright; `src/contract/` holds the workbook contract; `LoginPage.tsx` is today's login form (to be removed by RWT-1130) |
| Design mock (ours) | `val-brandcave/parachute-app` (mirrored as `RealWired!_repos/parachute-app`) | "Visual source of truth"; screenshots attached to 44/46 MLP stories |
| Spec/docs | `parachute-standalone` (docs 00–07), `RealWired/Parachute_POC` (Ed's Bedrock PoC + feature lists) | |
| AI engine | `RealWired/AI_Reviews` (Python/FastAPI; S3 `{bank_id}/questions.json`) | Being replaced by a PHP engine eventually (no epic yet) |
| Bouncer (admin app) | `bouncer-api` (Laravel + PostgreSQL on EKS; **holds the Registry as a module**; was `hub-api`, renamed by RWT-1325 on 2026-11-02) and `bouncer-ui` (SPA "on the parachute-ui stack", created RWT-1109) | Hosts: `bouncer-dev.realwired.com`, `bouncer.realwired.com` (`/api` → bouncer-api, `/` → bouncer-ui) |
| Registry | not a separate repo — module of `bouncer-api` | Query API internal-only (`/v1`, client-credentials token, audience `registry`, scope per product) |
| Keycloak themes | **no repository yet** — "today no theme exists in any repository, and the Skycloak theme library on both clusters is empty" (RWT-1061). Repo to be decided in RWT-1061's refinement; realm config-as-code tool decided in RWT-1049 | |
| Infra | `parachute-infra` (PR #7 referenced), `rw-devstack` (local full stack incl. Keycloak realms + Bouncer), `RealWired/YC-DeployScripts`, `RealWired/innostack-handovers` | |
| Others | `RealWired/YouConnect`, `RealWired/Circle`, `RealWired/ReportingMicroservice` (RM, Node/Postgres/EKS; QA at qareporter.realwired.com), `RealWired/ClientSelfServeCenter` (Next.js 16 + Prisma + NextAuth + Supabase — being discontinued, RWT-60) | |

## 2. Frontend stack of the real Parachute

- Decision history: 16 Jul 2026 "reuse-first" (React SPA + PHP backend, superseding Next.js/Node-BFF), 22 Jul PHP/Laravel convergence, 12 Aug auth model reversed. RWT-478 spike (Jose Rivas) decided: React SPA, **no Next.js BFF**; reuse React components from the prototype.
- Stack: React 19 / TypeScript / Vite, Tailwind v4 + shadcn/ui, Zustand pattern inherited from prototype, BlockNote/Tiptap (ProseMirror) editor, Recharts, PDF.js; PDF export via Chromium headless (RWT-859; Gotenberg earlier).
- Routes confirmed in tickets/QA notes: `/login` (today; being removed), **`/configure`** (landing with cards: Organization, Technical Review Template, Administrative template), **`/configure/organization`** (Identity tab only; Members and Billing tabs explicitly skipped), `/configure/members` renders "Page not found", Configure › Technical Review Template › Customize. Home after login = "Start a review" screen (RWT-500; the prototype's Launchpad). Reviews list exists (RWT-509/510/880 "make the Review List match the prototype"). Sign-in error route exists in SPA. **No evidence of `/dashboard`, `/launchpad`, `/launch` or `/youconnect` route names in the real app**; "From YouConnect" intake, Dashboard, Review Defaults, Response Library were cut (RWT-548). API routes seen: `GET /api/organization`, `PATCH /organization`, `POST /organization/logo`, `GET /api/templates/technical/{family}/sample`, `/api/auth/*`, `/api/integrations/youconnect/…`, `POST /reviews`.
- UI already has an org switcher bottom-left (QA note on RWT-537) — the target says **no organization switcher in any product** (CIM ADR-012), so expect it to go.
- Browser storage: `parachute:local-reviews` (localStorage) and `parachute-ledger` (IndexedDB), to be keyed per person (RWT-1130).

## 3. Keycloak / CIM wiring

**Today (production):**
- Keycloak managed on **Skycloak**, Keycloak 26.7.x → 26.8. Prod cluster: realm **`realwired`**, issuer `https://iam.realwired.com/realms/realwired`; non-prod realm **`realwired-dev`** on its own cluster; local `rw-devstack` realm. Staff realm **`realwired-staff`** / `realwired-staff-dev` (brokered as the IdP of the `realwired` Organization; staff sign in through **Microsoft Entra ID + mandatory WebAuthn**; staff hold no password).
- Client id **`parachute-api`** in every customer realm (confidential). Secondary admin client `parachute-api-directory` (to be removed at cut-over). Bank = Keycloak **Organization** (attributes `youconnect_bank_id`, `youconnect_tenant`).
- **Sign-in today is Parachute's own form posting to `POST /api/auth/login` over the OAuth Direct Access Grant** (PasswordGrantAuthenticator) — password-only, no MFA, Verify-email switch OFF, `/api/auth/password-reset` returns 503 (no SMTP on the realm; RWT-1064). Users were created without passwords and Luiz sets them by hand (RWT-975). Realm has no SMTP.
- Roles reach the token via realm groups `/parachute/reviewer`, `/parachute/approver`, `/parachute/org_admin` mapped to client roles on `parachute-api`; read from `resource_access['parachute-api'].roles`. parachute-api mirrors `users` + `organization_user` (UNIQUE user_id = one org per person) at first sign-in; org row created by `php artisan cim:provision-organization <uuid>` or at first sign-in (ADR-020).
- **Registration is NOT enabled.** Onboarding is a manual runbook (CIM org → groups → users with e-mail identical to YouConnect's → provision command → engine S3 profile → secrets + pod restart → YouConnect bank-config switch `parachute_standalone_enabled`).
- Join key = `sub`, never e-mail (temporary e-mail matching for YouConnect handoff until RWT-1027).

**Target (RWT-1026 "Parachute identity refactor", two deliveries, 0% done, all 14 tickets To Do/unassigned):**
- Delivery 1 — sign-in (RWT-1129/1130/1131/1141 → release RWT-1132): parachute-api as confidential client, **Authorization Code + PKCE S256**, `scope=openid organization`, endpoints `GET /api/auth/sign-in?return_to=<relative path>`, `GET /api/auth/callback` (response_mode=query), `POST /api/auth/sign-out` (CSRF; RP-initiated logout with id_token_hint), back-channel logout endpoint (sid/sub index). Server-side session in Redis (cookie `parachute_session`, Secure/HttpOnly/SameSite=Lax; idle 30 min, max 8 h), tokens never in browser, CSRF via `XSRF-TOKEN`/`X-XSRF-TOKEN`. **Post-login landing = the originally requested route (deep links survive); signed-in user hitting login → Home.** Direct Access Grant turned off, **Verify email switched ON** at that release. MFA (conditional per org via realm role `mfa-required`), password reset, e-mail verification all become **Keycloak's themed screens** (RWT-1061 login theme: RealWired base + Parachute variant set per client; RWT-1062 e-mail + Account Console themes). Profile/e-mail edits happen in Keycloak Account Console, not Parachute.
- Delivery 2 — cut-over (RWT-1133..1140, 1142 → RWT-1139): **token contract v2** (carries `sub`, `email`, one active organization chosen on CIM's org-selection page at sign-in; **no roles in token**). parachute-api reads **identity, roles and entitlement from the Registry query API on every request** (fails closed 503 if Registry down); keeps no copy of orgs/people/memberships/roles; `users`/`organization_user` tables dropped after a 7-day stabilization window. Org settings row (PK = CIM org UUID: short name, branding, logo, youconnect_base_url) created with defaults when Registry reports org active + `parachute` entitlement active.
- Per-endpoint authorization deny-by-default with Laravel Policies (RWT-1131); refusal reasons surfaced to the person (RWT-1137).
- Delivery order changed **2026-11-03**: go-live (phase C) now follows CIM core + Parachute refactor together — the sign-in release no longer ships ahead of Bouncer; RWT-1059 MFA runbooks cancelled.

## 4. Bouncer — what the customer area will own

- Bouncer = single admin app, two audiences (CIM ADR-010). **Keycloak Admin Console for platform engineers only**; CS/Support use Bouncer.
- Staff area (RWT-1025, In Progress, 17% — sign-in/session RWT-1110 and staff roles RWT-1111 Done; screens To Do): organizations + the **single provisioning operation** (RWT-1077 Done; UI RWT-1114 To Do), members & roles of any org, MFA switch per org, lost-factor recovery, audit, emergency disable. Released to production only at Parachute's cut-over.
- **Customer area (RWT-1028, To Do, unassigned, no sprint; blocked by staff area; blocks self-service):** members (invite, change role, deactivate with immediate session revocation, audit), **roles per product**, organization profile, **organization SSO configuration** (IdP metadata, e-mail-domain verification, IdP link membership type). Parachute's RWT-540 member management moved here with its ACs (invite by e-mail → created in CIM via Registry; invitee sets own credential; cannot demote last org_admin). Open gap L4: which role makes someone an "organization administrator". Admins act through the Registry management API under server-resolved tenant scope. Tenant-isolation ACs on every ticket (no `email_taken`/`organization_taken` enumeration; domain routes sign-ins only after verification).
- URL plan: one public hostname per env (`bouncer.realwired.com`, `bouncer-dev.realwired.com`), `/api` → bouncer-api, `/` → bouncer-ui; sign-in client `bouncer` (Auth Code + PKCE, `__Host-` cookie, token v2). No per-customer domain unless requested. No specific customer-area route paths published yet.
- Later: RWT-1030 "Bouncer — system configuration" = successor of Client Self Serve Center (the Next.js onboarding wizard is being discontinued).

## 5. Billing model (RM = Reporting Microservice)

- **No card payments and no payment processor anywhere.** RM is an internal fees/invoicing ledger; invoices go out via a separate (To Do) Parachute ↔ QuickBooks epic RWT-268. Stripe appears only as a *future* note: CIM plan says "modelling of plans, modules, commercial entitlements and the Stripe integration" is out of scope; ADR-009/012 "revisit when modelling of plans and Stripe begins"; Target Architecture diagram shows `stripe --> provisions as pending_approval --> registry` as a future external provisioner.
- **RWT-963 "Parachute Billing: RM integration" (QA In Progress, Sprint 42, Marvs Medrano QA; Luiz built it):** Parachute emits one event per review, `kind=review.completed`, from a `billing_events` outbox (fields: `event_id`, `source=parachute`, `occurred_at` = billable moment, `organization_id`, `bank_unique_name` (new column on organizations, set at onboarding — RM joins on it), `review_id`, `review_number`, `review_category` Administrative|Technical|Both, `origin_system`, `origin_request_id`, `client_name`, `loan_number`, `property_type`, `started_by`) → `POST /webhook/billing-event` on RM → append-only `BillingEvents` → `calc_ai_review_fee`. Trigger `BILLING_TRIGGER=review_ready` (after documents commit) or `manual` (`php artisan billing:emit`). RM dedupes on `event_id`.
- **Price lives in RM per bank** (`OrganizationItems`, product `AI_REVIEW`, **`TransactionBased` or `Monthly`**, optional `subType` per review type; prices versioned, never edited in place). "Give the pricing back to the org" was settled as: RM owns the price; nothing is pushed to Parachute; whether Parachute shows usage/cost (RWT-541) is open with Diego. **One order = one unit; re-order = +0**; QA test price $40/transaction on bank1 (QA only); **0 of 88 banks priced in production**. Historic manual rules from Sunda (RWT-477, Aug 2026): per file number, Technical $250, Compliance/Administrative $85, only contracted banks, from go-live date.
- Open billing questions (6 Nov, Marvs → Luiz/Diego): separate Technical-then-Administrative orders = 1 or 2 units; corrections/re-uploads; replacement mid-run; period timezone; how to cancel a Standalone review. Related To Do/Review tickets: RWT-980 (define billable unit + timezone, Ademir), RWT-981/983/985 (Review, Luiz), RWT-984 (config in dev/prod, Marcio), RWT-987 (credits/corrections, Ademir), RWT-989 (validate first billing cycle, Diego). RWT-1320 notes "each run costs the client".
- In the CIM model, **entitlement** (per org × product: `active|suspended|ended` with modules + limits) lives in the Registry and is "written by staff through the provisioning operation today, by billing later"; "a plan, once billing models it, resolves to entitlements (plan → modules → entitlements)". Org lifecycle `pending_approval → active → suspended → deactivated`; transitions "by staff today, by billing later" (RWT-1031).

## 6. Roles and who administers

- Parachute product roles (per person × organization × product, cumulative): **`reviewer`** (start reviews, edit workbook, concur/reject/edit/delete), **`approver`** (= reviewer + sign, seal, reopen; decided 2026-11-04 as a second tier, not a persona), **`org_admin`** (= reviewer + org settings: identity, branding, logo, templates; **not members**). Members/roles/SSO administered in **Bouncer** (customer area) — never in Parachute. The org's YouConnect address and MFA requirement are set by RealWired staff only.
- Staff roles (Registry, valid across all orgs, no org dimension): `staff-viewer`, `staff-support`, `staff-cs`, `staff-admin`, plus product role **`staff-parachute-config`** (configure any org's Parachute settings with own identity, audited; no reviews/documents). Impersonation deferred (RWT-1105).
- Effective access = person enabled ∧ org active ∧ entitlement active ∧ ≥1 role. Deactivation = disable in CIM → log out sessions → then everything else.
- Today's server-side gating: writes on `/organization` require `role:org_admin`; the SPA does not gate navigation by role.

## 7. Dates / sprints

- **No dates** for self-service, Keycloak theming or Bouncer; CIM plan estimates in SP after refinement (1 SP = 1 day). Critical path: Foundation (RWT-1022) → Registry (RWT-1023) → Bouncer staff (RWT-1025) → Parachute refactor (RWT-1026) → go-live (RWT-1132 then RWT-1139) → YouConnect pilot (RWT-1027). Self-service (RWT-1031) is label **"Later"**, phase E, "delivered last", blocked by Registry + both Bouncer areas; its audience is an open **business** decision (Q1).
- Current sprint is **Sprint 42** (Parachute product work: RWT-963 billing QA, RWT-1320 cover page, RWT-1336 done, RWT-1343 Bank of Tampa onboarding). CIM tickets carry no sprint.
- MLP release date 2026-09-04 missed; "the exit checklist replaces the date". RWT-310 epic 80% done, still To Do/overdue. Six production orgs in realm `realwired`: Community Bank NA, Dime, Bank of Stockton, Mercantile, StageBank, demobank (RWT-975 done; United Bank RWT-1339; Bank of Tampa RWT-1343 in progress).

---

## Ticket status table (as of 6 Nov 2026)

| Key | Summary | Status | Assignee | Sprint / Fix version | SP | Last updated | New since 4 Nov? |
|---|---|---|---|---|---|---|---|
| RWT-1031 | CIM — Self-service (epic) | To Do | Unassigned | none; label Later | — | ~3 Nov | no comments; description edit ~3 Nov |
| RWT-1028 | CIM — Bouncer: customer area (epic) | To Do | Unassigned | none | — | 5 Nov 11:38 | description touched 5 Nov (tenant-isolation section, RWT-1118 rule); no comments |
| RWT-1025 | CIM — Bouncer: staff area (epic) | In Progress (17%) | Ademir Mazer Junior | none | 27 | 4 Nov 20:15 | RWT-1110 Done 4 Nov; RWT-1396 added; no comments |
| RWT-1023 | CIM — Registry (epic) | In Progress (73%) | Ademir | none | 34 | 4 Nov 10:07 | RWT-1411 child added; RWT-1081 in progress |
| RWT-1061 | CIM login theme (RealWired + Parachute variant) | To Do | Unassigned | none | 2 | ~4 Nov | no comments; blocked by brand assets "from product" |
| RWT-1062 | CIM e-mail + Account Console themes | To Do | Unassigned | none | 1 | 1 month ago | none |
| RWT-1130 | Sign-in through CIM in parachute-ui (login page removed) | To Do | Unassigned | none | 2 | 1 month ago | none |
| RWT-963 | Parachute Billing: RM integration | QA In Progress | Marvs Medrano | Sprint 42 | 5 | 5 Nov 16:35 | **yes** — Luiz 5 Nov (fee track folded in; "Ready for QA on dev"); Marvs 6 Nov (13 billing-rule questions) |
| RWT-541 | Billing and usage reports for the organization | To Do | Ademir | none (parent RWT-548) | — | 2 months ago | none |
| RWT-537 | Organization page — identity, branding, members, billing | Done (Identity only) | Luiz Roland | Parachute MLP | 5 | 3 Nov | none |
| RWT-477 | AI Review usage query per bank/type | Done | Luiz Roland | — | 1 | 3 Nov | none |
| RWT-1132 | Release of Parachute's sign-in through CIM (MFA arrives here) | To Do | Unassigned | none | 2 | ~4 Nov | description edit (release order per 3 Nov decision); no comments |
| RWT-1336 | Technical template sample-workbook preview for new orgs | Done | Jose Rivas | Sprint 42 | 2 | 5 Nov | **yes** — created 3 Nov, how-to-test (Jose) + QA passed (Chester) 4 Nov |
| RWT-1320 | Editable cover page (both templates) | In Progress | Jose Rivas | Sprint 42 | 5 | 5 Nov | **yes** — Bank of Stockton feedback (28 Oct, fwd 3 Nov) added to description |
| RWT-310 | Parachute Standalone (MLP epic) | To Do (80%) | Diego De Grandi | due 4 Sep 2026 (overdue) | — | 1 month ago | none |
| RWT-548 | Parachute Improvements (post-MLP) | To Do (46%) | Diego | none | — | 3 months ago | none (children moving) |
| RWT-975 | Banks live (CBNA, Dime, Stockton, Mercantile) | Done | Luiz Roland | Sprint 42; due 19 Oct | 3 | 3 Nov | none |
| RWT-1026 | CIM — Parachute identity refactor (epic) | To Do (0%) | Unassigned | none | 27 | ~4 Nov | description only |
| RWT-1139 | Cut-over of Parachute to the Registry | To Do | Unassigned | none | 2 | 4 Nov 20:15 | description edit |
| RWT-1129 | Auth Code + PKCE in parachute-api | To Do | Unassigned | none | 3 | ~4 Nov | description only |

### JQL search — top hits by `updated DESC` (self-service / sign up / wallet / credit / stripe / payment / onboarding / keycloak theme), 296 total
1. RWT-963 Parachute Billing: RM integration — QA In Progress (5 Nov)
2. RWT-1342 Footer setting in GS (vendor letter) — Ready for Stage
3. RWT-214 Vendor Circle pending invites — Ready for Stage
4. RWT-1175 AI replay for QA test automation — QA In Progress
5. RWT-887 Stock Yards vendor status panel — Review
6. RWT-1112 `bouncer-ui` foundations — To Do (5 Nov)
7. RWT-1193 Technical template numbering bug — To Do
8. RWT-983 Parachute billing — keep original billable moment on manual re-send — Review (5 Nov)
9. RWT-985 Parachute billing — billing bank name per org + runbook steps — Review (5 Nov)
10. RWT-1028 CIM — Bouncer: customer area — To Do (5 Nov)
11. RWT-1114 Provisioning from Bouncer — To Do (5 Nov)
12. RWT-937 Parachute can answer who a person is / what they may do, for someone other than the caller — To Do, 8 SP, moved to Phase 2 on 5 Nov (read side of member management; role-storage ADR pending)
13. RWT-1343 Onboard Bank of Tampa to Parachute Standalone — In Progress, Sprint 42 (created 3 Nov)
14. RWT-287 RM: AI Review price reportable — Won't Do (folded into RWT-963, 5 Nov)
15. RWT-840 Storage access to bring YouConnect review artefacts across — To Do (Ed)
16. RWT-1139 Cut-over of Parachute to the Registry — To Do (4 Nov)
17. RWT-1025 CIM — Bouncer: staff area — In Progress (4 Nov)
18. RWT-1110 Bouncer sign-in and session in bouncer-api — Done (4 Nov)
19. RWT-1023 CIM — Registry — In Progress (4 Nov)

## Changes since 4 Nov 2026 (what moved)
- **RWT-963 billing**: Luiz (5 Nov) folded the "AI Review fee" track (RWT-22/35/21/287/20) into this ticket; everything deployed to dev/QA RM; production order defined (RM migrations → prices per bank → parachute-api → YouConnect). Marvs (6 Nov) posted QA questions that are effectively **open billing-rule decisions** (unit per review type ordered separately, corrections, timezone, cancel path). Diego owns the per-type answer.
- **RWT-937** (5 Nov): moved into Phase 2; the "where do roles live" ADR must be decided before RWT-540 member management.
- **RWT-1336** created 3 Nov, shipped and QA-passed 4 Nov (parachute-api #130, parachute-ui #163): a brand-new org can now customize the Technical template against a sample workbook — a first-run onboarding gap closed.
- **RWT-1320** (5 Nov): Bank of Stockton's "Parachute 2.0" feedback appended; In Progress.
- **RWT-1343** Bank of Tampa onboarding started (manual runbook path; Sunda flips the YouConnect switch).
- **RWT-1110** Bouncer sign-in/session Done 4 Nov (CIM ADR-010 amended 4 Nov); **RWT-1396** staff-roles screen ticket added; **RWT-1411** Registry scopes ticket added.
- **CIM Global Plan** (3 Nov): delivery order changed — go-live only after CIM core + Parachute refactor; RWT-1059 cancelled. **Identity Architecture** (4 Nov): S4 closed — `approver` is a cumulative second-tier role.
- RWT-1025/1028/1031/1061/1062/1129/1130/1132/1139: description-level edits only, **no new comments, still unassigned, no sprint**.

## Implications for the onboarding + billing design
1. **Self-serve sign-up is architecturally planned but explicitly last** (CIM ADR-009, RWT-1031 "Later", blocked by Registry + Bouncer staff + Bouncer customer area). The shape they committed to: public sign-up → org created `pending_approval` via the single provisioning operation → **staff approval queue in Bouncer** → active. Design for "request access / pending approval" states, not instant activation (auto-activation "per segment or product" is a later rule). Audience is an open business question — our design can propose it.
2. **Everything credential-related is a themed Keycloak screen**, not a Parachute screen: sign-in (identity-first e-mail → password), org selection, password reset, MFA enrolment, e-mail verification, Account Console (profile/e-mail edits). Our onboarding flow should hand off to CIM at those points and return via `return_to`; we should design the **Parachute login-theme variant** (RWT-1061 is blocked on "brand assets from product") and the e-mail templates (RWT-1062: reset, verification, **organization invitation**).
3. **Members, roles, invites, SSO/domain verification live in Bouncer's customer area** (RWT-1028), not in Parachute's `/configure`. Parachute's Organization page is Identity-only (name read-only from Registry, short name/logo/branding editable). If our design shows member management inside Parachute it contradicts CIM ADR-010; either design it as the Bouncer customer area or as a deep link out.
4. **One organization per person, no switcher**; multi-org users choose at sign-in. Remove the bottom-left org switcher pattern.
5. **Billing is invoice-based, usage-metered per completed review, priced per bank in RM** (transaction or monthly), with no self-serve payment, wallet, credits or card capture anywhere. A "wallet/credits/Stripe" design is net-new; the only hooks are: entitlement in the Registry (plan → modules → entitlements, "written by billing later"), org lifecycle transitions "by billing later", and the `review.completed` billing event. An in-product usage/cost view (RWT-541) is unassigned and unscoped — that is the natural place for a usage/billing tab.
6. Roles to use in the design: `reviewer`, `approver`, `org_admin` (+ staff `staff-parachute-config`). The first admin is created by the provisioning operation; invited members set their own credential via CIM e-mail.
7. **First-run gaps already being closed**: sample-workbook template customization (RWT-1336 done), cover page (RWT-1320), bank-profile checklist provisioning per org (RWT-653 To Do), `bank_unique_name` for billing set at onboarding (RWT-985).
8. Stack reality: React SPA (Vite) + Laravel API, not Next.js — hand over designs as screens/flows, not as Next.js routes; real route family is `/configure/*`, reviews list, start-a-review home, `/api/auth/*`.
