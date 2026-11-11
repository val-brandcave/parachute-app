"use client";

import { useMemo, useState } from "react";
import { Select } from "@realwired/ui";
import { Button } from "@/components/atoms";
import { EmptyState, GhostBars } from "@/components/molecules";
import { INVOICED_CREDIT_USD as CREDIT_USD, costFor, formatUsd } from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { invoicedSpendEntries, usageByPerson, usageByType, type UsagePeriod as UsageSpan } from "@/lib/wallet-view";
import { useApprovalPending } from "@/store";
import type { CreditLedgerEntry } from "@/types";
import { downloadText, invoicedActivity } from "../billing-data";
import type { Billing } from "../useBilling";
import { LedgerSection } from "./LedgerSection";
import { UsageByPerson } from "./UsageByPerson";
import { UsageDonut } from "./UsageDonut";
import { buildUsageLines, usageAnchor, DAY } from "./usage-data";

/** Lines, "today" and the in-scope subset every usage view shares. */
export function useUsage(b: Billing, mineOnly: boolean) {
  const all = useMemo(() => buildUsageLines(b.ledger), [b.ledger]);
  const anchor = useMemo(() => usageAnchor(all, b.ledger), [all, b.ledger]);
  const lines = useMemo(() => (mineOnly ? all.filter((l) => l.personId === b.me.id) : all), [all, mineOnly, b.me.id]);
  return { all, lines, anchor };
}

const monthStart = (ts: number) => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
};
const nextMonth = (start: number) => {
  const d = new Date(start);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
};
const fmtMonth = (start: number, o: Intl.DateTimeFormatOptions) => new Date(start).toLocaleDateString("en-US", o);
const fmtDay = (ts: number) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** A reviewer's own spend (and the refunds of it), so "My usage" nets out like the org's. */
function mineOnlyLedger(ledger: readonly CreditLedgerEntry[], me: string): CreditLedgerEntry[] {
  const mine = ledger.filter((e) => (e.kind === "debit" || e.kind === "rescan") && e.actorId === me);
  const keys = new Set(mine.flatMap((e) => [e.reviewId, e.loanNo].filter(Boolean)));
  const refunds = ledger.filter((e) => e.kind === "refund" && (keys.has(e.reviewId) || keys.has(e.loanNo)));
  return [...mine, ...refunds];
}

/**
 * Usage (PC-28, PC-34): filter row, the "Credits used" donut and "By person" list for one month, then
 * every credit movement. Admins see everything; reviewers and approvers see their own usage (read-only).
 * Invoiced orgs read the same cards under a header strip.
 */
export function UsageTab({ b, invoiced }: { b: Billing; invoiced: boolean }) {
  const mine = !b.isAdmin;
  
  const rows = useMemo(() => {
    if (invoiced) return invoicedActivity(b.reviews, b.userName, b.now);
    const all = b.rows;
    if (!mine) return all;
    return all.filter((r) => r.byId === b.me.id && (r.kind === "debit" || r.kind === "rescan" || r.kind === "refund"));
  }, [invoiced, mine, b.rows, b.reviews, b.userName, b.me.id, b.now]);

  const people = useMemo(() => {
    const ids = [...new Set(rows.map((r) => r.byId).filter((x): x is string => !!x))];
    return ids.map((id) => ({ id, name: b.userName(id) ?? "Unknown" })).sort((a, c) => a.name.localeCompare(c.name));
  }, [rows, b]);

  // The ledger the donut and the list both read: one derivation, one period.
  const source = useMemo(() => {
    const base = invoiced ? invoicedSpendEntries(b.reviews, b.now) : b.ledger;
    return mine ? mineOnlyLedger(base, b.me.id) : base;
  }, [invoiced, mine, b.reviews, b.now, b.ledger, b.me.id]);

  const current = monthStart(b.now);
  const months = useMemo(() => {
    const set = new Set<number>([current]);
    for (const e of source) if (e.kind === "debit" || e.kind === "rescan") set.add(monthStart(e.createdAt));
    return [...set].sort((a, c) => c - a).slice(0, 12);
  }, [source, current]);
  const [picked, setPicked] = useState<number | null>(null);
  const month = picked !== null && months.includes(picked) ? picked : current;
  const span: UsageSpan = useMemo(() => ({ from: month, to: nextMonth(month) }), [month]);
  const usage = useMemo(() => usageByType(source, span), [source, span]);
  const byPerson = useMemo(() => usageByPerson(source, span), [source, span]);

  const monthName = fmtMonth(month, { month: "long" });
  const lastDay = month === current ? Math.min(b.now, span.to - DAY) : span.to - DAY;
  const range = `${fmtDay(month)} to ${fmtDay(lastDay)}`;

  const exportCsv = () => {
    const out = ["Review type,Credits", `Technical,${usage.technical}`, `Administrative,${usage.administrative}`, `Total,${usage.total}`, "", "Person,Credits"];
    for (const r of byPerson) out.push(`"${(b.userName(r.userId) ?? "Unknown").replace(/"/g, '""')}",${r.credits}`);
    downloadText(`parachute-usage-${fmtMonth(month, { year: "numeric", month: "2-digit" }).replace("/", "-")}.csv`, out.join("\n"));
  };

  const pending = useApprovalPending();

  // Level 1: nothing has ever moved (for reviewers, nothing of theirs). One block, no controls.
  if (rows.length === 0 && source.length === 0) {
    const n = costFor(FULL_REVIEW_TYPES);
    return (
      <div className="us bl-stack">
        <EmptyState
          title={mine ? "Your usage starts with your first review" : "Usage starts with your first review"}
          preview={<GhostBars />}
          status={
            pending && b.isAdmin ? (
              <>
                <b>{b.org?.name ?? "Your organization"} is waiting for approval.</b> Reviews open once it is approved.
              </>
            ) : undefined
          }
        >
          {mine
            ? `A full review uses ${n} credits. Here you will see the reviews you ran and the credits each one used.`
            : invoiced
              ? "Every review you run is listed here by review type and by person, ready to export."
              : `A full review uses ${n} credits. You will see credits by review type and by person, plus every top-up, refund and reward, ready to export.`}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="us bl-stack">
      {invoiced && <InvoicedStrip b={b} source={source} mine={mine} showAmounts={b.isAdmin} />}
      <div className="ud-filter">
        <label className="ud-filter-l" htmlFor="ud-period">
          Period
        </label>
        <Select id="ud-period" size="sm" className="ud-period" value={String(month)} onChange={(e) => setPicked(Number(e.target.value))}>
          {months.map((m) => (
            <option key={m} value={String(m)}>
              {fmtMonth(m, { month: "long", year: "numeric" })}
            </option>
          ))}
        </Select>
        <span className="ud-filter-sp" />
        <Button variant="outline" size="sm" iconLeft="download" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>
      <div className={mine ? "ud-grid ud-grid--one" : "ud-grid"}>
        <UsageDonut usage={usage} monthName={monthName} rangeLabel={range} />
        {!mine && <UsageByPerson rows={byPerson} name={b.userName} />}
      </div>
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
        showExport={false}
      />
    </div>
  );
}

/** Invoiced header strip: this month, the next invoice estimate, and what a review costs on average. Reads the one derivation. */
function InvoicedStrip({
  b,
  source,
  mine,
  showAmounts,
}: {
  b: Billing;
  source: readonly CreditLedgerEntry[];
  /** `source` is already narrowed to the viewer's own runs: credits must come from it too. */
  mine: boolean;
  showAmounts: boolean;
}) {
  const start = monthStart(b.now);
  // One scope for both numbers: the viewer's own runs (reviewer) or the whole org (wallet view).
  const credits = mine ? usageByType(source, { from: start, to: nextMonth(start) }).total : b.wallet.usedThisMonth;
  const reviews = source.filter((e) => (e.kind === "debit" || e.kind === "rescan") && e.createdAt >= start && e.createdAt < nextMonth(start)).length;
  const email = b.settings?.billingEmail ?? "your billing contact";
  const monthName = fmtMonth(start, { month: "long" });
  // Net 30 after the month closes.
  const monthEnd = nextMonth(start) - DAY;
  const due = new Date(monthEnd + 30 * DAY).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
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
          <span className="bl-big-u">
            review types
            {showAmounts && reviews ? `, about ${formatUsd(Math.round((credits / reviews) * CREDIT_USD))}` : ""}
          </span>
        </div>
        <p className="bl-note">Technical and administrative reviews are billed separately.</p>
      </section>
    </div>
  );
}
