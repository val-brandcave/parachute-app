# Icon map: onboarding, credits and billing (pattern change, Nov 2026)

All icons are Tabler (`@tabler/icons-react` 3.44.0). Every name below was checked against the installed package.
To use one in the app, add it to the registry in `app/src/components/atoms/Icon.tsx` and use it via `<Icon name="…" />`.
Rows marked *(new)* are not in the registry yet.

**Sizing rule:** 16 px in nav and buttons, 14 px in pills and chips, and 13 px inline in dense rows.
The stroke stays at the Tabler default (2). Icons take `currentColor`, so state colour comes from the text colour, never from the icon alone.

**Division of labour:** the spot illustrations in `illustrations/` cover empty states, resource cards, explainers and add-on rows (48 px and up).
Icons cover everything that sits in a line of text or a control. Don't use an illustration where an icon fits, and don't scale an icon up into an empty state.

---

## 1. Global chrome

| Surface | Icon | Why |
|---|---|---|
| Credits pill, top nav ("12 credits") | `IconWallet` | The pill opens the wallet popover. A wallet names the container, which a coin doesn't, and it avoids the coin glyph the design lead called meaningless. |
| Credits pill, low balance | `IconWallet` + text colour `--md-warn` | Keep the same glyph and change only the colour and copy ("2 credits left"). Swapping the glyph would read as a different control. |
| Credits pill, approval pending (no wallet yet) | `IconHourglassHigh` *(new)* | The org has no spendable balance yet, so the pill should say what's blocking, not show "0". |
| Trust Center nav | `IconShieldLock` | It's already in the registry. Shield plus lock means security documentation for IT, and it matches spot 03. |
| Learning Center nav | `IconSchool` *(new)* | "Learning" at a glance. `IconBook` is already taken by guides and docs, and `IconPlayerPlay` would suggest videos only. |
| Help / contact support | `IconLifebuoy` | It's already used as `support`. Keep it distinct from the Learning Center. |
| Talk to sales / advanced needs | `IconMessages` *(new)* | Two bubbles means a conversation with a person, and it matches spot 12. Use `IconCalendarEvent` *(new)* only on the "Book a call" button itself. |

## 2. Setup checklist (sections and rows)

| Surface | Icon | Why |
|---|---|---|
| Step: not started | `IconCircleDashed` *(new)* | A dashed ring reads as "still to do" without implying an error. |
| Step: in progress | `IconProgress` *(new)* | A partial ring. It's quieter than a spinner, which wrongly implies the system is working. |
| Step: done | `IconCircleCheck` (`check-circle`) | Already in the registry. Coloured `--md-success`. |
| Step: locked until approval | `IconLock` | The lock-not-disable pattern (§4). The row stays readable and clickable. |
| Section: set up your organisation | `IconBuilding` | The org is a building. It's already in the registry. |
| Section: run your first review | `IconFileSearch` *(new)* | An appraisal plus inspection, matching spot 05. |
| Section: invite your team | `IconUserPlus` | Already in the registry. |
| Section: security and compliance | `IconShieldLock` | It's the same glyph as the Trust Center nav, because that's where the section leads. |
| Section expand / collapse | `IconChevronDown` (rotate 180° when open) | This is the standard disclosure. Don't use a separate "up" chevron. |

## 3. Earn badge (replaces the "+1 coin")

Today `SetupChecklist.tsx` renders `<Icon name="coins" /> +{step.reward}`, and the summary says "N of M credits earned".
"+1" next to a coin doesn't say what you get. A credit is an internal unit, but **a free report is the thing the customer values.**

**Recommendation:** use a text pill that names the reward in customer terms, with `IconGift` *(already in the registry)*.

| State | Treatment | Icon |
|---|---|---|
| Available on a step | Petrol-tint pill: **"Earn 1 free report"** | `IconGift` 14 px |
| Earned | Neutral pill: **"1 free report earned"** | `IconCircleCheck` 14 px, coloured `--md-success`. Swap the gift for the check so the state change is obvious. |
| Summary line | "2 of 3 free reports earned". A muted pill, no icon | No icon. The step pills already carry it. |
| Ledger row in usage history | "Free report: setup reward" | `IconGift` |
| Not earnable (invoiced or enterprise orgs) | Hide the pill entirely | No pill. Never show a struck-out reward. |

**Rules:**
- Never show a bare number ("+1"). Always write the noun: "report", not "credit".
- Use one gift glyph per row at most. Don't stack gift and coin icons.
- The pill text carries the meaning, and the icon is decoration (`aria-hidden`).
- The pill shows on hover or focus only on dense rows, and always on the step that's next.

Rejected options: `IconCoins` (the meaningless unit again), `IconRosette` / `IconAward` (they read as a badge or achievement, which gamifies it), and `IconTicket` (it reads as "event" or "support ticket" in a banking product).

## 4. Lock-not-disable pattern

| Surface | Icon | Why |
|---|---|---|
| Locked control (trailing glyph on a button, tab or row) | `IconLock` | The control looks normal and the lock explains why it won't run. Clicking opens the explainer (spot 10). Never use `disabled` plus grey with no reason. |
| Explainer dialog CTA: admin can upgrade | `IconArrowUpRight` *(new)* on "See plans" | It points the way out, Apollo-style. |
| Explainer dialog CTA: member asks the admin | `IconSend` | Already in the registry. "Send request to Priya" is an action, not navigation. |
| Request already sent | `IconCircleCheck` + "Requested · Priya will be notified" | It confirms the action without leaving the dialog. |
| Feature just unlocked (toast) | `IconLockOpen` (`unlock`) | It plays once at the moment of change, then the lock disappears from the control. |
| Approval-gated (not a plan gate) | `IconHourglassHigh` *(new)* instead of `IconLock` | Waiting on Realwired staff is not something you can buy. Use a different glyph so users don't hunt for an upgrade. |

## 5. Checkout steps

**Recommendation:** the stepper uses **numbers, not icons**. Completed steps swap the number for `IconCheck`.
This matches Calm Precision: an icon per step adds visual noise without adding meaning. The icons below are for the step *headers and summary rows* only.

| Step | Icon (header / summary row) | Why |
|---|---|---|
| 1 · Amount (credits picker) | `IconStack2` *(new)* | A stack means a quantity, without a coin. |
| 2 · Add-ons | `IconPuzzle` *(new)* | The standard "extends your plan" metaphor, and it pairs with the add-on row illustrations. |
| 3 · Review | `IconReceipt` | Already in the registry. A line-item summary. |
| 4 · Payment | `IconCreditCard` | Already in the registry. |
| Submitted, needs approval | `IconHourglassHigh` *(new)* | It's the same glyph as the approval-pending state everywhere else. |
| Completed step in the stepper | `IconCheck` | Replaces the step number. |
| "What are credits?" link in checkout | `IconInfoCircle` | Already in the registry. It opens the explainer, which uses spot 01. |
| Custom amount at tier rate | `IconCalculator` *(new)* | The price is computed, not picked from a list. |

## 6. Billing states (badges and banners)

The badge colour comes from the state tokens. The glyph is a second channel for colour-blind users.

| State | Icon | Colour | Why |
|---|---|---|---|
| Active / paid | `IconCircleCheck` | `--md-success` | The universal OK. |
| Approval pending (Realwired confirms larger orgs) | `IconHourglassHigh` *(new)* | `--md-warn` | Time-based waiting, with no action for the user. Matches spot 09. |
| Low balance | `IconAlertTriangle` (`warn`) | `--md-warn` | A heads-up, not yet blocking. |
| Out of credits | `IconWalletOff` *(new)* | `--md-error` | It's specific: it's the wallet that's empty, not a generic error. |
| Payment failed / card declined | `IconAlertCircle` (`fail`) | `--md-error` | Blocking, and the user must act. |
| Invoiced (enterprise) | `IconFileInvoice` *(new)* | neutral | It separates "billed by invoice" from card billing at a glance. |
| Refund issued | `IconReceiptRefund` *(new)* | neutral | A ledger row. |
| Trial / sample | `IconFlask` | neutral | It's already used for prototype and sample content. Keep that single meaning. |
| Top up wallet (button) | `IconPlus` | — | Text is "Add credits". The plus is enough, and the wallet is already in the pill. |
| Usage history | `IconHistory` | — | Already in the registry. |

## 7. Prototype-only controls (demo dock, state switcher)

These are marked as prototype chrome. They must not borrow glyphs from real product surfaces.

| Surface | Icon | Why |
|---|---|---|
| State-switcher pill ("Onboarding · Self-serve · Enterprise", Equisant-style) | `IconSwitchHorizontal` *(new)* | It means "switch between views". It isn't `IconArrowsExchange`, which is already used for real exchange actions. |
| Fill wand (auto-fill a form with sample data) | `IconWand` *(new)* | The universal "fill this for me". Never use `IconSparkles`, which means AI in the product. |
| Hide demo controls | `IconEyeOff` | Already in the registry. It hides chrome for clean screenshots. |
| Show demo controls | `IconEye` | The paired state. |
| Collapse dock | `IconLayoutBottombarCollapse` *(new)* | When the dock minimises rather than hides. |
| Demo "+5 credits" button | `IconPlus` + text "Add 5 credits" | Replaces `IconCoins` in `DemoDock.tsx` so the coin glyph leaves the app entirely. |
| Prototype index (screen list) | `IconSitemap` *(new)* | An index of routes and screens. `IconLayoutGrid` would read as a dashboard. |
| Reset demo | `IconRestore` | Already in the registry. |

---

## Glyphs to remove

- `IconCoins` in `SetupChecklist.tsx` (×2), `DemoDock.tsx` and `run/CostSummary.tsx` (×3). Replacements: the earn pill (§3), `IconPlus` (§7) and `IconWallet` for cost lines ("Uses 2 credits from your wallet").
- Once nothing references it, drop `coins` from the registry so it can't creep back.
