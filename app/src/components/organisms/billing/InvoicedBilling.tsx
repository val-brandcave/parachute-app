"use client";

import { Icon } from "@/components/atoms";
import { formatUsd } from "@/lib/pricing";
import { dateLabel, invoicedReviews, rebasedDate, shortName, typesLabel } from "./billing-data";
import { REVIEW_TYPE_COST, CREDIT_USD } from "@/lib/pricing";
import type { Billing } from "./useBilling";

/** E5: no wallet. What was run this month, billed through Realwired. */
export function InvoicedBilling({ b, tab, showAmounts }: { b: Billing; tab: "usage" | "invoices"; showAmounts: boolean }) {
  const list = invoicedReviews(b.reviews);
  const tech = list.filter((r) => r.reviewTypes.includes("technical")).length;
  const admin = list.filter((r) => r.reviewTypes.includes("administrative")).length;
  const typeCount = list.reduce((n, r) => n + r.reviewTypes.length, 0);
  const amountOf = (types: readonly (keyof typeof REVIEW_TYPE_COST)[]) => types.reduce((n, t) => n + (REVIEW_TYPE_COST[t] ?? 0), 0) * CREDIT_USD;
  const total = list.reduce((n, r) => n + amountOf(r.reviewTypes), 0);
  const shown = list.slice(0, 6);
  const email = b.settings?.billingEmail ?? "accounts@example.com";

  if (tab === "invoices") {
    return (
      <div className="card bl-table">
        <div className="bl-cols bl-cols--inv bl-thead">
          <span>Invoice</span>
          <span>Period</span>
          <span>Status</span>
          <span className="bl-num">Amount</span>
        </div>
        {[
          { id: "INV-2026-11", period: "November 2026", status: "Due 5 Dec", amount: total },
          { id: "INV-2026-10", period: "October 2026", status: "Paid", amount: Math.round(total * 0.9) },
          { id: "INV-2026-09", period: "September 2026", status: "Paid", amount: Math.round(total * 0.82) },
        ].map((i) => (
          <div key={i.id} className="bl-cols bl-cols--inv bl-trow">
            <span className="bl-what-t">{i.id}</span>
            <span>{i.period}</span>
            <span>
              <span className={`su-pill su-pill--sm${i.status === "Paid" ? " su-pill--earn" : " su-pill--doing"}`}>{i.status}</span>
            </span>
            <span className="bl-num">{showAmounts ? formatUsd(i.amount) : "—"}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bl-stack">
      <div className="bl-three">
        <section className="card bl-card">
          <h2 className="bl-h">Usage this month</h2>
          <div className="bl-big">
            <span className="bl-big-n">{list.length}</span>
            <span className="bl-big-u">reviews</span>
          </div>
          <div className="bl-tags">
            <span className="su-pill">Technical {tech}</span>
            <span className="su-pill">Administrative {admin}</span>
          </div>
          <p className="bl-note">Billed monthly through Realwired</p>
        </section>
        <section className="card bl-card">
          <h2 className="bl-h">Next invoice</h2>
          <p className="bl-big-n bl-inv">INV-2026-11</p>
          <div className="bl-tags">
            <span className="su-pill su-pill--doing">Due 5 Dec</span>
          </div>
          <p className="bl-note">Sent to {email}</p>
        </section>
        <section className="card bl-card">
          <h2 className="bl-h">Billing</h2>
          <div className="bl-method">
            <Icon name="bank" size={18} />
            <span className="bl-method-n">
              <strong>Invoiced · ACH</strong>
              <span className="bl-what-s">Paid by transfer against each invoice</span>
            </span>
          </div>
          <p className="bl-note">No prepaid wallet. Usage is billed, not bought in advance.</p>
        </section>
      </div>

      <h2 className="bl-section">Activity</h2>
      <div className="card bl-table" role="table" aria-label="Usage by review">
        <div className={`bl-cols bl-cols--usage${showAmounts ? "" : " bl-cols--usage-noamt"} bl-thead`}>
          <span>Date</span>
          <span>Report</span>
          <span>Loan / reference</span>
          <span>Review types</span>
          {showAmounts && <span className="bl-num">Amount</span>}
          <span>By</span>
        </div>
        {shown.map((r) => (
          <div key={r.id} className={`bl-cols bl-cols--usage${showAmounts ? "" : " bl-cols--usage-noamt"} bl-trow`}>
            <span className="bl-date">{dateLabel(rebasedDate(r, list))}</span>
            <span className="bl-what">
              <span className="bl-what-t">{r.propertyAddress}</span>
              <span className="bl-what-s">{r.propertyType}</span>
            </span>
            <span className="bl-loan">{r.loanNo}</span>
            <span>{typesLabel(r.reviewTypes)}</span>
            {showAmounts && <span className="bl-num">{formatUsd(amountOf(r.reviewTypes))}</span>}
            <span>{shortName(b.userName(r.assigneeId))}</span>
          </div>
        ))}
        <div className="bl-tfoot bl-tfoot--split">
          <span>
            Showing {shown.length} of {list.length} reviews this month. The statement lists all of them.
          </span>
          {showAmounts && (
            <strong>
              Total · {list.length} reviews · {typeCount} review types · {formatUsd(total)}
            </strong>
          )}
        </div>
      </div>
    </div>
  );
}
