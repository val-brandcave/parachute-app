"use client";

import { Fragment } from "react";
import { formatUsd } from "@/lib/pricing";
import { monthTitle, type Statement } from "./billing-data";

/** The statement as white paper (white in dark mode too). Print-friendly. */
export function StatementPaper({
  orgName,
  orgInitials,
  place,
  monthKey,
  s,
  invoiced,
  billTo,
}: {
  orgName: string;
  orgInitials: string;
  place?: string;
  monthKey: string;
  s: Statement;
  invoiced?: boolean;
  /** PO number, tax ID and billing address from Billing settings. */
  billTo?: { po?: string; taxId?: string; address?: string };
}) {
  const range = `${new Date(s.monthStart).getDate()}-${new Date(s.monthEnd).getDate()} ${new Date(s.monthStart).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  return (
    <article className="bl-paper" aria-label={`Statement ${monthTitle(monthKey)}`}>
      <header className="bl-paper-head">
        <div className="bl-paper-org">
          <span className="bl-paper-logo">{orgInitials}</span>
          <div>
            <div className="bl-paper-name">{orgName}</div>
            {place && <div className="bl-paper-place">{place}</div>}
          </div>
        </div>
        <div className="bl-paper-period">
          <span>Statement</span>
          <strong>{range}</strong>
        </div>
      </header>

      {billTo && (billTo.po || billTo.taxId || billTo.address) && (
        <dl className="bl-paper-billto">
          {billTo.address && (
            <div>
              <dt>Bill to</dt>
              <dd>{billTo.address}</dd>
            </div>
          )}
          {billTo.po && (
            <div>
              <dt>PO number</dt>
              <dd>{billTo.po}</dd>
            </div>
          )}
          {billTo.taxId && (
            <div>
              <dt>Tax ID</dt>
              <dd>{billTo.taxId}</dd>
            </div>
          )}
        </dl>
      )}

      <table className="bl-paper-table">
        <thead>
          <tr>
            <th>Review</th>
            <th>Run by</th>
            <th>Paid from</th>
            <th className="bl-num">Credits</th>
            <th className="bl-num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {s.groups.length === 0 && (
            <tr>
              <td colSpan={5} className="bl-paper-empty">
                No reviews were run in {monthTitle(monthKey)}.
              </td>
            </tr>
          )}
          {s.groups.map((g) => (
            <Fragment key={g.key}>
              <tr className="bl-paper-group">
                <td colSpan={5}>
                  <strong>{g.loan}</strong> · {g.address}
                  {g.kind ? ` · ${g.kind}` : ""}
                </td>
              </tr>
              {g.lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.type}</td>
                  <td>{l.by}</td>
                  <td>{l.paidFrom}</td>
                  <td className="bl-num">{l.credits}</td>
                  <td className="bl-num">{l.amountUsd === 0 ? "$0" : `~${formatUsd(l.amountUsd)}`}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>

      <div className="bl-paper-totals">
        <div>
          <span>{invoiced ? "Review types" : "Credits used"}</span>
          <strong>{invoiced ? s.reviewTypes : s.creditsUsed}</strong>
        </div>
        <div>
          <span>{invoiced ? "Billed" : "Charged"}</span>
          <strong>{s.chargedUsd === 0 ? "$0" : `~${formatUsd(s.chargedUsd)}`}</strong>
        </div>
        {!invoiced && (
          <div>
            <span>Free runs</span>
            <strong>
              {s.freeRuns} <em>at $0</em>
            </strong>
          </div>
        )}
      </div>
      <p className="bl-paper-foot">
        {invoiced ? "Billed monthly through Realwired against invoice INV-2026-11." : "Free runs shown at $0 so they are never passed on to a borrower."}
      </p>
      <footer className="bl-paper-page">
        <span>
          {orgName} · Statement · {range}
        </span>
        <span>Page 1 of 1</span>
      </footer>
    </article>
  );
}
