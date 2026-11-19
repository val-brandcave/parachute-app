# Pattern audit: web research (Nov 11, 2026)

Public-web evidence for the self-serve redesign: sign-up questions, Get started checklist that earns credits, the credit wallet, billing, and buying credits. Sources are help docs, pricing pages, changelogs and teardowns. I did not sign up for or log into anything.

**Confidence labels**
- **[verified]** means a primary source (the vendor's own help center or pricing page) says it.
- **[secondary]** means a third-party article or teardown says it.
- **[UNVERIFIED]** means I found no public source, or the sources disagree.

**Access note.** `knowledge.apollo.io` returns HTTP 403 to automated fetches, so the Apollo help-center details below come from search-engine excerpts of those pages. Treat Apollo menu paths as point-in-time, because Apollo's own pages disagree with each other.

---

## 1. Apollo.io

### 1.1 Sign-up onboarding questions
- **What they do:** Guided onboarding asks for **role and goals**, then personalizes feature suggestions and the Home checklist. Apollo's help center says: "Follow Apollo's guided onboarding to define your role and goals to get personalized feature suggestions." A teardown describes a two-panel survey. The left panel picks a role (e.g., Sales Manager, SDR/BDR) and the right panel explains each choice. A "personalized setup" question sends the user to their first product area (e.g., email finding). It also mentions an intro video, "What can the only end-to-end sales platform do for you?"
- **Team size question:** [UNVERIFIED] No public source lists the exact question set.
- **Sources:** https://knowledge.apollo.io/hc/en-us/articles/4409127280781-Welcome-to-Apollo [verified, excerpt] · https://www.candu.ai/blog/apollo-onboarding-how-the-sales-platform-masters-plg [secondary]
- **Implication for Parachute:** Keep the org questions to role and goal, and use the answers to choose which checklist items appear and their order. Don't just store them.

### 1.2 "Getting started" page (earn credits, progress, 14 days)
- **What they do:** On first login, Home shows "a guided onboarding experience that helps you complete key actions in your **first 14 days**." The actions help users "build pipeline, set up outreach, and **earn available credits when eligible**." Users can switch from Getting started to a regular Home dashboard through a "Getting started" dropdown. Admins get a separate "Complete Onboarding Setup" article.
- **Mechanics (secondary):** Failory describes the hub as "missions" with "a progress bar that tracks your completion" and "their own rewards." Each completed task, such as configuring the account or installing the Chrome extension, earned in-app credits. Candu adds that each product area has resources with **time estimates in minutes**, plus gamified progress tracking.
- **Not found [UNVERIFIED]:** the per-task credit amounts ("Earn N credits"), the full task list, eligibility rules, and what happens after day 14.
- **Sources:** https://knowledge.apollo.io/hc/en-us/articles/14845941738637-Use-the-Control-Center [verified, excerpt] · https://newsletter.failory.com/p/paid-onboardings [secondary] · https://www.candu.ai/blog/apollo-onboarding-how-the-sales-platform-masters-plg [secondary]
- **Implication for Parachute:** "Earn N credits" for each task with a visible deadline is a proven pattern. Show the reward on each row and a time estimate for each task, and make the checklist a view the user can switch away from.

### 1.3 In-app tours and tips
- **What they do:** The core-search tour has **3 steps**, with progress indicators, short action-led copy, lightboxes and GIFs. Empty states do the teaching:
  - The mailbox setup empty state is a 3-part wizard (Google / Outlook / Other) with help docs and a non-blocking upgrade option.
  - The Sequences empty state offers video overviews and a "Create with AI" button.
  - The Content Center opens with an intro modal that states the value, shows a preview and suggests next steps.
- **Source:** https://www.candu.ai/blog/apollo-onboarding-how-the-sales-platform-masters-plg [secondary]
- **Implication for Parachute:** Put the teaching in empty states (video plus one primary CTA), and keep any tour to 3 steps.

### 1.4 Credits model
- **What consumes credits:** Email and phone reveals. "Apollo never charges more than 1 credit per contact" for email, and phone types all cost the same. Exports, AI features, dialer and waterfall enrichment also use credits. Future features "may use credits; you'll be notified before any action that does."
- **Renewal:** Credits renew on the first day of each billing cycle and expire at its end with **no rollover**. Annual plans unlock all credits up front (or by quarter or half-year if billed that way).
- **Previews before spending:** A Mar 2026 Apollo article says a CSV import "shows an upfront credit-usage preview before you confirm the enrichment." Since May 2026, MCP/AI actions show record counts and credit warnings before you confirm.
- **Admin controls:** Admins can set credit limits per user, and a user can hit that cap while the team still has credits. Workflows can have per-run limits and lifetime ceilings.
- **Credits in the top nav:** [UNVERIFIED] No public description found.
- **Sources:** https://www.apollo.io/pricing/about-credits [verified] · https://www.apollo.io/insights/how-many-apollo-credits-do-i-have-left-before-i-run-a-large-enrichment-batch [verified, Apollo blog]
- **Implication for Parachute:** Before a review starts, show "This will use N credits, leaving M" on the confirm step. This is the single most transferable Apollo pattern.

### 1.5 "Credit usage" settings page
- **What they do:** Apollo's sources give the path three different ways:
  - Settings > Billing > Credit usage (help center)
  - Credit usage & AI > History (help center)
  - Settings > Credits and activity > Credit usage (Apollo blog; Guideflow: avatar > Your profile > Credits & activity > Credit usage)
- **History view:** A credit usage graph showing the trend, and a filterable table with Date and Feature columns and a "Show refunds" toggle. Filters cover date, feature, team member and surface.
- **About Credits tab:** "Settings > Credits & AI Usage > About Credits" lists the credit rates for your plan.
- **Permissions:** A permission named "Can access the credit usage page and check how much credit other users used" controls access.
- **Overview tab:** [UNVERIFIED] No public text describes it. "Plan overview" (Admin Settings) is a different page.
- **Sources:** https://knowledge.apollo.io/hc/en-us/articles/9527776320781-Review-Credit-Usage-in-Apollo [verified, excerpt] · https://www.guideflow.com/tutorial/how-to-view-your-credit-usage-in-apollo [secondary]
- **Implication for Parachute:** A three-part credits page (balance overview, usage history with a refund toggle, and an "About credits" rate card) is well-precedented. Gate the team-usage view behind a permission.

### 1.6 "What are credits" education page
- **What they do:** A public marketing page titled "What are Apollo Credits?" with the subtitle "All the benefits of AI, none of the complexity." It has three sections:
  - "How much does each data cost?"
  - "How it works": Find buyers / Streamline workflows / Connect confidently
  - A 7-question FAQ: missing credits ("if credits don't appear within 24 hours, contact support"), buying more, expiry, other uses, and contact.
- **Source:** https://www.apollo.io/pricing/about-credits [verified]
- **Implication for Parachute:** Publish one plain-language "What is a credit?" page (1 credit = 1 review type, about $150, plus examples, expiry and refunds). Link it from the wallet, checkout and the credit confirm step.

### 1.7 Buying credits ("Add more credits")
- **What they do:** Admin Settings > Plan overview > **Manage Subscription**, then a **slider under "Customize Credits"**. It is self-serve with no sales call.
  - Add-on credits are **coupled to the plan** and renew automatically each cycle.
  - A mid-cycle purchase is billed in full and expires at the end of that cycle.
  - Reductions take effect next cycle.
- **Conflicts:** An older "about credits" FAQ says to email support to buy. The new page says "Add credits from the plan subscription page." Third-party sites quote about $0.20/credit with a 250 or 400 minimum [UNVERIFIED].
- **Full-page checkout:** [UNVERIFIED] Not documented publicly. Candu notes "Add more credits" and "Talk to sales" paths on paid tiers, plus upgrade copy like "Paying teams book 183% more meetings."
- **Source:** https://knowledge.apollo.io/hc/en-us/articles/4677130104333-Customize-and-Manage-Your-Apollo-Plan [verified, excerpt]
- **Implication for Parachute:** Apollo's plan-coupled model, where credits expire each cycle, is the opposite of ours. Copy the amount selector UX, not the billing model. Our "packs, no subscription, no expiry" stance is a selling point, so state it at checkout.

### 1.8 Referral credits ("invite friends, receive 25 credits")
- **What they do:** [UNVERIFIED] I found no public evidence of a user referral that pays 25 credits. Apollo's public program is a PartnerStack **affiliate** program (up to 20% commission for 12 months). The "25 credits" may be an in-app promo visible only when logged in. Confirm it with the design lead's screenshot.
- **Source:** https://www.apollo.io/terms/affiliate-partner-program [verified]
- **Implication for Parachute:** Don't build a referral reward from this reference alone. Get the screenshot first.

### 1.9 Low-credit warnings
- **What they do:** [UNVERIFIED] No public Apollo doc describes low-balance emails or banners. Apollo's documented approach is preview-before-spend (1.4) plus admin limits.
- **Implication for Parachute:** Take low-balance patterns from Twilio, OpenAI and Anthropic (section 5) instead.

---

## 2. lemlist / lemwarm

### 2.1 Sign-up onboarding questions
- **What they do:** [UNVERIFIED] No public teardown lists the sign-up questions. Documented: email verification is required right after sign-up, before onboarding continues. Teams created with personal email addresses do **not** get the 200 trial credits, an anti-abuse gate.
- **Source:** https://help.lemlist.com/en/articles/4941590-explore-lemlist-14-day-free-trial-features [verified]
- **Implication for Parachute:** Tie free credits to a work-email domain. That fits bank and appraisal-firm buyers and limits abuse.

### 2.2 "Get started & succeed in outreach" checklist
- **What they do:** [UNVERIFIED] The in-app checklist (accordion tasks, each with a CTA and a help article) is not documented publicly. It is probably behind login, so use the design lead's screenshots. The closest public material:
  - **Help center "Getting started" collection:** Pt 1 is technical setup (DNS/deliverability) and Pt 2 is launching the first campaign. It says: "Set up your account, connect your email and LinkedIn, and you'll be ready to launch your first campaign."
  - **lemlist Academy:** "Start with lemlist" followed by "Optimize & scale."
  - **lemlist-branded Notion onboarding checklist:** a CS handoff, not in-product. It covers lemwarm, lemlist, CRM and lemcal setup, then campaign creation.
  - **Trial article estimate:** "Takes 5–10 minutes to set up your first campaign."
- **Sources:** https://help.lemlist.com/en/collections/17109496-getting-started · https://help.lemlist.com/en/articles/4519344-getting-started-pt-1-the-technical-setup · https://help.lemlist.com/en/articles/6138232-getting-started-pt-2-launch-your-first-campaign · https://academy.lemlist.com/ · https://lempire.notion.site/Onboarding-Checklist-f1557896c6fa4a54843adab17f853c6f [secondary]
- **Implication for Parachute:** Pair each checklist row with a matching help article (one task, one CTA, one "Learn how" link). An accordion row expanding to show a CTA and an article is a reasonable build.

### 2.3 Credits and billing
- **Balance display:** "Credits" and the balance sit in the **bottom-left corner of every page**. Clicking it opens a panel with:
  - "Your remaining credits", "Team credits" and the "**Next refill**" date
  - **"Buy more credits"** and **"View history"** buttons
- **Costs:** Email finder/verifier 5, LinkedIn enrichment 1, phone finder 20, calling 4/min, SMS 6, AI variable 1. Credits are charged **only on a valid result**.
- **Buying:** Two options, and only one credit subscription can be active at a time:
  - **Enrichment add-on**, a monthly subscription that is cheaper per credit
  - **One-off top-up**, a single purchase
- **Add-on flow:** a modal with a billing-frequency dropdown and a "credits /month" volume dropdown. Tiers run from 2,000 to 200,000 per month, and above that you contact your account manager. **Only Admins can buy**, so members must ask an admin.
- **Expiry:** Free credits reset monthly with no rollover. Add-on credits roll over while the add-on is active. **Top-up and gift credits never expire** and survive cancellation.
- **Usage order:** free, then add-on, then top-up, then gift.
- **History:** "Credits spent history" has "Spending history" and "Summary per user" tabs. Filters cover date, user, feature and credit type, and there is CSV export.
- **At zero:** enrichment pauses for the whole team, campaigns keep sending, and enrichment must be restarted by hand. No auto-recharge or low-balance alert is documented.
- **Sources:** https://help.lemlist.com/en/articles/8944295-understand-credits-in-lemlist [verified] · https://www.lemlist.com/pricing [verified]
- **Implication for Parachute:** This is the closest analog to our wallet: a persistent balance that opens a panel with Buy and History, credits charged only on success, and top-ups that never expire. Mirror the usage order (free credits first) and show the credit type in history.

### 2.4 Plans, checkout and trial
- **Pricing page:** Monthly / Quarterly (−10%) / Yearly (−20%) toggle, defaulting to Yearly. Plans are Email $55 / Multichannel $87 / Enterprise custom (yearly, per month). The lead-data add-on is $16/mo for 2,000 credits, labeled "≈400 emails or 100 phone numbers". That translation of credits into outcomes is worth copying.
- **Trial:** 14 days with **200 one-time credits**, 50 emails a day, and no lemwarm or dialer.
  - It can't be paused and is one per team.
  - "No credit card required to start, and no automatic billing."
  - At the end, the account drops automatically to Freemium rather than being locked.
  - Pricing-page FAQ: "Unused credits roll over for as long as your subscription remains active."
- **Sources:** https://help.lemlist.com/en/articles/4941590-explore-lemlist-14-day-free-trial-features [verified] · https://help.lemlist.com/en/articles/9579215-freemium-plan-what-s-included-and-how-it-works [verified] · https://www.lemlist.com/pricing [verified]
- **Implication for Parachute:** Express credit packs as outcomes ("10 credits ≈ 10 desk reviews") and state "no card required, no auto-billing" next to the free credits.

### 2.5 lemwarm setup
- **What they do:** Setup goes DNS/auth checks (SPF, DKIM, DMARC, MX, tracking domain), then plan, then mailbox connect (Google / Outlook / SMTP-IMAP), then dashboard checks with a "**Refresh checks**" button. lemwarm sets expectations up front: about 5–10 minutes to start, and 3–5 weeks to warm up fully.
- **Sources:** https://help.lemlist.com/en/articles/9723310-understanding-lemwarm-how-lemwarm-enhances-deliverability-and-how-to-get-started · https://help.lemlist.com/en/articles/14653207-how-to-set-up-and-use-lemwarm [verified, excerpt]
- **Implication for Parachute:** For setup steps that can fail validation, show a status check with an explicit "Refresh checks" action and a time-to-value estimate.

### 2.6 In-app tours
- [UNVERIFIED] No public documentation found.

---

## 3. Zapier

### 3.1 Plan selection and checkout
- **Upgrade flow:** **Billing and usage**, then **Manage**, then choose a plan, then monthly or annual, then optional add-ons, then payment method. Only the account owner can change plans (on Enterprise, super admins can too).
- **Proration:** The help article includes a worked example: on a $50 plan with 15 days left, upgrading to $80 gives $25 credit, so you're charged $55 now and $80 on the next bill. Upgrades apply immediately and reset the billing date and task count.
- **Downgrades:** confirmed by a **banner** on Billing and usage that has a "Cancel downgrade" action.
- **Order summary:** The plan step shows the undiscounted price, and discounts and credits appear at the payment-method step [secondary mirror].
- **Pricing page:** Task tiers are shown as a table (100 to 2M tasks per month), noting that "higher tiers lower the per-task cost."
- **Task slider:** [UNVERIFIED] Not documented.
- **Sources:** https://help.zapier.com/hc/en-us/articles/8496260621197 [verified] · https://help.zapier.com/hc/en-us/articles/8496277302157 [verified] · https://zapier.com/pricing.md [verified]
- **Implication for Parachute:** Use a full-page, step-ordered checkout (pack, then payment, then review) with a live order summary. Show any free or promo credit as a line item before the user pays.

### 3.2 Usage meter, alerts and overage
- **Meter:** Billing & Usage shows tasks used this cycle and "Days remaining until reset." A Usage Insights tab has a daily line graph, and **at 80% usage the graph adds a projection to the end of the period**.
- **Alerts:** emails at **80% and 100%** of the task limit. Workspace limits alert at 75%, 90% and 100%.
- **Overage (pay-per-task):** opt-in. Overage costs 1.25× the base rate on annual plans and 2.5× on monthly. There is a hard ceiling: "usage stops once it reaches **3×** your task subscription." With pay-per-task off, usage pauses until the next cycle.
- **Expiry:** Zapier account credits expire 1 year after they are added and are spent before the card is charged.
- **Sources:** https://help.zapier.com/hc/en-us/articles/8496196837261-Tasks-in-Zapier · https://zapier.com/pricing.md · https://help.zapier.com/hc/en-us/articles/19206241429645 [verified]
- **Implication for Parachute:** Add a runway projection ("At your current pace, credits last about 3 weeks") and alerts at fixed thresholds. Prepaid packs need no overage, which is simpler to explain to bank procurement.

### 3.3 Zapier Agents "activities" and unified metering (2026)
- **Agents:** Agents use a separate **activity** quota (Free 400 per month, Pro 1,500). A single run is capped at 10 activities on Free and 40 on paid, "after which the agent asks before continuing."
- **AI steps:** Since Jun 15, 2026, AI steps are priced by model tier as a task multiplier (default Advanced 3×; one aggregator says Premium 5× [UNVERIFIED]).
- **Trial:** "14-day free trial of Professional", no credit card required.
- **Sources:** https://zapier.com/pricing.md · https://help.zapier.com/hc/en-us/articles/46597632373389 [verified]
- **Implication for Parachute:** "Ask before continuing past a spend cap" is a good guard for bulk review runs.

---

## 4. Pattern guidance (reputable sources)

### 4.1 Onboarding checklists
- **Appcues:**
  - Use **3–5 items**: "Checklists with more than five items see significantly lower completion rates."
  - Phrase items as actions ("Create your first project", not "Learn about projects").
  - **Complete an item on the real event**, not on a page view. A user who does the task without the guide still gets the checkmark.
  - Prefer doing the task over reading about it.
  - Celebrate each item and the full completion.
  - Segment checklists by persona.
  - "A checklist that's 60% complete is more motivating than one that's 0% complete." This is the endowed-progress effect, e.g., counting sign-up as done.
- **Userpilot:** cap at 5–7 items, and link each item to a walkthrough.
- **Sources:** https://docs.appcues.com/checklist-best-practices · https://userpilot.com/blog/user-onboarding-checklist/
- **Implication for Parachute:** 4–5 items, auto-completed from real events, with sign-up pre-checked and each row earning credits.

### 4.2 Progressive disclosure
- **NN/g:** Defer secondary options to a subsidiary screen. This improves learnability, efficiency and error rate. "The very fact that something appears on the initial display tells users that it's important." The article also distinguishes progressive from staged disclosure.
- **Sources:** https://www.nngroup.com/articles/progressive-disclosure/ · https://www.nngroup.com/videos/progressive-disclosure/
- **Implication for Parachute:** Keep auto top-up, invoices and tax IDs off the wallet's first screen. Show balance, runway and Buy first.

### 4.3 Contextual (empty-state) help versus up-front tutorials
- **Pull over push (NN/g):** "Favor pull over push revelations." Push only what users need regardless of context.
- **Tutorial study (NN/g):** In a mobile tutorial study, people who read the tutorials succeeded **91%** of the time against **94%** for those who skipped them, and rated the tasks as harder. Deck-of-cards tutorials didn't improve performance.
- **Empty states:** NN/g says an empty state should explain the container and guide the next action. Smashing says an empty state "informs the user about what content to expect … and also teaches people how to use your app."
- **Sources:** https://www.nngroup.com/articles/onboarding-tutorials/ · https://www.nngroup.com/articles/mobile-tutorials/ · https://www.nngroup.com/articles/mobile-app-onboarding/ · https://www.nngroup.com/articles/empty-state-interface-design · https://www.smashingmagazine.com/2017/02/user-onboarding-empty-states-mobile-apps/
- **Implication for Parachute:** Put the help video in the empty state of each page, which is pull. Don't add a welcome carousel.

### 4.4 In-app product tours
- **Chameleon benchmarks:**
  - **User-launched** tours complete at **64%**, against a 33.5% average (2024). Self-launched tours completed at 61.65% in 2023.
  - Three-step tours complete at about 72% and seven-step tours at 16% (2025 figures via a secondary summary [secondary]).
  - Progress indicators raise completion by **12%** and cut dismissals by 20% (2019).
  - The 2019 report advised no more than 4 steps.
- **Practice:** opt-in (a "Take a 1-minute tour" link), skippable (Esc), 3–4 steps, with a progress indicator ("2 of 3"). Offer it once per page on the first visit and remember dismissal for each user. That last rule is common practice, not tied to a single source.
- **Sources:** https://www.chameleon.io/benchmark-report-24 · https://www.chameleon.io/benchmark-report-2023 · https://www.chameleon.io/assets/chameleon-product-tour-benchmarks-report-2019.pdf · https://www.chameleon.io/blog/product-tour-benchmarks-highlights
- **Implication for Parachute:** A first visit to each page shows a dismissible "Take the 3-step tour" prompt. Never auto-launch a tour.

### 4.5 Learning center / resource hub
- **Guidance:**
  - Have one go-to place for help, not several (Chameleon).
  - Include a checklist with progress (Userflow).
  - Keep to 3–4 tabs (Usertour).
  - The content mix is articles, short videos and walkthroughs (Userpilot).
  - Separate the self-paced academy from "I'm stuck right now" help, both behind one help icon (Userpilot).
  - Apollo's free tier points users to webinars, Academy, the Knowledge Base, 24/7 AI support and a Slack community.
- **Sources:** https://www.chameleon.io/patterns/resource-centers · https://help.userflow.com/docs/resource-center-best-practices · https://userpilot.com/blog/in-app-resource-center/ · https://appcues.com/blog/in-app-resource-centers
- **Implication for Parachute:** Use one "Learn" entry point (videos by page, guides, the checklist), and keep it separate from Support.

### 4.6 Trust center / security page (B2B)
- **Pattern:**
  - **Public layer:** certifications (SOC 2, ISO 27001), a security-practices summary, subprocessors, plain-language privacy alongside the legal text, and a redacted architecture overview.
  - **Gated layer:** reports behind NDA or request-access.
  - **Platforms:** SafeBase, Vanta, Drata and Conveyor add NDA click-through and questionnaire automation.
- **Sources:** https://safebase.io/blog/5-trust-center-best-practices · https://www.safebase.io/learn/assurance/how-to-build-for-growth · https://webstacks.com/blog/trust-center-examples [secondary] · https://scytale.ai/resources/what-is-a-trust-center/ [secondary]
- **Gap:** I found no Vanta-specific guidance [UNVERIFIED].
- **Implication for Parachute:** Bank buyers will expect a /trust page with a public summary, a subprocessor list (including the AI model vendor), a data-retention and "your data isn't used for training" statement, and request-access for the SOC 2 report. Since this is a mocked prototype, label the content as illustrative.

### 4.7 Don't disable buttons: allow the click and explain
- **Guidance:**
  - GOV.UK says to avoid disabled buttons "where possible", using them only "when research shows that they make the interface easier to understand." This is relayed by a secondary source; confirm it on design-system.service.gov.uk/components/button/.
  - Axess Lab ("Disabled buttons suck"): no feedback, low contrast, and screen-reader focus skips them.
  - Adrian Roselli ("Don't Disable Form Controls", 2024): the strongest case is against disabling **submit** buttons, and there are narrow legitimate uses.
  - Opquast: use `aria-disabled="true"` plus `aria-describedby` with the reason, rather than the `disabled` attribute.
- **Sources:** https://design-system.service.gov.uk/components/button/ · https://axesslab.com/disabled-buttons-suck/ · https://adrianroselli.com/2024/02/dont-disable-form-controls.html · https://checklists.opquast.com/en/digital-quality/98 · https://www.drupal.org/node/3049086 [secondary relay of GOV.UK]
- **Implication for Parachute:** "Start review" with 0 credits should stay clickable and open a "You need 1 credit, buy credits or ask your admin" explanation. Use `aria-disabled` and a visible reason, not a greyed-out dead button.

### 4.8 Hover-only actions
- **Guidance:**
  - Mouse-only reveals fail keyboard users, so the same trigger is needed on focus (BOIA; WCAG 2.1.1).
  - CSS `:hover` styles don't apply on focus, so focus parity has to be built on purpose.
  - Touch devices have no hover.
  - Content that appears on hover or focus must be dismissible, hoverable and persistent (WCAG 1.4.13).
  - Hover reveals are undiscoverable because no visual cue says an element responds to hover.
- **Sources:** https://www.boia.org/blog/hover-actions-and-accessibility-addressing-a-common-wcag-violation · https://w3c.github.io/wcag21/understanding/21/content-on-hover-or-focus.html · https://webaim.org/discussion/mail_message?id=49566
- **Gap:** I found no NN/g article on this [UNVERIFIED].
- **Implication for Parachute:** Row actions in tables (queue, credit history) should always be visible or sit behind a visible "⋯" menu. Never reveal them on hover only.

### 4.9 Checkout (Baymard)
- **Guidance:**
  - Keep the order summary visible on the payment step. **12%** of US shoppers abandoned an order because they couldn't see the total up front.
  - A multi-step checkout needs a clear **review step after payment details**.
  - One-page checkout is not automatically better.
- **Sources:** https://baymard.com/blog/payment-ux · https://baymard.com/research-articles/one-page-checkout
- **Implication for Parachute:** Use a full-page buy flow with a sticky summary (pack, credits, price per credit, tax, total, and "never expires") plus a review step, especially since approval is required.

---

## 5. Credit-based billing UX references

| Product | Balance and alerts | Auto top-up | Purchase | Receipts / expiry |
|---|---|---|---|---|
| **Anthropic Console** [verified] | "Credit balance" section on the Billing page. At zero you "can no longer call the API or use the playground until you add more." | "Set up auto-reload" / "Manage auto-reload". Fields: "**When credit balance reaches**" and "**Bring credit balance back up to**". If already at or below the threshold, the button becomes "**Turn on and purchase**". Turning it off needs a confirm. | Billing, then "**Buy credits**", then enter an amount and confirm. Only Admin and Billing roles can buy. Credits are available immediately. | Receipt for every purchase, including auto-reloads. "Invoice history". Credits expire after 1 year and are non-refundable. |
| **OpenAI API** [verified, excerpts] | At zero the API returns `credit_balance_exhausted`. A late cutoff can leave a negative balance, deducted from the next purchase. | Threshold, refill amount and an optional **monthly recharge limit**. Minimum $5. On by default at setup. The limit caps automatic buys only. | "Buy credits" / "Add to credit balance". Minimum $5, default $10. | Credits expire after 1 year and are non-refundable. |
| **Twilio** [verified, excerpts] | Default **$5 low-balance email**. | Default auto-recharge when the balance falls under $10. Fields: "Recharge Balance To" and "When Balance Falls Below". Email confirms each card charge. Not available on invoiced accounts. | Manual "Add funds". | Not reviewed. |
| **Clay** [verified] | Settings > Usage. | n/a | "Add one-time data credits". Top-ups cost **30% more** than plan credits. Upgrades grant credits immediately. | Monthly-plan rollover is capped at 2× the monthly allowance. A cap of 4× per month on purchases is reported [UNVERIFIED]. |
| **lemlist** [verified] | Bottom-left balance opens a panel showing "Next refill". | Add-on subscription; no auto top-up documented. | Admin only. Add-on or one-off top-up. | Top-up credits never expire. History has CSV export. |
| **Zapier** [verified] | Alerts at 80% and 100%, plus a projection from 80%. | Pay-per-task overage, opt-in, capped at 3×. | Billing and usage, then Manage, then plan, then payment. | Account credits expire after 1 year. |

**Sources:**
- https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-claude-api-usage
- https://help.openai.com/en/articles/8264644 and https://help.openai.com/en/articles/9047769 (fetch blocked; excerpts)
- https://support.twilio.com/hc/en-us/articles/223135607-How-do-I-set-a-recharge-trigger-
- https://support.twilio.com/hc/en-us/articles/360015760053-Manually-Add-Funds-and-Refill-your-Twilio-Project-Balance
- https://university.clay.com/docs/actions-data-credits
- https://www.clay.com/blog/introducing-clay-pricing-3-0-the-most-flexible-credit-system-on-the-market

**Implications for Parachute:**
- Auto top-up is a two-field control: "When balance reaches N credits" and "Top up to M credits". Add an optional monthly cap, since banks will want spend governance, and send a receipt for every automatic charge.
- Only admin and billing roles buy. Members get a "Request credits" path. This matches our "buying waits for approval" commit.
- Low balance shows as an in-app banner plus an email at a threshold the admin can set (default: under 2 credits, or under 1 week of runway).
- Pre-spend confirmation, from Apollo: "Uses 1 credit · 4 left".
- Every purchase gets a downloadable receipt in a Billing > History list.

---

## 6. Open-source tour libraries (React 19 / Next)

npm metadata pulled with `npm view` on Nov 11, 2026.

| Library | Version | License | Last publish | React 19 / Next | Accessibility | Notes |
|---|---|---|---|---|---|---|
| **driver.js** | 1.11.0 | **MIT** | 8 Nov 2026 | Framework-agnostic, zero deps; wrap it in a client component | "Everything is controllable by keyboard". No ARIA or focus trap documented. | 27.1k stars, very active. Lightweight highlight-and-popover. |
| **react-joyride** | 3.2.0 | **MIT** | 9 Jul 2026 | Peer dependency `react 16.8 – 19`; README claims React 19 support (v3) | README: "**Focus trapping, keyboard navigation, and ARIA support**" | 7.9k stars. The strongest a11y story among the MIT options. |
| **Shepherd.js / react-shepherd** | 15.3.0 / 7.0.6 | **AGPL-3.0, commercial licence required** for "commercial products and revenue-generating companies" | 24 Aug 2026 | Peer dependency `react ^18 \|\| ^19` | Not stated in the README (historically has keyboard and a11y support [UNVERIFIED]) | 13.8k stars. **Licence rules it out** for Realwired unless they buy a licence. |
| **NextStep** (`nextstepjs`) | 2.3.0 | **MIT** | 20 Jul 2026 | Peers: next ≥13, motion ≥11, react ≥18; adapters for React Router and Remix | Arrow keys and Esc; no ARIA documented | About 1k stars. Next-native and route-aware (cross-page tours). |
| **Onborda** | 1.2.5 | **MIT** | **22 Dec 2024** (stale) | Peers: next ≥13, framer-motion ≥11, Tailwind, Radix portal | None documented | 1.4k stars, no publish in nearly 2 years. **Avoid.** |
| @reactour/tour (bonus) | 3.8.0 | MIT | May 2025 | Peer dependency includes 19.x | Not reviewed | Slower cadence. |

**Sources:** https://github.com/kamranahmedse/driver.js · https://github.com/gilbarbara/react-joyride · https://github.com/shipshapecode/shepherd · https://github.com/enszrlu/NextStep · https://github.com/uixmat/onborda

**Implication for Parachute:** Use **react-joyride v3** if accessibility matters most (it claims focus trap and ARIA), or **driver.js** for the smallest, most active dependency. Avoid Shepherd (AGPL) and Onborda (stale). Any choice still needs our own opt-in prompt and per-page dismissal memory.

---

## Open items to verify with the design lead's screenshots
1. Apollo per-task "Earn N credits" values, and what happens at day 14.
2. Apollo's "invite friends, receive 25 credits" referral, since no public trace was found.
3. Apollo's credits indicator in the top nav and its low-credit banners.
4. Apollo's full-page "Add more credits" checkout layout.
5. lemlist's "Get started & succeed in outreach" accordion and its sign-up questions.
6. The exact GOV.UK disabled-button wording, from the primary page.
