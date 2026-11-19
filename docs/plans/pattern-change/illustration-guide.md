# Illustration guide: spots, scenes and icons (pattern change, Nov 2026)

The files are in `illustrations/`. To see every file on light and dark, open `illustrations/preview.html`. Add `?theme=light&only=tier-2` to the URL to show only the scenes and the before/after comparison.
Icons are covered in `icon-map.md`. This guide covers the two illustration tiers and where each file goes.

## 1. The three tiers

| Tier | What it is | Canvas | Shown at | Use it when |
|---|---|---|---|---|
| **Tabler icon** | A single glyph in `currentColor` | 24 × 24 | 13–16 px (see `icon-map.md`) | It sits in a line of text, a button, a pill, a nav item, a table row or a step marker. |
| **Spot** (tier 1) | One object, or a pair of objects, in "Drafted" ink with one petrol object and a hard offset shadow | 120 × 90 | 48–160 px wide | It fills a small, bounded place: an empty state, a resource card, a dialog header or an add-on row. |
| **Scene** (tier 2) | A small story of three or four objects on a tint panel, with one or two petrol objects | 320 × 200 | 280–480 px wide | It's the one hero image on a page or step that explains something, welcomes someone, or marks that something is done. |

**Choosing a tier:** if the image would sit inside a line of text, use an icon. If it needs to name a single thing ("no reviews yet", "locked"), use a spot. If it needs to show something happening (credits turning into findings, a figure being traced to its page), use a scene. Use at most one scene per screen.

## 2. Sizes

| Asset | Minimum | Default | Maximum | Notes |
|---|---|---|---|---|
| Spot, inline empty line | 48 px | 64 px | 72 px | Use the original 01–12 files. The panel stays off, because at this size it turns into a blob. |
| Spot, card or dialog | 96 px | 120–144 px | 160 px | Use the **b** revisions. Switch the panel on when the card surface is plain white. |
| Scene, hero or explainer | 280 px | 360–420 px | 480 px | Don't go below 280 px, because the muted detail lines start to merge. Below that size, use the matching spot. |
| Scene, success state | 240 px | 280 px | 320 px | Success screens are short, so keep the scene below the message rather than above it. |

The stroke does not scale up: ink is 2.25 in a spot and 2.5 in a scene, both in viewBox units. Never stretch a spot to scene size. Use the scene instead.

## 3. Theming knobs (shared by both tiers)

The ink is `currentColor`. Every fill is a CSS variable, so one file covers light and dark.

| Variable | Light | Dark | Used for |
|---|---|---|---|
| `color` (ink) | `#10344C` | `#DCE4EA` | Outlines |
| `--ill-paper` | `#FFFFFF` | `#1E2328` | Object bodies |
| `--ill-accent` | `#2A6F7F` | `#4A93A4` | The petrol object(s) |
| `--ill-tint` | `#DEEBEE` | `#173039` | Highlights, and the scene panel by default |
| `--ill-shadow` | `#C9D7E3` | `#24425A` | Original 01–12 shadows (+3/+3) |
| `--ill-shadow-strong` *(new)* | `#AFC3D4` | `#2D5473` | 01b–12b shadows (+4/+4) and scene shadows (+5/+5) |
| `--ill-panel` *(new)* | unset | unset | Spots: unset means no panel, and setting it (usually to `var(--ill-tint)`) switches the oval panel on. Scenes: falls back to `--ill-tint`, so the panel is always present. |
| `--ill-muted` | `#8FA3B3` | `#62717D` | Detail lines and "+" registration marks |
| `--ill-stroke` | 2.25 | 2.25 | Spot ink weight. Scenes use `--ill-stroke-scene` (2.5). |

Inline the SVG, or use it as a React component, so that `currentColor` and the variables apply. An `<img src>` can't be themed, so it only shows the light fallbacks.

## 4. Placement rules

**Empty states.** Use the 3-level empty rule (see the empty-states work, `285dc5b`):
- **First-run block** (the page has never had data): a spot at 120–144 px with the panel on, to the left of or above the heading and one action. A scene goes here only on the Reviews page's very first visit (`23-scene-first-review`).
- **Empty list after filtering, or a one-line empty:** an icon or nothing. No illustration, because it would make a filter result look like an error.
- **Empty panel inside a page** (no findings on this page): a spot at 48–64 px, panel off.

**Resource cards** (Learning Center, Trust Center, Get started resources):
- Put the art in a top band the full width of the card, with the spot centred at 120–144 px. Use the b revision with the panel on, so every card in the row has the same weight.
- Use one illustration style per row. Don't mix scenes and spots in a single card row.

**Dialogs** (lock dialog, confirm purchase, request access):
- Use a spot at 96–120 px, centred above the title. Use the b revision with the panel off, because the dialog surface is already the frame.
- Never put a scene in a dialog. It pushes the action below the fold on a laptop.

**Heroes** (How credits work, Trust Center, Learning Center landing):
- Put the scene on the right, at 360–460 px, with the headline and one paragraph on the left and both columns centred vertically. On mobile, put the scene below the text and cap it at 100% width.
- Don't put a scene on a coloured band. The scene brings its own panel, and a second background makes a box inside a box.

**Checkout:**
- The steps (plan, credits, review) carry **no** illustration. They are forms, and art there competes with the price.
- The success step carries `24-scene-checkout-success` at 280 px, below the confirmation line and above "Go to reviews".
- The order summary sidebar uses icons only.

## 5. Do and don't

**Do**
- Keep one petrol object per spot and at most two per scene, and put the petrol on the thing the sentence is about (the credit, the check, the shield).
- Let one object break the panel edge in every scene. That's what makes it read as an object on a mat rather than a framed picture.
- Pair every illustration with a heading that says the same thing in words. The art supports the copy and never replaces it.
- Keep a meaningful `<title>` when the illustration carries meaning. Add `aria-hidden="true"` when the heading next to it already says the same thing, which is the usual case.
- Draw new files from the same parts: pages with a folded top-right corner, muted detail lines, a hard shadow with no blur, and a "+" mark instead of sparkles.

**Don't**
- Don't put text, numbers or currency signs inside an illustration. Glyphs (a page icon, a check) stand in for labels.
- Don't use state colours (success green, warn amber, danger red) in an illustration. State lives in the copy and the icons.
- Don't use a monospace font anywhere near the art (house rule), and don't add a sparkle, a gradient or a blur.
- Don't draw people or faces. Hands are fine (a cursor is better).
- Don't animate scenes by default. If one moves, it moves once, on the success step only, and respects `prefers-reduced-motion`.
- Don't use the same illustration twice on one screen, or the same scene on two consecutive steps.
- Don't recolour the petrol per product area. One accent across the whole app is the point.

## 6. Which file goes where (the redesign screens)

| Screen / surface | File | Size | Notes |
|---|---|---|---|
| **Get started**, page header | none | n/a | The checklist is the hero. A scene above it would push step 1 below the fold. |
| Get started, resource cards row | `04b-learning-center`, `03b-trust-center`, `12b-talk-to-sales` | 120 px, panel on | These are three cards in one row, all b revisions. |
| Get started, "Run your first review" step, expanded | `05b-empty-reviews` | 96 px, panel off | This is inside the step body. Use the icon `IconFileSearch` on the collapsed row. |
| **Credits popover** (top-nav pill) | none at the top; `01-credits` at 48 px in the zero-balance state only | 48 px | The popover is a control surface. Use icons for the rows. |
| Credits popover, approval pending | `09-approval-pending` | 48 px | Use this instead of the zero-balance art. |
| **Lock dialog** (locked feature clicked) | `10b-locked-feature` | 104 px, panel off | Centre it above the title. Use `15-request-sent` on the dialog's confirmation state after "Ask your admin". |
| **Checkout steps** (plan, credits, review) | none | n/a | They're forms, so art would compete with the price. Use icons only. |
| **Checkout success** | `24-scene-checkout-success` | 280 px | Put it below "Payment received". If the layout is too short, fall back to `13-payment-received` at 120 px. |
| **How credits work** (explainer page or drawer) | `20-scene-how-credits-work` | 420 px hero | Use the hero layout (text left, scene right). Further down the page, the "Add credits" block uses `02b-wallet-top-up` at 120 px. |
| **Reviews, empty** (first run) | `23-scene-first-review` | 360 px | Use it on the first visit only. After that, the first-run block uses `05b-empty-reviews` at 120 px. |
| Reviews, empty after filters | none | n/a | Use one line of text, plus the clear-filters action. |
| Review page, no findings on a page | `07-finding-citation` | 48 px | Panel off. |
| **Tour** (product tour cards) | step 1 `20-scene…` at 280 px; later steps `07b-finding-citation`, `08b-signed-workbook`, `01b-credits` | 120 px | Use one scene, on the first card only. Every other card uses a spot, so the tour doesn't feel like a slideshow. |
| **Trust Center** landing | `21-scene-trust-center` | 420 px hero | The document list below uses icons only. |
| **Learning Center** landing | `22-scene-learning-center` | 420 px hero | The video and guide cards below use thumbnails, not illustrations. |
| **Billing states**: balance healthy | none | n/a | It's a table and a balance, so no art. |
| Billing, low balance or expiring | `14-credits-expiring` | 96 px, panel on | Use it in the inline notice card, not in a banner. |
| Billing, zero balance | `01b-credits` | 120 px, panel on | Put it in the first-run-style block with "Add credits". |
| Billing, approval pending | `09b-approval-pending` | 120 px, panel on | Use it in the same slot as the zero-balance art, so the page doesn't jump. |
| Billing, payment received (receipt detail) | `13-payment-received` | 96 px | |
| Billing, earn a free report (referral) | `11b-earn-free-report` | 96 px | Use it in the add-on row layout. |
| **Book a call** page / dialog | `12b-talk-to-sales` | 120 px in a dialog | Use the spot on the booking form. |
| Book a call, confirmed | `25-scene-call-booked` | 320 px | This is the enterprise path's success state, so it mirrors checkout success. |
| **Reviewer request** (ask an admin for a reviewer seat or access) | `15-request-sent` after sending; `10b-locked-feature` before | 104 px, panel off | This follows the same pattern as the lock dialog. Use `08b-signed-workbook` if the request is specifically about signing rights. |
| First upload (intake drop zone, empty) | `06b-first-upload` | 96 px, panel off | Put it inside the drop zone, above "Drop an appraisal PDF". |

Spots 13–15 were added to this folder separately, in the original tier-1 style. They don't have b revisions yet. If they sit next to b files in the same row, revise them the same way: a +4/+4 `--ill-shadow-strong` shadow, a larger petrol object and the `.bg` oval.

## 7. What changed between 01–12 and 01b–12b

- **The shadow** moved from +3/+3 in `#C9D7E3` to +4/+4 in `#AFC3D4` (dark `#2D5473`), so it reads at card size.
- **Each petrol object got bigger.** Examples: the whole coin stack (01), the coin (02), the shield (03), the video screen (04), the lens rim and handle (05), the citation chip (07), the elapsed-time sector (09), and a wider ribbon (11).
- **There's an optional panel:** an oval `.bg` shape behind each spot, which is off unless `--ill-panel` is set.
- The originals are unchanged. Use the originals at 48–72 px and the b revisions at 96 px and up.
