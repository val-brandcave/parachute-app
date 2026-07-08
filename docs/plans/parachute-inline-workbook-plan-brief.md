# Parachute — Inline Workbook Editing (Brief)

*One-pager for Cody · Jul 7, 2026 · Full plan: `parachute-inline-workbook-plan.md`*

## The shift in one line

**The workbook becomes the workspace.** Findings move *into* the document with their decision buttons; users edit the document directly, Word-style but un-breakable; the source appraisal becomes a read-only reference the workbook cites.

```
BEFORE:  Findings tab (decide) → regenerate → Workbook (read) → Customize rail → Sign
AFTER:   Workbook (decide + edit, live) ──cites──▶ Source (read-only)     → Sign
                └─ Customize ▸ hidden behind one button (the 20%)
```

## What Jeff/Ed actually asked for (Jul 7)

1. **Inline decisions in the doc** — Concur / Edit / Reject / Delete buttons on each finding, in the workbook itself. "The findings go away, the findings get merged into the workbook."
2. **HubSpot-builder editing, but restrained** — hover a section → few, visible, *section-specific* tools. Repeaters get add/delete row (his example: delete Comparable 5). Explicitly **no** formatting tools and **no** settings-grid panel.
3. **User-added findings + comments** — for what AI misses. Created **on the workbook** ("＋ Add finding": text, severity, optional citation — a first-class tagged block, not just a text edit; Ed: "we annotate in the output, not on the original appraisal"). Audit trail = three layers: **on-doc identifiers** (pips/tags like "Reviewer-added", "Edited by reviewer" — visible in-app *and* in the export), a **printed decision log** section, and a full **activity ledger** in-app. Regulator: "prove you touched this" → answered on the artifact itself.
4. **Hide the customization rail** — it read as "HubSpot, CRO kind of feel." Keep for the 20%, out of demos.
5. **Save my edits as a template** — never make the same manipulations twice.
6. **GA-blocking.** Phasing it later was rejected; a customer is holding a contract on this. Wants an ugly prototype to *feel* this week + async Looms.

## How we'll build it (key calls, made with Val)

- **Block-based, not markdown mode-flip.** The workbook stays structured sections/blocks; each block type gets its own inline tools (prose = click-to-edit text; tables = row controls; findings = decision bar). Can't break the doc, per-action audit, and it's what "tools specific to the sections" means. No editor framework needed for the prototype (contentEditable per block; Tiptap only if needed).
- **Direct edits are live.** The regenerate/dirty-callout loop leaves the primary flow; the compile "beat" stays only for system recompute (AI re-run, template apply).
- **Findings surface → "Source" tab — findings actionable in BOTH views** *(amended Jul 8, Cody)*: the same findings render as blocks in the workbook and as the rail on Source, with the same Concur/Edit/Reject/Delete everywhere — one store, so the views can't disagree. The appraisal *document* itself stays read-only; "create finding from a source span" is in scope. Finding Edit = the element flips into edit mode in place (HubSpot's click-to-edit canvas mechanic, without its side inspector panel). (Peek-drawer alternative noted for build time.)
- **Decision semantics unchanged** — Accept/Edit/Reject/Remove, comments, provenance (F-142) all reused; we move the controls, not the model.

## The week (prototype for Jeff — "ugly is fine, speed is the point")

1. Rail behind a `Customize` button (day one, kills the overwhelm instantly)
2. Finding blocks inline in the workbook, live decisions
3. Comp-grid repeater: add/delete row
4. Prose edit-in-place on a couple of narrative blocks + "edited by reviewer" pip
5. **Async Loom by ~Thu** narrating the 30-second review pass

Then: full block coverage → user-added findings/comments → Source conversion → save-as-template → admin/attestation doc gets the same pattern.

## Needs a client answer (can go in the Loom)

- Delete an AI finding = "excluded but audited" or truly gone?
- Do reviewer-added findings need a source citation to be defensible?
- Template shelf: per-user or org-wide?

## What we validated / keep

5–6 page workbook, severity yellow/reds, cover/TOC, multi-type run flow, confirm gate, sign/seal — untouched. This is a workspace change, not a rebuild.
