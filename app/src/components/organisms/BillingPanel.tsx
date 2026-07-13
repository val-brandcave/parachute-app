"use client";

import { Button, Card, Chip, Divider, Icon } from "@/components/atoms";

// Prototype-scoped billing (Realwired billing is likely contract-based) — a plan
// summary, payment method, and invoice history. Static mock data.
const SEATS_USED = 6;
const SEATS_TOTAL = 8;

type Invoice = { id: string; period: string; amount: string; status: "paid" | "due" };
const INVOICES: Invoice[] = [
  { id: "INV-2026-07", period: "Jul 2026", amount: "$1,200.00", status: "paid" },
  { id: "INV-2026-06", period: "Jun 2026", amount: "$1,200.00", status: "paid" },
  { id: "INV-2026-05", period: "May 2026", amount: "$1,200.00", status: "paid" },
  { id: "INV-2026-04", period: "Apr 2026", amount: "$1,050.00", status: "paid" },
  { id: "INV-2026-03", period: "Mar 2026", amount: "$1,050.00", status: "paid" },
  { id: "INV-2026-02", period: "Feb 2026", amount: "$1,050.00", status: "paid" },
];

/** A titled white card with an optional right-aligned header action — the shared
 *  settings section pattern (matches the Identity + Branding tabs). */
function Section({
  title,
  desc,
  action,
  children,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card style={{ padding: "var(--d-card-pad)" }}>
      <div className="bill-sec-head">
        <div className="bill-sec-titles">
          <div className="bill-sec-title">{title}</div>
          {desc && <div className="bill-sec-desc">{desc}</div>}
        </div>
        {action && <div className="bill-sec-action">{action}</div>}
      </div>
      <Divider style={{ margin: "14px 0" }} />
      {children}
    </Card>
  );
}

export function BillingPanel() {
  const pct = Math.round((SEATS_USED / SEATS_TOTAL) * 100);

  return (
    <div className="bill">
      <Section
        title="Plan"
        desc="Your Parachute subscription and seat usage."
        action={
          <Button variant="outline" size="sm">
            Manage plan
          </Button>
        }
      >
        <div className="bill-plan">
          <div className="bill-plan-head">
            <span className="bill-plan-tier">
              <span className="bill-plan-badge" aria-hidden="true">
                <Icon name="diamond" size={16} />
              </span>
              Enterprise
            </span>
            <Chip tone="accent" dot>
              Active
            </Chip>
            <span className="bill-plan-price mono">$1,200 / month · billed monthly</span>
          </div>
          <div className="bill-seats">
            <div className="bill-seats-bar">
              <span style={{ width: `${pct}%` }} />
            </div>
            <span className="bill-seats-text mono">
              {SEATS_USED} of {SEATS_TOTAL} seats used
            </span>
          </div>
        </div>
      </Section>

      <Section
        title="Payment method"
        desc="The card charged for your subscription."
        action={
          <Button variant="outline" size="sm">
            Update
          </Button>
        }
      >
        <div className="bill-pay">
          <span className="bill-pay-ic" aria-hidden="true">
            <Icon name="credit-card" size={20} />
          </span>
          <div className="bill-pay-main">
            <div className="bill-pay-num mono">Visa •••• 4242</div>
            <div className="bill-row-sub">Expires 08 / 2027</div>
          </div>
        </div>
      </Section>

      <Section title="Invoice history" desc="Downloadable receipts for past billing periods.">
        <div className="bill-inv-table" role="table" aria-label="Invoice history">
          <div className="bill-inv-row bill-inv-row--head" role="row">
            <span role="columnheader">Invoice</span>
            <span role="columnheader">Period</span>
            <span role="columnheader">Amount</span>
            <span role="columnheader">Status</span>
            <span role="columnheader" aria-label="Download" />
          </div>
          {INVOICES.map((inv) => (
            <div className="bill-inv-row" role="row" key={inv.id}>
              <span className="mono" role="cell">{inv.id}</span>
              <span role="cell">{inv.period}</span>
              <span className="mono" role="cell">{inv.amount}</span>
              <span role="cell">
                <Chip tone={inv.status === "paid" ? "pass" : "flag"} dot>
                  {inv.status === "paid" ? "Paid" : "Due"}
                </Chip>
              </span>
              <span className="bill-inv-dl" role="cell">
                <button type="button" className="ui-btn ui-btn--icon" aria-label={`Download ${inv.id}`}>
                  <Icon name="download" size={16} />
                </button>
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
