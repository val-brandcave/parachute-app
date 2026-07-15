# Plan — Queue rows open the Run wizard as the review details page

**Date:** 2026-07-14
**Status:** BUILT + verified (tsc/eslint clean; all spokes driven in-browser, no console errors).
Deferred: physical deletion of the now-unreferenced old detail components
(`ReviewContextBar`, `TechnicalWorkspace`, old `Workbook`, `Builder`,
`AdministrativeWorkspace`, `AttestationPreview`, `ReviewChrome`) — left as dead code
this pass since several `components/review/*` siblings are shared with the run flow;
remove in a focused follow-up after confirming each is unreferenced.

## Goal

Retire the two old surfaces the reviews queue still points at — the old
`/reviews/[id]` details page (`ReviewContextBar` + `TechnicalWorkspace`/`Workbook`/
`Builder`/`AdministrativeWorkspace`/`AttestationPreview`) and the old `OrderModal`
intake stepper — and make the **Run wizard** (`RunModal` /
`useRunStore`, spokes `confirm → progress → workbook/exceptions` + the Admin twin)
the single review surface for every queue row. The wizard becomes URL-addressable at
`/reviews/[id]` (deep-linkable, survives refresh/back).

## Confirmed decisions (from Val, 2026-07-14)

1. **The wizard replaces the `/reviews/[id]` route.** Deep-linkable, survives refresh
   and back. The old details page is retired.
2. **Queue intake = YouConnect-new only.** A manually-uploaded report never sits in
   the queue as an intake row: manual uploads enter through the dashboard IntakeWidget
   and only appear in the queue once they are processing/processed (running, in_review,
   completed). So the queue's only pre-pipeline state is `intake` + `source: "yc"`
   ("New from YouConnect").
3. **Completed rows get full read + download** (the whole signed workbook, read-only,
   with a Download affordance).
4. **Route on Start, not on entry.** The transient **confirm gate** (drop / dashboard-YC
   pick, pre-Start) stays a store-driven **overlay** with no URL — closing there discards
   the upload, nothing is persisted. The moment **"Start review"** is clicked the review
   becomes a real, running member of the queue, so at that point we **create the review
   (`running`) and `router.push('/reviews/[id]')`** — from `progress` onward it's the
   routed full-page wizard, identical to opening any processing/processed review from the
   queue. Closing then lands in the queue where it now lives.
5. **One carve-out — the embedded YouConnect SSO session** (`/launch`, `session mode =
   embedded`) has **no queue** to belong to: shell hidden, closing returns to YouConnect.
   That session stays a **pure overlay end-to-end** and never routes. (The dashboard
   "From YouConnect" picker is standalone/full mode and DOES route on Start.)

## Current state (as traced)

Two flows that never meet:

- **New wizard** (`RunModal`, mounted globally in `AppShell`, `.run` fixed full-page
  takeover, store-driven via `useRunStore.open`) — reachable ONLY from the dashboard
  `IntakeWidget` (drop / from-YouConnect) and the YouConnect embedded handoff. It keys
  off `DEMO_RUN_REVIEW_ID` and overlays the picked property's identity (`RunDisplay`)
  onto the demo review; **findings stay mock content**.
- **Queue** (`ReviewTable` → `reviewHref`) routes every row click + the `⋯` menu to the
  OLD `/reviews/[id]` page (or `/reviews/[id]/triage` for auto-rejected), and the intake
  **"Run"** primary opens the OLD `OrderModal` stepper via `useOrderStore.openOrder`.

**Data-layer reality:** only `review-001` has seeded findings/exhibits (7 findings).
Every other review currently loads an empty workspace. Attestations are likewise seeded
for the demo review only.

## Row-type → target mapping

| Row type (status) | What it is | Target |
|---|---|---|
| **New — from YouConnect** (`intake`, `yc`) | Delivery landed, not yet run | Wizard at **`confirm`** spoke (review-config gate) |
| **Running** (`running`) | Mid-pipeline S1–S5 | Wizard at **`progress`** (live pipeline; auto-advances to workbook) |
| **Ready** (`in_review`) | Pipeline done, needs decisions + sign | Wizard at **`workbook`** (Technical) / **`attestation`** (Admin) |
| **Completed** (`completed`) | Signed & sealed | Wizard at **`workbook`**, read-only FINAL + Download |
| **Auto-rejected** (`autorejected`) | Failed an intake compliance check | **Triage** as the wizard's pre-`confirm` gate (recommended — see §Triage) |
| **Returned** (`returned`, dormant) | With appraiser | Leave dormant pending client Q1 |

`intake` + `source: "manual"` is **removed** from the queue per decision #2.

## Architecture

### 1. Make the run experience a route (`/reviews/[id]`)

- Extract the guts of `RunModal` (everything inside the `open` gate: the head bar,
  spoke stages, sign modal, admin twin) into a reusable **`RunExperience`** component
  that takes `reviewId` + an initial spoke and renders the takeover chrome. `.run` is
  `position: fixed` full-viewport, so it looks identical whether mounted as an overlay
  or a route page (it covers the shell chrome underneath either way).
- `RunModal` (the global overlay) keeps its `AnimatePresence`/`open`-gating wrapper and
  renders `<RunExperience>` inside — used ONLY for the transient **confirm gate** of a
  fresh drop / dashboard-YC pick, and for the **embedded YC SSO session** end-to-end.
- **`/reviews/[id]/page.tsx`** is rewritten to render `<RunExperience reviewId={id}>`
  directly (no overlay). On mount it initializes the run store for that review and
  derives the **starting spoke from the review's status** (see §2). Close X → `router`
  back to `/reviews`.
- **Route on Start (standalone/full mode):** the confirm gate's `onStart` (drop +
  dashboard-YC) creates the review via `useReviewsStore.addReview` (status `running`)
  and `router.push('/reviews/[newId]')`, which mounts the routed wizard at `progress`.
  The overlay closes as the route takes over. **Today `startReview` does NOT persist a
  review** (it animates over the demo review) — adding the create+route is part of this
  work. The **embedded YC SSO session** skips this: it never routes, staying on the
  overlay and returning to YouConnect on close.
- The old details components (`ReviewContextBar`, `TechnicalWorkspace`, `Workbook`,
  `Builder`, `AdministrativeWorkspace`, `AttestationPreview`, `ReviewChrome`) are retired
  once nothing imports them. (Confirm no other route uses them before deleting — the org
  workbook-layout authoring lives in Templates → Workbook Layout, not here.)

### 2. Starting spoke derived from status

A small pure helper (`lib/review-lifecycle.ts`), consumed by the page + the queue's
router push:

```
runEntry(review): { spoke: RunSpoke; readOnly: boolean; triage: boolean }
  intake (yc)   → { spoke: "confirm" }
  running       → { spoke: "progress" }
  in_review     → { spoke: "workbook" }   // admin-only → attestation
  completed     → { spoke: "workbook", readOnly: true }
  autorejected  → { triage: true }        // pre-confirm gate
```

### 3. Real per-review content (prototype approach)

Consistent with the prototype-not-production rule and what the wizard already does:
**reuse the demo review's findings/exhibits/attestations as mock content, overlay each
row's real identity** (address / firm / bank / loan# / property type / review types /
reviewer). No new seed authoring. The workspace/admin stores fall back to the demo
content when a review has none of its own; the header, workbook cover, and sign block
read the real review's identity + `reviewTypes`.

- `RunExperience` overlays identity from the real `Review` (the `display` overlay the
  wizard already applies, but sourced from the review record instead of `RunDisplay`).
- `reviewTypes` come from the real review (drives the one-vs-two-type tab shell).
- Completed reviews render **already signed / FINAL, read-only**: dispositions locked,
  the sign block shows the seal instead of the CTA, Download enabled.

### 4. Queue rewiring (`ReviewTable` / `review-lifecycle`)

- `reviewHref(r)` → always `/reviews/${r.id}` (drop the triage special-case; triage is a
  spoke of the same route now).
- `nextActionView`: the `intake` case's **"Run"** stops calling `useOrderStore.openOrder`
  and instead routes to `/reviews/${r.id}` (lands on `confirm`). `kind: "order"` is
  removed; all rows become `kind: "route"` (or `download` for completed if we keep a
  distinct download affordance — see MCQ). The `NextAction` component drops its
  `openOrder` branch.
- Auto-rejected **"Triage"** routes to `/reviews/${r.id}` (lands on the triage gate).
- Completed **"Download"** routes to `/reviews/${r.id}` (read-only workbook with the
  Download control) — or keeps a direct download menu (MCQ).
- `RowMenu` "Review" / "Download documents" all point at `/reviews/${r.id}`.

### 5. Triage (auto-rejected) — see §Triage

### 6. Seed cleanup

- Remove/convert any `intake` + `source: "manual"` rows from `reviews.seed.ts` (decision
  #2). Keep manual-source rows only in processed states (running/in_review/completed).
- Verify the auto-rejected demo row still opens the triage gate correctly.

### 7. Retire the old `OrderModal` (DECIDED — delete it)

The queue CTA (`OrderButton`) already routes to `/launchpad` (drop/YC) and bypasses the
stepper. The stepper modal is abandoned, so it is **deleted** this pass. Two stragglers
still open it — rewire them to the new flow:

- **`CommandPalette`** "Order a review" action: `go(openOrder)` → `go(() =>
  router.push("/launchpad"))`. Drop the `useOrderStore`/`openOrder` import.
- **`dashboard-widgets` → `NewFromYouConnect`**: each delivery's "Confirm & run"
  (`openOrder({ step: confirm, prefill })`) → `router.push('/reviews/${r.id}')` (these
  rows are `intake`/`yc`, so they land on the confirm gate like queue rows).
- **`ReviewTable`** intake "Run": already being rewired (§4).

Then delete `OrderModal.tsx`, remove its mount in `AppShell`, and its export from
`components/organisms/index.ts`. **Keep** `order.store`'s `deliveries` / `loadDeliveries`
slice — the live `IntakeWidget` depends on it; trim only the stepper-flow state/actions
(`open`, `step`, `openOrder`, `draft`, `chooseSource`, `parseUpload`, `ORDER_STEP`, …) or
leave them dead if trimming ripples too far. (Renaming the store to `deliveries.store` is
optional cleanup, deferred to avoid import churn.)

## Triage

The current `/reviews/[id]/triage` page is old-design debt: hardcoded `maxWidth: 820`,
old `.page`/`.card`/`.btn btn-filled`/`.chip chip-blocked` classes, hardcoded copy —
predates the design system (violates the no-hardcoded-widths rule + token/`ui-*`
conventions). It must be rebuilt regardless.

**Recommended:** fold triage into the wizard as a **pre-`confirm` gate** on the same
`/reviews/[id]` route. Auto-rejected opens the wizard to a triage stage (failed-criterion
card + Confirm-rejection / Override-and-admit, reason required on override). Overriding
flows straight into `confirm → progress`; confirming returns to the queue. One route, one
mental model, and the override naturally continues into the run.

- Add a `"triage"` spoke to `RunSpoke` (before `confirm`), rebuilt in the design system
  (`.run` chrome, tokens, `ui-*`, `Field`, real `Button`s).
- `/reviews/[id]/triage/page.tsx` is retired (redirect to `/reviews/[id]` or delete).

## Out of scope / flags

- **Per-review Builder authoring is lost.** The old details page had a dedicated
  **Builder** sub-view (per-review layout authoring). The wizard has only **Customize**
  (edit mode on the workbook). This is consistent with the inline-workbook direction
  (block editing, findings merged in) but should be confirmed — flag to Realwired if
  per-review layout authoring is expected.
- **No real per-review findings** — mock content is reused (prototype rule). Real
  content is an engineering-team concern at hand-off.
- `returned`/`sent_back` stays dormant pending client Q1.

## Verify before done

- `npx tsc --noEmit` + `npx eslint src --ext .ts,.tsx` clean.
- Every queue row opens `/reviews/[id]` at the correct spoke; refresh/back work.
- Auto-rejected → triage gate; override → confirm → progress; confirm → queue.
- Completed → read-only FINAL workbook + working Download.
- Dashboard drop + YouConnect embedded handoff still open the overlay and run end-to-end.
- No dead imports of the retired detail components.
