# Parachute v2 — Feedback Log

Single running record of every piece of feedback from Cody (boss) and Ed (client), and which build addressed it. **Purpose: stop feedback being "ignored / forgotten."** Add a row when feedback is raised; update Status when addressed; cite the commit/PR or screen.

**Legend — Status:** 🔴 Open · 🟡 In progress · 🟢 Done · ⚪ Deferred (with reason) · 🔵 Needs decision
**Repeat?** = this point was raised before and recurred (these are the highest-priority — they erode trust).

| ID | Raised | Source | Area | Feedback | Repeat? | Status | Addressed in / Notes |
|----|--------|--------|------|----------|---------|--------|----------------------|
| F-001 | Jun 10 | Cody | Process | Come to meetings prepared (~7 min lost finding the Vercel link). | — | 🟢 | Carried as standing rule. |
| F-002 | Jun 10 | Cody | Design | Inputs should have **white backgrounds**. | Yes (repeated at Jun 10) | 🟢 | Standing rule; verify still honored across new screens. |
| F-003 | early (pre-Jun 23) | Cody | Review Details | Review findings **from the context of the PDF, with annotations** — Ashore-style. You can't tell *where* a finding sits in the document otherwise. | **Yes** — re-raised Jun 23 as "ignored or forgotten" | 🟡→🟢 | **Built (Jun 30) in the run flow's Exceptions (S-B):** PDF is the hero — a 6-page source appraisal (white pages, dark viewer chrome, continuous scroll). Findings are pinned **directly on the document**: the cited span is highlighted inline (severity-colored) with a **numbered margin tag** beside it, synced to the thread; select ↔ scroll-and-focus. Modern evolution of the Ashore pin (anchored to real evidence, not free coords). Ref: https://sea.ashoreapp.com |
| F-101 | Jun 23 | Ed/Cody | Strategy | Product has become **"another queue to manage"**; for the 90% user it feels like *more* work than YouConnect's drag-drop-and-forget. | — | 🔵 | Core rework. Lead with 90% use case (upload→workbook); config opt-in after run. Await wireframes (`cody-userflows-mocks.md`). |
| F-102 | Jun 23 | Ed | Strategy | Need **persona-aware views** (job-manager queue vs. 90% "is it done?" vs. supplemental reader). | — | 🔵 | Define personas in IA before screens. |
| F-103 | Jun 23 | Ed | Architecture | Reconsider **property-centric vs. entity (property + report type)**; decouple UI from hardcoded "technical + administrative only." | — | 🔵 | Needs Ed's decision. MVP stays admin + technical. |
| F-104 | Jun 23 | Cody | Process | Wireframes + revised plan "tomorrow afternoon." | — | 🟢 | Delivered as `cody-userflows-mocks.md` (3 user journeys). Now the rework brief. |
| F-105 | Jun 23 | Cody | Auth | Where is the registration flow? Confirm PLG was deprioritized (bank vendor-approval concern). | — | 🔵 | Confirm before building/removing registration surface. |
| F-106 | Jun 23 | Cody | Review List | **"Clean" not "clean"** — capitalize the findings status chip. | — | 🔴 | P2. Fix chip label casing in the table (filter label already "Clean"). |
| F-107 | Jun 23 | Cody | Review List | Findings/Type **filters should be multi-select**. | — | 🔴 | P2. Code may already be tri-state — verify; fix affordance so it doesn't read like radio/"All X". |
| F-108 | Jun 23 | Cody | Create Review | **Lead with standalone upload** (90% drag-drop), don't default to "From YouConnect." | **Yes** — "why did you ignore my feedback" | 🔴 | **Decision (Jun 30): make standalone the default/first path; YouConnect secondary.** |
| F-109 | Jun 23 | Cody | Review Details | Don't love the multi-pane finding UI — wastes screen space; **display a finding in a sheet.** | — | 🔵→🟡 | Part of R1. Held for wireframes. |
| F-110 | Jun 23 | Cody | Review Details | **"Effectively four sidebars"** (nav + list + focus + PDF) — never good. Use a **list that opens a sheet.** | — | 🔵→🟡 | Part of R1. Held for wireframes. |
| F-111 | Jun 23 | Cody | Builder | Same "four sidebars" critique on the Builder — list-opens-a-sheet instead. | — | 🔵→🟡 | R3. Held for wireframes. |
| F-112 | Jun 23 | Cody | Builder | **No realtime Workbook preview** — add a **Preview button** that opens it for review. | — | 🔴 | R4. Can proceed independent of wireframes. |
| F-113 | Jun 23 | Cody | Administrative | **Preview is cut off at the bottom** (content runs under the taskbar). | — | 🔴 | B1 bug. Height/overflow fix. Can proceed now. |
| F-114 | Jun 23 | Cody | Templates | Response Templates → Org library **master-detail editor is bad UX** — list that opens a sheet. | **Yes** — "previously… really disappointed it's being ignored" | 🔴 | T1. Apply the list-opens-sheet remedy. |
| F-115 | Jun 30 | Brandcave (self) | Documents | **Rendered documents now use fixed WHITE paper in both app themes** (was theme-aware). The workbook (signable deliverable) and the source appraisal (a real third-party PDF) both render on a shared `--paper-*` token scale; only the surrounding chrome follows light/dark. The workbook cover band stays navy. | — | 🟢 | **Flag to Realwired** — reverses the earlier "theme-aware workbook paper" decision. Rationale: WYSIWYG with the downloaded/sent PDF; nobody sends a dark-mode PDF. Also: run-flow workbook is now a paged multi-sheet doc (cover + contents), and the DRAFT diagonal-stripe texture was removed (label kept). |

## How to use this log
- **Every** Cody/Ed note gets a row, same day it's raised.
- Mark **Repeat?** when something recurs — those jump the queue.
- When you ship, change Status to 🟢 and cite the commit/PR/screen in the last column.
- Review this list before each demo so nothing ships still-open silently.
