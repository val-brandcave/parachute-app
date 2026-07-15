# Parachute — Jul 14 Refinements Implementation Spec

**Branch:** `feat/jul14-refinements`
**Source of truth:** `docs/meetings/processed-calls/parachute-jul-14-2026-processed.md` (T1–T5)
**Decisions artifact:** citation/admin patterns https://claude.ai/code/artifact/a1eb5a0b-b9b2-47ab-bea4-12559e25ac2f · T2 layout mock https://claude.ai/code/artifact/3452f1c3-11cb-444e-bda6-78204df4f300
**Status:** Ed signed off the inline-workbook direction on Jul 14; these are the five bounded refinements. This doc is also the informal handoff reference for Diego (Realwired).

## Locked decisions (Val, Jul 15)
- **T1 title** → "Review setup"
- **T2 layout** → **Option A: split column** (workbook left, source right column on wide; overlay fallback below ~1200px). Paragraph-anchored scroll + persistent highlight + one-time pulse (pulse gated by `prefers-reduced-motion`).
- **T3** → keep **Source** nav item as a clean read-only viewer; remove the annotated view + Clean|Annotated toggle + findings/checklist rail; archive the annotated-findings surface to `future/v2/` + a `docs/V2-source-annotation.md` note.
- **T5** → **single "Confirm & sign attestation"** (no separate confirm-all button). Rows pre-filled "AI suggested"; on sign, untouched → "Attested (as AI-suggested)", changed rows already "You changed + reason". Signature is the audited human-touch act.

---

## T1 — Run-setup screen (`components/run/RunConfirm.tsx`)
The run wizard is `/reviews/[id]` (`app/(shell)/reviews/[id]/page.tsx` → portal → `RunExperience` → `RunConfirm` when `spoke==="confirm"`).

1. **Advanced disclosure.** The two setup blocks — `Technical review setup` (RunConfirm.tsx ~:320) and `Administrative review setup` (~:336), each an inline `.run-cf-card` wrapping one `InheritedTemplateField` — wrap both in a single collapsed **`Advanced ⌄`** disclosure placed under the Property details card. Collapsed by default; expanding reveals both blocks. New `.run-cf-adv*` CSS.
2. **Remove "coming soon" types.** Delete `evaluation` and `vendor_short` entries from the `REVIEW_TYPES` array (~:58). (Registry pattern for future types stays; the two `status:"soon"` cards disappear.)
3. **Sticky footer.** `.run-cf-foot` (~:366) is currently a flex child inside the scroll container `.run-cf`. Move it out of the scrolling `.run-cf-inner` so it pins to the bottom of the surface (full-width bar, `position: sticky; bottom: 0` on a footer that is a sibling of the scroll area, or restructure the confirm branch so footer sits between `.run-stage` and `.run-cf`). CTA "Start review" + ghost "Cancel" unchanged.
4. **Title** (~:208) → "Review setup" (both `yc` and non-yc branches; keep the property-address subline logic).

## T2 — Clickable citations → split-column source
- **Chips:** `WorkbookInline.tsx:172` (`.wb-fmeta-cite` → `onOpenCite(f.id)`) and `AttestationDocInline.tsx:139` (`.attdoc-citebtn` → `onOpenSource(r.itemId)`).
- **Anchor model (already exists):** `data/appraisal-doc.ts` — `DocRun.anchor` (finding id) / `attAnchor` (item id) mark the exact cited run; `docPageIndex()` maps anchor→rendered page; scroll target `#anno-{id}` / `#att-anno-{id}`. Reconcile the chip's report page label (e.g. p.47) with the viewer's rendered page via the anchor.
- **New component `SourceDoc`** (read-only, no rail, no annotation toggle): renders `buildAppraisalDoc` pages via the existing `renderRun` logic, minus annotation badges/tones. Accepts a live `focus` prop `{kind:'finding'|'item', id}` → scrolls the anchored run into view, applies a **persistent `.src-focus` highlight** on that run + a **one-time `.src-pulse`** (reduced-motion → static highlight only). Reused by both the split pane and the Source nav (T3).
- **Split pane wiring:** redirect `onOpenCite`/`onOpenSource` (currently spoke swaps at `RunExperience.tsx:626` and `:704`) to open a persistent right-column `SourceDoc` beside the workbook/attestation doc, passing the live focus. Layout: `.run-body` becomes a 2-col flex when the pane is open (`flex: 0 0 44%` source on wide; below ~1200px the pane is `position:absolute` overlay with `transform` slide-in + light scrim). Close button clears the pane. Clicking another citation re-focuses (live prop change, pane stays mounted).

## T3 — Source read-only (`RunExceptions.tsx`, `RunAttestations.tsx`)
- Remove the `Clean|Annotated` `SegmentedControl` (RunExceptions ~:572 / RunAttestations ~:374), the `showAnnotations` state, per-run annotation highlighting in `renderRun`, and the `{showAnnotations && …}` findings/checklist rail (RunExceptions ~:673 / RunAttestations ~:442).
- The **Source nav** now renders the clean `SourceDoc` (same component as the T2 pane, no `focus`, full width).
- **Archive** the annotated-findings decision surface (the rail + annotation drawing + reviewer-finding create-from-span) to `future/v2/source-annotation/` (excluded from build/imports) + `docs/V2-source-annotation.md` noting what it was, why parked (Ed: highlight-span→finding is a *fast follow*), and linking Val's screenshots. Preserve `DocRun.anchor`/`attAnchor` in the data model (still used by T2 for scroll targeting).

## T4 — Attestation doc immutable (`AttestationDocInline.tsx` / `RunAttestationPreview.tsx`)
- Already built: no add-item, no reorder on the attestation doc. **Regression guard only** — ensure the T5 rework introduces no structural-edit affordance. Checklist changes remain via Configure → Compliance checklists edit + re-publish. No new UI.

## T5 — Admin accept-by-default + remove banner (`RunAttestationPreview.tsx`, `store/admin.store.ts`)
Existing (keep): 3-way Yes/No/N-A control, one-click-attest-on-AI-answer (`choose()` in `AttestationDocInline.tsx:74`), required divergence reason, activity ledger.
1. **Remove the header banner** — the `run-callout` block at `RunAttestationPreview.tsx:307–345` (the "N items still need your answer… attest them in one click / Review them" callout) and its supporting `routineCount`/`goNextPending`/`calloutDismissed` wiring. Optionally replace with a one-line helper ("Everything's pre-filled. Change what you disagree with, then sign."), not a review instruction.
2. **Accept-by-default rows.** Rows load pre-filled with `aiAnswer`, labeled **"AI suggested"**. No per-row pending gate blocking sign. (Keep the 3-way + reason-on-divergence for changes.)
3. **Provenance labels** (derive from state): unconfirmed → **"AI suggested"** (petrol); after sign & untouched → **"Attested"** (success/neutral) with audit note "attested as AI-suggested at signing"; changed → **"You changed"** (navy) + reason. Small chip near the answer cell.
4. **Single Confirm & sign.** Footer primary CTA "Confirm & sign attestation" (always available). The sign modal (`RunSignModal`) shows a summary: "You're attesting N items — M as AI suggested, K changed by you." On sign: `signAttestation` also marks all untouched rows attested-as-AI; ledger gets one "Signed & sealed — M attested as suggested, K changed" entry (individual change entries already logged on change). Remove the `attPending>0` sign-block gate (nothing is "pending" under accept-by-default) and the `.run-foot-gate` "Sign X to finish" only where it referred to admin pending.
5. **"Review closely" flag:** keep as a subtle per-row hint (AI low-confidence, `attNeedsAttention`) but it no longer blocks anything. (Drop entirely if Ed prefers — he thinks admin is robust.)

---

## Build order
1. T3 first (extract clean `SourceDoc`; remove annotations) — unblocks T2's reuse.
2. T2 (split pane + focus/pulse) on top of `SourceDoc`.
3. T5 (banner removal + accept-by-default + confirm&sign + provenance).
4. T1 (advanced disclosure, remove soon-cards, sticky footer, title).
5. T4 guard + verification.

## Round 2 refinements (Jul 15, from Val's screenshot review — all built + verified)
- **R1 Advanced setup** → not a card; a petrol **tertiary text toggle** (`.run-cf-advbtn`, "Advanced setup ⌄" / "Hide advanced setup") that reveals the two setup cards beneath. **Setup footer** actions right-aligned to full width (`.run-cf-footbar-inner` — matches the run footers). **Source pane** defaults to **75%** zoom.
- **R2** removed the technical workbook "N items need a closer look" banner (parity with the admin banner).
- **R3 Stage-only source split** (the key architectural fix): the source pane moved OUT of a full-height column and now **docks in `.run-wb-main` beside the stage** inside RunWorkbook / RunAttestationPreview — the SAME right slot as Activity/Customize, so they're **mutually exclusive** and the run **toolbar + footer stay full-width** (fixes footer-width, toolbar overlap, toolbar shrinkage, panel conflict at once). The `.run-split` wrapper in RunExperience is gone; each component owns its `citeFocus` state.
- **R4 Auto-linkify citations** — `components/review/CitationText.tsx` (+ `SourcePaneContext`) linkifies every "p.N" in workbook/attestation prose (grid captions, exhibit notes, cross-refs) → clickable; maps report page → rendered page via `renderedPageForReportPage()` in appraisal-doc.ts and opens the pane at that page (page-kind `SourceFocus`, scroll + flash). Finding chips keep their span-anchored highlight. Verified live: "p.47" → source pane at rendered p.4 (full grid).
- **Verified in-app (:3000):** stage-split layout, source dock, 75% zoom, mutual exclusion with Activity, inline "p.47"/"p.61" citations, admin confirm & sign. **Caveat:** the footer-right-align CSS is correct in source but the running dev server showed stale CSS ([[dev-server-stale-css]]) — needs `rm -rf .next` + restart to render; all behavior confirmed.

## Round 3 micro-polish (Jul 15)
- Removed the workbook toolbar's **"More actions" (⋯) overflow + "Save as template"** entirely (RunWorkbook — menu, `savedTemplate` state, `saveTemplate`, `saveLayoutFromWorkbook`/`layouts` wiring, ActionMenu import).
- **AI ConfidenceMeter restored** in the workbook finding meta row (WorkbookInline) for AI findings — same row as severity + citation (reviewer-added findings keep "Added by X").
- Removed the redundant **"workbook layout & checklist"** hint on the Advanced setup toggle.

## Verify
- `tsc --noEmit` + eslint clean.
- Run app: start a review → Review setup (advanced collapsed, sticky footer, no coming-soon) → workbook → click citation → split source pane focuses+pulses → Source nav shows clean read-only doc → admin: no banner, rows "AI suggested", change one (reason), Confirm & sign → summary → rows "Attested"/"You changed".
- Watch OneDrive stale-CSS after globals.css edits (kill dev server + `rm -rf .next` + restart — see memory `dev-server-stale-css`).
