"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useDashboard } from "./hooks/useDashboard";
import "./dashboard.css";
import { PageHeader } from "@/components/templates/PageHeader";
import {
  PeriodPicker,
  PERIOD_LABEL,
  periodLabel,
  type Period,
} from "@/components/molecules";
import { useCurrentUser } from "@/lib/current-user";
import { useOrgStage, useOrgStore, useSetupSummary, useWalletStore } from "@/store";
import { deriveValue } from "@/components/organisms/value/value-model";
import { TrendChart, DashboardSkeleton } from "@/components/organisms";
import { useMemo, useState } from "react";
import { DashboardSections } from "./DashboardSections";
import { FirstRunHero } from "@/components/organisms/FirstRunHero";

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
    isResolved,
    isEmpty,
    reviews,
    period,
    setPeriod,
    range,
    setRange,
    trend,
    insights,
  } = useDashboard();

  const ledger = useWalletStore((s) => s.ledger);
  const billing = useOrgStore((s) => s.org?.billing);
  const [now] = useState(() => Date.now());
  const isAdmin = me.role === "org_admin";
  // Spend belongs to the admin lens only (Billing owns the detail).
  const spend = useMemo(() => {
    if (!isAdmin) return null;
    const v = deriveValue(reviews, ledger, billing === "invoiced", now);
    return { usd: v.spendUsd, credits: v.spendCredits };
  }, [isAdmin, reviews, ledger, billing, now]);

  // Level 1 (no reviews of the org's own yet): just the hero, no header strip, no skeleton.
  // Until the first read lands we don't know which page is coming, so render nothing.
  if (!isResolved) return null;
  if (isEmpty) {
    return (
      <div className="pagebody">
        <FirstRunHero
          title="Your dashboard fills in after your first review"
          tiles={[
            {
              title: "What needs you",
              text: "Reviews waiting on your decision, anything overdue, and new appraisals from YouConnect.",
              ill: "07b-finding-citation",
            },
            {
              title: "What Parachute did",
              text: "Reviews completed, hours saved, calculations the engine corrected and issues it caught.",
              ill: "05b-empty-reviews",
            },
            {
              title: "What your appraisals tell you",
              text: "Where issues show up, how each appraisal firm's reports hold up, and portfolio risk.",
              ill: "06b-first-upload",
            },
          ]}
        >
          What needs you, the value Parachute adds and what your appraisals
          are telling you show up here once Parachute has checked an appraisal.
        </FirstRunHero>
      </div>
    );
  }

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
              <DashboardSections
                role={me.role}
                insights={insights}
                periodText={periodLabel(period, range)}
                spend={spend}
                trend={
                  <TrendChart
                    {...trend}
                    periodLabel={periodLabel(period, range)}
                    emptyText={`No reviews completed ${PERIOD_PHRASE[period]}.`}
                    widen={
                      WIDEN[period] && {
                        label: `Show ${PERIOD_LABEL[WIDEN[period]!].toLowerCase()}`,
                        onClick: () => setPeriod(WIDEN[period]!),
                      }
                    }
                  />
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
