# Parachute v2 — Templates Library: Build Plan

> Status: approved Jun 19 2026. Branch: `feature/templates`. Companion to `parachute-v2-early-specs.md` §6, `parachute-v2-ia-route-map.md` §3/§6, `parachute-v2-ia-map.md` decision #7, and `app/AGENTS.md`.

## Context

`/templates` is currently a `Stub`. The IA, the Jun-10 client call, and the client HTML mock all converge on Templates being a **top-level library hub** of reusable, AI-configurable artifacts that drive the review pipeline and its output. This branch builds that hub for real, end-to-end (data → store → routes → screens), while establishing a small set of reusable UI surfaces so the app stays consistent ("not a frankenstein monster").

**Goal of this branch:** a working Templates hub with two fully-built tools (Compliance Checklist mapper, Response Templates) plus a lightweight entry for Org Workbook Layout, all built from a shared pattern contract and a new reusable bottom-sheet drawer.

### Decisions locked (with the user, Jun 19 2026)
1. **Library scope:** 3 canonical types only — **Compliance Checklist**, **Response Templates**, **Org Workbook Layout**. Hub built as an extensible "template kind" registry so Bank Policy / letters can be added later without rework.
2. **Ownership scope:** Personal + Org only on **Response Templates** (`scope: 'org' | 'mine'`). Checklist and Workbook Layout are **org-only**.
3. **Build scope:** Checklist + Responses built fully. Org Workbook Layout = light hub entry that deep-links into the existing Builder org-mode (full 3-pane builder stays deferred per IA decision #6).
4. **Surface taxonomy (the key architecture decision):** see below.

## Surface taxonomy — the reusable rule

**Route for _places_, drawer for _focused tasks on a place_, wizard for _linear commits_.**

| Surface | Type | Rationale |
|---|---|---|
| Templates hub `/templates` | **Routed page** (card grid) | Navigable destination |
| Response Templates `/templates/responses` | **Routed page**, in-page master/detail. **Create == Edit** (a "New template" selection focuses a blank detail pane) | Browse/compare/edit fluidly; editor needs width for body + merge chips + live preview. No drawer, no separate create route. |
| Checklist Mapper `/templates/checklist/[id]` | **Routed page** (item list + sticky "Template health" rail) | Heavy, repeated, deep-linkable (Settings → Compliance "Manage" links here) |
| Checklist single-item edit / "Add item" | **BottomSheet drawer** | Focused sub-task; dims the list instead of shoving it (replaces the mock's inline expander) |
| New checklist from `.docx` (upload → AI-extract → review → publish) | **StepperModal wizard** → routes into the mapper on finish | Linear multi-step commit |
| Org Workbook Layout `/templates/workbook-layout` | **Routed**, light → deep-links to Builder org-mode | Heavy builder deferred |
| Preview | **Inline** when it's a live byproduct (response live-preview); **BottomSheet drawer** only for on-demand "render / apply to sample finding" | Avoids a route for something ephemeral |

This rule is app-wide, not Templates-only — it governs future features too.

## Reusable pattern contract (reuse, do not reinvent)

All Templates screens MUST compose these existing primitives (per `app/AGENTS.md`):
- **Header:** `templates/PageHeader.tsx` (`eyebrow`/`title`/`sub`/`actions`). One **navy** primary CTA per surface; everything else secondary/`outline`/`ActionMenu`. Petrol is accent only.
- **Tabs:** `molecules/Tabs.tsx` (sliding `layoutId` pill) — used for the Response org/personal partition (or `SegmentedControl` for the 2-way org/mine toggle, matching the mock).
- **List/table:** replicate the `organisms/review-columns.ts` + `ReviewTable` column-def + grid + sortable-header + column-config pattern in a new `template-columns.ts` if a sortable table view is needed; do NOT extend `ReviewTable`.
- **Overflow actions:** `molecules/ActionMenu.tsx` (Duplicate / Rename / Set as default / Delete-danger).
- **Wizard:** `organisms/StepperModal.tsx` (mirror `OrderModal.tsx` structure, driven by a store, mounted in `AppShell`).
- **Rail:** sticky right `<aside>` (the mock's "Template health") — plain card markup, `position: sticky`.
- **Tokens:** `--md-*` / `--d-*` / `--r` only. **No monospace anywhere** — merge-field chips render in Inter with `tabular-nums`, NOT the mock's Roboto Mono. White inputs in both themes; labels stack above fields.
- **Icons:** Tabler via `atoms/Icon.tsx`; add any new names to the curated `ICONS` map — no inline SVG/icon fonts.

## New reusable primitive: `BottomSheet`

`src/components/organisms/BottomSheet.tsx` — a bottom-up, near-full-height drawer (the user's preferred overlay).
- Props: `{ open; onClose; title; eyebrow?; footer?: React.ReactNode; size?: 'tall' | 'half'; children }`.
- Behavior: portal + fixed, slides up from bottom (Framer Motion `y` spring), scrim backdrop, Esc + backdrop-mousedown close, focus trap, `scroll` body. Header = title + close `IconButton`; optional sticky `footer` action row (navy primary right).
- Classes: new `.ui-sheet*` block in `globals.css` (mirror `.ui-modal*`).
- Reuse: checklist item edit, add-item, on-demand previews — and app-wide thereafter.

## Data layer (adapter → store → hook → page)

Follow the exact end-to-end pattern in `reviews.store.ts` / `useReviewQueue.ts` / `mock-adapter.ts`.

1. **`src/types/domain.types.ts`** (+ re-export via `@/types`):
   - `TemplateKind = 'checklist' | 'response' | 'workbook'`
   - `ResponseTemplate extends BaseEntity { scope: 'org' | 'mine'; name; group; body /* with {{merge}} */ }`
   - `ChecklistTemplateItem { id; group; orig; question; type: 'binary' | 'qualitative'; map: 'ok' | 'warn'; requireCitation: boolean }`
   - `ChecklistTemplate extends BaseEntity { name; sourceFile; version; items: ChecklistTemplateItem[]; usedInReviews?: number }`
   - `WorkbookLayout extends BaseEntity { orgId; name; sections: {...}[]; version }` (light — shape only; editing deep-links to Builder)
2. **`src/data/collections.ts`:** add `RESPONSE_TEMPLATES: 'responseTemplates'`, `CHECKLIST_TEMPLATES: 'checklistTemplates'`, `WORKBOOK_LAYOUTS: 'workbookLayouts'` (matches IA route-map §6).
3. **Seeds** `src/data/seed/`: `response-templates.seed.ts` (the 6 groups: Concur / Concur w-condition / Requires revision / Override / N-A / Free text + the 3 personal "My voice" rows), `checklist-templates.seed.ts` ("Demo Bank — Commercial Review Form", 22 items / 3 groups, 2 flagged), `workbook-layouts.seed.ts` (org default v1, ~6 sections). Wire into `seed/index.ts`; **bump `SEED_VERSION` → v9** in `mock-adapter.ts`.
4. **Store** `src/store/templates.store.ts`: single `useTemplatesStore` holding the three collections + `isLoading`/`error`, `fetchTemplates()`, selectors (`getResponseById`, `responsesByScope`, `getChecklistById`), and mutators (`saveResponse`, `deleteResponse`, `saveChecklistItem`, `publishChecklistVersion`) that stamp `id`/timestamps in-store and call `adapter` only. Re-export from `src/store/index.ts`.
5. **Hooks** `src/app/(shell)/templates/hooks/`: `useTemplateHub.ts` (counts for the tiles), `useResponseLibrary.ts` (scope tab, selection, draft editor state), `useChecklistMapper.ts` (items, open-item-drawer state, health stats).

## Routes & screens

- **`/templates` (replace Stub)** — `PageHeader title="Templates" eyebrow="Library"` + a `.tpl-grid` of 3 `TemplateHubCard`s (icon, title, description, meta stats, one tonal CTA), driven by a `TEMPLATE_KINDS` registry array so adding a 4th kind = one entry.
- **`/templates/responses`** — `SegmentedControl` Org library / My templates; left grouped list (`ResponseList`), right `ResponseEditor` detail pane (name, group, body textarea, click-to-insert **non-mono** merge-field chips, inline **live preview** highlighting substituted tokens, Save/Delete footer). "New template" = navy primary in header → blank detail. Save toast respects scope.
- **`/templates/checklist/[id]`** — `PageHeader` with version chip + `Re-extract` (outline) + `Publish new version` (navy). Two-col: grouped `ChecklistItemRow` list (Mapped/Review + binary/qualitative chips, flagged-row hint) and sticky `TemplateHealthRail` (Items/Groups/Mapped/Need-attention stats, source `.docx` pill + replace, "Add item manually"). Row click / Add → `ChecklistItemDrawer` (BottomSheet: normalized-question textarea, type select, require-citation toggle, "Split item", Save). Publish bumps `version`.
  - Hub tile deep-links to the org's active checklist id; if >1 checklist exists later, add a `/templates/checklist` index.
- **New-checklist wizard** — `ChecklistUploadWizard` on `StepperModal` (steps: Upload `.docx` → AI extract (mock progress) → Review mapping → Publish), mounted in `AppShell` and opened from the hub CTA; on finish routes to the new mapper page.
- **`/templates/workbook-layout`** — light page: `PageHeader` + summary card (sections/theme/version) + navy "Edit layout" CTA that deep-links to Builder org-mode (existing). No new builder.
- **Nav/crumbs:** `/templates` already in `Sidebar.tsx` + `Breadcrumbs.tsx` `TOP_LABELS`. Add sub-route crumb branches for `responses` / `checklist/[id]` / `workbook-layout` (mirror the `reviews/[id]` branch). Add new destinations to `CommandPalette`.

## File-by-file summary

- Edit: `templates/page.tsx` (hub), `collections.ts`, `domain.types.ts` (+`types/index.ts`), `seed/index.ts`, `mock-adapter.ts` (SEED_VERSION), `store/index.ts`, `Breadcrumbs.tsx`, `CommandPalette.tsx`, `AppShell.tsx` (mount wizard), `globals.css` (`.ui-sheet*`, `.tpl-*`), `atoms/Icon.tsx` (ICONS).
- New: `organisms/BottomSheet.tsx`; routes `templates/responses/page.tsx`, `templates/checklist/[id]/page.tsx`, `templates/workbook-layout/page.tsx`; components under `components/templates/` (`TemplateHubCard`, `ResponseList`, `ResponseEditor`, `MergeFieldChips`, `LivePreview`, `ChecklistItemRow`, `ChecklistItemDrawer`, `TemplateHealthRail`, `ChecklistUploadWizard`); `templates.store.ts`; 3 seed files; 3 hooks.

## Build sequence (PR slices)
1. **Foundation:** types + collections + 3 seeds + SEED_VERSION bump + `templates.store.ts` + `BottomSheet` primitive (+ `.ui-sheet*` css). Verify store fetch + drawer in isolation.
2. **Hub + Responses (full):** hub cards + registry, response master/detail with create==edit, merge chips, live preview.
3. **Checklist (full):** mapper page + health rail + item BottomSheet + upload `StepperModal` wizard + publish-version.
4. **Workbook light + polish:** workbook-layout entry, breadcrumbs, command palette, cross-links from Settings → Compliance.

## Verification
- `cd app && npm run dev`; if styling looks stale, **restart the dev server** (known stale-CSS gotcha), don't hand-edit CSS.
- Click-through `/templates`: all 3 tiles render with correct counts from seed.
- Responses: switch Org/My, edit a body, confirm merge chips insert and live preview substitutes tokens (no mono font); Save persists across reload (localStorage `parachute:responseTemplates`).
- Checklist: open mapper, edit an item in the BottomSheet (slides up from bottom, dims list), toggle require-citation, "Split item"; run the upload wizard end-to-end (mock) and land on the mapper; "Publish new version" bumps the version chip.
- Workbook-layout: "Edit layout" deep-links into Builder org-mode.
- Confirm dark + light themes, navy primary CTAs, white inputs, no monospace, no console errors.

---

# Iteration handoff (read this first in a new session)

> Status as of Jun 19 2026: original 4 slices built + committed; **then a versioning + tabbed-IA iteration** (this section) landed on top. `npx tsc --noEmit` and `npx eslint src` clean; all `/templates*` routes return 200. Not pushed, no PR. This section primes a fresh session so iteration questions land with context.

## Run / inspect
- `cd app && npm run dev` → http://localhost:3000. Login gate + a client-side seed gate (SeedProvider) render before content — the real screens only mount client-side. If styling looks stale after edits, **restart the dev server** (don't hand-edit CSS — `[[dev-server-stale-css]]`).
- Mock data is localStorage-backed; **bump `SEED_VERSION` in `mock-adapter.ts` whenever a seed changes** or browsers won't re-seed (currently `v11`). Seeded volume: **4 checklist families** (Commercial 3 versions, SBA Addendum 2, Residential 1 published + 1 **draft**, Construction 1), **2 workbook layouts** (Commercial 2 versions, Residential 1), **~15 org + 7 personal** response templates.
- Seeded checklist family deep-link: `/templates/checklist/checklist-demo-commercial` (resolves the active version — draft if any, else published). View a specific version with `?v=<versionId>` (e.g. `cv-commercial-2`, an archived snapshot → read-only).

## Versioning + tabs iteration (Jun 19 2026 — the current shape)
**Why:** the hub was a near-clone of the HTML mock and didn't express the mock's first-class versioning ("Publish new version → new reviews use it; in-flight reviews keep theirs"). Agreed with Val to add real versioning + reverse IA decision #7 (cards → **tabs**).
- **Tabbed library:** `/templates` is now tabs — **Compliance Checklists · Response Templates · Workbook Layout** (in-page state seeded from `?tab=`, `Tabs` molecule). The tabs live **in the `.pagehead` band** (no title/description — same toolbar pattern as Reviews; the per-tab primary action, e.g. "New checklist", sits at the right of the strip). Each tab = a list of **artifact cards**.
- **Versioned kinds (checklist + workbook):** each family card is a **flat single-surface card** — a **no-icon hero** (title + accent **version badge** e.g. `v3` + amber Draft chip + one **dotted secondary metadata line** + right-side actions) over a **footer disclosure** ("Version history (N)", collapsed by default) that expands the table inline. The table is **flat hairline rows** with real columns — Version (badge) · Contents (`22 items`/`6 sections`) · Status (badge) · Published (date) · `⋯` — and the **published row is tinted** (`.vh-row--active`, navy `--md-selected`, rounded). Row actions in a per-row `⋯` `ActionMenu`. *(Redesigned Jun 19 2026 — replaced the icon-tile + pills + always-open table that "looked like dog shit"; no kind-icon since the tab says the kind.)* Data model: `ChecklistTemplate`/`WorkbookLayout` now hold `versions[]` (each `{version, status: published|draft|archived, items|sections, createdAt, publishedAt}`); resolve via `lib/template-versions.ts` (no published-pointer — `publishedVersion`/`draftVersion`/`activeVersion`). **Invariant:** ≤1 published, ≤1 draft per family.
- **Lifecycle (Draft → Publish; Promote = rollback):** "New version"/"Continue draft"/"Duplicate" all branch the **single draft** (`ensureChecklistDraft`, clones a base version's items with fresh ids) and open the mapper in edit mode. "Publish new version" (`publishChecklistDraft`) freezes the draft active and archives the prior published. "Promote" (`promote*Version`) re-publishes an archived snapshot (rollback). A new `.docx` upload now lands as a **draft** (map → publish v1).
- **Response tab = scope cards, no toggle:** two `.tpl-card`-styled `ResponseScopeCard`s (Org / My templates) drill into `/templates/responses?scope=org|mine`. The old in-page Org/Mine `SegmentedControl` is **gone** — scope is fixed by the card you entered from. Responses are **not** versioned (live snippet library, matches the mock).
- **Mapper version-awareness:** target version = `?v=` (page state, lazy-init from query; in-mapper draft-branch updates it via `history.replaceState`, no remount). `draft` → editable; `published`/`archived` → **read-only** (banner + "New version" / "Promote", rows non-interactive, rail Add/replace hidden).
- **Workbook editing still deferred:** the version table (View/Promote/Delete) is real, but "Edit in a review" → `/reviews` and there's no org section editor (IA decision #6 stands). `/templates/workbook-layout?v=<id>` shows that version read-only.
- **Removed:** `template-kinds.ts` + `TemplateHubCard.tsx` (the old cards-hub). Icons `copy`/`history` added to the `Icon` map.

## Two axes: versions vs. which-template-applies (Jun 19 2026)
A recurring confusion — the cards conflate two independent ideas. Keep them distinct:
- **Versions = within one family** (built): "Published v3" is the live version *of that template*, not "the one all reviews use".
- **Default/applicability = across families** (added this iteration):
  - **Checklist:** a **single org default** (`ChecklistTemplate.isDefault`, store enforces one). The order picker defaults to it + AI recommends; reviewer picks another per order. Badge = accent **"Default"**. Transfer via the card ⋯ "Set as default" **or** Settings → Review defaults (same flag — single source of truth; `setDefaultChecklist`).
  - **Workbook:** **one default per review profile** (`WorkbookLayout.profile` + `isDefault`; `setDefaultLayout` scopes within a profile). A review inherits its profile's layout automatically. Badge = **"Default · {profile}"**.
- **Edit-centric card actions (all 3 tabs):** the **title is a link → details/view**; **one primary write button** (checklist → **Edit** [opens mapper draft; "Continue draft" if one exists]; workbook → **Edit in a review** [org editing still deferred]; response → **Open**); **secondary actions in a hero `⋯`** (checklist: Set as default / Duplicate / Delete — the default can't delete itself or set-itself-default). **No more "New version" / "View current" / "New template" buttons** — "save as new version" happens inside the editor (mapper's "Publish new version"). Response cards have no ⋯ and no create button (snippets are created *inside* the library).
- **Settings linkage:** `/settings` → Review defaults "Default administrative checklist" select is store-driven (options = checklist families, value = the `isDefault` one, `onChange` = `setDefaultChecklist`); the Compliance tab card reflects the default family + "Manage" → its mapper.
- **Order flow wiring (Wave 2, DONE Jun 19 2026):** the **Configure step** now has a **"Templates for this review"** sub-section — a **checklist picker** (`OrderDraft.checklistId`; null = org default, a pick = per-order override) defaulting to the org default with an **"AI-recommended / org default"** hint (vs an "override — audited" note when changed), and a **read-only inherited workbook-layout** row (profile derived from `property.propertyType` via `profileForType`, → that profile's default layout, "editable per review in the Builder"). The **Summary step** echoes both (Workbook name · Checklist name + "(override)"). `setChecklist` action on `useOrderStore`. Note: the created review still doesn't *persist* the chosen checklist/version (review-side pinning remains out of scope).

## Where everything lives (so a vague reference resolves fast)
- **Tabbed hub** — `app/(shell)/templates/page.tsx` (tabs + per-tab card lists) + `hooks/useTemplateHub.ts` (family views + all version-lifecycle callbacks + tab state). Tab labels live inline in `page.tsx` (`TABS`). *(The old `template-kinds.ts` registry + `TemplateHubCard.tsx` were deleted.)*
- **Version model + helpers** — `types/domain.types.ts` (`VersionStatus`, `ChecklistVersion`, `WorkbookVersion`; families carry `versions[]`) + **`lib/template-versions.ts`** (`publishedVersion`/`draftVersion`/`activeVersion`/`sortedVersions`/`nextVersionNumber`/`VERSION_STATUS_LABEL`).
- **Family card + history** — `components/templates/TemplateFamilyCard.tsx` (no-icon hero: `title`/`versionBadge`/`sub`/`hasDraft` + actions, footer disclosure collapsed) + `components/templates/VersionHistoryTable.tsx` (`VersionRow`, flat columns, per-row `⋯`). **Response cards** — `components/templates/ResponseScopeCard.tsx` (reuses the **same `.fam-*` hero chrome**, no version footer; props `title`/`sub`/`onOpen`/`onNew`). All three tabs stack full-width cards in `.fam-list`. CSS: `.fam-*` + `.vh-*` under the TEMPLATES hub banner.
- **Response Templates** — `app/(shell)/templates/responses/page.tsx` (scope from `?scope=`, no toggle) + `hooks/useResponseLibrary.ts` + `components/templates/{ResponseList,ResponseEditor,MergeFieldChips,LivePreview}.tsx`.
- **Checklist mapper** — `app/(shell)/templates/checklist/[id]/page.tsx` (version-aware: `?v=` page state, read-only/draft modes) + `hooks/useChecklistMapper.ts` + `components/templates/{ChecklistItemRow,TemplateHealthRail,ChecklistItemDrawer}.tsx` (`ChecklistItemRow` + rail take a `readOnly` prop).
- **Upload wizard** — `components/templates/ChecklistUploadWizard.tsx` (built on `StepperModal`; creates a **draft** v1 via `addChecklist`). **DORMANT as of Jun 19 2026** — checklist creation is deferred pending client clarity, so the "New checklist" button + the wizard mount were removed from the hub. The file + `addChecklist` are kept intact (unreferenced); to restore, re-add the button + `<ChecklistUploadWizard>` mount to `templates/page.tsx`.
- **Workbook layout** — `app/(shell)/templates/workbook-layout/page.tsx` (version-aware read-only view; `?v=`; promote archived).
- **Reusable drawer** — `components/organisms/BottomSheet.tsx` (+ `.ui-sheet*` in `globals.css`). App-wide primitive, not Templates-only.
- **Data** — `data/collections.ts`, `data/seed/{response-templates,checklist-templates,workbook-layouts}.seed.ts` (checklist has 3 seeded versions, workbook 2), `store/templates.store.ts` (`useTemplatesStore` — version-lifecycle actions).
- **All Templates CSS** lives in `globals.css` under three banner comments: `TEMPLATES — library hub…` (now also `.tpl-tabbar`/`.tpl-pane-head`/`.fam-*`/`.vh-*`, plus `.resp-*`/`.mf-*`), `TEMPLATES — checklist mapper…` (`.ck-*`/`.ckw-*`, incl. `.ck-ro-banner`/`.ck-row--ro`), and `workbook layout` (`.wl-*`).

## Decisions already made — don't re-litigate or accidentally undo
- **Surface taxonomy:** route = place, BottomSheet = focused task, StepperModal = linear commit. **Create == Edit** for responses (the editor IS the page; "New" = blank detail pane, no separate route). Create differs only for the checklist `.docx` ingest (wizard).
- **Scope (`org`/`mine`) exists only on Response Templates.** Checklist & Workbook are org-only — don't add scope toggles to them.
- **Merge-field chips are non-mono** (Inter + tabular-nums) — the mock used Roboto Mono; we deliberately don't. Never reintroduce a mono face.
- **Navy primary, one primary CTA per surface; petrol = accent only.** All color/space via `--md-*`/`--d-*`/`--r` tokens.
- ~~Hub is **cards → sub-routes** (IA decision #7), not tabs.~~ **Reversed Jun 19 2026:** hub is now **tabs of kinds** (consistent with Reviews/Settings). Each tab is a list of artifact cards; editors stay as drill-in routes.
- **Versioning model (Jun 19 2026):** families hold `versions[]`; **≤1 published + ≤1 draft**; archived snapshots are kept (in-flight reviews stay pinned). **Checklist + Workbook version; Response does NOT** (live snippet library). Don't add a `publishedVersionId` pointer — derive via `lib/template-versions`. Don't let the mapper edit a published/archived version — editing happens on the draft only.
- **One draft per family.** "New version"/"Duplicate"/"Continue draft" all resolve to the same single draft (`ensureChecklistDraft` reuses an existing one). Promote = rollback (re-publish an archived snapshot), not a new version number.

## Deliberate limitations (these are by design, NOT bugs)
- **Workbook Layout is light** — read-only summary + "Edit in a review" → `/reviews`. The full 3-pane org builder is **deferred (IA decision #6)**. There is no standalone org-builder route.
- **"Re-extract"** on the mapper is a **simulated affordance** (spinner ~1.4s, no data change) — placeholder for re-running the AI pipeline.
- **Upload wizard extraction is mocked** — `sampleExtract()` in `ChecklistUploadWizard.tsx` returns a fixed 8-item set (1 flagged) after a simulated delay; it does create + persist a real `ChecklistTemplate`. Real `.docx` parsing is backend work.
- **"Split item"** uses a naive split on the first `?`. **"Replace" source** on the rail reuses the re-extract stub.
- Checklist `requireCitation` and item edits persist; there's no per-review `checklistItems` instance layer yet (that's review-side, out of this branch's scope).
- **Creating a new checklist is DEFERRED (Jun 19 2026).** The `.docx` upload wizard exists but is unmounted (see above) — there's no create entry point in the UI right now. Existing seeded checklist families are still fully manageable (view / version history / promote / new version / delete). Revisit when the client clarifies the upload/ingest flow.
- **Version lifecycle is REAL data** (create draft, edit items in draft, publish, promote/rollback, delete archived — all persist to localStorage). What's still stubbed: **"Re-extract"** (spinner only), **workbook section editing** (deferred → "Edit in a review"; only View/Promote/Delete are wired for workbook), and there's still **no review-side version pinning** (reviews don't yet record which template version they were created with — the "in-flight reviews keep theirs" rule is modelled in copy/seed, not enforced in review data).

## Lint gotchas hit here (so iterations stay clean)
The `react-hooks` plugin is strict: **no synchronous `setState` in effects, no ref reads/writes during render, no reassigning a `let` after render.** Patterns used: derive instead of sync-via-effect (`useResponseLibrary` selection), keyed-remount inner form for prop→state reset (`ChecklistItemDrawer`'s `ItemForm`), `?new=1` read via a lazy `useState` initializer, and non-mutating prefix-sum numbering on the mapper. Reuse these patterns rather than reaching for effects.

## Likely iteration areas — current state
- **Visual polish:** spacing/typography are token-driven; tune in the three CSS banners above. BottomSheet sizes are `tall` (92vh) / `half` (≤620px).
- **More template kinds (Bank Policy, letters):** add a `TEMPLATE_KINDS` entry + a collection/seed/type + a route; the hub auto-renders the card. (Client did describe a Bank Policy upload — natural 4th kind.)
- **Wizard depth / real upload:** swap `sampleExtract()` for real extraction; the step flow + publish→route are done.
- **Response editor:** group is a free-text `Input` with a `datalist`; could become a constrained select if desired.
