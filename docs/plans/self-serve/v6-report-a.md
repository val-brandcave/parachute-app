# v6 report A: Dashboard + Reviews

## Changes
- **Dashboard, never used** (`isEmpty`, sample excluded): one `EmptyState layout="split"` (`DashboardFirstRun` in `dashboard-widgets.tsx`) under the PageHeader. No StatBar, value strip, chart or widget grid. Title, two actions (Start a review respects `useStartGate` with tooltip; Open the sample review), warn status when gated ("{org} is waiting for approval..."), info status with credits only for metered orgs with credits, 3-step numbered aside, `GhostStats` + `GhostBars` preview.
- Removed `TrendChartEmpty`, its CSS, `WidgetEmpty`, the `hint()`/`muted` plumbing and `ActionNeeded`'s `fresh` prop.
- **Dashboard in use**: unchanged except the Action needed / New from YouConnect empty bodies are now `EmptyLine` (level 2).
- **Reviews, no real reviews**: tabs, search, filters, ActiveFilters, table and footer hidden; only Start a review remains in the header. `EmptyState stack` with `GhostRows`, "No reviews yet", approval wait as a warn `status`, and a dashed sample card (address, Sample chip, "A finished example · type", flagged chip, Open the sample).
- **Reviews in use**: sample removed from the list entirely (`useReviewQueue` filters it; `total` is now the real count; hook also exposes `isEmpty` and `sample`).
- **Reviews filtered to nothing**: `EmptyLine` ("Nothing matches "q"" + Clear search, or "No reviews match these filters" + Clear filters, which resets query, filters and tab). "Showing N of M" only when rows exist.
- New file `src/app/(shell)/reviews/reviews.css` (sample card, `rq-` prefix). `EmptyState.tsx` untouched.

## Screenshots (light and dark, 1440x900)
Folder: C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\4068bd9e-78ed-43c9-b97a-908e2b01b409\scratchpad\v6\a\
pending-dash, pending-reviews, trial-dash, trial-reviews, trial-reviews-nomatch, ent-dash, ent-reviews (each `-light.png` / `-dark.png`).
Routes 200, no console errors. Enterprise dashboard and reviews list look as before.

## Open questions
- The in-use chart still shows "No reviews completed in this period" over axes (existing, `db-chart-quiet`). Billing-style level 2 for the TrendChart (title + EmptyLine, no axes) would match the rule; left as is, say if you want it.
- Trial org with reviews and 0 completed shows the filled dashboard with zeros, which is correct per the rule.

## Cross-requests
- Mid-run, `IntakeWidget.tsx` (agent C) had tsc errors from missing imports; my final tsc was checked after, see result in the final message.

## Addendum: Review volume level 2
`TrendChart` takes optional `emptyText` + `widen`. When the period has zero reviews it keeps the title, period badge and menu and shows one `EmptyLine` ("No reviews completed this month." + ghost "Show this quarter", which calls `setPeriod` with the next wider period: week to month, month to quarter, quarter to year, custom to year; none on year). No axes, gridlines or metric strip. Filled enterprise-yc chart unchanged. Screenshots: trial-dash-light/dark.png (same folder). tsc and eslint clean. The open question above is resolved.
