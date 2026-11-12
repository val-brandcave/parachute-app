# Pattern change: client questions addendum (12 Nov 2026)

These items come from the pattern-change spec (`spec.md` §2 and §10) and need Realwired's view.
They belong in `docs/plans/parachute-v2-client-questions.md`. That doc has Val's pending edit
and is never committed by the build, so they are logged here instead. Val: fold them in
when the pending edit is settled.

## Decisions to confirm with Realwired (PC-30 to PC-38)

Each is built as written. "Change? Yes" means it reverses something already agreed or built.

| ID | Decision | Recommended (built) | Alternatives | Change? | Status |
|---|---|---|---|---|---|
| PC-30 | Header order | Real shell order: `SearchTrigger` (field-style ⌘K) · `CreditsPill` · bell · `UserMenu`. The boards' pill-first order with a search icon button is a simplification of the chrome (audits B §4, C §4) | Board order: pill · search icon · bell · avatar | No | **Accepted by Val (11 Nov)** |
| PC-31 | Z-index tiers with the review takeover | `.run` 120 · **tour overlay 126, tour tooltip 128** · run Sign modal and `--rw-z-overlay` 130 · `--rw-z-modal` 140 (`LockDialog`, anything over a review) · toast 150 · tooltip 160 · popovers 200 · confetti 201 · prototype pill 210. A tour stops before any dialog opens (Sign, Lock, checkout). Replaces the earlier "tour 205" (audit A §4; audit D's "above 130" would cover the Sign and Lock dialogs) | Tour at 205, above every dialog | Yes: tour tier moves from 205 to 126/128 | **Accepted by Val (11 Nov)** |
| PC-32 | "Run Technical only" in the short-credits dialog | **Starts the review now** with the single type (the board's "Uses your 1 credit now"), through an `onRunOnly(type)` callback that `RunConfirm` supplies | Re-select only, as `LowBalanceCallout` does today | Yes: today it only changes the selection | **Accepted by Val (11 Nov)** |
| PC-33 | Billing band | Billing moves onto the Reviews page band (DS `PageHeader toolbar` + DS `Tabs`); "Add credits" stays the band's primary (house pattern: the band hosts the page's primary action), not inside the hero as board 2 draws it. Plans (flag-gated) stays. Invoiced keeps "Download statement" in the band; "Export CSV" lives on the Usage filter row. Invoiced reviewer gets tabs Usage · How credits work | "Add credits" in the hero (board 2) | Yes: band changes from local `PageHeader` + `.qtabs` to the DS band | **Accepted by Val (11 Nov)** |
| PC-34 | Usage tab composition | Filter row → donut card + by-person card (PC-28) → `LedgerSection`. The `UsageChart` bar chart, its by-source grouping and `BreakdownTable` leave the Usage tab; the compact `UsageCard` on Overview stays | Keep the bar chart below the donut | Yes: removes built parts from Usage | **Accepted by Val (11 Nov)** |
| PC-35 | Earn pill colour | Navy-selected (`--md-selected` / `ui-chip--accent`), done = success tone. Petrol stays reserved for links, focus and the one AI cue (AGENTS); the board's petrol tint is out of date | Petrol tint (board) | No | **Accepted by Val (11 Nov)** |
| PC-36 | Get started page band | Get started keeps a bodied hero (h1 in the page body, thin progress bar under it) and no `.pagehead` band, as the board draws it. It is the only shell page without a band | Add a `.pagehead` band like other pages | No | **Accepted by Val (11 Nov)** |
| PC-37 | Reviews level-1 upload | An in-page upload zone that opens the `RunModal` confirm gate the same way the Launchpad dropzone does (shared `useIntakeStart()` hook extracted from `IntakeWidget`); a `LockedAction` while pending. The header `OrderButton` stays | A button that links to `/launchpad` | No (new surface) | **Accepted by Val (11 Nov)** |
| PC-38 | Tour chip placement and page-tour scope | A review's chip and "Tour, n of 4" sit in the run top bar (`.run-head`); page chips sit in a shell header slot beside `Breadcrumbs`, driven by route patterns in `lib/tours.ts` (Checklists and Workbook layouts have no `PageHeader`). A chip shows only when its first target exists (Reviews: once the queue has rows). Page tours keep only on-page targets (§5.13) | Chip in `PageHeader` (spec before reconcile) | No | **Accepted by Val (11 Nov)** |

## Open questions for Ed

| ID | Question | Default built |
|---|---|---|
| Q-E17 | Should signing be limited to approvers? The tour copy said "Only approvers sign", but `RunSign` has no role gate | No gate; the copy is dropped |
| Q-E18 | Can a review type be added to a report after Start ("add the Administrative review later")? Types are committed once at Start today | No; the copy is dropped |
