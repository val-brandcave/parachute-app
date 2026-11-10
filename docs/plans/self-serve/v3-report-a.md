# v3 report, Agent A

## Changed
- `SetupDock.tsx`: now a link to `/dashboard#setup`. Expanded: "Getting set up" + "4 of 9" + 4px bar. Collapsed: "4/9" over a 28px bar, compact right tooltip "Getting set up, 4 of 9". Popover, ring, Next line, chevron and the dock menu are gone. Same visibility rules.
- `FirstRunHome.tsx`: no `PageHeader`, `SetupMeta` deleted.
- `home/index.ts` (outside the file list, one-line change): dropped the `SetupMeta` export.
- `SetupChecklist.tsx`: card has `id="setup"` (scroll-margin 72px, smooth scroll on `#setup` arrival, instant under reduced motion). Title "Welcome (back), {firstName}", sub line with org name and earn hint (hidden once cap reached; pending orgs see "You can do most of this while you wait."), 8px progress bar (role=progressbar), meta row "**4 of 9** steps done" / "+1 credit earned of 3" or "Earn up to 3 credits". Menu stays top right.
- `globals.css`: new `.sb-dock*`, `.sb-bar`/`.su-bar` (navy light, `--md-on-selected` dark, reduced-motion safe), `.su-sub/.su-prog*`; removed `.setupmeta`, `.segbar`, `.sb-ring`, `.sb-dock-main/-sub`, all `.dock-pop*`, `.dock-step*`, `.dock-menu*`, `.su-head-end`.

## Verified
tsc and eslint clean; no console errors on /dashboard and /reviews (trial-admin). Hiding: still in the setup card menu; the user menu only has "Show setup guide" (it never had Hide), so nothing lost. Not screenshotted: pending/reviewer personas, hidden state.

## Screenshots (scratchpad\v3\a\)
home-light/dark, dock-expanded-light/dark, dock-collapsed-light/dark, dock-collapsed-tip-light/dark, arrive-light/dark.

## Open
- `useSetupActions().emailList` still used by the card menu. `su-faint` etc. untouched.
- Dead CSS: none left from my side.
