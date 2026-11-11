# C · Shell and design system: what the boards need vs what already exists

Read-only audit, 11 Nov 2026, branch `feat/pattern-change`. Sources: `app/AGENTS.md`, `spec.md` §1/§5/§6/§8, boards `proposed-screens/{index,part2,onboarding-motion}.html` + `app-chrome.css`, `app/node_modules/@realwired/ui/dist/**/*.d.ts`, `app/src/components/**`.

**Bottom line:** most of the new pieces can be built from parts we already have. Ten small app-side components are genuinely new. None of them needs a design-system release before the 48-hour build. Build them in the app on top of `@realwired/ui` primitives and feed them back to the library later (§5).

---

## 1. What `@realwired/ui` 0.1.0 (vendored) actually exports

The tarball was repacked on 6 Nov (`a539e1f`) from `D:\worktrees\ds-now`, so **overlays and the newer molecules are now in the build**. Older notes say Dialog, Popover and Callout are missing. That was true of the August tarball and is no longer true. `index.d.ts` re-exports `atoms`, `molecules`, `feedback`, `organisms`, `overlays`, `widgets`, `hooks` and `brand`.

| Need | DS export | Variants / props that matter here | Used in app today? |
|---|---|---|---|
| Button | `Button`, `IconButton` | `variant`: primary · accent · outline · ghost · danger · tonal; `size`: xs · sm · md · lg · control; `iconLeft/Right`, `asChild`, `block`. **No `busy`.** Geometry ported 1:1 from `.ui-btn` | `IconButton` only (AppShell) |
| Dialog / modal | `Dialog`, `AlertDialog`, `Sheet` | Dialog `size` sm · md · lg · drill · fullscreen; `title`, `description`, `eyebrow`, `footer`, `footerStart`, `headerEnd`, `hideTitle`, `nested`, focus hooks. AlertDialog: `confirm/cancel/secondaryLabel`, `tone` danger/primary, `icon`, `children`. Sheet `side` bottom/right/left, `size` panel/half/tall | `Dialog` in `ReceiptDialog`, `TopUpModal` |
| Popover | `Popover` (+ `PopoverClose`, `PopoverAnchor`) | Radix; `trigger`, `title`, `footer`, `side`, `align`, `width`, `modal`, `overModal`. Portal + collision flip come built in | no |
| Tabs | `Tabs` (buttons), `TabNav` (links) | `TabItem`: `count`, `leading`, `trailing`. TabNav: `underline`, `overflow` menu/scroll | `Tabs` on `/reviews` |
| Segmented | `SegmentedControl` | `segments[{icon,count,swatch}]`, `iconOnly`, `block`, `size` | no (local copy used) |
| Badge / pill | `Chip`, `CountPill`, `StatusPill`, `ConfidenceChip` | Chip `tone`: accent · muted · info · danger · neutral · success · warning · critical, `dot`. **No icon prop** (children can hold one). StatusPill is a fixed review-status enum | no |
| Toast | `ToastProvider`, `useToast` | `tone` neutral/success/warning/danger/info, `action`, `duration` | yes, widely (`ToastHost`) |
| Banner | `Callout`, `CalloutAction` | `tone` accent · info · danger · success · warning; `icon`, `action`, `onDismiss` | yes (Get started, billing, Members, OrgSetup, Value, Security) |
| Stepper | `StepRail` (vertical, statuses done/active/pending/locked), `TaskFlow` + `TaskFooter` (page/modal task frame with `rail`, `header`, `aside`, `actions`, `gate`), `StepLine` (horizontal workflow stamps with dates), `BlockStepper` | none is a horizontal numbered "1 Amount · 2 Payment · 3 Review" bar | no |
| Progress | `ProgressStages` (staged list with `progress`), `CoverageBar` (assigned/suggested/open), `SlaProgress` | **No plain ProgressBar or Meter** | no |
| Empty | `EmptyState` (`size` sm/md/lg, `tone`, `action`, `secondaryAction`), `ErrorState`, `LoadingRegion`, `PageSkeleton` | no `media` or preview slot | no (local `EmptyState` is richer) |
| Page band | `PageHeader` + `PageBody` | `eyebrow`, `title`, `badges`, `description`, `actions`, `leading`, `tabs` (TabNav), **`toolbar`**, `sticky` | `/reviews` only |
| Tool strip | `ToolbarStrip` (+ `ToolbarDivider`) | `label`, `end`, `variant` attached/standalone | no |
| Card | `Card`, `SectionCard` (title/description/action), `HubCard` (icon/title/desc/tags/href), `OptionCard` (radio/checkbox, `description`, `icon`, `meta`, `note`, `soon`) | | no |
| Facts | `FactGrid`, `KeyFigures` (`tone` on value), `StatCard`, `StatGroup` | | no |
| Table | `DataTable` (tanstack), `ReportDataTable`, `PivotTable` | | no (`ReviewTable` local) |
| Menu / select | `ActionMenu`, `Select` (native-select API, themed list, `searchable`; **options are label-only**), `SearchCombobox`, `SearchInput`, `FilterChip(Row)` | | `SearchInput` on `/reviews` |
| Tooltip | `Tooltip` (`tone` ink/panel), `TooltipProvider` | | no (local Tooltip) |
| FAQ / files | `Accordion`, `Disclosure`, `FileRow`, `Dropzone` | | `FileRow` (security page) |
| Charts | `DonutViz`, `BarViz` (+ `WidgetFrame`) | colours come from a palette index (`colorIndexByKey`), not arbitrary tokens | no |
| Shell | `AppShell`, `AppHeader` (`leading/start/center/end`), `Sidebar*`, `SidebarAction`, `UserMenu`, `SettingsShell` | `--rw-header-h: 60px` | `AppShell`, `SidebarAction` |
| Not in DS | tour/coachmark, video player, progress bar, pricing tiles, checklist widget, illustration atom, horizontal stepper | | |

## 2. The app's own layer: what wraps the DS and what is local

| App component | Wraps DS? | Notes |
|---|---|---|
| `templates/AppShell.tsx` | **Yes**: `RwAppShell` + `SidebarAction` + `IconButton` | Fills the slots: `navAction` (Start, with the locked variant), `sidebarFooter` (`BalancePill`, `OrgCard`), `header.start` (`Breadcrumbs`), `header.end` (`SearchTrigger`, bell, `UserMenu`). Also mounts `CommandPalette`, `RunModal`, `EarnedToastHost`, `TopUpModal`, `ReceiptDialog`, `DemoDock`. The "Get started n/9 + bar" row passes a two-line node into the library row's label slot |
| `templates/PageHeader.tsx` | No, local | `.pagehead` band (58px min, `--d-page-x`, 20px h1, `eyebrow`/`badges`/`sub`/`actions`). Used by billing, dashboard, configure pages and `Stub` |
| "Library page band" (`1db63d7`) | **Yes**: DS `PageHeader toolbar={…}` + `PageBody` + DS `Tabs` + `SearchInput` | `/reviews` only. Parachute supplies the toolbar *contents* (filters, Order CTA). `globals.css` ~L9824 says other tables should put their toolbar "in the .pagehead band, same as Reviews" |
| Tool strips | none dedicated | Toolbars are ad hoc: band toolbars, `QueueFilters`. DS `ToolbarStrip` is unused |
| `atoms/Button` | No, local | Same 6 variants as DS. Sizes sm/md/lg. No `busy` (spec C1 adds it) |
| `atoms/Modal`, `ConfirmDialog` | No, local (framer, sm/md) | Most dialogs still use this. Wallet dialogs use DS `Dialog` |
| `atoms/Tooltip` (+`InfoTip`), `molecules/ActionMenu` | No, local portals | House portal pattern |
| `atoms/Chip`, `CreditChip` | No, local | `CreditChip` tones: credit · trial · money · free · low |
| `molecules/SegmentedControl`, `Tabs` | No, local (framer sliding pill, `.qtabs`) | DS duplicates exist. Billing uses the local `Tabs`, Reviews uses DS `Tabs` |
| `molecules/EmptyState` (+`EmptyLine`, `Ghost*`) | No, local | The 3-level empty rule. Spec §5.12 adds a `media` prop |
| `molecules/StatusPill`, `StatCard`, `PipelineTracker`, `Breadcrumbs`, `PeriodPicker`, `DateRangeCalendar` | No, local | DS has same-named ones that are unused |
| `organisms/BottomSheet`, `StepperModal` | No, local | DS `Sheet` / `TaskFlow presentation="modal"` are the library equivalents |
| `organisms/UserMenu` | No, local | DS `UserMenu` exists and is unused |
| `organisms/home/GuideVideo` (`GuidePlayer`, `GuideStage`) | No, local | Spec reuses it for Learning Center and the empty-state videos |
| `shell/PageTransition` | No, local (framer) | Only file in `components/shell/` |
| `templates/KeycloakFrame` | No, local | Auth card frame (`.kc-*`) |

What this means: only the shell, toasts, callouts and two dialogs come from the library today. Everything else is local. So "reuse" mostly means reusing **local** atoms, and pulling in a DS part only where nothing local exists (Popover, Callout, OptionCard, Accordion, FileRow, SectionCard, StepLine).

## 3. Each new piece: reuse, add a variant, or build new

Legend: **R** = reuse as-is · **V** = reuse with a new local variant/prop · **N** = new local component (composed from existing parts).

| New piece (spec §) | Verdict | Build from | Notes / gaps |
|---|---|---|---|
| Credits pill (§5.3) | **V** | local `CreditChip` (add tones `zero`, `held`, `invoiced`) as the `Popover` trigger | Board pill is 34px with a 17px radius, a chevron and an outline. `CreditChip` today is smaller. One derivation via `lib/wallet-view.ts` |
| Credits popover (§5.3) | **R** DS `Popover` + **N** `CreditsPopover` content | DS `Popover` (`title` off, `footer` = Add credits/View usage, `width` 340, `align="end"`) | Radix brings portal, flip, Esc and focus return. **Gap:** it does not close on scroll. Add an `onScroll` close or accept the difference with AGENTS. The request card is a plain row |
| Sidebar Trust / Learning rows (§5.4) | **R** | DS `SidebarAction asChild` + `next/link` (same as the Start row) | Board draws 16px icons in a separate `.sb-res` block. Real nav icons are 19px. Follow the spec (SidebarAction geometry), not the board |
| Lock dialog (§5.5) | **V** | DS `Dialog size="sm"` with `hideTitle` (the visible title sits under the art), local body; options via DS `OptionCard type="radio"`; note via DS/local `Input` | Don't use `AlertDialog`. Its single `icon` can't hold a 96–104px spot and it reads as a confirm. Mount once in `AppShell`. The board's centred art plus title differs from DS Dialog's left-aligned header, so this needs a local body class |
| `LockedAction` wrapper (§5.5) | **N** (small) | Wraps local `Button` / `SidebarAction asChild`; adds trailing `lock`/`hourglass-high` `Icon` and `aria-disabled` | The pattern already exists inline in `AppShell` (`start-locked`). Extract it |
| `PendingTracker` (§5.2, §5.5) | **V** or **N** | Try DS `StepLine` first (label + date, absent = not reached). If it can't show a "current" ring plus a caption for an unreached step, build locally (board `.tracker`). Local `PipelineTracker` is the other candidate | Also used inside the lock dialog, so keep it width-fluid |
| State pill + scenario popover (§6) | **N** | Local `ProtoPill` (portal, z 210, dark ink), DS `Popover` for the scenario panel, local `SegmentedControl` for axes, DS `Tooltip` or local for state descriptions | Prototype-only. Never belongs in the DS. Replaces `DemoDock` |
| Get started section card (§5.2) | **R** + **N** rows | DS `SectionCard` (`title`, `description`, `action` = earn pill + "2 of 3") or a local `.card` wrapper; rows = new `SetupRow` with local `Button` (first not-done row `primary`, others `outline`) | Board `.gs-row` is a 20px glyph, text and a button with a 136px minimum. No hover reveal |
| Earn pill (§5.2) | **V** | local `Chip` + `Icon gift/check` (children) | **Colour conflict:** the board's `.pill-earn` is a petrol tint, but AGENTS says `ui-chip--accent` derives from navy. Pick one: petrol is allowed for "accent" cues, so a tinted earn pill is defensible, but decide it once. Done state = `tone="success"` |
| Get started progress bar (§5.2) / onboarding 2-segment bar (§5.1) | **N** | New local `ProgressBar` atom (and `segments` mode). The sidebar `--gs-pct-n` bar and `setup-checklist.css` bar already exist; consolidate them | The DS has no Progress/Meter (`CoverageBar` has other semantics). Library candidate (`SegmentBar` was already proposed in the self-serve spec) |
| Resource cards (§5.2) | **V** | DS `HubCard` has no art slot, so use a local card with `Illustration` (spec §5.14) on top | Board `.res-card` = art band on `surface-1` + title + arrow |
| Welcome line / confetti (§5.2) | **R** | DS `Callout tone="success"` with `onDismiss`, or a local one-line row; `lib/celebrate.ts` | Spec says "not a toast, not a modal" |
| Checkout shell + stepper (§5.6) | **N** | Local `CheckoutShell` top bar (logo, stepper, Exit). Stepper = new local horizontal `Stepper` (numbers, `check` when done, connector lines) | DS `StepRail` is vertical and `TaskFlow` assumes a rail. Neither draws the board's centred horizontal stepper. Worth checking: `TaskFlow presentation="page"` with `aside` = summary, `contentMaxWidth={false}` and `gate` = the cost line could be the body frame |
| Pack tiles (§5.6) | **V** | DS `OptionCard type="radio"` (`label`, `description`, `meta` = "Save 7%") if it can sit 4 across; otherwise a local `PackTile` | Board tile: big number, price, per-credit price, check disc, selected = 2px navy + `--md-selected`. Same look as `.slot.on` / `.seg span.on`, so one local "selectable tile" class covers packs, time slots and onboarding answers |
| Order summary (§5.6) | **N** | Local `OrderSummary` (`position: sticky`) with `.sum-row` key/value lines; local `Button block` | No art. The `.co` grid is `1fr 336px`, and the fixed aside width is allowed because content fills the rest |
| Review-step line items | **R** (simple) | A local table or `.cost-row` grid. DS `DataTable` is overkill | |
| Billing state banners (§5.8) | **R** | DS `Callout` (`tone` warning/info/danger/success, `action`, `onDismiss`), which `v2-brief.md` already mandates | Board `.banner` is a flat 10px-radius strip; Callout is the house version. `BonusNotice` and `AutoReloadOffer` are content wrappers around Callout or a card |
| Billing band + tabs (§5.8) | **V** | Move billing onto the **library page band**: DS `PageHeader toolbar` with DS `Tabs`, then "Talk to us" / "How credits work" links and `Add credits` at the end | Today billing uses local `PageHeader` + local `Tabs` (`.qtabs`). The board's `.page-bar` (tabs left, links right, no title) is exactly the Reviews band. That gives one band pattern instead of two |
| Billing facts / hero | **R** | Existing `OverviewTab` `Facts` / `BalanceCard`. DS `KeyFigures` (`tone` warning/danger) is an option, not a requirement | |
| Usage donut (§5.8, PC-28) | **N** | Local `UsageDonut` as hand-built SVG (2 arcs, 22px ring, 2px gap, `role="img"`, hidden table) | DS `DonutViz` takes palette indices, not the `--viz-tech/--viz-admin` tokens the spec requires, and brings `WidgetFrame` chrome. A 2-slice SVG is about 60 lines |
| By-person bar list | **N** | Local list: `Avatar` + name + CSS bar + value | DS `BarViz` is a recharts chart. The spec wants a list with text values |
| Period filter / Export | **R** | Local `PeriodPicker` + `Button outline` | |
| Tour chip (§5.13) | **V** | Local `Button size="sm" variant="outline"` (petrol icon) + dismiss `IconButton`; goes in the `PageHeader` `badges`/`actions` slot | The board's `.tour-chip` is a 32px pill. Avoid a new chip type |
| Coachmark / tour tooltip (§5.13) | **N** | `react-joyride` `tooltipComponent` = local `TourTooltip` (title, body, dots, Skip/Next with local `Button`) | Nothing in the DS. If Joyride fails React 19.2, the fallback is DS `Popover` + `PopoverAnchor` on the `data-tour` target, plus a spotlight ring |
| Invite rows + role dropdown (§5.1) | **V** + **N** | `Input` + new `RoleSelect` (listbox with two-line options) built on DS `Popover`, or DS `Select` if the descriptions move to help text | DS `Select` options are label-only, so it can't show "Reviewer · Runs reviews…". Local `InviteMemberModal` uses a role radiogroup, so reuse `ROLE_META` copy |
| Onboarding centred card + side panel (§5.1) | **V** | Existing `(onboarding)/layout.tsx` + `.wel-*` classes; new `OnboardingFrame` (measured height, motion) + `StepPanel` | Board `.wel-card` is 520px and `.proof` 360px. These are fixed card widths on a centred stage, like `KeycloakFrame` (440px), not content caps. Keep them |
| Call booking slots | **N** | Local slot grid that reuses the selectable-tile class | |
| Interstitial (PC-26) | **N** (check DS first) | DS `ProgressStages` fits if the interstitial is a staged checklist (motion-spec §5); otherwise a local full-viewport component | |
| Trust Center (§5.10) | **R** mostly | Hero = local layout + `Illustration`; documents = DS `FileRow` (already used on `/configure/security`); "At a glance" = DS `FactGrid`; placeholder = `Chip tone="muted"` | `SendToItDialog` = DS `Dialog` |
| Learning Center (§5.11) | **R** + **N** `VideoCard` | DS `SearchInput`; filters = local `SegmentedControl` or DS `FilterChipRow`; player = `GuidePlayer`; PDF rows = `FileRow` | `VideoCard` (poster, duration, watched) is new |
| How credits work (§5.7) | **R** | DS `Accordion` for the FAQ; `CostBlock` shared with checkout; DS `Callout`/card for the sales panel | |
| Empty-state video (§5.12) | **V** | local `EmptyState` + `media` prop + `EmptyVideo` (`GuidePlayer`) | Local, not DS `EmptyState` (no preview slot) |
| Busy button / shake | **V** | local `Button` `busy` prop (spec C1) | DS Button has no busy state either |
| Prototype Index (§6) | **N** | Local page using DS `SearchInput`, local cards | Prototype-only |

## 4. Where the boards' drawn chrome differs from the real shell

| Area | Board (`app-chrome.css`) | Real app | Build to |
|---|---|---|---|
| Header | 60px; crumbs; end: **credits pill**, search **icon** button, bell, avatar + chevron | DS `AppHeader` 60px (`--rw-header-h`); `Breadcrumbs`; end: `SearchTrigger` (field-style ⌘K), bell `IconButton`, local `UserMenu` | Real. Insert `CreditsPill` before the bell (spec order: Search · Credits · bell · UserMenu). Keep `SearchTrigger` as is; the board's search icon is a simplification |
| Sidebar top | `.sb-action` Start; `.sb-gs` two-line Get started + bar | Same, via `SidebarAction` + the label-slot hack | Real (already matches) |
| Sidebar footer | `.sb-res` block (16px icons) → `.sb-balance` → `.org` | `.sb-foot`: `BalancePill` → `OrgCard` | Add the resource rows with `SidebarAction` geometry (19px) per spec §5.4, not the board's 16px |
| Page band | `.page-bar`: 62px min, `padding 12px 32px`, pill tabs with `--md-selected` fill, links right, no title | Two bands: DS `PageHeader` (Reviews) and local `.pagehead` (58px, `--d-page-x`, 20px h1) | DS `PageHeader toolbar` for Billing (matches the board). Don't copy the board's paddings; the band uses density tokens |
| Tabs | static `.tab.on` pill | DS `Tabs` (Reviews) / local `.qtabs` with sliding pill (Billing) | The look is identical. Standardise new tab rows on whichever the band uses |
| Page title | Get started: 28px h1 in the page body, no band | `.pagehead h1` 20px | Get started keeps a bodied hero (no band) as the board shows. Confirm with Val, because it's the only shell page without a band |
| Buttons | 40px, **20px radius (pill)**, `.btn-text` | `.ui-btn` 40px, **10px radius**; ghost variant | Real (10px). The boards' pill radius is not a design change; don't restyle buttons |
| Pills / chips | 24px, 12px radius | `.ui-chip` 24px, 7px radius | Real chip geometry |
| Dialog | 480px, centred art + h2, actions right with hairline | DS Dialog / local Modal: left header + close | Lock dialog body centres its own art and title (local class) |
| Popover | 12px radius, elev-3, 340px | DS Popover (Radix) | DS |
| Banners | `.banner` flat strip | DS `Callout` | DS Callout |
| Inputs | always white | white in light, dark override kept | Real |

## 5. Put new variants in the DS package now, or build in the app first?

**How the DS gets updated today.** `app/vendor/README.md`: the tarball is a packed build of `val-brandcave/realwired-design-system` (clone at `Desktop\realwired-design-system`, active worktree `D:\worktrees\ds-now`, branch `tables-tidy`, last commit 3 Nov, with **uncommitted snapshot changes**). Refreshing it takes `pnpm build` → `npm pack` → `npm install ./vendor/realwired-ui-0.1.0.tgz` in `app/`. The version is still `0.1.0` and nothing is published to a registry (no `write:packages` token). The library is shared by Parachute, BrickLayer, Vendor Circle and YouConnect, and has Storybook, Chromatic, vitest and snapshot tests. Ed cancelled the full DS retrofit on 26 Aug, which is why most of the app is still local.

| | A · Into `@realwired/ui` now | B · In-app now (local, wrapping DS primitives), migrate later |
|---|---|---|
| Work per component | Source + story + tests + snapshots in the DS repo, cross-brand theme check, rebuild and repack, reinstall, lockfile churn | One `.tsx` + `globals.css` section, the usual tsc/eslint gate |
| Coordination | Breaks the spec's strict file ownership: every agent would need a DS-repo change and a repack, and repacks serialise (one tarball, same version string, so there's no way to tell builds apart) | Fits §8 ownership as written |
| Risk | The worktree has uncommitted changes and sits on a feature branch. A repack could pull in unrelated DS changes (Aug and Nov repacks both changed many exports). A broken repack blocks the 48-hour ship | Local drift from the library, a second copy of things like the progress bar or stepper |
| Review | Needs Cody/Diego-level sign-off for a shared library; colour decisions (earn pill, `--viz-*`) affect four products | Val reviews in the prototype |
| Payoff | One source of truth; engineers import exactly what they see | Fast and reversible. The hand-off note lists what should move |
| Rough cost | +0.5–1 day per component, plus about 0.5 day per repack cycle and the regression check | ≈ the spec's existing estimates |

**Recommendation: B for this change, with a migration list.**
1. Build every **N/V** item in the app. Compose DS primitives where they exist (`Popover`, `Dialog`, `Callout`, `OptionCard`, `SectionCard`, `Accordion`, `FileRow`, `FactGrid`, `Tabs`/`PageHeader toolbar`, `useToast`), and local atoms for the rest. Don't edit or repack the vendored tarball during phases 1–3.
2. Keep the new components prop-shaped like DS ones (cva-style `tone`/`size`, no store access in atoms/molecules) so moving them later is a copy, not a redesign.
3. Library candidates to log for Cody/Diego after the build (and in `docs/plans/parachute-v2-client-questions.md` if Realwired needs to weigh in): `ProgressBar`/`SegmentBar`, horizontal `Stepper`, `LockedAction` (the "never disabled" rule is cross-product), `Button busy`, `EmptyState media` slot, `Dialog` centred-art layout, `CreditChip`-style tone set, `TourTooltip`, the selectable tile, `Popover` close-on-scroll. Prototype-only items (`ProtoPill`, `ScenarioPopover`, Prototype Index, `RoutingNote`) never go to the DS.
4. One exception worth taking now, because it costs nothing: move Billing onto DS `PageHeader toolbar` + DS `Tabs`, the same as Reviews. That reuses what's already vendored and removes the second band pattern.

## 6. Open items for the coordinator

- Earn-pill colour: petrol tint (board) or navy-selected (`ui-chip--accent` per AGENTS). Decide once in C0.
- Check that `StepLine` can draw the `PendingTracker` "current" state; if not, build locally.
- Check that `OptionCard` lays out 4-up for packs; if not, build a local selectable tile.
- `Popover` scroll dismissal: AGENTS requires it and Radix doesn't do it by default.
- Two tab implementations (`molecules/Tabs` vs DS `Tabs`) and two page bands. New work should not add a third.
- Get started is the only shell page without a band. Confirm that's intended (the board shows it that way).
