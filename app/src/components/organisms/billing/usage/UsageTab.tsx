"use client";

import { useMemo, useState } from "react";
import { CREDIT_USD, formatUsd } from "@/lib/pricing";
import { invoicedActivity } from "../billing-data";
import type { Billing } from "../useBilling";
import { BreakdownTable, BY_TITLE } from "./BreakdownTable";
import { LedgerSection } from "./LedgerSection";
import type { ChartView } from "./UsageChart";
import { UsageCard } from "./UsageCard";
import { buildUsageLines, creditsOf, reviewsOf, usageAnchor, within, DAY, type UsageGroupBy, type UsagePeriod } from "./usage-data";

/** Lines, "today" and the in-scope subset every usage view shares. */
export function useUsage(b: Billing, mineOnly: boolean) {
  const all = useMemo(() => buildUsageLines(b.ledger, b.reviews, !!b.invoiced), [b.ledger, b.reviews, b.invoiced]);
  const anchor = useMemo(() => usageAnchor(all, b.ledger), [all, b.ledger]);
  const lines = useMemo(() => (mineOnly ? all.filter((l) => l.personId === b.me.id) : all), [all, mineOnly, b.me.id]);
  return { all, lines, anchor };
}

/**
 * Usage: the chart, the breakdown and every credit movement. Admins see everything; reviewers and
 * approvers see their own usage (read-only). Invoiced orgs read in dollars and get a header strip.
 */
export function UsageTab({ b, invoiced }: { b: Billing; invoiced: boolean }) {
  const mine = !b.isAdmin;
  const { lines, anchor } = useUsage(b, mine);
  const [period, setPeriod] = useState<UsagePeriod>("30d");
  const [by, setBy] = useState<UsageGroupBy>("type");
  const [view, setView] = useState<ChartView>("daily");

  const unit = invoiced && b.isAdmin ? "usd" : "credits";
  const byOptions: UsageGroupBy[] = mine ? ["type"] : invoiced ? ["type", "person"] : ["type", "person", "source"];

  const rows = useMemo(() => {
    if (invoiced) return invoicedActivity(b.reviews, b.userName);
    const all = b.rows;
    if (!mine) return all;
    return all.filter((r) => r.byId === b.me.id && (r.kind === "debit" || r.kind === "rescan" || r.kind === "refund"));
  }, [invoiced, mine, b.rows, b.reviews, b.userName, b.me.id]);

  const people = useMemo(() => {
    const ids = [...new Set(rows.map((r) => r.byId).filter((x): x is string => !!x))];
    return ids.map((id) => ({ id, name: b.userName(id) ?? "Unknown" })).sort((a, c) => a.name.localeCompare(c.name));
  }, [rows, b]);

  return (
    <div className="us bl-stack">
      {invoiced && <InvoicedStrip b={b} showAmounts={b.isAdmin} />}
      <UsageCard
        lines={lines}
        anchor={anchor}
        userName={b.userName}
        unit={unit}
        period={period}
        onPeriod={setPeriod}
        by={by}
        onBy={setBy}
        view={view}
        onView={setView}
        byOptions={byOptions}
        title={mine ? "Your credits used" : unit === "usd" ? "Usage" : "Credits used"}
        scopeNote={mine ? "Reviews you ran. The balance belongs to the whole organization." : undefined}
      />
      <div className="bl-row bl-sechead us-sechead">
        <h2 className="bl-section">{mine ? "Your usage by review type" : BY_TITLE[by]}</h2>
      </div>
      <BreakdownTable lines={lines} anchor={anchor} period={period} by={mine ? "type" : by} unit={unit} userName={b.userName} showCost={b.isAdmin} />
      <LedgerSection
        rows={rows}
        showAmounts={b.isAdmin}
        showSource={!invoiced}
        showCredits={!(invoiced && b.isAdmin)}
        filters={mine ? ["all", "reviews", "refunds"] : invoiced ? ["all"] : ["all", "reviews", "topups", "refunds", "rewards"]}
        people={b.isAdmin ? people : undefined}
        onReceipt={invoiced ? undefined : b.openReceipt}
        title={mine ? "Every review you ran" : invoiced ? "Every review run" : "Every credit movement"}
        filename={invoiced ? "parachute-usage.csv" : "parachute-credit-activity.csv"}
      />
    </div>
  );
}

/** Invoiced header strip: this month, the next invoice estimate, and what a review costs on average. */
function InvoicedStrip({ b, showAmounts }: { b: Billing; showAmounts: boolean }) {
  const { lines, anchor } = useUsage(b, false);
  const monthStart = new Date(new Date(anchor - 1).getFullYear(), new Date(anchor - 1).getMonth(), 1).getTime();
  const month = within(lines, monthStart, anchor);
  const credits = creditsOf(month);
  const reviews = reviewsOf(month);
  const email = b.settings?.billingEmail ?? "your billing contact";
  const monthName = new Date(monthStart).toLocaleDateString("en-GB", { month: "long" });
  // Net 30 after the month closes.
  const monthEnd = new Date(new Date(anchor - 1).getFullYear(), new Date(anchor - 1).getMonth() + 1, 0).getTime();
  const due = new Date(monthEnd + 30 * DAY).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <div className="us-strip">
      <section className="card bl-card">
        <h2 className="bl-h">{monthName} so far</h2>
        <div className="bl-big">
          <span className="bl-big-n">{reviews}</span>
          <span className="bl-big-u">{reviews === 1 ? "review" : "reviews"}</span>
        </div>
        <p className="bl-note">
          {credits} review {credits === 1 ? "type" : "types"}
          {showAmounts ? `, ${formatUsd(credits * CREDIT_USD)} at list value` : ""}
        </p>
      </section>
      <section className="card bl-card">
        <h2 className="bl-h">Next invoice</h2>
        <div className="bl-big">
          <span className="bl-big-n">{showAmounts ? formatUsd(credits * CREDIT_USD) : "–"}</span>
          <span className="bl-big-u">estimate</span>
        </div>
        <p className="bl-note">
          Closes at the end of {monthName}, due {due}. Sent to {email}.
        </p>
      </section>
      <section className="card bl-card">
        <h2 className="bl-h">Average per review</h2>
        <div className="bl-big">
          <span className="bl-big-n">{reviews ? (credits / reviews).toFixed(1) : "0"}</span>
          <span className="bl-big-u">review types{showAmounts && reviews ? `, about ${formatUsd(Math.round((credits / reviews) * CREDIT_USD))}` : ""}</span>
        </div>
        <p className="bl-note">Technical and administrative reviews are billed separately.</p>
      </section>
    </div>
  );
}
