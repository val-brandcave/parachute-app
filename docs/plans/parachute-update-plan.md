# Parachute — Build Brief

**Source of truth:** the wireframe board `Parachute Journeys.dc.html` (frames referenced below by their IDs: `1.1`, `S-A`, `2.3`, etc.) + the Loom transcript. This brief is **intent, not a spec to build verbatim** — expect iteration before/while the in-app build happens.

---

## 0. TL;DR — the one decision that shapes everything

**Build ONE app with three entry modes — not three apps.**

- **Journey 3 (Standalone)** *is* the real Parachute app. Every screen lives here.
- **Journey 1 (Embedded Reviewer)** and **Journey 2 (Org Admin)** are the **same app**, entered via **SSO deep-link** from YouConnect, running in a **scoped "embedded" mode** that changes the *chrome* and the *landing route* — but reuses the exact same screen components.
- The only truly separate surface is the **headless job status inside YouConnect** (`1.1`–`1.3`). That is **YouConnect's UI**, showing Parachute progress via API + webhooks. Parachute renders no page there.

So the answer to "is J1/J2 a different view in the standalone app driven by the entry point?" — **yes, precisely.** Entry point sets a `mode` flag; `mode` decides nav chrome + which route you land on. The screens are shared.

---

## 1. Who the journeys serve (from the transcript)

Two **user types**:
1. **Embedded / YouConnect user** — already works in YouConnect; we must avoid the change-management cost of a second system *and* a second queue.
2. **Standalone user** — lives in Parachute, owns their own queue, and is the path into new verticals later.

Two **personas** cutting across both:
- **90% user** — "upload a doc, give me the workbook," accept as-is.
- **Power user** — wants to open exceptions, verify findings, customize, before trusting the workbook.

The shared destination for both user types is the **Workbook (S-A)** and its satellites (Exceptions, Customize, Sign).

---

## 2. Shared screen inventory (build once, reuse everywhere)

| Code | Screen | Wireframe frames | Phase |
|---|---|---|---|
| **S-A** | Workbook (home base; trust strip, callout, findings, actions) | `1.5`, `3.5` | MVP |
| **S-B** | Exceptions (PDF proofing + pinned annotations + comment thread) | `1.6`, `3.6` | MVP |
| **S-C** | Customize / Builder (panel over workbook, live preview) | `1.7`, `3.7` | Later |
| **S-D** | Sign & finalize (signer/timestamp/hash → FINAL, downloads) | `1.8`, `3.8` | MVP |
| **S-E** | Live Progress (classify → review → compile) | `1.2` (headless), `3.4` (in-app) | MVP |
| — | Settings cluster: Templates, Checklists, Review defaults, Branding | `2.2`–`2.5`, `3.10` | MVP (J2) |
| — | Reviews / queue (property roll-up, opening acts on one output) | `3.9` | Later |
| — | Dashboard (drop zone primary CTA + light queue) | `3.2` | Later |
| — | Source + property form | `3.3` | Later |
| — | Login (SSO primary, work-email fallback) | `3.1` | Later |
| — | SSO interstitial ("Transferring you to Parachute…") | `1.4`, `2.1` | MVP |

**S-A through S-E + Settings are the MVP core.** They power J1 and J2 today; J3's dashboard/queue/login wrap them later.

---

## 3. The session / mode model (the mechanism)

A single context object resolved at entry decides everything:

```
session = {
  source: 'youconnect' | 'standalone',
  mode:   'embedded'   | 'admin' | 'full',
  entry:  { route: '/workbook/:docId' | '/settings' | '/dashboard', docId? },
  return: { system: 'youconnect', recordId, callbackUrl } | null
}
```

Chrome + behavior react to `mode`:

- **`embedded`** (J1): no dashboard / no queue / no cross-review nav; single-document scope; show the **"Single document · returns to YouConnect on sign"** trust strip (`1.5`); **Sign → push result back to YouConnect + close** (not "drop into reviews list").
- **`admin`** (J2): Settings-only nav (Settings / Templates / Checklists); no queue, no reviews list, no document workspace.
- **`full`** (J3): everything — login, dashboard, queue, source form, settings, the lot.

Same React/screen components; the **shell** (nav, header, post-sign behavior) is the only thing that branches.

---

## 4. Journey-by-journey flow

### Journey 1 — Embedded Reviewer `[MVP]` — `source: youconnect, mode: embedded`
1. `1.1` **Trigger** — inside **YouConnect**: user hits "Run Parachute" on an appraisal (or it auto-runs on delivery). → Parachute **API: create job**.
2. `1.2` **Running (headless)** — **YouConnect UI** shows classify → review → compile progress (via webhook/poll). No Parachute page opens.
3. `1.3` **Result ready** — YouConnect shows "Parachute: Ready" + notification. Two paths:
   - **Accept as-is** → done, result attached in YC. (90% user.)
   - **Adjust in Parachute** → `1.4`.
4. `1.4` **SSO handoff** — interstitial loader; OIDC/SAML, no new login.
5. Lands **directly on `S-A` Workbook** for that one doc (no dashboard). → optional `S-B` exceptions, `S-C` customize.
6. `S-D` **Sign** → DRAFT→FINAL, **push PDF/DOCX/ZIP + audit trail back to the YouConnect record**, then return to YC.

### Journey 2 — Org Admin `[MVP-lite]` — `source: youconnect, mode: admin`
1. `2.1` **Entry → SSO** — same interstitial, deep-linked to Settings.
2. `2.2` **Settings home** — "Configure Parachute," card hub. *No queue, no reviews.*
3. `2.3`–`2.5` — Templates & layouts (versioned, promote-to-published), Compliance checklists (upload/version/set-active), Review defaults + Branding (default review type/template, **auto-accept confidence threshold = open question #2**, logo/colors/font).
4. These defaults/templates **feed** the embedded review experience (e.g. checklists drive the admin variant of `S-B`).

### Journey 3 — Standalone `[Later]` — `source: standalone, mode: full`
1. `3.1` Login (SSO primary, work-email fallback).
2. `3.2` Dashboard — **drop zone is the primary CTA**, light queue beneath ("the only journey with a visible queue").
3. `3.3` Source + property form (minimal, prefilled; no YC to pull from).
4. `3.4` `S-E` Live Progress **in-app** (review dominates ~10–20 min; compile is a tick; auto-advances to `S-A`).
5. `S-A` → `S-B` → `S-C` → `S-D` (same shared screens).
6. `3.9` Reviews/queue + `3.10` Settings round out the standalone shell.

---

## 5. YouConnect integration surface (the genuinely-new, non-UI work)

This is where J1/J2 differ from "just another app view." It's **integration**, not screens:

- **Trigger:** "Run Parachute" / auto-on-delivery → `POST` create-job with the doc + property context YouConnect already holds.
- **Headless status:** Parachute emits job state (classify/review/compile, % + ETA) → YouConnect renders progress in *its own* record UI via **webhook (preferred) or poll**. **Decision needed:** does YC render Parachute-provided components/embed, or purely its own UI off our API?
- **Result-ready:** notify YC; expose Accept (finalize in place) vs Adjust (hand-off URL).
- **SSO:** OIDC/SAML federation; the callback resolves to a **deep-link route** (`/workbook/:docId` or `/settings`) with the `session` above.
- **Push-back on Sign:** write FINAL artifacts (PDF·DOCX·ZIP) + signer/timestamp/hash audit record back to the originating YC record.

---

## 6. What this means for your existing Standalone build

You've already built J3. Mapping the wireframe onto it:

**Reuse as-is (or close):** Login, Settings cluster, Sign, Live Progress.

**Modify:**
- **Dashboard (`3.2`)** — make the **drag-and-drop appraisal drop zone the primary CTA**, with the queue demoted beneath it. (You flagged this.)
- **Workbook (`S-A`)** — add the **trust strip** (conditional: shows only in embedded mode), the dismissible **non-blocking confidence callout**, and the three-action footer (Sign / Review findings / Customize).
- **Sign (`S-D`)** — branch the post-sign behavior on `mode` (standalone: stay/queue; embedded: push-back + return to YC).

**Build new:**
- **Embedded shell / mode wrapper** — the chrome that hides queue/nav and adds the trust strip + push-back. This is the bulk of "making J1 work."
- **Exceptions (`S-B`) with inline annotations** — see §7; this is the hard one.
- **Reviews/queue (`3.9`)** as a property-centric roll-up where opening acts on *one output*.
- **YouConnect integration** (§5).

---

## 7. The hard part: inline annotations (`S-B`)

The boss explicitly preferred **contextually-pinned annotations on the uploaded PDF** (Ashore-style), and acknowledged it's "harder to pull off." Realistic approach:

- Render the PDF (e.g. **pdf.js**) as the base layer.
- Overlay **absolutely-positioned annotation pins** keyed to `{page, x, y}` coordinates (normalized to page size so they survive zoom).
- A **synced comment thread** on the right; selecting a pin scrolls/opens its thread and vice-versa.
- **Decisions write back live** (Agree / Override / Flag resolves the finding immediately, updates the workbook).
- **Exceptions-first ordering:** surface the low-confidence findings, not the whole doc.

**Recommendation:** phase it. A v1 could be a findings list with "jump to location"; the spatial-pin proofing view is a fast-follow. Flag this as the highest-effort, highest-risk screen.

---

## 8. Open questions to lock before the in-app build

1. **Embedded scope** — strictly single-document, or can an embedded user see other reviews? (Wireframe implies single-doc.)
2. **Headless rendering** — YC renders our embed/components, or its own UI off our API? Webhook vs poll?
3. **Settings parity** — is J2 settings identical to standalone settings (just entered in `admin` mode)? (Looks yes.)
4. **Trigger** — support *both* manual "Run Parachute" and auto-run-on-delivery, or pick one for MVP?
5. **Auto-accept confidence threshold** — default value + does crossing it skip review? (Open question #2 in `2.5`.)
6. **Standalone push-back** — standalone owns its doc, so no YC push-back, correct?
7. **"Compile" weighting** — confirm it's a quick tick vs the long review stretch (affects the progress UI honesty).

---

## 9. How to hand this to the in-app Claude

- **Don't rely on a canvas link** — the in-app agent may not be able to open it. Instead **attach this `.md` + the wireframe file** (`Parachute Journeys.dc.html`, or screenshots), and tell it to reference frames by ID (`S-A`, `1.4`, `3.9`, …).
- **Suggested build order:**
  1. Shared core screens: `S-A` → `S-E` + Settings cluster.
  2. Standalone shell (`mode: full`): login, dashboard (with new drop zone), source form, reviews/queue.
  3. Embedded mode wrapper (`mode: embedded`) → unlocks J1.
  4. Admin entry (`mode: admin`) → unlocks J2.
  5. `S-B` inline annotations (phase per §7).
  6. YouConnect integration (§5) last, once the in-app flows are solid.
- **Remember:** wireframes communicate *intent and information architecture*, not pixels. Expect to iterate copy, layout, and the annotation UX before and during the build.
