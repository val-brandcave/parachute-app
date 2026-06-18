/**
 * Column model for the reviews queue table. Shared by `ReviewTable` (render +
 * header sort + config menu) and `ReviewTableSkeleton` (grid template). Sort
 * comparators live in `useReviewQueue` (they need the team for reviewer names).
 */

export type ReviewColId =
  | "property"
  | "reviewer"
  | "type"
  | "pipeline"
  | "findings"
  | "due"
  | "actions";

/** Sortable columns — everything except Actions. */
export type SortCol = Exclude<ReviewColId, "actions">;

export interface ReviewColDef {
  id: ReviewColId;
  label: string; // header text ("" for Actions — its header holds the config button)
  width: string; // CSS grid track
  sortable: boolean;
  locked: boolean; // can't be hidden in the column-config menu
  align?: "center" | "end";
}

// Every data column is `minmax(floor, weight-fr)` so the grid stays balanced AND
// the remaining columns spread to fill when one is hidden (only Property used to
// flex, so hiding a column left a gap). Actions is floored to the widest button
// (≈ "Review" + ⋯) and grows only if a longer label appears, so it never shifts
// other columns under it.
export const REVIEW_COLUMNS: ReviewColDef[] = [
  { id: "property", label: "Property", width: "minmax(168px, 2.4fr)", sortable: true, locked: true },
  { id: "reviewer", label: "Reviewer", width: "minmax(80px, 0.5fr)", sortable: true, locked: false },
  { id: "type", label: "Type", width: "minmax(92px, 0.9fr)", sortable: true, locked: false },
  { id: "pipeline", label: "Pipeline", width: "minmax(148px, 1.5fr)", sortable: true, locked: false },
  { id: "findings", label: "Findings", width: "minmax(104px, 0.9fr)", sortable: true, locked: false },
  { id: "due", label: "Due", width: "minmax(88px, 0.8fr)", sortable: true, locked: false },
  { id: "actions", label: "", width: "minmax(136px, max-content)", sortable: false, locked: true, align: "end" },
];

/** All columns visible — the default (column choices are session-only). */
export const DEFAULT_VISIBLE: ReviewColId[] = REVIEW_COLUMNS.map((c) => c.id);

/** Build a `grid-template-columns` string for the currently-visible columns. */
export function gridTemplate(visible: ReadonlySet<ReviewColId>): string {
  return REVIEW_COLUMNS.filter((c) => visible.has(c.id))
    .map((c) => c.width)
    .join(" ");
}
