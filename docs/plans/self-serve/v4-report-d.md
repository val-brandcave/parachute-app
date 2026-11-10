# v4 report, Agent D (Dashboard always on, empty state)

## Changes
- `dashboard/page.tsx`: FirstRunHome branch, `useOrgStage` and `FIRST_RUN_STATBAR_MIN` usage removed; every org sees the real dashboard. Empty org: quiet zero tiles with short hints, `TrendChartEmpty` instead of the chart, `ActionNeeded fresh`.
- `dashboard/hooks/useDashboard.ts`: new `isEmpty` (no reviews of its own; sample never counts).
- `dashboard/dashboard.css` (new, `db-` prefix, tokens only).
- `organisms/dashboard-widgets.tsx`: new `TrendChartEmpty` (ghost bars, "Your first review will show here", Start a review via `useStartGate` with tooltip + visible reason when pending, "Open the sample review", credits note for trial/payg, 3-step strip). `TrendChart`: no flat zero turnaround/on-time lines for orgs without that data (overlay menu and tooltip rows hidden), "No reviews completed in this period" note, no +inf deltas. `ActionNeeded` and `NewFromYouConnect` get designed calm empty rows (emoji removed).
- `organisms/StatBar.tsx`: optional `muted` on a stat.
- `TrendChartEmpty` is imported from `organisms/dashboard-widgets` directly (barrel untouched).

## Screenshots (light + dark)
`C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\b392157a-bf67-4268-9514-2175f34b1704\scratchpad\v4\d\`
new, pending-admin, trial-admin, reviewer, payg-admin-low, returning (`<name>-light.png` / `-dark.png`). Zero console errors.

## Notes for integrator
- `FIRST_RUN_STATBAR_MIN` in `lib/setup-steps.ts` now unused; delete it (not my file).
- trial-admin (2 seeded reviews, 0 completed) is the "few reviews" case: single/empty bars, no overlay line, deltas flat.
- The existing ValueStrip ("Needs engine v2 API sample" banner, "Hours saved ~7.0" while 0 completed) shows for trial-admin; pre-existing, outside my file list.
- tsc: clean for my files (the SetupDock import error seen mid-run was Agent G's in-flight work and was gone at the end).
