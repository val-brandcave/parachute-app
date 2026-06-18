import { useEffect, useMemo, useState } from "react";
import { useReviewsStore, useUsersStore } from "@/store";
import { CURRENT_USER } from "@/lib/current-user";
import {
  lifecycleBucket,
  needsMyAction,
  isOverdue,
  type LifecycleBucket,
} from "@/lib/review-lifecycle";
import type { Review, Severity, User } from "@/types";

export type QueueTab = "all" | LifecycleBucket;
export type SeverityFilter = "any" | "crit" | "fail" | "flag";

const ME = CURRENT_USER.id;

export function useReviewQueue() {
  const { reviews, fetchReviews } = useReviewsStore();
  const { users, fetchUsers } = useUsersStore();
  const [initial, setInitial] = useState(true);
  const [tab, setTab] = useState<QueueTab>("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [severity, setSeverity] = useState<SeverityFilter>("any");
  const [query, setQuery] = useState("");

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
    if (mineOnly) list = list.filter((r) => r.assigneeId === ME);
    if (severity !== "any")
      list = list.filter((r) => r.worstSeverity === (severity as Severity));
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (r) =>
          r.propertyAddress.toLowerCase().includes(q) ||
          r.loanNo.toLowerCase().includes(q) ||
          r.appraisalFirm.toLowerCase().includes(q) ||
          r.propertyType.toLowerCase().includes(q),
      );

    // Surface what needs me first, then overdue, then running; ties by due date.
    const rank = (r: Review) =>
      needsMyAction(r, ME)
        ? 0
        : isOverdue(r, now)
          ? 1
          : r.status === "running"
            ? 2
            : 3;
    return list.sort((a, b) => rank(a) - rank(b) || a.slaDueAt - b.slaDueAt);
  }, [reviews, tab, mineOnly, severity, query, now]);

  return {
    isLoading: initial,
    counts,
    team,
    reviews: filtered,
    total: reviews.length,
    tab,
    setTab,
    mineOnly,
    setMineOnly,
    severity,
    setSeverity,
    query,
    setQuery,
  };
}
