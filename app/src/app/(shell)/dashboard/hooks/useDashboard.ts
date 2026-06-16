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
    // Mock reads resolve synchronously, so hold the loading state for a short
    // minimum to emulate real data loading (and let the skeleton shimmer show).
    const minVisible = new Promise((r) => setTimeout(r, 700));
    Promise.all([fetchReviews(), minVisible]).then(() => setInitial(false));
  }, [fetchReviews]);

  const [now] = useState(() => Date.now());

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

  // Review-volume series + summary (mock; date-based buckets per period).
  // v = reviews completed, t = avg turnaround (min), onTime = % within SLA.
  const trend = useMemo(() => {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    const tr = (i: number) => 18 + ((i * 5 + 2) % 12); // 18–29 min
    const on = (i: number) => 88 + ((i * 7 + 1) % 11); // 88–98 %

    let count: number;
    let target: number; // approx total completed for the period
    let label: (i: number) => string;
    let tickEvery: number;

    if (period === "custom" && range) {
      const span = Math.max(DAY, range.end - range.start);
      const days = Math.round(span / DAY);
      const daily = days <= 31;
      count = daily ? Math.max(2, days) : Math.min(16, Math.ceil(days / 7));
      const step = span / Math.max(1, count - 1);
      target = Math.max(count, Math.round(days * 1.0));
      tickEvery = Math.max(1, Math.ceil(count / 6));
      label = (i) => md(new Date(range.start + step * i));
    } else if (period === "week") {
      count = 7;
      target = 8;
      tickEvery = 1;
      label = (i) => DOW[new Date(now - (count - 1 - i) * DAY).getDay()];
    } else if (period === "month") {
      count = 5; // weekly buckets
      target = 20;
      tickEvery = 1;
      label = (i) => md(new Date(now - (count - 1 - i) * 7 * DAY));
    } else if (period === "quarter") {
      count = 13; // weekly buckets
      target = 55;
      tickEvery = 3;
      label = (i) => md(new Date(now - (count - 1 - i) * 7 * DAY));
    } else {
      count = 12; // monthly buckets
      target = 200;
      tickEvery = 1;
      const m0 = new Date(now).getMonth();
      label = (i) => MONTHS[(m0 - (count - 1 - i) + 1200) % 12];
    }

    const base = target / count;
    const points = Array.from({ length: count }, (_, i) => {
      const wave = 1 + 0.45 * Math.sin(i * 0.9) + ((i % 3) - 1) * 0.12;
      return {
        key: `${period}-${i}`,
        label: label(i),
        tick: i % tickEvery === 0 || i === count - 1,
        v: Math.max(0, Math.round(base * wave)),
        t: tr(i),
        onTime: on(i),
      };
    });

    const completed = points.reduce((s, p) => s + p.v, 0);
    const avgT = Math.round(points.reduce((s, p) => s + p.t, 0) / count);
    const avgOn = Math.round(points.reduce((s, p) => s + p.onTime, 0) / count);
    const prev = {
      completed: Math.round(completed * 0.92),
      avgT: avgT + 2,
      avgOn: Math.max(0, avgOn - 2),
    };
    return { points, completed, avgT, avgOn, prev };
  }, [period, range, now]);

  // KPIs. Historical tiles are PERIOD-SCOPED (counts of events within the selected
  // range, derived from the period volume); "running" stays a live "now" count.
  const kpis = useMemo(() => {
    const c = trend.completed;
    return {
      needsAction: Math.round(c * 0.13), // needed your action during the period
      running: reviews.filter((r) => r.status === "running").length, // LIVE — now
      overdue: Math.round(c * 0.06), // went overdue during the period
      triage: Math.round(c * 0.05), // auto-rejected at intake during the period
    };
  }, [trend.completed, reviews]);

  return {
    isLoading: initial,
    period,
    setPeriod,
    range,
    setRange,
    kpis,
    completed: trend.completed,
    actionNeeded,
    recent,
    trend,
  };
}
