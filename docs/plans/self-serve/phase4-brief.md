# Phase 4: Bouncer bridge and invites, value dashboard, e-mail kit (prototype)

Repo `C:\Users\vvrsv\OneDrive\Desktop\parachute`, app in `app/`, branch `feat/self-serve-onboarding` (checked out). Do NOT commit, push or switch branches. Never `git add` anything under `docs/meetings/`. Windows + Git Bash; never redirect to `nul`. Write Python files with `encoding="utf-8"`. Use the Write tool for files, not long heredocs.

Two agents (A, B) build in parallel in the same working tree; the coordinator writes the docs meanwhile. Each agent owns the files listed for it. **Do not edit files the other workstream owns.** If you need a change there, describe it exactly in your report.

## Framing
This is a polished prototype with fully mocked data and logic. Make it look and flow right. Numbers come from `src/lib/pricing.ts` or a small data file you own; no numbers hard-coded in copy. Backend dependencies get one line in the report, never a blocker.

## Read first (both)
1. `app/AGENTS.md` (house rules).
2. `docs/plans/self-serve/phase3-report.md` and `phase2-report.md`. They cover what exists: stores `wallet`, `onboarding`, `org`, `session`, `users`, `demo`; `DemoDock`; `useToast` from `@realwired/ui`; personas at `/demo/<id>`; FirstRunHome and the active dashboard; seed `SEED_VERSION` (v19 now) in `data/adapters/mock-adapter.ts`.
3. `docs/plans/parachute-self-serve-onboarding-spec.md` §3 (ownership: Bouncer owns members, roles and SSO), §5 and §8 (Phase 4), plus decision D10 (members in Parachute: a read-only mirror plus a Bouncer link). Also read `docs/plans/self-serve/screens-spec.md` §1 and Flows G, H, I.
4. Canvas renders (look at both `--light` and `--dark`): `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\18a37024-3495-423c-bd1f-7e1fe12e2a4b\scratchpad\canvas\proof\` → `G1-bouncer-bridge`, `G2-back-with-member`, `H1-value-dashboard`, `I1-emails`. Source HTML with exact copy is in `…\canvas\project\<board>.dc.html`.
5. **Invoke the `example-skills:frontend-design` skill before writing UI.** Use it for craft (hierarchy, spacing, states, edge cases, restrained motion), NOT to restyle. The canvas and the app's design system are the approved direction. Compose from `@realwired/ui` and the existing classes first.

## House rules that bite
- No monospace anywhere. Use `tabular-nums` for figures.
- Don't cap page-content widths. Dialogs, e-mail cards and paper may have a natural width.
- Tokens only (`--md-*`). Primaries are navy; links and focus are petrol. Small captions use ink-2. Inputs are white in light theme only.
- **Do not edit `src/app/globals.css`.** Put your styles in your own CSS file (listed below) and import it from your own component or page. Class prefixes: A `bx-`, B `vl-` / `em-`.
- Library dialogs and toasts already sit above full-screen takeovers (Phase 3 `wallet.css`).
- If styling looks broken while the source is right, restart your dev server. Don't rewrite the CSS.

## Workstream A: Bouncer bridge, Bouncer mock with invites, members mirror (G1, G2)
**Owns:**
- new `src/app/launch/bouncer/**` and `src/app/bouncer/**`
- new `src/store/bouncer.store.ts`, exported from `src/store/index.ts` (one export line only)
- new collection `INVITES` in `src/data/collections.ts`, plus a seed file `src/data/seed/invites.seed.ts` registered in `src/data/seed/index.ts`
- `src/components/organisms/MembersPanel.tsx` and `src/app/(shell)/configure/organization/**`
- `src/lib/setup-steps.ts`, `src/data/seed/setup-progress.seed.ts`
- `src/components/organisms/home/FirstRunHome.tsx`, `SetupChecklist.tsx`
- `src/data/adapters/mock-adapter.ts` (bump to **v20**; you are the only one seeding)
- new `src/app/bouncer/bouncer.css`

1. **Bridge (G1)** at `/launch/bouncer?to=members&return=<path>`. Generalise the visual of the existing `/launch` YouConnect HandoffBridge without breaking `/launch`: either factor a shared bridge component into your own files and use it from `/launch/bouncer`, or copy it. Do not edit `app/launch/page.tsx`. The bridge has two peers, Parachute ↔ **Realwired Admin** (Bouncer). Steps: "Opening Realwired Admin · Signed in as <name> · Members & roles for <org>". Copy: "Members, roles and SSO live in Realwired Admin. You'll come back here when you're done." Add a **Continue** button (auto-advance is fine too) and the chip "Until the customer area exists, this sends a request to Realwired staff". It lands on `/bouncer`.
2. **Bouncer mock** at `/bouncer`. Treat it as a separate product, styled as "Realwired Admin": its own simple top bar with the Realwired mark or wordmark (reuse what `/youconnect` does for a foreign product) and a "Back to Parachute" link to `return`. It is NOT inside the Parachute AppShell. Sections:
   - **Members** table: name, e-mail, role (reviewer, approver, org_admin), status, last active. Members come from the users store for this org. Role changes are allowed (approver is cumulative: an approver also reviews, per the 4 Nov note).
   - **Invite** panel or dialog: one or more e-mails (chips), a role pick (reviewer / approver / org_admin) with a one-line description each, an optional message, and **Send invites**. Validate the e-mails. Warn when the domain differs from the org's verified domain, but don't block it.
   - **Pending invites**: e-mail, role, invited by, sent date, expiry (7 days), and **Resend** / **Revoke** actions (revoke asks for confirmation inline, not through `window.confirm`).
   - **Demo affordance:** a quiet "Simulate accept" on a pending row (prototype only). It creates the user in the users store with that role and marks the invite accepted.
   - **SSO** tab or card: read-only placeholder ("SAML / OIDC set up by Realwired staff").
3. **Return (G2):** "Back to Parachute" goes to `return` (default `/dashboard`) with `?joined=<inviteId>` or a store flag. Home (FirstRunHome) shows a success Callout "<Name> accepted your invite as <role>" (dismissible).
   - Add the step `invite` back to the "Ready for your team" group: "Invite a teammate", no credit, side kind none. It is completed when an invite is accepted. Note "Deferred: reward on an accepted approver invite" in the step defs, not in the UI. The header count stays derived, so it becomes "N of 9". Update the seeds so the HCB C2 state still reads sensibly, and say what you chose.
4. **Members mirror in Parachute (D10):** on Configure → Organization → Members, the list is read-only (no inline role edits or invites in Parachute), with a petrol note "Members and roles are managed in Realwired Admin." and a **Manage in Realwired Admin →** button to `/launch/bouncer?to=members&return=/configure/organization?tab=members`. Pending invites from the bouncer store show as muted rows ("Invited · pending"). The setup step's Invite action routes to the same bridge with `return=/dashboard`.
5. Seeds: HCB has one pending invite (for example `l.chen@harborcb.com`, reviewer, sent 6 Nov by Dana). Cedar Ridge and Meridian have none.
- Screenshots: `phase4-G1-light`, `phase4-bouncer-members-light`, `phase4-bouncer-invite-light` (dialog open, two chips, role picked), `phase4-bouncer-pending-light`, `phase4-G2-light`, `phase4-org-members-light`, `phase4-G1-dark`, `phase4-bouncer-members-dark`.

## Workstream B: value dashboard (H1) and the e-mail kit (I1)
**Owns:**
- `src/app/(shell)/dashboard/**` (active-stage branch only; don't change the FirstRunHome path)
- new `src/components/organisms/value/**` with `value.css`
- new `src/app/emails/**` (prototype-only e-mail preview route) with `emails.css`
- `src/app/start/**` (add an "E-mail previews" link)
- `src/components/organisms/DemoDock.tsx` (add an "E-mails" link)
- `src/data/seed/demo-personas.seed.ts` (only if you add a persona)

1. **Value strip (H1)** on the active dashboard: four monochrome stat cards above or below the StatBar, as on the canvas.
   - **Hours saved this month**, about 14.5. Hover or focus shows the method: "reviews × ~X h saved per review type". Constants go in `components/organisms/value/value-model.ts`.
   - **Math checks re-run**.
   - **Findings raised**.
   - **Spend this month**, "~$X · N credits · Export". Derive it from this org's ledger debits this month (`useWalletStore`). For invoiced orgs, derive it from reviews × the review-type price. Export goes to `/configure/billing?tab=activity`.
   - Derive the other figures from this org's non-sample reviews and findings where the data exists. Otherwise use clearly placeholder figures driven by the constants.
   - Banner (info Callout, dismissible per user): "Needs engine v2 API sample — figures are layout placeholders."
   - Show the strip for orgs whose stage is `active`, so `returning` and `enterprise-yc` (Meridian) see it. For a trial or payg org that finishes setup, show it once it has completed at least one non-sample review.
2. **E-mail kit (I1)** at `/emails` (prototype only, no AppShell, light page plus dark-theme support like the rest). A page band "E-mail previews" with a short note: "Realwired-branded transactional e-mails. Keycloak sends the verify code; Parachute sends the rest." Show the cards in a responsive grid, each one a realistic e-mail at its natural width (about 600px), with a From / Subject header strip above it:
   - Welcome + verify code (Keycloak)
   - "<Org> is ready" (trial summary: credits, sample, the first three steps)
   - "You earned a credit" (the ledger line and the new balance)
   - "Low balance" (1 credit left, **Add credits** button)
   - "Receipt for 220 Commerce Way" (same fields as the D5 receipt)
   Content comes from the HCB cast and `pricing.ts`. Put the e-mail copy in `src/app/emails/content.ts` so Ed can edit it. E-mail paper stays white in dark. Add a filter or anchor list across the top so a single e-mail can be linked (`/emails#receipt`).
3. Links: on `/start`, a quiet "E-mail previews" link. In the DemoDock, an "E-mails" action that opens `/emails` in a new tab.
- Screenshots: `phase4-H1-light`, `phase4-H1-dark`, `phase4-H1-hover-light` (method tooltip), `phase4-I1-light`, `phase4-I1-dark`, `phase4-I1-receipt-light`.

## Verify (each agent, own scope)
- From `app/`, run the dev server with its own build dir and port: A `NEXT_DIST_DIR=.next-a npx next dev -p 3201`, B `NEXT_DIST_DIR=.next-b npx next dev -p 3202` (in the background). Errors from files you don't own: wait, retry, note them; don't fix them.
- `npx tsc --noEmit` and `npx eslint <your files>` must be clean for your files.
- Run a Python Playwright walk. Reuse the helpers in `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\67537008-86c0-4f6d-a19f-25346e534647\scratchpad\build\walk-a.py` (persona at `/demo/<id>`; hide `.demo-dock` and `nextjs-portal` in shots). Zero console or page errors on your flows.
- Save screenshots at 1440 wide to `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\67537008-86c0-4f6d-a19f-25346e534647\scratchpad\build\`, NOT in the repo. LOOK at them next to the canvas proofs and fix visible differences (one or two rounds).
- Stop your dev server, delete your `.next-*` dir, and run `git checkout app/tsconfig.json` (`next dev` rewrites it).
- Write `docs/plans/self-serve/phase4-report-<a|b>.md` (added or changed, behaviour, verified, differences from the canvas, requests for others). Reply with a concise summary listing the screenshot paths and any cross-workstream requests.
