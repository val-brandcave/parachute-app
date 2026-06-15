import { useEffect, useMemo, useState } from "react";
import { useReviewsStore } from "@/store";
import type { Period, DateRange } from "@/components/molecules";

const DAY = 86400000;

export function useDashboard() {
  const { reviews, fetchReviews } = useReviewsStore();
  const [initial, setInitial] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [range, setRangeState] = useState<DateRange | null>(null);

  // Choosing a custom range implicitly switches the active period to "custom".
  const setRange = (r: DateRange) => {
    setRangeState(r);
    setPeriod("custom");
  };

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
    if (period === "custom" && range) {
      const days = Math.max(1, Math.round((range.end - range.start) / DAY));
      return Math.max(base, Math.round(days * 1.1));
    }
    const MULT: Partial<Record<Period, number>> = {
      week: 6,
      month: 18,
      quarter: 52,
      year: 196,
    };
    return Math.max(base, MULT[period] ?? 18);
  }, [reviews, period, range]);

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
    if (period === "custom" && range) {
      const n = 6;
      const span = range.end - range.start;
      return Array.from({ length: n }, (_, i) => {
        const d = new Date(range.start + (span * i) / (n - 1));
        return {
          x: `${d.getMonth() + 1}/${d.getDate()}`,
          v: 4 + ((i * 7 + 3) % 9),
        };
      });
    }
    const labels =
      period === "week"
        ? ["Mon", "Tue", "Wed", "Thu", "Fri"]
        : period === "month"
          ? ["W1", "W2", "W3", "W4"]
          : period === "quarter"
            ? ["Mon 1", "Mon 2", "Mon 3"]
            : ["Q1", "Q2", "Q3", "Q4"];
    const SEED: Partial<Record<Period, number>> = {
      week: 2,
      month: 5,
      quarter: 17,
      year: 49,
    };
    const seed = SEED[period] ?? 5;
    return labels.map((x, i) => ({ x, v: seed + ((i * 7 + 3) % 9) }));
  }, [period, range]);

  return {
    isLoading: initial,
    period,
    setPeriod,
    range,
    setRange,
    kpis,
    completed,
    actionNeeded,
    recent,
    trend,
  };
}
