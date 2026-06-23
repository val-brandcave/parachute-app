# Parachute v2 — Review Details Spec & Build Map

> **Status:** Locked architecture (2026-06-22). Supersedes the rough first-pass `/reviews/[id]` build.
> **Scope:** The workspace a reviewer lands on after an appraisal order finishes pipeline and is ready for decisions.
> **Sources:** client HTML mock (`docs/references/client-html-mock/parachute-mockups.html`), early-specs §1–9, IA map §2/§6, AGENTS.md, Jun-10 client meeting, and a 2024–2026 competitive scan of builder-vs-document UX (Gamma, Power BI, Figma, Google Docs, Qwilr, DocuSign, Notion).

---

## 1. The three Technical concepts (reconciled)

| Concept | Client's words | What it is | Lives in |
|---|---|---|---|
| **Findings** | "this is more like review details… accept/reject reviewer findings, agree/disagree with Parachute findings" | Reviewer's **decision surface** — pipeline (S1 Checklist → S2 Validation → S3 Consistency → S4 Analytics → S5 Policy) emits findings; reviewer dispositions each against the cited source | Technical tab, default sub-view |
| **Builder** | named, never explained in the meeting | **Layout/style configuration**, not dispositions. Content derives from findings; layout/style inherits org defaults + light per-review overrides | **Folded into Workbook as Edit mode** (see §3) + org authoring in Templates |
| **Workbook** | "the output… all the evidence of property… what the final PDF looks like" | Compiled, branded, **auditor-facing signed PDF** — the "make it my work" deliverable. DRAFT until signed → Complete / Return | Technical tab, Workbook sub-view |

Pipeline of work: **Findings (decide) → Workbook (assemble/style in Edit mode → Sign → file/return)**. Administrative is a **parallel track** producing a signed *attestation*, not a workbook.

---

## 2. Locked decisions (2026-06-22)

1. **Tech/Admin bifurcation = two elevated top tabs** (`Tabs` molecule, Framer `layoutId` sliding pill). Honors locked IA. Both tracks independently stateful within one order; each shows an in-place "Order …" CTA if its track wasn't ordered.
2. **~~Builder folds into the Workbook as a Preview ⇄ Edit-layout mode.~~ REVERSED 2026-06-22** (same day, after clicking through the client mock with Cody). **Technical has THREE sub-views again: `Findings · Builder · Workbook`**, rendered as **underline tabs** (deliberately a different shape from the top track pills, so the two nav levels don't read as a stack of identical pills — the fold's "Preview/Edit" toggle had created a confusing triple-decker). **Workbook** = the clean compiled doc + lifecycle (read/sign/file). **Builder** = the layout/section authoring surface — its own destination.
   - Why the reversal: the fold's rationale (peers make config an *edit mode*; reclaim real estate) only holds for *light* config. The client's Builder is a **full 3-pane authoring tool** (sections list + add-palette of **9 section types** · per-section editor · live preview + template library), an **import-from-appraisal** band, and rich **document settings** (theme/font/size, header/footer/logo, show-status/confidence, hide rejected/overridden, **risk wording**). Cramming that into a right-rail "reduced panel" badly underbuilt the deliverable. A 3-pane builder is a *place*, not a toggle.
   - Template-vs-instance split preserved: per-review authoring = the review's **Builder** sub-view; org-default layout authoring = **Templates → Workbook Layout** (same builder component in "org mode").
3. **Aggressive toolbar consolidation** everywhere: sort + filter → one "Filter & sort" icon button → popover (badge = active count); Source PDF → icon toggle; bulk/power actions → ⋯ overflow; **Add finding → centered `Modal` form** (single-step; save → adds to review; mock data); property meta → compact line + ⓘ popover.
   - The **modal-form pattern** (centered `Modal` + structured inputs + Save/Cancel) is reusable for similar quick-add inputs app-wide. Coexists with `BottomSheet` (used for larger/contextual editing); use a modal for short structured create/quick-add, a `BottomSheet` for deeper editing on a place.
4. **Disposition hierarchy** = two always-visible primaries + ⋯ overflow. Primary label adapts to origin: **AI/Parachute finding → `Agree` + `Reject`**; **reviewer-added finding → `Accept` + `Reject`**. Secondary (Disagree & edit, Comment, Add to conditions, Flag) in ⋯ `ActionMenu`. Honors the client's verb distinction without crowding the card.
5. **One state-adaptive shell.** Same chrome; body swaps by **derived** state (`lib/review-lifecycle.ts`): `running` → pipeline tracker; `in_review` → active workspace; `completed` → read-only filed doc + signed badge; `returned` → dormant (client Q1). **Triage is the only separate route** (`/reviews/[id]/triage`), only for `autorejected`.
6. **Administrative shares the Technical focus-mode shell** (early-specs decision #4) — list rail + focus pane + docked source, with attestation items (Yes/No/N-A) instead of findings. No sub-nav.
7. **Workbook = clean compiled doc + lifecycle only** (read/sign/file). **The Builder sub-view owns all customization** (sections, exhibits config, theme/branding, risk wording) — see decision #2. Builder is **role-gated** (reviewer authors; recipient/read-only sees only the Workbook).

---

## 3. Target IA

```
┌ ← Reviews   1450 Corporate Center Dr ⓘ   [▸Technical ·1]  [Administrative]   ⬇  ⋯ ┐
│              Findings · Builder · Workbook   (underline sub-tabs)                  │
└───────────────────────────────────────────────────────────────────────────────┘

/reviews/[id]                ONE route. Tabs + sub-views are STATE, never routes/breadcrumbs.
 ├ Technical (tab)            top track = sliding-pill Tabs; sub-views = UNDERLINE tabs (distinct shape)
 │   ├ Findings  (sub-view, default) — focus mode: list rail · finding focus pane · docked source PDF
 │   ├ Builder   (sub-view)          — layout/section authoring: 3-pane (sections+add · editor · preview),
 │   │                                  import-from-appraisal, document settings. Role-gated (reviewer).
 │   └ Workbook  (sub-view)          — compiled doc · Sign → Complete/Return. "Customize layout" → Builder.
 ├ Administrative (tab)               — SAME focus-mode shell; attestation items; Sign attestation
 └ (state) running / completed / returned bodies swap inside the same shell

/reviews/[id]/triage          The ONE separate route — autorejected only.
Templates → Workbook Layout   Org-level layout authoring (same Builder in "org mode"), versioned.
```

**Surface taxonomy (app-wide):** route = *place*; `BottomSheet` = *focused task on a place* (add/edit finding, quick-look); `StepperModal` = *linear commit* (ordering). Floating layers portal to `document.body`, `position: fixed`.

---

## 4. Element inventory — client HTML mock (review-details surfaces)

### 4.1 Review Context Bar (persistent, only inside a review)
| Element | Mock behavior | Our build |
|---|---|---|
| Back to "My Reviews" | → queue | Keep |
| Property identity | `1450 Corporate Center Dr · Office (Medical) · Demo Bank · Loan #LN-4471` | Compact line + ⓘ popover |
| Top tabs Technical / Administrative | `rule` / `fact_check`; Technical "1 open" badge | `Tabs` molecule (sliding pill) |
| Lifecycle chip | `Completed` / `Returned — awaiting rev 2` | **Derived** via `review-lifecycle.ts` (not raw status) |
| Flagged chip | counts flagged-open; flips to "flags resolved" | Keep, reactive |
| Pipeline chip | `Pipeline complete` / `<stage> running…` | Keep |
| Download menu | Workbook + Attestation, PDF/DOCX/ZIP, DRAFT/FINAL | Keep (icon) |
| Sub-nav Findings / Workbook | shown only under Technical | 2 sub-tabs (Builder folded into Workbook) |

### 4.2 Findings (Technical) workspace
| Element | Mock behavior | Our build |
|---|---|---|
| Empty state | in-place "Order Technical Review" CTA | Keep |
| Running state | 5-stage pipeline progress card | State-driven (`PipelineTracker`) |
| Toolbar | Add finding · Accept all passes · Source PDF | Add finding → centered `Modal` form (mock data); Accept-all-passes → ⋯; Source PDF → icon toggle |
| Sort | Severity / Page order / $ impact | Into "Filter & sort" popover |
| Severity filter | All / Critical / Fail / Flagged / Pass | Into "Filter & sort" popover |
| **Coverage / anti-miss panel** | ring "N/total · X checks across Y categories · 0 skipped · Z need judgment" + Out-of-scope | **Keep & elevate** — the "didn't miss a material mistake" moment; collapsible |
| Finding card | severity border · status pill · `ConfidenceMeter` · page-cite→PDF · evidence · **AI audit trail** (S1→S3 CONFIRMED/CORRECTED/FLAGGED) | Use `SeverityChip` + `ConfidenceMeter`; keep AI audit trail (differentiator) |
| Action bar | Accept / Disagree-Override / Reject / Comment + AI-suggest hint | Decision #4 hierarchy (2 primary + ⋯) |
| Composer | **response-template dropdown** + textarea; override/reject require reason | **Wire `ResponseTemplate`s + merge fields** (currently unwired) |
| Keyboard | j/k/a/o/r/c | Keep |
| Workbook rail | accepted/overridden/rejected/pending tally + live feed + "Compile workbook" | Keep as slim summary |
| Source PDF pane | docked right, cited page, highlighted phrase | Keep (client's "missing in-document context" pain) |

### 4.3 Administrative review (attestation)
Empty/running states · note banner ("Built from your template — Demo Bank Commercial Review Form… you attest then sign") · coverage panel · show filter (All / Needs attention / Pending / Attested) · **attestation card** (grouped by section; question + Yes/No/N-A + confidence + page cite + evidence; "needs attention" if AI=NO or conf<0.85) · **change-reason required when answer ≠ AI** · Confirm routine answers (bulk) · attestation preview + Sign/Export · DRAFT until signed. → Renders in the **shared focus-mode shell**.

### 4.4 Workbook (compiled doc) — the Workbook sub-view  ✅ built 2026-06-22
Header band · **cover banner** (Reviewer recommendation: Approve / Approve-with-conditions / Review-in-progress + **Risk badge with wording**) · value summary · sections (findings by approach-section, exhibits as table/chart, sensitivity heat, SWOT, **Conditions C1/C2…**, action items, imported sections, certification) · **DRAFT ribbon** until signed → **Sign** (name/timestamp/SHA-256) → **Complete (filed)** / **Return to appraiser** (batched return letter from rejected findings). Pending findings render as visible "Open — awaiting disposition" placeholders. (No edit chrome here — the Workbook is read/sign/file only; "Customize layout" jumps to the Builder.)

### 4.5 Builder (layout/section authoring) — its OWN sub-view (decision-#2 reversal)  ✅ built 2026-06-22
~~Right-side inspector~~ — **superseded.** Builder is a full destination, not a Workbook edit-mode. Built: **3-pane `Builder.tsx`** — LEFT sections list (▲▼ reorder · show/hide `Switch` · delete) + **add-section palette** (the 9 types: summary · findings · exhibits · sensitivity · SWOT · conditions · conclusion/actions · free-text · cert; singletons auto-disable once present) | CENTER context editor (**Document settings** when nothing selected: theme · heading font · density · header/footer/logo · show status/confidence · severity colour-coding · hide overridden/rejected · **per-level risk wording**; otherwise the section's config — findings **category filters**, exhibit **series + table/chart/both**, sensitivity **range**, SWOT **placement**, free-text **body**) | RIGHT **live mini-preview** (reuses `WorkbookPreview`, `zoom`-scaled) ⇄ **template library** (apply any org `WorkbookLayout` as the base) + **merge-field legend** — plus a TOP **import-from-appraisal** band (appraisal sections add in as editable free-text appendix sections) and a **Reviewer-editing** toggle (read-only otherwise). All edits write the per-review `WorkbookConfig` in `workspace.store`; the Workbook renders from the same config (verified: toggling/​reordering in Builder reflects live in both the mini-preview and the Workbook sub-view). Inherits the org default `WorkbookLayout` (resolved by profile); org-level authoring is the same surface in "org mode" (Templates → Workbook Layout — wire-up deferred).

### 4.6 Triage (`/reviews/[id]/triage`)
Auto-rejected only: failed-criterion card + evidence + confidence; **Override & admit** (primary navy, audited reason → starts pipeline, resumes SLA) / **Confirm & return** (secondary). SLA paused while in triage.

---

## 5. Current build: working / broken / inconsistent

**Working:** Technical→Findings is the only real surface; FindingCard has evidence + AI audit trail + cite→PDF; solid domain model + seeds; coverage ring exists.

**Broken / stale:**
- 3 of 4 surfaces are `DetailStub` placeholders (Administrative, Builder, Workbook).
- `triage/page.tsx` is hardcoded, uses the old `.page` skeleton, and routes to **dead `/reviews/[id]/technical`**.
- Findings data exists only for `review-001`; "Source PDF" hardcodes page 47.

**Inconsistent with evolved patterns (rebuild targets):**
- `ReviewContextBar` hand-rolls `.revbar/.revtab` with static `.on` → violates the sliding-pill `Tabs` rule. Sort/filter hand-rolled `.segmented`.
- Prints **raw `review.status`** → violates derived-state rule.
- Legacy `.btn/.chip/.field/.card` markup instead of atoms; `FindingCard` ignores `SeverityChip`.
- Disposition composer is a bare textarea → `ResponseTemplate`s unwired.
- Add-finding is an inline card, not a `BottomSheet`.

---

## 6. Build / reuse map

**Reuse (do not re-invent):** `molecules/Tabs`, `molecules/SegmentedControl`, `molecules/SeverityChip`, `molecules/ActionMenu`, `molecules/ConfidenceMeter`, `organisms/BottomSheet`, `organisms/StepperModal`, `templates/PageHeader`, `atoms/{Button,Chip,IconButton,Input,Textarea,Label,Card,Switch,Tooltip}`, derived state in `lib/review-lifecycle.ts`, `lib/utils.ts` (`SEV_META`/`DISP_META`).

**Rebuild:** `ReviewContextBar` (→ `Tabs` + derived chips, 2-tab sub-nav), `TechnicalWorkspace` (focus mode), `FindingCard` (atoms + `SeverityChip` + decision-#4 actions + response-template composer), `WorkbookRail` (slim), `PdfPane` (real data), `triage/page.tsx` (real data, route to `/reviews/[id]`).

**Build new:** Administrative attestation (shared shell), Workbook Preview doc, Workbook Edit inspector, state-adaptive shell wrapper, "Filter & sort" popover, coverage/anti-miss panel component.

---

## 7. Suggested build sequence
1. ~~**Shell + context bar**~~ ✅ — `Tabs`, derived chips; sub-nav now **3 underline tabs** (Findings · Builder · Workbook) after the decision-#2 reversal.
2. ~~**Findings focus-mode rebuild**~~ ✅ (build 2026-06-22) — list rail (`FindingList`) · focus pane (`FindingFocus`) · on-demand docked source (3rd pane appears only on cite / Source toggle); atoms + `SeverityChip`/`ConfidenceMeter`; decision-#4 actions; response-template composer (`ResponseComposer` + `ResponseTemplatePicker`, merge-fill via `lib/utils#fillTemplate`); consolidated toolbar (`FilterSortPopover` + Source toggle + Add + ⋯); collapsible coverage panel (`CoveragePanel`). **Old `FindingCard`/`WorkbookRail` removed; slim Workbook summary now lives in the rail foot.**
3. ~~**Workbook compiled doc (rich)**~~ ✅ (build 2026-06-22, **Phase 1 of the un-folded design**) —
   `Workbook` container (clean doc + DRAFT→Sign→Complete/Return lifecycle; "Customize layout" →
   Builder) composing `WorkbookPreview`: running header strip · navy header band · cover banner
   (derived **recommendation pill** w/ condition count + **risk badge with wording**) · meta row
   (loan/effective/reviewer/reviewed) · **structured findings sections** (Scope & Compliance / Sales
   Comparison / Income / Cost via category map) each w/ status badge + **AI-basis footnote** · pending
   placeholders · **analytical exhibits** (adjustment grid · $/SF bar chart · cap-rate number-line —
   `WorkbookExhibits.tsx`, bespoke SVG/CSS) · **sensitivity heat** · **SWOT** · conditions · conclusion
   + **action items w/ deadlines** · **imported appraisal sections** · certification (**real SHA-256**
   seal via `crypto.subtle`). Exhibit data seeded in `workbook-exhibits.seed.ts` (collection v13, loaded
   by `workspace.store`). All derived in `lib/workbook.ts`; Sign gated until 0 pending.
4. ~~**Workbook Builder (full 3-pane authoring)**~~ ✅ (build 2026-06-22) — full 3-pane `Builder.tsx`
   (LEFT sections list reorder/show-hide/delete + 9-type add-palette · CENTER document-settings or
   per-section editor · RIGHT live mini-preview ⇄ template library + merge-field legend) + import-from-
   appraisal band + reviewer-editing gate. Backed by a new per-review **`WorkbookConfig`** in
   `workspace.store` (sections + document settings), seeded by `lib/workbook-config#defaultWorkbookConfig`
   from the inherited org `WorkbookLayout`. `WorkbookPreview` was refactored to render **from the config**
   (order/visibility/grouping/presentation) while content still derives from live dispositions — so the
   Builder, its mini-preview, and the Workbook sub-view all render the same paper. Org-mode variant
   (Templates → Workbook Layout) deferred. New CSS lives under the `.bld-*` block in `globals.css`.
5. **Administrative** — attestation in the shared shell.
6. **Triage** — rework to real data + correct route.

### 7.1 IA deltas to fold into the boards/map at the next reconciliation
Captured here so the single post-Workbook IA pass (both `ia-board*.html` + `ia-map.md`) doesn't miss them:
- **Decision #4 ⋯ secondary actions** now include **Add to conditions** and **Flag for follow-up** (state toggles on `FindingState.condition`/`flagged`), alongside Disagree-&-edit and Comment. Conditions feed the Workbook's batched Conditions list (§4.4); flag is personal follow-up.
- **Coverage / anti-miss panel elevated** to a persistent collapsible header band above the panes (not an in-rail summary) — resolves the §8 "coverage panel placement" open question in favour of the header.
- **Source PDF = on-demand 3rd pane** (default 2-pane rail+focus → 3-pane on cite/toggle), not always-on and not a BottomSheet — resolves part of the §8 "responsive focus mode" question for desktop.
- **Technical sub-nav un-folded back to 3 views: `Findings · Builder · Workbook`** (decision-#2 reversal, 2026-06-22). Rendered as **underline tabs** (`.revsub` in `ReviewContextBar`), a different shape from the top track's sliding pills — the boards/map must drop the "2 sub-tabs / Builder folds into Workbook" wording and the Preview⇄Edit toggle, and restore Builder as its own sub-view.
- **Workbook compiled doc — rich section set** (decision 2026-06-22). The doc renders, in order: Property & Value Summary · structured **findings sections** (Scope & Compliance / Sales Comparison / Income / Cost, mapped from finding category, each finding w/ disposition badge + **AI-basis footnote**; pending → "Open — awaiting disposition") · **Analytical Exhibits** (adjustment grid · $/SF bar chart · cap-rate number-line) · **Sensitivity Analysis** (heat) · Conditions of Approval (C1…) · Returned to Appraiser · Conclusion & Action Items (A1… w/ deadlines) · **Appendix: SWOT** · **Appendix: Imported appraisal sections** · Reviewer Certification. Conditions/Returned auto-hide when empty; exhibits/SWOT/imported come from `workbook-exhibits.seed.ts`. Everything else derived from the live workspace store.
- **Workbook lifecycle vocabulary:** DRAFT (ribbon + diagonal watermark; Sign **gated** until 0 pending) → SIGNED (name/timestamp/**real SHA-256** seal) → FILED / RETURNED (locked banner). The reviewer **Recommendation** (Approve / Approve-with-conditions / Review-in-progress) + **risk wording** are **derived** — fold into `lib/review-lifecycle` if they should surface on queue/context-bar chips.
- **Builder is reviewer-gated** and its own destination (not an edit-mode toggle) — confirms §8 "role gating". Built 2026-06-22 as the full 3-pane authoring tool (§4.5).
- **Property identity moved into `ReviewContextBar` as its own zone** (build 2026-06-22). The bar is now **three stacked zones** so identity and nav never share a row (the rich object-header convention — GitHub/Linear/Stripe): (1) **identity row** — address title (display font) + a compact `type · bank · loan#` meta line + an **ⓘ panel popover** (appraisal firm · reviewer · order source · SLA; `side="right"` so it isn't clipped by the sticky top bar), with the derived status chips **right-aligned on this row** (moved off the tab row); (2) **track tabs** (`Tabs` sliding pill); (3) **sub-views** (underline `.revsub`). Resolves the §4.1 "compact line + ⓘ popover" item. **Breadcrumb leaf is now the loan number** (`Reviews › Loan #LN-4471`) — the canonical record id — not the address, since the full identity lives in the bar (the address is no longer duplicated). `Breadcrumbs.tsx` special-cases `reviews/[id]` for this; Templates/other detail crumbs are untouched. New `.revhead`/`.revid`/`.revid-pop` CSS in the ReviewContextBar block of `globals.css`.
- **Per-review `WorkbookConfig` is the new editable layer** (build 2026-06-22). The doc no longer renders a fixed assembly: a per-review config (ordered sections + document settings) lives in `workspace.store`, seeded from the inherited org `WorkbookLayout` by `lib/workbook-config#defaultWorkbookConfig`, edited in the **Builder**, and consumed by **`WorkbookPreview`**. Sections: summary · findings (one per appraisal-approach group, with category filters) · exhibits (series + table/chart/both) · sensitivity (range) · conditions/returns (auto-hide) · conclusion · SWOT + imported narrative (appendix) · certification · free-text. It is **per-review ephemeral** (re-derived on load; not persisted) — the seam to grow org-mode authoring (Templates → Workbook Layout) and any future "save per-review override" from. The boards/map should note the Builder edits this config, not the layout template directly.

---

## 8. Open detail questions (batch 2 — non-blocking)
- **Responsive focus mode:** 2- vs 3-pane on narrow widths; can list rail + source show together? (early-specs §2 build-time open)
- **Coverage panel placement:** persistent collapsible header vs in-rail summary.
- **Return-to-appraiser:** build Sign → Complete now; keep Return present but `returned` queue state dormant pending **client Q1** (continuation vs new appraisal).
- **Filing scope (decided 2026-06-22, with a deferred follow-up):** "Complete & file" is **local to the Workbook view** for now — it shows a "Filed — locked" banner inside the doc and does **not** flip `review.status` to `completed` app-wide. **TODO (later, must be thought through + built):** wire filing to the real lifecycle so a filed workbook flips the review to `completed` everywhere — which lights up the **completed → read-only filed-doc shell** (locked decision #5, §2) across the queue, context bar, and both tracks — plus how re-opening/amending a filed review behaves. Out of scope this session by agreement; the local `filing` state in `workspace.store.ts` is the seam to grow from.
- **Workbook brand defaults vs per-workbook overrides:** which settings are org-locked vs per-review (early-specs §4 open; client wants brand colors/fonts as global defaults).
- **Edit-mode role gating:** confirm reviewer-only edit for the demo (no recipient role yet).
