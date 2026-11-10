# Phase 3 report, Workstream A: Cost at Start and debit (D1, D2, D3, D3b)

## Added / changed
- `app/src/components/run/CostSummary.tsx` (new): `useRunCost(types, sample)`, `CostSummary` (footbar left slot), `TypeCostChip` (row chip), `LowBalanceCallout` (D3 / D3b).
- `app/src/components/run/cost-summary.css` (new, `cs-` prefix, tokens only; imported from CostSummary.tsx).
- `RunConfirm.tsx`: cost chip per type row (`1 credit · ~$150`, from `REVIEW_TYPE_COST` + `approxValue`); row labels now "Technical review" / "Administrative review" with the canvas descriptions; CostSummary in the footbar; callout docked above the footbar; Start also gated on `cost.affordable`.
- `RunModal.tsx` and `reviews/[id]/page.tsx` `onStart`: `canAfford` re-check (if short: `openTopUp({ reason: "low_balance", needed })` and return, nothing created or flipped), then after `complete("first_review")` a `debitForReview({ reviewId, types, loanNo })` for non-sample reviews. `debitForReview` itself guards double debit. The page handler also writes `loanNo` onto the review (`Review.loanNo` already existed).
- `RunExperience.tsx`: fallback for the dropped-file gate (see "Pre-existing bug" below).

## Behaviour
- Loan field: the existing "Loan number" input is relabelled **Loan # or reference** with hint "Optional · appears on the receipt" (as in the canvas). No second field, so no duplicate. Its value is `display.loanNo`, which goes to the debit and to the review.
- CostSummary: trial-only run reads "This review uses **2 trial credits** (list ~$300) · 4 trial credits left after" (left = remaining trial, not total balance). Paid or mixed reads "uses **2 credits** (~$300) · Balance after: **11**". Short balance shows "uses 2 credits (~$300)" + warning chip `Balance: 1`. Sample shows "Sample · free". Invoiced shows a quiet "Billed monthly through Realwired" (chosen over nothing; reads better), and the per-type cost chips are hidden for invoiced and sample.
- D3: warning callout inline at the end of the form column (after Advanced setup, card width), so it never covers fields. The footbar keeps the cost line and `Balance: 1` chip. It scrolls smoothly into view when the gate first renders short, and when Start is pressed while short (Start then looks disabled but stays pressable via `aria-disabled`; it scrolls to and focuses the callout, which shows a petrol focus ring). Admin: **Add N credits · ~$X** (default pack, or the smallest pack covering the shortfall; opens C's modal with `reason: "low_balance"`), **Run Technical only · 1 credit** (only when more than one type is selected and one fits; sets selection to that type), **Ask your admin** (toast "We emailed <org admin name>"). Start disabled. Balance changes clear the callout live because everything derives from the wallet ledger.
- D3b: non-admins get no Add button; the note "We'll email Dana Reyes" sits after the link.

## Verified (Playwright, port 3101, 1440 wide, 0 console or page errors)
- trial-admin (HCB): paid copy, live update when unticking, zero types disables Start.
- payg-admin-low (Cedar Ridge, 1 credit): D3 callout, Start disabled, Run Technical only enables Start, Start navigates to `/reviews/<id>`, debit happens (balance 1 to 0). Add credits click opens C's TopUp modal.
- reviewer (Marcus) after dock "Low balance": D3b, Ask your admin toast "We emailed Dana Reyes", run Technical only, start, balance 0.
- prospect (6 trial): D1 copy "2 trial credits ... 4 trial credits left after". enterprise-yc / returning (Meridian): invoiced line, no chips.
- `npx tsc --noEmit` clean. `npx eslint src/components/run "src/app/(shell)/reviews/[id]/page.tsx"` clean.
- Screenshots (in `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\67537008-86c0-4f6d-a19f-25346e534647\scratchpad\build\`): `phase3-D1-light.png`, `phase3-D2-light.png`, `phase3-D3-light.png`, `phase3-D3b-light.png`, `phase3-D1-dark.png`, `phase3-D3-dark.png`, plus `phase3-D-invoiced-light.png`, `phase3-D3-add-click-light.png`. The DemoDock pill is hidden in the shots (see below).

## Differences from the canvas
- D3b is a full page state (not an inset).
- Default pack price reads `~$1,400` (from `pricing.ts`, canvas had $1,500).
- Selected row chip is a white pill on the navy tint (canvas is a soft grey pill).

## Pre-existing bug found and fixed in my files
Dropping a file as any non-Meridian org (HCB, Cedar Ridge, prospect) opened a blank confirm gate: `openRun(DEMO_RUN_REVIEW_ID)` looks up `review-001`, which only exists in the Meridian-scoped reviews list. `RunExperience` now synthesises a stand-in review (220 Commerce Way, loan HCB-26-0918, bank = org name) when that id is missing. Cleaner long-term fix would be in the reviews store or IntakeWidget (not mine).

## Needs from other workstreams / coordinator
- **DemoDock (C)**: the fixed bottom-left dock pill overlaps the CostSummary text in the footbar. Move the dock off the run takeover footbar (e.g. hide it when `.run` is open, or offset it up).
- **tsconfig.json** (shared): each dev server with `NEXT_DIST_DIR` makes Next rewrite `app/tsconfig.json` (reformatted arrays plus `.next-a/b/c` include entries). Revert it before commit (`git checkout app/tsconfig.json`).
- **Embedded YouConnect run** (`beginRunInPlace`): not debited (invoiced orgs only, no review id). No action needed.
- Backend dependency (one line): balance check and debit are client-side mock; real product needs an atomic reserve-and-debit at Start.
