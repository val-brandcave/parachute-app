# v3 report, Agent B (right-hand cards)

No commit. tsc and eslint clean on all touched files. Dev server on 3102 stopped. `app/tsconfig.json` restored.

## What changed
- `components/organisms/home/HcFrame.tsx` (new): `HcCard`, the one frame (title row, right slot, one inset, footer with actions left and meta right).
- `components/organisms/home/home-cards.css` (new, `hc-*`): all card styling, tokens only, reduced motion respected.
- `components/organisms/home/GuideVideo.tsx` (new): `GuidePlayer` (poster, inline play/pause, seek, time, mute, expand) and `GuideStage` (card player plus the large player in a portaled `Modal`, time handed back and forth, focus returns to the expand button).
- `HomeCards.tsx`: SampleCard (workbook page inset, clickable, legend from the sample review in the store: flagged count; 14 findings from the copy), SecurityPackCard (reuses `PACK_DOCS` from `lib/security-pack.ts`, first 4 rows plus "and 3 more"), GuidesCard (player, video list, Documents with download buttons and a "Downloaded" toast). RecentReviews untouched.
- `WalletCard.tsx`: credits as review tokens. States: pending, low (admin gets filled "Add credits" plus ghost "View balance"; non-admin gets "Ask {admin}"), all-trial (dashed "Trial" chip, bar, "Add a card" for admins), normal (tokens, half token for a spare credit, cap 10 plus "+N"). Spend order and expiry sentences removed from Home. Wallet icon tile removed.
- `wallet-card.css`: deleted (everything moved to `hc-*`).
- `lib/guides.ts`: typed `VideoGuide` / `DocGuide` (`src` per video, `href`, pages, size per PDF), plus `VIDEO_GUIDES` / `DOC_GUIDES`.
- `public/guides/parachute-reviewer-guide.pdf`, `parachute-admin-guide.pdf`: valid one-page placeholder PDFs.

## Outside my list (please confirm)
- `components/atoms/Icon.tsx`: added `pause`, `maximize`, `volume`, `volume-off` to the curated map (AGENTS rule: new icons go in the map). Nothing else touched.
- `useSetupActions.ts` unchanged: `playVideo` / `openDoc` are still used by `SetupChecklist`; `downloadPack` is still used by the pack card.

## Verified (Playwright, port 3102)
Wallet: pending-admin (pending), pending-admin then Approve (all-trial, 6 credits), trial-admin (13 credits, mixed), trial-admin then Low balance (admin low), reviewer (13 credits, read only), payg-admin-low. Light and dark. Not captured: a non-admin in the low state (code path only).
Guides: poster, play (real playback), seek, expand (continues from card time, card pauses), seek in the modal, Esc closes, card resumes at the modal time, focus lands on the expand button, swap to another video plays it and marks it "Now playing", PDF download saves `parachute-reviewer-guide.pdf` and shows the toast. Zero console errors.
Note: the placeholder MDN clip is only 5 seconds, so the player clock shows 0:05 while the list and poster badge show the guide durations (1:15 etc.).

## Screenshots (`C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\b392157a-bf67-4268-9514-2175f34b1704\scratchpad\v3\b\`)
- trial-admin-light.png, trial-admin-dark.png (page, viewport-height)
- wallet-all-light.png, wallet-all-dark.png (pending, trial, normal / low-admin, reviewer, payg-low), plus individual `wallet-<state>-<theme>.png`
- card-sample-light/dark.png, card-pack-light/dark.png
- guides-poster-light/dark.png, guides-playing-light.png, guides-swapped-light/dark.png, guides-all-light/dark.png
- guides-expanded-light.png, guides-expanded-dark.png, guides-downloaded-toast-light.png
- dl-parachute-reviewer-guide.pdf (the downloaded file)

## hm-* CSS I stopped using (safe to delete at integration)
Unused anywhere now: `.hm-h--center`, `.hm-row-between`, `.hm-sample`, `.hm-docthumb` (and `.hm-docthumb i` rules), `.hm-big`, `.hm-big-n`, `.hm-big-u`, `.hm-ico` (including the dark rule near line 6328), `.hm-actions`, `.hm-guides`, `.hm-guides li + li`, `.hm-guide`, `.hm-guide:hover span:first-of-type`, `.hm-guide:focus-visible`, `.hm-guide-v`, `.hm-guide-d`, `.hm-guide-len`.
Still used elsewhere, keep: `.hm-h` (RecentReviews, security page), `.hm-p` (security page, FirstRunHome), `.hm-note` (security page), `.hm-link` (billing cards, security, RecentReviews), `.hm-card` (FirstRunHome, Agent A's file; check at integration).
Also gone: the `wc-*` classes (file deleted).
