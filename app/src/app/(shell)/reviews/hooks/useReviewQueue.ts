import { useEffect, useMemo, useState } from "react";
import { useReviewsStore, useUsersStore } from "@/store";
import { CURRENT_USER } from "@/lib/current-user";
import {
  lifecycleBucket,
  needsMyAction,
  isOverdue,
  findingsKey,
  dueBucket,
  type LifecycleBucket,
} from "@/lib/review-lifecycle";
import type { SortCol } from "@/components/organisms/review-columns";
import type { Review, User } from "@/types";

export type QueueTab = "all" | LifecycleBucket;
export type SortState = { col: SortCol; dir: "asc" | "desc" } | null;

/* ---- sort rank helpers (column comparators; reviewer needs the team) ---- */

/** Type grouping order: Technical · Tech+Admin · Administrative · (unordered). */
function typeRank(r: Review): number {
  const tech = r.reviewTypes.includes("technical");
  const admin = r.reviewTypes.includes("administrative");
  if (!tech && !admin) return 3;
  return tech && admin ? 1 : tech ? 0 : 2;
}

/** How far a review has progressed through its lifecycle (earliest → latest). */
function pipelineRank(r: Review): number {
  switch (r.status) {
    case "intake":
      return 0;
    case "autorejected":
      return 0.5;
    case "running":
      return 1 + (r.pipelineStage || 0);
    case "returned":
      return 7;
    case "in_review":
      return 8;
    case "completed":
      return 9;
  }
}

/** Worst-severity order: critical → fail → flag → clean → none. */
function findingsRank(r: Review): number {
  const k = findingsKey(r);
  return k === "crit" ? 0 : k === "fail" ? 1 : k === "flag" ? 2 : k === "clean" ? 3 : 4;
}

/** Tri-state select-all facet, shared by every filter dropdown: "all" =
 *  everything (no filter, the default), [] = none (matches nothing), a subset
 *  = only those. Lets a dropdown truly deselect-all instead of snapping to all. */
export type MultiSel = "all" | string[];

export interface QueueFilters {
  findings: MultiSel; // crit / fail / flag / clean
  types: MultiSel; // technical / administrative
  reviewers: MultiSel; // assignee ids (selecting yourself = "Mine")
  firms: MultiSel; // appraisal firms
  due: MultiSel; // overdue / soon / paused
}

export const EMPTY_FILTERS: QueueFilters = {
  findings: "all",
  types: "all",
  reviewers: "all",
  firms: "all",
  due: "all",
};

const ME = CURRENT_USER.id;

/** Count of *active* facets — drives the Filters button badge. */
export function activeFilterCount(f: QueueFilters): number {
  return (
    (f.findings !== "all" ? 1 : 0) +
    (f.types !== "all" ? 1 : 0) +
    (f.reviewers !== "all" ? 1 : 0) +
    (f.firms !== "all" ? 1 : 0) +
    (f.due !== "all" ? 1 : 0)
  );
}

export function useReviewQueue() {
  const { reviews, fetchReviews } = useReviewsStore();
  const { users, fetchUsers } = useUsersStore();
  const [initial, setInitial] = useState(true);
  const [tab, setTab] = useState<QueueTab>("all");
  const [filters, setFilters] = useState<QueueFilters>(EMPTY_FILTERS);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState>(null);

  // Click a sortable header: none → asc → desc → back to the smart default.
  const cycleSort = (col: SortCol) =>
    setSort((s) =>
      !s || s.col !== col
        ? { col, dir: "asc" }
        : s.dir === "asc"
          ? { col, dir: "desc" }
          : null,
    );

  useEffect(() => {
    const minVisible = new Promise((r) => setTimeout(r, 700));
    Promise.all([fetchReviews(), fetchUsers(), minVisible]).then(() =>
      setInitial(false),
    );
  }, [fetchReviews, fetchUsers]);

  const [now] = useState(() => Date.now());

  const team = useMemo<Record<string, User>>(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users],
  );

  // Distinct appraisal firms present in the queue — the Firm facet's options.
  const firmOptions = useMemo(
    () => Array.from(new Set(reviews.map((r) => r.appraisalFirm))).sort(),
    [reviews],
  );

  // Per-tab counts (computed on the full set so the badges are stable as
  // filters change). "all" is the grand total.
  const counts = useMemo(() => {
    const c: Record<QueueTab, number> = {
      all: reviews.length,
      needs_action: 0,
      in_pipeline: 0,
      sent_back: 0,
      completed: 0,
      intake: 0,
    };
    for (const r of reviews) c[lifecycleBucket(r)]++;
    return c;
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (tab !== "all") list = list.filter((r) => lifecycleBucket(r) === tab);

    if (filters.findings !== "all") {
      const sel = filters.findings;
      list = list.filter((r) => {
        const k = findingsKey(r);
        return k !== null && sel.includes(k);
      });
    }
    if (filters.types !== "all") {
      const sel = filters.types;
      list = list.filter((r) => r.reviewTypes.some((t) => sel.includes(t)));
    }
    if (filters.reviewers !== "all")
      list = list.filter((r) => filters.reviewers.includes(r.assigneeId));
    if (filters.firms !== "all")
      list = list.filter((r) => filters.firms.includes(r.appraisalFirm));
    if (filters.due !== "all") {
      const sel = filters.due;
      list = list.filter((r) => sel.includes(dueBucket(r, now)));
    }

    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (r) =>
          r.propertyAddress.toLowerCase().includes(q) ||
          r.loanNo.toLowerCase().includes(q) ||
          r.appraisalFirm.toLowerCase().includes(q) ||
          r.propertyType.toLowerCase().includes(q),
      );

    if (sort) {
      const dir = sort.dir === "asc" ? 1 : -1;
      const cmp = (a: Review, b: Review): number => {
        switch (sort.col) {
          case "property":
            return a.propertyAddress.localeCompare(b.propertyAddress);
          case "reviewer":
            return (team[a.assigneeId]?.name ?? "").localeCompare(
              team[b.assigneeId]?.name ?? "",
            );
          case "type":
            return typeRank(a) - typeRank(b);
          case "pipeline":
            return pipelineRank(a) - pipelineRank(b);
          case "findings":
            return findingsRank(a) - findingsRank(b);
          case "due":
            return a.slaDueAt - b.slaDueAt;
        }
      };
      return list.sort((a, b) => cmp(a, b) * dir || a.slaDueAt - b.slaDueAt);
    }

    // Default (no column sort): surface what needs me first, then overdue,
    // then running; ties by due date.
    const rank = (r: Review) =>
      needsMyAction(r, ME)
        ? 0
        : isOverdue(r, now)
          ? 1
          : r.status === "running"
            ? 2
            : 3;
    return list.sort((a, b) => rank(a) - rank(b) || a.slaDueAt - b.slaDueAt);
  }, [reviews, tab, filters, query, now, sort, team]);

  return {
    isLoading: initial,
    counts,
    team,
    firmOptions,
    reviews: filtered,
    total: reviews.length,
    tab,
    setTab,
    filters,
    setFilters,
    query,
    setQuery,
    sort,
    cycleSort,
  };
}
