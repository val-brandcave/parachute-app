"use client";

import { Button } from "@/components/atoms";
import { ActivityTable } from "./ActivityTable";
import { AutoReloadCard } from "./AutoReloadCard";
import { BalanceCard } from "./BalanceCard";
import { PaymentMethodsCard } from "./PaymentMethodsCard";
import type { Billing } from "./useBilling";

/** E1: three cards, then the latest six ledger rows. */
export function OverviewTab({ b, onViewAll, onStatement }: { b: Billing; onViewAll: () => void; onStatement: () => void }) {
  return (
    <div className="bl-stack">
      <div className="bl-three">
        <BalanceCard b={b} />
        <AutoReloadCard b={b} />
        <PaymentMethodsCard b={b} />
      </div>
      <div className="bl-row bl-sechead">
        <h2 className="bl-section">Activity</h2>
        <div className="bl-actions">
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
          </Button>
          <Button variant="outline" iconLeft="download" onClick={b.exportCsv}>
            Export CSV
          </Button>
          <Button variant="outline" iconLeft="document" onClick={onStatement}>
            Monthly statement
          </Button>
        </div>
      </div>
      <ActivityTable
        rows={b.rows}
        limit={6}
        onReceipt={b.openReceipt}
        footer={`Showing the latest ${Math.min(6, b.rows.length)} of ${b.rows.length} events. Older activity is in the CSV export.`}
      />
    </div>
  );
}

/** E4: read-only for reviewers and approvers. Credits only, no dollars, no payment methods. */
export function ReviewerBilling({ b }: { b: Billing }) {
  return (
    <div className="bl-stack">
      <BalanceCard
        b={b}
        showValue={false}
        aside={
          <div className="bl-ask">
            <p className="bl-body">Only your organization admin can buy credits. Ask {b.adminName}.</p>
            <div className="bl-row bl-row--tight bl-row--start">
              <Button iconLeft="send" onClick={b.askAdmin}>
                Ask your admin
              </Button>
              <span className="bl-note">We&rsquo;ll send {b.adminFirst} an email with your balance.</span>
            </div>
          </div>
        }
      />
      <h2 className="bl-section">Activity</h2>
      <ActivityTable rows={b.rows.filter((r) => r.kind === "debit" || r.kind === "rescan" || r.kind === "refund")} showAmounts={false} />
    </div>
  );
}
