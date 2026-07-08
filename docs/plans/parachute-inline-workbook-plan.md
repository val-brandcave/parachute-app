# Parachute v2 — Inline Workbook Editing Plan ("The Workbook IS the Workspace")

**Status:** PLAN ONLY — nothing here is being built yet. Prototype scope is called out separately (§9).
**Drivers:** Jul 7 client call (Jeff/SME + Ed) — `docs/meetings/processed-calls/parachute-jul-07-2026-processed.md`
**References:** HubSpot builder screenshots (`docs/references/hubspot-builder -references/`) · Cody's Loom still of the comp-grid repeater (https://loom.com/i/e2330bebf352487597f99adb1e0acf53) · Cody's notes (`docs/meetings/meeting-notes/meeting-notes-jul-07-2026.md`)
**Companion:** broad-strokes brief for Cody — `parachute-inline-workbook-plan-brief.md`
**Feedback-log rows:** F-143 – F-148

---

## 1. North star

> **"If I gave you 30 seconds… could you fix this stuff in two minutes?"** — Jeff
> **"Use crayons. You can't screw it up. Give it to a five-year-old and say: change this Parachute output."** — Jeff

The reviewer's job is to *finish their review*, not to *validate Parachute*. Today the app makes them decide in one surface (Findings), regenerate in another (Workbook), and format in a third (Customize rail). The new model: **one document, and you work directly on it** — concur, reword, delete, add — like a Word doc that can't be broken, with an audit trail underneath everything.

### Design principles (all straight from the call)
1. **The workbook is the decision surface.** Findings render inside it; decisions happen on it.
2. **The source appraisal is the truth.** Never annotated, never disputed — only *cited* by the workbook.
3. **Tools are per-section, visible, and few.** "I'm not building formatting tools. I'm building tools specific to the sections." No bold/font toolbar. No settings-grid side panel ("select the box and get the grid on the left — way too much").
4. **Direct edits are instant.** Word-muscle-memory users must never wait for a "regenerate" to see their own change.
5. **Everything is audited.** A regulator must see the human touched it — every button, every reword, recorded. Silence isn't evidence.
6. **The 20% stays reachable, never in the way.** Customization (theme/fonts/layout) exists behind one quiet affordance; demos never open it.

---

## 2. Decisions locked (Jul 7 call + Val, Jul 7 MCQ)

| # | Decision | Where decided |
|---|----------|---------------|
| A | **Block-based editing architecture** — the document stays structured (typed sections/blocks); each block gets type-specific inline tools. NOT a whole-doc markdown/WYSIWYG mode-flip (users aren't markdown people; free-text editing breaks sections, repeaters, and per-action audit). | Val (MCQ), grounded in Ed's "tools specific to the sections" |
| B | **Findings merge into the workbook** (finding blocks inside their sections, decision buttons inline). The old annotate-the-source decision flow retires. | Jeff/Ed on-call |
| C | ***(Amended Jul 8, Cody)* Findings live in BOTH surfaces and are editable from either.** The workbook renders finding blocks in *output* context; the **"Source"** tab (the renamed Findings surface) renders the same findings in *evidence* context — same decision bar, same composer, **full parity** (Concur/Edit/Reject/Delete, comment, flag), one shared store so the two views can never disagree. The source *document* itself stays read-only truth — never edited or disputed; only the finding objects are actionable. "Create finding from a source span" moves **in scope** on the Source view. *Original Jul 7 cut (Source fully read-only) superseded; the peek-drawer alternative note stands — see §6.* | Cody (Jul 8, after plan review) + Val (MCQ: name "Source", full parity, shared in-place editor) |
| D | **Customization rail behind a single `Customize` button**, closed by default, dockable panel (current `RunCustomize` pattern). Structure edits also available directly on-canvas. | Val (MCQ), per Jeff's "don't show them that" |
| E | **Direct edits apply live**; the compile "beat" (1.2s folding sweep) remains only for *system recompute* (initial compile, AI re-run, template/theme apply). The dirty-callout/Regenerate loop leaves the primary flow. | Val (MCQ); supersedes Jun-30 D5 for direct edits |
| F | **User-created findings/annotations + inline comments** — users add what the AI missed; surfaces in the workbook; audited. | Cody + Jeff on-call |
| G | **Save as my template** — one-time save of layout/structure so the next run comes out their way. | Jeff (customer feedback) |
| H | **GA-blocking; prototype this week; async Loom updates to Jeff/Ed.** | Ed + Cody on-call |

---

## 3. The model shift

```
BEFORE (built through Jul 7)                      AFTER (this plan, amended Jul 8)
────────────────────────────────                  ────────────────────────────────
Findings tab (decide here)                        WORKBOOK tab  ←  land here: decide,
  source PDF + annotations                          edit content, sign
  rail: Accept/Edit/Reject/…                        finding blocks w/ inline actions
        │                                           per-section edit tools
        ▼  workbookDirty                            + Customize ▸ (closed)
Workbook tab (read-only doc)                              ▲
  dirty callout → Regenerate                              │  ONE findings store
        │                                                 ▼
        ▼                                          SOURCE tab  ←  same findings, same
Customize rail (always docked)                       actions, in evidence context;
        │                                            + create finding from a span;
        ▼                                            the DOCUMENT itself read-only
Sign                                               Sign (unchanged, still gated)
```

**The distinction that keeps this coherent — two kinds of editing:**
1. **Content edits** (prose, table rows, sections) act on the *deliverable* → **Workbook only**. The appraisal is never editable.
2. **Finding actions** (Concur / Edit / Reject / Delete / comment / flag) act on a *shared object* rendered in both views → available from **either surface**, always in sync because there is only one store.

Three surfaces collapse into one canvas + one evidence view over shared state. The admin/attestation document follows the same pattern (checklist items become inline-answerable blocks on the attestation doc; see §7).

---

## 4. Architecture

### 4.1 Data model — from "render list" to "editable blocks"

Today (`lib/workbook-config.ts`): `WorkbookConfig.sections: WbSection[]`, rendered by `WorkbookPreview.tsx` (686 lines, pure derivation from `findings[] + states{} + config`). Content is JSX; prose is plain strings; **there is no rich-text dependency in the app**.

Plan — evolve `WbSection` rather than replace it:

```
WbSection (existing)                    + Block layer (new)
  id, type, title, enabled                blocks: WbBlock[]   // ordered, per section
  categories / series / body …
                                        WbBlock =
                                          { id, kind: "prose" | "finding" | "table"
                                                 | "exhibit" | "factGrid" | "custom",
                                            // prose:   text (string, edited in place)
                                            // finding: findingId → findings store
                                            // table:   rows[] (add/delete/edit)
                                            edited?: { by, at }        // provenance
                                            hidden?: boolean }
```

Key points:
- **Findings become blocks** placed into their target sections (by category, as the section `categories` mapping already does) instead of being serialized into static JSX at compile time. A finding block *reads* from the existing `FindingState` store — so `FindingDecisionBar`, `dispositionLine()`, tallies, and the F-142 "Rewritten by reviewer" provenance all keep working.
- **Compile = seed, not render.** `ensureWorkbook()` currently derives the display; it will now *materialize blocks once* (from AI output + layout), and afterwards the blocks are the document. System recompute (AI re-run, template apply) re-materializes — with the folding beat and a "your edits" reconciliation rule (see Open Q3).
- **Deterministic letter-packing stays** — blocks change content, the existing SSR-safe page-weight estimation re-paginates.

### 4.2 Editing surfaces — no heavyweight editor framework (for now)

This is a **prototype, not production** (standing Brandcave rule): mock data, Zustand, no persistence concerns. So:
- **Prose blocks:** a controlled `contentEditable` field per block (plain text + line breaks), commit on blur/Esc/✓. No markdown exposed, no toolbar. If selection/paste handling becomes a tax, adopt **Tiptap** (per-block instances, MIT, React-native) — noted as the upgrade path, not the starting point.
- **Tables/repeaters:** structured controls only (add row / delete row / edit cell as input fields) — never free text over a table. This is precisely the "deleting that row screws up the entire form" Word failure we're replacing.
- **Finding blocks:** existing `FindingDecisionBar` + `ResponseComposer`, re-skinned into the document (popover composer anchored to the block).

### 4.3 State & audit — three layers
- Block edits → `workspace.store` (new `updateBlock`, `moveSection`, `addRow`… actions), same store that owns `FindingState` — one undo/audit spine. Every action appends `{who, when, action, blockId, before→after}`.
- The audit trail lives in **three layers**, because it serves three readers:

| Layer | Where | Reader | What they see |
|---|---|---|---|
| **1. On-document identifiers** | Pips/tags on touched blocks, in the canvas *and* carried into the printed/exported doc | The regulator / boss skimming the deliverable | "✎ Edited by reviewer" · "Reviewer-added" · "Rewritten by reviewer" (F-142 tag, reused) · struck/annotated row removals. Hover in-app expands: *who · when · what it was before*. |
| **2. Printed decision log** | A workbook section (extends today's concurrence/disposition lines — `dispositionLine()` already prints these) | Whoever receives the PDF/docx | Per-finding decisions, reviewer notes, reviewer-added findings, excluded items — the defensible narrative *inside* the document. |
| **3. Full activity log** | App-side panel (toolbar clock/"Activity" affordance), not printed by default | The 20% / an examiner who asks | Complete ordered ledger: every click, edit, row add/delete, before→after diffs, timestamps. |

- This split answers Jeff's two fears at once: layer 1–2 defeat *"you just let AI do this? No way, bro"* (the human's touch is visible on the artifact itself), layer 3 defeats the lazy-reviewer over-index (*"did you even read this?"* has a factual answer).
- **Deletions are never silent:** removing an AI finding block records an "excluded" entry (layer 3 always; layer 2 pending client answer — Open Q2).
- **Live edits (Decision E):** store update → immediate re-render (the doc *is* the state). The 1.2s folding sweep plays only for system recompute.

---

## 5. The block toolset matrix (what "crayons" means per section)

Interaction chrome (HubSpot pattern, restrained): **hover a block → light outline + a small floating action set** (top-right of block); **click text → caret in place**. One visual system everywhere; only the actions vary:

| Block / section kind | Hover actions | In-place |
|---|---|---|
| Any section | ⠿ drag-reorder · 🗑 delete · 👁 hide · ＋ add section below | rename heading |
| Prose / narrative / freeText | ✎ edit · 🗑 | click → edit text; blur/✓ commits |
| Fact grid (value summary etc.) | ＋ add fact row · 🗑 per row | edit label/value inline |
| Repeater tables (comp grid, adjustment grid) | ＋ add row · 🗑 per row (Jeff's "delete Comparable 5") | edit cell values |
| Exhibits (charts) | table/chart/both toggle · 🗑 | — (config, not free edit) |
| **Finding block** | **Concur · Edit · Reject · Delete** + 💬 comment · ⚑ flag | Edit → reword the finding text in place (replaces AI analysis, tagged "Rewritten by reviewer") |
| Citation chip (on finding blocks) | click → **Source** tab at the cited span | — |
| Attestation item (admin doc) | **Yes / No / N-A** + reason on divergence | — |
| Cover / certification | logo swap · title edit | Sign remains a gated action, not a block edit |
| Anywhere | 💬 add comment (hover tooltip affordance — Jeff asked for exactly this) | — |
| ＋ Add | "Add finding" (user-created, §6.2) · "Add text section" · "Add row" | — |

**Not in scope, deliberately:** bold/italic/font-size, color pickers on text, image embeds (logo excepted), free drag of arbitrary elements. Formatting belongs to the template/theme (Customize panel), not the reviewer.

**The finding Edit pattern — one shared editor, anchored in place** *(Val, Jul 8 MCQ)*: Concur/Reject/Delete are one-click buttons and need no editor. Clicking **Edit** flips the finding itself into edit mode where it stands — the workbook block (or the Source rail item) expands with the reword field, severity, and comment, plus Save/Cancel. Same component, two anchors. This is HubSpot's click-element→edit-state mechanic **without** HubSpot's side inspector panel (which is exactly what Jeff pushed back on — see §8).

---

## 6. Surface-by-surface changes

### 6.1 Workbook tab (`RunWorkbook` + `WorkbookPreview`) — the workspace
- Landing view after processing (already true). Now editable per §5.
- **Toolbar:** zoom/pages (keep) + `Customize ▸` (Decision D — panel closed by default; contains theme, fonts, density, section list toggles; the on-canvas tools already cover reorder/delete, so the panel is purely the 20%'s finish-work) + `Save as template` (§6.4) + Download (PDF/docx) + Sign.
- Dirty-callout + Regenerate button **removed from the primary loop** (Decision E).
- Severity colors, 5–6 page length, cover/TOC pagination — **unchanged (validated, D13)**.

### 6.2 Findings → finding blocks + user-created findings
- AI findings render as blocks inside their mapped sections with inline decision buttons. Decision state, tallies, sign-gating ("N findings undecided") all continue from `workspace.store` — the *math* doesn't change, the *place* does.
- **User-created findings are still very much in (F-145)** — but they are **created on the workbook, not on the source**. Ed's closing words settle where annotations live: *"We won't be annotating it on the original appraisal. We will be annotating that in the output."* (Cody's earlier "create annotations in the findings view" framing predates the merge decision — the *capability* survives, the *place* moved.)
- **A reviewer-added finding ≠ a plain text edit.** Editing prose/adding a table row is just *content* — it gets an "edited" provenance pip and that's it. **"＋ Add finding" is a first-class object**: the composer asks for text, severity, and an optional source-page citation; it renders as a finding block tagged **"Reviewer-added"** (visually distinct from AI findings — a regulator must be able to tell them apart), participates in decision tallies, the findings section, and the printed output. Both paths exist; the add-menu makes the choice explicit ("Add finding" vs "Add text section").
- **Entry points *(both in scope as of Jul 8)*:** (a) output-first — **"＋ Add finding"** in any section's add menu on the workbook; (b) evidence-first — from the **Source** tab, select a span → **"＋ Create finding from here"**, pre-filling the citation. Neither violates read-only-source: the source content is never altered or disputed; the gesture only *captures evidence*. Reviewer citations render on Source as visually-distinct pins (evidence pointers, not annotations).
- Comment = the F-142 independent-note model, now anchorable to any block, not just findings.

### 6.3 Source tab (was Findings) — the evidence view, findings fully actionable *(amended Jul 8)*
- Rename **Findings → Source**. Keep everything: whole 6-page appraisal, severity highlights, numbered tags, **and the findings rail with its full decision bar** — Concur / Edit / Reject / Delete, comment, flag. **Full parity with the workbook's finding actions**; the rail and the workbook blocks read/write the same store, so a decision made in either place shows in both instantly.
- **The one hard line:** the appraisal *document* is never editable, annotatable-by-hand, or disputable — the doc pane stays locked; only the finding objects carry actions. (This preserves Ed's "the source is the truth" while honoring Cody's "edit them from either place.")
- **Create finding from a span (now in scope):** select text in the source doc → "＋ Create finding from here" — pre-fills the citation, drops the finding into the shared store (and thus the workbook). This is the natural evidence-first entry point for reviewer-added findings; the workbook's "＋ Add finding" remains the output-first one.
- **The Edit experience is one shared component** (see §5 note): the rail item expands in place into the same editor the workbook block uses. No side panel.
- Citation chips on workbook blocks deep-link here (tab switch + scroll to span — the F-140/F-141 anchor work is reused as-is).
- **Build note:** this amendment is *less* work than the Jul 7 cut — we keep the decision bar we already built instead of stripping it. The peek-drawer alternative (citation chip → drawer over the workbook, in addition to this tab) still stands as a build-time option.

### 6.4 Save as my template (Decision G)
- After structural edits, `Save as template` captures **structure + theme** (section order, visibility, added/removed sections, theme/font/density) into a `WorkbookLayout` (the org-store model already versioned) — *content* (prose text, decisions, rows) is per-review and never templated.
- Next run's confirm gate: the inherited-template tile (F-133 pattern) simply lists it — "My layout (saved Jul 7)". No new UI concept needed at the gate.
- Open: user-level vs org-level shelf (Open Q4).

### 6.5 Admin / attestation document — same pattern (fast follow)
- Checklist items become inline-answerable blocks on the attestation doc (Yes/No/N-A + divergence reason), checklist rail keeps working as navigation; the run-flow admin surface converts to Source-style read-only. Same block chrome, same audit pips.
- Sequenced *after* the technical workbook proves the pattern (it's the same components; the attestation doc is already the "twin").

### 6.6 Exports (D11)
- PDF stays the flagship. docx export stays offered; with editing now in-app, docx is a *delivery* format, not an *editing* format — we stop chasing perfect Word-table editability (the unwinnable fight that started this).

---

## 7. What we keep (so this doesn't read as a rebuild)

- Run flow: intake → confirm gate (F-116/117/133) → processing → **land on workbook** — unchanged.
- All finding decision *semantics* (Accept/Edit/Reject/Remove, comment decoupled, provenance — F-118/F-142). We're moving the controls, not redefining them.
- Source-page anchoring (F-140/141), severity system, workbook pagination (F-120), sign/seal, multi-type tabs (F-117), attestation logic.
- `Builder` (org template editor) remains the admin-side layout tool; `RunCustomize` panel survives behind the button.
- **Newly validated, protect:** 5–6 page length, yellow/red severities, TOC/cover.

---

## 8. Reference patterns (external)

- **HubSpot builder** (Cody's live demo; screenshots in repo; named again Jul 8 as *the* design reference). Its three distinct mechanics, and our adopt/reject call on each:
  1. **Hover a module → outline + small floating toolbar** (edit / clone / delete / drag). → **Adopt** — this is our section hover chrome.
  2. **Click text → type directly in place** (floating format bar in HubSpot's case). → **Adopt the in-place typing, drop the format bar** (no formatting tools — Ed).
  3. **Click a module → the left sidebar flips into a scoped settings inspector** (padding, visibility, colors). → **Reject** — this is Jeff's *"floating away… HubSpot, CRO kind of feel"* and Ed's *"select the box and get the grid on the left — way too much."* Module settings that survive (theme, sections) live behind `Customize ▸`; finding edits happen anchored on the element itself.
- **Notion:** hover ⠿ drag handle + per-block ＋ menu — the restrained block chrome we want (without the slash-command power surface).
- **Google Docs suggesting mode / Word track changes:** the mental model for provenance — edits visibly attributable ("Rewritten by reviewer"), which is our regulator story.
- **Ashore** (Cody's product): approval-with-annotations DNA; we already borrowed its pin pattern for Source.
- Editor tech note: Tiptap/ProseMirror is the industry default for per-block WYSIWYG if `contentEditable` proves insufficient (§4.2). Never Lexical/Slate for a prototype on this clock.

---

## 9. Phasing & the week (Decision H)

> Cody's on-call sketch: everything shipped = "phase one"; this = "phase two"; Ed rejected deferring inline beyond GA. Prototype ugly-fast for Jeff: *"even if it's super ugly and doesn't even work altogether… so I can get that feeling of speed."*

**Phase 2a — the "feel the speed" prototype (this week, Loom by ~Thu):**
1. Hide the Customize rail behind the button (one-day win; kills the "HubSpot CRO feel" instantly).
2. Finding blocks inline in the workbook with live Concur/Edit/Reject/Delete (reuse `FindingDecisionBar`), decisions apply instantly.
3. One repeater with add/delete row — **the comp grid** (it's Cody's Loom example; demo-ready story: "delete Comparable 5, add a row").
4. Prose edit-in-place on 1–2 narrative blocks + edited-by-reviewer pip.
5. Async Loom to Jeff/Ed narrating the 30-second review.

**Phase 2b — full pattern (next):** all section types per §5 matrix · user-created findings (both entry points, incl. create-from-span on Source) · comments anywhere · Source tab rename + shared-editor unification (decision bar stays — lighter than the original strip-out) · Save-as-template · section drag/add/hide chrome polish · audit panel surfacing.

**Phase 2c — admin twin + polish:** attestation doc inline answering · exports pass · language cleanup (D14: "Findings/Source/Workbook" naming) · demo script that never opens Customize.

---

## 10. Open questions (log in `parachute-v2-client-questions.md` where client-facing)

1. **Reviewer-added findings** — must they carry a source citation to be defensible, or is "reviewer observation, no citation" acceptable to a regulator? *(client)*
2. **Deleting an AI finding block vs. Rejecting it** — does *delete* mean "excluded but audited" (recommended — nothing truly disappears in a regulated doc) or truly gone? *(client — Jeff's "gotcha reviewer / prove you read it" tension)*
3. **Reconciliation on system recompute** — if AI re-runs after the user edited blocks, edits win? AI wins with a diff? (Recommended: user edits always survive; new AI content appends as new blocks flagged for review.) *(internal, then confirm)*
4. **Template shelf:** user-level, org-level, or both? *(client — touches their org/roles model)*
5. **Source peek drawer vs. page** — revisit at build time (§6.3 note). *(internal)*
6. **docx fidelity bar** — is "clean export, don't edit the docx" an acceptable stance to state to customers? *(client)*

## 11. Risks

- **Scope gravity:** "inline editing" quietly becoming a general document editor. The §5 matrix is the fence — anything not in it is Customize/Builder territory or out.
- **Regenerate-model whiplash:** we told the client "regenerate, not live" on Jun 30; now direct edits are live. Frame it in the async video: *your* changes are instant; the beat remains where the *system* recomputes. (It's what Jeff asked for — but say it out loud.)
- **Audit dilution:** blocks editable everywhere means provenance pips must be un-missable, or we recreate "did you even read this?"
- **Attestation lag:** if admin doc doesn't get the pattern by GA, the two review types feel like different products (D14 language cleanup partially mitigates).
- **The week itself:** the prototype must cut every corner that isn't *speed-of-review* — no theming, no drag polish, mock everything.
