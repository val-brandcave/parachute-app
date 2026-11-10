"use client";

import { useMemo, useState } from "react";
import { Button, CreditChip, type CreditChipTone } from "@/components/atoms";
import { EmptyLine } from "@/components/molecules";
import { stepDef } from "@/lib/setup-steps";
import { formatUsd, packById } from "@/lib/pricing";
import { balanceGrants, type BalanceGrant } from "@/lib/wallet-breakdown";
import { DEMO_TODAY, daysUntil, expiryLabel, spendOrderSentence } from "./billing-data";
import type { Billing } from "./useBilling";

const EXPIRY_WARN_DAYS = 14;
const shortDate = (ts: number) =>
  new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function describe(
  g: BalanceGrant,
  userName: Billing["userName"],
  showValue: boolean,
): { tone: CreditChipTone; label: string; sub: string } {
  const e = g.entry;
  const when = shortDate(e.createdAt);
  if (g.source === "trial")
    return {
      tone: "trial",
      label: "Trial",
      sub: `Granted ${when} · ${g.granted} credits`,
    };
  if (g.source === "earned") {
    const step = e.setupStepId ? stepDef(e.setupStepId)?.doneLabel : undefined;
    return {
      tone: "free",
      label: "Earned",
      sub: `${step ?? "Setup reward"} · ${when}`,
    };
  }
  if (e.kind === "purchase") {
    const by = userName(e.actorId);
    const price = showValue && e.amountUsd ? ` · ${formatUsd(e.amountUsd)}` : "";
    return {
      tone: "credit",
      label: e.packId ? `Pack of ${packById(e.packId).credits}` : `${g.granted} credits`,
      sub: `${e.auto ? "Auto-reload" : "Bought"} ${when}${by ? ` by ${by}` : ""}${price}`,
    };
  }
  return {
    tone: "credit",
    label: e.kind === "refund" ? "Refund" : "Adjustment",
    sub: `${e.note ?? (e.kind === "refund" ? "Credited back" : "Added by Realwired")} · ${when}`,
  };
}

/** "What's in your balance": the big number, one sentence on spend order, and one row per grant
 *  in the order credits are used. `showValue` is off for non-admins (no dollars). */
export function BalanceCard({ b, showValue = true }: { b: Billing; showValue?: boolean }) {
  const [showUsed, setShowUsed] = useState(false);
  const grants = useMemo(() => balanceGrants(b.ledger), [b.ledger]);
  const total = b.remaining.total;
  const live = grants.filter((g) => g.remaining > 0).sort((a, c) => (a.useOrder ?? 0) - (c.useOrder ?? 0));
  const used = grants.filter((g) => g.remaining === 0);
  const recentUsed = used.slice(-8);
  const rows = showUsed ? [...live, ...recentUsed] : live;

  return (
    <section className="card bl-card bl-balance">
      <div className="bl-balance-head">
        <h2 className="bl-h">What&rsquo;s in your balance</h2>
        <p className="bl-order-note">{spendOrderSentence(grants)}</p>
      </div>

      {rows.length === 0 ? (
        <EmptyLine
          className="bl-balance-empty"
          action={
            used.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setShowUsed(true)}>
                Show recently used
              </Button>
            ) : undefined
          }
        >
          {used.length > 0 ? "Every credit has been used." : "No credits in your balance."}
        </EmptyLine>
      ) : (
        <div className="bl-bd" role="table" aria-label="What's in your balance">
          <div className="bl-bd-cols bl-thead" role="row">
            <span role="columnheader">Used</span>
            <span role="columnheader">Credits from</span>
            <span role="columnheader" className="bl-num">
              Left
            </span>
            <span role="columnheader">Expires</span>
          </div>
          {rows.map((g) => {
            const d = describe(g, b.userName, showValue);
            const days = g.expiresAt !== null && g.remaining > 0 ? daysUntil(g.expiresAt) : null;
            const soon = days !== null && g.expiresAt! - DEMO_TODAY <= EXPIRY_WARN_DAYS * 86_400_000;
            return (
              <div key={g.id} className={`bl-bd-cols bl-trow${g.remaining === 0 ? " is-used" : ""}`} role="row">
                <span role="cell">
                  <span className="bl-order" aria-label={g.useOrder ? `Used ${g.useOrder}` : "Used up"}>
                    {g.useOrder ?? "–"}
                  </span>
                </span>
                <span role="cell" className="bl-from-cell">
                  <CreditChip tone={d.tone}>{d.label}</CreditChip>
                  <span className="bl-what-s">{d.sub}</span>
                </span>
                <span role="cell" className="bl-num bl-left">
                  <span>
                    <b>{g.remaining}</b> of {g.granted}
                  </span>
                </span>
                <span role="cell" className="bl-exp">
                  <span className={g.expiresAt === null ? "bl-what-s" : undefined}>{expiryLabel(g)}</span>
                  {soon && (
                    <CreditChip tone="low" size="sm">
                      in {days} day{days === 1 ? "" : "s"}
                    </CreditChip>
                  )}
                </span>
              </div>
            );
          })}
          <div className="bl-tfoot bl-tfoot--split">
            <span>
              Total <b>{total}</b>
            </span>
            {used.length > 0 && (
              <button type="button" className="hm-link" onClick={() => setShowUsed((v) => !v)}>
                {showUsed ? "Hide used" : `Show recently used (${recentUsed.length})`}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
