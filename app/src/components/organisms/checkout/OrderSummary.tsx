"use client";

import { Button, Icon } from "@/components/atoms";
import { formatUsd } from "@/lib/pricing";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * "Your order" (spec §5.6 Summary, all steps). Icons only, no art: board 2 draws a
 * wallet illustration here and the board is wrong (one illustration per view, none on
 * form steps). `line` is null while a Custom amount is invalid; the rows then read "—".
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
}: {
  line: { credits: number; priceUsd: number; rateUsd: number; savingUsd: number } | null;
  balance: number;
  /** Full reviews the balance after purchase pays for. */
  fullReviewsAfter: number | null;
  /** The list price of a credit, for the "was" saving line. */
  listRateUsd: number;
  cta: string;
  ctaBusy?: boolean;
  onCta: () => void;
  onTalkToUs: () => void;
}) {
  const after = line ? balance + line.credits : null;
  return (
    <section className="co-sum" aria-label="Your order">
      <h2 className="co-sum-title">Your order</h2>
      <dl className="co-sum-rows">
        <div className="co-sum-row co-sum-row--lead">
          <dt>{line ? plural(line.credits, "credit", "credits") : "Custom amount"}</dt>
          <dd className="mono">{line ? formatUsd(line.priceUsd) : "—"}</dd>
        </div>
        <div className="co-sum-row">
          <dt className="text-secondary">Price per credit</dt>
          <dd className="mono text-secondary">{line ? formatUsd(line.rateUsd) : "—"}</dd>
        </div>
        {line && line.savingUsd > 0 && (
          <div className="co-sum-row">
            <dt className="text-secondary">Saving vs. {formatUsd(listRateUsd)} a credit</dt>
            <dd className="mono co-ok">{formatUsd(line.savingUsd)}</dd>
          </div>
        )}
        <div className="co-sum-row co-sum-sep">
          <dt className="text-secondary">Current balance</dt>
          <dd className="mono">{plural(balance, "credit", "credits")}</dd>
        </div>
        <div className="co-sum-row co-sum-after">
          <dt>
            <span aria-hidden="true" className="co-sum-ic">
              <Icon name="arrow-up-right" size={16} />
            </span>
            After purchase
          </dt>
          <dd>
            <span className="mono">{after === null ? "—" : plural(after, "credit", "credits")}</span>
            {fullReviewsAfter !== null && (
              <span className="co-sum-note text-tertiary">
                About {plural(fullReviewsAfter, "full review", "full reviews")}
              </span>
            )}
          </dd>
        </div>
        <div className="co-sum-row co-sum-sep co-sum-total">
          <dt>Due today</dt>
          <dd className="mono">{line ? formatUsd(line.priceUsd) : "—"}</dd>
        </div>
      </dl>
      <Button size="lg" block busy={ctaBusy} onClick={onCta} className="co-sum-cta">
        {cta}
      </Button>
      <p className="co-sum-help text-secondary">
        Prefer a monthly invoice?{" "}
        <button type="button" className="co-link" onClick={onTalkToUs}>
          Talk to us
        </button>
      </p>
    </section>
  );
}
