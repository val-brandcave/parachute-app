"use client";

import { Button, Chip, Illustration } from "@/components/atoms";
import { AUTO_RELOAD_DEFAULTS, packById } from "@/lib/pricing";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const cents = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface NextAction {
  id: string;
  title: string;
  body: string;
  cta: string;
  primary?: boolean;
  onClick: () => void;
}

/**
 * Paid (spec §5.6): the outcome in credits and reviews, the facts, the one scene of the
 * flow (`24-scene-checkout-success`, 280 px, below the confirmation line) and up to three
 * next actions. The caller decides the actions (a `return` makes the first one "Back to …").
 */
export function PaidStep({
  credits,
  amountUsd,
  balanceBefore,
  balanceAfter,
  fullReviewsAfter,
  receiptId,
  emails,
  validUntil,
  paidWith,
  poNumber,
  actions,
}: {
  credits: number;
  amountUsd: number;
  balanceBefore: number;
  balanceAfter: number;
  fullReviewsAfter: number;
  receiptId: string;
  emails: string[];
  validUntil: string;
  paidWith: string;
  poNumber?: string;
  actions: NextAction[];
}) {
  const to = emails.length > 1 ? `${emails.slice(0, -1).join(", ")} and ${emails[emails.length - 1]}` : emails[0];
  return (
    <div className="co-step co-paid">
      <header className="co-head">
        <Chip tone="pass" className="co-paid-chip">
          Paid {cents(amountUsd)}
        </Chip>
        <h1 className="co-title" tabIndex={-1}>
          {plural(credits, "credit", "credits")} added
        </h1>
        <p className="co-lede tw-pretty">
          Your balance is now {plural(balanceAfter, "credit", "credits")}
          {fullReviewsAfter > 0 ? `, enough for ${plural(fullReviewsAfter, "full review", "full reviews")}` : ""}.
          {to ? ` We emailed receipt ${receiptId} to ${to}.` : ` Your receipt is ${receiptId}.`}
        </p>
      </header>

      <div className="co-paid-art">
        <Illustration name="24-scene-checkout-success" size={280} title="Credits added to your balance" />
      </div>

      <section className="co-card co-facts" aria-label="Payment details">
        <div>
          <span className="co-facts-k text-secondary">Balance</span>
          <span className="co-facts-v mono">
            {balanceBefore} → {plural(balanceAfter, "credit", "credits")}
          </span>
        </div>
        <div>
          <span className="co-facts-k text-secondary">Valid until</span>
          <span className="co-facts-v">{validUntil}</span>
        </div>
        <div>
          <span className="co-facts-k text-secondary">Paid with</span>
          <span className="co-facts-v">{paidWith}</span>
        </div>
        {poNumber && (
          <div>
            <span className="co-facts-k text-secondary">PO number</span>
            <span className="co-facts-v">{poNumber}</span>
          </div>
        )}
      </section>

      <section className="co-next" aria-labelledby="co-next-h">
        <h2 id="co-next-h" className="co-h3">
          What next
        </h2>
        <div className="co-next-grid">
          {actions.map((a) => (
            <div key={a.id} className="co-card co-next-card">
              <span className="co-opt-t">{a.title}</span>
              <span className="co-small text-secondary tw-pretty">{a.body}</span>
              <Button variant={a.primary ? "primary" : "outline"} size="sm" onClick={a.onClick} className="co-next-btn">
                {a.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Copy for the auto-reload next action, from pricing.ts. */
export function autoReloadPitch(): string {
  const p = packById(AUTO_RELOAD_DEFAULTS.packId);
  return `Add ${p.credits} credits automatically when you drop below ${AUTO_RELOAD_DEFAULTS.below}.`;
}
