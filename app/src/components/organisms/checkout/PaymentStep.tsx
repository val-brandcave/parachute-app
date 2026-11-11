"use client";

import { Callout } from "@realwired/ui";
import { Button, Chip, Icon, Input } from "@/components/atoms";
import { AUTO_RELOAD_DEFAULTS, formatUsd, packById } from "@/lib/pricing";

export interface PaymentFormValue {
  payWith: "saved" | "new";
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  name: string;
  email: string;
  receiptCc: string;
  poNumber: string;
  autoReload: boolean;
}

/**
 * Step 2 (spec §5.6 Payment): saved card or a new one, billing contact, extra receipt
 * address, PO number, auto-reload opt-in. `declined` = prototype `error=card`.
 * No illustration on this step.
 */
export function PaymentStep({
  form,
  onChange,
  savedCardLast4,
  savedCardExpiry,
  cardholder,
  declined,
  cardError,
  cardRef,
  autoReloadOn,
  onBack,
  onContinue,
}: {
  form: PaymentFormValue;
  onChange: (patch: Partial<PaymentFormValue>) => void;
  /** Last 4 of the saved card, or null when the org has none. */
  savedCardLast4: string | null;
  /** "MM/YY"; the segment is left out when absent. */
  savedCardExpiry?: string;
  cardholder: string;
  declined: boolean;
  cardError: string | null;
  cardRef: React.Ref<HTMLInputElement>;
  /** Auto-reload is already on in Billing settings: no opt-in to offer. */
  autoReloadOn: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const reload = packById(AUTO_RELOAD_DEFAULTS.packId);
  const field = (k: keyof PaymentFormValue) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ [k]: e.target.value });
  return (
    <div className="co-step">
      <header className="co-head">
        <h1 className="co-title" tabIndex={-1}>
          Payment
        </h1>
        <p className="co-lede tw-pretty">
          Pay by card now, or add a PO number so your accounts team can match the receipt.
        </p>
      </header>

      {declined && (
        <Callout tone="danger">Your card was declined. Try another card or ask your bank.</Callout>
      )}

      <section className="co-card" aria-labelledby="co-paywith">
        <h2 id="co-paywith" className="co-h3">
          Pay with
        </h2>
        <div className="co-opts" role="radiogroup" aria-labelledby="co-paywith">
          {savedCardLast4 && (
            <label className={form.payWith === "saved" ? "co-opt is-on" : "co-opt"}>
              <input
                type="radio"
                name="co-paywith"
                className="co-radio"
                checked={form.payWith === "saved"}
                onChange={() => onChange({ payWith: "saved" })}
              />
              <span className="co-card-mark" aria-hidden="true">
                <Icon name="credit-card" size={18} />
              </span>
              <span className="co-opt-body">
                <span className="co-opt-t">Visa ending in {savedCardLast4}</span>
                <span className="co-opt-s text-secondary">
                  {savedCardExpiry ? `Expires ${savedCardExpiry} · ` : ""}
                  {cardholder}
                </span>
              </span>
              <Chip tone="accent">Saved card</Chip>
            </label>
          )}
          <label className={form.payWith === "new" ? "co-opt is-on" : "co-opt"}>
            <input
              type="radio"
              name="co-paywith"
              className="co-radio"
              checked={form.payWith === "new"}
              onChange={() => onChange({ payWith: "new" })}
            />
            <span className="co-card-mark" aria-hidden="true">
              <Icon name="add" size={18} />
            </span>
            <span className="co-opt-body">
              <span className="co-opt-t">Use a new card</span>
              <span className="co-opt-s text-secondary">Visa, Mastercard, American Express or Discover</span>
            </span>
          </label>
        </div>
        {form.payWith === "new" && (
          <div className="co-grid3">
            <div>
              <label className="ui-label" htmlFor="co-cc">
                Card number
              </label>
              <Input
                ref={cardRef}
                id="co-cc"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 1234 1234 1234"
                value={form.cardNumber}
                onChange={field("cardNumber")}
                aria-invalid={cardError ? true : undefined}
                aria-describedby={cardError ? "co-cc-err" : undefined}
              />
              {cardError && (
                <p id="co-cc-err" className="co-field-err" role="alert">
                  {cardError}
                </p>
              )}
            </div>
            <div>
              <label className="ui-label" htmlFor="co-exp">
                Expiry
              </label>
              <Input id="co-exp" autoComplete="cc-exp" placeholder="MM / YY" value={form.cardExpiry} onChange={field("cardExpiry")} />
            </div>
            <div>
              <label className="ui-label" htmlFor="co-cvc">
                Security code
              </label>
              <Input id="co-cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" value={form.cardCvc} onChange={field("cardCvc")} />
            </div>
          </div>
        )}
      </section>

      <section className="co-card" aria-labelledby="co-contact">
        <div className="co-card-hd">
          <h2 id="co-contact" className="co-h3">
            Billing contact
          </h2>
          <span className="text-tertiary co-small">Receipts go to this person</span>
        </div>
        <div className="co-grid2">
          <div>
            <label className="ui-label" htmlFor="co-name">
              Name
            </label>
            <Input id="co-name" autoComplete="name" value={form.name} onChange={field("name")} />
          </div>
          <div>
            <label className="ui-label" htmlFor="co-email">
              Email
            </label>
            <Input id="co-email" type="email" autoComplete="email" value={form.email} onChange={field("email")} />
          </div>
          <div>
            <label className="ui-label" htmlFor="co-cc-email">
              Also send receipts to (optional)
            </label>
            <Input id="co-cc-email" type="email" value={form.receiptCc} onChange={field("receiptCc")} />
          </div>
          <div>
            <label className="ui-label" htmlFor="co-po">
              PO number (optional)
            </label>
            <Input
              id="co-po"
              placeholder="For example PO-2026-1184"
              value={form.poNumber}
              onChange={field("poNumber")}
              aria-describedby="co-po-help"
            />
            <p id="co-po-help" className="co-help text-tertiary">
              Printed on the receipt and the monthly statement.
            </p>
          </div>
        </div>
      </section>

      {!autoReloadOn && (
        <section className="co-card">
          <label className="co-check-row">
            <input
              type="checkbox"
              className="co-checkbox"
              checked={form.autoReload}
              onChange={(e) => onChange({ autoReload: e.target.checked })}
            />
            <span className="co-opt-body">
              <span className="co-opt-t">Turn on auto-reload</span>
              <span className="co-opt-s text-secondary tw-pretty">
                Add {reload.credits} credits ({formatUsd(reload.priceUsd)}) to this card when the balance drops below{" "}
                {AUTO_RELOAD_DEFAULTS.below}, so a review never stops at Start. Change or turn it off any time in Billing
                settings.
              </span>
            </span>
            <Chip>Optional</Chip>
          </label>
        </section>
      )}

      <div className="co-actions">
        <Button variant="outline" size="lg" iconLeft="back" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" onClick={onContinue}>
          Continue to review
        </Button>
      </div>
    </div>
  );
}
