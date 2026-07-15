# Parachute v2.0 — UX Sync / Ed's GA Sign-Off + Refinement Pass (Processed)

**Meeting:** UX Sync | Realwired
**Date:** July 14, 2026
**Recording:** https://fathom.video/share/YUC_zaEZPgq5efV-YGz5pdyP2VXZc19P (~39 min; substantive content ~1:53–14:32, rest is small talk)
**Source file:** `meetings/raw-calls/meeting-jul-14-2026.md` (transcript)
**Cody's notes:** `meetings/meeting-notes/meeting-notes-jul-14-2026.md`
**References:** Loom still (confirm-gate "Change templates" — the out-of-place control): https://www.loom.com/i/9a2c83b8c38445c5b8522a24655876cb — shows *Technical review setup → Workbook layout (Org default, Change ⌄)* over *Administrative review setup → Compliance checklist (Org default, Change ⌄)* above **Start review**.

## Attendees
- **Edward "Ed" Kruger** — Realwired (client; product owner). Gave the sign-off.
- **Cody Miles** — Brandcave (my boss).
- **Val Vinnakota** — Brandcave (me). Drove the demo.
- *Referenced, not present:* **Diego** — Realwired's dev (he'd already approached Val); the build gets pushed to his team.

> Shape of the call: ~7 min birthday/small talk before Cody joins; **1:53–9:40** Ed walks his written feedback on the workbook + admin flow (the 5 refinements below); **9:40–13:14** Val demos the reworked config/Templates IA and admin-checklist authoring, Ed approves each; **13:14** Ed: *"This is ready. I'm happy."* — **the GA sign-off we didn't get on Jul 7**; **13:22–end** Chicago CTO colloquium chatter + the Diego handoff framing.

---

## TL;DR

**This is the follow-through that closes the Jul 7 course-correction.** On Jul 7 Jeff/Ed reopened the whole workflow (findings-merge-into-workbook, inline editing, source-as-truth). We built to that direction; this call Ed reviewed it and **approved it for build** — *"I think I'm happy with the entire flow… this is good enough for us to start building."* No conceptual pushback this time; the feedback is a tight list of **five refinements**, all agreed on-call, plus **sign-off on the reworked configuration IA.**

**The five refinements:**
1. **Hide the "Change template" controls in the confirm gate** behind an Advanced-Settings accordion — Ed feels they're out of place, jump into a jarringly different flow (org template vs. this-appraisal), and he *literally tells demo audiences to skip them.* If he keeps saying "skip this," it's not the right design. Cody: it's a 20% action → tuck it away.
2. **Citations are click-through to a side-by-side source pane.** "This grid appears in appraisal page 47" → click P47 → source appraisal opens **side-by-side** to verify. (Highlight-the-source-text-on-open is a **fast follow**, not v1.)
3. **Drop the annotated source view — show the clean source only.** Remove the Annotated tab. First version just gets reviewers comfortable with the clean document; "highlight a section of source → pull into a finding" is explicitly a fast follow.
4. **Source is read-only / immutable — corrections happen at the attestation level, never on the source.** For admin, the compliance checklist is a published source-of-truth: even in edit mode you can't rearrange or add line items. To change it you edit the source checklist and re-publish for the next round.
5. **Administrative review becomes an auto-review: everything pre-filled, user only acts on disagreement.** The admin review must be *true* for you to accept the technical review — it's the "is this worth reading?" gate. Users are asking "can this part just run automatically?" So: kill the top-of-page "review then confirm" step; pre-select/pre-fill every attestation; the user plows through fast and only stops to say *"I disagree, and here's why."* A "confirm attestation for all" button (already built into the source view) moves onto this surface.

**Plus:** the reworked **Configuration IA landed clean** — "Templates" as an umbrella term was confusing, so it's split into discrete Configure blocks (Org layout, Members & billing, Review defaults, Workbook layouts, Response library, Compliance checklists). Ed: *"Awesome, man. This is ready."* **New-review always returns to the drop zone.**

**Handoff:** Val makes these changes, then updates **Diego** (who already reached out); his team builds from it. Ed is explicit it's **not a formal handover** — *"we're just using this as the design viable… just push it forward and move on."* The Brandcave design remains the reference artifact; Realwired's devs implement.

---

## Decisions made

| # | Decision | By | Area |
|---|----------|-----|------|
| D1 | **GA direction approved for build.** The whole reworked flow (inline-workbook + merged findings + admin) is "good enough to start building." No conceptual rework. | Ed | Roadmap / sign-off |
| D2 | **Confirm-gate "Change template" controls → Advanced-Settings accordion**, hidden from the primary flow. | Ed + Cody | Run setup / confirm gate |
| D3 | **Citations are clickable → open source appraisal side-by-side** to verify (e.g. click "p 47"). | Ed | Workbook / source pane |
| D4 | **Highlight-source-text-on-open + highlight-section→finding = fast follow**, not v1. V1 opens the clean source side-by-side only. | Ed | Source pane (later) |
| D5 | **Remove the Annotated source tab; show the clean source only.** | Ed | Source tab |
| D6 | **Source = immutable truth. Corrections happen at the attestation level, never on the source.** | Ed | Model |
| D7 | **Compliance checklist is immutable at run time** — no drag/rearrange/add-item even in edit mode; change it by editing + re-publishing the source checklist. | Val + Ed | Admin review |
| D8 | **Admin review = auto-review.** Everything pre-filled/pre-selected; the user does nothing unless they disagree (and must state why). Remove the top "review, then confirm" step. | Ed + Cody | Admin review |
| D9 | **"Confirm attestation for all" button moves from the source view onto the admin attestation surface.** | Val | Admin review |
| D10 | **"Templates" umbrella term retired**; configuration split into discrete Configure blocks. Approved as demoed. | Val (proposed) + Ed (approved) | Config IA |
| D11 | **Members & billing added** to Configuration (wasn't in original discovery). Pricing model still unknown → open question. | Val | Config IA |
| D12 | **Starting a new review always routes back to the drop zone.** | Val | Navigation |
| D13 | **Not a formal handover.** Design is the reference; Val notifies Diego when refinements land; Realwired's team builds. | Ed | Process |

---

## What Ed said, refinement by refinement

### 1. The "Change template" control in the confirm gate feels out of place
> *"If you go all the way to the bottom where you confirm it… for some strange reason it just feels slightly odd, slightly out of place… it jumps into such a different flow. It feels like you're now changing this organizational template — or are you changing it for the appraisal? … in the demos I literally tell everybody, just skip this. And I feel if I keep telling people to skip this, it's probably not the right design."*

Cody reframed it as an 80/20 question: *"Of the percent of users who are going to change it, is that in the 80% or the 20%? … put that secondary information under some sort of advanced-settings accordion — we don't show it to the user unless they need to go find it."* Ed: *"That's a much better way… let's just hide the information inside."*

**The control in question** (from the Loom still): the run-setup confirm screen shows *Workbook layout → "Org Workbook Layout — Commercial" [Change ⌄]* and *Compliance checklist → "Demo Bank — Commercial Review Form" [Change ⌄]*, then **Start review**. The two "Change" affordances are what read as out of place — they hand you into a template-management flow mid-run and blur "is this org-wide or just this appraisal?"

### 2. Inline edits are loved; citations need to jump to source
> *"We love the inline edits… what I love is when people say 'we'll never be able to edit this graph' — wonderful, because now you're worrying about what's in the document, not seeing it for what it is."*

The one addition: *"where we say, for example, this grid appears in appraisal page 47 — we want to click on those and see the source information… document and verify. We just want the ability to jump. When you click P47… the source pops up as a side-by-side comparison."*

### 3. Drop the annotated view, show the clean source
> *"If you open up the source and I've dropped the information in here — all of the annotated information — we're going to drop that section. We're just going to show the clean… it causes confusion where people are like 'why am I editing these findings, what did they mean?' For the first version we're just going to get them comfortable with this, then we'll expand into highlighting a section of the source and bringing it into a finding — but that's a fast follow."*

### 4. Source is read-only; corrections live at the attestation level
> *"We do not want to edit source. You can't edit the source. That is a final, true, last version… for us the correction always happens on the attestation level."*

Val clarified the distinction, which Ed accepted: in **worksheets** the user can add findings freely; but the **compliance checklist** is based on a system source-of-truth, so the user answers/reviews attestations but **cannot drag-drop or add a new line item.** To change the checklist you edit the source doc and publish for the next round.

### 5. Administrative review = auto-review, act only on disagreement
> *"The administrative needs to be true for you to accept the technical review… it's basically saying it's worthwhile continuing to read this document. The administrative effectively becomes an auto-review checklist. We don't want to attest it as much… we want to accept every single thing the system has filled out unless you disagree — allow you to plow through this fast so you can get to the meat."*

Cody, crisply: *"We don't need to do anything for the administrative review. We would only say when we disagree."* And on the current UI: *"You have this whole 'review, then' step at the top — skip it, dude. It's all done for you. The user reviews; if they disagree, they say why."* Val: *"I have that ['confirm attestation for all'] button in the source; I'll bring it here."*

---

## The config/Templates IA rework (demoed 9:40–13:14, approved)

Val walked the reworked Configuration surface; Ed approved throughout and closed with *"Awesome, man. This is ready."*

- **Why the change:** *"'Templates' as an overarching term is a little confusing… they're all different sets of configuration, so I brought them into separate blocks."*
- **Blocks shown:**
  - **Org layout** — org identity, branding, typography (workbook branding defaults, customizable per-run).
  - **Members & billing** — *new; not in original discovery.* (Pricing model TBD — Val: *"I'm not sure exactly what your pricing is on."*)
  - **Review defaults** — the reject/"liberty" criteria (add new criterion to reject), SLA timers, acceptance rate, confidence threshold; **deliverables by review type** (which deliverables default per review type, manage them in their own blocks).
  - **Workbook layouts** — the technical-review workbook structures.
  - **Response library** — org vs. personal grouping; view / edit / save changes / add new template; confirm personal vs. org scope.
  - **Compliance checklists** — list of org checklists, one default, published versions; **upload new checklist → name it → extract items into a checklist template → review extracted items (split double-barrelled questions, add items if needed) → save & publish.** Once published, that's the document the admin review runs on.
- **Nav:** starting a new review **always returns to the drop zone.**

---

## Wins ✅
- **GA sign-off achieved.** *"This is ready. I'm happy… good enough for us to start building."* The Jul 7 reopening is closed; the inline-workbook direction is validated as built. Complete turnaround from a week ago.
- **Inline editing landed exactly right** — Ed's "we love the inline edits" is the strongest possible endorsement of the risky Jul 7 pivot.
- **Config IA rework accepted wholesale** — the "Templates was confusing" problem (see [[config-ia-overhaul]]) is resolved; no re-theorizing needed.
- **Feedback is now refinement, not redirection** — five bounded, agreed changes vs. a workflow rethink. Signals the design is converged.
- **Clear handoff path** — Diego already engaged; Realwired's team builds from our reference.

## Fails / watch-outs ❌
- **Members & billing has no pricing model behind it** — Val floated it without knowing Realwired's pricing. It's a plausible-but-unbriefed block; risks building UI for a commercial model that doesn't exist yet. → open question for Ed.
- **"Fast follow" scope is verbal, not written** — source-highlight-on-open and highlight→finding got deferred in conversation. Easy to lose or to have Diego's team assume it's in v1. Needs to be captured explicitly in the handoff.
- **Handoff is informal by design** — Ed explicitly *doesn't* want a formal handover ("not doing a handover approach… just push it forward"). Upside: momentum. Risk: decisions live in this transcript + the artifact, not a spec Diego's team signs off on. If the build drifts, there's no contract to point at. (Consistent with [[prototype-not-production]] — we deliver the viable design, they productionize.)

---

## Task List

> **Priority:** P1 = on the refinement critical path Ed expects before notifying Diego · P2 = required, sequenceable · P3 = deferred / fast-follow.
> Format per task: **what was said/requested → my approach → my take.**

### P1 — the five refinements (do these, then notify Diego)

**T1 — Hide the review-setup blocks behind an "Advanced" chevron + three sibling run-setup fixes** *(D2)*
- **Requested (corrected after Val's walkthrough + screenshots):** On the run-setup screen, the **Technical review setup** block (shows the default workbook layout) and **Administrative review setup** block (shows the default compliance checklist) currently sit in full view under **Property details**. Ed wants these two bottom blocks **collapsed behind an "Advanced" (chevron) control** — the defaults are already correct, so the blocks only appear/expand *if* the user chooses to look in and change them. Three related asks came out of the same screen:
  - **Remove the "coming soon" review-type cards** (*Evaluation*, *Vendor short form*) from the app — the pattern for how future review types populate is already clear, so the placeholders add nothing.
  - **Cancel / Start review → sticky footer.** Today they're at the *bottom of the scroll*, which forces users to scroll past everything to act. Put the CTA + Cancel in a persistent footer on the wizard.
  - **Rename the page title** from *"Confirm & set up the review"* to something more neutral/better (the "confirm & set up" framing over-promises a setup task when the point is that setup is already done).
- **My approach:** Under Property details, render an **"Advanced ⌄"** disclosure (collapsed by default) that contains the two setup blocks unchanged; collapsed state shows nothing extra (the resolved defaults are implied, not restated), matching Ed's "don't show it unless they go find it." Delete the two placeholder review-type cards from the type list. Add a sticky footer bar (Cancel left, **Start review** right) that stays pinned as the form scrolls. Retitle the page — candidates: **"New review"**, **"Start a review"**, or **"Review setup"** (I lean "New review" — neutral, matches nav language). This lives on the [[queue-wizard-details]] run-as-review-details page.
- **My take:** Straightforward and all four are right. The disclosure is the core; the sticky footer is the quiet win — it's what actually stops the "scroll through everything" behavior Ed dislikes, more than hiding the blocks does. On the title, confirm the wording with Val/Ed rather than guess.

**T2 — Clickable citations → cited source area, side-by-side in the SAME screen** *(D3)* — **needs a pattern decision**
- **Requested (clarified):** In the **workbook AND the attestation document**, wherever a citation appears (p.1, p.4, p.47…), make it clickable. Clicking shows the **cited area of the source document beside the workbook in the same screen** — explicitly *not* the separate read-only source page. Ed: "see the workbook and the cited area of the source document side by side." Open question Val raised: show the **full source page (scrolled + focused on the citation)**, a **snippet only** (Val: "kinda defeats the purpose maybe"), or a smarter pattern.
- **My approach:** Built a pattern-options artifact for Val to choose from → **https://claude.ai/code/artifact/a1eb5a0b-b9b2-47ab-bea4-12559e25ac2f**. Three candidates: **(A) Focused full page** — right split-pane opens on the cited page, auto-scrolled with the passage highlighted, page still scrollable [recommended]; **(B) Snippet popover** — a card floats from the citation with just the extracted quote [rejected as primary]; **(C) Progressive** — hover-peek snippet, click to expand into A's full page [good fast-follow]. One shared SourcePane serves workbook + attestation.
- **My take:** **Ship A.** Verification is worthless against a snippet — the snippet is exactly what the AI chose to show, so you need the surrounding paragraph to catch out-of-context errors; B looks efficient but quietly defeats the purpose. Layer C's hover-peek later (additive). **Open dependency:** citation anchor granularity — page-level vs paragraph-level. A lands on the page either way, but the *passage highlight* needs paragraph anchors; if we only have page-level today, highlight the page and fold passage-highlight into the C fast-follow.

**T3 — Source read-only ⇒ remove/defer the Clean|Annotated toggle + the annotated Findings surface** *(D5)*
- **Requested (clarified):** Making the source page read-only means the **Clean | Annotated** toggle and the **annotated Findings surface** (the source-annotation decision view with evidence + AI audit trail per finding) come out of v1. Val's call: remove or **defer properly** — make a **V2 reference** and **archive the code so it won't re-emerge in the build unless someone is explicitly exploring future versions**. Val has the screenshots, so it can always be rebuilt; the priority is that it doesn't clutter the current build.
- **My approach:** Remove the Clean|Annotated toggle; the SourcePane (T2) renders the clean document only. For the annotated Findings surface: move the components out of the active render path into an **`_archive/` (or `future/v2/`) folder** excluded from routing/imports, with a short **`V2-source-annotation.md` note** in `docs/` linking the screenshots + describing what it was and why it's parked (per Jul 7's fast-follow: highlight-a-source-span → create-finding). This keeps `tsc`/build clean without deleting institutional memory. Preserve the underlying annotation data model behind the archive so a V2 revival isn't from-scratch.
- **My take:** Right approach and the archive-with-reference instinct is the correct one — deleting outright loses weeks of work that Ed explicitly called a *fast follow* (not a *never*). Folder-exclude + a one-page V2 note is the clean way to park it: invisible to the build, trivially recoverable. Make the archive note point at Val's screenshots so a future session doesn't have to reverse-engineer intent.

**T4 — Attestation doc: no add-item, no reorder (as already built)** *(D6, D7)*
- **Requested (clarified — narrower than I first read it):** On the attestation document in an admin review, the user **cannot add more compliance-checklist items and cannot drag/reorder them** — which is *already how it's built*. This is a confirm-and-lock, not new work. (The broader "source is immutable, corrections at attestation level" principle still holds, but the concrete T4 ask is just this constraint on the attestation doc.)
- **My approach:** Verify the current attestation-doc build exposes **no add-item and no drag-reorder** affordances in either view/edit mode; the only per-row actions are attest/confirm/change (feeds T5). No new UI. If any add/reorder handle is present, remove it. Changes to the checklist itself happen only via the Configuration → Compliance checklists edit + re-publish flow ([[checklists-mapper-redesign]]).
- **My take:** Fine — it's essentially a regression guard. The value is making sure the T5 confirm-all rework doesn't accidentally reintroduce structural editing on the attestation doc. Nothing to design.

**T5 — Admin review → accept-by-default "confirm all" + remove the header banner** *(D8, D9)* — **needs a pattern decision**
- **Requested (clarified):** Two parts. (1) **Remove the header banner** in the admin review that tells users to attest-the-usual / review-the-others — Cody: *"you have this whole 'review, then' step at the top — skip it, dude. It's all done for you."* / *"we don't need to do anything for the administrative review; we would only just say when we disagree."* (2) The attestation doc (edit mode) **already** shows the AI's pre-selected answers, but the user still has to confirm each, and some are flagged by the AI for careful review (low confidence — which Ed is fine with, though he believes admin reviews are robust). Need a way to **confirm all directly**; to change one, the user selects the other answer + gives a reason. Treat AI suggestions **as the attestation already**. Val's open question: **do we label untouched rows "attested by AI"** (show provenance) if the user hasn't changed the suggestion?
- **My approach:** Built a pattern-options artifact → **https://claude.ai/code/artifact/a1eb5a0b-b9b2-47ab-bea4-12559e25ac2f**. Three candidates: **(A) Pre-attested + "Confirm all"** — rows pre-filled + tagged "AI suggested," one button attests all, per-row "Change" reveals a reason field [recommended]; **(B) Confidence-tiered** — high-confidence auto-attested & summarized, only AI-flagged low-confidence items surfaced [keep in pocket]; **(C) Silent / sign-only** — no per-row confirm, just sign [rejected, weak audit]. Remove the banner outright; if anything replaces it, a one-line helper, not a review instruction.
- **My take & answer to the provenance question:** **Ship A, and yes — show the label, and let it carry state:** before confirm → **"AI suggested"**; after *Confirm all* → **"Attested"** (audit note: "confirmed by you via Attest all; originally AI-suggested Yes"); if changed → **"You changed" + reason**. This makes "Confirm all" one **explicit, timestamped, attributed** act — the click *is* the human touch, reconciling Ed's "accept everything fast" with Jul 7's "prove a human touched it." Reject C: a lone signature can't distinguish "I agreed" from "I never looked." Keep B's confidence flag as a later additive layer since Ed thinks admin is robust and may not want it now.

### P2 — config IA + navigation (largely built; confirm & polish)

**T6 — Land the reworked Configuration IA as demoed** *(D10, D11, D12)*
- **Requested:** Split "Templates" into discrete Configure blocks (Org layout, Members & billing, Review defaults, Workbook layouts, Response library, Compliance checklists). New-review returns to drop zone. Ed approved as shown.
- **My approach:** Already demoed and signed off — mostly finalize copy/labels and confirm the drop-zone routing on "Start new review." This is the convergence point for [[config-ia-overhaul]] (the unresolved "best-of-both" nav), [[response-library-redesign]], [[review-defaults-redesign]], and [[checklists-mapper-redesign]] — verify the shipped structure matches all four and update those notes to "landed."
- **My take:** Good outcome — the boss's "Templates is confusing" instinct and our built depth reconciled into named blocks. Main risk is drift between the four sub-redesigns and what actually shipped; do one pass to confirm they're coherent. Flag **Members & billing** separately → T8.

### P3 — deferred / fast-follow (capture so they don't get lost)

**T7 — Source highlight-on-open + highlight-section→finding** *(D4)*
- **Requested:** When the source pane opens, highlight the cited text; later, let users highlight a section of source and pull it into a finding. Ed explicitly called both a **fast follow**, not v1.
- **My approach:** Note in the handoff to Diego that the annotation data model is preserved (T3) specifically to enable this. No build now.
- **My take:** Correct to defer — verify-by-jumping (T2) delivers most of the trust value; text-precise highlighting is polish. Just make sure it's *written down* as deferred so it neither slips into v1 scope nor gets forgotten entirely.

### Process

**T8 — Get the pricing model for Members & billing** *(D11)*
- **Requested:** Val added the block but doesn't know Realwired's pricing.
- **My approach:** Log in the client-questions doc (see [[client-questions-doc]]) and raise with Ed before the billing block gets any real fidelity. Keep it as a low-fidelity placeholder until answered.
- **My take:** Don't invest in billing UI on a guessed commercial model. One question to Ed unblocks it; building first risks throwaway work.

**T9 — Make the changes, then notify Diego** *(D13)*
- **Requested:** Val makes the refinements, updates Diego (who already reached out), his team takes it forward. Ed wants no formal handover — the design is the "viable," just push it forward.
- **My approach:** Land T1–T6, then send Diego a concise change summary + this processed doc, **explicitly marking what's v1 vs. fast-follow (T7)** so the deferral survives the informal handoff. Point him at the artifact + [[parachute-ia-repo]] for the IA boards.
- **My take:** The informality is the risk here (see Fails). Even without a formal spec, a one-page "here's v1, here's what's deliberately deferred, here are the open questions (pricing)" note protects both sides if the build later drifts. Cheap insurance against "that was supposed to be a fast follow" arguments.

---

## Open questions / to confirm
1. **Pricing model** for the Members & billing block (T8) — needed before building it out.
2. **Citation anchor granularity** — do we have page-level only, or paragraph/section-level anchors from extraction? Determines whether T2 lands on the page (fine for v1) and whether T7 highlight is even feasible later.
3. **"Confirm all attestations" + audit trail** — confirm the bulk-confirm records a defensible per-item human-touch trail (reconciles D8 auto-review with the Jul 7 D8 prove-you-touched-it requirement).
4. **Handoff contract** — is the transcript + artifact + change note enough for Diego's team, or do we owe a lightweight v1/fast-follow spec despite Ed's "no handover" framing? (My rec: yes, one page — T9.)
5. **Fast-follow ordering** — is source-text highlight (T7) the next thing after v1, or does other work jump the queue? Worth confirming with Ed/Diego so expectations are set.

## Cody's / Ed's instructions to Val
- **Make the five refinements** (T1–T5) + finalize the config IA (T6).
- **Then update Diego** and let Realwired's team carry it — *"just push it forward and move on,"* no formal handover.
- **Advanced-settings-accordion** the template-change controls; **auto-review** the admin (act only on disagreement) — the two changes Cody personally emphasized.
