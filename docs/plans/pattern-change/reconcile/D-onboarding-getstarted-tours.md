# Reconcile D: onboarding, Get started, tours, empty states (board vs real app)

**Date:** 11 Nov 2026 · **Branch read:** `feat/pattern-change` (code = `d023d83`, v2 on main) · **Read-only audit.**
Paths are relative to `app/src/` unless they start with `docs/`. Boards: `index.html` (B1), `part2.html` (B2), `onboarding-motion.html` (MP).

---

## 1. Current structure

### 1.1 Auth → onboarding (today)

| Piece | File:line | What it really is |
|---|---|---|
| Auth group | `app/(auth)/layout.tsx:5` | Empty fragment; each page wraps itself in `KeycloakFrame` (`components/templates/KeycloakFrame.tsx:11`), so the card remounts per route |
| Verify → welcome | `components/organisms/auth/VerifyCodeForm.tsx:34` | `router.push("/welcome")` |
| Onboarding group layout | `app/(onboarding)/layout.tsx:9-25` | `.wel` page: logo top-left, `<main class="wel-main">`, footer, **`DemoDock` mounted here** (l.23) |
| `/welcome` | `app/(onboarding)/welcome/page.tsx:13-33` | **One 560 px centred card (`.wel-stage` > `.wel-card`, `globals.css:16654-16665`). There is no side panel at all**, no progress bar, no step 2 |
| Form | `components/organisms/onboarding/OrgSetupForm.tsx` | Name + 3 `SegmentedControl`s (l.66-77). Sales callout (l.78-97) is *optional* ("you can go in now… the sample review is open"); self-serve gets a "free sample review" reassurance (l.99-104); submit is **`disabled={!canContinue}`** (l.107); label never changes |
| Hook | `app/(onboarding)/welcome/hooks/useWelcome.ts` | Band labels hardcoded (l.35-39, "50–200"); `?preset=large` (l.109) and `?step=pending` jump (l.117-135); `createWorkspace` makes a **new org id each time** (l.54-84), not `org-hcb`; trial granted only when not gated (l.82); `bookCall` just toasts (l.140-143); submit → `landingRoute()` (l.155) |
| Routing rule | `lib/pricing.ts:106-116` | `needsSalesFirst` / `needsStaffApproval` (11+ or 200+). No `"unsure"` band |
| Enterprise state | `store/org.store.ts:117-129` | `createOrg` sets `billing:"trial"`, `approval: "pending"` when gated. `requestSales` (l.144) sets `salesRequested`; no slot/date. `approve()` (l.151) does **not** grant trial; only `store/demo.store.ts:69-70` (DemoDock) approves + grants |
| Retired steps | `welcome/{path,pending,ready}/page.tsx` | Already `redirect("/get-started")` (spec §5.1 says "redirect to /welcome": already done, to a different target) |
| Landing | `lib/landing.ts:9-26` | `setupGuideVisible()` = trial/payg only, not dismissed, not all done, not hidden by user → `/get-started`, else `/dashboard` |
| Invites (Bouncer) | `store/bouncer.store.ts:52,80` | `sendInvites(emails[], role, message)`: one role per batch. Accept (`:142-146`) completes `invite`. UI is the Bouncer mock `/bouncer` (`app/bouncer/_components/InviteDialog.tsx`), reached via `INVITE_HREF = /launch/bouncer?to=members&return=/dashboard` (`lib/setup-steps.ts:60`). **No invite UI exists inside onboarding** |

### 1.2 Get started (today)

| Piece | File:line | What it really is |
|---|---|---|
| Route | `app/(shell)/get-started/page.tsx` | Renders `GetStarted` |
| Page | `components/organisms/home/GetStarted.tsx:172-223` | Redirects invoiced orgs and hidden-guide users to `/dashboard` (l.177-182); 700 ms skeleton; then `PendingCallout` (l.114, warning, "Open the sample review" + "Book a call"), `WelcomeCallout` (l.71, sample CTA), `JoinedCallout` (l.31); **two-column `home-grid`**: `SetupChecklist` or `DoneCard` + side cards `SampleCard`, `WalletCard`, `SecurityPackCard`, `GuidesCard` (l.208-217) |
| Skeleton | `components/organisms/Skeletons.tsx:153-156` | `GetStartedSkeleton` is the two-column `home-grid` too (not in agent A's file list) |
| Checklist | `components/organisms/home/SetupChecklist.tsx` | Greeting head + `⋯` (hide / email list) (l.292-310); progress "n of N steps done" + "Earn up to 3 credits" with **coin icon** (l.312-339); **`UpNext` hero** with `GuidePlayer` video (l.108-188, 341-350); two groups "First review" / "Ready for your team" (`SETUP_GROUP_LABEL`, setup-steps l.14); row = dot · label · chip · `+1` coin · action (l.48-106); `DoneLine` fold (l.193) |
| Hover-only actions | `components/organisms/home/setup-checklist.css:285-308` | `.sc-act { opacity:0 }`, revealed on `:hover`/`:focus-within`/`.is-doing` |
| Steps data | `lib/setup-steps.ts:62-163` | 7 steps + pre-ticked `account` (counts in N → "x of 8"). Includes `sample_review`; **`tutorial` is already in the `SetupStepId` union** (`types/domain.types.ts:74`) but not listed |
| Earn | `store/onboarding.store.ts:117-140` → `store/wallet.store.ts:285` `award(stepId)` | Per **step**, `EARN_REWARD_CREDITS=1`, cap 3, steps `bank_policy/checklist/layout` (`lib/pricing.ts:24-30`) |
| Step completion hooks | grep `complete("…")` | `first_review` at Start (`reviews/[id]/page.tsx:80`, `run/RunModal.tsx`); `sample_review` on open (`reviews/[id]/page.tsx:92-96`); `sign_workbook` (`run/RunExperience.tsx`); `bank_policy` (`configure/organization/page.tsx`); `checklist`, `layout` (`store/templates.store.ts`); `invite` (bouncer accept); `security_pack` (`onboarding.store.ts:156`) |
| Nav | `components/templates/AppShell.tsx:69-100` | "Get started" + n/total already exists |
| Videos | `components/organisms/home/GuideVideo.tsx:30` `GuidePlayer` | Real `<video>` player (poster, seek, mute, fullscreen); every guide plays `PLACEHOLDER_VIDEO` (`lib/guides.ts:27`) |
| Empty states | `components/molecules/EmptyState.tsx:22-60` | Props `title, children, actions, status, preview (aria-hidden), aside, layout, framed`. **No `media` prop.** `EmptyLine` l.98; ghost parts l.121+ |
| Reviews level 1 | `app/(shell)/reviews/page.tsx:130-170` | `EmptyState` "No reviews yet", `GhostRows` preview, **sample-review aside** ("Open the sample"); header keeps only `OrderButton` (l.115). **No dropzone, no title** (Reviews has no `h1`; `PageHeader` is toolbar-only) |

### 1.3 Tours (today)

**None.** No `react-joyride`, `driver.js`, coachmark, `data-tour`, or tour store anywhere (`grep -ri tour src` hits only the `tutorial` id). `canvas-confetti` is not installed either. `react-joyride@3.2.0` (latest) declares peer `react 16.8 - 19`, so the React 19.2 risk in spec §9 is cleared, **but v3 is a new major**: build to the v3 API, not v2 examples.

---

## 2. Board vs reality

| Frame (id) | Board shows | Reality | Adaptation |
|---|---|---|---|
| B1 `#welcome` | Card + side panel "What Parachute checks", 4 volume bands incl. "I'm not sure yet", never-disabled Continue | Single centred card, no panel, 3 bands, disabled button, sample reassurance | Panel is net-new (not "moved out of the form" as §5.1 says). Two-column `.wel-stage` CSS + `StepPanel` are new. Drop the l.99-104 reassurance and `disabled` |
| B1 `#welcome-enterprise` | Mandatory route: callout "Teams your size start with a short call", button relabels "Book a call" | Optional callout, button stays "Continue to Parachute", user enters app pending | Copy + label swap is a small change in `OrgSetupForm`; the routing change needs `/welcome/call` |
| B1 `#welcome-invite` | Step 2, rows with per-row role, paste list, partial success | No invite step; Bouncer `sendInvites(emails, role)` is one role per batch | New route + `InviteStep`; store signature change (§5.1 already lists it). The Bouncer `InviteDialog` caller must be mapped |
| B1 `#book-call` | Scheduler in the card, "What happens next" in panel | Only a toast; no slot fields on the org | New route, `CallBooking`, `bookCall(slot)` + type fields (all in spec) |
| B1 `#setting-up` | Interstitial, 3 resolving lines | Nothing; submit pushes straight to `landingRoute()` | New state in `OnboardingFrame` |
| B1 `#first-arrival` | Shell with header credits pill, sidebar Trust/Learning links, welcome line, confetti, one column | Two columns + `WelcomeCallout` pointing at the sample; no header pill; no confetti dep | Depends on agents B (pill/links) and C0 (`celebrate`). `WelcomeCallout` already reads `welcomeDismissedBy` and `org.flags.welcomeBanner`; reuse the gate, swap the body |
| B1 `#get-started` / `-dark` | One column, 3 sections with earn pills, filled navy next row, resource cards | `UpNext` hero + 2 groups + side cards; actions hover-only; coin `+1` | Full rewrite of the render; data mostly exists (`useSetupSummary`). Sections need a `section` field in `SetupStepDef` (replaces `group`) |
| B1 `#get-started` row "Open review" (done) | Address of the first review + "Open review" | Progress stores only timestamps; no review id | Derive from reviews store (first non-sample review), don't add a field |
| B1 `#get-started` row "Sign workbook" | A button | `sign_workbook` has no action (tick-only, l.86-98) | Href = the first own review; if none, lock-explain "Run a review first" |
| B1 `#get-started-pending` | `PendingTracker`, hourglass pills, policy/checklist doable | `PendingCallout` warning + sample button; only `first_review` locked ("After approval" chip) | Tracker is new; lock rule widens to the whole `first_review` section (incl. `tutorial`, `sign_workbook`) |
| B1 `#get-started-fresh` (all done) | "All 8 done" card, collapsed section summaries | `DoneCard` (l.151) | Straight swap |
| B1 nav "Get started 0/8" | 8 steps excl. account | 8 = 7 steps + account | New list is 8 real steps; drop `+1` in `useSetupSummary` (`onboarding.store.ts:199,209`) |
| B1 `#reviews-empty` | Page title "Reviews" + tour chip, headline, **dropzone**, video "How a review works · 1:15" | No title, `OrderButton` in toolbar, `GhostRows`, sample aside | Add `media` to `EmptyState`; drop sample aside (PC-4); dropzone = reuse `IntakeWidget` drop or a `cfg-uploadzone`-style button linking to `/launchpad`. Tour chip needs a slot: Reviews has no title row |
| B1 `#tour` | **In-shell** page (sidebar + header + breadcrumb), source PDF left, "Findings" list right with Pass/Flag/Fail cards and **Accept / Disagree** buttons, "Sign workbook" in page header, "Tour, 2 of 4" in header | A review is a **full-viewport portaled takeover** (`.run`, z 120, `role="dialog" aria-modal`, `reviews/[id]/page.tsx:106-130`), no sidebar/header. Centre = the **workbook document** with findings inline; verbs are **Concur · Edit · Reject · Delete**; source opens as a docked pane only via "Cited p.N"; Sign is the footer "Sign & finalize" | Redraw the tour frame on the run takeover. Rewrite step copy to the real verbs. Step 3 ("Accepted findings land here") is wrong: the workbook is already the workspace (inline-workbook direction) |
| B2 `#trial-ending` | Dashboard banner for bonus ending / closed | No bonus window concept | Out of this scope (dashboard), but the Get started "Bonus ending/closed" states (§5.2) depend on the same `earnWindow()` |
| MP (motion) | Self-serve + enterprise paths, invite rows, interstitial, confetti | No `lib/motion.ts`, no `template.tsx`, no `MotionConfig` (motion-spec §0 is accurate) | No conflict found; motion-spec §2.2 layout/template plan fits the real route tree |

---

## 3. Tour targets (real elements)

### 3.1 `first-review` (4 steps), inside `RunExperience` (both `/reviews/[id]` and the `RunModal` overlay render it)

| # | Spec step | Real target (file:line) | Issue |
|---|---|---|---|
| chip | "Take a 1-minute tour" in the review header | `.run-head` (`components/run/RunExperience.tsx:586-595`): mark, title, close only | Add the chip + "Tour, 2 of 4" there, not in `PageHeader` |
| 1 | "Every figure, traced" · click a cited figure | `button.wb-fmeta-cite` "Cited p.{page}" (`components/review/WorkbookInline.tsx:173-179`) → opens docked `SourceDoc` (`RunWorkbook.tsx:439`) | One per finding: tag only the first visible finding |
| 2 | "Accept or disagree" | `.wb-fblock-bar` Concur/Edit/Reject/Delete (`WorkbookInline.tsx:260-280`) | Copy must say "Concur … Reject …". **`components/molecules/FindingDecisionBar.tsx` (listed in §5.13) is orphaned**: only `run/_archive/RunExceptions.tsx` imports it. Don't tag it |
| 3 | "Your workbook builds itself" | `.run-wb-zoom` / `WorkbookPreview` (`components/run/RunWorkbook.tsx:389-390`) | Reword: "This is the workbook. Your decisions edit it in place." |
| 4 | "Sign when it's right" | Footer "Sign & finalize" (`RunWorkbook.tsx:507-509`) | Fine. Signing completes `sign_workbook`, not `tutorial` |

Constraints: targets exist only when `spoke === "workbook"` and `ctx.ready` (after the simulated pipeline, `RunExperience.tsx:632-680`); Technical track only (Administrative uses `AttestationDecisionBar`). The tour must wait for that spoke, not start on route load. Overlay tier: `.run` is z 120 and some run popovers are z 130 (`globals.css:15033`). The tooltip and spotlight must sit above 130 and below the pill's 210, and must portal to `body`, not into `AppShell` (the takeover sits outside the shell's stacking context). The run is `aria-modal`, so the tooltip must be focusable while the dialog is open.

### 3.2 Page chips

| Tour | Spec step | Real target | Issue |
|---|---|---|---|
| `reviews` | Start a review | `OrderButton` in the toolbar (`reviews/page.tsx:115`) | OK |
| | Tabs and search | `Tabs` / `SearchInput` (l.89-104) | **Hidden in level-1 empty** (`!firstRun`). The chip shows on first visit, which is the empty page → target missing. Show the chip only once the queue has rows, or cut to 1 step when empty |
| | Row actions | `ReviewTable` row actions | Same: none when empty |
| `checklists` | Upload | `button.cfg-uploadzone` (`configure/checklists/page.tsx:116-141`) | OK |
| | Map items | Inside `ChecklistUploadWizard` (modal, opens only after a file) | Not on page. Move to a video or drop the step |
| | Set as default | `⋯` menu item (l.56) | Hidden inside a menu; target the `⋯` trigger of the first row |
| `workbook-layouts` | Built-in layouts | List page is only `FamilyTable` (`configure/workbook-layouts/page.tsx:72-82`) | No "built-in" element. Target the default row |
| | Edit sections / Publish | `configure/workbook-layouts/view/page.tsx` | Different route; tours are per route. Split the tour or retarget |
| `billing` | Balance | `section.ov-hero` (`components/organisms/billing/OverviewTab.tsx:72`) | OK (agent F redesigns it; re-tag after) |
| | Runway | `.ov-runway` (l.103) | OK |
| | Usage by person | `usage/UsageTab.tsx` (Usage tab) | Not on Overview. Retarget the Usage tab trigger |
| | Add credits | `PageHeader` button (`configure/billing/page.tsx:137`) | OK |

**Chip slot:** `PageHeader` exists on Reviews (toolbar only) and Billing, but **Checklists and Workbook layouts render no `PageHeader`**; their title is the shell breadcrumb (`AppShell.tsx:195`). `TourChip` in `PageHeader` alone will not reach them. Use a shell header slot beside `Breadcrumbs`, driven by `lib/tours.ts` route patterns.

---

## 4. Fast-path notes (least plumbing first)

1. **Get started v4 visuals (half a day, one agent).** Same route, same stores. Rewrite `setup-steps.ts` (add `section`, add `tutorial`, drop `sample_review`, new copy) and the `SetupChecklist` render; delete `UpNext`/side cards; remove CSS l.285-308. Earn pills can read the existing `pricing.ts` first and switch to section rewards when C0 lands. Also fix `GetStartedSkeleton` (two-column). Most visible change for the least plumbing.
2. **`OrgSetupForm` copy + live routing (about 1 hour).** Add the "unsure" band, the new callout copy, the Continue↔Book a call label, remove the reassurance and `disabled`. Visible without new routes; Book a call can temporarily keep `requestSales`.
3. **Reviews empty state (about 1 hour).** `EmptyState.media` + `GuidePlayer`, drop the sample aside, add the dropzone. `GuidePlayer` is ready to reuse.
4. **Side panel + 2-step frame.** CSS + `StepPanel`. Medium; do it with `OnboardingFrame` (welcome `layout.tsx`), not before.
5. **Invite / Book a call / interstitial.** New routes plus a store signature change. Medium.
6. **Tours.** The most plumbing: new dep, store, host, and targets in four owners' files, plus the takeover z-index. Phase 3 is right.

Gotchas: every `/welcome` submit creates a fresh org (`useWelcome.ts:60`). Until PC-19 (`org-hcb` upsert) lands, demo resets accumulate orgs. Enterprise trial on approval exists only in `demo.store.ts`, so `org.store.approve()` must grant trial once DemoDock is deleted (agent D).

---

## 5. Recommended spec edits

- **§5.1 Components / OrgSetupForm:** replace "The side panel is no longer inside the form" with "there is no side panel today; `StepPanel` and the two-column `.wel-stage` are new". Note `disabled` at l.107.
- **§5.1 Routes:** `/welcome/path|pending|ready` already redirect to `/get-started`. Keep that target; no change needed.
- **§5.1:** add "`org.store.approve()` grants the trial (today only `demo.store.ts:69-70` does)", owned by H or C0.
- **§5.2:** add `components/organisms/Skeletons.tsx` (`GetStartedSkeleton`) to agent A's files. State that `useSetupSummary` drops the `+1` account count. `SetupStepDef.group` becomes `section` (`first_review | own_rules | team`). "Open review" and "Sign workbook" hrefs derive the first non-sample review from the reviews store. Widen the pending lock to the whole `first_review` section.
- **§5.12:** the Reviews level-1 dropzone is new (none today). Say whether it links to `/launchpad` or embeds `IntakeWidget`. Reviews has no title row, so the chip needs a toolbar slot.
- **§5.13 target files:** remove `components/molecules/FindingDecisionBar.tsx` (orphaned). Add `components/review/WorkbookInline.tsx` (cite button + decision bar) and `components/run/RunWorkbook.tsx` (workbook + Sign & finalize). The review chip goes in `RunExperience.tsx` `.run-head`, not `PageHeader`. Add an AppShell header slot for the chips on Checklists and Workbook layouts.
- **§5.13 copy:** step 2 → "Concur or reject" ("Concur to keep a finding. Edit or Reject to put it in your own words."). Step 3 → "This is the workbook" (decisions edit it in place). The Get started row copy "accept or flag a finding" → "concur with or reject a finding".
- **§5.13 rules:** `first-review` starts only when the run is on the workbook spoke and ready (Technical track). The tooltip sits at z > 130 and < 210 and portals to `body`. Chips show only when their targets exist (Reviews chip after the first row, or a 1-step empty variant). Rework the checklists, layouts and billing tour steps per §3.2 (Map items, Edit/Publish and Usage by person are not on those pages).
- **§5.13 dep:** pin `react-joyride@3.2.0` (peer React ≤19 verified 11 Nov); v3 API.
- **B1 `#tour` frame:** redraw on the run takeover (no sidebar/header, workbook centre, Concur/Edit/Reject/Delete, footer Sign & finalize, source as a docked pane) so the board stops promising an in-shell split view.
- **§8 ownership:** K's `data-tour` requests go to the owners of `components/review/WorkbookInline.tsx` and `components/run/RunWorkbook.tsx` (currently unassigned; give them to the coordinator), not to `FindingDecisionBar`.
