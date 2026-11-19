# Review findings: Parachute Pattern Audit draft (11 Nov 2026)

Reviewed: `scratchpad/report/index.html` (sections + the `REQ` array). Ground truth: the two 10 Nov transcripts, the frame INDEX, the live-audit captures, `parachute-current-state.md`, `state-system-draft.md`, the processed 10 Nov call, the Nov 3 transcript, `lib/pricing.ts`, and the memory files `self-serve-plan-nov6.md` and `empty-states-rule.md`.

Severity: **must-fix** = wrong, contradicts a locked decision without saying so, or risky to show. **should-fix** = weak, incomplete or likely to draw a challenge. **nit** = polish.

---

## Must-fix

1. **must-fix · Summary tiles (19 / 9 / 7 / 3)**
   - **What's wrong:** The 9 / 7 / 3 split doesn't match `REQ`. Counting by pick key: apollo 8 (Get started, Rewards, Row actions, Balance, Tours, Learning Center, Buying, Locked), hyb 4 (Invite, Help video, Credit usage, What are credits), lem 2 (Sign-up, Trial status), equi 3 (Enterprise, Billing states, Prototype states), ours 2 (Trust Center, Members). Counting by label instead gives 6 pure Apollo. Neither count gives 9. The one pure lemlist pick, Trial status, fits no tile, so the hero says no lemlist pattern was taken outright. "Sign-up questions" is keyed `lem` (blue lemlist dot) but labelled "Hybrid: ours + lemlist".
   - **Evidence:** `index.html` lines 227–230 vs the `REQ` picks (lines 499–612).
   - **Fix:** Work the tiles out from `REQ` in the script. Use five buckets (Apollo-led 8 · hybrid 4 · lemlist 2 · Equisant 3 · ours 2), or relabel the keys so they match the labels. Change Sign-up's key to `hyb`.

2. **must-fix · REQ "Locked and blocked actions", *We have***
   - **What's wrong:** "The tooltip may not even show on a disabled button" is contradicted by the call. Frame 035640 shows the black tooltip "Opens when your organization is approved" over the greyed Start button. Pay has no tooltip either. It has an amber banner plus a greyed lock-icon "Pay $2,600" (040613).
   - **Evidence:** INDEX.md row 15 (035640) and row 51 (040613). The claim comes from `parachute-current-state.md` line 87 ("may never show"), which is a code-reading guess.
   - **Fix:** Drop the sentence or reword it: "Start is greyed with a tooltip; Pay is greyed under a banner. Cody: 'looks like things are wrong', and there's no validation if the user forgets (11:21)." Cody's actual reason is stronger than the tooltip point anyway.

3. **must-fix · Rewards model table + REQ "Rewards and deadline" + Get started mock**
   - **What's wrong:** The proposal cuts the starting gift from **6 trial credits (3 full reviews)** to **1 free report (2 credits)** and doesn't say it overrides a locked decision. The 6-credit trial is the 6 Nov reconciled model, taken "as recommended", and `TRIAL_GRANT_CREDITS = 6`. It is also below what Ed asked for on Nov 3: "give them **two or three documents** to trial". Cody asked to "start with one thing and then maybe get like **one more** report", but the proposal earns **two**. So Ed and Cody disagree here, and the report hides the conflict instead of surfacing it. "Cheaper for Realwired" is a commercial argument that is Ed's to make, not ours.
   - **Evidence:** `memory/self-serve-plan-nov6.md` line 16; `app/src/lib/pricing.ts:19`; `meeting-nov-3-2026.md` line 196; `meeting-nov-10-2026.md` 19:08.
   - **Fix:** Label the row "**Change to locked decision (6 Nov): trial 6 → 2 credits**". Give Ed two options: (a) Cody's shape, 1 free report + earn 1 more; (b) Ed's shape, 2 free reports + earn 1 more (6 credits total, the same cost as today's trial with no earn). Move the question to the top of "Questions for Ed".

4. **must-fix · Proposed screens: Get started mock + top-nav mock (numbers don't add up)**
   - **What's wrong:**
     - The Get started header says "**2 of 9 done**" with a 22% bar, but the mock shows **8** tasks (3 + 3 + 2) and **1** ticked.
     - The trial chip says "**2 free reports left**". Under the proposed model the user starts with 1 and has earned 0 (both earn sections are 0 of N). Once the first upload is done, that one is being used.
     - The popover says "4 credits … You've used **6 of 10** this month". That is 10 credits in a month, but the whole proposed model tops out at 6.
     - "Your limit: **6** credits a month" with 6 used means the user is at their limit, yet the popover shows 4 left and a primary "Add credits".
   - **Evidence:** `index.html` lines 280, 283–297, 311–318.
   - **Fix:** Pick one scenario and make every number follow from it. For example: "1 of 8 done"; chip "1 free report · 12 days left to earn 2 more"; popover "2 credits · 1 full review". Run the mock numbers through the rewards table before publishing.

5. **must-fix · Rewards unit ("free reports") vs credits in the header**
   - **What's wrong:** The header shows **two balances**, "4 credits" and "2 free reports left". Nothing says whether the free reports are part of the 4 credits or on top of them. Cody asked for **credits** in the main nav "showing how many you've used". A second unit invites exactly the "what does this mean?" reaction he had to "+1 coin". It also leaves edge cases open: does a free report cover only one review type (1 credit ≈ $150) or both (2 credits ≈ $300, Ed's per-document price)? And when do earned "reports" expire (`EARNED_LIFE_DAYS = 90`)?
   - **Evidence:** `index.html` line 311; `cody-val-app-review` 9:18; `pricing.ts:73`; Nov 3 lines 147–159.
   - **Fix:** Keep credits as the only balance. Say rewards in reports but book them as credits ("Earn 1 free report · 2 credits"). During the trial, fold the trial into the credits pill ("2 credits · trial") instead of adding a second chip. State in the rewards table that 1 free report = 2 credits = both review types = about $300, and whether an unused half carries over.

6. **must-fix · REQ "Balance in the nav" + Decisions table "Balance location" vs REQ "Trust Center"**
   - **What's wrong:** The report recommends "Remove the sidebar pill". But Ed's Trust Center placement is defined **relative to it** ("on the left-hand side … maybe just above balance"), and the Trust Center card repeats "above Balance (Ed)". The two recommendations contradict each other. Removing the sidebar Balance also reverses Val's 9 Nov decision (the setup item "stays at bottom with Balance/org"), and the report doesn't flag that.
   - **Evidence:** `meeting-nov-10-2026.md` 17:55 and 21:47; `self-serve-plan-nov6.md` line 36; `index.html` lines 545, 569, 485.
   - **Fix:** Either keep a slim sidebar Balance row as Ed's anchor and add the top-nav pill (recommended, because it matches what Ed said), or flag "drop sidebar Balance → Trust Center needs a new anchor; check with Ed".

7. **must-fix · Top-nav popover mock ("Your limit: 6 credits a month, set by Dana") + REQ "Credit usage" *We'll do* ("your limit vs the team pool")**
   - **What's wrong:** "Our per-person limit maps to Apollo's 'shared pool, your limit'" is false. Parachute has **no per-person credit limit**. The only "Monthly limit" is the auto-reload cap. This is a new feature nobody asked for, and it contradicts the 6 Nov decision of "one org wallet + spend filter by person".
   - **Evidence:** `grep` of `app/src` finds only `AutoReloadSection.tsx:63` "Monthly limit"; `self-serve-plan-nov6.md` line 22; `parachute-current-state.md` billing section.
   - **Fix:** Remove the limit line from the popover and the "limit vs pool" card. If it's worth having, list "per-person spend limits?" as a question for Ed, marked new scope.

8. **must-fix · Ed's wallet vs invoice split (asks list item + no REQ card + checkout mock)**
   - **What's wrong:** Ed split billing by **customer type**: appraisal firms "load the wallet … or pay-as-you-go"; "the bank would want to see an invoice". The report turns that into "PLG vs banks". Every billing mock then shows **Harbor Community Bank** buying credits by card. The sign-up already asks "Bank or lender / Appraisal firm", but nothing uses the answer for billing. Ed's **pay-as-you-go** option has disappeared. The asks list says "each one is covered in the comparison below", but there is no wallet/invoice card.
   - **Evidence:** `meeting-nov-10-2026.md` 16:15–16:50 (lines 150, 156); `index.html` lines 255, 339–366.
   - **Fix:** Add a REQ card, "How a customer pays", covering wallet/bundle + auto top-up, pay-as-you-go, and invoice, with the default set by org type and size. Add a question for Ed: "Can a small bank on the PLG path prepay by card, or is a bank always invoiced?" Consider making the mock org an appraisal firm for the card checkout.

9. **must-fix · Trial deadline / expiry (Get started "14 days", chip "12 days", state system `trial_expiring` / `trial_expired`)**
   - **What's wrong:** On 9 Nov Val decided **"Trial credits never expire (D2a)"**. The report adds a 14-day clock and a "12 days" chip next to the trial balance, which reads as the trial expiring, and its state system lists trial-expiring and trial-expired states. None of this is flagged as a change. The state-system draft still uses 30-day trial expiry and a 6-credit trial, so it disagrees with both D2a and this report's own rewards model.
   - **Evidence:** `self-serve-plan-nov6.md` line 34 ("Trial credits never expire (D2a)"); `state-system-draft.md` lines 60–68; `index.html` lines 276, 436, 539.
   - **Fix:** Say the 14 days applies to **earning** only and the free report never expires. Word the chip "12 days left to earn 2 more". Either drop the trial-expiring and trial-expired states or flag "reopens D2a". Bring the state-system draft's wallet fixtures in line with whichever rewards option is chosen.

10. **must-fix · Ed's "earn a credit for finishing the self-guided tour" (not covered)**
    - **What's wrong:** Ed asked for exactly this. In the mock, finishing the tour ticks "Go through the findings" inside **"Run your first review"**, which is the one section with **no** reward ("Free report included"). The asks list doesn't include Ed's request either.
    - **Evidence:** `meeting-nov-10-2026.md` 19:37 ("maybe you earn a credit for finishing the self-guided tour"); `index.html` lines 283–285, 401.
    - **Fix:** Add the ask. Then either put the reward on the first section ("Finish your first review · earn 1 free report", with the tour as one of its steps) or say explicitly why you're not doing what Ed asked.

11. **must-fix · Things that are risky to show Ed (and some to show Cody)**
    - **What's wrong:**
      - **Other clients' work.** The Equisant screenshots (`equisant-01/02/03`, `call-034927`, with Lakeside Family Medicine demo data and the Equisant brand) and named LedgerWise internals ("LedgerWise's NullStateHero") are other Brandcave clients' products.
      - **Brandcave account data.** `apollo-17` and `apollo-19` show Brandcave's own Apollo account with **"Invoice overdue $83.15"**.
      - **AI-assistant lines.** "I'll ask these as a quick multiple choice in the terminal once you've read the page" (Decisions intro).
      - **Checked and clean:** the report quotes none of the small talk from the calls (the JB dinner "keep this between us", karaoke, "getting fired", the 3 pm BOL call).
    - **Evidence:** the `shots/` files named; `index.html` line 477; `meeting-nov-10-2026.md` 5:02–7:57.
    - **Fix:** Mark the page "Internal: Brandcave only". If any part goes to Ed, crop the Apollo order summaries, swap the Equisant and LedgerWise names for "a reference prototype", and delete the terminal line.

12. **must-fix · Illustrations (Visuals section, Decisions table, Questions for Cody)**
    - **What's wrong:** The Decisions table says "Illustration style: See the recommendation above", and Questions for Cody says "pick from the three candidates". The Visuals section only says "Illustration set in progress." So the reference points at nothing, and Cody's "looks very Claude generated" ask has no answer. The mocks' own resource cards (petrol-tint box with one centered stroke icon) look like the generic style Cody criticized.
    - **Evidence:** `index.html` lines 455–456, 471, 488, 299–303; Cody 8:40 (frame 040256).
    - **Fix:** Either ship the three candidates before sharing, or remove both references and add "illustration direction: next pass". Don't present placeholder icon tiles as the replacement for Apollo's illustrations.

## Should-fix

13. **should-fix · "The asks" section: completeness and the claim "Each one is covered in the comparison below"**
    - **Has no REQ card:** orphans / "Claude-generated", wallet vs invoice (#8), dropping the sample promos (only mentioned inside other cards).
    - **Missing from the asks list entirely:**
      - Cody: **"measure effort, not clicks" / cookies on the bottom shelf** (15:13), which is the very argument that justifies a 3-step checkout over a modal.
      - Cody: never share links until they're **password-protected** (1:27; done 11 Nov, worth one line).
      - Cody's Notion: "**just show me different states of getting started**".
      - Ed: tour credit (#10).
      - Ed: **pay-as-you-go**.
      - Cody: "**Dashboard, I need to see the dashboard next**" (23:34).
      - Ed: **schedule user interviews**, and who the participants are (appraisal firms vs banks).
      - Auth skins as mocks for Diego's team.
      - Cody: **video the first time an important setting is changed**.
      - Cody/Zapier: full-page checkout reference.
      - Apollo's layout switcher, which Cody called "not a bad idea".
    - **Evidence:** processed call `parachute-nov-10-2026-processed.md` lines 95–104, 118–144; app-review 15:13, 12:14.
    - **Fix:** Add the missing asks, and change the claim to "each is covered below or in Plan".

14. **should-fix · REQ "In-app tours"**
    - **What's wrong:** Scoped to the first review only. Cody asked for a tour "in a first-time experience, go in and see **any page** … get a tour of everything", and Apollo's pattern is "first visit to a page". The plan builds one 4-tip tour.
    - **Evidence:** app-review 3:18 block; INDEX §4 row 10.
    - **Fix:** Make it "first visit to each key page (Reviews, Workbook, Checklists, Billing) offers a short tour; first review gets the 4-tip tour". Store one dismissal per page.

15. **should-fix · Plan & tasks (phase order and timeline)**
    - **What's wrong:**
      - **Prototype controls come last (Phase 3).** They were Cody's opening critique, the "IMPORTANT" item in his Notion, and P1 task #1 in the processed notes. Without them, Ed can't be shown "every billing state" or enterprise vs PLG.
      - **Too slow for what was promised.** Phases total about 8–11 days, but Cody told Ed "today, tomorrow, get a new version in" and Ed wants interviews after "a couple days".
      - **No "talk to Kelsey" step** (the call's first action item).
    - **Fix:** In Phase 1, put the audience pill and the billing-state pill on Get started, Billing and Dashboard, plus the Kelsey sync. Name exactly what goes to Ed in 48 h.

16. **should-fix · Checkout mock reassurance "✓ Only used when a review completes"**
    - **What's wrong:** Today the prototype debits **at Start** (`debitForReview` in both `onStart` handlers). The line silently changes billing behavior.
    - **Evidence:** `docs/plans/self-serve/phase3-brief.md:43`; `self-serve-plan-nov6.md` "zero balance blocks at Start only".
    - **Fix:** Either flag it ("change: debit on completion, which matches Realwired's `review.completed` ledger") or reword it to the current rule ("Charged when you start a review; refunded if it fails").

17. **should-fix · Checkout mock "Re-check after the appraiser's corrections · Free, 2 rounds"**
    - **What's wrong:** No source gives a round count. Ed implied on Nov 3 that re-scans are part of the $300, but never said how many. This is an invented commercial term in a client-facing mock.
    - **Evidence:** `meeting-nov-3-2026.md` line 117.
    - **Fix:** Use "Free re-checks after corrections (limit: ask Ed)", or add it to Questions for Ed.

18. **should-fix · "Click a lock" dialog + Enterprise routing (State system)**
    - **What's wrong:** The dialog promises "After that, your credits and Add credits unlock". But the state-system draft makes approved enterprise **invoiced** by default, with prepaid as an open question, so Add credits may never apply. The report also never says what an enterprise org sees on Get started. Do the "Earn free reports" sections show for an invoiced bank?
    - **Evidence:** `state-system-draft.md` line 53; `index.html` lines 329–335, 444.
    - **Fix:** Word it "After that, Realwired sets up your billing". Add an "Enterprise · Get started" note: no earn pills; pre-configured steps (the Equisant 034927 analog).

19. **should-fix · Removing the sample review vs empty-states decision E3**
    - **What's wrong:** On 10 Nov Val approved and built E3: the sample is a dashed card inside "No reviews yet" and stays reachable from Get started. Removing the sample overturns E3, but the report only lists "Sample review" as a decision, without citing E3. The Reviews empty-state mock also drops the "decorative ghost preview" slot from the 3-level rule and puts a video there.
    - **Evidence:** `memory/empty-states-rule.md` (E1, E3).
    - **Fix:** Note "reverses E3 (built in 285dc5b)". Say whether the video replaces the ghost preview or sits beside it.

20. **should-fix · REQ "Invite your team" *We'll do* ("Equisant's per-step 'Invite someone to do this'")**
    - **What's wrong:** No capture or call frame shows this. Equisant frames show "Add users · About 2 minutes" (035029), a stub User Management page and a "Finish setup" pill (`equisant-03`).
    - **Fix:** Remove the attribution, or call it our own idea.

21. **should-fix · REQ "Get started layout", lemlist column ("6 tasks, one open at a time")**
    - **What's wrong:** Frame 040014 shows **two** lemlist accordions open at once.
    - **Evidence:** INDEX.md row 30.
    - **Fix:** "6 tasks in an accordion, first step open."

22. **should-fix · REQ "Row actions and next step", Apollo column ("later steps have dimmed outline buttons that still work")**
    - **What's wrong:** It overgeneralizes. Only steps that **depend on an earlier step** are dimmed: "Add contacts" and "Go to Sequence" are dimmed, but "Set up Conversations" (second in its section) is a normal outline (`apollo-09`). "Still work" comes from the audit text (live-audit-findings line 15), and no capture can show it.
    - **Fix:** "Steps that depend on an earlier one are dimmed but still clickable (audit note)."

23. **should-fix · REQ "Sign-up questions" *We'll do***
    - **What's wrong:** "Borrow lemlist's proof panel (bank logos, one quote from a reviewer)" needs real customers and permission. Ed believes this is "the first PLG product in the appraisal space" (Nov 3). Placeholder logos in front of interviewees read as fabricated proof. Adding "I'm not sure yet" to the volume answer also leaves the enterprise routing rule (11+ / 200+) without a branch for it.
    - **Fix:** Make the panel "what Parachute checks" (product proof) until Realwired supplies approved logos or quotes. Route "not sure" to PLG with an optional call.

24. **should-fix · Get started mock copy assumes a bank**
    - **What's wrong:** The copy reads "Make it your bank's review", "Upload your **credit** policy" (today's step is "Upload your bank policy"), and "Send the Trust Center link to IT for vendor review". Appraisal firms are the other org type, and they have no credit policy.
    - **Evidence:** `app/src/lib/setup-steps.ts:102`; `/welcome` org types.
    - **Fix:** Use "Make it your team's review". Have the steps depend on org type (an appraisal firm gets "Upload your review guidelines").

25. **should-fix · Checkout mock + REQ "Buying credits"**
    - **What's wrong:**
      - Ed's "auto top-up" (today in the dialog) is missing from the new checkout.
      - Nothing skips or prefills Payment for a card on file ("cookies on the bottom shelf").
      - The heading "How many reviews do you need?" sits over options priced in credits.
      - "The modal survives only as a shortcut that opens this page" is a contradiction.
      - Zapier, which Cody showed as the model (040649), isn't credited.
    - **Fix:** Add an "Auto-reload when below N" row on Review. Let a saved card skip straight to Review. Change the heading to "How many credits?" (or price the options in reports). Replace the modal sentence with "Add credits buttons open this page with the amount filled in". Credit Zapier.

26. **should-fix · Header crowding**
    - **What's wrong:** The proposal puts a credits pill, a trial chip and a permanent "Invite your team" button into a header that already holds search, the bell and the user menu. That repeats the "way too busy" problem in the header.
    - **Fix:** Merge the trial into the credits pill (#5). Keep Invite on Get started and in the user menu until setup is done.

27. **should-fix · Terminology drift across the mocks**
    - **What's wrong:** The mocks use "report", "free report", "full review", "single review", "review type", "both review types" and "credit" interchangeably.
    - **Fix:** Add a short glossary to the rewards section (credit = one review type on one report; full review = both types = 2 credits) and use it everywhere.

28. **should-fix · Equisant "Finish setup" floating panel**
    - **What's wrong:** The 11 Nov direction lists a bottom-right "Finish setup" panel (`equisant-03`, `035044`), and Cody's first remark (1:55) was about Kelsey's bottom-right FAB. The report shows the capture but makes no decision on it.
    - **Fix:** Decide it: keep the nav "Get started n/8" item, or adopt the floating panel. Add it to the Decisions table.

## Nits

29. **nit · US English and date formats.**
    - "theatre" ×2 (Sign-up REQ, both columns) → "theater"; "personalising" (shot caption) → "personalizing"; "relabelled" → "relabeled".
    - "11 Nov 2026" → "Nov 11, 2026".
    - The lock dialog's "**Thu 13 Nov**" is wrong twice: Nov 13, 2026 is a **Friday**, and US format is "Fri, Nov 13".

30. **nit · REQ "Sign-up questions": "Cody: theatre"** isn't his word. He said "They are not doing anything for me right now … just trying to communicate some sort of value" (app-review 3:18 block). Paraphrase without the colon-quote.

31. **nit · REQ "Sign-up questions" evidence.** Thumbnail `call-035126` is captioned "Ours: Get started after setup", but it is Get started in the **pending** state. The welcome card is `call-035115`.

32. **nit · REQ "What are credits?" *We have*.** The dialog reads "1 credit **=** $150", not "≈" (040613).

33. **nit · REQ "Buying credits" Apollo column.** "Stepper (plan → add-ons → review)" is the **member** view (`apollo-17`). A payer sees 4 steps including PAYMENT (040442, 040749).

34. **nit · Orphans in the report itself.** `text-wrap: pretty` is set on `p` only. The "We'll do" text (`.do span`), the asks (`.asks li div`), task rows (`.task span`) and pills/options are spans or divs, so they can still orphan. Lines at risk include "…cite your rules", "…credits and Add credits unlock." and the Cody quote in Rewards. Add `text-wrap: pretty` to those selectors and check the render at 390 px and 1440 px. Given Cody's "never let orphans pass", the audit page itself has to pass.

35. **nit · Jargon if shown outside Brandcave.** "PLG" ×9, "runway", "Hybrid", "`lib/pricing.ts`", "scenario axes", "seed version bump". Fine for Cody; rewrite before Ed sees them.

36. **nit · Tour mock.** "Skip tour" is plain text. Make it a real button, or it repeats the hover and affordance problem in a different form.

37. **nit · Hero: "a first-run empty state that sells the feature with a *live* vignette".** `lemlist-15` is a static product vignette. Drop "live".

38. **nit · REQ "Members and admins".** `apollo-26` doesn't show which page was blocked. Plan & billing comes from the audit note, so cite it.

39. **nit · lemlist checkout.** `lemlist-13` shows **"Pay $660 now" greyed out** until the form is complete, the same disabled pattern Cody rejects. It's a useful counterexample for the "never disable" card.

40. **nit · Rewards quote.** The Cody quote drops "like … that I want them to do" without an ellipsis. Either add "…" or quote it in full.

---

### Verified OK (no change needed)

- **Apollo members get "Request upgrade":** confirmed (`apollo-17`, `apollo-19`).
- **lemlist's checklist has no rewards:** confirmed (`lemlist-05`, `lemlist-06`, frames 035934–040027; first session only).
- **Sources line, "44 captures, 3 GIFs":** correct (26 + 15 + 3 JPG; 1 + 2 GIF).
- **"Ed: 'way too much going on'" and Cody's "why are you still letting the user go through the PLG path?":** both quotes exact.
- **Rewards "Today" row (6 + 3 = 9 credits):** correct.
- **Checkout prices (5/$750, 10/$1,400 "save 7%", 20/$2,600 "save 13%"):** match the current app and Ed's $150/$300.
- **"1 free report = 2 credits":** consistent with $300 per document *if* both review types are included (see #5).
