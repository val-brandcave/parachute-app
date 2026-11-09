# v5 report, Agent N: nav progress bar + build notes switch

## Get started rail item (option A)
- Still the library nav row (`@realwired/ui`), so hover, the sliding active pill (layoutId), focus ring and collapsed tooltip are the library's own. The row's label slot renders any node at runtime, so expanded it gets a two-line label: "Get started" + quiet "4/9" (12px, tabular, tertiary; ~80% selected ink when active) and a 4px bar under it. Track `--md-surface-2` (translucent on the selected pill), fill `--md-primary` in light, `--md-on-selected` in dark, `currentColor` on the pill. Dark count pill removed.
- Row is 52px (via `--rw-nav-row-h` on the item). Collapsed: icon with a 3px bar under it (CSS `::before/::after`, width from `--gs-pct-n`, set on `<html>` by AppShell), tooltip "Get started, 4 of 9" (string label when collapsed).
- Trade-off: the typed `label` is a string; AppShell casts a node. If the library later types it strictly, ask for a `NavNode.meta` slot. CSS keys off `a[href="/get-started"]`.

## Build notes
- `useBuildNotes()` / `setBuildNotes()` in `store/prefs.store.ts` (localStorage `parachute:build-notes`, default off, `useSyncExternalStore`, false on server, so it works on the auth pages outside AppShell and syncs across tabs). Exported from `store/index.ts`.
- DemoDock: "Show build notes" switch at the panel foot.
- Gated: KeycloakFrame corner badge and template chip (now a client component), ValueStrip "Needs engine v2 API sample" callout.
- Checked /auth/sign-in and /auth/verify, off and on, light and dark: off shows no badge or `.ftl` chip.

## Other dev-only annotations found (NOT gated, outside my files)
- `app/(shell)/configure/billing/page.tsx:123` Plans chip "Hidden · flag"
- `app/bouncer/_components/PendingTable.tsx:85` title "Prototype only: acts as the invitee..."
- `app/bouncer/_components/SsoCard.tsx:49` "Prototype only. Staff set up SSO with your IT team." (product-ish copy, leave)
- Other auth pages (create-account, reset, mfa) pass `template` and are covered by the same KeycloakFrame gate.

## Notes
- Removed the unused `.nav-count` rule from globals.css.
- tsc and eslint clean on my files, zero console errors, tsconfig restored, no commit.
- Screenshots: scratchpad `v5/n/`.
