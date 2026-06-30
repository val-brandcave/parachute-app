# Parachute v2.0 — UX Sync / Run-Flow Review (Processed)

**Meeting:** UX Sync | Realwired
**Date:** June 30, 2026
**Recording:** https://fathom.video/share/8wYsEMHruQ3T9mm4fs-VUN_25EXpdec4 (~30 min)
**Source file:** `meetings/raw-calls/meeting-jun-30-2026.md` (transcript)

> Path note: kept in `processed-calls/` (with the `parachute-` prefix) to sit beside the Jun 10 / Jun 23 processed docs, rather than the loose `docs/meetings/` path in the brief.

## Attendees
- **Edward "Ed" Kruger** — Realwired (client; product owner of Parachute & YouConnect). *Joined ~8:36, late.*
- **Cody Miles** — Brandcave (agency owner / my boss).
- **Val Vinnakota** — Brandcave (me).

> Shape of the call: **first ~8 min = Val demoing the run flow to Cody alone** (Cody's UI feedback); **from 8:36 = Ed joins**, Cody re-states the key points for Ed, and the conversation goes strategic (inline-edit overwhelm, the compounding-document/citation problem, finding-action semantics, the dashboard/drop-zone route, and ordering both review types).

---

## TL;DR

We demoed the **J3/J1 run flow** that shipped this week — the YouConnect→Parachute handoff, the confirm gate, the scanning/progress interstitial, the paged "PDF" workbook (cover + contents + Letter sheets), the annotated source-appraisal **Findings** view, and the standalone drop-zone path.

**Reaction was positive and the timeline holds.** Cody: *"a pretty good representation other than the UI things I called out."* Ed: *"this is really good… 80%."* This is **refine-and-rearrange, not rebuild** — but there's a meaningful cluster of changes, two of which are **repeat feedback** (jump the queue).

The substance breaks into four buckets:

1. **Confirm-gate / ordering model.** **Review type must come first, above the property inputs** (repeat — "a very big concern from the last call"), because inputs are *dependent on* review type and not all types are property-based. And: **one PDF upload, with the ability to select multiple review types in one order** — because **80% of users order both technical + administrative** and must never re-upload the same doc twice.
2. **Findings model maturing.** Ed confirms **inline edit is a must**, but users *"get overwhelmed when it feels like they're building something."* The real complexity is the **compounding document**: a finding influences others, so each annotation needs **citations / proof-points** (this finding exists *because* of things said elsewhere). Action language changes from **Agree/Override/Flag → Accept / Remove / Reject + an Edit function**, and **changes regenerate the workbook** (not live updates). Annotation highlights are **too small**; for vector PDFs **highlight-only** is fine (the right-margin tags are the scanned/OCR fallback).
3. **Drop zone gets its own route.** The drop zone should **not** be combined into the dashboard — it's a **dedicated full-page route reached from a primary nav action above Dashboard** (repeat — Cody's wireframe intent). Dashboard stays secondary/informational. Ed separately flagged the current dashboard reads as anxious blank space with no primary-color CTA.
4. **Polish.** Workbook: **cover page and table of contents each become their own page.** SSO handoff stepped-completion should be **consistent** with the progress screen's pattern. **No theme switcher** is reachable in the takeover (everything must support dark + light). Vercel deploy has a **wrong root dir** (showing empty) — fix and share with Ed.

**One thing we can stop doing:** the lost "accept-as-is" interstitial is **not needed** — landing on the workbook with Sign as a required action already covers the 90% user (Cody's call).

---

## Decisions made

| # | Decision | By | Area |
|---|----------|-----|------|
| D1 | **No separate "accept-as-is" interstitial.** Landing directly on the workbook + Sign-as-required-action covers the fast/90% user. | Cody | Run flow |
| D2 | **Review type moves ABOVE the property inputs**, and the inputs become **dependent on the selected review type** (not all types are property-based). Likely a dropdown/larger selector. | Cody *(repeat)* | Confirm gate (`RunConfirm`) |
| D3 | **One PDF upload + select multiple review types in a single order.** No re-uploading the same doc; bulk *multi-appraisal* processing is deferred (not the primary flow). | Cody + Ed | Order / run flow |
| D4 | **Drop zone = its own full-page route**, reached from a **primary nav action above Dashboard**; dashboard is demoted to secondary/informational. Don't fold the drop zone into the dashboard. | Cody *(repeat)* | Nav + Dashboard + new route |
| D5 | **Findings changes regenerate the workbook** — the workbook does *not* live-update; user refreshes/regenerates to see edits. | Cody | Findings → Workbook |
| D6 | **Finding-action language changes: Agree/Override/Flag → Accept / Remove / Reject, plus an inline Edit** function on the finding. (Exact old→new mapping to reconfirm.) | Cody | Findings |
| D7 | **Cover page and table of contents each become their own standalone page** in the workbook PDF (currently the cover band + contents share a page). | Cody | Workbook |
| D8 | For layered/vector PDFs, **highlight-only annotation is fine** — the right-margin numbered tags are the **fallback for scanned/flattened/OCR'd PDFs.** (Keep one or the other per PDF type; "something to talk about.") | Cody | Findings |
| D9 | **Bulk multi-appraisal processing = deferred.** Users work one file at a time; batching is a power-user nice-to-have, not MVP. | Ed | Order / queue |

---

## Part 1 — Cody-only review (first ~8 min, run flow demo)

- **SSO handoff stepped-completion** — Cody: the handoff screen showing "each step being completed" reads better than how the **other** stepped screen does it, *"which was not consistent."* Val had made them intentionally different ("because it's transitioning") but agreed to **unify the pattern**.
- **Workbook PDF** — *"Make the cover page its own page and the table of contents its own page."* (D7)
- **Annotations too small** — *"The annotations are really small in this app… going to need to be larger."* Ashore has big ones; Val's tags are small but click-to-highlight and aligned. → enlarge.
- **Two annotation types** — highlights over the PDF (great *if the PDF is vector/layered*) + right-side tags. For **scanned/flattened/rasterized** PDFs you can't highlight; that's where OCR-driven side comments come in. Cody: if you're doing highlights, **just do the highlight**; the side annotations are the scanned-PDF path. *"Something to talk about."* (D8)
- **Lost "accept-as-is" interstitial** — Val flagged a missing post-processing "accept as-is" step for the fast user. Cody: **fine as-is** — they still land on a workbook and Sign is required. (D1)
- **Confirm step — review type first** *(repeat, emphasized)* — *"you have to select the review type first in order to know the inputs. So review type should be above all these other inputs."* Tied explicitly to the last call's concern that **there will be review types that aren't property-specific**, so inputs must be review-type-dependent. (D2)
- **Dark mode / no switcher** — Cody noticed everything was being shown in dark mode and **there's no theme switcher** reachable in the takeover. Val: *"everything needs to support dark mode."* → ensure both themes + a reachable switcher in the run-flow chrome.
- **Vercel deploy broken** — Val: root directory was wrong so the deploy shows empty; will fix. Cody: yes, **share the link with Ed today** once fixed.
- *(Process, non-app)* **Reaching Ed** — he doesn't watch email; **ping him on Outlook**. *(Side note: a small WordPress/Flywheel HTML→template job is coming for Val later this week — unrelated to Parachute.)*

## Part 2 — With Ed (strategic, from 8:36)

### Inline edit is a must — but "building" overwhelms people
Ed: the user journey is on the right track and lets both personas find their path. **The loudest feedback he's getting: inline edit is essential.** BUT — *"when the editing and the accepting and the rejecting and the formatting feels like they are building something, they get overwhelmed."* → The edit/accept/reject/format surface must **not feel like authoring/building**.

### The compounding document → citations / proof-points
- Ed: findings form a **compounding document** — agreeing/changing one *"will influence the others."*
- Cody reframed the requirement: an annotation/comment *"was created because other things were said in different parts of the app"* → we need **citations around an annotation**: *"this annotation was created because these other things were said as proof points."*
- Context Ed gave (the engine): a **5-stage system** — (1–2) extract info + apply rules, (3) **blind audit** ("can I believe the extraction"), then a **subjective layout** of yes/no/maybe questions that influence the result, distilled **per category** but with a compounding effect.
- **Ed will send Cody the raw output + an anonymized example PDF** to inform the citation/annotation design.

### Disagree → what's the consequence (Override vs Reject) + workbook regeneration
- The agree/disagree/flag exists because users fear an **auditor** seeing a "major risk / failed / glaring" finding the bank gets dinged on — they want to **modify the output and keep an ordered, defensible log**, while also hiding/showing items.
- **Semantics:** *Override* = "it's not *this* problem, it's *that* problem" (substitute your own). *Reject* = "don't make this a concern in the workbook at all."
- Cody: changes here **don't live-update the workbook — it has to be regenerated.** (D5)
- Cody: language should be **Accept / Remove / Reject + Edit** (not Agree/Override/Flag); add an **edit function** on the finding itself. (D6)

### Prompt-tuning / user rules (idea — not committed)
Cody floated (self-labeled "VP of scope creep") letting users do light **prompt tuning / user-level rules** — *"I'm looking for these particular things," "structure findings this way," "don't treat X as a finding."* Ed: they already ingest **bank policy documents** as fine-tuning context; **user-based rules** beyond that are *"a can of worms… prompt injection… interesting idea, need to play with it."* → **Explore later, not now.**

### Standalone demo → dashboard & the drop-zone route
- Ed on the **dashboard**: *"missing a primary color to draw attention to the call to action… feels like a lot of blank space, which creates anxiety… balance is off… with the graph on the bottom, it feels like missing information."*
- Cody (architecture, *repeat* of his wireframe intent): **don't combine the drop zone into the dashboard.** Put a **primary nav action above Dashboard** ("Create appraisal / Create workbook / Order report") → a **dedicated full-page drop-file route** → into the flow. *"Let the dashboard be."* The app's primary purpose is **drop appraisals → get output**, not queue/dashboard management. (D4)

### Ordering both review types (the 80% case)
- Ed: *"the majority order both — 80% of us order both technical and administrative."* They go to different places in YouConnect; the report is **two separate PDFs, not one combined.**
- Cody: today there's **no way to order multiple review types at once**; you must not re-upload the same doc twice. Resolution: **one PDF, select multiple review types** in the same order. (D3) Bulk *multiple appraisals* = deferred. (D9)

---

## Wins ✅
- **Positive reception + timeline intact.** Ed: *"this is really good… 80%."* Cody: *"we're really close."* Target stays **July**.
- **The run flow read as a faithful representation** of Cody's flowchart — *"a pretty good representation other than the UI things I called out."*
- **Ashore-style annotation direction validated** (F-003) — the critique is *size and robustness*, not the concept.
- **Strategic clarity gained:** inline-edit is confirmed essential; the compounding-document/citation problem is now named; finding-action semantics and workbook-regeneration are pinned down.
- **One scope reduction:** the "accept-as-is" interstitial is **not** needed (D1).

## Fails ❌
- **Repeat misses (trust-eroding, top priority):**
  - **Review type above inputs** was raised last call and not carried through (D2).
  - **Drop zone as its own route** (not on the dashboard) was Cody's wireframe intent and the design reference he'd just shared that morning (D4).
- **Annotations too small** — didn't match the Ashore reference scale.
- **Confirm gate ordered property-first** — inputs precede the review type they depend on.
- **Drop zone folded into the dashboard**, producing the "anxious blank space / off balance / missing-info graph" dashboard Ed reacted to.
- **No theme switcher reachable** in the takeover; demo ran entirely in dark mode.
- **Vercel deploy empty** (wrong root dir) — couldn't share a working link mid-call.

---

## Task List

> **Priority:** **P1** = explicitly called out and/or **repeat** feedback, or needed to turn the build around for July · **P2** = polish/consistency/bug · **P3** = deferred / explore later.
> **Surface** maps to `components/run/` and shell areas per AGENTS.md. *Nothing is being built yet — this is the lay-out only.*

### Confirm gate & ordering (P1)
| # | Task | By | Surface | Repeat? |
|---|------|-----|---------|---------|
| C1 | **Move the review-type selector above the property/identity inputs** and make the inputs **dependent on the selected review type** (a larger selector / dropdown; account for non-property review types). | Cody | `RunConfirm` (confirm gate) | **Yes** |
| C2 | **Allow selecting multiple review types on one PDF upload** (one order → both technical + administrative; never re-upload the same doc). | Cody + Ed | `RunConfirm` / run + order flow | — |
| C3 | **Drop the "accept-as-is" interstitial** from the plan — confirmed unnecessary (land on workbook, Sign required). | Cody | Run flow | — |

### Findings (P1 unless noted)
| # | Task | By | Surface |
|---|------|-----|---------|
| F1 | **Rename finding actions to Accept / Remove / Reject + add an inline Edit** function (from Agree/Override/Flag). Reconfirm exact old→new mapping. | Cody | `RunExceptions` decision bar |
| F2 | **Regenerate the workbook on findings changes** — add an explicit refresh/regenerate step; workbook is not live. | Cody | Findings → `WorkbookPreview` |
| F3 | **Add citations / proof-points to each annotation** — surface *why* a finding exists and what elsewhere in the doc drove it (the compounding-document requirement). *Design after Ed sends raw output.* | Ed (raised) + Cody (framed) | `RunExceptions` annotation detail |
| F4 | **Enlarge annotations** to match the Ashore reference scale. | Cody | `RunExceptions` highlights + margin tags |
| F5 | **Resolve highlight-vs-margin-tags by PDF type:** highlight-only for vector/layered PDFs; margin/side comments as the scanned/OCR fallback. *(P2; needs discussion.)* | Cody | `RunExceptions` |
| F6 | **Reduce the "building something" feeling** in the edit/accept/reject/format flow (Ed's overwhelm signal). *(Design/UX — partly addressed by F1.)* | Ed | Findings (+ Builder) |

### Dashboard & navigation (P1)
| # | Task | By | Surface | Repeat? |
|---|------|-----|---------|---------|
| N1 | **Give the drop zone its own full-page route**, reached from a **primary nav action above Dashboard** ("Create appraisal / workbook / report"); route straight into the run flow. Remove the drop zone from the dashboard. | Cody | Nav + new route + Dashboard | **Yes** |
| N2 | **Rework the demoted dashboard** — add a primary-color CTA, fix the "blank space / off-balance / graph reads as missing info" feel. *(Partly resolved by N1 moving intake off it; P2.)* | Ed | Dashboard |

### Workbook & document polish (P2)
| # | Task | By | Surface |
|---|------|-----|---------|
| W1 | **Cover page and table of contents each become their own standalone page** in the paged workbook PDF. | Cody | `WorkbookPreview` |

### Run-flow chrome & consistency (P2)
| # | Task | By | Surface |
|---|------|-----|---------|
| X1 | **Unify the SSO handoff stepped-completion** with the progress screen's pattern (consistent step-complete treatment). | Cody | `/launch` handoff + `RunProgress` |
| X2 | **Make a theme switcher reachable in the takeover** and confirm the full run flow supports dark + light. | Cody | Run-flow shell |

### Infra / process (P1)
| # | Task | By | Surface |
|---|------|-----|---------|
| I1 | **Fix the Vercel root directory** (deploy shows empty) and **share the working link with Ed**. | Val | Deployment |
| I2 | **Communicate with Ed via Outlook**, not email (he doesn't watch email). | Val | Process |

### Deferred / explore later (P3)
| # | Task | By | Surface |
|---|------|-----|---------|
| L1 | **Bulk multi-appraisal processing** — queue several appraisals at once (power-user nice-to-have, not primary). | Ed | Order / queue |
| L2 | **User-level rules / prompt-tuning** beyond ingested bank policy documents ("always/never do this"). Flagged as scope-creep + prompt-injection risk; explore, don't build. | Cody (idea) | Templates / Settings |

---

## Ed's deliverables (to Cody)
- **Raw 5-stage output** + an **anonymized example of an actual PDF output** (the hotel appraisal he showed) — to inform the citation/annotation design (F3) and the finding-action semantics.

## Open questions / to confirm
1. **Exact old→new mapping for finding actions** (Agree/Override/Flag → Accept/Remove/Reject/Edit) — confirm with Cody before relabeling (F1).
2. **Highlight-only vs. margin tags** — settle the per-PDF-type rule once we see Ed's real outputs (F5/D8).
3. **How the citation/proof-point UI should read** on an annotation (depends on Ed's raw output) (F3).
4. **Does the multi-review-type order produce two separate workbooks** in one run, or sequential? (Report is two PDFs, not combined) (C2).

## Cody's instructions to Val
- *"Take the transcript from today's call and make the changes we discussed"* (if Ed couldn't attend — he did, so incorporate both).
- Carry the **repeats** through this time: **review type above inputs**, **drop zone as its own route**.
- Fix the called-out items: enlarge annotations, cover/contents as own pages, consistent handoff steps, dark-mode/switcher, Vercel deploy.
- **Turn it around fast** — we're close (~80%) and delivering in July.
