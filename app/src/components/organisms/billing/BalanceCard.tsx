"use client";

import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { approxValue, costFor } from "@/lib/pricing";
import { expiryLine } from "./billing-data";
import type { Billing } from "./useBilling";

/** Big balance, what it buys, the trial / earned / purchased meter. `showValue` is off for non-admins. */
export function BalanceCard({ b, showValue = true, aside }: { b: Billing; showValue?: boolean; aside?: React.ReactNode }) {
  const r = b.remaining;
  const full = Math.floor(r.total / costFor(FULL_REVIEW_TYPES));
  const seg = (n: number) => (r.total > 0 ? (n / r.total) * 100 : 0);
  return (
    <section className={`card bl-card bl-balance${aside ? " bl-balance--split" : ""}`}>
      <div className="bl-balance-main">
        <h2 className="bl-h">Balance</h2>
        {showValue && <p className="bl-sub">{expiryLine(b.ledger, r)}</p>}
        <div className="bl-big">
          <span className="bl-big-n">{r.total}</span>
          <span className="bl-big-u">
            {r.total === 1 ? "credit" : "credits"}
            {showValue && ` · ${approxValue(r.total)} value · about ${full} full review${full === 1 ? "" : "s"}`}
          </span>
        </div>
        <div className="meter" role="img" aria-label={`Trial ${r.trial}, earned ${r.earned}, purchased ${r.purchased}`}>
          {r.trial > 0 && <i className="meter-trial" style={{ width: `${seg(r.trial)}%` }} />}
          {r.earned > 0 && <i className="meter-earn" style={{ width: `${seg(r.earned)}%` }} />}
          {r.purchased > 0 && <i className="meter-buy" style={{ width: `${seg(r.purchased)}%` }} />}
        </div>
        <div className="meter-legend">
          <span>
            <i className="meter-trial" />
            Trial {r.trial}
          </span>
          <span>
            <i className="meter-earn" />
            Earned {r.earned}
          </span>
          <span>
            <i className="meter-buy" />
            Purchased {r.purchased}
          </span>
        </div>
        {showValue && <p className="bl-note">Spent in this order: trial, earned, purchased.</p>}
      </div>
      {aside}
    </section>
  );
}
