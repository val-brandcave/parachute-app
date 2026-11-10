# Self-serve v5: calmer setup checklist, nav progress bar, build notes off by default (brief)

Branch `feat/self-serve-onboarding-v2`, base commit 3ea2efa. Approved by Val 9 Nov 2026 (options A + A).
Visual reference (you can't open it; described below): https://claude.ai/artifact/63SjUXvhcHyofdzYzvbzQt
Read `app/AGENTS.md` first. App tokens/components only, light + dark, no mono, numbers from `lib/pricing.ts`.
Premium and calm: the fix is hierarchy and restraint, not decoration.

## Agent K: the checklist card (option A "Up next, then a quiet list")
Own: `components/organisms/home/SetupChecklist.tsx` (+ any new files under `components/organisms/home/`
prefixed `Setup*`), new `components/organisms/home/setup-checklist.css` (prefix `sc-`; import it from the
component; do NOT edit globals.css; list old `su-*` rules you stop using in your report), `lib/setup-steps.ts`
copy only if needed. Keep all existing data/logic (verification, earn cap, admin-only "Ask {admin}",
pending approval "After approval", hidden guide, ⋯ menu, setupSummary, the `id="setup"` anchor if still used).

Card anatomy, top to bottom:
1. Title row (unchanged): "Welcome back, {first}" / "Welcome, {first}", one sub line "Finish setting up {org}.",
   ⋯ menu right. Drop the earn sentence from the sub line (it moves to the progress row).
2. Progress: 8px bar, then a row: left "**4 of 9** steps done"; right the earned credits as TEXT with a small
   coin-style icon in success green: "1 of 3 credits earned" (when 0: "Earn up to 3 credits" muted). No chip.
3. **Up next panel** (inset: `--md-surface-1` fill, border, 12px radius, generous padding): small petrol
   label "Up next", the step title (display font 16px), its one-sentence description, a meta line (clock
   "About N min" · video/doc link as today, reward as green text "+1 credit" only if it earns), then
   actions: the ONLY filled (primary) button on the card with the step's action label (make it specific,
   e.g. "Send the pack", "Upload policy", "Open sample"), plus a text button "Skip for now" that moves this
   step to the end of the remaining order for this user (persist per user in prefs/onboarding store if a
   place exists; otherwise session-local state is acceptable, say which in the report). Steps that are
   blocked for this user (admin-only for non-admins, after-approval when pending) are never chosen as
   Up next; if nothing is actionable, the panel says who can do the next step ("Dana can finish the rest").
4. **Groups** ("First review", "Ready for your team"): sentence-case label (13px, 600, secondary ink) with a
   quiet "2 of 3" right. No capitals, no rules above/below the label. Rows exclude the Up next step and
   done steps.
5. **Rows: one line each**, a fixed column grid so things line up row to row:
   `[status circle] [title + muted inline state] [status chip slot] [reward slot] [action slot]`.
   - Muted inline state: "Priya has it", "18 of 24 items mapped", "1 invite pending", or "About 5 min".
   - Status chip slot: only "In progress" (or "After approval" for pending orgs). "Next", "Free",
     "No credit", "Tick only", "2 trial credits" chips are removed. "Tick only" steps get a "Mark done"
     action instead.
   - Reward slot: "+1" green text with the coin icon, only for steps that still earn (respect the cap).
   - Action slot: small outline button, revealed on row hover and keyboard focus-within (opacity, keep
     its space), always visible on touch (`@media (hover: none)`) and for the row that is in progress.
     Non-admins see the existing "Ask {admin}" text instead.
   - The whole row is not a link; hover tint `--md-surface-1`, 9px radius.
6. **Done** steps fold into one muted line at the bottom: check icon, "**4 done** · Account created,
   sample opened, first report run, bank policy" (truncate with ellipsis), "Show" text button expands to
   the existing done list (who/when).
- Video links still open the existing player/modal behaviour; doc links unchanged.
- Responsive: at narrow widths the row grid collapses to circle / title / action.
- Check: trial-admin (4/9), new org (/demo/prospect → /welcome → Continue: 1/9), reviewer (non-admin),
  pending-admin (After approval), payg-admin-low, light + dark, the hidden-guide card still works.

## Agent N: nav progress bar + build notes toggle
Own: `components/templates/AppShell.tsx` (Get started nav item only), any nav item CSS in `app/globals.css`
(you are the only one editing globals.css), `lib/landing.ts` if needed, the DemoDock component and its
store (find them: `DemoDock`, `demo.store`), `components/templates/KeycloakFrame.tsx`,
`components/organisms/value/ValueStrip.tsx` (the placeholder callout only), `store/prefs.store.ts` if you
persist the toggle there.
1. **Get started nav item = option A**: label "Get started" with a quiet "4/9" right-aligned on the label
   line (12px, tabular nums, tertiary ink; on the selected item the selected ink at ~80%), and a thin 4px
   progress bar under the label spanning the label's width (track `--md-surface-2`; on the selected pill a
   translucent track; fill navy in light / `--md-on-selected` in dark). Item a little taller to fit. Remove
   the dark count pill. Collapsed rail: the icon with a 3px bar under it inside the item; tooltip
   "Get started, 4 of 9". If the nav item comes from `@realwired/ui` and can't take custom content, render
   our own item that matches the library's look exactly (hover, active pill + layoutId motion if used,
   focus ring) and explain in the report.
2. **Build notes off by default**: a "Show build notes" switch in the DemoDock (persisted per browser,
   default off). When off: hide the KeycloakFrame corner badge ("Keycloak theme reference · RWT-1061") and the
   per-page template tag (e.g. "login-verify-email-code.ftl"), and the ValueStrip "Needs engine v2 API
   sample" callout. When on: show them as today. Grep for other dev-only annotations shown to end users
   (e.g. "RWT-", ".ftl", "placeholder", "flag" chips like Plans "Hidden · flag") and list them in the
   report; gate the obvious ones the same way, leave product copy alone.
   Note: the auth pages may render outside the AppShell, where the DemoDock isn't mounted; the toggle state
   must still apply there (read the persisted value).

## Both
- Stay inside your files. Own dev server only: K → port 3101 `NEXT_DIST_DIR=.next-k`, N → 3102 `.next-n`.
  Ports 3000/3001 are Val's: never kill them. Stop yours when done.
- Screenshots light + dark of every state you own to
  `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\b392157a-bf67-4268-9514-2175f34b1704\scratchpad\v5\<k|n>\`;
  look critically, iterate before reporting.
- `npx tsc --noEmit` + `npx eslint` on your files clean, zero console errors, `git checkout app/tsconfig.json`,
  no commit. Report: `docs/plans/self-serve/v5-report-<k|n>.md`.
- Copy: plain, sentence case, no em dashes, no "→" in button text.
