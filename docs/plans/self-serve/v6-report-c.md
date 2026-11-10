# v6 report C: everything else (10 Nov 2026)

Screenshots: `C:\Users\vvrsv\AppData\Local\Temp\claude\b4b606d58d56b153\4068bd9e-78ed-43c9-b97a-908e2b01b409\scratchpad\v6\c\` (`-light` / `-dark`, 1440x900). tsc and eslint clean; routes 200, no console errors.

| Place | Level | Before -> after | Screenshot |
|---|---|---|---|
| Response library, nothing in either library (`configure/responses`) | 1 | Tabs, search and a table header over a sentence -> tabs and search hidden, one `EmptyState` ("Your response library starts here", GhostRows); header Add template is the primary | resp-none |
| Response library, empty Org/Personal tab | 1 (tab) | headers over "No templates in the ... library yet" -> `EmptyState` ("No personal templates yet"); tabs stay, search hidden | resp-personal-empty |
| Response library, search with no match | 3 | headers over "No templates match ..." -> `EmptyLine` "Nothing matches ..." + Clear search; tabs and search kept | resp-nomatch |
| `ResponseTable` | shared | `emptyLabel` string + headers -> `empty` node, returned instead of the table (no headers) | |
| `FamilyTable` (checklists, workbook layouts) | 1 (defensive) | headers over nothing -> optional `empty` prop; both pages pass a one-line `EmptyLine`. Not reachable with seed data (default can't be deleted) | n/a |
| Bouncer, Pending invites tab | 1 | custom `.bx-empty` block -> `EmptyState` (GhostRows, Invite people for admins); dead `.bx-empty` CSS removed | bouncer-pending |
| Intake widget, YouConnect list (`IntakeWidget`) | 2/3 | grey centred sentence; search box shown with 0 deliveries -> search hidden when there are no deliveries; search miss = `EmptyLine` + Clear search | intake-none, intake-nomatch |
| Response template picker popover | 3 | "No templates in this set." -> `EmptyLine` naming the library and where to add | not captured (needs an open review composer) |

Removed dead CSS: `.rtl-empty`, `.intake-yc-empty`, `.rtpick-empty` (globals.css), `.bx-empty*` (bouncer.css).

## Left alone
- Command palette "No matches for ..." : already one calm line, and the palette is a transient overlay.
- Members mirror (`MembersPanel`) and Bouncer members table: always contain at least the signed-in user.
- Checklists/layouts/defaults/security/organization pages: always seeded; `defaults` "Not set yet" is a single value, not a list; security sends list is already hidden when empty.
- Get started lists (`organisms/home`): rows are hidden when empty already (`SetupChecklist` returns null). `/emails` has no data lists.
- Review composer comments (`WorkbookComments`): empty state is the placeholder text only.

## Shared parts
`EmptyState.tsx` untouched.

## Cross-requests
None.
