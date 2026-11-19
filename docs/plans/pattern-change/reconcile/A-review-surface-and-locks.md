# Reconcile A: the review surface, Start, locks and the first-review tour

**Scope:** how `/reviews/[id]` and the Start/Run flow really render, set against every board frame that draws a review, a Start, a lock dialog, a reviewer credit request or a tour step. Read-only audit, 11 Nov 2026, branch `feat/pattern-change` at `d023d83`. Paths are relative to `app/src/` unless they say otherwise.

**Short version:** a review is never inside the shell. It is a full-viewport `.run` takeover, portaled to `<body>` at z-index 120. It covers the sidebar, the header (so the credits pill, bell and search are hidden) and the breadcrumbs. It has its own slim top bar, a left rail (Workbook · Source), a document toolbar and a sticky footer. The Start gate (`RunConfirm`) is a page in that takeover, not a dialog over the queue. Boards 1 #tour and 2 #start-low-balance / #billing-zero draw it inside the shell, so the lock dialog, the tour coachmarks and the credits display all need re-anchoring.

---

## 1. Real structure

### 1.1 Route and mounting
- `app/(shell)/reviews/[id]/page.tsx` sits in the `(shell)` group, so `AppShell` mounts underneath (`app/(shell)/layout.tsx:1-9`). But the page returns `createPortal(<motion.div className="run" role="dialog" aria-modal="true">…, document.body)` (`page.tsx:100-130`), so it covers the whole viewport, sidebar and header included. The comment at `page.tsx:100-103` says this is deliberate.
- `.run` = `position: fixed; inset: 0; z-index: 120; background: var(--md-bg)` (`app/globals.css:11691-11698`).
- Z-tiers already lifted for things that open over the run: `--rw-z-overlay 130`, `--rw-z-modal 140`, `--rw-z-toast 150`, `--rw-z-tooltip 160` (`components/organisms/wallet/wallet.css:332-343`). The Sign modal backdrop is 130 (`globals.css:15033`).
- The page seeds `run.store` once per id via `enterReview` (`page.tsx:38-57`). `runEntry` maps status to spoke: `intake → confirm`, `running → progress`, `in_review/returned → workbook`, `completed → workbook (read-only)`, `autorejected → triage` (`lib/review-lifecycle.ts:209-223`).
- A second host is the **global overlay** `RunModal`, mounted once in `AppShell` (`components/templates/AppShell.tsx:209`) and driven by `useRunStore.open`. It is the same `.run` takeover (`components/run/RunModal.tsx:103-120`) and serves the drop/YouConnect confirm gate before a review exists, plus the embedded YouConnect session.
- `run.store` is a plain Zustand store, **not persisted** (`store/run.store.ts:121`). `RunConfirm`'s type selection and field edits are local `useState` (`components/run/RunConfirm.tsx:131-150`), so they are lost on navigation or reload.

### 1.2 Chrome inside the takeover (`components/run/RunExperience.tsx`)
| Zone | Where | What |
|---|---|---|
| Top bar `.run-head` | `:586-595` | Logo mark · address title + `propertyType · bank · Loan #` sub-line · close `IconButton` (X). No credits pill, no search, no bell, no avatar, no breadcrumbs, no page-bar/`PageHeader`. |
| Type tabs `.run-types` | `:638-650` | `Tabs` Technical / Administrative, **only when both types were ordered**. |
| Sample banner | `:653-662` | Sample only: "Run your own report" → `/launchpad`. |
| Left rail `RunNav` | `:668-676` (technical), `:730-737` (admin) | Workbook · Source (admin: Attestation · Source). Disabled until `ctx.ready`. |
| Stage | `:597-773` | Cross-fades `triage → confirm → progress → review` (`AnimatePresence`, keyed per spoke). |
| Sign | `:776-786` | `RunSignModal`, a floating 2-step seal at z 130. |
| Escape | `:562-574` | Document-level `keydown`: Esc closes **the whole review** unless `.ui-menu-pop` is open or spoke is `progress`. |

**Workbook view** (`components/run/RunWorkbook.tsx`):
- Toolbar `.run-wb-bar` (`:247-348`): "Workbook" + Draft/Final pill · zoom · page indicator · `Edit | Preview` segmented (`.run-wb-viewmode`, `:308`) · `Activity` / `Customize` panel toggles (`:326-345`).
- Document: paper, CSS `zoom`. Findings are **inline blocks in the workbook** (`components/review/WorkbookInline.tsx`), not a separate findings list.
- Each AI finding block has a meta row with the cite button `.wb-fmeta-cite` (`WorkbookInline.tsx:174`, which opens the Source pane **docked on the right**, `RunWorkbook.tsx:132`) and a decision bar `.wb-fblock-bar`: **Concur · Edit · Reject · Delete** + Comment/Flag (`WorkbookInline.tsx:260-296`). Severity labels are Critical / Fail / Flagged / Pass / N/A (`lib/utils.ts:35-43`).
- Footer `.run-foot` (`:464-512`): unsigned = `View source` (outline) + **`Sign & finalize`** (primary, `:507`). Signed = Download · Receipt · Go to reviews.
- `FindingDecisionBar` (the molecule the spec targets) is **not used by the live run**. Only `components/run/_archive/RunExceptions.tsx` uses it.

### 1.3 Confirm gate = the real "Start" (`components/run/RunConfirm.tsx`)
- A full-page centred column, no side nav: title **"Review setup"** (`:224`), parsed-file chip (`:233-250`), **Review type** checkboxes with `TypeCostChip` `[1 credit][~$150]` (`:253-299`), Property details form (`:302-333`), "Advanced setup" disclosure (`:340-402`).
- Sticky footbar `.run-cf-footbar` (`:418-436`): `CostSummary` (left) · Cancel · **Start review**.
- `canStart = selected ≥ 1 && address && cost.affordable` (`:182-183`). Button: `disabled={!canStart && !short}` (`:428`). It is truly **disabled** for zero types or an empty address, and stays clickable when credits are short.
- **Short on credits today:** `short` renders `LowBalanceCallout` inline at the end of the form (`:404-412`), and it auto-scrolls into view 500 ms after render (`:194-198`). Clicking Start while short scrolls to and focuses the callout (`:201`). The callout (`CostSummary.tsx:141-213`): admin gets "Add N credits · $X" → `openTopUp` (dialog). "Run X only" **only changes the selection**; it does not start. Non-admin gets "Ask your admin" → a toast only (no stored request).
- Approval (pending org) is **not checked** in the gate. Only the wallet is.

### 1.4 Where credits are checked at Start
| Host | Check | On short |
|---|---|---|
| `RunConfirm` (UI) | `useRunCost` → `affordable` (`CostSummary.tsx:42-62`). Computes its own balance from the ledger, not a shared view | Inline callout |
| `RunModal.onStart` (drop / YC from dashboard) | `wallet.canAfford(costFor(types))` (`RunModal.tsx:246-253`), as a backstop | `openTopUp({reason:"low_balance"})`. Nothing is created |
| `RunModal.onStart`, embedded | none (`:241-245`) | — |
| `/reviews/[id]` `onStart` (intake review) | `canAfford` (`page.tsx:63-70`) | `openTopUp` |
| Debit | `debitForReview` at Start only (`page.tsx:79-87`, `RunModal.tsx:278-282`) | — |

Route-on-Start: the drop flow creates the review only when Start is clicked, then navigates to `/reviews/<new id>` (`RunModal.tsx:254-285`). **Before Start, no review or draft exists.** The callout's "Your upload is saved as a draft" (`CostSummary.tsx:183`) is not true today.

---

## 2. Board vs reality

| Board section id | Board shows | Reality | Adaptation |
|---|---|---|---|
| **B1 `#tour`** (frame 17) | The review **inside the shell**: sidebar, header with crumbs "Reviews › 4410 Bayside", **credits pill**, search, bell, avatar; a page-bar with title, "Tour, 2 of 4" chip and a **"Sign workbook"** button top-right; split workspace with **Source on the left** and a **"Findings" list on the right** (Pass/Flag/Fail pills, **Accept / Disagree**); coachmark "Tip 2 of 4" ringing Accept | `.run` takeover: `.run-head` (logo · address · sub · X), optional Technical/Administrative tabs, left rail Workbook · Source, document toolbar, **findings inline in the workbook paper**, Source pane opens **on the right** from a cite, **Concur · Edit · Reject · Delete**, `Sign & finalize` **in the bottom footer**. No pill, no crumbs | Redraw on the run chrome. "Tour, n of 4" and the tour chip go in `.run-head`, between the title block and the X (`RunExperience.tsx:590-594`). Coachmark targets: step 1 → first `.wb-fmeta-cite`; step 2 → first pending `.wb-fblock-bar` (ring **Concur**); step 3 → `.run-wb-viewmode` (Edit/Preview) or the `.run-wb-bar` "Workbook · Draft" label; step 4 → the `Sign & finalize` footer button. Rewrite copy to the real verbs (see §4). Run only on spoke `workbook`, technical track, `ctx.ready` |
| **B1 `#reviews-empty`** (16) | Reviews first-run block with an **"Upload an appraisal" button + "PDF up to 300 pages"** in the page body; tour chip in page header | `/reviews` first run: `EmptyState` with ghost rows and "Open the sample" aside; the **only** Start is `OrderButton` in the page header (`app/(shell)/reviews/page.tsx:115`). It routes to `/launchpad`; there is no upload in the empty state | Either build the in-page upload (new: it must open `RunModal` at confirm like `IntakeWidget.start`, `IntakeWidget.tsx:72-82`), or keep the header button and route to `/launchpad`. Either way it is a Start site and needs `LockedAction`. PC-4 removes the sample aside |
| **B2 `#start-low-balance`** (code label "Run takeover · Confirm") | **Shell + Reviews queue** behind a scrim; a 560 px **dialog** "Start a review / Check the report and pick what to run" with a file row + "Replace", type rows, costline "Uses 2 credits · you have 1", Cancel / Start review. After the click, a **second dialog replaces it**: "You need 1 more credit", Back / Run Technical only / Add 1 credit | Start is the full-page `.run` confirm gate "Review setup" (no shell, no queue behind it). The cost sits in `CostSummary` in the sticky footbar: `[2 credits][~$300] │ ⚠ Balance 1`. Short today = an inline callout in the form | Frame 1: draw the `.run` confirm page (top bar + centred column + footbar). The board's costline maps onto `CostSummary`, and nothing new is needed. Frame 2: `LockDialog` opens **over the `.run` takeover**, centred on the viewport, with the confirm page still visible behind its scrim. It does **not** replace the gate. "Back" closes the dialog and returns focus to **Start review**. Delete the inline `LowBalanceCallout` and its auto-scroll |
| **B2 `#billing-zero`** ("Billing overview: zero, after clicking Start") | "You're out of credits" dialog over the **Billing page** | Start is clicked in the run confirm gate, so the dialog appears over `.run`, not Billing | Split it in two: (a) Billing at zero (page state, no dialog); (b) the "out of credits" `LockDialog` drawn over the run confirm page. Fix the frame title |
| **B1 `#lock-explain`** (14) | Get started (shell) with the **sidebar Start** carrying an hourglass; centred dialog "Credits open when Harbor is confirmed" + tracker | Matches: the sidebar `navAction` is in the shell (`AppShell.tsx:151-186`). It is `aria-disabled` + Tooltip today | Fine as drawn. The dialog is centred and modal; focus returns to the `SidebarAction`. Collapsed rail: today the reason rides the library tooltip (`:157-168`). Replace it with click → dialog |
| **B1 `#lock-explain-reviewer`** (15) | Dashboard, reviewer, dialog "Reviews open after Harbor's setup call" | Shell surface. Correct. Also reachable today from **inside a review**: the queue "Run" on an intake row → `/reviews/[id]` confirm, which has no approval check at all | Add the approval variant to the run confirm Start too (the dialog over `.run`) |
| **B1 `#get-started-pending`** (11), **`#credits-popover`** (13) | Get started "Upload appraisal" row with an hourglass; "Open review" link; "Start tour" | `SetupChecklist` rows show "After approval" and **no action** when locked (`components/organisms/home/SetupChecklist.tsx:77-78,92`); the Upload link → `/launchpad` (`:95`, `lib/setup-steps.ts:84`) | Upload row = `LockedAction` (hourglass) → approval dialog. "Open review" / "Start tour" land on `/reviews/[id]` (`.run`), so the tour begins in the takeover, not the shell |
| **B2 `#reviewer-billing`**, **`#admin-request`** | Request form on Billing (shell); Dana's request in the **header credits popover** | Billing and the dashboard are shell pages, so this is correct. But the reviewer meets the shortfall **in the run confirm gate**, where today they get a toast only | The "Credits, reviewer" `LockDialog` variant opens over `.run` and must write the same `credit-request.store` record that Billing's form writes. Dana inside a review cannot see the pill, so the request should also reach her through the bell/email |
| **B1 `#checkout-amount`**, B2 `#checkout-*` | Focused checkout outside the shell, "Exit checkout" | No checkout exists yet. Leaving the run for `/checkout/credits` unmounts `RunConfirm` (local state lost) | See §4: create a draft review before leaving and use `return=/reviews/<id>` |

---

## 3. "Start a review" entry points today

| # | Entry | File:line | Does now | Locked today |
|---|---|---|---|---|
| 1 | Sidebar primary "Start a review" | `components/templates/AppShell.tsx:151-186` | `Link` → `/launchpad` | `aria-disabled` span + Tooltip/library tooltip (approval only) |
| 2 | Reviews header `OrderButton` | `components/organisms/OrderButton.tsx:20-35`, used at `app/(shell)/reviews/page.tsx:115` | `router.push("/launchpad")` | `disabled` + Tooltip |
| 3 | Dashboard first-run block | `components/organisms/dashboard-widgets.tsx:146-153` | push `/launchpad` | `disabled` |
| 4 | Command palette, "Go to" nav item | `components/organisms/CommandPalette.tsx:27,113` | push `/launchpad` | `disabledReason` |
| 5 | Command palette, action | `CommandPalette.tsx:117-125` | push `/launchpad` | `disabledReason` |
| 6 | Launchpad dropzone / file pick | `components/organisms/IntakeWidget.tsx:72-96,192-236` | 700 ms "parsing" → `openRun(DEMO_RUN_REVIEW_ID,{startAt:"confirm"})` (the `RunModal` overlay) | silently no-ops; drop says "Not open yet" + reason |
| 7 | Launchpad "From YouConnect" delivery rows | `IntakeWidget.tsx:286-302` | same, `source:"yc"` | `disabled` + `title` |
| 8 | Breadcrumb lock chip on `/launchpad` | `components/molecules/Breadcrumbs.tsx:103-107` | shows the reason as a chip (not an action) | — |
| 9 | Get started "Upload" (row + Up next) | `components/organisms/home/SetupChecklist.tsx:95,135`; `lib/setup-steps.ts:84` | `Link` → `/launchpad` | row hides the action, shows "After approval" |
| 10 | Queue row "Run" (intake reviews) | `lib/review-lifecycle.ts:243-251` (`nextActionView`) | → `/reviews/[id]`, then the confirm gate | **no approval gate** |
| 11 | Sample banner "Run your own report" | `components/run/RunExperience.tsx:659` | push `/launchpad` | none |
| 12 | `/launch` SSO handoff | `app/launch/page.tsx:32` | auto-routes to `/launchpad` after 3.6 s | — |
| 13 | YouConnect embedded | `app/youconnect/page.tsx:93` | `openRun(...)` embedded; Start advances in place | **no wallet check** (`RunModal.tsx:241-245`) |
| 14 | **Start review** (the commit) | `components/run/RunConfirm.tsx:424-434` → `RunModal.tsx:240` or `app/(shell)/reviews/[id]/page.tsx:63` | creates or flips the review to running, debits, then progress | `disabled` (0 types / no address); short → callout; backstop `openTopUp` |

Not real today: the spec's "`app/(shell)/reviews/page.tsx` (empty-state upload)" Start site (§5.5) does not exist. Entries 9, 10, 11 and 13 are missing from the spec's Start-site list. (Side note: `autorejected` rows link to `/reviews/<id>/triage`, `review-lifecycle.ts:259`, but only `[id]/page.tsx` exists.)

---

## 4. Recommendations for the spec

**Surface model (new §5.5 preamble, and a note in §5.3 / §5.13):**
- Add a rule: "`/reviews/[id]` and the drop/YC confirm gate are a full-viewport `.run` takeover (z 120, portaled to body), not a shell page. No sidebar, header, credits pill, crumbs or `PageHeader`. Anything that opens over a review must use the lifted tiers (`--rw-z-modal` 140) or it renders behind the run."
- §5.3: the credits pill is **not visible in a review**. In-run balance = `CostSummary` in the confirm footbar. Change `useRunCost` (`CostSummary.tsx:42-62`) to read `lib/wallet-view.ts`, and add `CostSummary` to the "same number everywhere" acceptance. Do not add a pill to `.run-head`.
- Ask the board owner to redraw B1 `#tour` and B2 `#start-low-balance` frame 1 on the run chrome, and to re-title B2 `#billing-zero` (the dialog belongs to the run, not Billing).

**§5.5 Lock-then-explain:**
- `LockDialog` must portal at `--rw-z-modal` (140), so it shows over `.run`. Add as acceptance: "opens over the run confirm gate; the gate stays visible behind the scrim; Back/close returns focus to Start review".
- **Esc conflict:** `RunExperience.tsx:562-574` closes the whole review on any Esc that is not inside a `.ui-menu-pop`. The LockDialog's Esc must not also close the run. Either `stopPropagation` in the dialog, or extend the run guard to skip when a `[role=dialog]` sits above `.run`. Verify the same for today's `TopUpModal`.
- Start-site list: drop the non-existent "reviews empty-state upload" (or mark it **new**, if #reviews-empty is kept). Add `SetupChecklist.tsx` (Upload row + Up next), `lib/review-lifecycle.ts` queue "Run" (via `RunConfirm`), the sample-banner link (it goes away with PC-4) and the IntakeWidget **YC rows** (`:301`), as well as the dropzone. `SetupChecklist.tsx` is owned by agent A (`home/**`); assign the `LockedAction` wrap explicitly.
- `RunConfirm` must also read `useStartGate()`. Start while pending → approval variant (closes the queue "Run" hole).
- "Zero types / empty address": keep Start clickable; on click show the existing inline note (`RunConfirm.tsx:294-298`) and focus the first gap. Do not use `disabled`.
- **"Run Technical only"** in the dialog: the board says it starts now ("Uses your 1 credit now"). `LockReason` therefore needs a callback, not just `resume?: string`, e.g. `onRunOnly?: (t: ReviewType) => void` set by `RunConfirm`, which calls its own `onStart`. Otherwise the button only re-selects, as today.
- Drop or log the copy "You can add the Administrative review to this report later": there is no add-a-type-after-Start path (types are committed once at Start, `page.tsx:71-78`). Log it as a client question if wanted.
- **Draft + resume:** "the uploaded report is kept as a draft" is false today (Route-on-Start creates nothing before Start, and `run.store` is not persisted). Spec it: on "Add credits" / "Continue to checkout" from the drop flow, `addReview({status:"intake", reviewTypes:selected, …})` first, then go to checkout with `return=/reviews/<id>`. On return, `runEntry` (intake → confirm) reopens the gate. Lift the type selection into `run.store` (or the draft's `reviewTypes`) so it survives the trip. The same draft is the "Waiting to start" count on B2 `#billing-zero`.
- The reviewer variant writes a `CreditRequest` (`credit-request.store`, §5.9). It replaces the toast-only "Ask your admin" in `CostSummary.tsx:167-172`. Retire `LowBalanceCallout` entirely.
- Embedded (YouConnect) runs: state that no lock dialog fires there (no wallet check by design), or add one; today it is silent.

**§5.13 Tours (first-review):**
- Targets: `data-tour` attributes go in `components/run/RunExperience.tsx` (`.run-head` chip slot), `components/run/RunWorkbook.tsx` (toolbar, `Sign & finalize` at `:507`) and **`components/review/WorkbookInline.tsx`** (`.wb-fmeta-cite`, `.wb-fblock-bar`). Remove `components/molecules/FindingDecisionBar.tsx` (archived only) and `components/run/RunSign.tsx` (the seal modal, not the trigger) from the target list. `app/(shell)/reviews/[id]/page.tsx` only renders the portal and needs no attribute. Add `WorkbookInline.tsx` to an owner (it falls under no agent today).
- TourChip / "Tour, n of 4" live in `.run-head`, not `PageHeader`.
- Start condition: spoke `workbook` + technical track + `ctx.ready` (after `RunProgress` auto-advances). Never on `confirm`, `progress` or `triage`. On a two-type run, force the Technical tab first.
- Copy to match the real UI: step 2 "**Concur** to keep a finding as written. **Edit** to put it in your own words, or **Reject** it with a reason." Step 3: findings already sit in the workbook, so reword as "This is the workbook. Preview shows exactly what gets signed" (target `.run-wb-viewmode`). Step 4 target is the footer "**Sign & finalize**". "Only approvers sign" is not enforced in `RunSign` today; keep the copy only if a role gate is added, or log it.
- Step 1: the cite opens the Source pane **on the right** (`RunWorkbook.tsx:132`). The board's left-hand source is wrong.
- Z-order: Joyride's default z-index (100) renders **behind** `.run` (120). Set the overlay/tooltip at 125–129 (above the run, below `--rw-z-overlay` 130 and the Sign modal 130). The tour must end before the Sign modal opens. Also check spotlight rects inside the CSS-`zoom`ed document (`.run-wb-zoom`) and inside its own scroll container.
- "First visit to a review" chip (PC-14): define it as the first time the user reaches spoke `workbook` on their own review, not first route hit.
