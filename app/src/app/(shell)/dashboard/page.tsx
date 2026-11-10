"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useDashboard } from "./hooks/useDashboard";
import "./dashboard.css";
import { PageHeader } from "@/components/templates/PageHeader";
import { PeriodPicker, PERIOD_LABEL, periodLabel, type Period } from "@/components/molecules";
import { useCurrentUser } from "@/lib/current-user";
import { useOrgStage, useSetupSummary } from "@/store";
import { ValueStrip, useShowValueStrip } from "@/components/organisms/value";
import {
  StatBar,
  type Stat,
  ActionNeeded,
  NewFromYouConnect,
  TrendChart,
  DashboardSkeleton,
} from "@/components/organisms";
import { DashboardFirstRun } from "@/components/organisms/dashboard-widgets";

const PERIOD_PHRASE: Record<Period, string> = {
  week: "this week",
  month: "this month",
  quarter: "this quarter",
  year: "this year",
  custom: "in this range",
};
/** The next wider period, offered as the way out of an empty chart. */
const WIDEN: Partial<Record<Period, Period>> = {
  week: "month",
  month: "quarter",
  quarter: "year",
  custom: "year",
};

export default function DashboardPage() {
  const me = useCurrentUser();
  const stage = useOrgStage();
  const { steps } = useSetupSummary();
  // Same rule as the Get started card: a brand-new org has not done anything yet.
  const returning = stage !== "new" || steps.some((s) => s.done);
  const {
    isLoading,
    isEmpty,
    reviews,
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

  const showValue = useShowValueStrip(reviews);

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
      icon: "parachute",
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
        title={`${returning ? "Welcome back" : "Welcome"}, ${me.firstName}`}
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
              {isEmpty ? (
                <DashboardFirstRun />
              ) : (
                <>
                  <StatBar stats={stats} />

                  {showValue && <ValueStrip reviews={reviews} />}

                  <div style={{ marginTop: "var(--d-gap)" }}>
                    <TrendChart
                      {...trend}
                      periodLabel={periodLabel(period, range)}
                      emptyText={`No reviews completed ${PERIOD_PHRASE[period]}.`}
                      widen={WIDEN[period] && {
                        label: `Show ${PERIOD_LABEL[WIDEN[period]!].toLowerCase()}`,
                        onClick: () => setPeriod(WIDEN[period]!),
                      }}
                    />
                  </div>

                  <div className="dash-grid">
                    <ActionNeeded reviews={actionNeeded} />
                    <NewFromYouConnect reviews={newFromYc} />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
