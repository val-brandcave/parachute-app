# Final whole-branch review: fixes

Branch `feat/pattern-change`, on top of HEAD `6f993fb`. Nothing committed. All paths below are relative to `app/` unless they start with `docs/`.

## 1. IMPORTANT: "Run a review first" opened the wrong dialog

**Confirmed:** `SetupRow` sent `{ kind: "role", action: "Run a review first", admin }`. `RoleBody` ignores `action` and always shows "Only admins can buy credits", and its "Ask <admin>" could file a credit request from an admin to themselves.

**Change:**
- `src/store/lock.store.ts`: new `LockReason` kind, `{ kind: "needs-review" }`.
- `src/components/organisms/lock/NeedsReviewBody.tsx` (new): spot art `10b-locked-feature` at 100 px with no panel (the same rule the other lock bodies follow). Title "Run a review first". Copy: "The tour and signing happen inside a review of your own. Upload an appraisal to start one, then come back here." Actions: Close (ghost) and primary "Upload appraisal". The primary goes to the `first_review` step's own `action.href`, read from `SETUP_STEPS`, so the two links can't drift apart.
- `src/components/organisms/LockDialog.tsx`: renders the new body. Its `A11Y_TITLE` map has the new kind.
- `src/components/molecules/LockedAction.tsx`: `lockReasonText` covers the new kind. The switch is exhaustive, so `tsc` requires it.
- `src/components/organisms/home/SetupRow.tsx`: the Start tour and Sign workbook rows now call `openLock({ kind: "needs-review" })`.
- `scripts/flows/t2_1_get_started.py`: for the approver (Cedar), Start tour must open lock kind `needs-review`. The dialog text must contain "Run a review first" and must NOT contain "Only admins can buy credits". It must offer "Upload appraisal" and "Close".

**Verified:** `t2_1_get_started` PASS, 0 problems, across all personas, themes and widths. I also checked `t2-1-approver-approver-dark-1440.png` by eye: the right dialog, art and buttons.

## 2. IMPORTANT (RF3): invoiced reviewer usage disagreed across surfaces

**Confirmed:**
- (a) The popover's "You used N" summed the raw wallet ledger, which is empty for invoiced orgs, so it showed 0.
- (b) `UsageTab` returned `invoicedActivity(all reviews)` before the `mine` filter, so the reviewer's table listed their teammates' reviews.
- (c) `invoicedActivity` repeated the cost and date re-basing logic of `invoicedSpendEntries`. It also priced rows at `CREDIT_USD` (150), while the invoiced strip and the popover use `INVOICED_CREDIT_USD` (140).

**Change:**
- `src/lib/wallet-view.ts`: `monthOf` is now exported. New `usedBy(entries, userId, period)`, built on `usageByPerson`.
- `src/store/useWalletView.ts`: new `useWalletSource()` returns `{ source, now }`. Wallet orgs get their ledger; invoiced orgs get `invoicedSpendEntries(reviews, now)`. `useWalletView` now derives from it. It is exported from `src/store/index.ts`.
- `src/components/organisms/CreditsPopover.tsx`: "You used N" is now `usedBy(source, me.id, monthOf(now))`. The source and `now` are the ones the headline uses.
- `src/components/organisms/billing/billing-data.ts`: `invoicedActivity(entries, reviews, userName)` now builds its rows from `invoicedSpendEntries` entries. One cost, one re-basing, priced at `INVOICED_CREDIT_USD`.
- `src/components/organisms/billing/usage/UsageTab.tsx`: invoiced rows are built from the same `source` the donut and strip read. For a reviewer, that source is already `mineOnlyLedger`, so the table holds only their own runs.
- `src/lib/wallet-view.test.ts`: new `usedBy` test over invoiced entries (per person, no-runs = 0, org total unchanged).
- `scripts/flows/t2_2_credits_chrome.py`: new persona `invoiced-reviewer` and a new check, `numbers_agree_invoiced_reviewer`. It asserts:
  - the pill equals the popover headline;
  - the popover's "You used N" equals the Billing usage strip;
  - N equals the table's credits for this month.
  - When N is 0, it asserts that no table row this month carries credits, or that the reviewer's empty usage state shows.

**Verified:** I probed `/demo/invoiced-reviewer` before writing the check.
- The pill and the popover both read "3 credits used" (org).
- The popover reads "You used 0 this month".
- Billing → Usage shows the reviewer's empty state ("Your usage starts with your first review"). It no longer lists teammates' reviews.

`t2_2_credits_chrome` PASS, 0 problems, including all four `invoiced-reviewer` runs.

**Limit:** in the seed, the invoiced-reviewer persona has no reviews assigned, so the live check passes on the 0 branch. The non-zero branch (strip and table sum equal N) is written, but the current seed never exercises it. The `usedBy` unit test covers the non-zero arithmetic.

**Left as is (out of scope):** `invoicedStatement` still bills 1 credit at `CREDIT_USD` per review type, while the usage view uses `REVIEW_TYPE_COST` × `INVOICED_CREDIT_USD`. Today both review types cost 1 credit, so no number differs. The dollar rate still differs (150 vs 140), which is worth a look by whoever owns statements.

## 3. Minor: two `CheckoutBlock` rules

**Change:**
- `src/lib/checkout.ts`: one pure `checkoutBlock({ embedded, billing, role, approval })` returning `"embedded" | "invoiced" | "role" | "approval" | null`. It checks in that order.
- `src/lib/checkout.test.ts`: 8 cases covering each reason and the precedence order.
- `src/components/organisms/CheckoutLauncher.tsx`: `currentCheckoutBlock()` reads the stores and calls the pure function. On `approval` the launcher now opens the approval lock directly. Before, it navigated to checkout, which then showed the approval block.
- `src/app/(shell)/reviews/[id]/page.tsx` and `src/components/run/RunModal.tsx`: renamed to `currentCheckoutBlock()`.
- `src/app/checkout/credits/hooks/useCheckout.ts`: uses `checkoutBlock` and now reads the session mode.
- `src/app/checkout/credits/page.tsx`: `BlockedNote` gets "embedded" copy ("Credits are billed through YouConnect"). The auto-lock effect skips `embedded`, the same way it already skipped `invoiced`.

**Verified:** vitest green. `t3_1_checkout` and `t3_2_billing`: see the test summary below.

## 4. Minor: dead wallet.store API

**Grep-confirmed with no callers** (the only hit was the definition): `remainingBySource()`, `canAfford()`, and `TopUpReason` (`"low_balance"` was never produced). `TopUpIntent.reason` was written but never read: `CheckoutLauncher` reads only `needed` and `request`.

**Change:**
- `src/store/wallet.store.ts`: removed all of the above. `openTopUp(opts?: { needed?, request? })`.
- `src/store/index.ts`: dropped the `TopUpReason` export.
- Callers updated to stop passing `reason: "manual"`: `billing/BonusNotice.tsx`, `billing/useBilling.ts`, `CommandPalette.tsx`, `CreditsPopover.tsx`.
- `AGENTS.md`: the `openTopUp` line now reads `openTopUp({ needed?, request? })`.
- `remainingFromLedger` and `sourcesFor` stay: `debitForReview` and the tests use them.

## 5. Minor: the popover "Ask" button was silent with a live request

**Change** (`CreditsPopover.tsx`): with a live request, the button keeps its look and label ("Dana has been asked"), plus:
- `aria-disabled="true"`;
- `aria-describedby` pointing at a visually hidden reason, "Request sent <when>" (from the reviewer's newest live request, using the popover's existing `requestAge`);
- a click shows an info toast: "Request sent just now — Dana has your request. You can ask again once it is answered." It never files a second request.

The reason is visually hidden because the visible label already says the request went out, and the footer row has no room for a third line.

**Verified:** live probe, persona `reviewer`.
- Before the click: no `aria-disabled`.
- After asking: `aria-disabled="true"`, the describedby text reads "Request sent just now", and a second click shows the toast.
- `t4_4_requests`: see the summary below.

## 6. Minor: dead `.rq-sample*` CSS

**Confirmed:** no TSX or flow uses `rq-sample` (and no dynamic `rq-${…}` class exists). Removed the block from `src/app/(shell)/reviews/reviews.css` and retitled its header comment. `.rq-tourwrap`, `.rq-start` and `.rq-foot` are still used and stay.

## 7. Minor: Prototype Index planned chips navigated silently

**Change** (`src/app/prototype/PrototypeIndex.tsx`): a new `StateChip` is used by both the screen cards and the States table. A planned chip:
- keeps `is-planned`;
- gets `aria-disabled`;
- on click, calls `preventDefault` and shows the same `plannedToast` (from `ProtoKeys`) that the pill and Alt+1…9 use.

Built chips are unchanged.

**Verified:** typecheck, lint, and `t5_5_index`. **Could not exercise live:** the registry has no state with `status: "planned"` today (every `st()`/`variant()` is `built`; only the `suspended` preset is planned, and that is handled separately in `ScenarioPopover`). So the toast path has no chip to click until a planned state is added.

## 8. Minor: spec says LockDialog `size="sm"`

**Change:** in `docs/plans/pattern-change/spec.md`, the T4.1 row (~351) and Appendix A (~1060) now read `sm`, with `md` for the admin credits options dialog. The matching comments in `LockDialog.tsx` and `lock/lock.css` now say the same.

## Test summary

- `npx tsc --noEmit`: clean.
- `npx eslint src --ext .ts,.tsx`: clean.
- `npx vitest run`: 13 files, 141 tests, all passed. 9 of them are new: 8 `checkoutBlock` tests and 1 `usedBy` test.
- Smoke on my own server (`NEXT_DIST_DIR=.next-fr npx next dev -p 3520`, out `app/.smoke/fr`):
  - `t2_1_get_started`: PASS, 0 problems.
  - `t2_2_credits_chrome` (holds `numbers_agree`): PASS, 0 problems.
  - `t3_1_checkout`, `t3_2_billing`, `t4_4_requests`, `t5_4_pill`, `t5_5_index`, `t4_1_lock_dialog`: PASS, 0 problems.
  - `--all` was not completed on the fixer's server (it exited mid-run); the coordinator ran `--all` on :3000 (see the ledger).

The `:3000` server was not touched. The `.next-fr` server was stopped and `app/.next-fr` deleted afterwards. `tsconfig.json` was rewritten by `next dev` and left as is, as instructed.
