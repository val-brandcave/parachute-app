"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import { formatUsd } from "@/lib/pricing";
import { DEMO_TODAY, invoicedStatement, monthKey, monthTitle, walletStatement } from "../billing-data";
import type { useBilling } from "../useBilling";
import "../billing-settings.css";

type B = ReturnType<typeof useBilling>;

const fmtDate = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="bl-empty">{children}</div>;
}

function Receipts({ b }: { b: B }) {
  const last4 = b.settings?.paymentMethod === "card" ? b.settings.cardLast4 : undefined;
  const rows = useMemo(
    () => b.ledger.filter((e) => e.kind === "purchase" && e.receiptId).sort((x, y) => y.createdAt - x.createdAt),
    [b.ledger],
  );
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 8);
  return (
    <section className="bs-block">
      <div className="bs-blockhead">
        <h2 className="bl-section">Receipts</h2>
        <p className="bl-sub">One for every purchase, including auto-reload.</p>
      </div>
      <div className="card bl-table" role="table" aria-label="Receipts">
        <div className="bl-cols bs-cols bs-cols--rcpt bl-thead" role="row">
          <span>Date</span>
          <span>Receipt</span>
          <span>For</span>
          <span>Paid with</span>
          <span className="bl-num">Amount</span>
          <span>Status</span>
          <span />
        </div>
        {rows.length === 0 && <Empty>No purchases yet. Receipts for credit packs show up here.</Empty>}
        {shown.map((e) => (
          <div key={e.id} className="bl-cols bs-cols bs-cols--rcpt bl-trow" role="row">
            <span className="bl-date">{fmtDate(e.createdAt)}</span>
            <span className="bl-what-t">{e.receiptId}</span>
            <span className="bl-what">
              <span className="bl-what-t">{e.credits} credits</span>
              <span className="bl-what-s">{e.auto ? "Auto-reload" : "Top-up"}</span>
            </span>
            <span>{last4 ? `Visa •••• ${last4}` : "Card"}</span>
            <span className="bl-num">{formatUsd(e.amountUsd ?? 0)}</span>
            <span>
              <span className="su-pill su-pill--sm su-pill--earn">Paid</span>
            </span>
            <span className="bl-act">
              <Button variant="outline" size="sm" iconLeft="download" onClick={() => b.openReceipt(e.receiptId!)}>
                Download PDF
              </Button>
            </span>
          </div>
        ))}
        {rows.length > 8 && (
          <div className="bl-tfoot bl-tfoot--split">
            <span>
              Showing {shown.length} of {rows.length} receipts.
            </span>
            <button type="button" className="hm-link" onClick={() => setAll((v) => !v)}>
              {all ? "Show fewer" : "Show all"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Statements({ b }: { b: B }) {
  const router = useRouter();
  const rows = useMemo(() => {
    const keys = new Set<string>();
    b.ledger.filter((e) => e.kind === "debit" || e.kind === "rescan").forEach((e) => keys.add(monthKey(e.createdAt)));
    if (keys.size === 0) keys.add(monthKey(DEMO_TODAY));
    return [...keys].sort().reverse().map((key) => {
      const s = walletStatement(b.ledger, b.reviews, b.userName, key);
      const bought = b.ledger
        .filter((e) => e.kind === "purchase" && monthKey(e.createdAt) === key)
        .reduce((n, e) => n + (e.amountUsd ?? 0), 0);
      return { key, reviews: s.groups.length, credits: s.creditsUsed, bought };
    });
  }, [b.ledger, b.reviews, b.userName]);
  return (
    <section className="bs-block">
      <div className="bs-blockhead">
        <h2 className="bl-section">Monthly statements</h2>
        <p className="bl-sub">Every review and credit movement for the month.</p>
      </div>
      <div className="card bl-table" role="table" aria-label="Monthly statements">
        <div className="bl-cols bs-cols bs-cols--stmt bl-thead" role="row">
          <span>Period</span>
          <span className="bl-num">Reviews</span>
          <span className="bl-num">Credits used</span>
          <span className="bl-num">Purchased</span>
          <span />
        </div>
        {rows.map((r) => (
          <div key={r.key} className="bl-cols bs-cols bs-cols--stmt bl-trow" role="row">
            <span className="bl-what-t">{monthTitle(r.key)}</span>
            <span className="bl-num">{r.reviews}</span>
            <span className="bl-num">{r.credits}</span>
            <span className="bl-num">{formatUsd(r.bought)}</span>
            <span className="bl-act">
              <Button variant="outline" size="sm" iconLeft="download" onClick={() => router.push(`/configure/billing/statement?month=${r.key}`)}>
                Download
              </Button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Invoices({ b }: { b: B }) {
  const router = useRouter();
  const email = b.settings?.billingEmail ?? "your billing contact";
  const rows = useMemo(() => {
    const now = invoicedStatement(b.reviews, b.userName, monthKey(DEMO_TODAY));
    const make = (key: string, f: number, status: "open" | "due" | "paid") => ({
      key,
      id: `INV-${key}`,
      reviews: Math.max(1, Math.round(now.groups.length * f)),
      credits: Math.max(1, Math.round(now.creditsUsed * f)),
      amount: Math.round(now.chargedUsd * f),
      status,
    });
    // November is still running; earlier months are illustrative history scaled from it (net 30 after month end).
    return [make("2026-11", 1, "open"), make("2026-10", 0.9, "due"), make("2026-09", 0.82, "paid")];
  }, [b.reviews, b.userName]);
  return (
    <section className="bs-block">
      <div className="bs-blockhead">
        <h2 className="bl-section">Invoices</h2>
        <p className="bl-sub">Net 30, sent to {email}.</p>
      </div>
      <div className="card bl-table" role="table" aria-label="Invoices">
        <div className="bl-cols bs-cols bs-cols--inv bl-thead" role="row">
          <span>Invoice</span>
          <span>Period</span>
          <span className="bl-num">Reviews</span>
          <span className="bl-num">Credits</span>
          <span className="bl-num">Amount</span>
          <span>Status</span>
          <span />
        </div>
        {rows.map((r) => (
          <div key={r.id} className="bl-cols bs-cols bs-cols--inv bl-trow" role="row">
            <span className="bl-what-t">{r.id}</span>
            <span>{monthTitle(r.key)}</span>
            <span className="bl-num">{r.reviews}</span>
            <span className="bl-num">{r.credits}</span>
            <span className="bl-num">{formatUsd(r.amount)}</span>
            <span>
              <span className={`su-pill su-pill--sm${r.status === "paid" ? " su-pill--earn" : r.status === "due" ? " su-pill--doing" : ""}`}>
                {r.status === "paid" ? "Paid" : r.status === "due" ? "Due 30 Nov" : "Open"}
              </span>
            </span>
            <span className="bl-act">
              <Button variant="outline" size="sm" iconLeft="download" onClick={() => router.push(`/configure/billing/statement?month=${r.key}`)}>
                Download
              </Button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Receipts and statements for wallet orgs; invoices for invoiced orgs. Admin only. */
export function InvoicesTab({ b, invoiced }: { b: B; invoiced: boolean }) {
  return (
    <div className="bl-stack">
      {invoiced ? (
        <Invoices b={b} />
      ) : (
        <>
          <Receipts b={b} />
          <Statements b={b} />
        </>
      )}
      <p className="bl-note bs-pnote">Receipts and statements carry the PO number, tax ID and billing address from Settings.</p>
    </div>
  );
}
