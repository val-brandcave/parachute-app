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

// CONSISTENT GUTTERS: only Property flexes (1fr) — it fills its width via
// TruncText, so it has no trailing gap. Every other column is
// `minmax(floor, max-content)` so it hugs its content (the floor just clears the
// header label / a two-chip Type / a date+marker Due). With all data columns
// content-sized, the visible gap between any two columns is the uniform grid
// `gap`, not a column's leftover whitespace — which is what made Pipeline→Findings
// look so much wider than the rest. Hiding a column gives its space back to
// Property (no hole). Actions floors to two icon-only buttons (primary + ⋯).
export const REVIEW_COLUMNS: ReviewColDef[] = [
  { id: "property", label: "Property", width: "minmax(200px, 1fr)", sortable: true, locked: true },
  { id: "reviewer", label: "Reviewer", width: "minmax(72px, max-content)", sortable: true, locked: false },
  { id: "type", label: "Type", width: "minmax(110px, max-content)", sortable: true, locked: false },
  { id: "pipeline", label: "Pipeline", width: "minmax(140px, max-content)", sortable: true, locked: false },
  { id: "findings", label: "Findings", width: "minmax(100px, max-content)", sortable: true, locked: false },
  { id: "due", label: "Due", width: "minmax(92px, max-content)", sortable: true, locked: false },
  { id: "actions", label: "", width: "minmax(76px, max-content)", sortable: false, locked: true, align: "end" },
];

/** All columns visible — the default (column choices are session-only). */
export const DEFAULT_VISIBLE: ReviewColId[] = REVIEW_COLUMNS.map((c) => c.id);

/** Build a `grid-template-columns` string for the currently-visible columns. */
export function gridTemplate(visible: ReadonlySet<ReviewColId>): string {
  return REVIEW_COLUMNS.filter((c) => visible.has(c.id))
    .map((c) => c.width)
    .join(" ");
}
