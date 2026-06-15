# Parachute v2 — Prototype

Clickable, dev-introspectable prototype of **Parachute v2** — Realwired's AI
appraisal-review tool for banks. Built for handoff: the UI runs entirely on a
**mock service layer**, and an engineering team can wire real APIs by flipping a
single env var with **zero UI changes**.

> This is a prototype, not production. No real backend, no API ownership here.
> See `../docs/plans/parachute-v2-project-plan.md` and
> `../docs/plans/parachute-v2-ia-route-map.md` for the full plan & IA.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind v4** + design tokens ported from Ed's POC (navy `#10344C`, gold `#c9a84c`, Material 3)
- **Zustand** stores
- **Framer Motion** transitions/animations
- **Mock data adapter** (localStorage) → swappable for a real API

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

`.env.local` controls the data source (defaults to mock if unset):

```
NEXT_PUBLIC_DATA_SOURCE=mock
```

## What's built (Sprint 1)

| Route | Screen | Status |
|---|---|---|
| `/login` | Login + SSO pass-through | ✅ |
| `/launch` | YouConnect → Parachute interstitial | ✅ |
| `/dashboard` | My Reviews (queue + KPIs + filters) | ✅ |
| `/reviews/[id]/technical` | **Technical Review workspace** — findings, accept/disagree/reject/comment, confidence, side-by-side PDF page-cite viewer, workbook tally | ✅ |
| `/reviews/[id]/triage` | Intake triage (auto-rejected) | ✅ |
| `/order`, `/templates`, `/settings`, `.../administrative`, `.../builder`, `.../workbook` | Stubs labeled with their target sprint | 🚧 |

## Architecture — the mock service layer

The adapter pattern (from `../docs/plans/data-adapter-pattern-guide.md`, adapted
to Next.js) keeps a clean boundary between UI and data:

```
Page component  →  page hook  →  Zustand store  →  adapter  →  mock | api
```

Each layer only imports the one below it. The store generates IDs/timestamps and
holds loading/error state; pages never touch the adapter.

### Data model (mock collections)

Seeded into localStorage on first load (`src/data/seed/`). All extend
`BaseEntity { id, createdAt, updatedAt? }`.

- **users** — reviewer profile (name, designation, signature)
- **orgs** — bank brand defaults
- **reviews** — the appraisal reviews (property, bank, loan #, status, riskRating, SLA, pipeline stage…)
- **findings** — per-review AI findings (severity, confidence, page, evidence, audit trail, suggested disposition)

Reviewer dispositions (accept/override/reject/comment) live in the **workspace
store** (`src/store/workspace.store.ts`) — shared state that the Findings,
Builder, and Workbook screens all read/write. The source-appraisal pages for the
side-by-side citation viewer are in `src/data/source-pages.ts`.

### Swapping to a real API

1. Implement the methods in `src/data/adapters/api-adapter.ts` (fetch/axios against `NEXT_PUBLIC_API_BASE_URL`).
2. Set `NEXT_PUBLIC_DATA_SOURCE=api`.
3. Done — stores, hooks, and pages are unchanged.

## Project layout

```
src/
├── app/
│   ├── login/ · launch/                 auth + interstitial
│   └── (shell)/                         app shell (top bar + nav rail)
│       ├── dashboard/                   My Reviews
│       ├── order/ · templates/ · settings/
│       └── reviews/[id]/                review context (tabs + sub-nav)
│           ├── technical/               ★ Technical Review workspace
│           ├── administrative/ · builder/ · workbook/ · triage/
├── components/  shell/ · review/ · providers/
├── data/        collections · adapters · seed · source-pages
├── store/       zustand stores
├── types/       domain + base types
└── lib/         utils (severity/status meta, formatters)
```
