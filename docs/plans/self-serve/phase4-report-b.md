# Phase 4 report: workstream B (value dashboard H1, e-mail kit I1)

## Added or changed
- `app/src/components/organisms/value/`: `value-model.ts` (constants and derivation), `ValueStrip.tsx` (strip, banner, `useShowValueStrip`), `value.css` (`vl-` classes), `index.ts`.
- `app/src/app/(shell)/dashboard/page.tsx`: active branch only. The strip sits under the StatBar. The FirstRunHome path is untouched.
- `app/src/app/emails/`: `page.tsx`, `EmailCard.tsx`, `content.ts` (all copy), `emails.css` (`em-` classes).
- `app/src/app/start/page.tsx`: quiet "E-mail previews" link under the personas (demo mode only). It imports `emails.css` for the link style.
- `app/src/components/organisms/DemoDock.tsx`: "E-mails" action, opens `/emails` in a new tab.
- Not touched: `globals.css`, `demo-personas.seed.ts` (no new persona).

## Behaviour
- **Value strip.** Four cards: Hours saved, Math checks re-run, Findings raised, Spend this month.
  - Visibility: always for invoiced orgs (Meridian: `returning`, `enterprise-yc`). For trial and pay-as-you-go orgs it appears once the org has one completed non-sample review. The first-run Home path is unchanged.
  - Hours card: hover or keyboard focus shows the method in a panel tooltip ("Reviews × time saved per review type" plus the per-type hours from the constants).
  - Banner: info Callout, "Needs engine v2 API sample — figures are layout placeholders." Dismissal is per user (localStorage list of user ids, in try/catch).
  - Spend: Export links to `/configure/billing?tab=activity`.
- **Derivation** (`value-model.ts`). Reviews are the org's non-sample reviews the pipeline has finished with (`in_review`, `completed`, `returned`).
  - Hours = per-type hours (technical 3, administrative 1).
  - Math checks = per-type counts (28 / 6).
  - Findings = sum of `openFindings`, "Across N reports".
  - Spend: wallet orgs use this month's ledger debits (credits × `CREDIT_USD`). Invoiced orgs use reviews × `costFor(types)` × `CREDIT_USD`.
  - Meridian today reads ~14.0 h, 124 checks, 8 findings across 3 reports, ~$900 / 6 credits.
- **E-mails** (`/emails`). No AppShell. Band with note, Light/Dark toggle (uses the prefs store) and a "Back to start" link. A filter row of chips (All plus one per e-mail). Each card is 600px wide with a From / To / Subject strip above a white paper.
  - `/emails#receipt` (or any id: `verify`, `ready`, `earned`, `low-balance`, `receipt`) shows just that e-mail. Clicking a chip updates the hash.
  - Copy is all in `content.ts`. Numbers come from `pricing.ts` and the HCB seed ledger: the earned row, the RCT-40918 receipt row and the balances.
  - Paper is white in dark. The header band uses a scoped `--em-navy` token holding the locked brand navy.

## Verified
- `npx tsc --noEmit`: clean. `npx eslint` on all my files: clean.
- Playwright walk (`scratchpad/build/walk-b.py`, port 3202, `NEXT_DIST_DIR=.next-b`), zero console or page errors.
  - Meridian strip shows 4 cards in light and dark. The banner dismisses and stays dismissed after reload. The Export href is correct.
  - trial-admin (first-run) shows no strip.
  - `/emails#receipt` shows 1 card.
  - The `/start` link exists. The DemoDock "E-mails" action opens `/emails` in a new tab.
- Screenshots, all in `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\67537008-86c0-4f6d-a19f-25346e534647\scratchpad\build\`: `phase4-H1-light.png`, `phase4-H1-dark.png`, `phase4-H1-hover-light.png`, `phase4-I1-light.png` (full page), `phase4-I1-dark.png` (full page), `phase4-I1-receipt-light.png`.
- Cleanup: dev server stopped, `.next-b` deleted, `app/tsconfig.json` restored.
- The first walk failed because the FirstRunHome page imported A's `bouncer.css` before A had created it. I waited and retried. I changed nothing on A's side.

## Differences from the canvas
- Figures are derived from seed data, so they differ (Meridian ~14.0 h, 124, 8, ~$900; the canvas shows ~14.5, 312, 86, ~$3,150).
- Spend uses list value (credits × `CREDIT_USD`). HCB trial debits are $0 in the ledger, so the dollar figure would otherwise read ~$0.
- E-mails render at a natural 600px, so two fit per row at 1440 (the canvas packs five narrow ones).
- E-mail copy changes: the "ready" mail adds a line on the first setup steps; the earned and receipt mails read the seed ledger. The receipt shows "Paid from Trial" and "Balance after 4 credits" (canvas: Purchased, 7), and the credits line shows "$0, list ~$300". The "earned" balance is 3 credits.
- The trial-org strip path (one completed review) is not walked, because no persona has one.

## Requests for other workstreams
- None blocking.
- To A: the dashboard's first-run branch still renders `FirstRunHome`. When an invite is accepted and the step count becomes N of 9, nothing in my files depends on it.
- Backend (one line each): value figures need the engine v2 API sample. E-mails are static previews; real sends need a transactional mail service plus the Keycloak theme (RWT-1062).
