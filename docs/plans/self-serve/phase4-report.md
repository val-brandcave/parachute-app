# Phase 4 report (coordinator)

Two agents built Phase 4 in parallel from `phase4-brief.md`. Their details are in `phase4-report-a.md` (Bouncer bridge, invites, members mirror) and `phase4-report-b.md` (value strip, e-mail kit).

## Built
- **G1 bridge:** `/launch/bouncer`. It shows Parachute ↔ Realwired Admin with stepped checks and a Continue button. `/launch` (YouConnect) is untouched.
- **`/bouncer` (Realwired Admin mock, outside the AppShell):**
  - Members, with role changes.
  - An Invite dialog: e-mail chips, validation, a non-blocking warning for off-domain addresses, a role pick and a message.
  - Pending invites, with Resend, inline-confirmed Revoke and a "Simulate accept" for demos.
  - A read-only SSO card.
  - A role guard: only org admins can manage. Everyone else gets a read-only view with "Ask <admin>".
- **G2:** Back to Parachute → `?joined=` → a callout on Home: "<Name> accepted your invite as <role>". It completes the new `invite` step, so the checklist is now N of 9.
- **Members mirror (D10):** Configure → Organization → Members is read-only and shows pending invites. It has **Manage in Realwired Admin →**.
- **H1 value strip** on the active dashboard: hours saved (method on hover), math checks, findings, spend this month (with Export to billing activity). A dismissible "Needs engine v2 API sample" banner sits above it. The constants live in `components/organisms/value/value-model.ts`.
- **I1 `/emails`:** previews of five transactional e-mails (verify code, org ready, credit earned, low balance, receipt). They have filter chips, deep links (`/emails#receipt`) and white paper in dark mode. The copy is in `app/emails/content.ts`. Linked from `/start` and the DemoDock.
- **Seeds:** v20. HCB has one pending invite (l.chen@harborcb.com).

## Coordinator work
- **Docs:**
  - `AGENTS.md` has a self-serve section: pricing constants, ownership, the wallet ledger, store-driven dialogs, org stage, setup steps, personas and parallel dev servers.
  - The feedback log has F-155 to F-166: the 3 Nov decisions, recorded as decisions with no quotes, plus the 6 Nov invite-flow ask.
  - The spec has a build-status line.
- The trial-admin persona description now reads "4 of 9".
- Asked A for the Bouncer role guard after review.

## Verified
- `npx tsc --noEmit` and `npx eslint src --ext .ts,.tsx` are clean.
- Combined walk on one server (`scratchpad/build/walk-int4.py`), zero console or page errors:
  - Trial admin: Home 4 of 9 → bridge → Bouncer → Simulate accept → back with the callout.
  - The members mirror note shows, and billing still renders.
  - Meridian sees the value strip.
  - A reviewer sees no Invite button in Bouncer.
  - `/emails` shows all 5 cards.
- Screenshots: session scratchpad `build/phase4-*.png` and `phase4-int-*.png`.

## Differences from the canvas
- The value figures derive from seed data (~14 h, 124, 8, ~$900 for Meridian) instead of the canvas's placeholders.
- Realwired Admin had no board, so it uses the app tokens with a navy bar.
- The receipt e-mail uses the seeded ledger (paid from trial).
- Finished setup steps fold into the "Account created · …" line, as in Phase 2.

## Open
- The joined callout shows only on first-run Home. Active-dashboard orgs get the toast.
- No persona has a trial org with a completed review, so the trial-org value-strip path wasn't walked.
- Lingering dev servers from the parallel agents can hold ports (3000/31xx/32xx). Kill the `node` processes whose command line mentions `parachute` before starting a new server.
- Not yet done: the Loom per phase for Ed, sending Ed the build, and pushing (the branch stays off main, like `feat/design-system-consume`).
