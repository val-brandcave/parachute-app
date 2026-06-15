# Parachute v2 — Build Plan & Status

> Living doc. Captures what's built, how the POC screens map onto our current
> patterns, and what's stubbed / on old design / still to build. Much is still
> **to be discussed** — flagged inline. Sources: the POC
> (`docs/references/client-html-mock/parachute-mockups.html`), the Jun 10 2026
> kickoff, and the patterns established this session (see `app/AGENTS.md`).
>
> **The POC is a reference, not a target — reinterpret, don't clone.** It proves
> what the product does and which interactions users liked; it's cluttered and
> "nothing is final" (Ed). For each screen we analyze the POC, then suggest our own
> pattern-based design. Per-page early specs (with POC screen refs, critiques, and
> open questions): **`parachute-v2-early-specs.md`**.

## Where we are

A Next.js + atomic prototype on the **Slate & Teal** design system with light/dark/system
theming, density preference, a mock data-adapter layer, and these patterns locked:
full-height collapsible sidebar + bottom **Org card**; slim **page-header bands that carry
controls** (greeting / tabs / search / filter / actions); **command palette** (`⌘K`);
**global Order stepper modal**; portal tooltips/menus; `Tabs`/`StatBar`/`PeriodPicker`
(presets + **custom date range** via `DateRangeCalendar`)/`AvatarUpload` molecules.

## Route map — current

| Route | Screen | State |
|---|---|---|
| `/login` | Auth + SSO pass-through | ✅ built (navy gradient) |
| `/launch` | YouConnect → Parachute interstitial | ✅ built |
| `/dashboard` | Overview: greeting, period picker (presets + custom date range), stat bar, Action needed, Recent reviews, throughput trend | ✅ built (trend/throughput data is mock) |
| `/reviews` | **My Reviews** queue — tabs + search + status filter + table (property avatars), Order button | ✅ built |
| `/reviews/[id]` | **Review detail** — Technical / Administrative are in-page **tabs** (not routes); Findings / Builder / Workbook are sub-views of the Technical tab | ◑ Technical workspace built (⚠️ old design, focus-mode rebuild pending); Administrative / Builder / Workbook are in-page stubs |
| `/reviews/[id]/triage` | Intake triage (a distinct intake state — kept as a real route) | ⚠️ old design — functional, pre-redesign styling |
| `/templates` | Templates hub | 🚧 stub |
| `/settings` | Tabbed: Organization · Review defaults · Compliance · My profile · Preferences | ✅ built (see partial sections below) |
| `/components` | Design-system showcase | 🛠️ dev tool (keep, not a product page) |
| `/styleguide` | Palette decision surface | 🗑️ **temporary** — remove before handoff |
| Order a review | Full-page **stepper modal** (global) | ◑ shell + nav built; **step content is placeholder** |

Legend: ✅ built · ◑ partial · 🚧 stub · ⚠️ old design (rework) · 🛠️ dev tool · 🗑️ temporary.

## POC → new-pattern mapping

How each POC screen translates under our current patterns (changes from the POC noted):

- **Login** → `/login`. Built. SSO pass-through; "arriving from YouConnect" → `/launch`.
- **Dashboard (POC "My Reviews")** → **split into two**: `/dashboard` (overview + period picker) and `/reviews` (operational queue). KPI tiles became an informational `StatBar` (not filters); All/Mine/Flagged became real `Tabs`; added search + status filter.
- **Order a review** → no longer a route. Now a **full-page `StepperModal`** opened from a button or the command palette. Steps: Source → Review type → Reviewer → Options → Confirm & run. *To discuss:* real field content per step (YC inbox picker, upload dropzone, report-type chooser, reviewer select, org-defaults overrides, summary + run).
- **Technical Review** → `/reviews/[id]/technical`. Currently the first-pass build (old classes). *Planned rebuild:* **focus mode** — one finding at a time, cited **source page docked beside it**, **navy primary decisions (Agree / Reject) always visible**, secondary/tertiary (disagree-edit, comment, add-to-conditions, flag) behind a `⋯` `ActionMenu`, AI cues (`ai-processing` shimmer for the pipeline, `ai-badge` on AI-suggested), workbook tally. *To discuss:* exact focus-mode layout, batch "send back" UX.
- **Administrative Review** → `/reviews/[id]/administrative` (stub). To build: AI-prefilled checklist attestation (Yes/No/NA + page cites), reviewer attest with audited reason on change, sign attestation.
- **Workbook** → `/reviews/[id]/workbook` (stub). To build: compiled branded document, DRAFT watermark → sign → Complete / Return-to-appraiser, plus customization (show/hide, theme, fonts, risk labels — some as org defaults).
- **Builder** → `/reviews/[id]/builder` (stub). To build: section assemble/reorder, exclude, drag-in appraisal sections, document settings; per-review and org-default modes.
- **Templates hub + Checklist Mapper + Response Templates** → `/templates` (stub). To build: checklist template mapper (extract from .docx), response templates (org + personal), org workbook layout (= Builder org mode).
- **Intake Triage** → `/reviews/[id]/triage`. Exists (old design); confirm-return vs audited override. Needs restyle to current patterns.
- **Settings** → `/settings` (built, tabbed). See partial sections below.

## Stubbed / placeholder — needs real content

- **Pages (Stub component):** `/templates`, `/reviews/[id]/{administrative,builder,workbook}` — show a "coming in Sprint X" card.
- **Order stepper:** shell + step navigation are real; **each step's body is a placeholder** describing what goes there.
- **Settings — partial:**
  - *Organization:* logo upload works (live preview, not persisted); name/short-name are static inputs (no save).
  - *Review defaults:* quality-gate chips, SLA-start, default profile, default checklist — **static** (display only).
  - *Compliance:* checklist "Manage" button and bank-policy "Upload" are **placeholders** (no flow). Overlaps with Templates — *to discuss* where checklist management canonically lives.
  - *My profile:* static inputs.
  - *Preferences:* theme + density are **fully wired/live**.
- **Dashboard:** throughput trend chart uses **mock** per-period data; "Completed" count is mocked by period.
- **Header:** notifications bell is decorative (no panel yet).

## Temporary / old-design — needs rework

- **`/reviews/[id]/technical`** — biggest item. Built in the first pass with `components/review/` (`FindingCard`, `WorkbookRail`, `PdfPane`) and v1 CSS (`.ws`, `.finding`, `.pdfpane`, `.workbook`). Works and is on the palette, but **not** rebuilt into the agreed focus-mode or migrated to atomic components.
- **`/reviews/[id]/triage`** — uses the old `.page` wrapper and some v1 classes; restyle to the `.pagehead`/`.pagebody` + atoms pattern.
- **`components/review/*` + `components/shell/ReviewContextBar`** — predate the atomic refactor; fold into `atoms/molecules/organisms` during the Technical Review rebuild.
- **`/styleguide`** — palette decision surface; delete before handoff.
- **`globals.css` legacy block** — contains v1 classes. Some are now **unused** (e.g. dashboard-v1 `.stat-row`/`.review-row`, `.page` head styles); some are **still used** by the not-yet-redesigned Technical Review / triage / login (`.field`, `.sso`, `.ws`, `.finding`, `.pdfpane`, doc renderer). Clean up as those screens are rebuilt — don't delete classes still in use.

## Suggested build order (to discuss)

1. **Technical Review focus-mode** (the core loop; highest value) — rebuild + migrate review components to atomic.
2. **Order stepper — real step content.**
3. **Workbook + Builder** (the v2 output-control differentiator).
4. **Administrative Review** (checklist attestation).
5. **Templates hub** (checklist mapper, response templates, org workbook layout).
6. **Triage restyle**, Settings deepening (compliance flows), notifications.
7. Cleanup: remove `/styleguide`, prune unused v1 CSS, finalize responsive.

## Open questions (parking lot)

- Where compliance-checklist management canonically lives (Settings vs Templates).
- Notification model for async "review ready" (email near-term; in-app later).
- Whether `/components` ships or stays internal.
- Persisting settings/profile (currently display-only) — depends on the real API layer.
- Mobile/tablet responsive pass (desktop-first for now).
