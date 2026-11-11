"use client";

import { forwardRef } from "react";
import { Button, Icon, Input } from "@/components/atoms";
import { SelectTile } from "@/components/molecules";
import {
  CREDIT_PACKS,
  CUSTOM_CREDITS,
  PURCHASED_LIFE_MONTHS,
  creditRateUsd,
  customPriceUsd,
  formatUsd,
  type CreditPack,
} from "@/lib/pricing";
import type { CreditPackId } from "@/types";
import { CostBlock } from "./CostBlock";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Step 1 (spec §5.6 Amount): pack tiles + Custom, what the amount buys in reviews,
 * reassurance and the cost block. No illustration on this step.
 * `customText` is the raw field text (it may be over the limit; the URL only holds valid
 * amounts). `customError` is the inline message under the field.
 */
export const AmountStep = forwardRef<
  HTMLInputElement,
  {
    orgName: string;
    selectedPack: CreditPackId | null;
    customText: string;
    customError: string | null;
    /** Credits the current choice buys, or null while Custom is invalid. */
    credits: number | null;
    fullReviewCredits: number;
    onPickPack: (id: CreditPackId) => void;
    onPickCustom: () => void;
    onCustomText: (t: string) => void;
    onTalkToUs: () => void;
    onNext: () => void;
    nextLabel: string;
  }
>(function AmountStep(p, customRef) {
  const isCustom = p.selectedPack === null;
  const over = isCustom && Number.parseInt(p.customText, 10) > CUSTOM_CREDITS.max;
  return (
    <div className="co-step">
      <header className="co-head">
        <h1 className="co-title" tabIndex={-1}>
          How many credits do you need?
        </h1>
        <p className="co-lede tw-pretty">
          Credits are shared across {p.orgName}. Each review type uses one.
        </p>
      </header>

      <div className="co-packs" role="group" aria-label="Credit amount">
        {CREDIT_PACKS.map((pack) => (
          <PackTile key={pack.id} pack={pack} selected={p.selectedPack === pack.id} onSelect={() => p.onPickPack(pack.id)} />
        ))}
        <SelectTile selected={isCustom} onSelect={p.onPickCustom} className="co-pack">
          {isCustom && <CheckDisc />}
          <span className="co-pack-q">
            <b>Custom</b>
          </span>
          <span className="co-pack-p">Any amount</span>
          <span className="co-pack-e text-secondary">from {formatUsd(creditRateUsd(CUSTOM_CREDITS.min))} each</span>
          <span className="co-pack-sv">&nbsp;</span>
        </SelectTile>
      </div>

      {isCustom && (
        <div className="co-custom">
          <label className="ui-label" htmlFor="co-custom-n">
            Number of credits
          </label>
          <div className="co-custom-row">
            <Input
              ref={customRef}
              id="co-custom-n"
              inputMode="numeric"
              className="co-custom-input mono"
              value={p.customText}
              onChange={(e) => p.onCustomText(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
              aria-invalid={p.customError ? true : undefined}
              aria-describedby="co-custom-help"
            />
            {p.credits !== null && !over && (
              <span className="co-custom-price mono">
                {formatUsd(customPriceUsd(p.credits))} · {formatUsd(creditRateUsd(p.credits))} each
              </span>
            )}
          </div>
          <p id="co-custom-help" className={p.customError ? "co-field-err" : over ? "co-help co-help--sales" : "co-help text-tertiary"} role={p.customError ? "alert" : undefined}>
            {over ? (
              <>
                Over {CUSTOM_CREDITS.max} credits? Talk to sales for volume pricing.{" "}
                <button type="button" className="co-link" onClick={p.onTalkToUs}>
                  Talk to us
                </button>
              </>
            ) : (
              (p.customError ?? `${CUSTOM_CREDITS.min} to ${CUSTOM_CREDITS.max} credits. The price per credit drops at each pack size.`)
            )}
          </p>
        </div>
      )}

      {p.credits !== null && (
        <div className="co-outcome" aria-live="polite">
          <div className="co-outcome-o">
            <b className="mono">{plural(Math.floor(p.credits / p.fullReviewCredits), "full review", "full reviews")}</b>
            <span className="text-secondary">Both review types on each report</span>
          </div>
          <span className="co-outcome-or text-tertiary">or</span>
          <div className="co-outcome-o">
            <b className="mono">{plural(p.credits, "single review", "single reviews")}</b>
            <span className="text-secondary">One review type on each report</span>
          </div>
        </div>
      )}

      <ul className="co-reassure">
        <li>
          <Icon name="calendar" size={16} />
          Purchased credits last {PURCHASED_LIFE_MONTHS} months
        </li>
        <li>
          <Icon name="users" size={16} />
          Shared across your organization
        </li>
        <li>
          <Icon name="receipt" size={16} />
          Receipt emailed to you
        </li>
      </ul>

      <CostBlock />

      <div className="co-actions">
        <span />
        <Button size="lg" onClick={p.onNext} iconRight="forward">
          {p.nextLabel}
        </Button>
      </div>
    </div>
  );
});

function CheckDisc() {
  return (
    <span className="co-pack-chk" aria-hidden="true">
      <Icon name="check" size={12} strokeWidth={2.5} />
    </span>
  );
}

function PackTile({ pack, selected, onSelect }: { pack: CreditPack; selected: boolean; onSelect: () => void }) {
  return (
    <SelectTile selected={selected} onSelect={onSelect} className="co-pack">
      {selected && <CheckDisc />}
      <span className="co-pack-q">
        <b className="mono">{pack.credits}</b> credits
      </span>
      <span className="co-pack-p mono">{formatUsd(pack.priceUsd)}</span>
      <span className="co-pack-e text-secondary mono">{formatUsd(pack.priceUsd / pack.credits)} each</span>
      <span className="co-pack-sv">{pack.note ?? " "}</span>
    </SelectTile>
  );
}
