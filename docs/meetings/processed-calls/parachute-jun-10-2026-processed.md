# Parachute v2.0 — Kickoff / UX Sync (Processed)

**Meeting:** UX Sync | Realwired
**Date:** June 10, 2026
**Duration:** ~49 min
**Recording:** https://fathom.video/share/ubcZh6k-4uvQUfBaNr7vnd8RqMkwrH67
**Source files:** `meetings/raw-calls/meeting-jun-10-2026.md` (transcript), `meetings/meeting-notes/meeting-notes-jun-10-2026.md` (Cody's live notes), `references/client-html-mock/parachute-mockups.html` (Ed's vibe-coded POC)

## Attendees
- **Edward "Ed" Kruger** — Realwired (the client; product owner of Parachute & YouConnect)
- **Cody Miles** — Brandcave (agency owner / my boss)
- **Val Vinnakota** — Brandcave (me; "Product Design Engineer" / "Chief Fiber" — new title from Cody)

---

## TL;DR
The meeting had two halves. First, **wrap-up of the YouConnect Onboarding project** (essentially done → hand off to Ed's new dev team with a transition package). Second, the **kickoff of Parachute v2.0**, a new project for Brandcave.

The core ask for v2.0: take Ed's working proof-of-concept and turn it into a **clickable prototype** (not Figma, not production code) of a redesigned, standalone Parachute app — an AI appraisal-review tool for banks. The headline new capability is giving reviewers **control over the output**: accept/reject/edit AI findings, send reports back to appraisers, and customize the final "workbook" document. **Target: deliver the prototype so an engineering team can build the real product by mid-July 2026.**

---

## Part 1 — YouConnect Onboarding (Closing Out)

- Status: Requirements essentially complete. Zach, Missy & team walked user flows and closed most gaps. It's now in support/bug-fix mode plus one added feature (vendor-grade scoring method).
- New behavior since last review: a **module-locking mechanism** on the hub side — only dependent modules unlock at the start; CS agents unlock the rest as the user completes steps.
- Added a **Supabase notification carrier**: when a user makes changes on the hub side, the CS agent gets automatic notifications; visible in the activity log.
- Definitions module expanded (intro videos per module, recorded by Zach); value-premise + 4-column panel layout promoted as the default; report submission module (read-only); new review panel; dashboard additions (onboarding timeline, module funnel, status breakdown).
- **Decision:** This is ready to hand over to Ed's new dev team.
- **Action (Val):** Create a production-ready handoff package — list of remaining tasks/items, context around each, and ship it over.

### General feedback from Cody (process, not Parachute-specific)
- Don't show up to meetings unprepared — ~7 min were lost finding the right Vercel link.
- **Inputs should have white backgrounds** (repeated feedback). Apply going forward.

---

## Part 2 — Parachute v2.0 (The New Project)

### Product context
- **What Parachute is:** AI-powered review tool for commercial real-estate **appraisals**, sold to **banks**. It runs a compliance checklist + a technical review on an uploaded appraisal PDF and returns findings (math errors, inconsistencies, valuation red flags, policy violations) with page references — making review faster and audit-ready. (Per realwired.com/products/parachute.)
- **Traction:** Launched a **pilot program last month** — fixed fee, unlimited usage. ~**100 appraisals** processed. First annual client already signed. Growing fast → justifies investing in v2.
- **Why v2:** Add "more flavor" — primarily *output control*. Today, in YouConnect, Parachute is just a button: click it, get a PDF back ~10 min later. v2 makes the output **interactive and editable**.

### The core problem v2 solves
Clients largely trust the AI's accuracy. Their real pain is **formatting / ownership**: the output doesn't look like *their* work, so they struggle to pass it on as their own. Ed & Jeff distilled three reviewer goals the product must serve:
1. **"I did it better, with better efficiency."**
2. **"It shows it's my work, with high quality."** (ownership of the output)
3. **"I didn't miss a material mistake."** (confidence / safety)

### What the POC demonstrates (the meat)
Ed walked through a Claude/vibe-coded HTML POC. **Nothing is final — it's purely a proof of concept** to test one hypothesis: *"If I give reviewers more control over formatting, will adoption go up?"* Feedback so far: **yes, people love it.**

Key screens/flows in the POC:
- **Login / Auth** (incl. SSO).
- **Dashboard** — "My Reviews" queue + metrics (what's waiting, what came back, order new).
- **Order a Review** — upload a PDF (or pull from YouConnect) → run the pipeline (staged progress shown).
- **Technical Review (review details)** — the centerpiece. Findings shown by category; reviewer can **Accept / Reject / Agree / Disagree**, and record a reason on disagreement. A **link back to the original appraisal PDF** opens the cited page side-by-side (with confidence score) to fast-track verification.
- **Workbook** — the compiled final document ("all the evidence of property and why we made this loan" for auditors). Heavy **customization**: show/hide rejected/overwritten sections, hide the risk rating, theme/color/font selection, rename risk ratings, drag-and-drop additional appraisal sections (highest & best use, subject paragraphs, etc.).
- **Builder** — assemble/configure the workbook layout (per-review and as an org-level default).
- **Settings** — manage the **compliance checklist** and **bank policy** documents.

### Domain concepts (so the team speaks Ed's language)
- **Technical review:** deep dive on whether the info *inside* the appraisal is correct → becomes the **workbook**.
- **Administrative / compliance review:** runs the bank's **compliance checklist** (a doc of yes/no/NA + evidence-page questions). It's the first piece of evidence that the appraisal isn't junk. Banks must be able to **upload and manage** this checklist template (similar editing experience to the technical one).
- **Bank policy upload:** a 1–2 page doc of extra rules ("we only do business if it looks this way"). Taken as-is, extracted into rules, applied on the final run → e.g. *"satisfies 26 of 30 policy rules."*
- **Classification pass:** the system classifies the property type (e.g., data center), applies the relevant rule set, then a trained model checks correctness.
- **Workbook:** the auditor-facing evidence package. The reviewer signs off on it.
- **Send back for review:** reviewer can reject the appraisal and **batch** the required corrections back to the fee appraiser. (Appraisers hate one-mistake-at-a-time emails.) A review takes ~5 days today.
- **Quality gate (idea):** org templates could auto-reject e.g. "3+ medium findings" and bounce straight back to the appraiser — framed as *the system* enforcing standards so the bank doesn't damage the appraiser relationship ("mad at the robot, not the human").

### Integration & deployment decisions
- **Two faces, one app:** Parachute is both (a) the housing for Parachute *within* YouConnect, and (b) a **standalone** product sold to non-YouConnect customers.
- **Not an iframe/modal.** YouConnect screen real estate is too constrained. Instead: a **standalone microservice** with its own look/feel.
- **Integration pattern:** YouConnect shows a button ("Sync to Parachute" / "Configure my Parachute" / "Edit in Parachute") → opens the standalone Parachute via a **shared auth layer (SSO pass-through)**. Parachute emits **webhooks**; YouConnect listens/intercepts and downloads results, but **Parachute is the source of truth**, not YouConnect. Avoids maintaining the feature in two places.
- **UX polish:** consider an **interstitial / "transferring you to Parachute…" screen** (like Expedia → Southwest) on the handoff.
- **Async by nature:** an appraisal takes ~10 min; not workflow-blocking. Notification model = "your report is ready, click to edit in Parachute."

### Self-serve vs sales-led
- Ed *wants* self-serve eventually, but the blocker is **vendor due diligence**: Parachute (the vendor) itself must be approved by each bank before any banking data can leave the bank. Compliance regimes: bank-internal **GLBA** (≈ GDPR/PII), Brandcave/Realwired side has **SOC**. Data handling, ownership, PII, AI regulation all in scope.
- **Decision for v2:** **sales-led.** Accounts are created for customers / SSO pass-through provided; vendor due diligence handled outside any onboarding flow. Self-serve is a later goal (target "the whales" with a self-managed vendor onboarding). Build trust features anyway: auto-deletion of data, full audit trail/log, data classification on egress.

### YouConnect issues raised (adjacent, may become work)
- **Weak notification layer** — hurts surfacing async "review ready" from Parachute. Near-term fallback: **email notifications** on review-complete.
- **No good change-management / "what's new" surface** — banner system is "really bad." Ed wants notifications + change log visible in-app. Candidate for a small UI refresh.
- **The Word-style document editor is a major pain.** Biggest source of "stupid bug fixes." Users copy-paste compliance checklists from Word → formatting breaks → a developer manually fixes CSS pixel/margin sizes. Top-to-bottom layout (property info eats half the page, editor below) is bad. Ed wants a **better self-managed templating/editing experience** to offload maintenance. (Relevant because Parachute v2 needs checklist/policy template editing too.)

---

## Key Decisions
1. **YouConnect onboarding → hand off** to Ed's new dev team with a transition package (Val to produce).
2. **Parachute v2 = a prototype, not Figma and not production code.** Speed is the reason. (Cody: *"don't go back to Figma, that's way too slow."*)
3. **Standalone redesign + a defined YouConnect↔Parachute integration** (button → SSO → standalone microservice; webhooks; Parachute = source of truth).
4. **v2 is sales-led**, not self-serve.
5. **Val prototypes; he is NOT responsible for the API.** Either (a) pure Claude-code prototype, or (b) stubbed front-end with a **mock service layer** an engineering team can introspect and take over. Separate repo.
6. **Cody will write a high-level "Definition of Done"** to share with Ed, working backward from mid-July.

## Cody's Promises / Commitments (to Ed)
- Take the conversation and **produce a high-level Definition of Done** for the mid-July target.
- Get **access to the current** (POC / functional requirements) so he can form a strategy.
- **Align Val** to the strategy.
- **Start with the app shell**, then knock out routes/screens, **look-and-feel first** in sprint 1.
- Be pulled into Realwired **stand-ups** for the YouConnect handover.

## Cody's Instructions to Me (Val)
- **YouConnect:** create and ship the handoff/transition package (task list + context).
- **Parachute:** **prototype** — do *not* worry about the API. Build a beautiful clickable prototype (Claude-code) or a stubbed front-end with a mock service layer in a **separate repo**.
- Work **app shell → routes/screens**, **look-and-feel first** in the first sprint.
- Carry over standing feedback: **come prepared**, **inputs get white backgrounds**.

## Timeline
- **Ed, by Friday (Jun 12):** building his *own* throwaway fake/demo version with Claude for the **sales team** to demo. (Not Brandcave's responsibility — too tight a turnaround.)
- **Brandcave:** start refinement **next week**; Ed wants to offload the project around **late June / early July**.
- **Target: Parachute v2 product delivered ~mid-July 2026** (work backward, leaving time for engineering). Realistically a longer sales cycle (banks take ~3 months) means it doesn't have to be fully complete-complete by then, but mid-July is the working target.
- Cody to send Ed a **plan within a day or so**.

## Open Questions / To Confirm
- Account-level vs per-workbook settings (org brand colors/fonts as account-level defaults) — Cody flagged; confirm the split.
- Notification mechanism for the async "review ready" handoff (email near-term; in-app later).
- Exact scope of the YouConnect UI refresh (notifications, change log, document editor) — is any of it in this engagement or separate?
- Which is the chosen prototype mode — pure Claude-code prototype vs stubbed front-end + mock service layer?
- Auth/SSO pass-through details for the shared layer.

## Action Items
| # | Owner | Action | Due |
|---|-------|--------|-----|
| 1 | Val | YouConnect onboarding handoff package (remaining tasks + context) | ASAP |
| 2 | Val | Stand up Parachute v2 prototype — app shell first, then routes; look-and-feel first sprint; separate repo | Next week → late June |
| 3 | Cody | Write high-level Definition of Done for Parachute v2 (back-from mid-July) and send Ed a plan | ~1 day |
| 4 | Cody | Get access to the current POC / functional requirements | ASAP |
| 5 | Ed | Build throwaway sales-demo version with Claude | Fri Jun 12 |
| 6 | Cody | Join Realwired stand-ups for YouConnect handover | Ongoing |
