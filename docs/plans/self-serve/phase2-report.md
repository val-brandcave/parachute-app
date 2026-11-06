# Phase 2 report

All paths under `C:\Users\vvrsv\OneDrive\Desktop\parachute\app`. Nothing committed. Nothing under `docs/meetings/` touched.

## Added
- `src/lib/guides.ts` (Guides card content), `src/lib/security-pack.ts` (every string on the security page, for Ed to edit).
- Organisms: `components/organisms/home/` (`FirstRunHome`, `SetupMeta`, `SetupChecklist`, `HomeCards` = SampleCard / WalletCard / SecurityPackCard / GuidesCard / RecentReviews, `useSetupActions`), `SetupDock`, `BalancePill`, `EarnedToastHost`.
- Route `(shell)/configure/security` (`page.tsx`, `hooks/useSecurityPack.ts`) + "Security pack" card on `/configure` + breadcrumb label + quiet "Security pack for your IT team" link on the Pending page.
- Icons: play, send, external, lock, key, users, sheet, mail.
- CSS: appended Phase 2 block in `globals.css` (`.su-*` checklist, `.hm-*` cards, `.home-grid`, `.setupmeta/.segbar`, `.meter*`, `.sb-dock/.sb-balance`, `.dock-*`, `.sec-*`, `.run-sample-banner`). Tokens only. Prefix is `su-` because `ck-*` is already the checklist mapper.

## Changed
- `lib/setup-steps.ts` rewritten: two groups, 7 steps + the pre-ticked `account` line (8 total). Per-step metadata (minutes, video, doc, side kind, action, continue label, adminOnly) lives in the defs. `FIRST_RUN_STATBAR_MIN = 5`, `FULL_REVIEW_TYPES`. `pricing.ts`: `SETUP_REWARD_STEPS = [bank_policy, checklist, layout]`, `SECURITY_LINK_DAYS`. `SetupStepId` gained `account`, `sign_workbook`, `bank_policy`.
- `SetupProgress` gained `completedBy`, `inProgress` (seeded "doing" notes), `securitySends`.
- `onboarding.store`: `complete()` records who, awards through the wallet (idempotent, capped), publishes an `earnedNotice`; `sendSecurityPack()`; `useSetupSummary()`, `useOrgStage()`. `prefs.store`: per-user `setupHiddenBy`.
- `reviews.store.fetchReviews`: the sample is org-agnostic (every trial/payg org sees it, assigned to the signed-in user, bank = org name; invoiced orgs do not). Sample excluded from dashboard lists and KPIs, queue tab counts, Recent reviews, StatBar threshold. In the queue it shows only under All with a "Sample" chip.
- `/dashboard`: `orgStage` new vs active; new renders `FirstRunHome`. StatBar and trend render there only after 5 completed non-sample reviews.
- Hooks (`complete(...)`): sample opened (`/reviews/review-sample`), first review (RunModal and `[id]` `onStart`, non-sample, no debit), sign (`doSign` / `doSignAttestation`, non-sample), bank policy (organization page upload), checklist (published AND default, in `templates.store`), layout (`saveLayoutFromWorkbook`), security pack (Send pack).
- Sample review: info banner under the run toolbar with ghost "Run your own report" (opens `/launchpad`), "SAMPLE" corner ribbon on the workbook cover and a "Sample" chip in the workbook bar. Paper stays white in dark.
- Sidebar footer: `SetupDock` (not on `/dashboard`, only while stage is new and not hidden by this user) above `BalancePill` (dashed "6 trial" until mixed, then solid "5 credits"; none for invoiced) above the OrgCard. User menu gained "Setup guide" (reopens, clears the per-user hide). DemoDock gained "Complete next step"; its chip moved right of the sidebar so it no longer covers the balance pill.
- `ActionMenu`: first-open flip now estimates height (it measured 0 and never flipped near the bottom edge).
- Seeds (`SEED_VERSION` v17): HCB is the C2 state (4 of 8 done, Dana/Marcus, sign and checklist "doing", ledger 6 - 2 + 1 earned = 5, reviews 220 Commerce Way and 18 Lighthouse Rd). Cedar Ridge mid-setup (6 of 8, checklist doing, layout next). Meridian fully set up. HCB emails moved to `@harborcb.com` per the screens spec. Bank policy is now per-org aware: a trial/payg org has none until it uploads one (`syncBankPolicy` in `loadSessionData`).

## Verified
- `npx tsc --noEmit`: clean. `npx eslint src --ext .ts,.tsx`: clean.
- Fresh `.next`, dev server: `/start`, `/dashboard`, `/reviews`, `/reviews/review-sample`, `/configure`, `/configure/security`, `/welcome` all 200.
- Playwright (`scratchpad/build/walk3.py`, Python), zero console and page errors in the final run:
  - prospect > sign-up > verify > org > path > ready > Home: "1 of 8", "6 trial", no Meridian numbers; Open sample: banner, "Run your own report" and SAMPLE ribbon present; back on Home "2 of 8", step gone; fresh queue shows only the sample, all counts 0.
  - trial-admin: C2 content and numbers match; DemoDock "Complete next step" x3 shows one toast ("Compliance checklist published / 1 credit added to Harbor Community Bank."), balance ticks; all steps done flips Home to the active dashboard; earned stays at 3 (cap) and balance is 7.
  - Reviews page: dock visible (5/8, "Next: ..."), popover opens, menu shows Hide / Email me this list / per-user note; hide removes the dock and Home; user menu "Setup guide" restores it; dock not shown on `/dashboard`.
  - `/configure/security`: email prefilled `it-vendor@harborcb.com`; Send pack gives success Callout, Sent log row, toast, and ticks the step.
  - reviewer sees "Ask Dana" on admin-only steps; `returning` and `enterprise-yc` dashboards unchanged (no checklist, no balance pill); payg-admin-low shows 6 of 8.
- Screenshots (1440 wide, in `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\4be00963-e518-49af-b2bd-03054f97ef4e\scratchpad\build\`): `phase2-C1-light.png`, `phase2-C2-light.png` (with toast), `phase2-C2-plain-light.png`, `phase2-C3-light.png`, `phase2-C4-light.png` (popover + menu), `phase2-F1-light.png`, `phase2-F2-light.png`, `phase2-C1-dark.png`, `phase2-C3-dark.png`, `phase2-F1-dark.png`, plus `phase2-C1-after-sample-light.png`, `phase2-cedar-light.png`, `phase2-returning-light.png`. One fix round after comparing with the canvas proofs (class collision, demo chip overlap, next-step logic, breadcrumb, neutral file icons).
- Dev servers stopped (including a stale `next dev` from an earlier session that held port 3000 and the same `.next`).

## Differences from the canvas / deferred
- Header count is "N of 8", not "of 6": the layout step was added after the boards (and Account created counts). Boards and the screens spec still say 6.
- Canvas ledger story (5 credits after two real reports) is inconsistent; the seed follows the brief: one debit (18 Lighthouse Rd), 220 Commerce Way has no debit.
- Dock popover lists all open steps (4 here), the canvas showed 2. Hide note is a disabled menu row, not a free label. "Help" menu does not exist, so "Setup guide" is in the user menu; the note text still says Help per the board.
- Sample card thumbnail is a simple CSS miniature; Guides, videos, PDFs, "Download pack/all" and "Request access" are toasts (no real media).
- Billing link / balance pill click show a "Billing opens in Phase 3" toast (`/configure/billing` does not exist).
- Sample appears only in the "All" queue tab; tab counts exclude it, so "All 2" shows 3 rows ("Showing 3 of 3").
- "Hide setup guide" on the Home card ⋯ uses the same per-user flag as the dock (the org-level `homeDismissedAt` is still honoured but nothing sets it yet).

## Coordinator review fixes (after the first pass)
- Dock popover: the ⋯ menu is now inline inside the popover (above the footer, no tooltip, never over the step rows); popover width 380 and the "Next" tag sits on the title line. The "Next" tag still wraps to its own line on the longest title ("Send the security pack to your IT team").
- Hiding the guide is per user and only removes the checklist card (replaced by a small "Setup guide hidden / Show setup guide" card) and the dock. Home stays first-run (`useOrgStage` no longer reads the hide flag; `useSetupHidden` does).
- Trial/payg orgs never show seeded stats: when `active`, KPIs and the trend are derived from the org's own non-sample reviews (period-over-period deltas are flat, turnaround and on-time read 0 until there is data).
- Session identity is persisted (`parachute:session`, written on `signIn`, cleared on `signOut`) and restored by `SeedProvider` when the user and org rows still exist and no remembered persona accounts for it. This removes the "reload drops a runtime org" note above.
- OrgCard initials: up to 3 significant words ("HCB"; Meridian Trust Bank becomes "MTB").
- Re-verified: tsc and eslint clean; walk3.py zero console/page errors; reload keeps the runtime org; hide keeps first-run Home; all-done active dashboard shows own numbers (0 completed). Re-shot `phase2-C4-light.png`, `phase2-home-hidden-light.png`, `phase2-active-own-stats-light.png` and the rest of the set.

## Notes for Phase 3
- `first_review` completes on Start; no debit yet (`wallet.debitForReview` is still not called from `onStart`).
- Wallet card and balance pill read the ledger; spend order is trial > earned > purchased (computed in `HomeCards.remainingBySource`, worth moving into the wallet store with the billing screens).
- `earned` seeds exist only for HCB; Cedar shows steps done with no earned rows (balance persona stays at 1 credit).
- Another process (stale dev server) can hold port 3000; check before starting.
