# Parachute v2 — Open Questions for the Client

A running log of product/IA questions that need **client (Realwired) clarification**
before we lock the behaviour. Each entry records the question, why it's open, what we
did in the prototype in the meantime, and where the relevant code lives so it's easy
to act on the answer.

> Scope: these are *client decisions*, not internal design choices. Internal design
> decisions live in `parachute-v2-ia-map.md` (§6 decisions log) and `app/AGENTS.md`.

| # | Question | Status | Raised |
|---|----------|--------|--------|
| Q1 | Should **sent-back / returned** appraisals appear in the Reviews queue? | 🔴 Open | 2026-06-18 |
| Q2 | **Dark-mode inputs** — keep white (your standing rule) or allow dark fields? | 🟡 Changed, confirm | 2026-06-19 |
| Q3 | **Property-centric vs. entity (property + report type)** — which is the core entity? | 🔴 Open | 2026-06-23 |
| Q4 | Is the 90% experience **queue management** or really **change management / a notification hub**? | 🔴 Open | 2026-06-23 |
| Q5 | **Registration / PLG** — deprioritized for bank vendor-approval? Does the fee-appraiser vertical reopen it? | 🔴 Open | 2026-06-23 |
| Q6 | **End-of-July MVP scope** — admin + technical only, first non-YouConnect client live — still firm? | 🔴 Open | 2026-06-23 |
| Q7 | **Customize on the Administrative (compliance) workbook** — allow presentation-only theming, or keep it fully locked/standardized? | 🔴 Open | 2026-07-06 |

> Q3–Q6 came out of the Jun 23 demo. Full context:
> `docs/meetings/processed-calls/parachute-jun-23-2026-processed.md`.

---

## Q3 — Property-centric vs. entity (property + report type)?

**Status:** 🔴 Open — awaiting client (Ed's own open debate)
**Raised:** 2026-06-23

**Question.** Today the **property** is the core entity (one property → many outputs/docs;
clean parent→child hierarchy). Ed is debating whether the entity should instead be
**property + report type**, which would let admin vs. technical (and future short forms /
property-type / evaluation forms) route into **different wizards** and unlock more order
types (revenue). Property-centric is his lean, but he sees the complexity.

**Why it's open.** It changes the order/create model, the review-detail hierarchy, and how
"all outputs for one property" are shown. Blocks the order-flow rework. MVP stays
**admin + technical** regardless.

**Prototype impact.** Current UI is hard-coded toward exactly two review types; we should
decouple it to a more generic entity model before this is answered.

## Q4 — Is the 90% experience queue management or change management?

**Status:** 🔴 Open — awaiting client
**Raised:** 2026-06-23

**Question.** For the 90% user, is Parachute a **queue to manage** (assignments, due dates,
status) or really mostly a **notification hub** — "is my report done?" — i.e. change
management? Ed posed this directly. Shapes how much queue UI the default user ever sees.

## Q5 — Registration / PLG status?

**Status:** 🔴 Open — awaiting client
**Raised:** 2026-06-23

**Question.** Was self-serve registration / PLG deprioritized due to bank **vendor
approval**? Cody wants this confirmed, not assumed. The **fee-appraiser** vertical (no
vendor-approval barrier) may reopen PLG. Affects whether we build/remove a registration
surface.

## Q6 — End-of-July MVP scope still firm?

**Status:** 🔴 Open — confirm
**Raised:** 2026-06-23

**Question.** Confirm the MVP target: **administrative + technical only**, first
**non-YouConnect** client live by **end of July**. Drives prioritization of the rework.

## Q2 — Should form inputs stay white in dark mode?

**Status:** 🟡 Changed in prototype — please confirm
**Raised:** 2026-06-19

**Question.** Realwired's standing rule was *"inputs have white backgrounds in BOTH
themes."* In dark mode that makes every form field a bright white island on a dark
card (high glare, "focus-hungry"), which is unusual for dark UIs.

**What we did in the prototype.** Kept **light mode exactly as specified** (white
inputs). In **dark mode only**, inputs now follow the theme — an elevated dark fill
(`--md-surface-2`), near-white ink, and `color-scheme: dark` so native `<select>`
option lists, date pickers and Chrome autofill render dark too. This is the
conventional, accessible dark-mode input pattern.

**Where the code lives.** `app/src/app/globals.css` — the base `.field`/`.ui-input`
white rules are unchanged; a `:root[data-theme="dark"]` override block (just below
the autofill rules) flips the always-white families. Rule documented in
`app/AGENTS.md` (Styling → inputs).

**To revert if the client insists on white-both-themes.** Delete the
`:root[data-theme="dark"]` input override block in `globals.css` — no other changes.

## Q1 — Do sent-back (returned) appraisals belong in the Reviews queue?

**Status:** 🔴 Open — awaiting client
**Raised:** 2026-06-18

**Question.** When a review is returned to the fee appraiser for rework ("sent back"),
should that review still show in the team's Reviews queue while it's out with the
appraiser? Or does it leave the queue until the appraiser resubmits (and only the
revised version re-enters)?

**Where should sent-back work live, and what is a resubmission?** Two sub-questions
that change the data model and the IA:
- **Where do sent-back items live in the app while out with the appraiser?** Options:
  (a) stay in the Reviews queue with a "with appraiser" state; (b) move to a separate
  area/filter (e.g. an "Out for revision" view) so the main queue is only actionable
  work; (c) disappear from the team's view entirely until the appraiser returns them.
- **When a revised appraisal comes back, is it a continuation or a new appraisal?**
  i.e. does the resubmission re-open the *same* review record (revision history,
  `rev 2`, same ID, same findings thread) — or is it ingested as a **brand-new
  appraisal/review** that just happens to reference the prior one? This decides whether
  we need revision/versioning on a review, or simply a link between two separate
  records.

**Why it's open.** Unclear whether the queue is meant to be a *live work list* (only
items the team can act on now → sent-back items would drop out while they're with the
appraiser) or a *full ledger* of every in-flight engagement (sent-back items stay,
shown as "with appraiser"). This changes whether we keep the lifecycle stage, the tab,
and the row at all.

**What we did in the prototype (interim).** Removed the sent-back example and tab for
now so the queue only shows states the team owns:
- Removed the returned example from mock data — `app/src/data/seed/reviews.seed.ts`
  (was `review-006`, "240 Oak Street Medical Office"); `SEED_VERSION` bumped to `v7`.
- Removed the **"Sent back"** tab — `app/src/app/(shell)/reviews/page.tsx`.
- Left the `returned` status + `sent_back` lifecycle bucket **dormant** in
  `app/src/lib/review-lifecycle.ts` so it's a one-line restore if the client confirms
  sent-back items should appear.

**To undo if the client says "keep them":** re-add the seed object, re-add the tab
entry, bump `SEED_VERSION`. No lifecycle code changes needed.

---

## Q7 — Should the Administrative (compliance) workbook be customizable?

**Status:** 🔴 Open — awaiting client
**Raised:** 2026-07-06

**Question.** The Technical workbook has a Customize panel (theme accent, heading
font, density, what-the-doc-shows toggles, and drag-reorder / enable-disable of
sections). The Administrative side is an **attestation document derived from a
compliance checklist**, so its *structure* is mandated — sections can't be reordered
or dropped. Should we still offer a **limited** Customize on the Administrative doc for
**presentation only** (theme accent / colour + density), with the section structure
clearly marked as locked by the compliance checklist? Or does a compliance attestation
need to stay a fully standardized, non-customizable document?

**Why it's open.** Two tensions: (a) brand consistency — a bank may want both
deliverables (technical workbook + attestation) to share one look; vs. (b) compliance
rigor — an attestation is often expected to be a fixed, standardized artifact, and
presentation controls may be unwanted or even a compliance concern. Client/domain
call, not an internal design choice.

**What we did in the prototype (interim).** Deferred — the Administrative doc has
**no Customize** today (matches "structure is fixed by the checklist"). Note: the
attestation preview (`app/src/components/run/RunAttestationPreview.tsx`) currently has
**no settings/theme/density model at all**, so adding even a limited Customize would
require a settings slice on `admin.store.ts` plus wiring the `.wb-doc` render to
consume it — a real feature, not a toggle. Held pending the client answer.

**To build if the client says "yes, presentation-only":** add a theme/density settings
slice to `admin.store.ts`, thread it into `RunAttestationPreview` / `AttestationBook`,
and reuse `RunCustomizePanel` in a "compliance" mode (theme + density only; the
Sections list shown read-only with a "defined by the compliance checklist" note).
