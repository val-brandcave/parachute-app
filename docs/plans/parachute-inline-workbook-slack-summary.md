Parachute — how the app reshapes (inline editing direction)

*Slack-paste version. Full detail: parachute-inline-workbook-plan.md · visuals: docs/mocks/inline-workbook-wireframes.html*

*The big idea*
One document, worked on directly. The workbook stops being a preview you regenerate and becomes the place where the whole review gets finished — read, decide, edit, sign, done.

*The Workbook (the main page)*
- Findings move into the document — each one sits in its section with Concur / Edit / Reject / Delete buttons right on it
- Hover any section → small floating toolset: edit, hide, duplicate, delete, drag to reorder
- Click any paragraph → edit the text in place, click away to save (no formatting toolbar, no modes)
- Tables and comp grids → add row, delete row, edit values — the table never breaks
- "+ Add" between sections → add a text section or add your own finding (things the AI missed)
- Every change lands instantly — no regenerate step, no dirty banner
- Small tags on anything touched: "Edited by reviewer", "Reviewer-added" — they carry into the exported file

*The customization rail*
- Gone from the default view — canvas is full-width and clean
- One quiet "Customize" button opens it as a panel: theme, fonts, density, section list
- "Save as template" — layout tweaks save once, every future run comes out that way

*The Source view (was Findings)*
- The appraisal with all its highlights stays — the document itself is never edited or disputed
- Findings appear here too, with the same buttons as in the workbook — concur, edit, reject, delete work from either place, always in sync (one shared state)
- Select any passage in the source → create a finding from it, citation pre-filled
- Citation chips on workbook findings ("p.47") deep-link straight into it

*The audit story*
- Visible tags on the document itself (in-app and in the export)
- A decision-log section printed inside the deliverable — concurred / edited / added / excluded
- A full activity feed in-app: every click, edit and deletion with timestamps and before/after
- Deleting something never erases it silently — it's recorded as excluded

*The admin/attestation doc*
- Same treatment, one step behind: checklist answers happen inline on the attestation document

*What doesn't change*
- Upload → confirm → processing → land on the workbook
- 5–6 page length, yellow/red severity, cover + TOC, sign & seal, multi-review tabs
- PDF and docx downloads stay

*Order of attack*
1. Hide the rail behind Customize + findings living in the workbook with live decisions
2. Comp-grid row add/delete + text edit-in-place
3. Add-your-own findings, comments, Source conversion, save-as-template
4. Attestation doc gets the same inline pattern
