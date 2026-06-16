import { useEffect, useMemo, useState } from "react";
import { useReviewsStore } from "@/store";
import type { Review, ReviewStatus } from "@/types";

export type QueueTab = "all" | "mine" | "flagged";
export type StatusFilter = "any" | ReviewStatus;

export function useReviewQueue() {
  const { reviews, fetchReviews } = useReviewsStore();
  const [initial, setInitial] = useState(true);
  const [tab, setTab] = useState<QueueTab>("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("any");

  useEffect(() => {
    // Mock reads resolve synchronously, so hold the loading state for a short
    // minimum to emulate real data loading (and let the skeleton shimmer show).
    const minVisible = new Promise((r) => setTimeout(r, 700));
    Promise.all([fetchReviews(), minVisible]).then(() => setInitial(false));
  }, [fetchReviews]);

  const counts = useMemo(
    () => ({
      all: reviews.length,
      mine: reviews.length,
      flagged: reviews.filter((r) => r.flaggedCount > 0).length,
    }),
    [reviews],
  );

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (tab === "flagged") list = list.filter((r) => r.flaggedCount > 0);
    if (status !== "any") list = list.filter((r) => r.status === status);
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (r) =>
          r.propertyAddress.toLowerCase().includes(q) ||
          r.loanNo.toLowerCase().includes(q) ||
          r.bank.toLowerCase().includes(q) ||
          r.propertyType.toLowerCase().includes(q),
      );
    const rank = (r: Review) =>
      r.status === "needs_action" ? 0 : r.status === "autorejected" ? 1 : 2;
    return list.sort((a, b) => rank(a) - rank(b) || a.slaDueAt - b.slaDueAt);
  }, [reviews, tab, status, query]);

  return {
    isLoading: initial,
    counts,
    reviews: filtered,
    total: reviews.length,
    tab,
    setTab,
    query,
    setQuery,
    status,
    setStatus,
  };
}
