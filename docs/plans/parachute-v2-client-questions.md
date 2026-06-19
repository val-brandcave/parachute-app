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

---

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
