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
2. **Builder folds into the Workbook as a Preview ⇄ Edit-layout mode.** Technical now has **2 sub-tabs: Findings → Workbook** (was 3). Full layout authoring lives once at org level (**Templates → Workbook Layout**); per-review editing is a right-side inspector for light overrides. *(Updates the locked "Findings/Builder/Workbook" sub-view IA — note in AGENTS.md.)*
   - Rationale: modern peers (Gamma Present, Power BI Edit/Reading, Figma modes, Google Docs Editing/Viewing, Webflow Preview) put configuration as an *edit mode on the artifact*, not a separate destination; template-vs-instance is the only durable split. Also reclaims real estate.
3. **Aggressive toolbar consolidation** everywhere: sort + filter → one "Filter & sort" icon button → popover (badge = active count); Source PDF → icon toggle; bulk/power actions → ⋯ overflow; **Add finding → centered `Modal` form** (single-step; save → adds to review; mock data); property meta → compact line + ⓘ popover.
   - The **modal-form pattern** (centered `Modal` + structured inputs + Save/Cancel) is reusable for similar quick-add inputs app-wide. Coexists with `BottomSheet` (used for larger/contextual editing); use a modal for short structured create/quick-add, a `BottomSheet` for deeper editing on a place.
4. **Disposition hierarchy** = two always-visible primaries + ⋯ overflow. Primary label adapts to origin: **AI/Parachute finding → `Agree` + `Reject`**; **reviewer-added finding → `Accept` + `Reject`**. Secondary (Disagree & edit, Comment, Add to conditions, Flag) in ⋯ `ActionMenu`. Honors the client's verb distinction without crowding the card.
5. **One state-adaptive shell.** Same chrome; body swaps by **derived** state (`lib/review-lifecycle.ts`): `running` → pipeline tracker; `in_review` → active workspace; `completed` → read-only filed doc + signed badge; `returned` → dormant (client Q1). **Triage is the only separate route** (`/reviews/[id]/triage`), only for `autorejected`.
6. **Administrative shares the Technical focus-mode shell** (early-specs decision #4) — list rail + focus pane + docked source, with attestation items (Yes/No/N-A) instead of findings. No sub-nav.
7. **Workbook = clean doc + lifecycle only** in Preview; **Edit mode owns customization** (early-specs decision #5). Edit is **role-gated** (reviewer edits; recipient/read-only sees Preview).

---

## 3. Target IA

```
┌ ← Reviews   1450 Corporate Center Dr ⓘ   [▸Technical ·1]  [Administrative]   ⬇  ⋯ ┐
│                          Findings ──▶ Workbook                                    │
└───────────────────────────────────────────────────────────────────────────────┘

/reviews/[id]                ONE route. Tabs + sub-views are STATE, never routes/breadcrumbs.
 ├ Technical (tab)
 │   ├ Findings  (sub-view, default) — focus mode: list rail · finding focus pane · docked source PDF
 │   └ Workbook  (sub-view)          — compiled doc · [Preview ⇄ Edit layout] · Sign → Complete/Return
 │                                      Edit = right-side inspector (sections reorder/show-hide,
 │                                      theme, font, risk labels) inheriting the org default layout
 ├ Administrative (tab)               — SAME focus-mode shell; attestation items; Sign attestation
 └ (state) running / completed / returned bodies swap inside the same shell

/reviews/[id]/triage          The ONE separate route — autorejected only.
Templates → Workbook Layout   Org-level full layout authoring (the "real" builder), versioned.
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

### 4.4 Workbook (compiled doc) — Preview mode
Header band · **cover banner** (Reviewer recommendation: Approve / Approve-with-conditions / Review-in-progress + **Risk badge**) · value summary · sections (findings by category, exhibits as table/chart, sensitivity heat, SWOT, **Conditions C1/C2…**, action items, certification) · **DRAFT ribbon** until signed → **Sign** (name/timestamp/SHA-256) → **Complete (filed)** / **Return to appraiser** (batched return letter from conditions). Pending findings render as visible "Open — awaiting disposition" placeholders.

### 4.5 Workbook — Edit-layout mode (the folded Builder)
Right-side inspector: sections reorder / show-hide (hide rejected/overridden) · theme · font · header/footer/logo · **risk rating** (auto/manual, custom label/color) · signature. Left rail = section navigation. Inherits org default layout (Templates → Workbook Layout). **v2 = reduced customize panel** (early-specs decision #6); full 3-pane authoring + appraisal-section import = org-level / deferred.

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
1. ~~**Shell + context bar**~~ ✅ — `Tabs`, derived chips, 2-tab sub-nav.
2. ~~**Findings focus-mode rebuild**~~ ✅ (build 2026-06-22) — list rail (`FindingList`) · focus pane (`FindingFocus`) · on-demand docked source (3rd pane appears only on cite / Source toggle); atoms + `SeverityChip`/`ConfidenceMeter`; decision-#4 actions; response-template composer (`ResponseComposer` + `ResponseTemplatePicker`, merge-fill via `lib/utils#fillTemplate`); consolidated toolbar (`FilterSortPopover` + Source toggle + Add + ⋯); collapsible coverage panel (`CoveragePanel`). **Old `FindingCard`/`WorkbookRail` removed; slim Workbook summary now lives in the rail foot.**
3. **Workbook** — Preview compiled doc + lifecycle (Sign → Complete/Return).
4. **Workbook Edit mode** — right-side inspector (reduced customize panel).
5. **Administrative** — attestation in the shared shell.
6. **Triage** — rework to real data + correct route.

### 7.1 IA deltas to fold into the boards/map at the next reconciliation
Captured here so the single post-Workbook IA pass (both `ia-board*.html` + `ia-map.md`) doesn't miss them:
- **Decision #4 ⋯ secondary actions** now include **Add to conditions** and **Flag for follow-up** (state toggles on `FindingState.condition`/`flagged`), alongside Disagree-&-edit and Comment. Conditions feed the Workbook's batched Conditions list (§4.4); flag is personal follow-up.
- **Coverage / anti-miss panel elevated** to a persistent collapsible header band above the panes (not an in-rail summary) — resolves the §8 "coverage panel placement" open question in favour of the header.
- **Source PDF = on-demand 3rd pane** (default 2-pane rail+focus → 3-pane on cite/toggle), not always-on and not a BottomSheet — resolves part of the §8 "responsive focus mode" question for desktop.

---

## 8. Open detail questions (batch 2 — non-blocking)
- **Responsive focus mode:** 2- vs 3-pane on narrow widths; can list rail + source show together? (early-specs §2 build-time open)
- **Coverage panel placement:** persistent collapsible header vs in-rail summary.
- **Return-to-appraiser:** build Sign → Complete now; keep Return present but `returned` queue state dormant pending **client Q1** (continuation vs new appraisal).
- **Workbook brand defaults vs per-workbook overrides:** which settings are org-locked vs per-review (early-specs §4 open; client wants brand colors/fonts as global defaults).
- **Edit-mode role gating:** confirm reviewer-only edit for the demo (no recipient role yet).
