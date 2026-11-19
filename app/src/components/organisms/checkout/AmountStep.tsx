"use client";

import { forwardRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CreditChip, Icon, Input } from "@/components/atoms";
import { SelectTile } from "@/components/molecules";
import { dist, dur, ease, useMotionMode } from "@/lib/motion";
import {
  CREDIT_FLOOR_USD,
  CREDIT_PACKS,
  CREDIT_USD,
  CUSTOM_CREDITS,
  PURCHASED_LIFE_MONTHS,
  creditRateUsd,
  customPriceUsd,
  formatUsd,
  nextRateDrop,
  savingPct,
  type CreditPack,
} from "@/lib/pricing";
import type { CreditPackId } from "@/types";
import { CostBlock } from "./CostBlock";
import "./amount.css";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Step 1 (spec §5.6 Amount): pack cards + Custom, each card showing what it buys in
 * reviews; Custom opens a stepper with live price feedback. Reassurance and the cost block
 * follow. No illustration on this step. Every number comes from lib/pricing.ts.
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
  }
>(function AmountStep(p, customRef) {
  const isCustom = p.selectedPack === null;
  const typed = Number.parseInt(p.customText, 10);
  const over = isCustom && typed > CUSTOM_CREDITS.max;
  const customN = isCustom ? p.credits : null;

  /** Arrow keys move focus between the cards (Enter / Space picks), like a radio row. */
  const onCardsKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const cards = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>(".amt-card"));
    const at = cards.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    e.preventDefault();
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? cards.length - 1 : (at + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + cards.length) % cards.length;
    cards[next]?.focus();
  };

  /** − / + and ↑ / ↓: step from the current amount, clamped to CUSTOM_CREDITS. */
  const stepBy = (d: number) => {
    const base = Number.isFinite(typed) ? Math.min(Math.max(typed, CUSTOM_CREDITS.min - 1), CUSTOM_CREDITS.max + 1) : CUSTOM_CREDITS.min - d;
    const n = Math.min(CUSTOM_CREDITS.max, Math.max(CUSTOM_CREDITS.min, base + d));
    p.onCustomText(String(n));
  };

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

      <div className="amt-cards" role="group" aria-label="Credit amount" onKeyDown={onCardsKey}>
        {CREDIT_PACKS.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            fullReviewCredits={p.fullReviewCredits}
            selected={p.selectedPack === pack.id}
            onSelect={() => p.onPickPack(pack.id)}
          />
        ))}
        <SelectTile selected={isCustom} onSelect={p.onPickCustom} className="amt-card amt-card--custom">
          <CardTop selected={isCustom} />
          {isCustom ? (
            <>
              <span className="amt-hero">
                <RollingNumber value={customN ?? (Number.isFinite(typed) ? typed : null)} />
              </span>
              <span className="amt-unit">{customN === 1 ? "credit" : "credits"}</span>
              <span className="amt-foot text-secondary">Custom amount</span>
            </>
          ) : (
            <>
              <span className="amt-hero amt-hero--word">Custom</span>
              <span className="amt-unit">
                {CUSTOM_CREDITS.min} to {CUSTOM_CREDITS.max} credits
              </span>
              <span className="amt-foot text-secondary">As low as {formatUsd(CREDIT_FLOOR_USD)} each</span>
            </>
          )}
        </SelectTile>
      </div>

      {isCustom && (
        <CustomPanel
          ref={customRef}
          text={p.customText}
          credits={customN}
          over={over}
          error={p.customError}
          fullReviewCredits={p.fullReviewCredits}
          onText={p.onCustomText}
          onStep={stepBy}
          onTalkToUs={p.onTalkToUs}
        />
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
    </div>
  );
});

/** Credit glyph (the wallet, as in the credits pill; never a coin) + the selected check. */
function CardTop({ selected }: { selected: boolean }) {
  return (
    <span className="amt-top" aria-hidden="true">
      <span className="amt-glyph">
        <Icon name="wallet" size={16} />
      </span>
      {selected && (
        <span className="amt-chk">
          <Icon name="check" size={12} strokeWidth={2.5} />
        </span>
      )}
    </span>
  );
}

/** "5 full · 10 single" with the full wording for screen readers. */
function ReviewsLine({ credits, fullReviewCredits }: { credits: number; fullReviewCredits: number }) {
  const full = Math.floor(credits / fullReviewCredits);
  const said = `${plural(full, "full review", "full reviews")} or ${plural(credits, "single review", "single reviews")}`;
  return (
    <span className="amt-reviews" title={`${said}. A full review uses both review types.`}>
      <Icon name="reviews" size={14} aria-hidden />
      <span aria-hidden="true">
        <RollingNumber value={full} /> full · <RollingNumber value={credits} /> single
      </span>
      <span className="ui-visually-hidden">{said}</span>
    </span>
  );
}

function PackCard({
  pack,
  fullReviewCredits,
  selected,
  onSelect,
}: {
  pack: CreditPack;
  fullReviewCredits: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <SelectTile selected={selected} onSelect={onSelect} className="amt-card">
      <CardTop selected={selected} />
      <span className="amt-hero mono">{pack.credits}</span>
      <span className="amt-unit">credits</span>
      <span className="amt-price mono">{formatUsd(pack.priceUsd)}</span>
      <span className="amt-each">
        <span className="mono text-secondary">{formatUsd(creditRateUsd(pack.credits))} each</span>
        {pack.note && (
          <CreditChip tone="free" size="sm">
            {pack.note}
          </CreditChip>
        )}
      </span>
      <ReviewsLine credits={pack.credits} fullReviewCredits={fullReviewCredits} />
    </SelectTile>
  );
}

/**
 * Custom: a compact − [ n ] + stepper on the left, live feedback on the right (total,
 * per-credit rate, saving vs list, and a nudge to the next lower rate).
 */
const CustomPanel = forwardRef<
  HTMLInputElement,
  {
    text: string;
    credits: number | null;
    over: boolean;
    error: string | null;
    fullReviewCredits: number;
    onText: (t: string) => void;
    onStep: (d: number) => void;
    onTalkToUs: () => void;
  }
>(function CustomPanel(p, ref) {
  const mode = useMotionMode();
  const n = p.credits;
  const nudge = n !== null ? nextRateDrop(n) : null;
  const saved = n !== null ? n * CREDIT_USD - customPriceUsd(n) : 0;
  return (
    <motion.div
      className="amt-custom"
      initial={mode === "full" ? { opacity: 0, y: dist.enter } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0, transition: { duration: mode === "full" ? dur.standard : dur.reducedFade, ease: ease.enter } }}
    >
      <div className="amt-entry">
        <label className="ui-label" htmlFor="co-custom-n">
          Number of credits
        </label>
        {/* DS-candidate: NumberStepper — compact − [n] + entry; @realwired/ui has no stepper. */}
        <div className="amt-stepper">
          <button type="button" className="amt-step-btn" aria-label="One credit fewer" onClick={() => p.onStep(-1)}>
            <Icon name="minus" size={16} />
          </button>
          <Input
            ref={ref}
            id="co-custom-n"
            inputMode="numeric"
            className="amt-step-input mono"
            value={p.text}
            onChange={(e) => p.onText(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                p.onStep(e.key === "ArrowUp" ? 1 : -1);
              }
            }}
            aria-invalid={p.error ? true : undefined}
            aria-describedby="co-custom-help"
          />
          <button type="button" className="amt-step-btn" aria-label="One credit more" onClick={() => p.onStep(1)}>
            <Icon name="add" size={16} />
          </button>
        </div>
        <p
          id="co-custom-help"
          className={p.error ? "co-field-err" : p.over ? "co-help co-help--sales" : "co-help text-tertiary"}
          role={p.error ? "alert" : undefined}
        >
          {p.over ? (
            <>
              Over {CUSTOM_CREDITS.max} credits? Talk to sales for volume pricing.{" "}
              <button type="button" className="co-link" onClick={p.onTalkToUs}>
                Talk to us
              </button>
            </>
          ) : (
            (p.error ?? `${CUSTOM_CREDITS.min} to ${CUSTOM_CREDITS.max} credits. The more you add, the less each costs.`)
          )}
        </p>
      </div>

      {n !== null && (
        <div className="amt-feedback">
          <span className="amt-total">
            <RollingNumber value={customPriceUsd(n)} format={formatUsd} />
          </span>
          <div className="amt-pills">
            <CreditChip tone="credit">
              <RollingNumber value={creditRateUsd(n)} format={formatUsd} /> each
            </CreditChip>
            {saved > 0 ? (
              <CreditChip tone="free">
                Save <RollingNumber value={saved} format={formatUsd} /> · {savingPct(n)}%
              </CreditChip>
            ) : (
              <CreditChip tone="money">List price</CreditChip>
            )}
          </div>
          {nudge ? (
            <button type="button" className="amt-nudge" onClick={() => p.onText(String(nudge.credits))}>
              <Icon name="arrow-up-right" size={14} />
              Add {nudge.add} more → {formatUsd(nudge.rateUsd)} each
            </button>
          ) : (
            <span className="amt-nudge amt-nudge--floor">
              Lowest rate.{" "}
              <button type="button" className="co-link" onClick={p.onTalkToUs}>
                Need more than {CUSTOM_CREDITS.max}?
              </button>
            </span>
          )}
          <ReviewsLine credits={n} fullReviewCredits={p.fullReviewCredits} />
          <span className="ui-visually-hidden" aria-live="polite">
            {`${plural(n, "credit", "credits")}, ${formatUsd(customPriceUsd(n))}, ${formatUsd(creditRateUsd(n))} each.`}
          </span>
        </div>
      )}
    </motion.div>
  );
});

/**
 * A number that slides on change (up when it grows, down when it shrinks), on the motion
 * tokens. Static under reduced / off motion.
 * DS-candidate: RollingNumber — animated numeric value; the DS has no counter primitive.
 */
function RollingNumber({ value, format = String }: { value: number | null; format?: (n: number) => string }) {
  const mode = useMotionMode();
  const [seen, setSeen] = useState(value);
  const [dir, setDir] = useState(1);
  if (seen !== value) {
    setDir(value !== null && seen !== null && value < seen ? -1 : 1);
    setSeen(value);
  }
  const text = value === null ? "—" : format(value);
  if (mode !== "full") return <>{text}</>;
  return (
    <span className="amt-roll">
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.span
          key={text}
          className="amt-roll-v"
          custom={dir}
          variants={{
            enter: (d: number) => ({ opacity: 0, y: dist.icon * d }),
            center: { opacity: 1, y: 0, transition: { duration: dur.quick, ease: ease.enter } },
            exit: (d: number) => ({ opacity: 0, y: -dist.icon * d, transition: { duration: dur.quick, ease: ease.exit } }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
