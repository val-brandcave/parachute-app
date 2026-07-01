"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useDashboard } from "./hooks/useDashboard";
import { PageHeader } from "@/components/templates/PageHeader";
import { PeriodPicker, PERIOD_LABEL, periodLabel } from "@/components/molecules";
import { CURRENT_USER } from "@/lib/current-user";
import {
  StatBar,
  type Stat,
  ActionNeeded,
  NewFromYouConnect,
  TrendChart,
  DashboardSkeleton,
} from "@/components/organisms";

export default function DashboardPage() {
  const {
    isLoading,
    period,
    setPeriod,
    range,
    setRange,
    kpis,
    completed,
    actionNeeded,
    newFromYc,
    trend,
  } = useDashboard();

  const stats: Stat[] = [
    // Lifecycle order: intake → processing → review → SLA → done.
    {
      label: "Intake",
      value: kpis.intake,
      icon: "connect",
      tip: "New appraisals delivered from YouConnect, waiting to be ordered — a current backlog, not affected by the period picker.",
    },
    {
      label: "Pipeline running",
      value: kpis.running,
      icon: "rocket",
      live: true,
      tip: "Appraisals being processed by Parachute's pipeline right now — a live count, not affected by the period picker.",
    },
    {
      label: "Needs my action",
      value: kpis.needsAction,
      icon: "flag",
      tip: "Reviews that needed your decision or sign-off within the selected period.",
    },
    {
      label: "Overdue",
      value: kpis.overdue,
      icon: "warn",
      alert: kpis.overdue > 0,
      tip: "Reviews that went past their SLA due date within the selected period.",
    },
    {
      label: "Completed",
      value: (
        <>
          {completed}{" "}
          <small>
            {period === "custom"
              ? "in range"
              : PERIOD_LABEL[period].toLowerCase()}
          </small>
        </>
      ),
      icon: "check-all",
      tip: "Reviews you completed in the selected period. Avg turnaround ~24 min · ≈9.5 hrs saved vs. manual review.",
    },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${CURRENT_USER.firstName}`}
        actions={
          <PeriodPicker
            value={period}
            onChange={setPeriod}
            range={range}
            onRangeChange={setRange}
          />
        }
      />

      <div className="pagebody">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DashboardSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
            >
              <StatBar stats={stats} />

              <div style={{ marginTop: "var(--d-gap)" }}>
                <TrendChart {...trend} periodLabel={periodLabel(period, range)} />
              </div>

              <div className="dash-grid">
                <ActionNeeded reviews={actionNeeded} />
                <NewFromYouConnect reviews={newFromYc} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
