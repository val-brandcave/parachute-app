# Phase 4, workstream A report: Bouncer bridge, Realwired Admin mock, members mirror (G1, G2)

Paths under `app/`. Nothing committed.

## Added
- `src/app/launch/bouncer/page.tsx`: G1 bridge. Copies the `/launch` shape (`.hf*`, `.run-st*` classes), peers Parachute and Realwired Admin, a "Members & roles" chip on the dashed track, a Parachute logo top-left. Steps: "Opening Realwired Admin", "Signed in as <name>", "Members & roles for <org>". The first two tick by themselves, the third waits for **Continue** (then an arrival check, fade, `/bouncer`). Copy and the "Until the customer area exists, this sends a request to Realwired staff" chip are as briefed. `/launch` is untouched.
- `src/app/bouncer/`: `layout.tsx` (no AppShell), `page.tsx`, `useBouncerAdmin.ts` (page hook), `return-path.ts` (`safeReturn`, `withJoined`), `bouncer.css`, and `_components/` `TopBar`, `MembersTable`, `PendingTable`, `InviteDialog`, `SsoCard`.
- `src/store/bouncer.store.ts` (`useBouncerStore`, `useOrgInvites`), exported from `store/index.ts`. `src/types/invite.types.ts` (the `Invite` type; a new file under `types/` that the brief did not list, imported directly, `types/index.ts` untouched).
- `Collections.INVITES`, `data/seed/invites.seed.ts` (also exports `INVITE_LIFE_DAYS` = 7), registered in `seed/index.ts`.

## Behaviour
- **Realwired Admin (`/bouncer?to=members&return=<path>`)**: own navy bar (shield mark, "Realwired / Admin", org name, **Back to Parachute**, avatar). Title "Members & roles" with Invite people. Tabs: Members, Pending invites (count), Single sign-on.
  - **Members**: name, e-mail, role (a select, so role changes work, persisted to the users collection and toasted), status, last active. The account holder and "You" are locked with a lock tooltip. A hint says an approver also reviews.
  - **Invite dialog**: e-mail chips (Enter, comma, space or paste; Backspace removes), invalid, already-member and already-invited chips go red with a reason on hover and block Send. A different domain from the org's verified domain (the billing contact's) shows an amber warning and does not block. Role radio cards (reviewer, approver, org admin, one line each), optional message, **Send invites**. After sending it moves to the Pending tab with a toast.
  - **Pending invites**: e-mail, role, invited by, sent, expires, **Resend** (resets to 7 days), **Revoke** (inline "Revoke this invite? Keep / Revoke", no `window.confirm`), and a quiet dotted **Simulate accept**. Empty state with an Invite people button.
  - **SSO**: read-only card ("SAML / OIDC set up by Realwired staff", Not configured, verified domain) with an "Ask Realwired to set up SSO" toast.
- **Accept (simulate)**: creates an active user in the users collection (name from the seed's `inviteeName` or derived from the e-mail), marks the invite accepted, completes setup step `invite` through the onboarding store, and remembers the invite id. **Back to Parachute** links to `<return>?joined=<inviteId>`.
- **G2**: FirstRunHome shows a dismissible success Callout "<Name> accepted your invite as <role>" with **View members**, driven by `?joined=` and the accepted invite record, so it survives a reload. Dismiss clears the param.
- **Setup step `invite`** ("Invite a teammate", group "Ready for your team", side none, admin only, action **Invite** to `/launch/bouncer?to=members&return=/dashboard`). It sits last in the group so the existing "Next" step order is unchanged. Deferred reward noted in the step def and the store, not the UI. Header count is now "N of 9". While invites are pending, the row shows "In progress" with "1 invite pending · l.chen@harborcb.com" live from the bouncer store (not seeded), and a **Manage** button.
- **Members mirror (Configure > Organization > Members)**: read-only (no menus, no invite). Petrol Callout "Members and roles are managed in Realwired Admin." and **Manage in Realwired Admin** to `/launch/bouncer?to=members&return=/configure/organization?tab=members`. Pending invites show as muted rows ("Invited · pending", "Sent 8 Nov"). The org page now opens the Members tab from `?tab=members`.

## Role guard (coordinator review)
- `/bouncer` is read-only unless the signed-in user is an `org_admin` (`canManage` in `useBouncerAdmin`). Reviewers and approvers see the members list with locked roles (tooltip "Only an org admin can change roles."), no Invite people button, no Resend, Revoke or Simulate accept, no SSO request button, and the note "Only your organization admin can manage members. Ask <admin name>." (the billing contact, else the first org admin). The Pending tab stays visible, read-only. The Members mirror's **Manage in Realwired Admin** button stays for everyone.
- Verified: reviewer persona shows 0 invite buttons, 0 role selects, 0 row actions; trial-admin keeps all controls; zero console errors. Screenshot `phase4-bouncer-reviewer-light.png` in the same build folder.

## Seeds (SEED_VERSION v20)
- HCB: one pending invite, `l.chen@harborcb.com`, reviewer, sent 6 Nov 14:20 by Dana (`inviteeName` "Lena Chen"). Cedar Ridge and Meridian have none.
- **Setup choice for the C2 state**: HCB keeps `invite` open, so it reads **4 of 9** and the Invite row shows the pending invite as in progress. That keeps the step available for the accept demo (it flips to 5 of 9 and "Teammate invited" in the done line). Cedar Ridge has `invite` done (6 of 8 became **7 of 9**, layout still next). Meridian (`org-001`) has it done, so it stays fully set up.

## Verified
- `npx tsc --noEmit` clean. `npx eslint` clean over my files.
- Playwright walk (`scratchpad/build/walk-p4a.py`, port 3201) with zero console and page errors: Home 4 of 9 > bridge > Continue > `/bouncer`; role change; invite with two chips (one off-domain warning), Approver, send gives 3 pending; revoke confirm inline; resend; SSO tab; Simulate accept gives Lena Chen as a member, Back link `/dashboard?joined=invite-hcb-1`, Home callout, 5 of 9, dismiss clears; org Members mirror shows the pending row; Manage link goes to the bridge with the right `return`; checklist Invite row and link; other personas (Cedar, Meridian, reviewer) render `/bouncer`; dark theme for the bridge, Admin members and the invite dialog (with an invalid chip).
- Screenshots (`C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\67537008-86c0-4f6d-a19f-25346e534647\scratchpad\build\`): `phase4-G1-light.png`, `phase4-bouncer-members-light.png`, `phase4-bouncer-invite-light.png`, `phase4-bouncer-pending-light.png`, `phase4-G2-light.png`, `phase4-org-members-light.png`, `phase4-G1-dark.png`, `phase4-bouncer-members-dark.png`; extras `phase4-bouncer-sso-light.png`, `phase4-home-invite-row-light.png`, `phase4-bouncer-invite-dark.png`.
- Dev server stopped, `.next-a` deleted, `app/tsconfig.json` restored.

## Differences from the canvas
- G1: the track chip and layout match; the shield tile is neutral as on the board. G1 has a Continue and no auto-advance.
- G2: the canvas shows the done step as its own row. The app folds finished steps into the "Account created · …" line (existing Phase 2 behaviour), so "Teammate invited" appears there. Callout copy and "View members" match. The canvas says "of 6"; the app says "of 9".
- Realwired Admin has no canvas board, so it follows the app's tokens with a distinct navy bar. In dark the bar uses the lifted navy token, which reads brighter than the light bar.
- Members mirror keeps the existing Phase 1 table; the canvas had none.

## Backend and caveats (one line each)
- Real Bouncer owns invites (e-mail send, accept link, expiry), users, roles and SSO. Parachute reads a members list from it.
- Role changes persist to the users collection but ignore any rule on removing the last org admin.
- Invite expiry is shown as a date only (no "expired" state, since render must not read the clock).
- The `?joined=` callout appears on first-run Home only; an `active` org does not show it.

## Requests for other workstreams
- `demo-personas.seed.ts` description ("4 of 8" to "4 of 9"): the coordinator is changing it.
- `docs/plans/self-serve/screens-spec.md` and the boards still say "of 6" / "of 8" (coordinator).
