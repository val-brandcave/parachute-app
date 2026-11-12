# Motion contract: onboarding (draft, 11 Nov 2026, pending Val)

This is the single source of numbers for the onboarding motion prototype (`proposed-screens/onboarding-motion.html`) and for the written spec (`motion-spec.md` and `spec.md` §5.15).

The app already ships `framer-motion` ^12.40 (`app/package.json`); no new motion dependency is added. Confetti uses `canvas-confetti` (new dependency, about 6 KB).

## Layout decision this builds on (Val, 11 Nov): option C

- The onboarding card stays **vertically centred** (board 1 frame A). It is not anchored to the top.
- The content comes from option B:
  - Book a call uses the **same card** as the other steps: the scheduler goes inside the card, under the same 2-segment progress bar.
  - The side panel's content changes per step:
    - Org setup: "What Parachute checks"
    - Invite: "What your team gets"
    - Book a call: "What happens next"
  - The side panel does **not** stretch; it is centred beside the card.
- Centring makes the card jump in height between steps. **Motion absorbs the jump:**
  - The card's height animates (framer `layout`) while its content cross-fades.
  - The centred position therefore glides instead of snapping.
- Verify email (one card, no side panel) → Org setup (card + panel) is a deliberate layout change. It marks the hand-off from identity (Realwired ID) to product setup, and is animated so it reads as continuous.

## Personality and constants

- **Archetype:** Corporate.
  - Calm and precise, with no bounce on UI.
  - Playful is allowed only for the confetti moment and illustration accents.
- **Signature easing:** `cubic-bezier(0.2, 0, 0, 1)` (`ease.standard`), used for about 80% of motion.
  - Enter: `cubic-bezier(0.05, 0.7, 0.1, 1)` (`ease.enter`).
  - Exit: `cubic-bezier(0.3, 0, 1, 1)` (`ease.exit`).
- **Durations:**
  - `quick` 150 ms: press feedback, toggles
  - `standard` 280 ms: card height, content swap, callout reveal
  - `slow` 480 ms: layout change, interstitial in and out
- **Entrance pattern:** opacity 0 → 1 combined with 12 px of travel. Never opacity alone.
- **Stagger:** 60 ms between siblings; total under 400 ms.
- **Reduced motion** (`prefers-reduced-motion: reduce`, and framer's `useReducedMotion`):
  - All travel becomes 0; cross-fades shorten to 120 ms.
  - No confetti; the interstitial shows its finished list right away and holds for 600 ms.
  - The height change is instant.

## Transitions

| ID | From → to | What moves | Timing |
|---|---|---|---|
| T1 | Sign-up → Verify email | Same single card. Content cross-fades with an x shift of −16 px out and +16 px in | exit 150 ms `ease.exit`; enter 280 ms `ease.enter`; card height `layout` 280 ms `ease.standard` |
| T2 | Verify → Org setup | The card moves from centre to the left column (framer `layout`, 480 ms `ease.standard`). The side panel then enters: opacity plus x +24 px, delay 120 ms, 280 ms `ease.enter`. The step 1 progress segment fills, 400 ms | about 600 ms total |
| T3 | Org setup → Invite, or Org setup → Book a call | Card content swaps as in T1, going forward (left). Card height `layout` 280 ms. Step 2 progress segment fills, 400 ms. Side panel content cross-fades (opacity plus y 8 px, 280 ms) | about 400 ms |
| T3b | Back (browser back or a "Back" link) | Mirror of T3: content moves right | same |
| T4 | Final step → interstitial | The card and panel exit together: opacity plus scale 0.98, 280 ms `ease.exit`. The interstitial enters: opacity plus y 12 px, 280 ms `ease.enter` | about 560 ms |
| T5 | Interstitial → Get started | The interstitial fades out (280 ms). The app shell fades in (sidebar first, then the page, 60 ms stagger). On self-serve, confetti fires 200 ms after the page lands | about 700 ms, plus confetti |

## Micro-interactions

- **Segmented option / pill press:**
  - Press: scale 0.97, `quick`.
  - Release: back to 1, `standard`.
  - Selected fill and border: `quick` colour change.
- **Crossing the enterprise threshold:**
  - The "Teams your size start with a short call" callout grows from height 0, then fades and lifts in (y 8 px), `standard`.
  - The primary button label cross-fades "Continue" ↔ "Book a call", with the calendar icon sliding in from x −6 px, `standard`.
  - The answer that triggered it gets a petrol marker that fades in.
- **Email chips:**
  - Added chip pops: scale 0.9 → 1, opacity, `quick`.
  - Removed chip: scale 0.9, fade, `quick`, then the remaining chips reflow with `layout`.
  - The "Send N invites" count cross-fades the number.
- **Validation on click** (never a disabled button):
  - The field shakes ±6 px twice, 300 ms, `ease.standard`.
  - The inline error slides down (height plus opacity, `standard`).
  - Focus moves to the field.
- **Primary button busy (mock latency 500–700 ms):**
  - The label is replaced by a 16 px spinner; the width is held.
  - On success the content swaps (T3 or T4).
- **Calendar slot select:**
  - The selected slot fills (`quick`).
  - The Book button's label cross-fades to name the slot.
- **Verify code:**
  - The six boxes fill in sequence on paste (30 ms stagger).
  - On success, a check draws (stroke-dashoffset, 280 ms) before T2.
  - On a wrong code: shake plus a red outline, and the code clears.

## Interstitial: "Setting up your workspace" (Apollo pattern, our copy)

The reference is Apollo's personalising interstitial, `docs/references/pattern-audit-nov-2026/apollo/02-personalizing-workspace-interstitial.jpg`.

**Layout:**
- A centred column with no card: the logo mark, title, three-line checklist and a thin progress bar.

**Self-serve:**
- Title: "Setting up Harbor Community Bank"
- Checklist lines, each a spinner that turns into a check:
  1. "Creating your organization"
  2. "Adding your 6 trial credits"
  3. "Preparing your setup guide"
- Lines resolve one at a time, at 500 ms, 1000 ms and 1500 ms. The bar fills linearly over 1.8 s (linear is allowed: it shows progress).
- When the last check lands, hold 300 ms, then T5.

**Enterprise:**
- Title: "Getting Harbor ready for your call"
- Checklist lines:
  1. "Creating your organization"
  2. "Booking Fri, Nov 13 at 10:00 AM"
  3. "Preparing your setup guide"
- Same timing.

**Timing rules:**
- Total time is at least 1.2 s and at most 2.4 s.
- In the real build, it ends when the data is ready, with a minimum of 1.2 s so the screen never flashes.

## Celebration: confetti on landing in Get started

**When it fires:**
- Only for **self-serve**: the trial is live, so something real is being celebrated.
- **Enterprise does not fire it** on landing; it lands on the pending state. It fires later, when Realwired approves the org and releases the trial.

**What it looks like:**
- Two bursts from the lower left and lower right, angled inward:
  - 70 particles each, `spread` 60, `startVelocity` 45, `ticks` 200, `gravity` 1.1, `scalar` 0.9.
  - Shapes: `square` and `circle`.
  - Colours: navy `#10344c`, petrol `#2a6f7f`, tint `#d6e3ee`, success green `#2e7d4f`, warm accent `#e0a43a`.
- A second, smaller wave of 30 particles each, 250 ms later.

**Message:**
- At the same time, Get started's header shows a one-line welcome: "You're in. 6 trial credits are ready." It enters with opacity plus y 8 px. It sits inline above the sections, not in a modal or toast, and can be dismissed.

**Rules:**
- It fires **once per user** (persisted flag); a reload doesn't repeat it.
- Never with reduced motion.
- Never on any later visit to Get started.
- Finishing a whole Get started section fires a small single burst (30 particles) from that section's earn pill.
