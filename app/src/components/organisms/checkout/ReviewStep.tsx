"use client";

import { CREDIT_USD, PURCHASED_LIFE_MONTHS, formatUsd } from "@/lib/pricing";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const cents = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Step 3 (spec §5.6 Review, labelled "Checkout"): line items and the editable payment
 * rows. The balance before / after lives in the summary; the terms line sits under Pay
 * there. No Back button (the stepper goes back) and no illustration on this step.
 */
export function ReviewStep({
  line,
  validUntil,
  payingWith,
  receiptTo,
  poNumber,
  autoReload,
  onChangePayment,
  onTurnOnAutoReload,
}: {
  line: { credits: number; priceUsd: number; rateUsd: number; isPack: boolean };
  validUntil: string;
  payingWith: string;
  receiptTo: string;
  poNumber: string;
  autoReload: boolean;
  onChangePayment: () => void;
  onTurnOnAutoReload: () => void;
}) {
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

      <section className="co-card" aria-label="Payment details">
        <dl className="co-kv">
          <div>
            <dt>Paying with</dt>
            <dd>{payingWith}</dd>
            <dd>
              <button type="button" className="co-act" onClick={onChangePayment} aria-label="Change how you pay">
                Change
              </button>
            </dd>
          </div>
          <div>
            <dt>Receipt to</dt>
            <dd>{receiptTo || "—"}</dd>
            <dd>
              <button type="button" className="co-act" onClick={onChangePayment} aria-label="Change who gets the receipt">
                Change
              </button>
            </dd>
          </div>
          <div>
            <dt>PO number</dt>
            <dd>{poNumber || <span className="text-tertiary">None</span>}</dd>
            <dd>
              <button type="button" className="co-act" onClick={onChangePayment} aria-label="Change the PO number">
                Change
              </button>
            </dd>
          </div>
          <div>
            <dt>Auto-reload</dt>
            <dd className={autoReload ? undefined : "text-secondary"}>{autoReload ? "On" : "Off"}</dd>
            <dd>
              {autoReload ? (
                <button type="button" className="co-act" onClick={onChangePayment} aria-label="Change auto-reload">
                  Change
                </button>
              ) : (
                <button type="button" className="co-act" onClick={onTurnOnAutoReload}>
                  Turn on
                </button>
              )}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
