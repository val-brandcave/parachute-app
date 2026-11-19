# Motion spec: onboarding transitions, micro-interactions, interstitial and confetti

**Status:** draft, Nov 11, 2026. Pending Val's confirmation, except the layout (option C), which Val confirmed on Nov 11 (spec PC-24).
**Numbers:** every duration, easing, distance and particle count below is copied from `motion-contract.md`. Values that are not in the contract are marked **(derived)**, with the reason.
**Parent spec:** `spec.md` §5.1 (onboarding), §5.2 (Get started) and §5.15 (summary). Decisions PC-24 to PC-27.
**Paths:** relative to `app/src/` unless they start with `app/` or `docs/`. **(new)** marks a file that does not exist yet.

---

## 0. What exists today (checked Nov 11)

| Fact | Where | Consequence |
|---|---|---|
| `framer-motion` `^12.40.0` is installed (resolves to 12.40.0). `MotionConfig`, `MotionGlobalConfig`, `useReducedMotion`, `LayoutGroup`, `AnimatePresence` and `usePresence` are all exported | `app/package.json` | No new motion dependency (PC-25) |
| About 35 files already import framer. The common shape is `AnimatePresence` plus `motion.div` with inline `initial` / `animate` / `exit` values | e.g. `components/atoms/Modal.tsx` (backdrop 150 ms; panel y 18 → 0, scale 0.985, 200 ms `easeOut`), `components/atoms/Skeleton.tsx` (infinite linear sweep, 1.3 s), `components/molecules/Tabs.tsx` / `SegmentedControl.tsx` (`layoutId` pill) | No shared tokens exist. `lib/motion.ts` is new. Existing components keep their own values; this change does not retrofit them |
| `components/shell/PageTransition.tsx` (key = pathname, y 6 → 0, 220 ms) exists but nothing imports it | — | Unused. Delete it, or leave it alone; don't build on it |
| No `template.tsx` anywhere under `app/` | — | The template pattern below is new to the codebase |
| No `MotionConfig` at the root. Reduced motion is handled only in CSS, in five files (`globals.css` skeleton sweep, pipeline pulse, source-doc pulse; `empty-state.css`, `home-cards.css`, `setup-checklist.css`, `usage.css`). Framer components ignore it today | `app/layout.tsx`, `globals.css` | `MotionProvider` (new) adds `MotionConfig reducedMotion="user"` app-wide. This also turns off transforms in existing framer components when the OS asks for less motion. That is a side benefit, but it is a change |
| Sign-up (`/auth/create-account`) and Verify (`/auth/verify`) each wrap themselves in `KeycloakFrame`. The `(auth)` layout is an empty fragment | `app/(auth)/layout.tsx`, `components/templates/KeycloakFrame.tsx` | The card **remounts** on sign-up → verify. framer `layout` cannot animate across a remount (see T1) |
| `.kc-card` is 420 px wide with a 14 px radius, `--md-elev-2` and the logo inside it. `.wel-card` sits in `.wel-stage` (560 px) with the same radius and shadow, and its logo is top-left of the page | `globals.css` lines ~16347, ~16654 | T2 joins two different elements in two route groups. A shared element is not available, so T2 uses a matching first frame |
| Verify → `/welcome` is `router.push("/welcome")` in `VerifyCodeForm.tsx`. `/welcome` pages wrap their content in `<Suspense fallback={null}>` (for `useSearchParams`) | `components/organisms/auth/VerifyCodeForm.tsx`, `app/(onboarding)/welcome/page.tsx` | Page content can arrive one commit after the layout re-renders, so card height is measured, not inferred from a re-render (§3.2) |
| No test runner or Playwright config in the repo. Agents check pages with Playwright through tooling | `app/package.json` scripts | Motion-off is keyed on `navigator.webdriver` plus a query flag (§8) |
| `canvas-confetti` latest is **1.9.4** (published Oct 25, 2025); `@types/canvas-confetti` latest is **1.9.0** | `npm view` on Nov 11 | Pin `canvas-confetti@1.9.4` and the dev types at `@types/canvas-confetti@1.9.0` |

---

## 1. Motion tokens: `lib/motion.ts` (new)

Owned by the coordinator (spec §8, C0). Everything else imports from here. Never type a duration or easing inline in onboarding, Get started or the shell arrival.

```ts
// lib/motion.ts (new). Function bodies are left to the coordinator; the signatures and values are the contract.
import type { Transition, Variants } from "framer-motion";

/** Corporate archetype: calm, precise, no bounce on UI (motion-contract.md). */
export const ease = {
  standard: [0.2, 0, 0, 1],    // ~80% of motion
  enter:    [0.05, 0.7, 0.1, 1],
  exit:     [0.3, 0, 1, 1],
  linear:   "linear",           // progress bars only
} as const;

/** Seconds (framer units). */
export const dur = {
  quick: 0.15,      // press feedback, toggles, chip pop
  standard: 0.28,   // card height, content swap, callout reveal
  slow: 0.48,       // layout change (T2), interstitial in and out
  fill: 0.4,        // progress segment fill (T2, T3)
  shake: 0.3,       // validation shake
  reducedFade: 0.12 // every cross-fade under reduced motion
} as const;

export const dist = {
  enter: 12,   // default entrance travel (opacity + 12 px, never opacity alone)
  step: 16,    // step content x shift (T1, T3)
  panel: 24,   // side panel x on T2
  lift: 8,     // callout lift, side-panel content swap, welcome line
  shake: 6,    // validation shake amplitude
  icon: 6,     // calendar icon slide-in on "Book a call"
} as const;

export const stagger = {
  gap: 0.06,      // 60 ms between siblings
  maxTotal: 0.4,  // a stagger never runs longer than 400 ms in total
  codeFill: 0.03, // verify-code boxes on paste
} as const;

/** Clamp a stagger so N children never exceed stagger.maxTotal. */
export function staggerFor(count: number): number {
  return Math.min(stagger.gap, stagger.maxTotal / Math.max(count - 1, 1));
}

/** Direction of a step change: 1 = forward (content leaves to the left), -1 = back. */
export type Dir = 1 | -1;

/**
 * Step content (T1, T3, T3b). Use with AnimatePresence `custom={dir}` and
 * motion.div `custom={dir}`, so the exiting child reads the NEW direction.
 */
export const stepVariants: Variants = {
  enter: (dir: Dir) => ({ opacity: 0, x: dist.step * dir }),
  center: {
    opacity: 1, x: 0,
    transition: { duration: dur.standard, ease: ease.enter },
  },
  exit: (dir: Dir) => ({
    opacity: 0, x: -dist.step * dir,
    transition: { duration: dur.quick, ease: ease.exit },
  }),
};

/** Reduced-motion twin: no travel, 120 ms fades. */
export const stepVariantsReduced: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: dur.reducedFade } },
  exit: { opacity: 0, transition: { duration: dur.reducedFade } },
};

/** Generic entrance: opacity plus 12 px rise. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: dist.enter },
  shown: { opacity: 1, y: 0, transition: { duration: dur.standard, ease: ease.enter } },
};

/** Card height and T2 move. */
export const cardHeight: Transition = { duration: dur.standard, ease: ease.standard };
export const cardMove: Transition = { duration: dur.slow, ease: ease.standard };

/** Picks the variant set for the current motion mode. */
export function useStepVariants(): Variants { /* useMotionMode() === "full" ? stepVariants : stepVariantsReduced */ }

/** "full" | "reduced" | "off". Reduced = OS setting; off = tests (§8). */
export function useMotionMode(): "full" | "reduced" | "off" { /* useReducedMotion() + motionOff() */ }
export function motionOff(): boolean { /* see §8 */ }

/** One-shot hand-offs across route changes (T2 and T5). sessionStorage-backed, read once. */
/** from = the card that left: "signup" (T1, height only) or "verify" (T2, full rect). */
export type Handoff = { from: "signup" | "verify"; rect: { top: number; left: number; width: number; height: number } };
export function setHandoff(h: Handoff): void {}
export function takeHandoff(): Handoff | null {}       // reads and clears
export type Arrival = { path: "self_serve" | "enterprise"; at: number };
export function markArrival(a: Arrival): void {}
export function takeArrival(): Arrival | null {}       // reads and clears; ignored if older than 10 s (derived: guards a stale tab)
```

Rules:
- Easings are cubic-bezier arrays (framer's format). `linear` only for the interstitial bar and the confetti physics.
- No springs on UI (the Corporate archetype has no bounce). The existing `Tooltip` spring and `WorkbookSectionChrome` spring stay as they are.
- `useMotionMode()` is the only place that reads reduced motion. Components never call `matchMedia` themselves.

### 1.1 `components/providers/MotionProvider.tsx` (new)

A client component mounted in `app/layout.tsx` next to `ToastHost`. It wraps children in `<MotionConfig reducedMotion="user">`, and sets `MotionGlobalConfig.skipAnimations = true` once on mount when `motionOff()` is true (§8). `MotionConfig reducedMotion="user"` makes framer drop transform and layout animations for users who ask for less motion. Our own variants also switch to the reduced set, so fades shorten to 120 ms as the contract asks.

---

## 2. Route structure for the transitions (recommendation)

### 2.1 The constraint

The App Router swaps a layout's `children` as soon as the next route is ready. An `AnimatePresence` placed around `children` in a layout therefore exits the **new** page, not the old one, because the old React element is gone. The known fix freezes the old router context through `LayoutRouterContext`, which is an internal Next export. That is fragile across Next minors, so we don't use it.

Next 16 also offers React `<ViewTransition>` behind `experimental.viewTransition`. It can morph a named element across routes, which would make T2 a true shared element. It is still experimental, it changes `next.config.ts` for the whole app, Safari differs, and it moves motion out of framer (against PC-25). We keep it as a fallback for T2 only (§9), not the plan.

### 2.2 Recommendation: a persistent frame in a layout, a template for content, and exit before push

```
app/(onboarding)/layout.tsx           (exists; D owns it in phase 1: logo, footer, ProtoPill. Unchanged here)
└─ app/(onboarding)/welcome/layout.tsx    (new, H) → <OnboardingFrame> persistent: card shell, progress bar, side panel, interstitial
   └─ app/(onboarding)/welcome/template.tsx  (new, H) → <StepContent> motion.div that runs the enter variant on every remount
      └─ page.tsx  (/welcome, /welcome/invite, /welcome/call)
```

- **Layout = what persists.** `OnboardingFrame` (client) holds the card shell, the 2-segment progress bar and the side panel. It is never unmounted between `/welcome`, `/welcome/invite` and `/welcome/call`, so it can animate its own height and swap its own panel content with a normal `AnimatePresence`. That works because the panel content is rendered by the frame from `usePathname()`, not passed in as router `children`.
- **Template = what enters.** Next keys a template by its child segment, so `welcome/template.tsx` remounts on `/welcome` → `/welcome/invite` (checked in `node_modules/next/dist/docs/.../template.md`). Its `motion.div` runs `initial="enter" animate="center"` with the current direction.
- **Exit happens before navigation.** Every in-app step change goes through `useStepNav().go(href, dir)`. That runs the exit variant on the current content, awaits it (150 ms), then calls `router.push`. Browser back and forward cannot be intercepted that way. They get **enter only** (the old content is replaced at once, and the new content enters from the correct side). Say this plainly in the build report; it is the trade-off.

**Trade-off in two lines:** this uses only public Next APIs and survives Suspense and reloads. The cost is that browser back and forward skip the 150 ms exit, and each step change keeps one extra route file (`template.tsx`).

### 2.3 Crossing route groups (T2) and leaving onboarding (T5)

`(auth)` → `(onboarding)` → `(shell)` are three different layouts, so nothing persists across them except the root layout. **No shared layout is possible.** Both crossings use **exit, then enter with a matching first frame:**

- **T2:** the verify card exits its content, records its on-screen rect with `setHandoff`, and navigates. `OnboardingFrame` reads `takeHandoff()` on mount and renders its first frame as a card at exactly that rect, empty. It then animates to its real place.
- **T5:** the interstitial calls `markArrival()` and navigates to `/get-started`. `AppShell` reads `takeArrival()` on mount and plays the shell arrival stagger. Get started reads the same arrival (passed down via context, not read twice) for the welcome line and confetti.

A reload or a deep link has no hand-off, so the destination simply renders at rest. Nothing waits on a flag that might be missing.

---

## 3. Transitions T1–T5

### 3.1 Summary

| ID | Owner (component) | Owner (agent, phase) | Framer pieces | Route concern |
|---|---|---|---|---|
| T1 Sign-up → Verify | `KeycloakFrame` + `CreateAccountForm` / `VerifyCodeForm` | **I**, phase 2 (owns `app/(auth)/**`, `KeycloakFrame.tsx`, `components/organisms/auth/**`) | Exit-before-push on the form content; enter variant on the new page's content; card height from a measured hand-off | Same route group, but the frame remounts per page |
| T2 Verify → Org setup | Exit: `VerifyCodeForm` (**I**). Enter: `OnboardingFrame` (**H**) | I and H, phase 2 | `LayoutGroup` around card + panel; card `motion.div layout`; first frame from the hand-off rect; panel `riseIn`-style x entrance; progress segment `scaleX` | Crosses `(auth)` → `(onboarding)`: matching first frame |
| T3 / T3b Org setup ↔ Invite / Book a call | `OnboardingFrame` + `StepContent` | **H**, phase 2 | `welcome/template.tsx` enter with `custom={dir}`; exit-before-push; measured card height; panel `AnimatePresence mode="popLayout"` keyed by step | Same layout; template remount |
| T4 Final step → interstitial | `OnboardingFrame` (`mode: "steps" → "interstitial"`) + `SetupInterstitial` | **H**, phase 2 | `AnimatePresence mode="wait"` keyed by mode | In-layout state, no route change |
| T5 Interstitial → Get started | Exit: `SetupInterstitial` (**H**). Shell: `AppShell` (**coordinator**, C1). Page and confetti: `GetStarted` (**A**, phase 1) | H, coordinator, A | Interstitial exit fade; `AppShell` sidebar → page stagger; confetti via `lib/celebrate.ts` | Crosses `(onboarding)` → `(shell)`: arrival flag |

### 3.2 Card height: measured, not inferred from a re-render

The contract calls the height change "framer `layout`, 280 ms". In this tree a plain `layout` prop is not reliable for **step** changes. framer measures a layout change only when the motion component itself re-renders, and the new page can land in a later Suspense commit. The height jump would then snap.

**Build:** `OnboardingFrame` puts a `ResizeObserver` on the card's inner content box and animates the outer card's `height` to the measured value (`transition: cardHeight`, `overflow: hidden` only while animating). Because `.wel-main` centres its contents with flexbox, the animating height makes the centred card **and** the side panel glide together. That is exactly the effect the contract describes. The timing (280 ms `ease.standard`) is unchanged.

- This is one element animating `height` for 280 ms: a deliberate, bounded exception to "transform and opacity only" (§7).
- `layout` is still used where the frame itself causes the change: T2's move from centre to the left column, and the email chips reflow.
- The same measured-height card is used by `KeycloakFrame` for T1 (§3.3).

### 3.3 T1: Sign-up → Verify email (agent I)

| Moment | What happens | Values |
|---|---|---|
| Submit on Sign-up | Button busy (§4), then the card content (everything inside `.kc-card` except the logo) exits | x −16 px, opacity 0, 150 ms `ease.exit` (`stepVariants.exit`, dir 1) |
| Before push | `CreateAccountForm` records the card's rect in the hand-off (`setHandoff({ from: "signup", rect })`, same mechanism as T2; only the height is used) | — |
| Verify mounts | `KeycloakFrame` starts the card at the handed-off height and animates to its measured height | 280 ms `ease.standard` |
| Verify content | Enters from the right | x +16 → 0, opacity, 280 ms `ease.enter` |
| Logo, "Secured by Realwired ID", footer | Do not move | — |

- The content wrapper inside `KeycloakFrame` becomes a `motion.div` with `variants={stepVariants}`, `custom={1}`, `initial={hasHandoff ? "enter" : false}`, so a direct page load does not animate.
- "Use a different email" on Verify (back to sign-up) is the same with `dir = -1`.
- Sign-in, MFA and reset pages are not changed. They only animate when a hand-off exists.

### 3.4 T2: Verify → Org setup (agents I then H)

The layout change is deliberate. It marks the hand-off from identity (Realwired ID, Keycloak) to product setup. Animated as one continuous move, it reads as the same card moving aside to make room, not as a new page.

| t (ms) | What happens | Values | Owner |
|---|---|---|---|
| −430 to −150 | Correct code: the check draws | stroke-dashoffset, 280 ms | I |
| −150 to 0 | Verify content exits; `setHandoff({ from: "verify", rect })` with the `.kc-card` rect; `router.push("/welcome")` | opacity 0, x −16, 150 ms `ease.exit` | I |
| 0 | `OnboardingFrame` mounts. First frame: an empty card at the hand-off rect (420 px, centred). No panel. Progress bar hidden | — | H |
| 0 to 480 | Card animates to its place in the left column at its real width and height. `layout` is on while `handoff` is set; the content wrapper is `motion.div layout` so framer corrects scale (no stretched text) | 480 ms `ease.standard` (`cardMove`) | H |
| 120 to 400 | Side panel enters from the right; Org setup content enters (same delay, so card and panel arrive together; **derived:** the contract gives the panel's timing only) | opacity, x +24 px, delay 120 ms, 280 ms `ease.enter` | H |
| 0 to 400 | Progress segment 1 fills | `scaleX` 0 → 1, `transform-origin: left`, 400 ms `ease.standard` | H |
| ~600 | Rest. `layout` turns off (`layout={handoff ? true : false}`), so later height changes use the measured height | — | H |

- Pieces: `LayoutGroup id="onboarding"` wraps the card and the panel; the card is `motion.div layout`; the panel is a `motion.div` that mounts after the first frame.
- Logo: the Keycloak card carries the logo inside; the onboarding page has it top-left. The page logo fades in with the panel (opacity only, 280 ms). The card logo leaves with the verify content. Nothing tries to fly the logo across.
- Without a hand-off (reload, deep link, prototype pill), the frame renders at rest.
- Focus: after T2, focus moves to the Org setup `h1` (`tabIndex={-1}`), never to the first field (it would open the keyboard on mobile before the user reads the step).

### 3.5 T3 / T3b: step to step inside onboarding (agent H)

| Piece | Implementation | Values |
|---|---|---|
| Content exit (forward, in-app) | `useStepNav().go("/welcome/invite", 1)`: sets `exiting`, the `StepContent` motion.div animates to `exit`, then `router.push` in `onAnimationComplete` | x −16, opacity, 150 ms `ease.exit` |
| Content enter | `welcome/template.tsx`: `<motion.div variants={useStepVariants()} custom={dir} initial="enter" animate="center">` | x +16 → 0, 280 ms `ease.enter` |
| Card height | Measured height (§3.2) | 280 ms `ease.standard` |
| Progress | Segment 2 `scaleX` 0 → 1 | 400 ms |
| Side panel | `<AnimatePresence mode="popLayout" initial={false}>` keyed by step; each panel body is `motion.div` opacity + y 8 px | 280 ms (`ease.enter` in, `ease.exit` out) |
| Back (T3b) | Browser back: direction comes from `OnboardingFrame` comparing the step index of the new pathname with the previous one (`/welcome` = 0, `/welcome/invite` and `/welcome/call` = 1). Enter only, from the left | dir = −1 |

- No visible Back link is added: §5.1 has none. If one is added later, it calls `go(href, -1)` and gets the full mirror.
- The direction lives in `OnboardingFrame` context, so `template.tsx` stays a thin wrapper.
- Focus moves to the new step's `h1` after enter.

### 3.6 T4: final step → interstitial (agent H)

The final step is Invite (Send or Skip) for self-serve, and Book a call (Book or "I'll book later") for enterprise.

| Piece | Implementation | Values |
|---|---|---|
| Trigger | The step's action resolves (busy button first, §4). `OnboardingFrame` sets `mode = "interstitial"` | — |
| Exit | Card and panel share one `motion.div` wrapper keyed `"steps"` inside `<AnimatePresence mode="wait">` | opacity 0, scale 0.98, 280 ms `ease.exit` |
| Enter | `SetupInterstitial` keyed `"interstitial"` | opacity, y 12 → 0, 280 ms `ease.enter` |
| URL | Unchanged. The interstitial is state, not a route (§5) | — |

### 3.7 T5: interstitial → Get started (agents H, coordinator, A)

| t (ms) | What happens | Values | Owner |
|---|---|---|---|
| 0 | Interstitial fades out; `markArrival({ path, at })`; `router.push("/get-started")` on complete | opacity, 280 ms `ease.exit` | H |
| 280 | `AppShell` mounts with an arrival: sidebar fades in, then the main column | opacity + y 12 px, 280 ms `ease.enter`, 60 ms stagger (sidebar, header, page) | Coordinator (`AppShell.tsx`) |
| ~480 | Get started is in place. The welcome line enters (self-serve) | opacity + y 8 px, 280 ms | A |
| ~680 | Confetti fires (self-serve only) | 200 ms after the page lands | A, via `lib/celebrate.ts` |

- Without an arrival, `AppShell` renders at rest. Ordinary navigation inside the shell never plays the stagger.
- Focus moves to the Get started `h1` on arrival (`tabIndex={-1}`, `preventScroll`).

---

## 4. Micro-interactions

| Interaction | Values (contract) | Lives in | Owner |
|---|---|---|---|
| Segmented option / pill press | `whileTap` scale 0.97, `quick`; release to 1, `standard`; selected fill and border colour change `quick` | `components/molecules/SegmentedControl.tsx`, behind a new opt-in prop `press` (so other screens are unchanged). Used by `OrgSetupForm` and `InviteStep` | Coordinator adds the prop (C1); H turns it on |
| Crossing the enterprise threshold: callout | Height 0 → auto, then opacity + y 8 px, `standard` | `OrgSetupForm.tsx`: a `motion.div` around the `@realwired/ui` `Callout` (the vendored component is not edited), inside `AnimatePresence` | H |
| Threshold: button label | "Continue" ↔ "Book a call" cross-fade; calendar icon slides in from x −6 px, `standard`; button width held during the swap | `OrgSetupForm.tsx` (`AnimatePresence mode="popLayout"` inside the button label) | H |
| Threshold: answer marker | Petrol marker on the triggering answer fades in, `standard` | `OrgSetupForm.tsx` | H |
| Email chip added | scale 0.9 → 1 + opacity, `quick` | `InviteStep.tsx` | H |
| Email chip removed | scale 0.9 + fade, `quick`; remaining chips reflow with `layout` (`LayoutGroup` on the chip row) | `InviteStep.tsx` | H |
| "Send N invites" count | The number cross-fades (key = count) | `InviteStep.tsx` | H |
| Validation on click (never a disabled button) | Field shakes ±6 px twice over 300 ms, `ease.standard` (`x: [0, -6, 6, -6, 6, 0]`); inline error slides down (height + opacity, `standard`); focus moves to the field | `lib/motion.ts` exports `shakeKeyframes`; used in `OrgSetupForm`, `InviteStep`, `CallBooking` (H) and the auth forms (I) | H, I |
| Primary button busy (mock latency 500–700 ms) | Label replaced by a 16 px spinner; width held (measure before swap); on success the content swaps (T3 or T4) | `components/atoms/Button.tsx` gains a `busy` prop (sets `aria-busy="true"`, keeps the button focusable and clickable-ignored, never `disabled`) | Coordinator adds the prop (C1); H and I use it |
| Calendar slot select | Selected slot fills, `quick`; the Book button's label cross-fades to name the slot | `CallBooking.tsx` | H |
| Verify code: paste | Six boxes fill in sequence, 30 ms stagger | `VerifyCodeForm.tsx` | I |
| Verify code: success | A check draws (stroke-dashoffset, 280 ms) before T2 | `VerifyCodeForm.tsx` | I |
| Verify code: wrong | Shake + red outline; the code clears; focus to box 1 | `VerifyCodeForm.tsx` | I |
| Earn pill → earned | Gift → check icon swap, `quick`; the small section burst (§6.4) | `components/organisms/home/EarnPill.tsx` | A |

Reduced motion: presses keep the colour change but drop scale; shakes become the red outline plus the error (no movement); count and label swaps become 120 ms fades; chip pop becomes a fade.

---

## 5. Interstitial: "Setting up your workspace"

**Recommendation: in-layout state, not a route.** It lives in `OnboardingFrame` as `mode = "interstitial"`, rendered by `components/organisms/onboarding/SetupInterstitial.tsx` **(new)**.

Why:
- It must not be reloadable into a half-finished state. A reload during a 2-second screen should land on a real page.
- T4 needs the card and panel to exit from the same tree the interstitial enters into. A route would turn T4 into a cross-route hand-off for no gain.
- The cost is that the prototype pill can't deep-link to it with a path. Fix: the frame honours a view param `?view=interstitial&path=self_serve|enterprise` (prototype only; registered in `lib/prototype-registry.ts` as an onboarding state). With the view param it loops and never navigates.

**Layout:** a centred column with no card: logo mark, title, three-line checklist and a thin progress bar. Reference: `docs/references/pattern-audit-nov-2026/apollo/02-personalizing-workspace-interstitial.jpg`.

**Copy** (org name from `useOrgStore`, credits from `TRIAL_GRANT_CREDITS`, slot from `org.profile.callSlot`; never typed in):

| Path | Title | Lines |
|---|---|---|
| Self-serve | "Setting up Harbor Community Bank" | 1 "Creating your organization" · 2 "Adding your 6 trial credits" · 3 "Preparing your setup guide" |
| Enterprise, booked | "Getting Harbor ready for your call" | 1 "Creating your organization" · 2 "Booking Fri, Nov 13 at 10:00 AM" · 3 "Preparing your setup guide" |
| Enterprise, "I'll book later" | "Setting up Harbor Community Bank" | 1 "Creating your organization" · 2 "Preparing your setup guide" (**not in the contract**; there is no slot to book. Pending Val) |

"Harbor" in the enterprise title is the org's short name: the first word of the org name. This is the same rule the board uses in "Book Harbor's setup call".

**Timing:**

| Rule | Value |
|---|---|
| Lines resolve (spinner → check) | 500 ms, 1000 ms, 1500 ms |
| Progress bar | Fills linearly over 1.8 s |
| After the last check | Hold 300 ms, then T5 |
| Minimum total | 1.2 s (never a flash) |
| Maximum total | 2.4 s |

**How it ends when the data is ready.** `SetupInterstitial` receives a `work: Promise<void>`: the org upsert, the trial grant or the call booking, and the invite send. It runs `Promise.all([work, wait(1200)])`.
- Lines 1 and 2 tick on the schedule. Line 3 waits until `work` has resolved **and** 1500 ms have passed.
- In the mock, `work` resolves in well under 500 ms, so the screen always plays at the contract's 1.8 s plus the 300 ms hold.
- If `work` hasn't resolved at 2.4 s, the interstitial goes to Get started anyway. Get started shows its own loading skeleton until the stores fill. If `work` rejects, the interstitial returns to the step (`mode = "steps"`) with an inline error on the step's primary button. It never sits on a spinner.

**Accessibility:**
- The checklist container has `role="status"` and `aria-live="polite"`. Each line's text changes from "Creating your organization" to "Creating your organization, done" (visually hidden suffix), so screen readers hear progress without a flood.
- The title is an `h1`. Focus moves to it on enter (`tabIndex={-1}`).
- The progress bar is decorative (`aria-hidden`); the live region carries the meaning.
- On arrival in Get started, focus moves to the Get started `h1`.
- Reduced motion: the finished list shows at once (all checks), the bar is full, it holds 600 ms, then a 120 ms fade to Get started.

---

## 6. Confetti

### 6.1 Dependency

| Package | Version | Where |
|---|---|---|
| `canvas-confetti` | `1.9.4` (latest on Nov 11; published Oct 25, 2025, ISC licence, about 6 KB) | `dependencies` in `app/package.json` |
| `@types/canvas-confetti` | `1.9.0` (latest) | `devDependencies` |

Loaded with `await import("canvas-confetti")` inside `celebrate()`, so it never enters the first-load bundle.

### 6.2 `lib/celebrate.ts` (new, coordinator)

```ts
// lib/celebrate.ts (new)
export type CelebrationKind = "onboarding" | "approval" | "section";

/** Big two-sided celebration. Fires at most once per user per kind; returns false when skipped. */
export async function celebrate(kind: "onboarding" | "approval", userId: string): Promise<boolean>;

/** Small single burst from an element (the section's earn pill). Not persisted: the section reward itself fires once. */
export async function burstFrom(el: HTMLElement): Promise<void>;
```

Behaviour:
- **Skips** when `useMotionMode() !== "full"` (reduced or off), or when `prefs.celebratedBy[userId]?.[kind]` is set. Under reduced motion it still **sets** the flag, so turning the OS setting off later does not replay an old moment.
- **Canvas:** its own `<canvas>` portaled to `document.body` with `position: fixed; inset: 0; pointer-events: none; z-index: 201` and `aria-hidden="true"`. It is created per call with `confetti.create(canvas, { resize: true, useWorker: true, disableForReducedMotion: true })` and removed when the last particle is gone.
- **Two-sided burst** (contract):
  - Origins: lower left `{ x: 0, y: 1 }` at angle 60, and lower right `{ x: 1, y: 1 }` at angle 120.
  - 70 particles each, `spread: 60`, `startVelocity: 45`, `ticks: 200`, `gravity: 1.1`, `scalar: 0.9`, `shapes: ["square", "circle"]`.
  - Then a second wave 250 ms later: 30 particles each, same settings.
- **Section burst:** 30 particles, origin at the element's centre (rect / viewport), `spread: 60`, the other settings as above.
- **Colours:** navy `#10344c`, petrol `#2a6f7f`, tint `#d6e3ee`, success green `#2e7d4f`, warm accent `#e0a43a`. These are fixed hexes, because a canvas can't read `var()`. This is a documented exception to "tokens only", like the illustration exception. The same set is used in both themes; it was chosen to read on both.

**Persisted flag: `store/prefs.store.ts`, not `onboarding.store.ts`.**
- `prefs.store` already keeps per-user, `localStorage`-backed one-time flags (`setupHiddenBy`, `welcomeDismissedBy`). "Once per user" is exactly that shape. It also survives the seed v23 reset, so a returning tester isn't re-celebrated.
- `onboarding.store` holds per-**org** `SetupProgress` in the adapter. That is the wrong scope (it would be shared by every user of the org), and it is wiped when the scenario rebuilds `org-hcb`.
- Add `celebratedBy: Record<userId, Partial<Record<"onboarding" | "approval", number>>>` and `markCelebrated(userId, kind)`, with the key `parachute:celebrated`.
- The scenario popover's "Reset tours" action also clears `celebratedBy`, so a presenter can replay the moment. Rename it "Reset tours and celebrations" (D/I own the popover).

### 6.3 When it fires

| Moment | Fires? | Trigger |
|---|---|---|
| Self-serve lands on Get started from onboarding | **Yes**, `celebrate("onboarding")`, 200 ms after the page lands | `GetStarted` mount with `arrival.path === "self_serve"`, the trial granted and not yet celebrated |
| Enterprise lands on Get started (pending) | **No** | It lands on the pending tracker; nothing real is released yet |
| Enterprise org approved (trial released) | **Yes**, `celebrate("approval")`, pending Cody (Q-C9) | First render of Get started (or Dashboard, if Get started is hidden) where `approval === "approved"` and the user hasn't seen the approval celebration. It pairs with the existing success callout "Harbor is confirmed. Your 6 trial credits are ready." |
| A Get started section finishes and earns its review | **Yes**, `burstFrom(earnPill)`, 30 particles | `EarnedToastHost` / `EarnPill` reacting to the section-reward notice from `onboarding.store` (fires once per section by construction) |
| The `team` section finishes (no reward) | No | Nothing was earned |
| All 8 done | No extra confetti | The last section's burst already played; the All done card is the moment |
| Any later visit, a reload, or a prototype state jump | No | The flag, and the arrival being one-shot |
| Reduced motion or motion off | Never | §6.2 |

### 6.4 The welcome line (Get started, fresh state, self-serve)

- "You're in. 6 trial credits are ready." The number comes from `TRIAL_GRANT_CREDITS`.
- Inline above the sections, under the headline band. Not a modal or toast.
- Enters at the same moment as the confetti (opacity + y 8 px, 280 ms `ease.enter`).
- Dismissible (`×`, `aria-label="Dismiss"`). The dismissal reuses `prefs.welcomeDismissedBy[userId]`, the flag the deleted sample `WelcomeCallout` used.
- Shown only on the arrival visit. A later reload in the fresh state doesn't show it.
- Shown under reduced motion too (it carries the message; only the confetti is skipped).

### 6.5 Z-index

The tiers become: overlays 200 · **celebration 201** · tour 205 · prototype pill 210. Confetti is above any toast or popover that happens to be open, below a tour tooltip and the pill, and never takes a click (`pointer-events: none`).

---

## 7. Performance rules

- [ ] Animate `transform` and `opacity` only. **Two exceptions:**
  - The onboarding and Keycloak card `height` (one element, 280 ms, §3.2).
  - Height reveals of short inline elements (enterprise callout, inline errors). These use framer `height: "auto"` on an element with `overflow: hidden`.
- [ ] No layout reads inside animation frames. The card height comes from a `ResizeObserver` callback; the T2 rect is read once, before navigation.
- [ ] `will-change` only on the element that is moving, only while it moves (framer handles this; never set it in CSS).
- [ ] No infinite animations in onboarding except the busy spinner and the interstitial spinners. All of them stop when hidden.
- [ ] Confetti is lazy-loaded, runs in a worker (`useWorker: true`), and removes its canvas when done.
- [ ] Stagger totals never exceed 400 ms (`staggerFor`).
- [ ] Never combine animated `x`/`y` with a manual centring `transform` (AGENTS Motion rule). The centred card is centred by flexbox, not by `translate(-50%)`, so framer owns `transform` cleanly.

## 8. Motion off in tests and recordings

`motionOff()` in `lib/motion.ts` returns true when any of these holds:
1. `navigator.webdriver === true` (Playwright and other automation set it).
2. The URL has `?motion=0`. This is sticky for the tab in `sessionStorage` (`parachute:motion`); `?motion=1` clears it and **forces motion on**, even under automation. Use it to record a demo.
3. `process.env.NEXT_PUBLIC_MOTION === "0"`.

When off, `MotionProvider` sets `MotionGlobalConfig.skipAnimations = true`, so every framer animation (existing ones included) jumps to its end state. Our variants also pick the reduced set, `celebrate()` and `burstFrom()` skip, and the interstitial holds 600 ms with the finished list (same as reduced motion). Exit-before-push still calls `router.push`, because `onAnimationComplete` fires at once when animations are skipped. Agents' page checks never wait on motion.

---

## 9. Fallbacks and risks specific to motion

| If | Then |
|---|---|
| T2's matching first frame looks like two cards rather than one (different padding, the logo leaving) | Try React `<ViewTransition name="onboarding-card">` on `.kc-card` and the onboarding card with `experimental.viewTransition: true`. Only T2 would use it. This needs Val's sign-off because it changes `next.config.ts` and adds a second motion system |
| Browser back feels abrupt without the exit | Accept it. The enter still comes from the correct side. Do not adopt the frozen-router internal API |
| A step's content overflows a laptop viewport mid-animation | `.wel` already scrolls (`overflow-y: auto`). The card's `overflow: hidden` applies only while its height animates |
| The prototype pill jumps between onboarding states | No hand-off and no arrival, so the frame renders at rest. Pill jumps never animate T2 or T5 |

## 10. Acceptance checklist

**Tokens and setup**
- [ ] `lib/motion.ts` exports exactly the tokens in §1; `grep -rn "cubic-bezier\|duration: 0\.\|ease: \"easeOut\"" app/src/components/organisms/onboarding app/src/app/(onboarding) app/src/components/organisms/home` finds nothing typed inline.
- [ ] `MotionProvider` wraps the app; `reducedMotion="user"`.
- [ ] `canvas-confetti@1.9.4` and `@types/canvas-confetti@1.9.0` in `app/package.json`; confetti is absent from the first-load JS of `/get-started` (dynamic import).

**Transitions** (check each at 1280 × 820 and 390 px wide, in both themes)
- [ ] T1: sign-up content leaves left, verify enters from the right, the card height glides; the logo and footer don't move. A direct load of `/auth/verify` doesn't animate.
- [ ] T2: one continuous move from the centred verify card to the card + panel layout in about 600 ms; the panel arrives from the right; segment 1 fills; text never stretches.
- [ ] T3: forward step content leaves left and enters right; card height and the centred position glide, with nothing snapping. Centred title jumps measured at 1280 × 820: Org setup 187 px, enterprise answers 135 px, Invite 246 px, Book a call 295 px; the panel content cross-fades; segment 2 fills.
- [ ] T3b: browser back enters from the left (no exit; documented).
- [ ] T4: card and panel leave together (scale 0.98); the interstitial rises in.
- [ ] T5: interstitial fades; sidebar then page arrive with a 60 ms stagger; focus lands on the Get started `h1`.
- [ ] Reloading any onboarding step or Get started renders at rest, with no replay.

**Micro-interactions**
- [ ] Every row in §4 behaves as listed; no button is ever `disabled`; busy buttons keep their width.

**Interstitial**
- [ ] Self-serve, enterprise booked and enterprise book-later copy, with the org name, credits and slot from stores.
- [ ] Plays at least 1.2 s and at most 2.4 s; ends early only after both the data and the minimum are done; a rejected `work` returns to the step with an error.
- [ ] `role="status"` + `aria-live="polite"`; focus to its `h1`, then to the Get started `h1`.

**Confetti**
- [ ] Fires once for self-serve on arrival; never for enterprise on arrival; never on reload or a later visit.
- [ ] Enterprise approval behaviour matches Cody's answer to Q-C9.
- [ ] The section burst plays once per earned section from its earn pill.
- [ ] Never under reduced motion or motion-off; the welcome line still shows under reduced motion.
- [ ] The canvas is at z 201, `pointer-events: none`, and removed afterwards; the page stays clickable during the burst.

**Reduced motion and tests**
- [ ] With OS reduced motion: no travel anywhere; 120 ms fades; instant height; the interstitial shows the finished list for 600 ms; no confetti.
- [ ] Under Playwright (`navigator.webdriver`), and with `?motion=0`: no animation runs and every flow still navigates. `?motion=1` turns motion back on.
