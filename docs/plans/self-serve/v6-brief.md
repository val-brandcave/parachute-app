# v6 brief: empty states, one rule app-wide (10 Nov 2026)

Branch `feat/self-serve-onboarding-v2`. Approved by Val on 10 Nov 2026, all as recommended.
Proposal with visuals: https://claude.ai/artifact/DHvJy8q8ajUmAVkQ9oRg52 (the "today" screenshots there are what we are replacing).

## The problem

A brand-new org sees full dashboards, tables and charts with nothing in them: five tiles of 0, an empty chart with ghost bars behind text, a reviews table with tabs saying "All 0" over one sample row, billing tables that print every column header, a totals row of 0, "Showing 0 of 0" and an active Export CSV. Val: crowded, clumsy, "showing all columns and saying no data is too much".

## The rule (E1)

| Level | When | Show | Hide |
|---|---|---|---|
| 1. Never used | the page/tab has never had real data (no real reviews / no credit movements). The sample never counts. | `<EmptyState>`: one block, headline, 1–2 sentences, primary + at most one secondary action, decorative ghost preview, `status` line for anything blocking the primary (approval wait, empty balance) | stat tiles, charts, tabs, search, filters, column headers, totals rows, export, pagination, "Showing N of M" |
| 2. Nothing in this view | history exists but this period/section is empty | section keeps its title + its own controls; body = `<EmptyLine>` with the way out ("No credits used in the last 30 days" + "Show 12 months") | column headers, axes, totals, footers |
| 3. Filtered to nothing | search/tab/filter returns no rows | `<EmptyLine>` naming the filter + "Clear search"/"Clear filters"/"Show all" | headers + footer. KEEP the tabs/search/filters so they can undo |

Column headers never sit over nothing. Export appears only when there are rows to export. Zero is real data once a page is in use ("0 overdue" is good news), so filled pages keep their numbers.

## Shared parts (built, do not fork)

`src/components/molecules/EmptyState.tsx` + `empty-state.css`, exported from `@/components/molecules`:

- `EmptyState({ title, children, actions, status, statusTone: "warn"|"info", preview, previewLabel, aside, layout: "split"|"stack", framed })`. `split` = page-level hero (text left, preview panel right, used on Dashboard). `stack` = centred, preview above (Reviews, Billing tabs, smaller lists). `aside` holds a sample card or step list.
- `EmptyLine({ children, action, icon })`: one line + way out. Put a `Button variant="ghost" size="sm"` in `action`.
- Ghost preview parts: `GhostStats({count})`, `GhostBars({bars, height})`, `GhostRows({rows})`. Decorative only, `aria-hidden` already handled.

If a part needs a new prop, add it in `EmptyState.tsx` in a backwards-compatible way and say so in your report. Do not restyle the parts per page.

## Writing

Sentence case, plain, from the user's side. Headline says what will appear here. No apologies, no "Oops", no "No data". Buttons keep the names they have elsewhere ("Start a review", "Open the sample review", "Add credits"). No `→` typed into labels; use `iconRight="forward"` like the rest of the app. No ALL-CAPS labels in new UI. Never hard-code prices or credit counts; read `lib/pricing.ts`.

## Screens

### A. Dashboard + Reviews (agent A)

Files: `src/app/(shell)/dashboard/**`, `src/components/organisms/dashboard-widgets.tsx`, `src/components/organisms/StatBar.tsx` (only if needed), `src/app/(shell)/reviews/**`, `src/components/organisms/ReviewTable.tsx`.

- **Dashboard never used** (org has no real reviews; `useDashboard().isEmpty`, check it excludes the sample): render ONE `EmptyState layout="split"` under the existing PageHeader (greeting + period picker stay). No StatBar, no value strip, no TrendChart/TrendChartEmpty, no ActionNeeded/NewFromYouConnect grid.
  - title "Your dashboard fills in after your first review"; text about volume, turnaround and what needs your attention.
  - actions: "Start a review" (primary, `rocket`, respects `useStartGate` → disabled + Tooltip with reason) and "Open the sample review" (outline, `iconRight="forward"`, → `/reviews/review-sample`).
  - `status` when gated: e.g. "**{org name} is waiting for approval.** The sample review is open meanwhile." (warn). When metered and not gated, use an `info` status only if it adds something (e.g. credits available, from the wallet, "enough for about N full reviews"), else none.
  - `aside`: the three steps (Add an appraisal / Parachute checks it / You decide and sign) as a compact list. This IS a real sequence, so numbers are fine.
  - `preview`: `GhostStats count={4}` + `GhostBars`.
  - Remove the now-unused `TrendChartEmpty` + its CSS, and the `hint()`/`muted` empty plumbing in the page if nothing else uses it.
- **Dashboard in use**: unchanged, except widgets that are empty in the period use `EmptyLine` (level 2) instead of the bigger `WidgetEmpty` block if that reads calmer. Use judgement; keep heights stable.
- **Reviews, no real reviews**: hide the Tabs, SearchInput and QueueFilters in the PageHeader toolbar (keep `OrderButton`), hide ActiveFilters, no table, no "Showing" footer. Render `EmptyState layout="stack"`: preview `GhostRows`, title "No reviews yet", text "Every appraisal your team runs lands here, with its findings and due date." (+ approval sentence when gated), and `aside` = a **sample card**: dashed border, the sample's address, a "Sample" chip, one meta line (e.g. "A finished example · {propertyType}" + its flagged count chip), and "Open the sample" button. Primary action is the header's OrderButton; do not duplicate it in the block.
- **Reviews in use**: the sample is no longer in the list at all (today it shows under All only). Counts never included it, keep that.
- **Reviews filtered/search to nothing**: replace "No reviews match your filters." with `EmptyLine` naming what's active ("Nothing matches "{query}"" / "No reviews match these filters") + "Clear search"/"Clear filters" (wire to `setQuery("")`/reset filters). Hide the "Showing N of M" footer when 0.

### B. Billing (agent B)

Files: `src/components/organisms/billing/**`, `src/app/(shell)/configure/billing/**` (or wherever the Billing page lives), billing CSS.

- **Usage tab, no movements at all** (ledger empty for the org, or for "mine" scope nothing of theirs): whole tab body = one `EmptyState layout="stack"`, preview `GhostBars`, title "Usage starts with your first review", text: each review type uses one credit (read from pricing), you'll see credits by review type and by person, plus every top-up, refund and reward, ready to export. Actions: "Open the sample review" (outline) + optional ghost "How credits work" only if a target exists. Hide UsageCard controls, BreakdownTable, LedgerSection, Export CSV. Header "Add credits" stays.
- **Usage tab with history**:
  - Chart card: when the selected range has zero usage, keep title + the three control groups, but body = `EmptyLine` "No credits used in the last 30 days." + "Show 12 months" (switches period) — no axes, no gridlines. Adjust wording per period.
  - Breakdown: when the range has no reviews, hide the section heading AND table entirely (the chart line already says it). No totals row of 0, ever.
  - Ledger: keep tabs + search when there are rows. A filter/tab/search with no rows → `EmptyLine` "No refunds yet." etc. with a one-clause explanation where useful + "Show all"/"Clear search". No column headers, no "Showing 0 of 0". Export CSV only when the current view has rows.
- **Invoices / Overview / BalanceCard / ActivityTable / Settings › payment**: apply the same rule. Invoices with nothing: one `EmptyState` ("Receipts and monthly statements appear after your first top-up." + "Add credits" for admins). Small lists inside a card: `EmptyLine`.
- Invoiced orgs and non-admin "mine" views must still work; check each role.

### C. Everything else (agent C)

Audit every other list, table, picker and widget and apply the rule. Known spots: `src/app/(shell)/configure/**` (responses library + `components/templates/ResponseTable.tsx`, checklists, layouts, defaults, members mirror, notifications, security), `src/app/bouncer/**` (`PendingTable`, members), `src/components/organisms/IntakeWidget.tsx`, `src/components/review/ResponseTemplatePicker.tsx`, `WorkbookComments.tsx`, `CommandPalette.tsx` (no-results line only), `/emails` if it has lists, the Get started page lists (`organisms/home/**`) only where something is literally empty. Do NOT touch dashboard, reviews or billing files (owned by A and B). Keep changes minimal where the current state is already one calm line. Report a table: place · level · before → after.

## How to work

- Read `app/AGENTS.md` first. Tokens only, both themes, no mono fonts, no hardcoded content widths (Val's rule: let content fill the pane).
- **File ownership is strict.** Only edit your files + `docs/plans/self-serve/v6-report-<a|b|c>.md`. Need a change in someone else's file or in `EmptyState.tsx`? Make it backwards-compatible if it's the shared part; otherwise write it under "Cross-requests" in your report.
- The dev server is already running for everyone at **http://localhost:3000** (all agents share one working tree, so it hot-reloads everyone's edits). Do NOT start another server, do not kill node processes, do not delete `.next`. If a page briefly errors because another agent is mid-edit, wait and retry.
- Personas: open `http://localhost:3000/demo/<id>` then navigate. `pending-admin` (Lakeside, nothing yet, approval wait), `trial-admin` (mid-setup, has credit movements), `payg-admin-low`, `reviewer`, `approver`, `enterprise-yc` (Meridian, full data, invoiced?). Check `data/seed/demo-personas.seed.ts`. The DemoDock can reset/approve.
- Verify with Playwright (Python, `p.chromium.launch(channel="chrome")`; the bundled browser isn't installed). Screenshot each state you changed in **light and dark** (dark: set `localStorage` theme or toggle via the user menu; find how the app stores theme) at 1440×900 into the session scratchpad folder given in your prompt. Look at every screenshot yourself and fix what's off before reporting.
- Before reporting: `npx tsc --noEmit` and `npx eslint <your files>` clean. Don't commit. Don't run `git checkout`/`stash`/`reset`.
- Report (`docs/plans/self-serve/v6-report-<x>.md`, short): what changed per screen, screenshot paths, open questions, cross-requests.
