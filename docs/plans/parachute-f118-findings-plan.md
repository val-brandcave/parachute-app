# F-118 — Findings actions, annotations, regenerate & two-type shell (Plan)

**Status:** planned (build not started). Branch: `review-feedback-1`.
**Source:** Jun 30 meeting (D5/D6/D8, F3/F4), feedback-log F-118, and the design decisions
locked with Val (MCQs). Grounded by three read-only research passes (routed-component reuse
map, client-POC extraction, data/store change map).

> Scope now = **Technical**. **Administrative** is planned into the same chassis but built
> later. **Citations/proof-points (F3)** are blocked on Ed's raw 5-stage output + anonymized PDF.

---

## 1. Locked decisions

- **Action model (Technical).** Primary (inline on the decision bar): **Accept · Edit · Reject**.
  Behind the `⋯` more menu: **Remove**, **Comment**, **Condition**, **Flag**. Every non-Accept
  decision captures a **reason** (free text or a **response template**) → feeds the audit trail.
  Mapping from today: Agree→**Accept** (`accepted`), Override→**Edit** (`override`), Reject→
  **Reject** (`rejected`), **Remove**=new (`removed`, hide from workbook), + `comment`/`condition`/
  `flagged` attributes. *(Semantics are our call pre-demo; reconfirm with Cody after.)*
  - **Accept** — AI is right; keep as written.
  - **Edit** — valid but my wording ("not this problem, but it is *this* problem"); stays, reviewer text.
  - **Reject** — real defect → returns to the appraiser (send-back letter).
  - **Remove** — not a concern; dropped from the workbook entirely (still logged for audit).
- **Annotations.** **Highlight + inline number badge** riding on the highlighted span — **no
  separate right-margin tag column** for vector PDFs. Highlights calm by default; the **selected**
  one goes full-strength + ring. The margin marker becomes the **scanned/OCR-PDF fallback** only.
  Make them bigger than today (D8/F4).
- **Regenerate, not live (D5).** The workbook reflects finding edits only after an explicit
  **Regenerate**. The Findings footer button becomes **"Regenerate workbook"** when there are
  changes since the last compile (else "Back to workbook"); the Workbook shows a **dirty callout
  banner** ("Findings changed — regenerate to update") when out of sync.
- **Two review types.** When both Technical + Administrative are ordered, the review header carries
  **two underline tabs**; each type owns its **Workbook/Findings (or Attestation/Preview) + sign**.
  No tabs when only one type is selected.
- **Sign model.** **Per-type independent sign** (two separate outputs), any order; a run-level
  status ("Technical ✓ · Administrative ○"); **Return/Finish gated until all selected types are signed.**
- **Admin doc cover upgrade** — deferred to when the Admin run-flow tab is built (reuse the new
  full-bleed cover + separate contents then).

---

## 2. Architecture — extract a shared decision core (don't duplicate)

The routed review (`FindingFocus`) already has the rich model; the run flow (`RunExceptions`)
has only 3 bare buttons. **Unify** by extracting the decision logic so both share it — the run
flow gets the SAME richness (reasons, templates, audit trail), just in the accordion layout
(the difference is spatial, not fewer actions).

- **`molecules/FindingDecisionBar`** (new) — the Accept·Edit·Reject inline bar + `⋯` overflow
  (Remove/Comment/Condition/Flag) + status chip + keyboard (a/e/r + overflow). Owns the
  **`ResponseComposer`** overlay (which stays **reuse-as-is**, with `ResponseTemplatePicker`).
  Props: `finding, state, responseTemplates, onDisposition(disp,reason,templateId),
  onToggleFlag, onToggleCondition, onComment, variant`.
  - **Route** `FindingFocus` → drops its footer, uses the bar.
  - **Run** `RunExceptions` accordion body → uses the same bar (full actions, not "compact").
- **`molecules/AttestationDecisionBar`** (new, later) — Yes/No/N-A + Confirm + reason-when-diverging
  + keyboard (y/n/x/c). Route `AttestationFocus` refactors onto it; the future run-flow Admin
  surface reuses it.
- **Reuse as-is:** `ResponseComposer`, `ResponseTemplatePicker`, `FindingList`, `AttestationList`,
  `CoveragePanel`, `AttestCoverage`, `ReviewChrome`.
- **Rebuild run-flow-specific (layout only):** the 3-pane `TechnicalWorkspace`/`AdministrativeWorkspace`
  toolbars aren't reused — the run flow is PDF-hero + accordion.

---

## 3. Findings accordion — expanded anatomy (scales with sub-titles + dividers)

```
▸ [n] Category   ◆ severity   ▮ 82%   ● disposition-dot            (collapsed row)
── expanded ──────────────────────────────────────────────
  FINDING                                                          (sub-title)
  «question»  +  AI analysis prose
  ── hairline ──
  EVIDENCE                                             p.61 ↗      (sub-title + cite)
  “quoted span…”
  ── hairline ──
  ◈ AI AUDIT TRAIL                                                 (sub-title, AI glyph)
  [CORRECTED] auditText…   (multi-stage S1→S2→S3 reasoning; later: citations F3)
  ── hairline ──
  YOUR DECISION                                                    (sub-title)
  reason / edited text (Edit·Reject·Remove) · template used · your comment
  ── decision bar (sticky at accordion foot) ──
  [Accept] [Edit] [Reject]   ⋯ Remove · Comment · Condition · Flag   → status tag
```

Selected finding ↔ its highlight stay synced (click either). Admin's accordion mirrors this,
swapping YOUR DECISION for the Yes/No/N-A + reason bar.

---

## 4. Data / store change list (grounded)

**(A) `removed` disposition** — hide from workbook, keep for audit:
- `types` `Disposition` union: add `"removed"`.
- `workspace.store` `tally()`: count `removed`.
- `lib/workbook`: `DISP_TAG.removed` (neutral tone); `dispositionLine("removed")` → empty;
  `actionItems()` excludes removed.
- `WorkbookPreview`: findings-body filter excludes `removed`; not in conditions/returns; a
  `removed[]` set exists for an optional "excluded (audit)" note only.
- Decision bar: Remove toggles `removed`↔`pending` ("Remove from workbook"/"Restore").

**(B) Dirty / regenerate:**
- `workspace.store`: add `workbookDirty: boolean` + `compiledAt: number|null`; `setDisposition`/
  `setComment`/`toggleCondition`/`toggleFlag` set `workbookDirty=true` (once `compiledAt` set);
  `ensureWorkbook` stamps `compiledAt`; add `clearDirty()` / a `regenerate()` that re-stamps.
- `RunWorkbook`: footer primary reads **"Regenerate workbook"** (icon `refresh`) when dirty, else
  the normal back/review action; add dirty **callout banner** atop the workbook stage.
- `RunModal`: `onRegenerate` handler (clearDirty + re-derive config snapshot).

**(C) Two-type tabs + per-type sign:**
- `run.store`: add `signedTypes: RunReviewType[]` (+ `signType`/`unsignType`); reset on
  `setReviewTypes`. Add `activeType` (or keep local in RunModal).
- `RunModal`: when `reviewTypes.length > 1`, render the **`Tabs`** molecule (sliding-pill, no
  icons) for Technical|Administrative above the per-type rail+body; render only the active type's
  views. `finishReturn`/Return gated on `signedTypes.length === reviewTypes.length`.
- `RunWorkbook`/`RunExceptions`: accept a `reviewType` prop (scope only; logic unchanged).
- **Future Admin:** `RunAttestations` (accordion, analog of RunExceptions) + `RunAttestationPreview`
  (analog of RunWorkbook, reusing the new cover); wired to `admin.store`.

---

## 5. Annotations implementation (RunExceptions)

- Drop the right-margin numbered tag column for vector PDFs; render the **number badge inline at
  the leading edge of the `mark` highlight** (superscript chip). Enlarge highlight + badge.
- Default: all highlights a calm severity tint; **selected** highlight → full-strength + ring
  (the "reveal on select" feel without hiding the others). Keep the measured-offset margin layer
  only behind a `scanned` flag (future) for rasterized PDFs.

---

## 6. Reinterpret-from-client-POC notes (adopt, don't clone)

Worth pulling in (client showed, we're light on): **multi-stage AI audit reasoning** per finding
(S1→S2→S3, CONFIRMED/CORRECTED/FLAGGED) — surface the chain, not just the tag; **reviewer-added
finding attribution** ("Added by you"); **response-template merge-field** quick-insert in the
composer; admin **"needs attention"** auto-flag for AI/policy divergence; **coverage / anti-miss**
panel (optional); **Return-to-appraiser** auto-draft from conditions/action items (later). Skip
cloning their layout/toolbars.

---

## 7. Build order

1. **Extract `FindingDecisionBar`** + refactor `FindingFocus` onto it (no behavior change) — safe base.
2. **Enrich `RunExceptions`**: accordion anatomy (§3) + `FindingDecisionBar` (Accept/Edit/Reject +
   ⋯) + reasons/templates + AI audit trail.
3. **`removed` disposition** (§4A) end-to-end.
4. **Regenerate/dirty** (§4B): footer button + workbook callout.
5. **Annotations** (§5): inline-number highlights, enlarged.
6. **Two-type shell** (§4C): tabs + per-type sign + gated return (Technical live; Admin stubbed).
7. *(Later)* Admin run-flow tab (`RunAttestations` + upgraded `RunAttestationPreview`), `AttestationDecisionBar`.
8. *(Blocked on Ed)* Citations/proof-points (F3) in the AI-audit-trail zone.

---

## 8. Open items
- **Confirm Accept/Edit/Reject/Remove semantics with Cody** post-demo (we chose the mapping).
- **Ed owes**: raw 5-stage output + anonymized example PDF → unblocks F3 citations.
