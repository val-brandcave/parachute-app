# V2 (parked) — Annotated source & highlight-a-span → finding

**Status:** Archived, NOT in the v1 build. Recoverable.
**Parked:** 2026-07-15, on branch `feat/jul14-refinements`.
**Why:** Jul 14 (Ed) — the source appraisal is the **immutable read-only truth**; v1 shows it clean and lets you *verify* citations side-by-side (see T2 in `docs/plans/parachute-jul14-refinements-spec.md`). The richer surface below — annotating the source and creating findings from a highlighted span — Ed explicitly called a **fast follow, not a never**. Val: reference it for V2 and archive the code so it doesn't clutter the current build.

## What was parked
Two components, moved verbatim (git history preserved) to `app/src/components/run/_archive/`:

- **`RunExceptions.tsx`** — the Technical "Source" proofing view with the annotation layer: every finding's cited span highlighted inline (severity-toned `<mark>` + numbered badge), a synced findings rail (Concur/Edit/Reject/Delete + AI audit trail), a **Clean | Annotated** toggle, and **evidence-first authoring** (select text in the appraisal → floating "＋ Create finding here" → `AddFindingModal`, re-matched `citedSpan` highlight).
- **`RunAttestations.tsx`** — the Administrative twin: each checklist item's cited span highlighted, synced to a checklist accordion carrying the shared `AttestationDecisionBar`.

Both are excluded from the build via `tsconfig.json` (`exclude`) and `eslint.config.mjs` (`globalIgnores`). Nothing imports them.

## What replaced them in v1
`app/src/components/run/SourceDoc.tsx` — one clean, read-only viewer of the **same** `buildAppraisalDoc` document, rendered in the "Source" nav (full) and in the T2 side-by-side citation pane (with a live `focus` that scrolls to + highlights + pulses only the *currently cited* span). No annotation layer, no rail, no source editing.

## Data model kept for the revival
`app/src/data/appraisal-doc.ts` still carries per-run anchors — `DocRun.anchor` (finding id) and `DocRun.attAnchor` (checklist item id) — which v1's `SourceDoc` uses for citation scroll targeting. The full annotation layer + create-from-span build directly on these, so a V2 revival is not from scratch.

## Design reference
Val's screenshots of the annotated view + Clean|Annotated toggle (Jul 15). The removed UI matches those; restore the two components (+ re-wire them in `RunExperience.tsx` in place of / alongside `SourceDoc`) to bring it back.

## To revive
1. `git mv` both files back to `app/src/components/run/`.
2. Remove the `_archive` entries from `tsconfig.json` exclude + `eslint.config.mjs` ignores.
3. Re-wire in `RunExperience.tsx` (they take `focusFindingId` / `focusItemId` + `onFocusConsumed` + `onBack`). Reconcile with the v1 `SourceDoc` split-pane (likely: SourceDoc = the 80% verify pane; annotated view = the 20% deep surface).
