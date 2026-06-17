# Parachute v2 — Early Page Specs (Draft)

> **Draft / to-discuss.** First-cut specs for the pages we haven't built yet (and
> the Technical Review rebuild). Status/route map: `parachute-v2-build-plan.md`.
>
> **Update (Jun 16 2026):** the interaction-pattern questions in these specs were
> settled in the IA session. The **decisions log in `parachute-v2-ia-map.md` is the
> source of truth**; resolved items are marked **✅ RESOLVED (decision #N)** inline
> below. These are working decisions — fine to revisit at build time if they cause
> friction, but start from them.

## Reference & principle

- **HTML reference (the POC):** `docs/references/client-html-mock/parachute-mockups.html`
  — Ed's vibe-coded proof of concept. Open it (or the per-screen notes in the processed
  meeting) when speccing. POC screen ids are cited per section below (e.g. `#screen-review`).
- **Reinterpret, don't clone.** The POC proves *what* the product does and which interactions
  users liked; it is **not** a visual or layout target — Ed himself said it's cluttered and
  "nothing is final," and Brandcave's value is the design judgment the POC lacks. For every
  screen: (1) name the POC reference, (2) analyze what works vs. what's cluttered/weak,
  (3) **suggest** our approach using current patterns, (4) leave **open questions** to settle
  with Ed/Cody. Do not lift POC markup/structure as-is.
- Each section below follows that shape; treat "Suggest" as a proposal, not a decision.

Conventions assumed throughout: atomic components, Navy & Petrol tokens, navy primary
CTAs / petrol accents, portal overlays, mock data-adapter (page → hook → store → adapter),
light/dark, density. New domain entities get added to `src/types` + `src/data/seed`.

---

## 1. Order a review — stepper modal (fill in the shell)

**POC ref:** `#screen-order` (the two-column "checkout": source toggle + summary rail).
**Analyze, don't clone:** the POC crams source, type, reviewer, and options onto one dense
screen. *Suggest:* break it into the guided `StepperModal` we built (less at once,
progressive disclosure) rather than replicate the single-screen checkout.

Component exists (`StepperModal` + `OrderModal`, global via `useOrderStore`). Build real
content per step. Draft state shape: `orderDraft { source, ycEngagementId?, file?, reviewTypes[], assigneeId, options{}, }`.

1. **Source** — segmented "From YouConnect" | "Upload".
   - YouConnect: searchable inbox of deliveries (property, doc, SLA, NEW/IN-QUEUE badges); remote search + import; duplicate warning if already in queue.
   - Upload: dropzone (PDF), parsed file pill + extracted property summary (editable).
   - *Next disabled until a source is chosen.*
2. **Review type** — choose Technical and/or Administrative (≥1). Each option card explains its output (Technical → workbook; Administrative → compliance attestation). Admin shows which checklist template applies.
3. **Reviewer** — assignee select (default inherited from the YC engagement). Optional due-date / priority.
4. **Options** — org defaults shown with per-order overrides: auto-reject quality gate on/off, SLA start, compliance template, bank policy. Audited if overridden.
5. **Confirm & run** — order summary; "Run pipeline" submits → creates a `review` (status `running`, pipelineStage advancing S1–S5 with `ai-processing` shimmer).
   - **✅ RESOLVED (decision #1):** "Run pipeline" **routes into the new review** (Technical tab, running state); "Back to queue" stays available. CTA: "Run pipeline" primary navy.

---

## 2. Technical Review — focus mode (Technical **tab** of `/reviews/[id]`)

> IA note: Technical / Administrative are **in-page tabs** on `/reviews/[id]`, and
> Findings / Builder / Workbook are **sub-views** of the Technical tab — none are
> routes, and none appear in breadcrumbs. Only `/reviews/[id]/triage` is a real sub-route.

**POC ref:** `#screen-review` (findings list + workbook rail + side PDF, 3 columns).
**Analyze, don't clone:** the POC's 3-column layout is cramped and shows every finding at
once with all actions exposed — exactly the clutter to avoid. *Suggest:* the focus-mode
below (one finding at a time, evidence docked, primary decisions only + `⋯` for the rest).
*Keep* from the POC: the accept/reject/agree/disagree model, confidence, page-cite → source,
batched send-back — those are the validated value.

Replaces the first-pass page. Core loop = decide on each finding fast, with evidence.

- **Layout:** a left **finding list/progress rail** (compact: severity dot + short label + done state) · a center **focus pane** (one finding, full width) · the cited **source page docked right** (`ai`/PDF stand-in with the excerpt highlighted). Workbook tally as a slim summary (top or collapsible right).
- **Focus pane (one finding):** category + severity chip + `ConfidenceMeter`; the finding/analysis; evidence quote with a page-cite link that drives the docked source; AI audit trail (`ai-badge` "AI-suggested", CONFIRMED/CORRECTED/FLAGGED).
- **Decision actions (always visible, navy primary):** **Agree/Accept** and **Reject** (Reject captures a reason, batched into the send-back). Secondary/tertiary behind a `⋯ ActionMenu`: Disagree & edit (override wording), Comment, Add to conditions, Flag, Open source page.
- **Navigation:** Prev/Next finding; keyboard (j/k move, a/o/r/c act, ↵); jump from the list rail. Sort by severity / page; filter by severity.
- **Pipeline states:** empty (not ordered), running (staged S1–S5 with shimmer), content.
- **Send back to appraiser:** batches all rejected/condition findings into a return letter; sets status `returned`; SLA keeps running. (Appraisers want mistakes batched, not one-by-one.)
- **Workbook tally:** Accepted / Overridden / Rejected / Pending → "Compile workbook" (to Workbook) and "Return to appraiser".
- **Add finding / bulk accept — ✅ RESOLVED (decision #3):** "Add finding" opens a **right side-drawer** form (reuses the quick-look drawer pattern); "Accept all passes" is a secondary toolbar button. "Add" is primary navy in the drawer.
- **Quick-look from the queue — ✅ RESOLVED (decision #2):** the `/reviews` queue gets a **right side-drawer quick-look** (status, findings summary, next action, download); "Open review" enters this workspace. (Lives on the Reviews queue, but shares the drawer used above.)
- *Still open (build-time detail, not an IA call):* exact 2- vs 3-pane behavior on narrow widths; whether the list rail and source can both show at once.

---

## 3. Administrative Review (Administrative **tab** of `/reviews/[id]`)

**POC ref:** `#screen-adminreview` (attestation cards + side PDF).
**Analyze, don't clone:** reuse the attestation idea but apply our finding/card patterns and
the `⋯`/primary-action hierarchy for consistency with Technical Review.
**✅ RESOLVED (decision #4):** Administrative **shares the Technical focus-mode shell**
(list rail + focus pane + docked source), with attestation content instead of findings —
one workspace UI, not two.

AI-prefilled compliance checklist the reviewer attests to.

- **Header band:** Technical / Administrative are sibling tabs (already in `ReviewContextBar`); coverage summary (X of N attested).
- **Attestation list** (grouped by checklist section): each item = question · AI-suggested **Yes/No/NA** + `ConfidenceMeter` + page cite + evidence quote. Reviewer sets Yes/No/NA; **changing the AI answer requires an audited reason note**. "Confirm routine answers" bulk-confirms unchanged items.
- **Sign:** preview the signed attestation doc → sign (name/timestamp/hash) → export. DRAFT until signed.
- Data: `checklistItems` per review (seeded); checklist template from Settings/Templates.

---

## 4. Workbook (Workbook **sub-view** of the Technical tab)

**POC ref:** `#screen-workbook` (compiled doc) + the customize panel.
**Analyze, don't clone:** the POC mixes document preview and a long settings list. *Suggest:*
keep the document clean and move customization into the Builder / a focused side panel; surface
only the lifecycle actions (sign / complete / return) on the Workbook itself.
**✅ RESOLVED (decision #5):** the **Builder owns all customization**; the Workbook is the
clean compiled doc + lifecycle (Sign → Complete / Return) only — no customization controls on it.

The compiled, branded, auditor-facing output — the v2 "make it my work" surface.

- **Compiled document** rendered from `SECTIONS` + finding dispositions + `docSettings`. DRAFT watermark until signed.
- **Lifecycle:** Sign (signature block: name, timestamp, SHA-256) → **Complete** (filed) OR **Return to appraiser** (drafts return letter from Conditions). 
- **Customize** (lives in the **Builder** — decision #5): show/hide rejected & overridden, show/hide status & confidence, color-coding on/off, **theme**, **font**, **font size**, **risk rating** (custom labels/colors/wording), header/footer + logo. Org-level brand defaults vs per-workbook overrides — *still open (build-time detail).*
- **Conditions of Approval / Action items** auto-aggregated from findings whose response is "requires revision" / "concur with condition".
- **Exhibits** the doc renderer supports: tables, bar charts, cap-rate range plot, SWOT, heat-shaded sensitivity (from POC).
- Download menu: PDF / DOCX / ZIP, DRAFT vs FINAL.

---

## 5. Builder (Builder **sub-view** of the Technical tab; org mode via Templates)

**POC ref:** `#screen-builder` (3-pane: section list · editor · template library / live preview).
**Analyze, don't clone:** the 3-pane concept is sound but POC-dense. *Suggest:* keep the
three zones but apply our spacing/atoms, and reuse `StepperModal`/panels where a full builder
is overkill. **✅ RESOLVED (decision #6):** v2 ships a **focused customize panel**
(reorder/exclude sections, show-hide, theme, font, risk labels) that **owns all customization**;
the full 3-pane builder + appraisal-section import + org section-library publish are **deferred**.

Assemble/configure the workbook layout. Two modes: **per-review** and **org default** (versioned).

- **3-pane:** section list (drag-reorder, exclude/include, add/delete) · section editor (per type: categories, exhibits, sensitivity, SWOT, actions, free text, certification, or Document Settings) · template library / **live mini-preview** of the compiled doc.
- **Import band:** drag appraisal sections (Highest & Best Use, subject paragraphs, etc.) into the layout.
- **Document Settings** (pinned): the customization listed under Workbook above.
- **Merge fields:** `{{property}} {{page}} {{topic}} {{action}} {{condition}} {{detail}}` — auto-filled or bracket placeholders.
- Org mode: Section Library + "Publish org default vN".
- *Note:* this is the deepest surface. **For v2, build only the customize panel (decision #6)**; treat the full 3-pane / import / org-publish as a later phase. (The 3-pane details above describe that eventual full builder.)

---

## 6. Templates hub (`/templates`) — **focus area**

**POC ref:** `#screen-templates` (4 tiles) → `#screen-tplchecklist` (checklist mapper),
`#screen-tplresponses` (response templates), Org Workbook Layout (= Builder org mode).
**Analyze, don't clone:** the POC tile hub is fine as a concept; *suggest* deciding hub
shape against our patterns (cards vs. left-nav vs. tabs) and resolving the
Settings-vs-Templates overlap for checklist management before building.

Hub linking the three template tools. Under our patterns, a `/templates` landing with
cards, each opening a sub-route or panel.

- **Checklist Template Mapper** — upload the bank's checklist `.docx`; AI extracts items; each mapped/flagged (BINARY vs QUALITATIVE; flags ambiguous/double-barreled rows); re-extract; publish new version. This is what drives Administrative Review.
- **Response Templates** — org library + personal: Concur / Concur w/ observation / Concur subject to condition / Requires revision / Reviewer override / Not applicable / Free text. Editor with merge-field chips + live preview. These populate the finding `ActionMenu` and workbook responses.
- **Org Workbook Layout** — = Builder in org-default mode (section library, versioned publish).
- **✅ RESOLVED (decision #7):** the hub is **cards → sub-routes**; the **Checklist Mapper's home is Templates** (Settings → Compliance links to it); the Response-template editor is **master/detail within its sub-route**.

---

## 7. Intake Triage (`/reviews/[id]/triage`) — restyle

**POC ref:** `#screen-triage`. **Analyze, don't clone:** logic is fine; just bring the
existing first-pass page onto current patterns (`.pagehead`/atoms).
**✅ RESOLVED (decision #8):** triage **stays its own route** `/reviews/[id]/triage`
(the only routed review sub-page), linked from the Dashboard "Intake triage" tile.
CTA: "Override & admit" primary navy (audited); "Confirm & return" secondary outline.

Functional, needs current-pattern restyle. Auto-rejected appraisal: failed-criterion card +
evidence; "Your call" → Confirm & return to appraiser, or Override & admit (audited reason →
starts pipeline). SLA paused while in triage.

---

## 8. Settings — deepen partial sections

**POC ref:** `#screen-appsettings` (org name, default review profile, reviewer profile +
signature, org defaults: auto-reject criteria, SLA start, default admin checklist).
**Analyze, don't clone:** the POC is a single flat list; we already **reinterpreted** it into
the tabbed Settings (Organization · Review defaults · Compliance · My profile · Preferences) +
added theme/density. Remaining work is depth, not layout.

Built tabbed; make the display-only parts real (pending the API layer):
- **Compliance:** wire checklist "Manage" (→ Templates mapper) and bank-policy upload flow.
- **Review defaults / Organization / Profile:** persist via the adapter when available.
- *Preferences (theme + density) already live.*

---

## Cross-cutting / to add to the data model

New seed/types as these land: `ycEngagements`, `checklistItems`, `checklistTemplates`,
`responseTemplates`, `workbookSections`/`layouts`, `docSettings`, `policies`, `auditEvents`,
`orgDefaults`. Keep the adapter contract so the eng team can swap real APIs.
