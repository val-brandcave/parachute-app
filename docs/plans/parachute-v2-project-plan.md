# Parachute v2 — Prototype Project Plan

> For Cody, to inform the high-level Definition of Done shared with Ed. Working back from a **mid-July 2026** product-delivery target, leaving runway for an engineering team to build from the prototype.

## Objective
Deliver a **clickable, dev-introspectable Next.js prototype** of Parachute v2 — the standalone, output-control redesign — that the sales team can demo and an engineering team can build the real product from. **Not Figma, not production.** Val owns the front-end and a mock service layer; **no API ownership.**

## What "done" means for the prototype
1. Every screen in the IA route map is navigable and visually polished (refined navy/gold Material look, Framer Motion transitions).
2. The core happy path is fully clickable against seeded mock data: **Login/launch → Dashboard → Order → Technical Review (accept/reject/edit + side-by-side PDF) → Builder → Workbook (sign / return) → Administrative Review.**
3. A clean **mock service layer** (data-adapter pattern) sits behind every screen so engineering flips one env var to wire real APIs — zero UI changes.
4. Separate repo, README documenting the data model, collections, and adapter swap.

## Approach & stack
- **Next.js (App Router) + TypeScript**, Tailwind, Zustand stores, Framer Motion.
- **Mock service layer** = the data-adapter pattern (`plans/data-adapter-pattern-guide.md`), adapted to Next (`NEXT_PUBLIC_DATA_SOURCE`, client-side seeding). Page → hook → store → adapter → mock(localStorage) | api(stub).
- Refine, don't redesign: keep Ed's brand (navy `#10344C`, gold `#c9a84c`), elevate execution.
- Logos from `assets/logos`.

## Sprint plan (working back from mid-July)

### Sprint 0 — Align & scaffold (this week)
- Confirm plan with Cody; share IA route map.
- Scaffold Next.js repo, design tokens, app shell (top bar + nav rail + review context bar), adapter layer + seed data, logo integration.
- Deliverable: deployed shell on Vercel that navigates between empty routes. **Come-prepared rule:** link staged before any demo.

### Sprint 1 — Look & feel + the meat *(Cody's stated priority)*
- **Login / launch interstitial**, **Dashboard** (queue + KPIs + filters), and the **Technical Review workspace**: findings list, accept/reject/agree-disagree + comment, confidence, **side-by-side PDF page-cite viewer**, workbook rail tally, add-finding.
- Deliverable: "this is the look and feel" demo Ed wants first; the validated core interaction is real.

### Sprint 2 — Output control (the v2 differentiator)
- **Order** flow (YC inbox + upload + pipeline stages), **Builder**, **Workbook** (compile → DRAFT → sign → Complete / **Return to appraiser** with batched corrections), document customization (show/hide, theme, fonts, risk labels/colors; org-level brand defaults).

### Sprint 3 — Compliance + config + edges
- **Administrative Review** (checklist attestation + sign), **Templates** (checklist mapper, response templates, org workbook layout), **Settings** (compliance checklist, bank policy upload, org defaults, auto-reject quality gate), **Intake Triage**.

### Sprint 4 — Polish & handoff
- Motion pass, empty/loading/error states, responsive, audit-log surfacing, README + data-model docs, walkthrough for the engineering team.

## Decisions locked (Jun 10 + follow-up)
- Prototype, not Figma/production; Val = front-end + mock layer only; separate repo.
- Next.js + mock service layer; Framer Motion; refine existing brand.
- v2 is **sales-led** (self-serve blocked by vendor due diligence / GLBA/SOC).
- Integration = SSO pass-through button from YouConnect → standalone app; webhooks; Parachute = source of truth; optional interstitial.
- Sprint 1 = shell + Dashboard + Technical Review.

## Open questions for Cody / Ed
- Account-level vs per-workbook settings split (brand colors/fonts as org defaults) — confirm.
- Notification model for async "review ready" (email near-term; in-app later) — in scope for prototype?
- Is any **YouConnect UI refresh** (notifications, change-log, the painful Word-style editor) part of *this* engagement or separate?
- Confirm pure-prototype vs explicit mock-service-layer hand-off expectations with the engineering team (we're building the latter).
- SSO/auth pass-through details for the shared layer.

## Risks
- Scope creep from adjacent YouConnect issues — keep them logged but out of the Parachute prototype unless Cody pulls them in.
- The Builder/Workbook customization is the deepest surface — time-box and start from the POC's already-working model.
- Brand/compliance accuracy (USPAP/FIRREA/GLBA terminology) — mirror the POC and marketing site; flag anything uncertain to Ed.
