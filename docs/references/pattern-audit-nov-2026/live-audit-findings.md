# Live audit: Apollo + lemlist (11 Nov 2026)

Val signed up with Google on the Brandcave account. Apollo signed Val into the existing Brandcave team workspace as a **member, not an admin**. lemlist created a new trial team. No cards were added and no credits were bought. No admin requests were sent and no mailboxes were connected.

Screenshots are in `apollo/` (26 + checkout GIF), `lemlist/` (15 + 2 GIFs) and `equisant/` (3).

## Apollo: what the live account showed beyond the call

- **Get started:**
  - One column.
  - Headline: "Complete these tasks in your first 14 days to earn up to 700 credits and start reaching prospects and booking meetings".
  - A thin progress bar.
  - 4 accordion sections with an "Earn N credits" pill and "x of y completed"; several can be open at once.
  - Rows are a checkbox, **bold verb phrase** plus the benefit ("**Save a contact** to start building your pipeline"), and a right-aligned CTA.
  - **One yellow CTA per section** (the next step). Steps that depend on an earlier one have dimmed outline CTAs that you can still click.
  - Ends with 3 illustrated resource cards that link out (03–08, 05).
- **Credits pill in the top nav** opens a popover (09):
  - "Your credit limit is part of your team's shared pool. You won't get separate credits; your limit sets how much of the pool you can use"
  - 0 of 100, "100 credits left within your credit limit"
  - View usage / Upgrade plan
  - **Shared pool + per-person limit**, the same model as our org wallet + spend-by-person.
- **Credit usage** (10–12):
  - tabs Overview / Usage details / About credits / AI runs
  - filters: Date (current billing cycle), Team member, Features
  - donut "0 of 100 credits used"
  - two cards: Team credit usage "100 / 100 available, renews Nov 25" and Your credit usage "a credit limit set; caps how many credits you can use from the team's pool"
  - Referral: "invite friends and receive 25 credits each" with a share summary table.
  - Empty sections use an illustrated coin plus one line plus a hint ("No credit usage in this period. Try adjusting the date range…").
- **About credits** (13–16) is a full education page:
  - hero "What are Apollo credits?" with a coin illustration
  - "How it works" in 3 illustrated steps
  - "How much does each data cost?": an accordion per data type, a "1 credit / net-new email" pill, a product vignette on the right
  - "Add credits to your plan": illustration + "Add more credits"
  - "Credits renew each billing cycle"
  - 11-question FAQ
- **Checkout** (17–22, GIF):
  - Full page with a stepper SELECT PLAN → ADD-ONS → REVIEW.
  - A sticky right summary: plan, seats, add-ons line items, billed total, tax note, primary action.
  - Add credits is a dropdown of 1K–150K credits/yr with price chips, plus an illustration row.
  - The plan step has "What are credits?" (per-action price pills), "Have more advanced needs? Talk to a sales expert", and a 20+ question FAQ.
  - **As a member the final CTA is "Request upgrade"**, not Pay.
- **Lock, don't disable** (23–24):
  - Locked filters show a lock icon and an "Unlock advanced filters → View plans" bar.
  - Clicking a locked filter opens an illustrated dialog: "Advanced filters aren't included in your plan. Upgrade now to unlock 65+ filters…", with **"Send request to admin"**.
- **Role-gated page** (26): billing for a member shows an illustrated "Unauthorized" page with "Back to home page". It is a dead end, and we can do better: show what the admin sees, with "Ask {admin}".
- **System banners** (25): a dismissible info banner ("Bounce Guard is now on…" with a settings link) plus a full-width warning bar ("You have no mailboxes linked… Link mailbox").
- AI-assistant onboarding (01–02): goal picker plus a "Personalizing your workspace" interstitial. Cody: theatre, ignore it.

## lemlist: what the live account showed

- **Sign-up questions** (01–04, GIF):
  - one question per screen, with big tap targets and no Next button for single-select
  - role (7 options) → team size (Only me / 2–5 / 6–10 / 11–25 / 26–100 / 100+ / I don't know yet) → goals (multi-select + Continue) → how did you hear (multi-select)
  - A testimonial and logo wall on the right throughout.
- **Home** (05–06):
  - Header chips "Invite your team" and **"14 days of free trial left | Upgrade plan"**.
  - "Book a demo" banner with an illustration.
  - "Run lemlist from your AI assistant" card.
  - "Get started & succeed in outreach with lemlist" checklist:
    - "5 steps to configure…" but "0 of 6 tasks" (copy mismatch)
    - icon accordion, the first step open with description + blue CTA + a "Read the article" link card
    - Optional steps labelled "Optional"
    - **No rewards.**
- **Plans** (07):
  - Settings overlay. Banner: "Your free trial ends in 14 days. Choose a plan below to continue using lemlist."
  - Monthly/Quarterly/Yearly segmented control, coupon, currency.
  - 3 plan cards; Enterprise is "Contact sales".
- **Credits** (08, 10–11):
  - Billing → "Other: one-time payments" → Enrichment, "Current credits balance · One shot · 0 / 200", Manage.
  - Manage opens a compact modal:
    - price, a credits/month dropdown, and the frequency (Monthly / Quarterly / Yearly / **One time**)
    - **an outcome translation**: "400 emails (5 credits per email) Or 100 phones (20 credits per phone)"
    - three reassurances: "Unlimited credit rollover", "Credits only get used when successful enrichment", "Usable on other credit-based features"
- **Checkout** (13): a big modal "Complete Your Purchase" with the billing address form on the left, an Order Summary on the right, "Total Due Today $660", Cancel / "Pay $660 now".
- **Billing info** (12): Invoices (send invoices to), Payment methods, Currency, Billing information (address, VAT). Each is a row with an edit icon and an empty "No … configured" line.
- **Empty states:**
  - Weak on lists (14): column headers over "No match", plus a paper plane and "No campaigns found".
  - Strong on Enrichment first run (15): a big headline, a product vignette showing how the process works, proof stats, one CTA, and "Select your import source" cards.
- No contextual videos and no product tour appeared in the first session.

## Equisant (Kelsey)

See the processed app-review call §1. Captures: onboarding pill (01), Refunds gated state (02), the "Finish setup" floating button on a stub page (03).
