"use client";

import { motion } from "framer-motion";
import { useDashboard } from "./hooks/useDashboard";
import { PageHeader } from "@/components/templates/PageHeader";
import { PeriodPicker, PERIOD_LABEL, periodLabel } from "@/components/molecules";
import { CURRENT_USER } from "@/lib/current-user";
import {
  StatBar,
  type Stat,
  ActionNeeded,
  RecentReviews,
  TrendChart,
} from "@/components/organisms";

export default function DashboardPage() {
  const {
    period,
    setPeriod,
    range,
    setRange,
    kpis,
    completed,
    actionNeeded,
    recent,
    trend,
  } = useDashboard();

  const stats: Stat[] = [
    {
      label: "Needs my action",
      value: kpis.needsAction,
      icon: "flag",
      tone: "flag",
      tip: "Reviews assigned to you that are waiting on a decision or sign-off.",
    },
    {
      label: "Pipeline running",
      value: kpis.running,
      icon: "ai",
      tone: "accent",
      tip: "Appraisals currently being processed by Parachute's analysis pipeline.",
    },
    {
      label: "Overdue",
      value: kpis.overdue,
      icon: "warn",
      tone: "fail",
      tip: "Reviews past their SLA due date and not yet completed.",
    },
    {
      label: "Intake triage",
      value: kpis.triage,
      icon: "checklist",
      tone: "info",
      tip: "Appraisals auto-rejected at intake that need your confirm or override.",
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
      tone: "pass",
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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <StatBar stats={stats} />
        </motion.div>

        <div className="dash-grid">
          <ActionNeeded reviews={actionNeeded} />
          <RecentReviews reviews={recent} />
        </div>

        <div style={{ marginTop: "var(--d-gap)" }}>
          <TrendChart data={trend} periodLabel={periodLabel(period, range)} />
        </div>
      </div>
    </>
  );
}
