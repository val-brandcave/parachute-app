"use client";

import Link from "next/link";
import { CreditChip, Icon } from "@/components/atoms";
import { spendOrderSentence } from "@/components/organisms/billing/billing-data";
import { useCurrentUser } from "@/lib/current-user";
import { EARN_CAP_CREDITS, TRIAL_GRANT_CREDITS, costFor } from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { balanceGrants } from "@/lib/wallet-breakdown";
import { useApprovalPending, useWalletStore } from "@/store";
import "./wallet-card.css";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function Pips({ filled, dashed }: { filled: number; dashed?: boolean }) {
  return (
    <div
      className="wc-pips"
      role="img"
      aria-label={dashed ? `${TRIAL_GRANT_CREDITS} trial credits on the way` : `${filled} of ${TRIAL_GRANT_CREDITS} trial credits left`}
    >
      {Array.from({ length: TRIAL_GRANT_CREDITS }, (_, i) => (
        <i key={i} className={dashed ? "is-dashed" : i < filled ? "is-on" : undefined} />
      ))}
    </div>
  );
}

/** Home wallet card. One big number, what it buys, and one sentence. No composition bar:
 *  pips appear only while every credit is trial credit, where they are real progress. */
export function WalletCard() {
  const ledger = useWalletStore((s) => s.ledger);
  const pending = useApprovalPending();
  const isAdmin = useCurrentUser().role === "org_admin";

  const grants = balanceGrants(ledger);
  const live = grants.filter((g) => g.remaining > 0);
  const balance = live.reduce((n, g) => n + g.remaining, 0);
  const fullCost = costFor(FULL_REVIEW_TYPES);
  const full = Math.floor(balance / fullCost);
  const allTrial = live.length > 0 && live.every((g) => g.source === "trial");
  const low = !pending && balance < fullCost;
  const openTopUp = () => useWalletStore.getState().openTopUp({ reason: "low_balance", needed: fullCost - balance });

  let body: React.ReactNode;
  if (pending) {
    body = (
      <>
        <div className="wc-big is-muted">
          <span className="wc-n">{TRIAL_GRANT_CREDITS}</span>
          <span className="wc-u">trial credits on the way</span>
        </div>
        <Pips filled={0} dashed />
        <p className="wc-note">They arrive when Realwired confirms your organization, usually within one business day.</p>
      </>
    );
  } else if (low) {
    body = (
      <>
        <div className="wc-big">
          <span className="wc-n">{balance}</span>
          <span className="wc-u">{plural(balance, "credit", "credits")} · not enough for a full review</span>
        </div>
        <p className="wc-note">
          A full review uses {fullCost} credits. {isAdmin ? "Add credits to keep going." : "Ask your organization admin to add credits."}
        </p>
        {isAdmin && (
          <button type="button" className="hm-link" onClick={openTopUp}>
            Add credits
          </button>
        )}
      </>
    );
  } else if (allTrial) {
    body = (
      <>
        <div className="wc-big">
          <span className="wc-n">{balance}</span>
          <span className="wc-u">
            trial {plural(balance, "credit", "credits")} · about {full} full review{full === 1 ? "" : "s"}
          </span>
        </div>
        <Pips filled={balance} />
        <p className="wc-note">
          {balance} of {TRIAL_GRANT_CREDITS} left. Finish setup to earn up to {EARN_CAP_CREDITS} more.
        </p>
        {isAdmin && (
          <Link className="hm-link" href="/configure/billing?tab=payment">
            Add a card
          </Link>
        )}
      </>
    );
  } else {
    body = (
      <>
        <div className="wc-big">
          <span className="wc-n">{balance}</span>
          <span className="wc-u">
            {plural(balance, "credit", "credits")} · about {full} full review{full === 1 ? "" : "s"}
          </span>
        </div>
        <p className="wc-note">{spendOrderSentence(grants)}</p>
        <Link className="hm-link" href="/configure/billing">
          See what&rsquo;s in your balance
        </Link>
      </>
    );
  }

  return (
    <section className="card hm-card wc-card">
      <div className="hm-row-between">
        <div className="wc-title">
          <span className="hm-ico" aria-hidden="true">
            <Icon name="wallet" size={18} />
          </span>
          <h2 className="hm-h">Wallet</h2>
        </div>
        {low ? (
          <CreditChip tone="low" size="sm">
            Low
          </CreditChip>
        ) : (
          <Link className="hm-link" href="/configure/billing">
            Billing
          </Link>
        )}
      </div>
      {body}
    </section>
  );
}
