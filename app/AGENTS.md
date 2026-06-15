<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Parachute v2 — Prototype Rules

This is the **Parachute v2** front-end prototype (Realwired's AI appraisal-review tool for banks).
It is a **clickable prototype, not production**: front-end + a mock service layer only, no real API,
no backend ownership. An engineering team builds the real product from this. Optimize for design
quality, clear patterns, and a clean hand-off — not premature backend concerns.

> The global `~/CLAUDE.md` (Windows rules — never redirect to `nul`, etc.) still applies.
> Product spec, IA, and design decisions live in `../docs/plans/` and project memory.

## Stack

- **Next.js (App Router) + TypeScript**, **Tailwind v4**, **Zustand**, **Framer Motion**, **lucide-react**.
- Path alias `@/*` → `src/*`. Dev server: `npm run dev` (http://localhost:3000).

## Component architecture (atomic design)

Build UI as atoms → molecules → organisms → templates → pages. Decide the level first, then scope.

- **Atoms** (`src/components/atoms/`): primitives — `Button`, `Icon`, `Chip`, `Input`, `Tooltip`, `Modal`, `Logo`, etc. Stateless, props-driven, no business logic, no store access.
- **Molecules** (`src/components/molecules/`): small combinations of atoms — `Field`, `SegmentedControl`, `StatCard`, `NavItem`, `Breadcrumbs`, `PeriodPicker`, `ActionMenu`. Mostly props-driven.
- **Organisms** (`src/components/organisms/`): larger sections — `Sidebar`, `AppHeader`, `StatBar`, `ReviewTable`, `OrgCard`, dashboard widgets. **May** connect to stores/hooks.
- **Templates** (`src/components/templates/`): page scaffolding — `AppShell`, `PageHeader`.
- **Pages** (`src/app/.../page.tsx`): compose organisms/templates with real (mock) data via a page hook.

Each folder has a barrel `index.ts`. Import from the barrel (`@/components/atoms`), not deep paths.
Keep components small and single-purpose; extract shared patterns instead of duplicating. Props get sensible defaults; never hardcode user-facing copy that should be a prop.

## Styling & design tokens

- **All styling uses design tokens (CSS variables) defined in `src/app/globals.css`** and mirrored in `src/lib/tokens.ts`. **No arbitrary hex or pixel values** — use `--md-*` (color), `--d-*` (density spacing/scale), `--grad-*`, `--r` (radius).
- Component styles are **`.ui-*` / semantic classes in `globals.css`** — NOT CSS modules, NOT per-component `*.styles.ts`. Reuse existing classes; add new ones in the relevant section of `globals.css`.
- **Palette = "Slate & Teal":** navy `#10344C` primary, teal `#0FA39E` accent, cool slate neutrals.
  - **Primary CTAs are NAVY** (`--grad-primary`). **Teal accent is for highlights, active states, links, focus, and AI cues only — never the default primary button.**
- **Theme:** support **light + dark** via `:root[data-theme="dark"]`. Never hardcode a color that breaks in the other theme; use tokens. Theme-aware assets (e.g. logo) toggle via CSS on `[data-theme]`, **not** inline `display` overrides (inline styles beat CSS classes).
- **Density:** spacing/scale respond to `[data-density]` via `--d-*` vars; don't bypass with fixed paddings on layout-level elements.
- **Inputs always have white backgrounds** (standing client rule); use the input tokens in both themes.
- Layout is **full-width** (no body max-width); content must reflow when the nav collapses. **Desktop-first** for now — don't break at smaller widths, but full mobile/tablet polish is a later phase.

## Icons

- Use **lucide-react via the `Icon` atom** (`name` from the curated map in `atoms/Icon.tsx`). Add new icons to that map. **No icon fonts, no ad-hoc inline SVG.**

## Data layer (mock service layer)

The adapter pattern is the contract for hand-off (`../docs/plans/data-adapter-pattern-guide.md`):

```
Page → page hook → Zustand store → adapter → mock (localStorage) | api (stub)
```

- Each layer imports only the one below it. **Pages never touch the adapter; stores never skip it.**
- Stores own ID generation, timestamps, loading/error state. Seed data lives in `src/data/seed/`.
- Source is chosen by `NEXT_PUBLIC_DATA_SOURCE` (`mock` for the prototype). Wiring a real backend = implement `api-adapter.ts` + flip the env var, **zero UI changes**.

## State & React

- **Zustand** for shared/mutable state (review dispositions, prefs, queue). Local UI state stays in the component.
- Shared mutable state read/written by multiple screens must live in a store, never duplicated in component state.
- **No impure calls during render** (React 19): never call `Date.now()`/`Math.random()` in render — use a lazy `useState(() => …)` initializer or an effect.

## Motion (Framer Motion)

- Use for purposeful transitions (page/section reveals, the nav active-pill `layoutId`, modal/tooltip enter-exit).
- **Don't combine animated `x`/`y` with a manual centering `transform`** — Framer writes `transform`, overriding yours. Animate `opacity` (and position via `style`) instead.
- **Overlays (tooltips, menus, modals) render in a portal with fixed positioning** so ancestor `overflow: hidden` can't clip them.

## Accessibility

- All interactive elements keyboard-accessible with visible focus states (use `--ring-accent`).
- Inputs have associated labels; icon-only buttons get `aria-label`; decorative icons are hidden.
- Use semantic HTML (`nav`, `main`, `header`, `button`, `a`). Meaningful `alt` on images.
- Maintain WCAG AA contrast in **both** themes.

## Before claiming work is done

- Run `npx tsc --noEmit` **and** `npx eslint src --ext .ts,.tsx` — both must be clean.
- Hit the affected routes (expect 200; no runtime/console errors).
- State what was verified honestly. The user does the final **visual** confirmation in the browser.
