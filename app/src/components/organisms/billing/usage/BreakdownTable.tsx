"use client";

import { useMemo } from "react";
import { CreditChip } from "@/components/atoms";
import { CREDIT_USD, formatUsd } from "@/lib/pricing";
import type { UserName } from "../billing-data";
import type { ChartUnit } from "./UsageChart";
import { fmtCredits } from "./UsageCard";
import {
  creditsOf,
  comparableDelta,
  keyOf,
  reviewsOf,
  tableGroups,
  usdOf,
  windowFor,
  within,
  type UsageGroupBy,
  type UsageLine,
  type UsagePeriod,
} from "./usage-data";

export const BY_TITLE: Record<UsageGroupBy, string> = {
  type: "By review type",
  person: "By person",
  source: "By where credits came from",
};

/** "By {grouping}": reviews, credits, share, cost and change against the previous period. */
export function BreakdownTable({
  lines,
  anchor,
  period,
  by,
  unit,
  userName,
  showCost,
}: {
  lines: readonly UsageLine[];
  anchor: number;
  period: UsagePeriod;
  by: UsageGroupBy;
  unit: ChartUnit;
  userName: UserName;
  /** Dollars are for admins only. */
  showCost: boolean;
}) {
  const rows = useMemo(() => {
    const w = windowFor(period, anchor);
    const cur = within(lines, w.from, w.to);
    const prev = within(lines, w.prevFrom, w.prevTo);
    const total = creditsOf(cur);
    return tableGroups(by, cur, prev, userName)
      .map((g) => {
        const c = cur.filter((l) => keyOf(by, l) === g.key);
        const p = prev.filter((l) => keyOf(by, l) === g.key);
        const credits = creditsOf(c);
        return {
          ...g,
          credits,
          reviews: reviewsOf(c),
          paid: usdOf(c),
          share: total ? credits / total : 0,
          delta: comparableDelta(lines, w, credits, creditsOf(p)),
          prevCredits: creditsOf(p),
        };
      })
      .filter((r) => r.credits > 0 || r.prevCredits > 0)
      .sort((a, b) => (by === "person" ? b.credits - a.credits : 0));
  }, [lines, anchor, period, by, userName]);

  const totals = useMemo(() => {
    const w = windowFor(period, anchor);
    const cur = within(lines, w.from, w.to);
    return { credits: creditsOf(cur), reviews: reviewsOf(cur), paid: usdOf(cur) };
  }, [lines, anchor, period]);

  const showCredits = unit === "credits";
  const tpl = ["minmax(180px, 2fr)", "80px", showCredits && "90px", "minmax(120px, 1.4fr)", showCost && "100px", "110px"].filter(Boolean).join(" ");
  const style = { gridTemplateColumns: tpl };
  const cost = (credits: number, paid: number) =>
    paid > 0 ? formatUsd(paid) : credits > 0 ? <span className="us-free">Free</span> : <span className="us-muted">&ndash;</span>;

  return (
    <div className="card bl-table" role="table" aria-label={BY_TITLE[by]}>
      <div className="us-by-cols bl-thead" style={style} role="row">
        <span role="columnheader">{by === "type" ? "Review type" : by === "person" ? "Person" : "Paid from"}</span>
        <span role="columnheader" className="bl-num">Reviews</span>
        {showCredits && <span role="columnheader" className="bl-num">Credits</span>}
        <span role="columnheader">Share</span>
        {showCost && <span role="columnheader" className="bl-num">{unit === "usd" ? "Amount" : "Cost"}</span>}
        <span role="columnheader" className="bl-num">vs previous</span>
      </div>
      {rows.length === 0 && (
        <div className="bl-empty">
          <p>No usage in this period.</p>
        </div>
      )}
      {rows.map((r) => (
        <div key={r.key} className="us-by-cols bl-trow" style={style} role="row">
          <span role="cell" className="us-name">
            <i className={`us-sw us-t${r.tone}`} />
            <span>{r.label}</span>
          </span>
          <span role="cell" className="bl-num">{r.reviews}</span>
          {showCredits && <span role="cell" className="bl-num">{fmtCredits(r.credits)}</span>}
          <span role="cell" className="us-share">
            <span className="us-share-bar">
              <i className={`us-t${r.tone}`} style={{ width: `${Math.round(r.share * 100)}%` }} />
            </span>
            <span className="us-share-n">{Math.round(r.share * 100)}%</span>
          </span>
          {showCost && (
            <span role="cell" className="bl-num">
              {unit === "usd" ? formatUsd(Math.round(r.credits * CREDIT_USD)) : cost(r.credits, r.paid)}
            </span>
          )}
          <span role="cell" className="us-chg">
            {r.delta.isNew ? (
              <CreditChip tone="credit" size="sm">New</CreditChip>
            ) : r.delta.pct === null ? (
              <span className="us-muted">&ndash;</span>
            ) : (
              `${r.delta.pct > 0 ? "+" : r.delta.pct < 0 ? "−" : ""}${Math.abs(r.delta.pct)}%`
            )}
          </span>
        </div>
      ))}
      <div className="us-by-cols bl-tfoot bl-tfoot--split" style={{ ...style, display: "grid", alignItems: "center", columnGap: 20 }}>
        <span><b>Total</b></span>
        <span className="bl-num">{totals.reviews}</span>
        {showCredits && <span className="bl-num">{fmtCredits(totals.credits)}</span>}
        <span />
        {showCost && (
          <span className="bl-num">{unit === "usd" ? formatUsd(Math.round(totals.credits * CREDIT_USD)) : cost(totals.credits, totals.paid)}</span>
        )}
        <span />
      </div>
    </div>
  );
}
