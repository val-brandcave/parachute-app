# Parachute Standalone — self-serve onboarding, credits and first-run: design spec

**Status:** draft for Val's approval (6 Nov 2026). Nothing sent to Realwired yet.
**Artifacts:** plan + decisions page (link in the session summary) · hi-fi screens canvas https://claude.ai/artifact/BJ7pWDVLDCiZhibBgK2gTe · accepted research https://claude.ai/artifact/18P9g2UqAjK6fVWGUZD4Lj · accepted concepts https://claude.ai/artifact/UDCm9mfY52Tbt14U26b3qX · v0 storyboard https://claude.ai/artifact/3zxGsVMpW8zGyGYavXkCDW
**Source of the ask:** 3 Nov 2026 UX sync (processed in `docs/meetings/processed-calls/parachute-nov-03-2026-processed.md`), Cody's 4 Nov session prep.

## 1. Intent

Ed's two priorities for Parachute Standalone: (1) self-serve sign-up with billing for teams of ~1–10, pay as you go per document, with visible credit cues ("when am I prompted", "how many runs do I have left"); (2) a dashboard: empty state first, value metrics when engine v2 lands. Plus earned credits for setup that prevents support calls, a security pack placeholder for bank IT, and themed Keycloak screens.

Positioning (accepted): a second reviewer you can try on one report, with the cost and the evidence on every page.

## 2. Reconciled model (every `~` number is a variable in `lib/pricing.ts`)

| Topic | Decision used on the screens |
|---|---|
| Unit | Credits paired with dollars. 1 credit = 1 review type on 1 report ≈ $150; full review = 2 credits ≈ $300. Ledger, receipts, statements in dollars. |
| Trial | Free sample review + 3 full reviews = 6 trial credits, no card, usage-capped, no calendar expiry. |
| Earned | +1 credit per verified setup step, cap 3 per org: bank policy uploaded; compliance checklist published + default; custom workbook layout published. Alt: link YouConnect. Invite reward deferred. Never for judgment or volume. 90-day life. |
| Purchased | Packs 5 / 10 / 20 (~$750 / ~$1,500 / ~$3,000), 12-month life, org_admin only. Auto-reload off by default ("below 2, add 10", monthly cap). Spend order trial → earned → purchased. |
| Zero balance | Checked at Start review only. Blocked state holds the upload as a draft; inline top-up; reviewers "Ask your admin". Reserve at Start, settle at review_ready, refund on our failure. |
| Sales threshold | Org setup asks reviewers (Just me / 2–10 / 11+) and reports a month (<50 / 50–200 / 200+). 11+ or 200+ → "Talk to us" first + sales flag. Never blocked. |
| Activation | Both designed: instant (proposed auto-activate rule: card-verified, ≤10 seats, verified domain) and Pending approval (ADR-009, staff queue in Bouncer, sample usable while waiting). |
| Ownership | Keycloak (themed, RWT-1061) owns create account / verify / sign in / reset / MFA. Parachute owns everything after the token. Bouncer owns members, roles, SSO. Registry/RM own entitlements and price. |
| Roles | reviewer · approver (cumulative tier, 4 Nov) · org_admin (settings, billing; not members). |
| Who pays (Val, 6 Nov) | One org wallet is the only funding source (Ed: a lone tester "still putting it on the company's credit card"). Activity filters spend by person. The first payer can "Hand billing to someone else" (finance) without losing admin. No team budgets until Ed asks. |
| Checklist | "Getting set up": two lists (First review · Ready for your team), "N of 6", who/when per done row, only "Account created" pre-ticked, per-user dismiss, reopens from Help → Setup guide. |
| Education | Three 60–90 s user-triggered videos + Reviewer / Admin guide PDFs. No tour on load. One quiet toast + balance tick for an earned credit. No confetti. |

## 3. What we learned on 6 Nov (Confluence + Jira, read-only)

- Real Parachute = `RealWired/parachute-ui` (React 19 + Vite + Tailwind 4 + shadcn) + `parachute-api` (Laravel). Next.js rejected (RWT-478). Our prototype is the visual source of truth, not a route template. Real routes: `/configure`, `/configure/organization` (Identity only), reviews list, "Start a review" as post-login home.
- Identity target (RWT-1026): Auth Code + PKCE; every credential screen is a themed Keycloak page; no Keycloak theme repo exists; RWT-1061 blocked on brand assets "from product" (us). Registration not enabled; onboarding is a manual runbook. Post-login landing = originally requested route.
- Billing: RM is an invoice ledger fed by `review.completed` (RWT-963 in QA). No card/wallet/credits/processor anywhere; Stripe is "later". QA asked on 6 Nov whether Technical then Administrative ordered separately = 1 or 2 units (our model: 2).
- Self-service (RWT-1031) is "Later", unassigned, blocked by Registry + both Bouncer areas; audience is an open business decision.
- Prototype: `@realwired/ui` used in 2 files; the vendored tarball (24 Aug) has no overlays folder (no Dialog/Toast/Callout/OptionCard/HandoffBridge). Session store has no user/org/role. Roles are owner/admin/reviewer/viewer. Debit must hook both `onStart` handlers. `mock-adapter.clear()` wipes prefs.

## 4. Flows and screens (canvas boards, each light + dark)

A Keycloak: A1 Create account · A2 Verify · A3 Sign in · A4 Reset.
B Org setup: B1 Set up your organization · B2 How you'll get started · B2b Talk to us first · B3 Pending approval · B4 Ready.
C First-run Home: C1 Home day one (1 of 6) · C2 Home a week in (4 of 6, toast) · C3 Sample review open · C4 Checklist dock on Reviews + hide menu.
D Cost at Start: D1 trial · D2 paid · D3 not enough credits (+ reviewer inset) · D4 Add credits · D5 Receipt.
E Billing: E1 Billing & credits · E2 Payment tab + auto-reload on · E3 Plans (flag) · E4 reviewer view · E5 invoiced org · E6 monthly statement.
F Security pack: F1 page · F2 sent state. G Bouncer: G1 bridge · G2 back with a member. H Value dashboard: H1. I E-mails: I1.

Demo cast: Harbor Community Bank (Dana Reyes org_admin, Marcus Ortiz reviewer, Priya Natarajan approver); sample 4410 Bayside Office Park, Norfolk VA; Meridian Trust (org-001) as the invoiced YouConnect org. Full copy per screen: `self-serve/screens-spec.md` (approved 6 Nov; deviations per phase report).

## 5. Routes and structure (keep `(shell)` untouched)

| Route | Where | Owner | Status |
|---|---|---|---|
| `/auth/sign-in · create-account · verify · reset · mfa` | new `(auth)` group, `KeycloakFrame` template with a "theme reference" tag; `/login` redirects | Keycloak | new |
| `/welcome · /welcome/path · /welcome/pending · /welcome/ready` | new `(onboarding)` group, deep-linkable | Parachute | new |
| `/dashboard` | `useDashboard` derives `orgStage` new/active → FirstRunHome or today's dashboard | Parachute | branched |
| `/reviews/review-sample` | seeded `sample: true`, banner, Sample chip, excluded from counts | Parachute | new seed |
| `/configure/billing` | Configure card "Billing & credits"; Overview · Activity · Payment · Plans (flag); TopUpModal + ReceiptDialog mounted in AppShell | Parachute + RM | new; Organization Billing tab removed |
| `/configure/security` | Configure card; Home card; link on Pending | Parachute | new |
| `/launch/bouncer → /bouncer` | generalised bridge + Bouncer mock (as `/youconnect`) | Bouncer | new mock |
| Cost at Start | `RunConfirm` footbar; debit in both `onStart`s | Parachute | existing file |
| `/start · /demo/[persona] · ?persona=` | prototype-only persona switcher | — | extended |

State (additive): `OrgProfile`, `BillingModel` trial/payg/invoiced, `ApprovalState`, `CreditLedgerEntry`, `WalletSettings`, `SetupProgress`, `Review.sample`, `User.orgId`; roles → reviewer/approver/org_admin. Collections `credit_ledger`, `wallet_settings`, `setup_progress`. Stores `wallet` (balance derived), `onboarding`, `demo`; `session` + user/org/role; `org` + profile/billing/approval/flags. Adapter rule kept.

## 6. Demo personas (`data/seed/demo-personas.seed.ts`, env `NEXT_PUBLIC_DEMO_PERSONAS`)

prospect · prospect-sales · pending-admin (Lakeside Valuation) · trial-admin (Dana, HCB, 4 credits, 3/6) · payg-admin-low (Cedar Ridge CB, 1 credit) · reviewer (Marcus) · approver (Priya) · enterprise-yc (user-001, Meridian, embedded, invoiced) · returning (user-001 today). Pick via `/start` cards, sign-in "Demo accounts" disclosure, user-menu switch, floating demo dock (reset / approve / +credits), `/demo/<id>`, `?persona=`. Reset re-seeds one org's rows only.

## 7. Design system

Compose from `@realwired/ui`; library additions (parallel track): `Chip.meta`, `FileRow` leading/tone, `Callout variant="band"`, `SetupChecklist` organism, `ProgressRing` atom, `SegmentBar` (generalising CoverageBar; reconcile with Reporter's StackedMiniBar), `AuthCard` story + `static.css` export for Keycloak themes. `TaskFooter.gate` already carries the cost line. Re-pack the prototype tarball from the current library in Phase 0. Drift guards: tokens only, navy primaries, petrol for links/focus/AI, white inputs in light only, white paper for documents, no mono, small captions in ink-2 (ink-3 fails AA on dark at 12 px).

## 8. Phases

0 Scaffolding (M): types, roles migration, pricing constants, collections + seeds, stores, persona switcher, tarball repack, ToastProvider.
1 Account and org (M): (auth) group + KeycloakFrame; (onboarding) group; createOrg, requestSales, approve, grantTrial.
2 First-run Home (M): orgStage; FirstRunHome, SetupChecklist, SetupDock, WalletCard, SecurityPackCard; verified completion hooks; `/configure/security`; sample banner.
3 Wallet and cost (L): `/configure/billing`; TopUpModal, ReceiptDialog, ledger, PlansPanel; CostLine + LowBalanceCallout in RunConfirm; debit; invoiced orgs.
4 Bridges and polish (S–M): Bouncer bridge + mock with a full invite screen (e-mail, role pick reviewer/approver/org_admin, pending invites, resend/revoke; Val 6 Nov: show the whole invite flow, in Bouncer where Realwired puts it); value placeholder; e-mail previews; docs, AGENTS.md, feedback-log rows.

Each phase ends with a persona tour; Loom per phase for Ed.

**Build status (8 Nov 2026), branch `feat/self-serve-onboarding`:** Phase 0 `a539e1f` · Phase 1 `16337ad` · Phase 2 `84da718` · Phase 3 `af0cefe` · Phase 4 in progress. Each phase has a brief and a report in `self-serve/`. D1–D12 were taken as recommended on 6 Nov. The screen copy in `self-serve/screens-spec.md` is the approved copy, with the deviations listed in each phase report: 8 setup steps (9 with the invite step) instead of 6; HCB balance 13 instead of 9; pack prices from `pricing.ts`. Loom recordings for Ed are not yet made.

## 9. Decisions for Val (recommended letter first)

D1 unit on screen: a credits + dollars · b dollars only · c documents. D2 trial: a sample + 3 full, usage-capped · b 90-day expiry · c Ed's 2–3 no sample. D3 billing location: a `/configure/billing` card · b Organization tab. D4 landing for new orgs: a Home until setup done · b Launchpad always. D5 mock Keycloak: a `(auth)` group with reference tag · b keep `/login` beside. D6 persona switcher: a all surfaces + dock · b cards + deep links. D7 branch: a from feat/design-system-consume · b from main. D8 library now: a variants + 4 new parts · b variants only · c none. D9 reviewer billing: a read-only + ask admin · b hidden. D10 members in Parachute: a read-only mirror + Bouncer link · b link only. D11 review mode: a canvas comments · b screenshots. D12 Ed sees: a canvas + summary after Val's pass · b wait for Phase 1 Loom.

## 10. Questions for Ed / Realwired

Prices on screen (and the RWT-963 "1 or 2 units" question) · instant activation vs staff approval for card-verified small teams · where the balance lives (Registry items vs new ledger) and the processor · trial on borrower files · Keycloak theme repo + assets · read-only member list allowed? · the 50–200 band · engine v2 JSON · security pack contents and tone · two rounds of revision · Editor requests + Keycloak user story · finance rules for prepaid funds.
