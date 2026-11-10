# Self-serve v3: first-run Home rework (brief)

Branch: `feat/self-serve-onboarding-v2` (base commit a4745c4). Approved by Val 9 Nov 2026.
Visual reference (intent, not a pixel spec): https://claude.ai/artifact/DL3uG6hamr1Vg6x3KMj6KF
Sections 1–2 = setup widget + strip (Agent A), section 3 "second try" + Wallet option A + Guides option A = cards (Agent B).

Read first: `app/AGENTS.md` (tokens only, light + dark, no mono, Tabler via `Icon`, portals for overlays,
barrels, React 19 purity, adapter rule: components never import seeds/adapters). All prices/credit
numbers come from `lib/pricing.ts`. Build with the app's real components (`Button`, `Chip`, `CreditChip`,
`Icon`, `Modal`, `@realwired/ui` Callout/Popover/Toast). The artifact is drawn by hand: match its
*structure and intent* using the app's components and tokens, not its CSS.

## Agent A: setup widget, no strip, setup card header

Files you own: `components/organisms/SetupDock.tsx`, `components/organisms/home/FirstRunHome.tsx`,
`components/organisms/home/SetupChecklist.tsx`, and `app/globals.css` (you are the only agent editing it).

1. **SetupDock (sidebar footer widget).** No popover. It becomes a link to `/dashboard#setup`.
   - Expanded: one row "Getting set up" with "4 of 9" right-aligned (tabular nums), and a thin progress
     bar under it (navy fill in light, `--md-on-selected` fill in dark). Remove the ring, the "Next: …" line,
     the chevron, the popover, its ⋯ menu (Hide setup guide / email list). Hiding stays available from the
     setup card's ⋯ menu and the user menu, so nothing is lost; verify that.
   - Collapsed sidebar: "4/9" over a short bar, centred; `aria-label` / compact tooltip "Getting set up, 4 of 9".
   - Same visibility rules as today (stage `new`, not hidden, not on /dashboard).
   - Delete CSS that becomes dead (`.sb-ring`, `.dock-pop*`, `.dock-step*`, `.dock-menu*` etc.) once unused.
2. **No page strip on the first-run Home.** `FirstRunHome` drops `PageHeader` and `SetupMeta`
   (delete `SetupMeta` + `.setupmeta`/`.segbar` CSS if nothing else uses them). The active dashboard keeps its
   strip (greeting + period picker), untouched.
3. **Setup card header** (`SetupChecklist`): `id="setup"` on the card (scroll-margin so it isn't under the
   top bar; on arrival with `#setup` it scrolls into view smoothly, reduced-motion = instant).
   - Title: "Welcome back, {firstName}" (or "Welcome, {firstName}" when no step is done yet; same rule as today).
   - One sub line: "Finish setting up {org name}." plus the earn hint only while credits can still be earned
     ("Each verified step can earn a credit, up to {EARN_CAP_CREDITS}.").
   - Progress bar full width (8px), then a meta row: left "**4 of 9** steps done", right the earned
     credits ("+1 credit earned of 3" with the existing `CreditChip tone="free"` for the earned number; hide
     the right side when 0 earned → show "Earn up to 3 credits" plain text instead).
   - Keep the ⋯ menu at the top right of the title row. Remove the old "4 of 9 done · …" header text.
   - When the setup guide is hidden, the existing "Setup guide hidden" card stays as is.
   - Reviewers/approvers see the same header (their actions already say "Ask {admin}").
4. Leave the Welcome / Pending / Joined callouts above the grid as they are.

## Agent B: right-hand cards

Files you own: `components/organisms/home/HomeCards.tsx` (SampleCard, SecurityPackCard, GuidesCard;
leave RecentReviews alone), `components/organisms/wallet/WalletCard.tsx` + `wallet-card.css`,
`lib/guides.ts`, and any NEW files you create under `components/organisms/home/` (e.g. `GuideVideo.tsx`,
`home-cards.css`). **Do not edit `globals.css`** (Agent A owns it): put new CSS in `home-cards.css`
(import it from HomeCards.tsx); prefix new classes `hc-`. Old `hm-*` rules you stop using: list them in
your report and I'll delete them at integration.

**One frame for all four cards** (`hc-card`): title row (h2 + optional right slot) → one inset panel
(`--md-surface-1` fill, ~10px radius, the card's own content) → footer (actions left, small tertiary meta
right). Same padding/gaps on every card. Right slot = a status chip or a quiet count, never a button/link.
At most one filled button per card, only when the card needs something now. Max one short line of text.
No icon tiles in the headers (remove the wallet tile I added in a4745c4).

1. **SampleCard** "See a finished review", right slot `CreditChip tone="free"` "Free". Inset: a small
   rendered workbook page (white paper in both themes, navy band top, a few text lines, two lines tinted
   fail/flag, a small green signed seal; slight tilt that straightens on hover, no tilt under reduced
   motion) beside the address (4410 Bayside Office Park / Norfolk, VA) and legend dots for its real
   counts (fail / flag / signed: read them from the sample review via the store if available, else the
   numbers already in the copy). Whole inset is clickable (keyboard too) → sample. Footer: outline
   "Open sample", right meta "Uses no credits".
2. **WalletCard** (option A "credits as reviews"). Keep the existing data logic/states (pending, all-trial,
   low, mixed) but change the presentation:
   - normal: big number + "credits"; a row of small page tokens, one per full review the balance covers
     (`floor(balance / costFor(FULL_REVIEW_TYPES))`, cap the row at ~10 tokens and show "+N" after), a half
     token if a spare credit remains; one line "Enough for N full reviews". Footer: outline "View balance"
     (→ /configure/billing), right meta "{cost} credits per review".
   - trial: right slot dashed "Trial" chip; "X of 6 trial credits left" with the progress bar (bar only here);
     line "Enough for N full reviews"; footer outline "Add a card", meta "No card needed yet" (admins only;
     reviewers see "View balance").
   - low: right slot `CreditChip tone="low"` "Low"; amber outline token; "Not enough for a full review";
     footer filled "Add credits" (openTopUp, admins) + ghost "View balance". Non-admins: "Ask {admin}" pattern
     already used elsewhere.
   - pending: greyed number, dashed tokens, "Arrives when Realwired confirms {org}".
   - Drop the spend-order / expiry sentences from Home (they live on Billing). Tokens are decorative
     (`aria-hidden`); the sentence carries the meaning.
3. **SecurityPackCard** "For your IT team". Inset: the pack's files as rows (doc icon, name, "PDF"):
   Architecture overview · Data handling and retention · No-training commitment · SOC 2 Type II summary
   (put the list in a constant; reuse one if it exists). Footer: outline "Download pack" (existing action)
   + ghost "Email to IT" (existing route). No body paragraph.
4. **GuidesCard** (option A). Right slot quiet count "3 videos · 2 PDFs" (derive from `GUIDES`).
   - Inset = a real `<video>` player, 16:9: poster frame (make a tasteful CSS/SVG poster in our tokens:
     the guide title over a navy→petrol app-like frame, plus duration badge) with a large round play
     button; on play it plays **inline in the card** with native-like controls (play/pause, seek, time,
     expand). Placeholder source for all three:
     `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4` (CC0); keep the URL in
     `lib/guides.ts` per guide so real videos drop in later.
   - Expand opens the same video large in the app's `Modal` (portal, Esc/backdrop close, focus returns to
     the expand button), continuing from the current time; closing returns to the card at that time.
   - Under the player: the videos as a short list (small thumb, title, duration); clicking swaps the
     player (current one marked). Then a "Documents" group: each PDF row (PDF file glyph, title,
     "12 pages · 1.4 MB") with an icon-only download button (`aria-label="Download …"`, compact tooltip).
     Download triggers a real browser download of a small placeholder PDF you add under `public/guides/`
     (a valid minimal PDF is fine) named e.g. `parachute-reviewer-guide.pdf`, then a toast "Downloaded".
   - Remove `playVideo`/`openDoc` toast stubs from `useSetupActions` only if nothing else uses them
     (setup steps may; check).
   - Respect reduced motion; keyboard reachable; labelled controls.

## Both agents

- Run your own dev server: `cd app && NEXT_DIST_DIR=.next-<a|b> npx next dev -p 310<1|2>` (A 3101, B 3102).
  Personas: `/demo/trial-admin`, `/demo/payg-admin-low`, `/demo/reviewer`, `/demo/pending-admin`,
  and a new org via `/demo/prospect` → /welcome → "Continue to Parachute". Theme toggle:
  `document.documentElement.dataset.theme='dark'`. Sidebar collapse via its toggle.
- Screenshot your work in light AND dark (Playwright; chrome-headless-shell at
  `C:\Users\vvrsv\AppData\Local\ms-playwright\chromium_headless_shell-1248\chrome-headless-shell-win64\chrome-headless-shell.exe`)
  into the scratchpad folder you're given, look at them, and fix what looks off before reporting.
- `npx tsc --noEmit` and `npx eslint <your files>` clean. Zero console errors on the routes you touched.
- Do NOT commit. Do not touch files outside your list (ask me via your report instead).
  `next dev` rewrites `app/tsconfig.json`: run `git checkout app/tsconfig.json` before you finish.
- Stop your dev server when done (kill the node process for your port only; never others: :3000 and
  :3001 are Val's comparison servers).
- Report to `docs/plans/self-serve/v3-report-<a|b>.md`: what changed, screenshots list, open questions,
  dead CSS to delete.
- Copy rules: plain, sentence case, no em dashes, no "→" in button text.
