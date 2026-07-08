# Parachute v2.0 — UX Sync / Jeff's SME Review → Inline-Editing Direction Change (Processed)

**Meeting:** UX Sync | Realwired
**Date:** July 7, 2026
**Recording:** https://fathom.video/share/ZGwg-yfxrjX1MJzXwn5BcaejzjHwu6zZ (~52 min)
**Source file:** `meetings/raw-calls/meeting-jul-07-2026.md` (transcript)
**Cody's notes:** `meetings/meeting-notes/meeting-notes-jul-07-2026.md`
**References:** `references/hubspot-builder -references/` (4 screenshots of HubSpot's email builder) · Loom still: https://loom.com/i/e2330bebf352487597f99adb1e0acf53 (workbook "Analytical Exhibits" comp grid — the repeater example)

## Attendees
- **Edward "Ed" Kruger** — Realwired (client; product owner).
- **Jeff** — Realwired (**SME / the sign-off**; joined at Ed's request ~6:50). *He's the one relaying live bank-customer feedback — two customer calls that same day.*
- **Cody Miles** — Brandcave (my boss).
- **Val Vinnakota** — Brandcave (me).

> ⚠️ **Transcript attribution caveat:** Fathom labels almost everything from Realwired as "Edward Kruger," but from ~14:47 onward **most of those lines are Jeff speaking** (Cody replies "Jeff" directly to them). Read the Realwired voice in this doc as *Jeff (SME) with Ed chiming in*, not Ed alone.
>
> Shape of the call: first ~7 min Cody+Val prep (Fable talk, "pull up everything before Ed arrives"); ~7–14:47 **Val demos the full two-pathway flow** (YouConnect → interstitial → confirm → multi-type run → technical workbook + findings → customize → sign → admin attestations → seal → return); from ~14:47 **Jeff takes over** and re-frames the entire product around his customers' actual workflow; ~42:18 Cody demos **HubSpot's email builder** as the design pattern; last 5 min = commitments.

---

## TL;DR

The goal going in was **sign-off for GA** ("get this across the finish line… approved and delivered today"). Instead we got the most consequential course-correction since Jun 23 — not a rejection of quality ("so elegant," "you guys are fantastic designers") but of **where the work happens**.

**Jeff's core message:** reviewers have lived in Word for decades. Their real workflow is *skim the 5–6 page Parachute output → get primed → read the appraisal → produce THEIR report*. Our current model — decide in a separate Findings surface, regenerate, then customize via a right rail — feels like **validating Parachute instead of finishing their review**, and like they're "floating away… working on HubSpot, CRO kind of feel." Their old pain isn't AI distrust anymore; it's *"I have to manipulate the column size every time"* in the exported Word doc. Quote of the call: **"I want to save time, Jeff."** And the crayons directive: **"Use crayons. You can't screw it up. Give it to a five-year-old and say, change this Parachute output."** The bar: *if you gave me 30 seconds… could you fix this stuff in two minutes?*

**The direction (all confirmed on-call):**

1. **The workbook becomes the workspace.** Findings **merge into the workbook** — the finding blocks appear in the workbook sections they belong to, with **Concur / Edit / Reject / Delete buttons inline in the document**. The separate annotate-the-source Findings surface goes away as the decision surface: *"the findings go away, the findings get merged into the workbook."* **The source appraisal is the truth — you never dispute or annotate the source; you decide in the output**, which cites back ("this paragraph came from page 64").
2. **Inline, HubSpot-builder-style editing of the workbook** (Cody demoed it live): hover/select any section → visible, **context-oriented tools** — edit text in place (WYSIWYG; markdown under the hood is fine, raw markdown is not), delete a section, add content. **Repeaters (comp grids, tables) get add-row / delete-row** (the Loom still: delete Comparable 5 because it's an outlier). Explicitly **NOT formatting tools** — *"I'm not asking you to do formatting and changing this to bold… tools specifically to the sections."*
3. **User-created annotations/findings + comments** — AI won't catch everything; users must be able to add their own findings/notes that surface in the workbook, plus comment on any cell/section (hover → tooltip button). Everything lands in the **audit trail** — regulators must see the human touched it ("you just let AI do this? No way, bro").
4. **The customization rail is the 20%.** Colors/rearrange/hide stays for power users but is **hidden from the primary flow and from demos** — Ed/Jeff's warning: don't recreate "select the box and get the grid on the left… way too much" (HubSpot's own failure mode).
5. **Save my edits as a template** — users won't tolerate making the same manipulations every run ("we don't want to keep manipulating your output… the same edits every time"). One-time save → next run comes out their way.
6. **This is GA-blocking, not a nice-to-have.** Cody proposed phasing inline editing later; Ed pushed back flat: *"This doesn't work if we don't have the inline."* docx-export-as-escape-hatch doesn't cut it (editing the exported Word table breaks it — that's the existing pain). One customer is literally **waiting on this to sign a contract**.

**Commitments:** Cody regroups with Val and **drafts the plan** (this is the "make a plan, send it to me"); a **down-and-dirty inline-editing prototype for Jeff to feel the speed** — *"even if it's super ugly and doesn't even work altogether"* — with **async Loom-style video updates** instead of waiting for the next call; **spike extra hours this week.** Jeff asked "will we see a version this week?" → yes.

---

## Decisions made

| # | Decision | By | Area |
|---|----------|-----|------|
| D1 | **Findings merge into the workbook.** The workbook is the decision surface; finding blocks render inside their sections with inline decision buttons. The standalone Findings (annotate-the-source) view is no longer the primary workflow. | Jeff + Ed, accepted by Cody | Findings / Workbook |
| D2 | **Source appraisal = read-only truth.** Never corroborate/dispute on the source; decisions + edits happen in the workbook, which **cites the source** (page-anchored). | Ed | Model |
| D3 | **Inline decision controls in the document:** per finding block — Concur / Edit (reword) / Reject / Delete, live in the workbook, one click each, recorded. | Jeff | Workbook |
| D4 | **HubSpot-builder editing pattern:** highlight/select a section → contextual actions (edit inline, delete, duplicate/hide, add). Cody demoed HubSpot email builder as the reference. | Cody + Jeff | Workbook editor |
| D5 | **Section-specific tools, not formatting tools.** Repeaters (comp grid, tables): add row / delete row / edit row. No bold/font/free-form toolbar. Controls **visible and context-orientated** — not a settings grid in a side panel. | Ed (+ Jeff) | Workbook editor |
| D6 | **Text editing is WYSIWYG** (markdown acceptable as the storage/interchange format; raw markdown never shown). | Ed + Cody | Workbook editor |
| D7 | **Users can create their own annotations/findings** (things AI didn't catch) that surface in the workbook; plus inline comments on cells/sections. | Cody (proposed) + Jeff (confirmed need) | Findings model |
| D8 | **Every inline action is audit-trailed** — the defensibility story for regulators ("prove that you did something to this"). | Jeff | Audit |
| D9 | **Customization rail (colors, rearrange, on/off) = advanced/20%**; keep it, but out of the primary flow and **out of demos**. | Jeff | Customize rail |
| D10 | **One-time "save as my template"** — layout/edit preferences persist so the next run doesn't need the same manipulation (e.g., moved section 2→1, added a logo). | Jeff (relaying customer feedback) + Cody ("gotcha") | Templates |
| D11 | **Multiple export paths** stay: pretty PDF + docx (exists, but its editability is the pain we're solving) (+ raw text idea floated). Inline editing reduces the need to leave. | Cody | Export |
| D12 | **Inline editing is GA-blocking — no phase-split.** Prototype this week; async video updates to Jeff/Ed; extra hours this week over next. | Ed (requirement) + Cody (commitment) | Roadmap |
| D13 | **5–6 page workbook length validated** (15 pages = "creating more work for me"); **yellow/red severity touch validated.** Keep. | Jeff | Workbook format |
| D14 | **"Findings vs. workbook" language needs cleanup** — Jeff couldn't parse the separation; merging (D1) mostly resolves it, but naming needs care. | Ed | Language / IA |

---

## The demo (what was shown, ~7:00–14:47)

Val walked the full two-pathway story, uninterrupted (Jeff/Ed engaged from the workbook onward):

- **Pathway 1 — from YouConnect:** request form → toolbar button → interstitial ("connecting to Parachute") → **confirm gate** (review types first; technical + admin both pre-selected; conditional per-type setup — workbook layout for technical, compliance checklist for admin; inherited-from-settings with per-run override) → simultaneous processing with per-type progress → tabs flip ready as each type finishes.
- **Technical review:** land on the AI-generated workbook → findings view (source appraisal + severity annotations + right findings rail; each finding = intensity, evidence, citation w/ page + annotation, AI audit trail) → decisions (accept-as-is; reject + response template from DB or free text; **edit the finding**; comment + accept; flag for follow-up) → **regenerate workbook** (decisions folded in: concurrence lines, flags, edits, notes) → **customize** (colors, headings, rearrange/delete sections) → **sign** (type or draw) → download.
- **Admin review:** attestation document + checklist rail → per-item agree / overwrite-with-reason → regenerate attestation → score, sign & seal → **return to YouConnect**.
- **Pathway 2 — standalone app** (dashboard/start-review page shown briefly at Jeff's request; clarified YouConnect users deep-link straight into the flow and never see it).

*(No UI bugs were called out in the demoed build this time — the pushback was entirely conceptual/workflow.)*

## Jeff's re-framing (the heart of the call, ~14:47–42:00)

- **Who the users are:** career reviewers; "what they want is not best practice"; Word muscle-memory for decades — open review doc + appraisal, copy paragraphs, go narrative, done.
- **How they actually use Parachute today:** read the output like a primer, *then* read the whole appraisal anyway (they should — the tool zooms them in but doesn't replace the read), then produce their own report. Our flow "assumes everything is caught" and forces them to **validate Parachute** ("I feel like I'm having to validate a Parachute and then go make sure the AI is correct — it's creating friction").
- **The speed test:** side-by-side against a Word doc, "ready, set, go" — who finishes first? Even if the honest answer is Parachute, the **mental friction** loses us the user. The frustration precedent: the docx export where "deleting that row now screws up the entire form" / "I have to manipulate the column size every time."
- **The trust arc (why this matters now):** a year ago "not interested in AI" → 9 months "hallucinations unacceptable in a regulatory environment" → 6 months "we have to do something AI" → 4 months "holy —, this is good" → **today: it's all about the format/output ergonomics.** The AI battle is won; the Word battle is not.
- **Reviewer sociology:** the tool emboldens both the superficial reviewer *and* the "gotcha" reviewer; over-indexing (lazy "yep, all good") is a real risk → the **audit trail / prove-you-touched-it** requirement is non-negotiable, and *silence isn't evidence* — buttons clicked must be recorded.
- **The 80/20** (Cody's framing, Jeff's numbers): 80% = upload → workbook → quick inline pass (concur/concur/delete/edit) → done. 20% = deep customization, moving sections, colors, maybe working from the source-context view. Build for the 80%, keep the 20% reachable.
- **What already works:** the 5–6 page distillation (was 15 — "you're creating more work for me"), the redundancy cuts, the yellow/red severity marks, and the overall elegance ("way more elegant than a Word doc" — the compliment inside the complaint).

## The HubSpot reference (~42:18)

Cody screen-shared HubSpot's **email builder** (screenshots saved in `references/hubspot-builder -references/`): each section is highlightable → click into an **edit state** → inline text editing in place, add new sections, rearrange, duplicate, hide. Jeff's read: **yes to the center-canvas pattern**; explicit warning about the **left settings panel** ("select the box and you get the grid on the left… way too much") — controls must be **few, visible, and specific to the section type** (comp grid → add/delete row; prose → edit text). Ed's earlier line fits here: *"layering simplicity over complexity."*

---

## Wins ✅
- **Client trust is at an all-time high** — the argument has moved from "can we trust AI?" to "make the output faster to finish." Ed: "so elegant"; "you guys are fantastic designers."
- **Multi-review-type flow (F-117) demoed end-to-end without pushback** — confirm gate, parallel processing, per-type tabs, attestations, seal, return to YouConnect all landed.
- **Workbook format validated:** 5–6 pages, severity colors, TOC/cover — keep (D13).
- **Clear, named design pattern to build against** (HubSpot builder) + a visceral success metric ("fix this stuff in two minutes," crayons).
- **Commercial urgency is real and positive:** GA launch + a customer holding a contract for exactly this feature.

## Fails ❌
- **No sign-off.** The call meant to close GA instead reopened the core workflow. (Not a craft failure — a discovery failure: we built decide-then-regenerate; users want decide-in-place.)
- **The Findings-as-separate-surface model inverted.** Weeks of investment in the annotate-the-source decision flow (F-118, F-140–F-142) is now demoted to a 20% / evidence view. *The regenerate-not-live model (D5, Jun 30) is implicitly under pressure too — inline edits imply the document updates as you touch it.*
- **The customization rail read as complexity, not power** — "HubSpot, CRO kind of feel," don't show it in demos (the exact overwhelm Ed warned about on Jun 30: "when it feels like they are building something, they get overwhelmed" — we didn't carry that signal into the workbook stage).
- **"Findings vs. workbook" language confused the SME** (Jeff had to ask what the separation means) (D14).
- **Cody's phasing instinct (inline later) was rejected** — we're now committed to the hard thing on a compressed clock.

---

## Task List

> **Priority:** P1 = on the GA critical path / explicitly committed · P2 = required but sequenceable · P3 = deferred/explore.
> *Nothing here is built yet — this is the lay-out. The plan doc (below) is the deliverable Cody asked for.*

### Plan & process (P1 — this week)
| # | Task | By | Notes |
|---|------|-----|-------|
| P1a | **Draft the inline-workbook-editing plan** (HubSpot-style) and send to Cody. | Val | The explicit ask: "make a plan, send it to me." Comprehensive plan + broad-strokes summary for Cody. |
| P1b | **Down-and-dirty inline-editing prototype** for Jeff to *feel* — ugly is fine, speed is the point. | Val (+ Cody) | "Even if it's super ugly and doesn't even work altogether." This week. |
| P1c | **Async video updates** (Loom-style) to Jeff/Ed for fast feedback loops between calls. | Cody + Val | Replaces waiting for the next sync. |

### Workbook = workspace (P1)
| # | Task | Surface |
|---|------|---------|
| W1 | **Merge finding blocks into the workbook sections** with inline Concur / Edit / Reject / Delete per block; citations back to source pages on each block. | `WorkbookPreview` + workbook model |
| W2 | **Section-level inline tools** (hover/select → contextual actions): edit, delete/hide, add; **repeater tools** — add row / delete row / edit row on comp grids & tables. | `WorkbookPreview` sections/exhibits |
| W3 | **Inline WYSIWYG text editing** of prose blocks (reword a finding, edit the cap-rate sentence). No formatting toolbar. | Workbook editor |
| W4 | **User-created annotations/findings + inline comments** that surface in the workbook. | Findings model + workbook |
| W5 | **Audit-trail every inline action** (who/what/when, shown as "reviewer touched this"). | Audit model |
| W6 | **Demote the customization rail** to an advanced entry point; keep crayon-simple defaults in the primary flow. | `RunCustomize` / Builder |
| W7 | **"Save as my template"** — persist layout + structural edits as the user's default for future runs. | Templates / org store |
| W8 | **Language cleanup:** findings/workbook naming once merged (D14). | IA / copy |

### Keep / confirm (P2)
| # | Task | Notes |
|---|------|-------|
| K1 | Multiple export paths (PDF + docx) still offered post-inline-editing; confirm docx fidelity expectations. | D11 |
| K2 | Decide the fate of the source-context Findings view (20% evidence view vs. removed). | Feeds the plan's open question |
| K3 | Reconcile **regenerate-not-live (Jun 30 D5)** with inline editing — what still regenerates vs. edits live? | Model decision for the plan |

---

## Open questions / to confirm
1. **Does the source-annotated Findings view survive** as a drill-in/evidence view (the 20%), or fully retire? (Jeff: merge; Cody: "editing findings [in appraisal context] is cool… but that's for your 20%.")
2. **Live-update vs. regenerate** once decisions happen in the document itself — where does the Jun 30 "regenerate, not live" model still apply?
3. **How does an inline edit interact with sections/blocks structurally** (Cody's worry: "the moment you start doing your own inline edits, maybe it breaks those sections") — per-block editing presumably answers this, confirm in plan.
4. **Template save scope** — layout only, or including text/content edits? Org-level or user-level?
5. **docx export fidelity** — how much do we invest now that editing happens in-app?

## Cody's instructions to Val
- **"Let me kind of regroup with Val and create a plan — I'm trying to get this delivered ASAP."** → Draft the plan, send it to Cody.
- Prototype fast, ugly-is-fine; async videos to Jeff; **spike more hours this week** than next to get it done.
