# Pattern change: walkthrough script

A presenter's path through the nine flows on the Prototype Index (`/prototype` → Flows tab), in
order. Each step names the screen, the pill state to pick and what to point at. Start every flow
from the Index (each step's chip lands in that state in one click), or use the state pill at the
bottom centre. Keys: Alt+1…9 picks a state, Alt+[ / ] steps, Alt+F fills a form (Shift: the
invalid or enterprise fill), Alt+S opens the scenario popover, Ctrl+. hides the controls for a
clean recording.

Before you start: Scenario popover → **Reset org**, then **Reset tours and celebrations**, so
confetti, the arrival and the tour chips play again.

## 1. Self-serve sign-up
1. **Create account** (`/auth/create-account`): Keycloak theme; fill with the wand.
2. **Verify**: any six digits except 000000. The card glides into the org setup (T2).
3. **Welcome**, state *Self-serve*: wand fills 2–10 reviewers / Under 50 a month. Point at the
   routing note (controls on) and the Continue label swap.
4. **Invite step**: one chip per address, role select, "Skip for now".
5. **Get started**, state *New*: interstitial, shell arrival, confetti once. Trial credits in the
   header pill. 8 steps in 3 sections; earn pills on the first two sections.

## 2. Enterprise sign-up
1. Create account and Verify as above.
2. **Welcome**, state *Enterprise*: Shift-wand fills 11+ / 200+; the route note says Enterprise.
3. **Book a call**, state *Pick*: pick a slot; the booked scene.
4. **Get started**, state *Call booked*: trial credits held; "Run your first review" explains why
   on click (lock dialog with the pending tracker).
5. Scenario popover → **Approve now** → state *Confirmed*: enterprise confetti, credits released.

## 3. First review
1. **Get started**, *New* → "Upload appraisal".
2. **Launchpad**, *Ready*: drop the sample file; Review setup shows the cost footbar.
3. **Review**: confirm, progress, workbook. The "Take the tour" chip in the run head; the tour
   (4 steps) completes the `tutorial` step. Sign the workbook.
4. **Get started**, *Mid*: first section done, +2 credits earned (section burst).

## 4. Buy credits
1. **Billing**, *Low*: low band, runway, "Add credits" in the band.
2. **Checkout**: *Amount* → *Payment* → *Review* → *Paid* (horizontal stepper, card on file
   08/28, `?error=card` shows the decline callout).
3. **Billing**, *Healthy*: new balance, receipt in Invoices.

## 5. Out of credits at Start
1. **Dashboard**, *Low credits*.
2. **Launchpad**, *Zero*: Start keeps its look with a lock glyph; click explains (shortfall, not
   cost: "You need 1 more credit"), options Add 1 credit or Run Technical only.
3. **Checkout**, *Amount*: prefilled with the shortfall; Paid returns to Review setup with the
   types kept.
4. **Launchpad**, *Ready*.

## 6. Reviewer asks for credits
1. **Launchpad**, *Reviewer short*: the reviewer can't buy; Start explains and offers "Ask Dana".
2. **Dashboard**, *Request*: the admin sees the request card; "Add credits" opens checkout with
   the request attached.
3. **Checkout**, *Amount*: paying fulfils the request (the reviewer's pill and toast update).

## 7. Reviewer day
1. **Reviews**, *Populated*: queue, tour chip for the page tour.
2. **Review**: ready, decisions on findings, sign.
3. **Dashboard**, *Populated*.

## 8. YouConnect embedded
1. **YouConnect**: the host app.
2. **Launch**: the sign-in hand-off.
3. **Review**: embedded run (no shell); signing returns to YouConnect. Invoiced: no credits chrome.

## 9. Trust Center hand-off to IT
1. **Get started**, *Call booked*: "Send the Trust Center to IT" step.
2. **Security** (Configure → Security): send the link.
3. **Trust Center** (`/trust`): what IT sees; the shared view lives at `/shared/trust/…`.

## Things to ask Val's reviewers to look at
- Every blocked action explains itself on click (no greyed-out buttons anywhere).
- One balance everywhere: header pill, Billing, the run's cost footbar.
- Dialogs over a review: Esc closes the dialog, not the review.
- Light and dark, at 1440 and 390.
