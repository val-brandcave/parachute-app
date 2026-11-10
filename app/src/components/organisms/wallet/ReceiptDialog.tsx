"use client";

import { Dialog, useToast } from "@realwired/ui";
import { Button, Logo } from "@/components/atoms";
import { approxValue, formatUsd, packById, usd } from "@/lib/pricing";
import { useReviewsStore, useUsersStore, useWalletStore } from "@/store";
import type { CreditLedgerEntry, CreditSource, ReviewType } from "@/types";
import "./wallet.css";

const SOURCE_LABEL: Record<CreditSource, string> = { trial: "Trial", earned: "Earned", purchased: "Purchased" };
const TYPE_LABEL: Record<ReviewType, string> = { technical: "Technical", administrative: "Administrative" };

const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Row = [label: string, value: string];

/** Mounted once in the shell; open when `receiptId` is set. */
export function ReceiptDialog() {
  const receiptId = useWalletStore((s) => s.receiptId);
  if (!receiptId) return null;
  return <ReceiptBody receiptId={receiptId} />;
}

function ReceiptBody({ receiptId }: { receiptId: string }) {
  const toast = useToast();
  const ledger = useWalletStore((s) => s.ledger);
  const settings = useWalletStore((s) => s.settings);
  const reviews = useReviewsStore((s) => s.reviews);
  const allUsers = useUsersStore((s) => s.allUsers);

  const idx = ledger.findIndex((e) => e.receiptId === receiptId);
  const entry: CreditLedgerEntry | undefined = ledger[idx];
  const close = () => useWalletStore.getState().closeReceipt();
  const email = settings?.billingEmail ?? "your billing contact";

  if (!entry) {
    return (
      <Dialog open onOpenChange={(o) => !o && close()} size="sm" title="Receipt" description="We could not find that receipt.">
        <p className="rc-missing">It may belong to another organization. Close this and try again from Billing.</p>
      </Dialog>
    );
  }

  const balanceAfter = ledger.slice(0, idx + 1).reduce((s, e) => s + e.credits, 0);
  const review = entry.reviewId ? reviews.find((r) => r.id === entry.reviewId) : undefined;
  const actor = allUsers.find((u) => u.id === entry.actorId)?.name;
  const credits = Math.abs(entry.credits);
  const isTrialRun = entry.kind === "debit" && (entry.amountUsd ?? 0) === 0;

  let heading: string;
  let sub: string;
  let rows: Row[];
  let note: string;
  let blurb: string;

  if (entry.kind === "purchase") {
    const pack = entry.packId ? packById(entry.packId) : null;
    heading = pack ? `${pack.credits}-credit pack` : `${credits} credits`;
    sub = `${entry.auto ? "Auto-reload" : "Purchase"} · ${fmtDate(entry.createdAt)}`;
    rows = [
      ["Credits added", `+${credits}`],
      ["Amount", formatUsd(entry.amountUsd ?? usd(credits))],
      [
        "Payment",
        settings?.paymentMethod === "card" && settings.cardLast4 ? `Visa •••• ${settings.cardLast4}` : "Invoice",
      ],
      ["Auto-reload", entry.auto ? "Bought by auto-reload" : settings?.autoReload ? "On" : "Off"],
      ["Balance after", plural(balanceAfter, "credit", "credits")],
    ];
    note = "Purchased credits last 12 months.";
    blurb = "Issued when the payment cleared.";
  } else if (entry.kind === "refund") {
    heading = "Refund";
    sub = `${plural(credits, "credit", "credits")} returned · ${fmtDate(entry.createdAt)}`;
    rows = [
      ["Credits returned", `+${credits}`],
      ["Amount returned", formatUsd(Math.abs(entry.amountUsd ?? usd(credits)))],
      ["Reason", entry.note ?? "Failed on our side · refunded"],
      ["Balance after", plural(balanceAfter, "credit", "credits")],
    ];
    note = "Credits return to your balance as purchased credits.";
    blurb = "Refunded because the review failed on our side.";
  } else if (entry.kind === "debit" || entry.kind === "rescan") {
    heading = review?.propertyAddress ?? "Review";
    sub = [entry.loanNo ? `Loan ${entry.loanNo}` : null, fmtDate(entry.createdAt)].filter(Boolean).join(" · ");
    rows = [
      ...(entry.loanNo ? ([["Loan or reference", entry.loanNo]] as Row[]) : []),
      ["Review types", (entry.reviewTypes ?? []).map((t) => TYPE_LABEL[t]).join(" + ") || "Review"],
      ["Credits", String(credits)],
      [
        "Amount",
        isTrialRun ? `$0 · list ${approxValue(credits)}` : `~${formatUsd(entry.amountUsd ?? usd(credits))}`,
      ],
      ["Paid from", (entry.paidFrom ?? []).map((s) => SOURCE_LABEL[s]).join(", ") || "Credits"],
      ["Balance after", plural(balanceAfter, "credit", "credits")],
    ];
    note = `Re-scans after send-back are included.${actor ? ` Started by ${actor}.` : ""}`;
    blurb = "Issued when the review started. Nothing further is charged for this report.";
  } else {
    heading = entry.note ?? "Credit adjustment";
    sub = fmtDate(entry.createdAt);
    rows = [
      ["Credits", `${entry.credits > 0 ? "+" : ""}${entry.credits}`],
      ["Balance after", plural(balanceAfter, "credit", "credits")],
    ];
    note = "";
    blurb = "A change to your credit balance.";
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && close()}
      size="sm"
      className="rc-dialog"
      title={`Receipt · ${fmtDate(entry.createdAt)}`}
      description={blurb}
      footer={
        <>
          <Button
            variant="outline"
            iconLeft="mail"
            onClick={() => toast({ title: `Sent to ${email}`, tone: "success" })}
          >
            Email receipt
          </Button>
          <Button iconLeft="download" onClick={() => window.print()}>
            Download PDF
          </Button>
        </>
      }
    >
      <article className="rc-paper" aria-label={`Receipt ${receiptId}`}>
        <header className="rc-top">
          <Logo variant="blue" full height={22} />
          <span className="rc-id">Receipt {receiptId}</span>
        </header>
        <h3 className="rc-h">{heading}</h3>
        <p className="rc-sub">{sub}</p>
        <dl className="rc-items">
          {rows.map(([k, v]) => (
            <div key={k} className="rc-item">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {note && <p className="rc-note">{note}</p>}
      </article>
      <p className="rc-also">Also on the monthly statement.</p>
    </Dialog>
  );
}
