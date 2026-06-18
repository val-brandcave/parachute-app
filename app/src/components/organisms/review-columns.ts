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

export const REVIEW_COLUMNS: ReviewColDef[] = [
  { id: "property", label: "Property", width: "minmax(200px, 2fr)", sortable: true, locked: true },
  { id: "reviewer", label: "Reviewer", width: "72px", sortable: true, locked: false, align: "center" },
  { id: "type", label: "Type", width: "104px", sortable: true, locked: false },
  { id: "pipeline", label: "Pipeline", width: "158px", sortable: true, locked: false },
  { id: "findings", label: "Findings", width: "128px", sortable: true, locked: false },
  { id: "due", label: "Due", width: "104px", sortable: true, locked: false },
  { id: "actions", label: "", width: "minmax(128px, max-content)", sortable: false, locked: true, align: "end" },
];

/** All columns visible — the default (column choices are session-only). */
export const DEFAULT_VISIBLE: ReviewColId[] = REVIEW_COLUMNS.map((c) => c.id);

/** Build a `grid-template-columns` string for the currently-visible columns. */
export function gridTemplate(visible: ReadonlySet<ReviewColId>): string {
  return REVIEW_COLUMNS.filter((c) => visible.has(c.id))
    .map((c) => c.width)
    .join(" ");
}
