"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/molecules";
import { CREDIT_USD, formatUsd } from "@/lib/pricing";
import type { UserName } from "../billing-data";
import { UsageChart, type ChartUnit, type ChartView } from "./UsageChart";
import {
  PERIOD_OPTIONS,
  chartGroups,
  creditsOf,
  cumulative,
  comparableDelta,
  stackColumns,
  usdOf,
  windowFor,
  within,
  type UsageGroupBy,
  type UsageLine,
  type UsagePeriod,
} from "./usage-data";

export const BY_LABEL: Record<UsageGroupBy, string> = {
  type: "Review type",
  person: "Person",
  source: "Paid from",
};

const PREV_PHRASE: Record<UsagePeriod, string> = {
  "30d": "previous 30 days",
  "90d": "previous 13 weeks",
  "12m": "previous 12 months",
};
const SINCE_PHRASE: Record<UsagePeriod, string> = {
  "30d": "the last 30 days",
  "90d": "the last 13 weeks",
  "12m": "the last 12 months",
};

export const fmtCredits = (n: number) => `${Math.round(n * 10) / 10}`;
export const fmtUnit = (unit: ChartUnit, credits: number) =>
  unit === "usd"
    ? formatUsd(Math.round(credits * CREDIT_USD))
    : fmtCredits(credits);

/**
 * The usage chart card: summary number with its change, group / view / period controls, a legend that
 * doubles as a series toggle, then the chart. Controlled, so the breakdown table below can follow it.
 */
export function UsageCard({
  lines,
  anchor,
  userName,
  unit,
  period,
  onPeriod,
  by,
  onBy,
  view,
  onView,
  byOptions,
  title = "Credits used",
  scopeNote,
  compact = false,
  action,
}: {
  lines: readonly UsageLine[];
  anchor: number;
  userName: UserName;
  unit: ChartUnit;
  period: UsagePeriod;
  onPeriod: (p: UsagePeriod) => void;
  by: UsageGroupBy;
  onBy: (b: UsageGroupBy) => void;
  view: ChartView;
  onView: (v: ChartView) => void;
  byOptions: UsageGroupBy[];
  title?: string;
  scopeNote?: string;
  /** Overview version: period toggle only, shorter chart, and an optional trailing action. */
  compact?: boolean;
  action?: React.ReactNode;
}) {
  const [hiddenBy, setHiddenBy] = useState<Record<string, string[]>>({});
  const w = useMemo(() => windowFor(period, anchor), [period, anchor]);
  const inWin = useMemo(
    () => within(lines, w.from, w.to),
    [lines, w.from, w.to],
  );
  const prev = useMemo(
    () => within(lines, w.prevFrom, w.prevTo),
    [lines, w.prevFrom, w.prevTo],
  );
  const { groups, personKeys } = useMemo(
    () => chartGroups(by, inWin, userName),
    [by, inWin, userName],
  );
  const columns = useMemo(
    () => stackColumns(lines, w, by, groups, personKeys),
    [lines, w, by, groups, personKeys],
  );
  const cumulativeOn = view === "cumulative" && period === "30d";
  const cum = useMemo(
    () => (cumulativeOn ? cumulative(columns) : undefined),
    [cumulativeOn, columns],
  );

  const hidden = useMemo(() => new Set(hiddenBy[by] ?? []), [hiddenBy, by]);
  const toggle = (key: string) => {
    const visible = groups.filter((g) => !hidden.has(g.key));
    if (!hidden.has(key) && visible.length <= 1) return;
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setHiddenBy((s) => ({ ...s, [by]: [...next] }));
  };

  const total = creditsOf(inWin);
  const paid = usdOf(inWin);
  const delta = comparableDelta(lines, w, total, creditsOf(prev));
  const reviews = new Set(inWin.map((l) => l.reviewKey)).size;
  const groupTotals = groups.map((_, i) =>
    columns.reduce((sum, c) => sum + c.values[i], 0),
  );

  return (
    <section className={`card us-card${compact ? " is-compact" : ""}`}>
      <div className="us-head">
        <div>
          <h2 className="bl-h">{title}</h2>
          <p className="bl-sub">
            {scopeNote ??
              `Every review type is one credit${unit === "usd" ? ` (about ${formatUsd(CREDIT_USD)})` : ""}.`}
          </p>
        </div>
        <div className="us-ctrl">
          {!compact && byOptions.length > 1 && (
            <SegmentedControl<UsageGroupBy>
              label="Group usage by"
              value={by}
              onChange={onBy}
              options={byOptions.map((v) => ({ value: v, label: BY_LABEL[v] }))}
            />
          )}
          {!compact && period === "30d" && (
            <SegmentedControl<ChartView>
              label="Chart view"
              value={view}
              onChange={onView}
              options={[
                { value: "daily", label: "Daily" },
                { value: "cumulative", label: "Cumulative" },
              ]}
            />
          )}
          <SegmentedControl<UsagePeriod>
            label="Period"
            value={period}
            onChange={onPeriod}
            options={PERIOD_OPTIONS}
          />
          {action}
        </div>
      </div>

      {!compact && (
        <div className="us-sum">
          {cumulativeOn && cum ? (
            <>
              <span className="us-sum-n">{fmtUnit(unit, cum.total)}</span>
              <span className="us-sum-u">
                {unit === "usd" ? "so far" : "credits so far"} · on pace for
                about {fmtUnit(unit, cum.projectedEnd)} over the next 30 days
              </span>
            </>
          ) : (
            <>
              <span className="us-sum-n">
                {unit === "usd"
                  ? formatUsd(Math.round(total * CREDIT_USD))
                  : fmtCredits(total)}
              </span>
              <span className="us-sum-u">
                {unit === "usd"
                  ? ""
                  : `${total === 1 ? "credit" : "credits"} · `}
                {reviews} {reviews === 1 ? "review" : "reviews"}
                {unit === "credits" && paid > 0
                  ? ` · about ${formatUsd(paid)}`
                  : ""}{" "}
                in {SINCE_PHRASE[period]}
              </span>
              {delta.pct !== null && (
                <span className="us-delta">
                  {delta.pct > 0 ? "+" : delta.pct < 0 ? "−" : ""}
                  {Math.abs(delta.pct)}% vs {PREV_PHRASE[period]}
                </span>
              )}
              {delta.isNew && (
                <span className="us-delta">
                  New, nothing in the {PREV_PHRASE[period]}
                </span>
              )}
            </>
          )}
        </div>
      )}

      <div className="us-legend" role="group" aria-label="Series">
        {groups.map((g) => {
          const off = hidden.has(g.key);
          return (
            <button
              key={g.key}
              type="button"
              className={`us-leg${off ? " is-off" : ""}`}
              aria-pressed={!off}
              onClick={() => toggle(g.key)}
            >
              <i className={`us-sw us-t${g.tone}`} />
              {g.label}
              <b>{fmtUnit(unit, groupTotals[groups.indexOf(g)])}</b>
            </button>
          );
        })}
      </div>

      <UsageChart
        columns={columns}
        groups={groups}
        hidden={hidden}
        view={cumulativeOn ? "cumulative" : "daily"}
        cum={cum}
        period={period}
        unit={unit}
        compact={compact}
        ariaLabel={`${title}, ${SINCE_PHRASE[period]}, by ${BY_LABEL[by].toLowerCase()}`}
      />
    </section>
  );
}
