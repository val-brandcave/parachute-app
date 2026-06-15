# Parachute v2 — Information Architecture & Route Map

> Alignment artifact for the prototype. Derived from Ed's POC (`references/client-html-mock/parachute-mockups.html`), the Jun 10 2026 kickoff, and the marketing site. Stack: **Next.js (App Router) + mock service layer (data-adapter pattern) + Framer Motion**, refining the existing navy/gold Material look.

## 1. Product in one line
AI appraisal-review for banks: upload a commercial appraisal PDF → pipeline runs a **compliance/administrative review** + a **technical review** → reviewer **controls the output** (accept/reject/edit findings, send back to appraiser, compile & customize a branded **workbook**) → sign off → file as audit evidence.

## 2. Two faces, one app
- **Standalone Parachute** — sold to non-YouConnect customers.
- **Embedded-from-YouConnect** — YouConnect shows a button → **SSO pass-through** → opens this same standalone app (NOT an iframe). Parachute emits webhooks; it is the **source of truth**. An optional **interstitial** ("Transferring you to Parachute…") smooths the handoff.

The prototype builds ONE app and simulates the YouConnect entry via the launch/interstitial route + a "From YouConnect" source in the order flow.

## 3. Route map (Next.js App Router)

```
/login                              Auth + SSO pass-through
/launch                             Interstitial ("Transferring you to Parachute…") — YC handoff sim
/                                   → redirect to /dashboard
/dashboard                          My Reviews — queue + KPIs (DEFAULT)
/order                              Order a Review (From YouConnect inbox | Standalone upload → run pipeline)

/reviews/[id]                       → redirect to /reviews/[id]/technical
/reviews/[id]/technical             Technical Review workspace ★ (findings + side-by-side PDF + workbook rail)
/reviews/[id]/administrative        Administrative Review (checklist attestation + sign)
/reviews/[id]/builder               Workbook Builder (assemble layout — per-review)
/reviews/[id]/workbook              Compiled Workbook doc (DRAFT → sign → complete/return)
/reviews/[id]/triage                Intake Triage (auto-rejected appraisals)

/templates                          Templates hub
/templates/checklist                Checklist Template Mapper (extract bank checklist from .docx)
/templates/responses                Response Templates (org + personal)
/templates/workbook-layout          Org Workbook Layout (builder in org/default mode)

/settings                           Org defaults, compliance checklist, bank policy, reviewer profile
```

★ = sprint-1 priority "meat".

## 4. App shell
- **Top app bar** (navy): Parachute logo/emblem, global search, notifications, help, avatar.
- **Left nav rail** (Material rail): Dashboard · Order · Templates · ⟶(spacer)⟶ Settings.
- **Review context bar** (only on `/reviews/[id]/*`): back-to-queue, property identity (address · type · bank · loan #), **two tabs — Technical / Administrative**, status chips (lifecycle, flagged, pipeline), Download. Technical tab owns a **sub-nav: Findings · Builder · Workbook**.

The Technical↔Administrative tab relationship and Findings/Builder/Workbook sub-nav are the key IA relationships to preserve.

## 5. Core flows
1. **Login → Dashboard.** (or `/launch` → Dashboard when arriving from YouConnect)
2. **Order:** pick source (YC inbox / upload) → choose review types (Technical and/or Administrative) → assign reviewer → run pipeline (staged: S1 Checklist · S2 Validation · S3 Consistency · S4 Analytics · S5 Policy).
3. **Technical review:** findings grouped by severity; per finding **Accept / Disagree-Override / Reject / Comment** (reason captured); click page-cite → **side-by-side PDF** with highlighted excerpt + confidence; "Add finding"; workbook rail tallies dispositions.
4. **Builder → Workbook:** assemble/reorder sections, show/hide, theme/font/risk-label customization → compile branded doc → **DRAFT** watermark → **sign** (name/timestamp/hash) → **Complete** OR **Return to appraiser** (batched corrections letter).
5. **Administrative review:** AI pre-fills bank checklist (Yes/No/NA + evidence + page cite) → reviewer attests (changes need audited reason) → sign attestation.
6. **Triage:** auto-rejected appraisal → confirm-return or override-admit (audited reason).
7. **Settings/Templates:** manage compliance checklist template, bank policy upload, response templates, org workbook layout, org defaults (auto-reject criteria, SLA start, brand colors/fonts).

## 6. Data model (mock-layer collections)
Each extends `BaseEntity { id, createdAt, updatedAt? }`. Referenced by id.

| Collection | Key fields |
|---|---|
| `users` | name, designation, signatureName, role |
| `orgs` | name, brandColors, brandFont, defaults (autoReject criteria, slaStart, defaultChecklistId) |
| `reviews` | propertyAddr, propertyType, bank, loanNo, status (`intake`/`autorejected`/`running`/`needs_action`/`returned`/`completed`), reviewTypes[], assigneeId, source (`yc`/`manual`), slaDueAt, pipelineStage |
| `findings` | reviewId, sev (`crit`/`fail`/`flag`/`pass`/`na`), status, confidence, page, question, analysis, evidence, audit, category, topic, material, suggestedDisposition, disposition (`accepted`/`override`/`rejected`/`commented`), reason |
| `checklistItems` | reviewId, group, question, aiAnswer (`yes`/`no`/`na`), confidence, page, evidence, attestation, reason, confirmed |
| `workbookLayouts` | orgId or reviewId, sections[] (ordered, type, enabled), version |
| `docSettings` | reviewId, hideRejected, hideOverridden, showStatus, showConfidence, colorCoding, theme, font, fontSize, header/footer, riskScale[], signed{name,ts,hash} |
| `responseTemplates` | scope (`org`/`mine`), name, group, body (with merge fields) |
| `checklistTemplates` | name, items[] (type `binary`/`qualitative`, mapped/flagged), version |
| `policies` | orgId, fileName, extractedRules[] |
| `ycEngagements` | external delivery metadata (property, doc, SLA) — local + remote-searchable |
| `auditEvents` | reviewId, actor, action, reason, ts |

## 7. Adapter pattern adaptation for Next.js
The guide in `plans/data-adapter-pattern-guide.md` is Vite/React. Changes for Next.js App Router:
- `import.meta.env.VITE_DATA_SOURCE` → `process.env.NEXT_PUBLIC_DATA_SOURCE`.
- No `main.tsx` bootstrap. Seed on the client: a top-level `'use client'` provider (or root layout effect) calls `adapter.seed()` before rendering app content; show a tiny splash until seeded. localStorage is browser-only, so review/workspace pages that mutate state are client components.
- Keep the layering exactly: **Page → page hook → Zustand store → adapter → mock(localStorage) | api(stub)**. Engineering later flips `NEXT_PUBLIC_DATA_SOURCE=api` and implements the API adapter with zero UI changes.
- Shared mutable state (findings dispositions, docSettings, sections) is read/written by Findings + Builder + Workbook screens → must live in shared stores, never local component state.

## 8. Design system (refine, don't replace)
- Navy `#10344C` (+ `#1b4f73`), gold `#c9a84c` (+ `#a8842f`); Material-3 surfaces/elevation; semantic severity colors (crit `#7B1010`, fail `#b3261e`, flag gold, pass `#1d6f42`).
- Fonts: keep Roboto / Roboto Mono baseline; document fonts configurable.
- Logos: `assets/logos` (full + emblem; black/blue/white). White logo on navy bar; blue/black on light.
- **Framer Motion**: route/screen transitions, finding card expand/collapse + disposition state changes, pipeline stage progression, PDF pane slide-in, workbook DRAFT→signed reveal.
- Standing rule: **inputs have white backgrounds.**
