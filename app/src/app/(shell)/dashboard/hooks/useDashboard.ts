import { useEffect, useMemo, useState } from "react";
import { useReviewsStore } from "@/store";
import type { Period } from "@/components/molecules";

export function useDashboard() {
  const { reviews, fetchReviews } = useReviewsStore();
  const [initial, setInitial] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  useEffect(() => {
    fetchReviews().then(() => setInitial(false));
  }, [fetchReviews]);

  const [now] = useState(() => Date.now());

  // Current-state KPIs (point-in-time; not period-scoped).
  const kpis = useMemo(() => {
    const needsAction = reviews.filter((r) => r.status === "needs_action").length;
    const running = reviews.filter((r) => r.status === "running").length;
    const overdue = reviews.filter(
      (r) => r.slaDueAt < now && r.status !== "completed",
    ).length;
    const triage = reviews.filter((r) => r.status === "autorejected").length;
    return { needsAction, running, overdue, triage };
  }, [reviews, now]);

  // Throughput "completed" is period-scoped (mocked counts per period).
  const completed = useMemo(() => {
    const base = reviews.filter((r) => r.status === "completed").length;
    const mult = { week: 6, month: 18, quarter: 52, year: 196 }[period];
    return Math.max(base, mult);
  }, [reviews, period]);

  // Action needed: most urgent items waiting on the reviewer.
  const actionNeeded = useMemo(
    () =>
      [...reviews]
        .filter(
          (r) =>
            r.status === "needs_action" ||
            r.status === "autorejected" ||
            (r.slaDueAt < now && r.status !== "completed"),
        )
        .sort((a, b) => a.slaDueAt - b.slaDueAt)
        .slice(0, 5),
    [reviews, now],
  );

  // Recent reviews: most recently ordered.
  const recent = useMemo(
    () => [...reviews].sort((a, b) => b.orderedAt - a.orderedAt).slice(0, 5),
    [reviews],
  );

  // Throughput trend (mock bars for the chart, scaled by period).
  const trend = useMemo(() => {
    const labels =
      period === "week"
        ? ["Mon", "Tue", "Wed", "Thu", "Fri"]
        : period === "month"
          ? ["W1", "W2", "W3", "W4"]
          : period === "quarter"
            ? ["Mon 1", "Mon 2", "Mon 3"]
            : ["Q1", "Q2", "Q3", "Q4"];
    const seed = { week: 2, month: 5, quarter: 17, year: 49 }[period];
    return labels.map((x, i) => ({ x, v: seed + ((i * 7 + 3) % 9) }));
  }, [period]);

  return {
    isLoading: initial,
    period,
    setPeriod,
    kpis,
    completed,
    actionNeeded,
    recent,
    trend,
  };
}
