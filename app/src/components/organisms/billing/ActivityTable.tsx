"use client";

import { Button } from "@/components/atoms";
import { formatUsd } from "@/lib/pricing";
import { dateLabel, signed, type ActivityRow } from "./billing-data";

const TONE: Record<ActivityRow["from"][number]["tone"], string> = {
  buy: "bl-chip bl-chip--buy",
  trial: "bl-chip bl-chip--trial",
  earn: "bl-chip bl-chip--earn",
  card: "bl-chip bl-chip--card",
  refund: "bl-chip bl-chip--refund",
};

/**
 * The credit ledger as a table. `showAmounts` is off for non-admins (credits only). `showSource` hides the
 * "Paid from" column and `showCredits` the credits column (invoiced orgs read in dollars).
 */
export function ActivityTable({
  rows,
  showAmounts = true,
  showSource = true,
  showCredits = true,
  limit,
  onReceipt,
  footer,
  label = "Credit activity",
}: {
  rows: ActivityRow[];
  showAmounts?: boolean;
  showSource?: boolean;
  showCredits?: boolean;
  limit?: number;
  onReceipt?: (receiptId: string) => void;
  footer?: React.ReactNode;
  label?: string;
}) {
  const shown = limit ? rows.slice(0, limit) : rows;
  const tpl = [
    "52px",
    "minmax(220px, 2.4fr)",
    "118px",
    "140px",
    showCredits && "60px",
    showAmounts && "92px",
    showSource && "108px",
    "104px",
    showAmounts && onReceipt ? "108px" : "8px",
  ]
    .filter(Boolean)
    .join(" ");
  const cols = "bl-cols";
  // Column headers never sit over nothing: callers show their own empty line.
  if (shown.length === 0) return null;
  const style = { gridTemplateColumns: tpl };
  return (
    <div className="card bl-table" role="table" aria-label={label}>
      <div className={`${cols} bl-thead`} style={style} role="row">
        <span role="columnheader">Date</span>
        <span role="columnheader">Report or event</span>
        <span role="columnheader">Loan / reference</span>
        <span role="columnheader">Review types</span>
        {showCredits && (
          <span role="columnheader" className="bl-num">
            Credits
          </span>
        )}
        {showAmounts && (
          <span role="columnheader" className="bl-num">
            Amount
          </span>
        )}
        {showSource && <span role="columnheader">Paid from</span>}
        <span role="columnheader">By</span>
        <span role="columnheader" aria-label="Actions" />
      </div>
      {shown.map((r) => (
        <div key={r.id} className={`${cols} bl-trow`} style={style} role="row">
          <span className="bl-date" role="cell">
            {dateLabel(r.at)}
          </span>
          <span role="cell" className="bl-what">
            <span className="bl-what-t">{r.title}</span>
            {r.sub && <span className="bl-what-s">{r.sub}</span>}
          </span>
          <span role="cell" className="bl-loan">
            {r.loan ?? "—"}
          </span>
          <span role="cell">{r.types || "—"}</span>
          {showCredits && (
            <span role="cell" className={`bl-num bl-credits${r.credits > 0 ? " is-in" : ""}`}>
              {signed(r.credits)}
            </span>
          )}
          {showAmounts && (
            <span role="cell" className="bl-num bl-amount">
              <span>{r.amountUsd === 0 ? "$0" : `~${formatUsd(r.amountUsd)}`}</span>
              {r.listUsd ? <span className="bl-what-s">list ~{formatUsd(r.listUsd)}</span> : null}
            </span>
          )}
          {showSource && (
            <span role="cell" className="bl-from">
              {r.from.map((f) => (
                <span key={f.label} className={TONE[f.tone]}>
                  {f.label}
                </span>
              ))}
            </span>
          )}
          <span role="cell">{r.by}</span>
          <span role="cell" className="bl-act">
            {showAmounts && r.receiptId && onReceipt && (
              <Button variant="outline" size="sm" iconLeft="receipt" onClick={() => onReceipt(r.receiptId!)}>
                {r.actionLabel ?? "Receipt"}
              </Button>
            )}
          </span>
        </div>
      ))}
      {footer && <div className="bl-tfoot">{footer}</div>}
    </div>
  );
}
