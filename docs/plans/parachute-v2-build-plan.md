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

A Next.js + atomic prototype on the **Navy & Petrol** design system (revised Jun 2026 from "Slate & Teal"; Inter type, no monospace, Tabler icons) with light/dark/system
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
| `/dashboard` | Overview: greeting, period picker, period-scoped stat bar (+ a live "Pipeline running" tile), Review volume chart, Action needed, Recent reviews | ✅ built (chart/metric data is mock) |
| `/reviews` | **Reviews** queue (renamed from "My Reviews") — tabs + search + status filter + table, Order button | ✅ built |
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
  - *Compliance:* checklist "Manage" button and bank-policy "Upload" are **placeholders** (no flow). **✅ Resolved (decision #7):** checklist management lives in **Templates**; Settings → Compliance "Manage" links to the Templates checklist mapper.
  - *My profile:* static inputs.
  - *Preferences:* theme + density are **fully wired/live**.
- **Dashboard:** the Review volume chart (bespoke SVG combo — volume bars + turnaround/on-time overlay) uses **mock** per-period data; metric cards are period-scoped from the same mock volume (the live "Pipeline running" tile is not).
- **Header:** notifications bell is decorative (no panel yet).

## Temporary / old-design — needs rework

- **`/reviews/[id]/technical`** — biggest item. Built in the first pass with `components/review/` (`FindingCard`, `WorkbookRail`, `PdfPane`) and v1 CSS (`.ws`, `.finding`, `.pdfpane`, `.workbook`). Works and is on the palette, but **not** rebuilt into the agreed focus-mode or migrated to atomic components.
- **`/reviews/[id]/triage`** — uses the old `.page` wrapper and some v1 classes; restyle to the `.pagehead`/`.pagebody` + atoms pattern.
- **`components/review/*` + `components/shell/ReviewContextBar`** — predate the atomic refactor; fold into `atoms/molecules/organisms` during the Technical Review rebuild.
- **`/styleguide`** — palette decision surface; delete before handoff.
- **`globals.css` legacy block** — contains v1 classes. Some are now **unused** (e.g. dashboard-v1 `.stat-row`/`.review-row`, `.page` head styles); some are **still used** by the not-yet-redesigned Technical Review / triage / login (`.field`, `.sso`, `.ws`, `.finding`, `.pdfpane`, doc renderer). Clean up as those screens are rebuilt — don't delete classes still in use.

## Suggested build order (decisions #1–#9 baked in; sequence still flexible)

1. **Technical Review focus-mode** (the core loop; highest value) — rebuild + migrate review components to atomic. Add-finding = side drawer (#3); queue quick-look drawer (#2) can ride along.
2. **Order stepper — real step content.** "Run pipeline" lands in the new review (#1).
3. **Workbook + customize panel** (the v2 output-control differentiator) — per **#6**, build the **customize panel** (Builder owns customization, #5), *not* the full 3-pane builder/import (deferred).
4. **Administrative Review** (checklist attestation) — **reuses the Technical focus-mode shell** (#4).
5. **Templates hub** — cards → sub-routes (#7): checklist mapper (home here), response templates, org workbook layout.
6. **Triage restyle** (own route, #8), Settings deepening (compliance "Manage" → Templates, #7), notifications (in-app bell panel, #9).
7. Cleanup: remove `/styleguide`, prune unused v1 CSS, finalize responsive.

## Open questions (parking lot)

> Interaction-pattern decisions (#1–#9) were settled Jun 16 — see the **decisions log
> in `parachute-v2-ia-map.md`** (and the inline ✅ RESOLVED notes in `parachute-v2-early-specs.md`).

- ✅ **Resolved (#7):** compliance-checklist management lives in **Templates** (Settings → Compliance links to it).
- ✅ **Resolved (#9):** notifications — build the **in-app bell panel** (review ready / returned / assigned / overdue); email is the production channel (engineering-owned).
- Whether `/components` ships or stays internal.
- Persisting settings/profile (currently display-only) — depends on the real API layer.
- Mobile/tablet responsive pass (desktop-first for now).
