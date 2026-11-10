# v5 report, Agent K (setup checklist)

Built option A: title row, progress row (green text credits), inset "Up next" panel (only filled button, specific CTA, "Skip for now"), sentence-case groups, one-line grid rows (circle / title + muted state / chip / reward / hover action), done steps folded into one line with Show.

Files: `components/organisms/home/SetupChecklist.tsx` (rewritten), `components/organisms/home/setup-checklist.css` (new, `sc-`). `lib/setup-steps.ts` untouched (CTA labels live in a map in the component).

Notes
- "Skip for now" is session-local state (no per-user store exists); resets on reload.
- Tick-only steps get "Mark done", which calls `onboarding.complete(stepId)`. This ticks by hand, which AGENTS.md says completion should not do; flag for Val.
- Dev server ran on 3111 (3101 was held by another process).
- Verified: trial-admin, pending-admin, reviewer, light + dark; tsc and eslint clean; no console errors. payg-admin-low lands on /launchpad (no checklist there). Not checked: hidden-guide card, narrow container layout.

Old `su-*` rules no longer used by the checklist (in globals.css): su-card, su-head, su-h, su-sub, su-prog, su-prog-meta, su-prog-earn, su-done*, su-faint, su-toggle*, su-group, su-group-n, su-row, su-ico, su-body, su-title, su-desc, su-meta*, su-link, su-side, su-ask, su-tag, su-bar. Still used elsewhere: su-pill* (billing, security page).
