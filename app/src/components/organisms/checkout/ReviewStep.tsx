"use client";

import { Button, Icon } from "@/components/atoms";
import { CREDIT_USD, PURCHASED_LIFE_MONTHS, formatUsd } from "@/lib/pricing";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const cents = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "5 full reviews, with 1 credit left" / "Not enough for a full review". */
export function balanceLine(credits: number, fullReviewCredits: number): string {
  const full = Math.floor(credits / fullReviewCredits);
  if (full === 0) return "Not enough for a full review";
  const left = credits - full * fullReviewCredits;
  return left > 0
    ? `${plural(full, "full review", "full reviews")}, with ${plural(left, "credit", "credits")} left`
    : plural(full, "full review", "full reviews");
}

/**
 * Step 3 (spec §5.6 Review): line items, balance now / after, editable rows, terms,
 * Pay. Pay is never disabled: without the terms it shows the inline error and the page
 * focuses the checkbox. No illustration on this step.
 */
export function ReviewStep({
  line,
  validUntil,
  balance,
  fullReviewCredits,
  payingWith,
  receiptTo,
  poNumber,
  autoReload,
  orgName,
  agreed,
  termsError,
  termsRef,
  paying,
  onAgree,
  onChangePayment,
  onTurnOnAutoReload,
  onBack,
  onPay,
}: {
  line: { credits: number; priceUsd: number; rateUsd: number; isPack: boolean };
  validUntil: string;
  balance: number;
  fullReviewCredits: number;
  payingWith: string;
  receiptTo: string;
  poNumber: string;
  autoReload: boolean;
  orgName: string;
  agreed: boolean;
  termsError: boolean;
  termsRef: React.Ref<HTMLInputElement>;
  paying: boolean;
  onAgree: (v: boolean) => void;
  onChangePayment: () => void;
  onTurnOnAutoReload: () => void;
  onBack: () => void;
  onPay: () => void;
}) {
  const after = balance + line.credits;
  return (
    <div className="co-step">
      <header className="co-head">
        <h1 className="co-title" tabIndex={-1}>
          Review and pay
        </h1>
        <p className="co-lede tw-pretty">Check the order. Nothing is charged until you select Pay.</p>
      </header>

      <section className="co-card co-card--flush" aria-labelledby="co-buying">
        <h2 id="co-buying" className="co-h3 co-card-pad">
          What you&apos;re buying
        </h2>
        <div className="co-tbl-wrap">
          <table className="co-tbl">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col" className="r">
                  Quantity
                </th>
                <th scope="col" className="r">
                  Price per credit
                </th>
                <th scope="col" className="r">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="co-item">
                    {line.isPack ? "Credit pack" : "Custom amount"}, {plural(line.credits, "credit", "credits")}
                  </span>
                  <span className="co-small text-tertiary">
                    Valid {PURCHASED_LIFE_MONTHS} months, until {validUntil}
                  </span>
                </td>
                <td className="r mono">{line.credits}</td>
                <td className="r mono">
                  {formatUsd(line.rateUsd)}
                  {line.rateUsd < CREDIT_USD && (
                    <span className="co-small text-tertiary"> (was {formatUsd(CREDIT_USD)})</span>
                  )}
                </td>
                <td className="r mono">{cents(line.priceUsd)}</td>
              </tr>
              <tr className="co-tbl-muted">
                <td>Sales tax</td>
                <td />
                <td />
                <td className="r mono">{cents(0)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                <td />
                <td />
                <td className="r mono">{cents(line.priceUsd)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="co-card" aria-labelledby="co-bal">
        <h2 id="co-bal" className="co-h3">
          Your balance
        </h2>
        <div className="co-ba">
          <div className="co-ba-col">
            <span className="co-ba-k text-secondary">Now</span>
            <b className="co-ba-v mono">{plural(balance, "credit", "credits")}</b>
            <span className="co-small text-secondary">{balanceLine(balance, fullReviewCredits)}</span>
          </div>
          <Icon name="forward" size={18} className="co-ba-arrow" />
          <div className="co-ba-col">
            <span className="co-ba-k text-secondary">After you pay</span>
            <b className="co-ba-v co-ok mono">{plural(after, "credit", "credits")}</b>
            <span className="co-small text-secondary">{balanceLine(after, fullReviewCredits)}</span>
          </div>
        </div>
      </section>

      <section className="co-card" aria-label="Payment details">
        <dl className="co-kv">
          <div>
            <dt>Paying with</dt>
            <dd>{payingWith}</dd>
            <dd>
              <button type="button" className="co-link" onClick={onChangePayment} aria-label="Change how you pay">
                Change
              </button>
            </dd>
          </div>
          <div>
            <dt>Receipt to</dt>
            <dd>{receiptTo || "—"}</dd>
            <dd>
              <button type="button" className="co-link" onClick={onChangePayment} aria-label="Change who gets the receipt">
                Change
              </button>
            </dd>
          </div>
          <div>
            <dt>PO number</dt>
            <dd>{poNumber || <span className="text-tertiary">None</span>}</dd>
            <dd>
              <button type="button" className="co-link" onClick={onChangePayment} aria-label="Change the PO number">
                Change
              </button>
            </dd>
          </div>
          <div>
            <dt>Auto-reload</dt>
            <dd className={autoReload ? undefined : "text-secondary"}>{autoReload ? "On" : "Off"}</dd>
            <dd>
              {autoReload ? (
                <button type="button" className="co-link" onClick={onChangePayment} aria-label="Change auto-reload">
                  Change
                </button>
              ) : (
                <button type="button" className="co-link" onClick={onTurnOnAutoReload}>
                  Turn on
                </button>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <div className={termsError ? "co-terms is-err" : "co-terms"}>
        <label className="co-check-row">
          <input
            ref={termsRef}
            type="checkbox"
            className="co-checkbox"
            checked={agreed}
            onChange={(e) => onAgree(e.target.checked)}
            aria-invalid={termsError ? true : undefined}
            aria-describedby={termsError ? "co-terms-err" : undefined}
          />
          <span className="tw-pretty">
            I agree to the credit terms. Purchased credits last {PURCHASED_LIFE_MONTHS} months and are shared across{" "}
            {orgName}.
          </span>
        </label>
        {termsError && (
          <p id="co-terms-err" className="co-field-err" role="alert">
            Agree to the credit terms to pay
          </p>
        )}
      </div>

      <div className="co-actions">
        <Button variant="outline" size="lg" iconLeft="back" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" busy={paying} onClick={onPay} className="co-pay">
          Pay {formatUsd(line.priceUsd)}
        </Button>
      </div>
    </div>
  );
}
