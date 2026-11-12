"use client";

import { Button } from "@/components/atoms";
import { formatUsd } from "@/lib/pricing";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * "Your order" (spec §5.6 Summary, all steps). A standard order breakdown: subtotal at
 * the list price, the volume discount (only when there is one), Total; then a compact
 * balance line. No art (one illustration per view, none on form steps). `line` is null
 * while a Custom amount is invalid; the amounts then read "—". `terms` is the small
 * agreement line under Pay on the Checkout step.
 */
export function OrderSummary({
  line,
  balance,
  fullReviewsAfter,
  listRateUsd,
  cta,
  ctaBusy,
  onCta,
  onTalkToUs,
  terms,
}: {
  line: { credits: number; priceUsd: number; rateUsd: number; savingUsd: number } | null;
  balance: number;
  /** Full reviews the balance after purchase pays for. */
  fullReviewsAfter: number | null;
  /** The list price of a credit: the subtotal is credits × this. */
  listRateUsd: number;
  cta: string;
  ctaBusy?: boolean;
  onCta: () => void;
  onTalkToUs: () => void;
  /** Shown under the CTA (the Checkout step's terms line). */
  terms?: React.ReactNode;
}) {
  const after = line ? balance + line.credits : null;
  const discount = line ? line.credits * listRateUsd - line.priceUsd : 0;
  return (
    <section className="co-sum" aria-label="Your order">
      <h2 className="co-sum-title">Your order</h2>
      <dl className="co-sum-rows">
        <div className="co-sum-row">
          <dt>
            {line ? (
              <>
                {plural(line.credits, "credit", "credits")} <span className="text-secondary">× {formatUsd(listRateUsd)}</span>
              </>
            ) : (
              "Custom amount"
            )}
          </dt>
          <dd className="mono">{line ? formatUsd(line.credits * listRateUsd) : "—"}</dd>
        </div>
        {discount > 0 && (
          <div className="co-sum-row">
            <dt className="text-secondary">Volume discount</dt>
            <dd className="mono co-ok">−{formatUsd(discount)}</dd>
          </div>
        )}
        <div className="co-sum-row co-sum-sep co-sum-total">
          <dt>Total</dt>
          <dd className="mono">{line ? formatUsd(line.priceUsd) : "—"}</dd>
        </div>
      </dl>
      {/* Balance as its own small table, same row rhythm as the order lines above. */}
      <dl className="co-sum-rows co-sum-balance" aria-label="Balance">
        <div className="co-sum-row">
          <dt className="text-secondary">Current balance</dt>
          <dd className="mono co-sum-bal-now">{plural(balance, "credit", "credits")}</dd>
        </div>
        <div className="co-sum-row">
          <dt className="text-secondary">After purchase</dt>
          <dd className="mono co-sum-bal-after">{after === null ? "—" : plural(after, "credit", "credits")}</dd>
        </div>
        {fullReviewsAfter !== null && fullReviewsAfter > 0 && (
          <div className="co-sum-row co-sum-row--note">
            <dt className="sr-only">Covers</dt>
            <dd className="text-tertiary">≈ {plural(fullReviewsAfter, "full review", "full reviews")}</dd>
          </div>
        )}
      </dl>
      <div className="co-sum-pay">
        <Button size="lg" block busy={ctaBusy} onClick={onCta} className="co-sum-cta">
          {cta}
        </Button>
        {terms && <p className="co-sum-terms text-secondary tw-pretty">{terms}</p>}
      </div>
      <p className="co-sum-help text-secondary">
        Prefer a monthly invoice?{" "}
        <button type="button" className="co-link" onClick={onTalkToUs}>
          Talk to us
        </button>
      </p>
    </section>
  );
}
