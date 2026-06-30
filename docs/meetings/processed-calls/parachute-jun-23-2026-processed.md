# Parachute v2.0 — UX Sync / Demo #1 Feedback (Processed)

**Meeting:** UX Sync | Realwired
**Date:** June 23, 2026
**Recording:** (none provided)
**Source files:**
- `meetings/raw-calls/meeting-jun-23-2026.md` (transcript — the strategic conversation)
- `meetings/raw-calls/cody-notes-jun-23-2026.md` (Cody's live, annotated UI feedback w/ Loom screenshots)
- `meetings/raw-calls/cody-userflows-mocks.md` (Cody's *follow-up* Loom to Ed — three user journeys, recorded after this call)
- IA plan presented: https://parachute-ia.vercel.app/

## Attendees
- **Edward "Ed" Kruger** — Realwired (client; product owner of Parachute & YouConnect)
- **Cody Miles** — Brandcave (agency owner / my boss)
- **Val Vinnakota** — Brandcave (me)

---

## TL;DR

We demoed the first real build of Parachute v2 (app shell, dashboard widgets, review table, order creation, review details, templates library, org/profile settings). **The look-and-feel and app shell landed well — Ed was complimentary overall** ("this information is a lot better than the one I came up with… good job"; "feels a lot less anxious than mine").

But the demo surfaced **one big strategic problem and a cluster of UI problems.**

- **Strategic (the headline):** In trying to give reviewers control, we built **"another queue to manage."** For the **90% user**, the product now *feels like more work* than the current YouConnect "drag-and-drop, fire-and-forget" button. The fix direction: **lead with the 90% use case — upload → workbook — and make all the configuration/queue machinery opt-in, after the fact.** This requires a persona-aware rethink (job-manager vs. 90% drag-drop user vs. supplemental reader) and reopens whether the system should stay strictly **property-centric**.
- **UI/UX (the cluster):** Several of Cody's notes are **"you ignored / forgot my earlier feedback"** — standalone upload, finding-in-context-of-PDF annotations, the response-template layout, and the multi-pane Review Details. The recurring theme: **too many sidebars; replace persistent multi-pane layouts with a list that opens a sheet, and review findings as annotations on the PDF (Ashore-style).**

**Cody's commitment to Ed:** wireframes + a revised plan "tomorrow afternoon." The `cody-userflows-mocks.md` Loom (three user journeys) is that follow-up and is now the **north star for the rework.**

---

## Part 1 — The Strategic Conversation (from the transcript)

### The core problem Ed is hitting: "it's becoming a queue to manage"
- Parachute gives more **control and peace of mind**, but for the standalone/YouConnect user it has quietly become **a second system with its own queue, assignments, due dates, check-ins, and notifications to manage.** Ed: *"are you really empowering those people to take action, or are you just adding additional work… which might be friction?"*
- The current YouConnect behavior the users love is **drag-and-drop → fire-and-forget → get a Word doc back.** v2 must not feel heavier than that for the majority.
- Reality check on the user base: many are **nitpicky** — e.g. they'll phone Ed because the property address was extracted wrong and refuse to use the tool until it's fixed, even though it's a working (not final) Word product they could edit themselves.

### Personas — the thing Ed is "being hit with the most"
Different user levels need different views. Three reviewer camps Ed described:
1. **"Submit as-is"** — loves it, ships the output as the final product. (Wants the simple *"is my report done?"* view.)
2. **"Make it my own"** — loves it but needs to own the output → uses the **Builder** (own templates, voice, formatting). *Locked in per-user/org, not the default.*
3. **"Supplemental only"** — still reads the full 200-page document; treats Parachute as a quick start.
Plus the **job manager** persona: an "engineering manager for the appraisal department" who genuinely needs the comprehensive queue (what's in, what's due, status, assignments). **The comprehensive queue is right for *them* — wrong as the default for everyone.**

### The 90% use case — the agreed direction
- Cody's framing Ed liked: **upload a document → see the workbook.** Skip the interstitial confirm steps. *Then* let the user "work backwards" — open the annotations, adjust the template — **opt in to configuration after the run, not before.**
- Possible flow Ed sketched: upload → choose document → say what you want → say where to receive it → preview the *template* (not the data) → run; configuration happens later by logging back in.
- **Auto-rejection / quality gates** seen as a *good* opt-in (also drives utilization/cost — more reports run).
- An appraisal still takes **~20 min** to run technical + administrative. Open question Ed posed: is this **queue management** or really **change management** (i.e., maybe it's mostly a notification hub: "is it done?").

### Property-centric vs. entity-centric (Ed's internal debate)
- Today: **property-centric** — one property per review; one property can have multiple outputs/documents. Clean parent→child hierarchy; easy to add outputs to a property.
- Tension: managing one property with **multiple outputs** (e.g. 6 packages) and jumping between **administrative vs. technical** (different configs, templates, endpoints) starts to feel heavy. An alternative entity = **property + report type**, which could route into **different wizards** (administrative looks/feels different from technical) and enable **short forms, evaluation-specific forms, property-type-specific forms** → more order types → more revenue.
- Ed leans property-centric but acknowledges the complexity. **Not resolved.** *Note: the current UI has a strong opinion baked toward exactly two types (technical + administrative); we should make the entity model more generic.*

### Business / scope context
- **MVP at end of July = administrative + technical only** (no other verticals/forms yet). Other form types are future.
- **Target: first non-YouConnect client on the platform by end of July.**
- New verticals beyond banks — esp. **fee appraisers** (already in Realwired's circle; cheaper tier; "run it through us before you send it to the bank"). This also reopens **PLG** (banks need vendor approval; fee appraisers don't), which loops back to the property-centric vs. entity question.
- **Duality of the system** confirmed: (a) Parachute-within-YouConnect via SSO pass-through, and (b) standalone product — but the standalone still carries account-level settings someone has to manage (the friction Ed keeps circling).

### Cody's commitment
> "Let me absorb everything… I'll get back to you tomorrow afternoon with a plan on how to change this… some wireframes of how I think it might go… before we vibe it all out."

→ Delivered as `cody-userflows-mocks.md` (three user journeys: YouConnect 90% user, YouConnect settings/templates user, standalone user). **That Loom is the rework brief.** Key points in it: lead with the 90% drag-drop; headless run inside YouConnect with accept-as-is vs. adjust-in-Parachute; interstitial "porting you over" screen; **annotations done contextually within the uploaded PDF**; auto-detect document type on upload.

---

## Part 2 — UI/UX Feedback (Cody's annotated notes + Loom screenshots)

> Reconciliation note: the demo build was June 23; the codebase has moved since. Where the *current* code may already address a note, it's flagged **[verify]** below — confirm before redoing work.

### Authentication
- **Where is the registration flow?** Ed/Cody think PLG was deprioritized (bank vendor-approval concern) — but Cody wants this **confirmed**, not assumed. (Ties to the fee-appraiser/PLG reopening above.)

### Review List (`/reviews`)
1. **"Clean" not "clean"** — the findings/status chip renders lowercase **`clean`**; it should be capitalized **`Clean`**. *(Screenshot: green badge reads "clean".)* Small, but it's the kind of polish miss Ed's nitpicky users notice. **[verify — fix the chip label casing in the table, not just the filter label]**
2. **Filters should be multi-select** — the Findings (All findings · Critical · Fail · Flagged · Clean) and Type (All types · Technical · Administrative) rows read/behaved as **single-select segmented controls** in the demo. They must be **multi-select** (combine Critical + Fail, etc.). **[verify — current code may already be tri-state multi-select; if so, fix the *affordance* so it doesn't read like radio buttons / "All X" toggles]**

### Create Review
3. **"Why did you ignore my feedback for standalone upload?"** — the Source step is a segmented toggle with **"From YouConnect" pre-selected** and "Standalone upload" second. Cody's prior feedback (and the userflows mock) is to **lead with the 90% standalone drag-drop** path. This is both a UI ordering fix *and* the strategic 90%-use-case point. **(Need Val to confirm exact prior ask — see questions.)**

### Review Details (`/reviews/[id]`) — the biggest body of work
The through-line of every note here: **too many persistent panes; switch to a list that opens a sheet, and review findings as annotations *on the PDF.***

4. **"I don't love this UI… bad pattern because of screen space. Why wouldn't you display a finding in a sheet?"** — the master finding-list rail + center focus-pane (two coordinated panes) wastes space. *(Screenshot: Findings focus mode.)*
5. **"…especially true because of this"** — when the **Source PDF pane** opens, there are **effectively four columns**: left nav + finding list + focus pane + PDF pane. *(Screenshot: all four on screen; the PDF pane is narrow/cramped.)*
6. **"Bad UI. There is effectively four sidebars on this page. That is never a good decision. Instead of this you have a list view that opens a sheet."** — same critique applied to the **Builder** (sections list + settings editor + live-preview/templates pane + nav). *(Screenshot: Builder 3-pane.)*
7. **Long-standing, "ignored or forgotten" positioning:** findings should be reviewed **from the context of the PDF, with annotations** — you can't tell *where* a finding sits in the document with the current layout. **Reference model: Ashore proofing** (https://sea.ashoreapp.com/review/…). *(Confirmed by viewing it: the document is the centerpiece; numbered annotation pins sit on the page where the issue is; a comments panel lists them; click a pin ⇄ comment.)* **This is the desired interaction for findings.**
8. **"You don't need to preview the Workbook in realtime. Just add a preview button that opens it for review."** — kill the always-on **Live preview** pane in the Builder; replace with an explicit **Preview** button. *(Screenshot: Builder live-preview pane.)*
9. **"Your preview is cut off at the bottom."** — the **Administrative attestation/preview document** is clipped at the viewport bottom (content runs under the OS taskbar). Height/overflow bug. *(Screenshot: checklist Q10–12 with the desktop taskbar showing through.)*

### Template List
10. **"I had given you feedback previously that this is a bad UX. I'm really disappointed that my feedback is being ignored."** — the **Response Templates → Org library** editor is a persistent **master-list + detail-editor** split (group list rail + big editor). Same "list that opens a sheet" remedy Cody keeps asking for. *(Screenshot: `/templates/responses/org` two-pane editor.)*

---

## Wins ✅
- **Overall reaction was positive.** Ed: *"this information I hear is a lot better than the one I came up with. So good job of all of you guys"* and *"this feels a lot less anxious than the one that I had."*
- **App shell & look-and-feel validated.** Cody: *"the app shell, I think, is looking good… one of the same."* Foundation is solid; this is rearrange-and-refine, not start-over.
- **Strategic alignment achieved on the call** — by the end, Ed and Cody converged on the 90%-use-case direction and the persona model. The demo *triggered* the right conversation.
- **The hard pieces exist and work** — order flow (incl. a standalone path), findings decision surface, Source-PDF-with-highlight, Workbook compile, Builder, attestations, templates library, org/profile settings are all built. The critique is about *arrangement and defaults*, which is recoverable.
- **Standalone-by-end-of-July is still on the table** — Ed didn't pull the timeline; he sharpened the requirements.

## Fails ❌
- **Strategic miss — "another queue to manage."** The product optimizes for the job-manager/power user and makes the 90% user do *more* work than today's fire-and-forget. The 90% flow (upload → workbook) is buried behind interstitial confirm steps.
- **No persona differentiation** — one heavy view for everyone; need a simple "is it done?" view vs. the comprehensive queue vs. the builder path.
- **Property-centric assumption is unconfirmed** and the UI is hard-coded toward exactly two review types; the entity model needs to be more generic.
- **Repeat-feedback misses (the most damaging to trust):** standalone-upload lead, finding-in-PDF-context annotations, response-template layout, and multi-pane Review Details were all **previously raised and not carried through.** Cody used the words *"ignored," "forgotten," "disappointed."* → Process risk: **earlier feedback isn't being captured/tracked.** Worth a personal fix (a running feedback log).
- **Concrete UI defects:** lowercase "clean" chip; single-select-feeling filters; cramped 4-column Review Details & Builder; always-on realtime preview; **Administrative preview clipped at the bottom (bug).**

---

## Task List

> Priority: **P0** = blocks the rework direction / strategic; **P1** = Cody explicitly called out, repeat feedback; **P2** = polish/bug. "Current state" reflects the codebase *today* per a fresh read — verify before building.

### Strategic / architecture (P0)
| # | Task | Notes |
|---|------|-------|
| S1 | **Re-architect around the 90% use case:** upload → (run) → **land directly in the Workbook.** Make annotations review, template/builder config, assignments, and queue machinery **opt-in after the run**, not pre-run steps. | This is the core ask. Align to `cody-userflows-mocks.md`. Likely await Cody's wireframes before building. |
| S2 | **Introduce persona-aware views:** a lightweight "is my report done?" experience for the 90% user, separate from the comprehensive job-manager queue. | Define the personas in the IA before screens. |
| S3 | **Decide & document property-centric vs. entity (property + report type),** and **decouple the UI from the hardcoded "technical + administrative only" assumption** so it can support short forms / property-type / evaluation forms later. | Needs Ed's decision (open). Keep MVP = admin + technical. |
| S4 | **Map the YouConnect ↔ Parachute handoff** for the 90% flow: headless run, accept-as-is vs. adjust-in-Parachute, interstitial "porting you over" screen, auto-detect document type on upload. | From the userflows mock. |
| S5 | **Wait for / incorporate Cody's wireframes** (the "tomorrow afternoon" deliverable = userflows mock) before vibing screens. | Don't build ahead of the wireframes on S1–S2. |

### Review Details rework (P1 — large)
| # | Task | Current state |
|---|------|---------------|
| R1 | **Replace the multi-pane finding layout with a list that opens a sheet/drawer** for the individual finding. Eliminate the "four sidebars" condition. | Today: left list rail + center focus pane + on-demand right PDF pane. |
| R2 | **Make the PDF the context for findings — Ashore-style annotations.** Findings render as pins on the page where they occur; a list/comments panel cross-links to them. | Today: PDF is an on-demand narrow side pane with cite-driven highlight; not the primary canvas. This is the long-standing "ignored" ask — prioritize. |
| R3 | **Apply the same "list opens a sheet" remedy to the Builder** (drop the persistent 3-pane). | Today: sections list + settings editor + live-preview/templates pane. |
| R4 | **Remove the always-on realtime Workbook preview; add an explicit "Preview" button** that opens the workbook for review. | Today: Builder right pane is a live mini-preview. |

### Bugs / polish (P2)
| # | Task | Current state |
|---|------|---------------|
| B1 | **Fix Administrative preview clipped at the bottom** (height/overflow so the full document scrolls within the viewport). | Confirmed in screenshot — content runs under the taskbar. |
| B2 | **Capitalize the findings chip: "clean" → "Clean"** (and audit other status labels for consistent casing). | Filter label is "Clean"; the table chip renders lowercase. |
| B3 | **Make queue filters unambiguously multi-select** (Findings + Type), with an affordance that doesn't read like radio/"All X". | Code may already be tri-state multi-select — verify; fix the visual affordance regardless. |

### Templates (P1)
| # | Task | Current state |
|---|------|---------------|
| T1 | **Rework the Response Templates → Org library editor** away from persistent master-detail; use a list that opens a sheet for editing. | Today: `/templates/responses/org` is a list rail + large detail editor. |

### Order flow (P1)
| # | Task | Current state |
|---|------|---------------|
| O1 | **Lead the Create Review flow with the standalone drag-drop path** (90% use case) rather than defaulting to "From YouConnect." | Today: Source step segmented control, "From YouConnect" pre-selected. Confirm exact prior ask first (Q). |

### Process (P1)
| # | Task |
|---|------|
| P1 | **Stand up a running feedback log** that captures every Cody/Ed note + which build addressed it, so "ignored/forgotten" stops recurring. (Could live in `docs/` and link from AGENTS.md.) |
| P2 | **Confirm the registration/PLG status** (deprioritized due to bank vendor approval?) before building or removing any auth/registration surface. |

---

## Resolved (Val ↔ Cody, Jun 30)
- ✅ **Standalone upload (O1):** lead with the standalone drag-drop path; YouConnect secondary.
- ✅ **Findings model (R2):** **PDF is primary** — Ashore-style annotation pins replace the focus-mode; a finding opens in a sheet.
- ✅ **Sequencing:** **hold the big Review Details rework (R1–R3) for Cody's wireframes**; proceed now on the independent items (R4 preview button, B1/B2/B3 bugs, T1, O1, and the feedback log).
- ✅ **Feedback log:** created at `docs/feedback-log.md`, backfilled from Jun 10 + Jun 23.

## Open Questions / To Confirm (for Ed / Cody)
1. **(For Ed) Property-centric vs. entity (property + report type)?** — blocks S3 and the order/wizard model.
2. **(For Ed) Is the 90% experience "queue management" or really "change management / a notification hub"?** — shapes how much queue UI the default user even sees.
3. **(For Ed/Cody) Registration & PLG:** was it deprioritized (bank vendor-approval concern)? Does the fee-appraiser vertical reopen it?
4. **(For Ed) End-of-July MVP scope confirmation:** admin + technical only, first non-YouConnect client live — still firm?

---

## Cody's Commitments to Ed
- Send **wireframes + a revised plan** "tomorrow afternoon" (→ delivered as the three-user-journey Loom, `cody-userflows-mocks.md`).
- Then "vibe it all out" (build) from the aligned direction.

## Cody's Instructions to Me (Val)
- Absorb the persona / 90%-use-case direction; **don't re-vibe screens ahead of the wireframes.**
- Carry the recurring asks through this time: **list-opens-a-sheet** (not multi-pane), **findings annotated on the PDF (Ashore)**, **standalone-first order flow**, **no realtime preview — preview button.**
- Fix the called-out defects (clean→Clean, multi-select filters, clipped Admin preview).
- **Stop losing earlier feedback** — track it.
