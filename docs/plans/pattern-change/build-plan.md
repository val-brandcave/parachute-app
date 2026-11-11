# Pattern change Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Ship the pattern change (onboarding option C, Get started v4, header credits, focused checkout, billing states, lock-then-explain, tours, Trust and Learning, prototype state controls) into the Parachute prototype in six visible phases, each one working and committed on its own.

**Architecture:** A coordinator lands each phase's shared contracts (types, pure `lib/*` logic with unit tests, store signatures, stubs and mount points) first; parallel subagents then build UI in exclusive file sets against those contracts. All new variants are local components that wrap `@realwired/ui` where it has the part, tagged `// DS-candidate:`; the review stays a full-viewport `.run` takeover and everything that opens over it uses the lifted z-tiers.

**Tech Stack:** Next.js 16.2.9 (App Router) · React 19.2.4 · TypeScript 5 · Tailwind v4 + `globals.css` tokens · Zustand 5 · framer-motion 12.40 · `@realwired/ui` 0.1.0 (vendored tgz, read-only) · Tabler icons · new: `canvas-confetti@1.9.4`, `react-joyride@3.2.0`, dev `vitest@3.2.4`, `@types/canvas-confetti@1.9.0` · verification: Python Playwright 3.13 with `channel="chrome"` (bundled browsers are not installed).

**Spec:** `docs/plans/pattern-change/spec.md` (reconciled 11 Nov; §8 is the ownership contract, §11 the reconciliation log, Appendix A the DS-candidate list). Supporting: `motion-spec.md`, `motion-contract.md`, `state-system-draft.md`, `icon-map.md`, `illustration-guide.md`, `reconcile/A–D`.

Paths are relative to `app/src/` unless they start with `app/` or `docs/`.

---

## Global Constraints

- House rules: `app/AGENTS.md` wins over anything here; read it before every task.
- Next 16 has breaking changes: read the relevant guide in `app/node_modules/next/dist/docs/` before using a routing or layout API (`template.tsx`, `redirect`, `useSearchParams`).
- Fonts: Schibsted Grotesk + Inter only; **no monospace anywhere**; numbers use Inter `tabular-nums` (`.mono` is sans + tnum).
- Primary CTAs navy `#10344C` (hover `#1B4F73`, `--grad-primary`); petrol `#2A6F7F` only for links, focus and the one AI cue; selected surfaces `--md-selected`.
- Icons: Tabler via the `Icon` atom (`components/atoms/Icon.tsx`) only; new names are added by the coordinator in T0.2; no inline SVG except `Illustration` and `BrandGlyph`.
- Never disable an action: `aria-disabled="true"` + reason (`aria-describedby`) + a click that explains (lock = credits or role, `hourglass-high` = waiting on Realwired). No hover-only actions.
- Tokens only, light and dark both checked; inputs white in light mode, theme-aware in dark; no hardcoded content widths (fixed card widths on centred stages and the checkout `336px` aside are allowed).
- Every floating layer: portal to `document.body`, `position: fixed`, flip/clamp, dismiss on outside-click, Esc, scroll (capture) and resize.
- Z-tiers (PC-31): `.run` 120 · tour overlay 126 / tooltip 128 · run Sign modal and `--rw-z-overlay` 130 · `--rw-z-modal` 140 (anything over a review, `LockDialog`) · toast 150 · tooltip 160 · popovers 200 · confetti 201 · prototype pill 210.
- Motion (`lib/motion.ts` only, never inline): `ease.standard` `[0.2,0,0,1]`, `ease.enter` `[0.05,0.7,0.1,1]`, `ease.exit` `[0.3,0,1,1]`; `dur` quick 0.15 / standard 0.28 / slow 0.48 / fill 0.4 / shake 0.3 / reducedFade 0.12; entrance opacity + 12 px; stagger 60 ms, ≤ 400 ms total; no springs on new UI; reduced motion = no travel, 120 ms fades, no confetti.
- Every commercial number from `lib/pricing.ts`; no 2, 3, 4, 6, 14, 140 or price typed into copy.
- `text-wrap: pretty` on short copy (class from T0.2).
- React 19 purity: no `Date.now()`/`Math.random()` in render; pure functions take `now`.
- Layering: Page → page hook → store → adapter. Pages never touch the adapter.
- New CSS in the owning feature's stylesheet; `globals.css`, barrels, `AppShell.tsx`, `package.json` are coordinator-only.
- New variants wrap a DS part where one exists and carry `// DS-candidate: <name> — <why>`; never edit or repack `app/vendor/realwired-ui-0.1.0.tgz`.
- Git: work on `feat/pattern-change`; subagents never commit, stash, reset or checkout; coordinator commits once per phase after `git checkout app/tsconfig.json`; **never commit `docs/meetings/`**.
- Windows: never redirect to `nul` (use `> /dev/null 2>&1` or no redirect); parallel dev servers use `NEXT_DIST_DIR=.next-<task> npx next dev -p 31<nn>`.

---

## Review Focus

Five failure modes that type checks and unit tests on their own won't catch. Each is pinned by a test in the task named.

1. **RF1 · Layers over the review takeover.** A dialog or tour renders behind `.run` (z 120), or Esc closes the whole review under a dialog. Pinned by flow `t4_3_review_setup.py::lock_over_takeover` (T4.3): `elementFromPoint` at the dialog centre lands inside the lock dialog; Esc closes the dialog and `.run` stays attached; and by `t5_1_tours.py::first_review_tooltip_visible` (T5.1).
2. **RF2 · Shortfall vs cost.** `needed` passed as the full review cost (today's bug B1) prefills checkout wrong. Pinned by `lib/lock-reasons.test.ts › "credits reason carries the shortfall"` (T4.0), `lib/checkout.test.ts › "initialChoice(1) is custom 1"` (T3.0) and flow `t3_3_reroute.py::short_by_one_prefills_one` (T3.3).
3. **RF3 · One balance everywhere.** Pill, sidebar Balance, Billing hero, popover and `CostSummary` disagree. Pinned by `lib/prototype/recipes.test.ts` (T0.6) and flow `t2_2_credits_chrome.py::numbers_agree` (T2.2) over four personas.
4. **RF4 · Return from checkout.** Open redirect through `return`, or the Start selection lost on the round trip (including a hard reload on checkout). Pinned by `lib/checkout.test.ts › safeReturn` (T3.0) and flow `t3_3_reroute.py::round_trip_with_reload` (T3.3).
5. **RF5 · `disabled` creeping back.** Agents reach for `disabled` on Start, Pay, Continue or Send. Pinned by the gate grep (every phase) and flow `t4_2_start_sites.py::every_site_explains` (T4.2): each Start site in the `pending-admin` persona has `aria-disabled="true"`, no `disabled` attribute, and opens the lock dialog on click.

---

## Orchestration

**Who runs it.** One coordinator session (this plan's executor) on `feat/pattern-change` in the main working tree. Subagents work in the same tree on disjoint files (spec §8); no worktrees, so nothing needs merging.

**Per phase:**
1. **Foundation (sequential, coordinator):** run T*n*.0 yourself. It lands contracts and mount points, and **pre-creates every new file the phase's owners will fill that is imported across folders or exported from a barrel** (a stub with the final props that renders `null` or returns a placeholder), with its barrel export. Owners fill stubs and never edit barrels; the one exception is an owner who deletes a file, who removes that file's own export line (one such owner per barrel per phase). Run the foundation's unit tests and `npx tsc --noEmit` clean before dispatching.
2. **Dispatch owners (parallel):** send every owner task of the phase in **one message** (one Agent call each), each with the brief below and its exclusive file list.
3. **Review (per task):** when a task reports done, dispatch a reviewer subagent with the reviewer brief. Send findings back to the same implementer (SendMessage) until the reviewer passes it. Reviews of different tasks run in parallel.
4. **Phase gate (coordinator):**
   - [ ] `cd app && npx tsc --noEmit` → exit 0
   - [ ] `cd app && npx eslint src` → 0 errors, 0 warnings in touched files
   - [ ] `cd app && npm test` → all green
   - [ ] House-rule greps return nothing (from `app/src`): `grep -rnE "disabled=\{(locked|!canPay|!canStart|!canContinue)" .` · `grep -rniE "font-family:[^;]*mono|IBM Plex Mono|JetBrains" . --include=*.css --include=*.tsx` · `grep -rn 'IconCoins\|name="coins"' . | grep -v atoms/Icon.tsx` (from phase 2) · `grep -rnE "(href|push\().*review-sample" .` (from phase 2; the sample stays reachable only by URL)
   - [ ] Start one dev server (`cd app && npm run dev`), run every flow so far: `python app/scripts/smoke.py --all --base http://localhost:3000 --out app/.smoke/phase-<n>` → exit 0 (200s, no console or page errors, assertions pass), screenshots at 1440×900 and 390×844 in light and dark
   - [ ] Coordinator opens 4–6 key screenshots itself and checks them against the board frames named in the tasks
   - [ ] **Val looks at it in the browser.** Post the route list + personas to try; wait for "go"
   - [ ] `git checkout app/tsconfig.json`; `git status` shows only phase files and `docs/plans/pattern-change/reports/`; commit
5. **Commit:** one per phase: `feat(pattern-change): phase <n> — <title>` with the attribution trailer. Phase 0's commit also adds `docs/plans/pattern-change/` (spec, plan, audits); ask Val before adding `docs/references/pattern-audit-nov-2026/`, and leave the unrelated `docs/plans/parachute-v2-client-questions.md` edit to Val.

**Parallel vs sequential:**

| Phase | Sequential (coordinator) | Parallel owners |
|---|---|---|
| 0 | T0.1 → T0.2, then T0.6 after the parallel set | T0.3 ∥ T0.4 ∥ T0.5 |
| 1 | T1.0 | T1.1 ∥ T1.2 ∥ T1.3 ∥ T1.4 |
| 2 | T2.0 | T2.1 ∥ T2.2 ∥ T2.3 |
| 3 | T3.0 | T3.1 ∥ T3.2 ∥ T3.3 |
| 4 | T4.0 | T4.1 ∥ T4.2 ∥ T4.3 ∥ T4.4 |
| 5 | T5.0, then T5.9 last | T5.1 ∥ T5.2 ∥ T5.3 ∥ T5.4 ∥ T5.5 |

**Agent brief (paste per task, fill the `<>`):**

```
You are implementing Task <Tn.k: title> of docs/plans/pattern-change/build-plan.md.
Repo: C:\Users\vvrsv\OneDrive\Desktop\parachute (app in app/, code in app/src/), branch feat/pattern-change.
Read first: app/AGENTS.md; build-plan.md "Global Constraints", "Review Focus" item <RFx if any> and Task <Tn.k>; spec.md <§…>; <motion-spec §… / icon-map / illustration-guide if relevant>.
You own ONLY these files (create/modify/delete nothing else): <list from the task>.
Need a change elsewhere? Add it under "Requests" in your report and work around it; do not edit it.
Consumes (already in the tree): <names + signatures from the task>.
Produces (others import these exact names): <names + signatures>.
Build each "// DS-candidate:" item the task lists, wrapping the named @realwired/ui part.
Done means:
- every checkbox in your task is ticked;
- `cd app && npx tsc --noEmit 2>&1 | grep -E "<your path prefixes>"` prints nothing;
- `cd app && npx eslint <your files>` is clean; `npm test -- <your test files>` is green;
- your flow passes on your own server: `NEXT_DIST_DIR=.next-<task> npx next dev -p 31<nn>` then `python app/scripts/smoke.py --flow <flow> --base http://localhost:31<nn> --out app/.smoke/<task>`; you looked at the screenshots.
Write docs/plans/pattern-change/reports/<phase>-<task>.md: before → after per place, deviations, DS-candidates added, requests, open items.
Never commit, stash, reset or checkout. Never redirect to nul. Never touch docs/meetings/.
Reply with: files changed, test/flow results, deviations, requests.
```

**Reviewer brief:**

```
Review Task <Tn.k> of docs/plans/pattern-change/build-plan.md. Do not edit files.
Read: app/AGENTS.md, build-plan.md Global Constraints + Review Focus + Task <Tn.k>, spec.md <§…>, the board frames <ids> in docs/plans/pattern-change/proposed-screens/.
Diff: `git diff -- <owned paths>` plus new files <list>. Screenshots: app/.smoke/<task>/.
Check: spec copy and states; every interface name/signature; house rules (no disabled, no mono, navy primary, tokens both themes, portals, z-tier, motion tokens, pricing constants); files touched outside the owned list; DS-candidate comments present; tests assert behaviour, not implementation.
Return: PASS, or a numbered list of issues each with file:line, the rule or spec line it breaks, and the fix.
```

---

## Phase 0 · Foundation (no new UI)

### Task 0.1: Test runner and smoke harness (coordinator)

**Files:**
- Modify: `app/package.json` (devDeps `vitest@3.2.4`, `@types/canvas-confetti@1.9.0`; deps `canvas-confetti@1.9.4`; script `"test": "vitest run"`), `app/package-lock.json`, `.gitignore` (`app/.smoke/`)
- Create: `app/vitest.config.mts` (`environment: "node"`, `include: ["src/**/*.test.ts"]`, `resolve.alias { "@": <app/src> }`), `app/scripts/smoke.py`, `app/scripts/flows/__init__.py`, `app/scripts/flows/t0_baseline.py`

**Produces:** `npm test`; `smoke.py` CLI: `--base URL`, `--persona ID` (enters via `/demo/<id>`), `--routes /a /b`, `--flow NAME` (imports `flows.<NAME>`, calls `run(page, ctx)`), `--all` (every module in `flows/`), `--out DIR`, `--theme light|dark|both` (default both), `--widths 1440,390`. Launches `chromium.launch(channel="chrome")`; fails on non-2xx/3xx, `console.error`, `pageerror`; saves `<slug>-<persona>-<theme>-<w>.png`. Each flow module exposes `ROUTES`, `PERSONAS` and `run(page, ctx)`.

- [ ] Write `src/lib/__smoke__.test.ts` asserting `1 + 1 === 2`; run `npm test` → 1 passed. Delete it.
- [ ] `t0_baseline.py`: personas `trial-admin`, `pending-admin`, `reviewer`, `returning`; routes `/get-started /dashboard /reviews /configure/billing /launchpad /welcome`.
- [ ] Run `python app/scripts/smoke.py --flow t0_baseline --base http://localhost:3000 --out app/.smoke/baseline` → exit 0. These are the "before" screenshots for phase 0's no-change check.
- [ ] `npx tsc --noEmit` clean (vitest config is `.mts`, outside `src`).

### Task 0.2: Shared contracts: types, pricing, icons, tokens, illustrations, prefs, lock store (coordinator)

**Files:**
- Modify: `types/domain.types.ts`, `lib/pricing.ts`, `components/atoms/Icon.tsx`, `app/globals.css`, `store/prefs.store.ts`, `components/atoms/index.ts`, `store/index.ts`
- Create: `lib/pricing.test.ts`, `components/atoms/Illustration.tsx`, `components/atoms/illustrations/*.tsx` (one per SVG in `docs/plans/pattern-change/illustrations/`, `b` revisions preferred), `store/lock.store.ts`, stubs `lib/wallet-view.ts` (exported types + signatures, placeholder bodies) and `store/useWalletView.ts` (exported from `store/index.ts`) for T0.3 to fill

**Produces:**
- Types: `VolumeBand` adds `"unsure"`; `OrgProfile.callBookedAt?: Timestamp; callSlot?: string`; `SetupSectionId = "first_review" | "own_rules" | "team"`; `CreditLedgerEntry.setupSectionId?: SetupSectionId`; `CreditRequest { id; orgId; requesterId; note?; createdAt; status: "open"|"opened"|"fulfilled"|"dismissed"|"cancelled"; openedAt?; resolvedAt?; remindedAt? }`; `WalletSettings.receiptCc?: string`.
- `lib/pricing.ts`: `SETUP_REWARD_SECTIONS: SetupSectionId[] = ["first_review","own_rules"]`, `EARN_WINDOW_DAYS = 14`, `EARN_ENDING_DAYS = 2`, `LOW_BALANCE_AT = 3`, `INVOICED_CREDIT_USD = 140`, `VOLUME_BAND_LABEL: Record<VolumeBand,string>`, `routeForProfile(p: { teamBand: string; volumeBand: string }): "enterprise" | "self_serve"`, `earnWindow(grantAt: number, now: number): { endsAt: number; daysLeft: number; state: "open"|"ending"|"closed" }`, `autoReloadTimesPerMonth(): number`. Delete `TRIAL_EXPIRY_DAYS` (unused). `EARNED_LIFE_DAYS` is deleted by T0.3, which owns its importers. Keep `EARN_REWARD_CREDITS = 1`, `EARN_CAP_CREDITS = 3`, `SETUP_REWARD_STEPS` until T2.0.
- `Icon` names (spec §5.14): `school, hourglass-high, circle-dashed, progress, file-search, messages, calendar-event, wand, switch-horizontal, sitemap, wallet-off, file-invoice, arrow-up-right, stack-2, calculator, receipt-refund`, plus `gift` if missing.
- `globals.css`: `.tw-pretty { text-wrap: pretty }` and the rule on `h1–h4, p, li, .ui-chip, .ui-callout`; `--ill-*` (illustration-guide §3, both themes); `--viz-tech #1d5592 / --viz-admin #0a9fae` (dark `#3a74c0 / #14a7b6`); `--z-run: 120; --z-tour-overlay: 126; --z-tour: 128; --z-celebrate: 201; --z-proto: 210`.
- `Illustration({ name: IllustrationName; size?: number; panel?: boolean; title?: string })`, `aria-hidden` unless `title`.
- Prefs: `celebratedBy`, `toursSeen`, `hintsSeen`, `videoProgress`, `protoHidden` with setters `markCelebrated(userId, kind)`, `setTourSeen(userId, tourId, v)`, `markHintSeen(userId, id)`, `setVideoProgress(userId, videoId, p)`, `clearCelebrationsAndTours(userId)`.
- `store/lock.store.ts`: `useLockStore` with `reason: LockReason | null`, `openLock(reason, opts?: { returnFocus?: HTMLElement | null })`, `close()`; `LockReason` exactly as spec §5.5.

- [ ] Write `lib/pricing.test.ts`: `routeForProfile › "11+ team → enterprise"`, `"200+ volume → enterprise"`, `"unsure volume → self_serve"`, `"2-10 / lt50 → self_serve"`; `VOLUME_BAND_LABEL › "200 appears in exactly one label"` (`"50–199"`, `"200+"`); `earnWindow › "day 0 open, 14 left"`, `"day 12 ending"`, `"day 14 closed, 0 left"`; `autoReloadTimesPerMonth() === 2`; `"TRIAL_EXPIRY_DAYS is gone"` (`"TRIAL_EXPIRY_DAYS" in pricing === false`).
- [ ] Run `npm test -- src/lib/pricing.test.ts` → fails (functions missing). Implement. Run → passes.
- [ ] Generate the illustration components from the SVGs (script in the scratchpad, not committed); replace fixed colours with `var(--ill-*)` / `currentColor` per illustration-guide §3.
- [ ] `npx tsc --noEmit` clean; `grep -rn "TRIAL_EXPIRY_DAYS" app/src` → nothing.

### Task 0.3: One wallet derivation and the PC-16 spend order (agent W)

**Files:** Fill stubs `lib/wallet-view.ts`, `store/useWalletView.ts`. Create `lib/wallet-view.test.ts`. Modify `lib/pricing.ts` (delete `EARNED_LIFE_DAYS` only), `app/emails/content.ts` (earned-lifetime line), `store/wallet.store.ts`, `lib/wallet-breakdown.ts`, `components/organisms/BalancePill.tsx`, `components/organisms/billing/{useBilling.ts,OverviewTab.tsx,billing-data.ts}`, `components/organisms/billing/settings/settings-data.ts`, `components/organisms/wallet/{TopUpModal.tsx,WalletCard.tsx}`, `components/organisms/DemoDock.tsx`, `components/organisms/dashboard-widgets.tsx`, `components/run/CostSummary.tsx`.

**Consumes:** `LOW_BALANCE_AT`, `costFor`, `AUTO_RELOAD_DEFAULTS`, `PURCHASED_LIFE_MONTHS` (T0.2).
**Produces:**
- `walletView(ledger: readonly CreditLedgerEntry[], opts: { now: number; approval?: ApprovalState; billing?: BillingModel }): WalletView` where `WalletView = { balance; bySource: { trial; earned; purchased }; fullReviews; usedThisMonth; runwayDays: number | null; runsOutOn: number | null; lowTone: "ok" | "low" | "zero"; held: boolean; grants: BalanceGrant[] }`.
- `usageByType(ledger, period: { from: number; to: number }): { technical: number; administrative: number; total: number }` and `usageByPerson(ledger, period): { userId: string; credits: number }[]` (desc, refunds net out).
- `autoReloadDue(ledger, settings: WalletSettings, now: number): boolean` (below `reloadBelow` after a debit, within `monthlyCap`).
- `useWalletView(): WalletView` in `store/useWalletView.ts` (`now` from a lazy `useState`); `balance()` and `remainingBySource()` in `wallet.store.ts` delegate to `walletView`.
- `spendOrderSentence()` → "Credits that expire soonest are used first: purchased packs (oldest first), then earned, then trial."

- [ ] Write `lib/wallet-view.test.ts`: `"fresh 6 trial → balance 6, fullReviews 3, lowTone ok"`; `"PC-16: purchased oldest pack first, then earned, then trial"` (trial 6, pack5 @t1, pack10 @t2, earned 2, debit 7 → pack5 0, pack10 8, earned 2, trial 6); `"sourcesFor follows PC-16"`; `"balance equals sum of grant remainders equals remainingBySource total"` over five ledgers; `"lowTone 4 ok · 3 low · 1 low · 0 zero"`; `"earned grants never expire"` (and `"EARNED_LIFE_DAYS" in pricing === false`); `"usageByType nets refunds; period is [from, to)"`; `"usageByPerson sorts desc"`; `"autoReloadDue respects threshold and monthly cap"`.
- [ ] Run → fails. Implement `walletView` on top of `balanceGrants` (reordered to PC-16 in `wallet-breakdown.ts`) and make `remainingFromLedger`/`sourcesFor` use the same order. Run → passes.
- [ ] Replace the `coins` icon in `CostSummary.tsx` and `DemoDock.tsx` with `wallet` (spec §5.14).
- [ ] Migrate every reader to `walletView`/`useWalletView` (spec §6 P0 list); `TopUpModal` uses `AUTO_RELOAD_DEFAULTS` and `autoReloadDue`; `settings-data.ts` `ALERT_DEFAULTS.lowBelow = LOW_BALANCE_AT`; `OverviewTab` low tone from `lowTone`, not `runwayWarn`.
- [ ] `grep -rn "ledger.reduce\|remainingOf(" app/src/components` → nothing outside `lib/` and the store.
- [ ] Flow: `t0_baseline` still passes; compare screenshots with `app/.smoke/baseline`: only number/copy differences where the old derivations disagreed. List them in the report.

### Task 0.4: Motion foundation (agent M)

**Files:** Create `lib/motion.ts`, `lib/motion.test.ts`, `lib/celebrate.ts`, `components/providers/MotionProvider.tsx`. Modify `app/layout.tsx` (wrap children in `MotionProvider`, next to `ToastHost`).

**Consumes:** `usePrefsStore().celebratedBy / markCelebrated` (T0.2), `canvas-confetti` (T0.1).
**Produces:** exactly `motion-spec.md` §1 (`ease`, `dur`, `dist`, `stagger`, `staggerFor`, `Dir`, `stepVariants`, `stepVariantsReduced`, `riseIn`, `cardHeight`, `cardMove`, `useStepVariants`, `useMotionMode`, `motionOff`, `setHandoff`, `takeHandoff`, `markArrival`, `takeArrival(now?: number)`) and §6.2 (`celebrate(kind: "onboarding" | "approval", userId): Promise<boolean>`, `burstFrom(el: HTMLElement): Promise<void>`).

- [ ] Write `lib/motion.test.ts`: `"tokens match motion-contract"` (every number above); `"staggerFor(1) is 0.06"`; `"staggerFor(20) * 19 <= 0.4"`; `"motionOff true under navigator.webdriver"` (stub `globalThis.navigator`); `"?motion=1 forces motion on"` (stub `location.search` + `sessionStorage`); `"takeArrival returns null after 10 s"` (inject `now`); `"takeArrival reads once"`.
- [ ] Run → fails. Implement. Run → passes.
- [ ] `celebrate`: dynamic `import("canvas-confetti")`; canvas portaled with `z-index: var(--z-celebrate)`, `pointer-events: none`, `aria-hidden`; two-sided burst + second wave per contract; skips unless `useMotionMode() === "full"` but still marks the flag under reduced motion.
- [ ] `npm run build` is not required; check `/get-started` first-load JS doesn't include `canvas-confetti` by grepping `.next/static/chunks` for `confetti` only in an async chunk.
- [ ] Flow `t0_baseline` passes (motion off under webdriver; no visual change).

### Task 0.5: Scenario core and registry skeleton (agent S)

**Files:** Create `lib/prototype/scenario.ts`, `lib/prototype/scenario-builder.ts`, `lib/prototype/scenario-builder.test.ts`, `lib/prototype-registry.ts`.

**Consumes:** types and pricing from T0.2. **Produces:** `Scenario` (spec §6 axes: `audience: "self_serve"|"enterprise"|"youconnect"`, `lifecycle`, `wallet: "held"|"fresh"|"trial"|"healthy"|"low"|"short"|"zero"|"invoiced"`, modifiers `bonus: "open"|"ending"|"closed"`, `autoReload`, `expiring`, `paymentMethod`, `request: "none"|"open"`, `setup`, `role`, `data`); `normalize(sc: Scenario): { scenario: Scenario; notes: string[] }`; `buildLedger(sc: Scenario, now: number, orgId: string): CreditLedgerEntry[]`; `buildSetupProgress(sc, now, orgId)`; registry types per `state-system-draft.md` §4.1 (with the §6 axis changes), `SCREENS` for Get started, Billing, Dashboard, `screenForPath(pathname)`, `activeState(screen, sc, view)`.

- [ ] Write `scenario-builder.test.ts`: `normalize › "pending forces held, empty, enterprise"`, `"youconnect forces invoiced, done, approved"`, `"invoiced turns off autoReload and expiring"`; `buildLedger › "fresh = one trial_grant 6 at now−1h"`, recipe balances via a local sum: `trial 4`, `healthy 14`, `low 3 (2 trial + 1 purchased)`, `short 1`, `zero 0`, `held` → `[]`; `"+expiring adds pack5 at now−359d with 3 left"`; `"bonus ending sets the grant so earnWindow is ending"`; `"same now → same ids"` (deterministic).
- [ ] Run → fails. Implement. Run → passes. No store or adapter imports in these files.

### Task 0.6: Mount points and the recipe cross-check (coordinator)

**Files:** Modify `components/templates/AppShell.tsx`, `components/organisms/index.ts`, `components/molecules/index.ts`. Create stubs (each `export function X(props: <final props>) { return null; }`): `components/organisms/CreditsPill.tsx`, `SidebarResourceLinks.tsx`, `LockDialog.tsx`, `CheckoutLauncher.tsx`, `HeaderChipSlot.tsx`, `components/organisms/tour/TourHost.tsx`, `components/organisms/prototype/ProtoPill.tsx`. Create `lib/prototype/recipes.test.ts`.

**Produces:** `header.end` = `SearchTrigger · <CreditsPill/> · bell · UserMenu` (PC-30); `header.start` = `Breadcrumbs` + `<HeaderChipSlot/>`; `sidebarFooter` = `<SidebarResourceLinks collapsed/> → BalancePill → OrgCard`; overlays add `<LockDialog/> <CheckoutLauncher/> <TourHost/> <ProtoPill/>` (DemoDock and TopUpModal stay mounted).

- [ ] Write `recipes.test.ts`: for each wallet recipe, `walletView(buildLedger(sc, NOW, "org-hcb"), { now: NOW }).balance` equals the spec §6 number and `lowTone` is `low` for `low`/`short`, `zero` for `zero`.
- [ ] Run → passes (T0.3 and T0.5 merged). If it fails, the recipe or the derivation is wrong: fix at the source task.
- [ ] Gate (phase 0). Screenshots match `baseline` except the documented number fixes. Commit `feat(pattern-change): phase 0 — foundation (pricing, wallet view, motion, scenario core, mount points)`.

**Seed bump plan (decided here, executed in T2.0):** phases 0–1 change no seed rows; T2.0 batches the HCB pure-trial ledger, setup progress 2/8 and the step-list change, bumps `SEED_VERSION` `v22 → v23` once, and the phase 2 commit message carries the release note from spec §7. Phase 4's `credit_requests` collection starts empty (no bump). Anything later bumps to v24 with a note.

---

## Phase 1 · Onboarding

### Task 1.0: Onboarding contracts (coordinator)

**Files:** Modify `components/atoms/Button.tsx` (`busy?: boolean`: 16 px spinner, width held, `aria-busy`; DS-candidate), `components/molecules/SegmentedControl.tsx` (`press?: boolean`: scale 0.97 `dur.quick`; DS-candidate), `store/bouncer.store.ts`, `app/bouncer/_components/InviteDialog.tsx`, `store/org.store.ts`, `components/organisms/home/GetStarted.tsx` (one line), barrels. Create `components/atoms/ProgressBar.tsx`, `components/molecules/SelectTile.tsx`, `components/organisms/home/useArrivalCelebration.ts`, `app/scripts/flows/t1_0_contracts.py`, and stubs (with barrel exports) `components/organisms/onboarding/{OnboardingFrame,StepPanel,SetupInterstitial,InviteStep,CallBooking}.tsx`, `components/organisms/onboarding/useStepNav.ts`, `components/molecules/RoleSelect.tsx`.

**Produces:**
- `ProgressBar({ value?: number; segments?: { filled: boolean }[]; label: string })` (`role="img"` + visually hidden label; DS-candidate `ProgressBar/SegmentBar`).
- `SelectTile({ selected: boolean; onSelect(): void; children; tone?: "default" })` (DS-candidate).
- `sendInvites(invites: { email: string; role: Role }[], message?: string): Promise<InviteResult[]>`, `InviteResult = { email; status: "sent" | "already_member" | "already_invited" | "invalid" | "wrong_domain" }`.
- `bookCall(slot: { at: number; label: string }): Promise<void>` (sets `callBookedAt`, `callSlot`, `salesRequested`); `approve()` also grants `TRIAL_GRANT_CREDITS` once; `upsertStageOrg(input: NewOrgInput): Promise<Org>` keeps id `org-hcb`.
- `InviteStep(props: { orgName: string; domain?: string; onDone(result: { sent: number; skipped: boolean }): void })`; `CallBooking(props: { orgName: string; onBooked(slot): void; onLater(): void })`.
- `useArrivalCelebration(): { arrival: Arrival | null }` (reads `takeArrival()` once, fires `celebrate("onboarding", userId)` 200 ms after mount when `arrival.path === "self_serve"`).

- [ ] Flow `t1_0_contracts.py`: Bouncer mock `/bouncer` invite dialog still sends (one role for all rows) → toast shows; `/get-started?motion=1` after `sessionStorage` arrival `{path:"self_serve"}` shows a `canvas` with computed `z-index` 201 within 1 s; reload → no canvas.
- [ ] Implement; flow passes; `npx tsc --noEmit` clean.

### Task 1.1: Onboarding frame, org setup, routing, interstitial (agent H1)

**Files:** Create `app/(onboarding)/welcome/{layout,template}.tsx`, `app/(onboarding)/welcome/invite/page.tsx`, `app/(onboarding)/welcome/call/page.tsx`, `components/organisms/onboarding/onboarding.css`, `app/scripts/flows/t1_1_onboarding.py`. Fill stubs `components/organisms/onboarding/{OnboardingFrame,StepPanel,SetupInterstitial}.tsx`, `useStepNav.ts`. Modify `app/(onboarding)/welcome/page.tsx`, `app/(onboarding)/welcome/hooks/useWelcome.ts`, `components/organisms/onboarding/OrgSetupForm.tsx`.

**Consumes:** `routeForProfile`, `VOLUME_BAND_LABEL`, `upsertStageOrg`, `InviteStep`, `CallBooking`, `ProgressBar`, `Button busy`, `SegmentedControl press`, `Illustration`, motion tokens, `setHandoff/takeHandoff`, `markArrival`.
**Produces:** `OnboardingFrame({ children })` (measured height via `ResizeObserver`, `cardHeight` transition, panel from `usePathname()`, `mode: "steps" | "interstitial"`); `useStepNav(): { go(href: string, dir: Dir): Promise<void>; dir: Dir }`; `SetupInterstitial({ path: "self_serve" | "enterprise_booked" | "enterprise_later"; work: () => Promise<void> })`.

- [ ] Flow `t1_1_onboarding.py` (motion off): `self_serve`: `/welcome` → fill name, Bank, 2–10, Under 50 → button reads "Continue to Parachute" → click → `/welcome/invite`; progress `[aria-label="Step 2 of 2"]` present; skip → interstitial `role="status"` with 3 lines → `/get-started`. `enterprise`: pick 11+ → callout "Teams your size start with a short call" appears and button reads "Book a call" without submitting; back to 2–10 → callout gone. Empty name + click → inline error, focus on the name field, no `button[disabled]` in the card. "I'm not sure yet" → self-serve + "We'll offer a call later if you need one.". No text "sample" in any onboarding screen. Side panel title per step matches spec §5.1 copy.
- [ ] Implement per spec §5.1 and `motion-spec.md` §2–§5 (T2 entry, T3/T3b, T4, T5 exit). Delete the sample reassurance and `disabled` in `OrgSetupForm`.
- [ ] Flow passes at 1440 and 390 in both themes; check 1280×820 screenshots against board 1 frames 3–6 and `onboarding-layout-compare.html` option C.
- [ ] Record a `?motion=1` run (headed) for Val: T2 ≈ 600 ms, T3 height glide without snap.

### Task 1.2: Invite rows (agent H2)

**Files:** Fill stubs `components/organisms/onboarding/InviteStep.tsx`, `components/molecules/RoleSelect.tsx` (DS-candidate, on DS `Popover` as a listbox). Create `components/organisms/onboarding/InviteRow.tsx`, `lib/invites.ts`, `lib/invites.test.ts`, `components/organisms/onboarding/invite.css`, `app/scripts/flows/t1_2_invite.py`.

**Consumes:** `sendInvites`, `Button busy`, `ROLE_META` copy. **Produces:** `parseInviteList(text: string): { emails: string[]; duplicates: number }`; `validateInvite(email: string, domain?: string): null | "invalid" | "wrong_domain"`; `RoleSelect({ value: Role; onChange(r: Role): void; id: string })`.

- [ ] Write `lib/invites.test.ts`: `"splits on comma, semicolon, space and newline"`, `"trims and lowercases"`, `"dedupes and counts duplicates"`, `"invalid email → invalid"`, `"other domain → wrong_domain when a domain is set"`, `"no domain set → any valid email passes"`.
- [ ] Run → fails; implement; passes.
- [ ] Flow `t1_2_invite.py`: 3 rows, first focused, role Reviewer each; button "Send invites" → type one email → "Send 1 invite"; empty send → "Add at least one work email, or skip for now" under row 1; paste 12 emails → 12 rows, "Set all to" visible, list scrolls inside the card, "12 people", bigger-team callout past 10 rows (and Send still works); mixed roles in one send; seeded already-member email → row stays with "Already in Harbor Community Bank", summary "N invites sent · 1 already a member", primary "Continue"; `RoleSelect` opens with Enter, arrows move, Esc closes, `aria-expanded` toggles.
- [ ] Implement per spec §5.1 (PC-29) and motion micro-interactions (row add/remove `layout`, count cross-fade). Flow passes.

### Task 1.3: Book a call (agent H3)

**Files:** Modify stub `components/organisms/onboarding/CallBooking.tsx`, `app/emails/content.ts`. Create `lib/call-slots.ts`, `lib/call-slots.test.ts`, `components/organisms/onboarding/call.css`, `app/scripts/flows/t1_3_call.py`.

**Consumes:** `bookCall`, `SelectTile`, `Illustration` (`25-scene-call-booked`). **Produces:** `buildSlots(now: number): { day: { label: string; date: number }; times: { at: number; label: string }[] }[]`; `slotLabel(at: number): string`; emails `callBooked`, `enterpriseConfirmed`.

- [ ] Write `lib/call-slots.test.ts`: from Wed 11 Nov 2026 → days `Thu 12 · Fri 13 · Mon 16 · Tue 17 · Wed 18`; 8 times per day; `slotLabel` → `"Fri, Nov 13 at 10:00 AM"`.
- [ ] Run → fails; implement; passes.
- [ ] Flow `t1_3_call.py`: header "November 2026 · Eastern Time"; pick Fri 10:00 → button "Book Fri, Nov 13 at 10:00 AM" → booked state shows scene 25 in the card, panel without illustration → interstitial "Getting Harbor ready for your call" → `/get-started` pending; "I'll book later" → interstitial without the booking line; `/emails` lists "Call booked".
- [ ] Implement per spec §5.1 call rows. Flow passes.

### Task 1.4: Auth transitions T1 and the exit half of T2 (agent I1)

**Files:** Modify `components/templates/KeycloakFrame.tsx`, `components/organisms/auth/{CreateAccountForm,VerifyCodeForm}.tsx`, `components/molecules/CodeBoxes.tsx`, `app/(auth)/layout.tsx`. Create `app/scripts/flows/t1_4_auth.py`.

**Consumes:** motion tokens, `setHandoff`. **Produces:** verify success calls `setHandoff({ from: "verify", rect })` then `router.push("/welcome")`.

- [ ] Flow `t1_4_auth.py`: sign-up → verify → `/welcome` works with motion off; wrong code → boxes cleared, error shown, focus on box 1; direct load `/auth/verify` renders at rest; no `button[disabled]`.
- [ ] Implement per `motion-spec.md` §3.3, §3.4 (exit half) and §4 (verify-code rows). Flow passes; a headed `?motion=1` clip goes in the report.
- [ ] Phase 1 gate; commit `feat(pattern-change): phase 1 — onboarding option C, invites, book a call, interstitial`.

---

## Phase 2 · Get started v4, header credits, sidebar links

### Task 2.0: Sections, rewards, seeds v23 (coordinator)

**Files:** Modify `lib/setup-steps.ts`, `lib/pricing.ts`, `store/onboarding.store.ts`, `store/wallet.store.ts`, `lib/landing.ts`, `components/templates/AppShell.tsx` (nav "Get started n/8"), `data/seed/credit-ledger.seed.ts`, `data/seed/setup-progress.seed.ts`, `data/adapters/mock-adapter.ts`, barrels. Create `lib/setup-steps.test.ts`, `components/organisms/home/SetupSection.tsx`, `SetupRow.tsx`, `EarnPill.tsx`, `PendingTracker.tsx`, `ResourceCards.tsx`, `AllDone.tsx` (stubs with final props).

**Produces:** `SetupStepDef.section: SetupSectionId` (replaces `group`); `SETUP_SECTIONS: { id; title(kind); sub(kind, pending); reward: boolean }[]`; `sectionRewardDue(done: SetupStepId[], section: SetupSectionId, win: ReturnType<typeof earnWindow>, awarded: SetupSectionId[]): boolean`; `useWalletStore.awardSection(id: SetupSectionId): Promise<CreditLedgerEntry | null>`; `useSetupSummary()` counts 8; `EARN_REWARD_CREDITS = 2`, `EARN_CAP_CREDITS = 4`; `SETUP_REWARD_STEPS` deleted; `setupGuideVisible()` true for approved enterprise with unfinished setup; `SEED_VERSION = "v23"`.

- [ ] Write `lib/setup-steps.test.ts`: `"8 steps in 3 sections, in board order"`, `"no sample_review; tutorial in first_review"`, `"only first_review and own_rules carry rewards"`, `"bank vs appraisal-firm copy differs for own_rules"`, `sectionRewardDue › "all done inside window → true"`, `"window closed → false"`, `"already awarded → false"`.
- [ ] Run → fails; implement; passes. `grep -rn "SETUP_REWARD_STEPS" app/src` → nothing.
- [ ] Seeds: HCB = trial 6 + one full-review debit on 4410 Bayside → 4 credits; progress `first_review` + `invite` (Marcus joined Nov 11) → 2 of 8; bump v23.
- [ ] `t0_baseline` still loads every route (old `SetupChecklist` now reads `section`; keep it compiling until T2.1 replaces it).

### Task 2.1: Get started v4 (agent A)

**Files:** `components/organisms/home/**` except `useStartGate.ts` and `index.ts` (fill the T2.0 stubs; rewrite `GetStarted.tsx`; delete `SetupChecklist.tsx` `UpNext`/`DoneLine`, `HomeCards.tsx`; strip hover-reveal from `setup-checklist.css`; drop `home-grid` in `home-cards.css`), `app/(shell)/get-started/page.tsx`, `components/organisms/Skeletons.tsx`, `components/organisms/wallet/WalletCard.tsx` (delete) + `components/organisms/wallet/index.ts`, `components/organisms/EarnedToastHost.tsx`, `app/scripts/flows/t2_1_get_started.py`.

**Consumes:** T2.0 data + stubs, `ProgressBar`, `Illustration`, `useArrivalCelebration`, `burstFrom`, `earnWindow`, `useWalletView`. **Produces:** `EarnPill` with a `ref` for `burstFrom`; `PendingTracker({ steps: { label; date?; state: "done" | "current" | "todo" }[]; compact?: boolean })` (reused by T4.1).

- [ ] Flow `t2_1_get_started.py` (personas `trial-admin`, `pending-admin`, `reviewer`, `approver` + DemoDock "complete next step"): one column, no `.home-grid`; exactly one `.ui-btn--primary` per section; every row button visible at rest (`opacity` 1 without hover); earn pill text "Earn 1 free review · 2 credits", no `coins` icon; progress "2 of 8 done · N days left to earn"; pending: tracker with 3 steps, first section rows carry an hourglass and the section reads "Unlocks after your call"; reviewer: admin-only rows show "Ask Dana"; all-done: "All 8 done" card with spot `08b`; focus on `h1` after load; no "sample" text.
- [ ] Implement per spec §5.2 (PC-1, PC-35 navy-selected earn pill, PC-36 bodied hero). "Open review" and "Sign workbook" derive the first non-sample review of the org.
- [ ] Section burst: completing the last `own_rules` step plays `burstFrom(earnPill)` once (check with `?motion=1`).
- [ ] Flow passes; compare with board 1 frames 7, 9, 10 and `#get-started-dark`.

### Task 2.2: Header credits pill, popover, sidebar links (agent B)

**Files:** Fill `components/organisms/CreditsPill.tsx`, `SidebarResourceLinks.tsx`. Create `components/organisms/CreditsPopover.tsx`, `components/organisms/credits-chrome.css`, `app/(shell)/trust/page.tsx`, `app/(shell)/learn/page.tsx` (stubs: Trust renders `lib/security-pack.ts` documents; Learn lists `lib/guides.ts`), `app/scripts/flows/t2_2_credits_chrome.py`. Modify `components/atoms/CreditChip.tsx` (tones `zero`, `held`, `invoiced`; DS-candidate), `components/organisms/BalancePill.tsx`, `components/organisms/UserMenu.tsx` ("Invite your team" for admins → `INVITE_HREF`).

**Consumes:** `useWalletView`, DS `Popover`, DS `SidebarAction`, `Illustration` (`01-credits`, `09-approval-pending`). **Produces:** `CreditsPill()`; `CreditsPopover({ view: WalletView; role: Role; billing: BillingModel; onClose(): void })` (T4.4 adds the request card).

- [ ] Flow `t2_2_credits_chrome.py::numbers_agree` (RF3): for `trial-admin`, `payg-admin-low`, `approver`, `pending-admin`, the pill number = sidebar Balance number = `/configure/billing` hero number; pill text never contains "trial", "review" or "$".
- [ ] Flow: popover opens on click and Enter, Esc returns focus to the pill, closes on page scroll; low persona shows "Running low"; pending shows hourglass "Credits after your call"; reviewer shows "Ask Dana for more credits"; invoiced `returning` shows "38 credits used"-style used state while sidebar Balance is absent; "Add credits" navigates to `/configure/billing` until phase 3 (via `openTopUp`).
- [ ] Sidebar: "Trust Center" (`shield`) and "Learning Center" (`school`) rows above Balance, 19 px icons in the nav column, collapsed rail shows icons with tooltips; `/trust` and `/learn` return 200.
- [ ] Implement per spec §5.3, §5.4 (PC-5, PC-6, PC-22, PC-30). Flow passes; compare with board 1 `#credits-popover` (order per PC-30).

### Task 2.3: PC-4 sample sweep (agent X)

**Files:** `components/organisms/dashboard-widgets.tsx`, `components/organisms/billing/OverviewTab.tsx`, `app/(shell)/reviews/page.tsx`, plus any file `grep -rln "review-sample\|Open the sample" app/src` returns that T2.1/T2.2 don't own (list them in the report before editing). Create `app/scripts/flows/t2_3_sample_sweep.py`.

- [ ] Flow: `/dashboard`, `/reviews` (empty org), `/configure/billing` (fresh) contain no "sample" link; `/reviews/review-sample` still returns 200 (unlinked, PC-4).
- [ ] Remove the links and the Reviews level-1 aside (keep the `EmptyState` otherwise). Flow passes.
- [ ] Phase 2 gate (+ `IconCoins`/sample greps); commit `feat(pattern-change): phase 2 — Get started v4, header credits, Trust and Learning links (seed v23)` with the v23 release note in the body.

---

## Phase 3 · Checkout and billing

### Task 3.0: Checkout contracts (coordinator)

**Files:** Create `app/checkout/layout.tsx` (top-level focused frame; mounts `LockDialog`, `ReceiptDialog`), `lib/checkout.ts`, `lib/checkout.test.ts`, `components/organisms/checkout/CostBlock.tsx`, `components/organisms/checkout/index.ts`, and stubs (exported) `components/organisms/checkout/{CheckoutShell,AmountStep,PaymentStep,ReviewStep,PaidStep,OrderSummary}.tsx`, `components/molecules/HStepper.tsx`. Modify `store/wallet.store.ts` (`openTopUp` records `topUpIntent: { reason; needed?; request?: string } | null`, `clearTopUpIntent()`; `setBillingSettings` accepts `receiptCc`), `components/templates/AppShell.tsx` (remove `TopUpModal` mount), `lib/prototype-registry.ts` (checkout, Trust, Learn as Planned), barrels.

**Produces:** `safeReturn(raw: string | null | undefined): string`; `initialChoice(needed?: number): { pack: CreditPackId } | { credits: number }`; `checkoutHref(o: { credits?: number; pack?: CreditPackId; returnTo?: string; types?: ReviewType[]; request?: string; step?: CheckoutStep }): string`; `parseCheckoutQuery(sp: URLSearchParams): CheckoutDraft`; `CheckoutStep = "amount" | "payment" | "review" | "done"`; `CostBlock({ compact?: boolean })` (rows from `REVIEW_TYPE_COST`, `CREDIT_USD`).

- [ ] Write `lib/checkout.test.ts`: `safeReturn › "/reviews/abc kept"`, `"//evil.example → /configure/billing"`, `"https://x → /configure/billing"`, `"/checkout/credits → /configure/billing"`, `"empty → /configure/billing"`; `initialChoice › "1 → custom 1"` (RF2), `"5 → pack5"`, `"6 → pack10"`, `"undefined → DEFAULT_PACK_ID"`, `"30 → custom 30"`; `checkoutHref › "encodes return and types"`; `parseCheckoutQuery › "clamps credits to CUSTOM_CREDITS"`, `"unknown pack → DEFAULT_PACK_ID"`, `"unknown step → amount"`.
- [ ] Run → fails; implement; passes.
- [ ] Until T3.3 lands, `CheckoutLauncher` is still a stub: Add credits clicks do nothing visible for one task window; that's expected inside the phase.

### Task 3.1: Checkout pages (agent F1)

**Files:** Create `app/checkout/credits/page.tsx`, `app/checkout/credits/hooks/useCheckout.ts`, `components/organisms/checkout/checkout.css`, `app/scripts/flows/t3_1_checkout.py`. Fill stubs `components/organisms/checkout/{CheckoutShell,AmountStep,PaymentStep,ReviewStep,PaidStep,OrderSummary}.tsx`, `components/molecules/HStepper.tsx` (DS-candidate).

**Consumes:** `parseCheckoutQuery`, `checkoutHref`, `safeReturn`, `CostBlock`, `SelectTile`, `Button busy`, `useWalletView`, `purchase`, `setAutoReload`, `setPaymentMethod`, `setBillingSettings`, `Illustration` (`24-scene-checkout-success`). **Produces:** `useCheckout(): { draft; step; go(step); pay(): Promise<{ receiptId: string }>; savedCard: boolean }`.

- [ ] Flow `t3_1_checkout.py` (persona `trial-admin`, saved card): `/checkout/credits?pack=pack10` → no sidebar/header, stepper "1 Amount · 2 Payment · 3 Review", summary sticky on scroll; Next skips Payment to Review (saved card); Pay without terms → "Agree to the credit terms to pay" and focus on the checkbox; agree + Pay → URL `step=done`, "10 credits added", browser Back does not return to Review; balance on `/configure/billing` +10. Custom 101 → "Over 100 credits? Talk to sales…". `?error=card` → decline callout on Payment. `Exit checkout` with `return=/configure/billing?tab=usage` lands there. No `button[disabled]`; no illustration on Amount/Payment/Review.
- [ ] Implement per spec §5.6 (PC-7, PC-8). Body frame: try DS `TaskFlow presentation="page"` first; note the outcome in the report.
- [ ] Flow passes; compare with board 1 `#checkout-amount`, board 2 `#checkout-payment`, `#checkout-review`, `#checkout-success` (summary without art).

### Task 3.2: Billing states, Usage donut, How credits work (agent F2)

**Files:** `components/organisms/billing/**` (add `BonusNotice.tsx`, `AutoReloadOffer.tsx`, `CreditsExplainer.tsx`, `usage/UsageDonut.tsx`, `usage/UsageByPerson.tsx`; remove `UsageChart`/`BreakdownTable` from the Usage tab per PC-34), `app/(shell)/configure/billing/**` (band on DS `PageHeader toolbar` + DS `Tabs` per PC-33; `?tab=credits`; `credits/page.tsx` redirect), `app/scripts/flows/t3_2_billing.py`.

**Consumes:** `useWalletView`, `usageByType`, `usageByPerson`, `earnWindow`, `CostBlock`, DS `Callout`, `Accordion`, `PageHeader`, `Tabs`, `Illustration`. **Produces:** nothing shared.

- [ ] Flow `t3_2_billing.py` across personas `trial-admin`, `payg-admin-low`, `approver`, `reviewer`, `pending-admin`, `returning` and DemoDock low/zero: band = tabs + "Prefer a monthly invoice? Talk to us" + "How credits work" + "Add credits" (admin wallet); invoiced has no Add credits/runway/balance and keeps "Download statement"; invoiced reviewer has tabs Usage · How credits work; amber only for low/expiring, red only at zero; low hero "Running low" with `AutoReloadOffer` ("up to 2 times a month"); zero hero "Out of credits" with "Waiting to start" count; `ExpiryAlert` action reads "Start a review"; breakdown says soonest-expiring first; `?tab=credits` renders the explainer for every role; `/configure/billing/credits` redirects.
- [ ] Usage (PC-28, PC-34): donut `role="img"` `aria-label` sentence; hidden table rows = legend rows; slice totals = by-person total = "credits used" centre number; period with no use → one `EmptyLine` per card; changing the period updates all three together.
- [ ] Implement per spec §5.7, §5.8. Flow passes; compare with board 2 billing frames.

### Task 3.3: Reroute Add credits, draft before checkout (agent F3)

**Files:** Fill `components/organisms/CheckoutLauncher.tsx`. Delete `components/organisms/wallet/TopUpModal.tsx`, `topup-chips.css`; modify `components/organisms/wallet/index.ts`, `components/run/{CostSummary,RunModal,RunConfirm}.tsx`, `app/(shell)/reviews/[id]/page.tsx`, `app/emails/content.ts`, `components/organisms/CommandPalette.tsx`. Create `app/scripts/flows/t3_3_reroute.py`.

**Consumes:** `topUpIntent`, `clearTopUpIntent`, `checkoutHref`, `safeReturn`, `addReview`, `walletView`. **Produces:** `CheckoutLauncher()` (reads intent → `router.push(checkoutHref({ … returnTo: pathname+search }))`; never in embedded mode or for invoiced orgs; non-admins get the role path until T4.1 lands, a toast meanwhile); `RunConfirm` initial selection from `?types=` when present.

- [ ] Flow `t3_3_reroute.py::short_by_one_prefills_one` (RF2): persona short (DemoDock low → 1 credit), drop a file on `/launchpad` → Review setup with both types → callout "Add credits" → URL is `/checkout/credits?credits=1&return=%2Freviews%2F<id>&types=technical%2Cadministrative`.
- [ ] Flow `::round_trip_with_reload` (RF4): continue from there, hard-reload on the Payment step, pay → "Back to your review" → `/reviews/<id>` at Review setup with both types checked; Start now succeeds; the review exists as `intake` before payment (visible in `/reviews` Intake tab).
- [ ] Flow: header popover / billing band / Invoices empty / command palette "Add credits" each land on checkout with the right amount and `return`; email preview "Add credits" CTA has `href="/checkout/credits?pack=pack10"`; YouConnect embedded run never navigates to checkout.
- [ ] Implement per spec §5.6 return path. Flow passes.
- [ ] Phase 3 gate; commit `feat(pattern-change): phase 3 — focused checkout, billing states, usage donut, how credits work`.

---

## Phase 4 · Lock-then-explain and reviewer requests

### Task 4.0: Lock primitives, request store, bug fixes (coordinator)

**Files:** Create `components/molecules/LockedAction.tsx` (DS-candidate), `lib/lock-reasons.ts`, `lib/lock-reasons.test.ts`, `lib/credit-requests.ts`, `lib/credit-requests.test.ts`, `store/credit-request.store.ts`, `data/seed/credit-requests.seed.ts` (empty), stub `components/organisms/useIntakeStart.ts`. Modify `components/organisms/home/useStartGate.ts`, `data/collections.ts` (`CREDIT_REQUESTS: "credit_requests"`), `data/seed/index.ts`, `components/run/RunExperience.tsx` (Esc guard), `lib/review-lifecycle.ts` (`/reviews/<id>` for autorejected), `components/templates/AppShell.tsx` (sidebar Start → `LockedAction`), `app/(onboarding)/layout.tsx` + `app/checkout/layout.tsx` (`LockDialog` mount), barrels.

**Produces:**
- `LockedAction({ reason: LockReason; glyph?: "lock" | "hourglass"; describedBy?: string; children: ReactElement })`: clones the child with `aria-disabled="true"`, trailing 14 px glyph, `onClick` → `openLock(reason, { returnFocus })`; never `disabled`.
- `lockReasonForStart(i: { approval: ApprovalState; balance: number; types: ReviewType[]; role: Role; embedded: boolean }): LockReason | null` (`needed = costFor(types) − balance`).
- `useStartGate(): { locked: boolean; reason: LockReason | null; explain(): void }`.
- `canRequest(requests: CreditRequest[], userId: string): boolean`, `nextStatus(r: CreditRequest, action: "open" | "fulfil" | "dismiss" | "cancel" | "remind"): CreditRequest`.
- `useCreditRequestStore`: `request(note?)`, `remind(id)`, `cancel(id)`, `markOpened(id)`, `dismiss(id)`, `fulfil(id)`, `openFor(orgId)`, `mine(userId)`.

- [ ] Write `lib/lock-reasons.test.ts`: `"pending → approval"`, `"credits reason carries the shortfall"` (balance 1, both types → `needed 1, have 1`) (RF2), `"zero balance → needed 2"`, `"affordable → null"`, `"embedded → null"`. Write `lib/credit-requests.test.ts`: `"one open request per requester"`, `"open → opened → fulfilled"`, `"dismissed allows asking again"`, `"remind sets remindedAt only while open/opened"`.
- [ ] Run → fails; implement; passes.
- [ ] Bug B2: Esc guard skips when `document.querySelector('[role="dialog"]:not(.run)')` exists. Bug B3: autorejected link. Check both by hand in the dev server (`/reviews/<autorejected id>` opens triage; Receipt dialog over a signed review + Esc closes only the dialog).

### Task 4.1: Lock dialog variants (agent C1)

**Files:** Fill `components/organisms/LockDialog.tsx`. Create `components/organisms/lock/{ApprovalBody,CreditsBody,ReviewerRequestBody,RoleBody}.tsx`, `components/organisms/lock/lock.css`, `app/scripts/flows/t4_1_lock_dialog.py`.

**Consumes:** `useLockStore`, DS `Dialog size="sm" hideTitle` at `--rw-z-modal`, DS `OptionCard`, `PendingTracker`, `Illustration` (`09b`, `10b`, `01b`, `15-request-sent`), `checkoutHref`, `useCreditRequestStore.request`, `bookCall` route. **Produces:** nothing shared (store-driven).

- [ ] Flow `t4_1_lock_dialog.py`: drive `useLockStore` via a `?lock=<kind>` prototype hook on `/dashboard` (dev only, inside `LockDialog`) for each variant in spec §5.5: titles, options, actions match; credits short "Add 1 credit" → checkout `credits=1`; zero "Continue to checkout" → pack choice carried; reviewer "Ask Dana for more credits" → "Requested · Dana will be notified" with spot 15 and a stored request; role → "Only admins can buy credits"; focus returns to the opener on close; Esc closes only the dialog.
- [ ] Implement per spec §5.5 dialog table (art 96–104 px, centred body). Flow passes.

### Task 4.2: Shell Start sites and the Reviews upload zone (agent C2)

**Files:** `components/organisms/{OrderButton,IntakeWidget,CommandPalette,dashboard-widgets}.tsx`, fill stub `components/organisms/useIntakeStart.ts`, `components/organisms/home/SetupRow.tsx`, `components/molecules/Breadcrumbs.tsx`, `app/(shell)/reviews/page.tsx`, `app/(shell)/configure/billing/page.tsx`, `app/scripts/flows/t4_2_start_sites.py`.

**Consumes:** `LockedAction`, `useStartGate`, `openRun`. **Produces:** `useIntakeStart(): { start(file: File | null, source: "upload" | "yc", deliveryId?: string): void; parsing: boolean }`.

- [ ] Flow `t4_2_start_sites.py::every_site_explains` (RF5), persona `pending-admin`: sidebar Start (expanded and collapsed), Reviews `OrderButton`, dashboard first-run, command palette Start (both entries), Launchpad dropzone and a YC row, Get started Upload row, Reviews level-1 upload zone, billing "Add credits": each has `aria-disabled="true"`, no `disabled`, an hourglass glyph, and a click opens the approval dialog. Persona `trial-admin`: the same controls work (Reviews upload zone opens Review setup in `RunModal`). `/launchpad` breadcrumb shows a plain reason line, not a chip.
- [ ] Implement per spec §5.5 Start-site table and PC-37. Flow passes.

### Task 4.3: Review setup (agent C3)

**Files:** `components/run/{RunConfirm,CostSummary,RunModal}.tsx`, `app/(shell)/reviews/[id]/page.tsx`, `app/scripts/flows/t4_3_review_setup.py`.

**Consumes:** `lockReasonForStart`, `openLock`, `useStartGate`, `checkoutHref`. **Produces:** `RunConfirm` passes `onRunOnly(type)` in the credits reason.

- [ ] Flow `t4_3_review_setup.py::lock_over_takeover` (RF1): short persona, Review setup with both types, click Start → dialog visible; `elementFromPoint(centre)` is inside the lock dialog; Review setup still rendered behind the scrim; Esc → dialog gone, `.run` still attached, focus on Start review.
- [ ] Flow: "Run Technical only (1 credit)" → review starts with Technical only (progress spoke) and the ledger shows one debit (PC-32); zero types → Start clickable, inline note, focus to the type list; empty address → inline note, focus on the field; pending persona via the queue "Run" on an intake row → approval dialog (bug B5); `LowBalanceCallout` text absent; no `button[disabled]` in `.run-cf-footbar`.
- [ ] Implement per spec §5.5 Review setup table. Flow passes.

### Task 4.4: Reviewer credit requests (agent C4)

**Files:** `components/organisms/billing/OverviewTab.tsx` (`ReviewerBilling` form + tracker), `components/organisms/CreditsPopover.tsx` (request card), `app/checkout/credits/hooks/useCheckout.ts` (`request=` fulfil), `app/emails/content.ts` (request + fulfilled emails), `app/scripts/flows/t4_4_requests.py`.

**Consumes:** `useCreditRequestStore`, `canRequest`, `checkoutHref`. **Produces:** nothing shared.

- [ ] Flow `t4_4_requests.py`: as `reviewer`, Billing → note "3 reports due Friday" → "Ask Dana for more credits" → tracker "You asked Dana Reyes…"; reload → still there; second ask is not offered while open. Switch to the admin persona of the same org → header popover shows "Marcus Ortiz asked for more credits" + note (opening sets `opened`) → "Add credits" → checkout `pack=pack10&request=<id>` → pay → request `fulfilled`; back as reviewer → "Credits added" + toast once. "Dismiss" path → "Dana closed your request" + "Ask again". `/emails` lists both emails.
- [ ] Implement per spec §5.9. Flow passes.
- [ ] Phase 4 gate; commit `feat(pattern-change): phase 4 — lock-then-explain everywhere, reviewer credit requests`.

---

## Phase 5 · Help and prototype controls

### Task 5.0: Tour, learning and prototype contracts (coordinator)

**Files:** Modify `app/package.json` (`react-joyride@3.2.0`), `components/molecules/EmptyState.tsx` + `empty-state.css` (`media?: ReactNode`, not `aria-hidden`, exclusive with `preview`; DS-candidate), `components/run/RunExperience.tsx` (chip slot in `.run-head` between title block and close; in-run `<TourHost scope="run"/>`), `components/run/RunWorkbook.tsx`, `components/review/WorkbookInline.tsx` (`data-tour` per spec §5.13), `lib/prototype-registry.ts` (re-export `PRESETS`), barrels. Create `lib/tours.ts`, `lib/tours.test.ts`, `store/tour.store.ts`, `lib/learning.ts`, `lib/learning.test.ts`, `lib/prototype/presets.ts` (stub `PRESETS: Preset[] = []`), and stubs (exported) `components/molecules/TourChip.tsx`, `components/organisms/{EmptyVideo,SettingVideoHint}.tsx`.

**Produces:** `TourDef { id; route?: string; scope: "shell" | "run"; steps: { target: string; title: string; body: string; placement?: Placement; art?: IllustrationName }[]; completesStep?: SetupStepId }`; `TOURS`; `tourForPath(pathname: string): TourDef | undefined`; `useTourStore`: `active`, `step`, `start(id)`, `next()`, `stop(reason: "done" | "skipped" | "interrupted")`; `lib/learning.ts`: `VIDEOS`, `GUIDES`, `videoForStep(id)`, `videoById(id)`, re-exports `PLACEHOLDER_VIDEO`, `stepVideo`.

- [ ] Write `lib/tours.test.ts`: `"ids unique"`, `"first-review has 4 steps and completes tutorial"`, `"every target is a [data-tour=…] selector"`, `"tourForPath('/configure/checklists') → checklists"`, `"tourForPath('/reviews/x') → undefined (run tour is not a page chip)"`, `"checklists and workbook-layouts have 2 steps"`. Write `lib/learning.test.ts`: `"every Get started step has a video"`, `"durations are m:ss"`, `"audience ∈ admin|reviewer|everyone"`, `"stepVideo re-export matches lib/guides"`.
- [ ] Run → fails; implement; passes. `npm ls react-joyride` → 3.2.0.

### Task 5.1: Tours (agent K)

**Files:** Fill `components/organisms/tour/TourHost.tsx`, `components/organisms/HeaderChipSlot.tsx`. Fill stub `components/molecules/TourChip.tsx`. Create `components/organisms/tour/{TourTooltip,useTourTargets}.tsx`, `components/organisms/tour/tour.css`, `app/scripts/flows/t5_1_tours.py`.

**Consumes:** `TOURS`, `tourForPath`, `useTourStore`, `toursSeen`, `onboarding.complete("tutorial")`, react-joyride v3 API. **Produces:** `TourHost({ scope: "shell" | "run" })`, `TourChip({ tourId: string })`.

- [ ] Flow `t5_1_tours.py::first_review_tooltip_visible` (RF1): own review on spoke `workbook` (motion off), chip in `.run-head` → start → tooltip at z 128 visible over the workbook (`elementFromPoint` at the tooltip centre is inside it); 4 steps target `.wb-fmeta-cite`, `.wb-fblock-bar`, `.run-wb-viewmode`, `Sign & finalize`; "Tour, 2 of 4" in `.run-head`; finishing ticks `tutorial` on Get started; skipping doesn't; opening the Sign modal mid-tour stops the tour first. No chip on `confirm`/`progress`.
- [ ] Flow: page chips in the header slot on `/reviews` (only with rows), `/configure/checklists`, `/configure/workbook-layouts`, `/configure/billing`; every listed target exists; a removed target is skipped without an error; reduced motion respected; nothing auto-starts.
- [ ] Implement per spec §5.13 (PC-14, PC-31, PC-38). Flow passes. If Joyride v3 misbehaves, switch to the DS `Popover` fallback behind the same contract and say so in the report.

### Task 5.2: Trust Center and Learning Center (agent G)

**Files:** `app/(shell)/trust/**`, `app/(shell)/learn/**`, create `app/shared/trust/[token]/page.tsx`, `components/organisms/trust/{TrustCenter,SendToItDialog,useTrustSend}.tsx`, `components/organisms/learn/{LearningCenter,VideoCard}.tsx` + their css, modify `lib/security-pack.ts`, `lib/guides.ts`, `app/(shell)/configure/security/**` (redirect to `/trust`), `app/(shell)/configure/page.tsx`, create `app/scripts/flows/t5_2_trust_learn.py`.

- [ ] Flow `t5_2_trust_learn.py`: `/trust` hero scene 21, six documents first, every unconfirmed fact has a "Placeholder" chip, Hosting shows only "Placeholder"; "Send to IT" completes `security_pack`; "Request access" opens a form; `/shared/trust/<token>` renders without the shell; `/configure/security` redirects. `/learn`: groups and durations per spec §5.11, search "sign" filters, no-match shows `EmptyLine` + "Clear search", progress persists after reload, "Page tours" re-runs a tour.
- [ ] Implement per spec §5.10, §5.11. Flow passes.

### Task 5.3: Empty-state and setting videos (agent J)

**Files:** Fill stubs `components/organisms/{EmptyVideo,SettingVideoHint}.tsx`. Create `app/scripts/flows/t5_3_videos.py`. Modify `app/(shell)/reviews/page.tsx`, `app/(shell)/configure/{checklists,workbook-layouts}/**`, `app/(shell)/configure/defaults/page.tsx`, `components/organisms/billing/**` (`AutoReloadSection`, `UsageTab`, `InvoicesTab`, `data-tour` on `OverviewTab`), `app/(shell)/configure/billing/page.tsx` (`data-tour` on Add credits).

- [ ] Flow `t5_3_videos.py`: empty org `/reviews` level 1 has the media "How a review works · 1:15" (keyboard-playable), the PC-37 upload zone and no tabs/filters/totals; checklists with none → level-1 `EmptyState` + "Mapping a checklist · 1:30"; layouts default-only → level 1; Usage/Invoices never used → media replaces `GhostBars`; first toggle of auto-reload shows the hint once per user, never blocks the switch; every `lib/tours.ts` page target exists on its route.
- [ ] Implement per spec §5.12. Flow passes.

### Task 5.4: State pill and scenario popover (agent D)

**Files:** Fill `components/organisms/prototype/ProtoPill.tsx`; create `components/organisms/prototype/{ScenarioPopover,ProtoKeys,useProtoView}.tsx`, `components/organisms/prototype/prototype.css`, `store/prototype.store.ts`; fill `lib/prototype/presets.ts`; modify `components/templates/AppShell.tsx` (remove `DemoDock`), delete `components/organisms/DemoDock.tsx`, modify `app/(onboarding)/layout.tsx`, `app/checkout/layout.tsx`, `lib/demo.ts` (`replaceRows`, `rebuildStageOrg(sc, now)`), `lib/landing.ts` (`enterPreset`), `data/seed/{demo-personas,scenario-fixtures (new),orgs}.seed.ts`, `app/start/page.tsx` (→ `/prototype`), `app/demo/[persona]/page.tsx` (alias → preset), `components/organisms/UserMenu.tsx` (persona switcher out); create `app/scripts/flows/t5_4_pill.py`.

**Consumes:** `Scenario`, `normalize`, `buildLedger`, `SCREENS`, `screenForPath`, `activeState`. **Produces:** `useProtoStore`: `scenario`, `apply(patch: Partial<Scenario>, view?: Record<string, string>)`, `reset()`, `hidden`, `toggleHidden()`; `PRESETS` with `legacyPersonaId` for all nine personas.

- [ ] Flow `t5_4_pill.py`: pill at top centre, z 210, on Get started, Billing, Dashboard; each Billing state segment from spec §5.8 renders its state after one click and survives reload; "Custom" after a popover axis change; scenario actions (Approve now, Complete next step, Add 5, Spend 1, Reset org, Reset tours and celebrations, Replay arrival) work; `/demo/trial-admin` and the other eight legacy ids still land correctly (so earlier flows keep passing); `Ctrl+.` hides, `?controls=0` hides without persisting; `NEXT_PUBLIC_PROTOTYPE_CONTROLS=0` removes it.
- [ ] Implement per spec §6. Flow passes, plus `python app/scripts/smoke.py --all` still green.

### Task 5.5: Prototype Index, fill wand, auth states (agent I2)

**Files:** Create `app/prototype/page.tsx`, `app/prototype/go/page.tsx`, `scripts/proto-thumbs.mjs`, `components/organisms/prototype/{useProtoFill,RoutingNote}.tsx`, `app/scripts/flows/t5_5_index.py`. Modify `lib/prototype-registry.ts` (every built and planned screen, flows), `components/organisms/auth/**` (`?variant=`, fills, `DemoAccounts` removed), `app/(auth)/**`, `components/templates/KeycloakFrame.tsx` (pill mount), `components/organisms/CommandPalette.tsx` ("Prototype" group), `components/organisms/onboarding/{OrgSetupForm,InviteStep,CallBooking}.tsx` (fill registration only).

**Produces:** `useProtoFill(screenId: string, fills: { valid(): void; invalid?(): void }): void`; `RoutingNote({ profile })`.

- [ ] Flow `t5_5_index.py`: `/prototype` lists every `page.tsx` route (dev warning count 0), search "billing" filters, counter "N of M screens", state chips deep-link and land in that state; flows tab lists the nine flows; wand on `/welcome` fills Self-serve (2–10 / Under 50) and Shift-wand fills Enterprise (11+ / 200+) without submitting; auth `?variant=wrong-code` shows the error; sign-in has no "Demo accounts" panel; RoutingNote shows "Route: Enterprise · because Reviewers = 11+ (≥ 11)" only while controls are visible.
- [ ] Implement per spec §6 and `state-system-draft.md` §3.3, §4. Flow passes.

### Task 5.9: Final (coordinator)

**Files:** Delete `store/demo.store.ts`; modify `store/index.ts`, `components/providers/SeedProvider.tsx`, `components/atoms/Icon.tsx` (remove `coins` from the map), `app/AGENTS.md`, `docs/plans/parachute-v2-client-questions.md` (append only; leave Val's pending edit intact), `docs/feedback-log.md`; create `docs/plans/pattern-change/walkthrough.md`.

- [ ] `grep -rn "useDemoStore\|DemoDock\|IconCoins" app/src` → nothing; tsc, eslint, tests, `smoke.py --all` green.
- [ ] `grep -rn "DS-candidate:" app/src | wc -l` equals the rows built from spec Appendix A; add any extra ones to the appendix.
- [ ] AGENTS.md: nav line (Get started · Dashboard · Reviews; Configure via OrgCard), `openTopUp` → checkout, lock-then-explain + `LockedAction`, z-tiers (PC-31), review takeover rule (§5.0), illustration exception, DS-candidate rule, motion tokens, spend order PC-16 (replaces the Nov 6 line).
- [ ] Log PC-30–38, Q-E17, Q-E18 in the client-questions doc; walkthrough script over the Index flows in order.
- [ ] Phase 5 gate; commit `feat(pattern-change): phase 5 — tours, Trust and Learning, empty-state videos, prototype controls`.

---

## Self-review against the spec

| Spec | Covered by |
|---|---|
| §1 house rules, reuse + DS-candidate rule | Global Constraints; reviewer brief; gate greps; T5.9 count |
| §2 PC-1…PC-38 | PC-1 T2.1 · PC-2 T2.0 · PC-3 T5.1 (`tutorial`) · PC-4 T2.3 · PC-5/6 T2.2 · PC-7/8 T3.1, T3.3 · PC-9 T3.1, T3.2 · PC-10 T1.0 (`approve`) · PC-11 T4.* · PC-12 T2.0 nav · PC-13 T5.4, T5.5 · PC-14 T5.1 · PC-15 T0.2 + owners · PC-16 T0.3 · PC-17 T0.2/T0.3 · PC-18 T0.2/T0.3 · PC-19 T1.0 · PC-20 T0.5 · PC-21 T3.2 · PC-22 T2.2 · PC-23 T1.1/T1.2 · PC-24 T1.1 · PC-25 T0.4 · PC-26 T1.1 · PC-27 T1.0, T2.1 · PC-28 T3.2 · PC-29 T1.2 · PC-30 T0.6 · PC-31 T0.2, T4.1, T5.1 · PC-32 T4.3 · PC-33/34 T3.2 · PC-35/36 T2.1 · PC-37 T4.2, T5.3 · PC-38 T5.0, T5.1 |
| §4 pricing | T0.2 (new, deletions), T2.0 (reward values, `SETUP_REWARD_STEPS`) |
| §5.0 surface model | T4.0 (Esc), T4.1 (z 140), T5.0/T5.1 (in-run host), T3.0 (checkout mounts) |
| §5.1 onboarding | T1.0–T1.4 |
| §5.2 Get started | T2.0, T2.1 |
| §5.3 / §5.4 credits chrome | T2.2 (+ T4.4 request card) |
| §5.5 locks | T0.2 (store), T4.0–T4.3 |
| §5.6 checkout | T3.0, T3.1, T3.3 |
| §5.7 / §5.8 billing | T3.2 (+ T4.2 pending lock, T4.4 reviewer) |
| §5.9 requests | T4.0, T4.4 |
| §5.10 / §5.11 Trust, Learning | T2.2 (stubs), T5.2 |
| §5.12 videos | T5.0 (`media`), T5.3 |
| §5.13 tours | T5.0, T5.1 |
| §5.14 illustrations | T0.2 (atom, tokens), each surface owner; `coins` removal: T0.3 (`CostSummary`, `DemoDock`), T2.1 (`SetupChecklist`), gate grep from phase 2, T5.9 removes it from the `Icon` map |
| §5.15 motion | T0.4, T1.0, T1.1, T1.4, T2.1 |
| §6 state system | T0.5, T0.6, T5.4, T5.5 |
| §7 data and seeds | T0.2 (types, prefs), T2.0 (v23), T4.0 (`credit_requests`), T1.3/T3.3/T4.4 (emails) |
| §9 risks | Review Focus RF1–RF5; ownership model; seed plan (T0.6 note) |
| §11 bugs B1–B12 | B1 T3.3/T4.0 · B2 T4.0 · B3 T4.0 · B4 T2.3 · B5 T4.3 · B6 T3.3/T4.3 · B7/B8 T0.3 · B9 T3.3 · B10/B11 T1.0 · B12 T4.3 |
| Appendix A | Each DS-candidate's owning task; T5.9 reconciles the list |

Gaps found and fixed while writing: the `coins` icon removal had no owner (T0.3 + T2.1 replace uses, T5.9 drops it from the map); T0.2 and T0.3 both needed `EARNED_LIFE_DAYS`'s importers (T0.3 now owns that deletion); barrels were edited by owners and the coordinator in the same phase (foundations now pre-create every cross-folder stub and its export); `store/demo.store.ts` deletion collided between T5.4 and T5.5 (moved to T5.9); `CostBlock` was needed by both T3.1 and T3.2 (moved to T3.0); the welcome-line/confetti hook needed to exist before Get started is rewritten (T1.0 adds `useArrivalCelebration`, T2.1 keeps it); every flow keeps working through phase 5 because T5.4 keeps the `/demo/<id>` aliases.
