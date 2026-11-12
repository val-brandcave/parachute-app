"use client";

import { useState } from "react";
import { OptionCard } from "@realwired/ui";
import { Button, Icon, Illustration } from "@/components/atoms";
import { HOW_CREDITS_HREF } from "@/components/organisms/checkout";
import {
  AUTO_RELOAD_DEFAULTS,
  DEFAULT_PACK_ID,
  REVIEW_TYPE_COST,
  costFor,
  creditRateUsd,
  customPriceUsd,
  formatUsd,
  packById,
} from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { useWalletStore } from "@/store";
import type { LockReason } from "@/store/lock.store";
import type { CreditPackId, ReviewType } from "@/types";
import type { LockCtx } from "../LockDialog";
import { neededTitle } from "../LockDialog";

type CreditsReason = Extract<LockReason, { kind: "credits" }>;
type AddChoice = { credits: number } | { pack: CreditPackId };

const TYPE_LABEL: Record<ReviewType, string> = { technical: "Technical", administrative: "Administrative" };
const credits = (n: number) => `${n} ${n === 1 ? "credit" : "credits"}`;

/** "Technical and Administrative together use 2 credits" / "Technical uses 1 credit". */
function usesLine(types: ReviewType[]): string {
  const names = types.map((t) => TYPE_LABEL[t]);
  const cost = costFor(types);
  return names.length > 1
    ? `${names.join(" and ")} together use ${credits(cost)}`
    : `${names[0] ?? "This review"} uses ${credits(cost)}`;
}

/**
 * Credits variants for an admin (spec §5.5, board 2 part 2):
 * short (have > 0) → "Add N credits and run the full review" or, when Review setup
 * supplies `onRunOnly`, "Run Technical only" (PC-32); zero → the default pack vs just
 * this review, then "Continue to checkout". Every number comes from lib/pricing.
 */
export function CreditsBody({
  ctx,
  reason,
  onAdd,
  onRunOnly,
}: {
  ctx: LockCtx;
  reason: CreditsReason;
  onAdd: (choice: AddChoice) => void;
  onRunOnly?: (type: ReviewType) => void;
}) {
  return reason.have > 0 ? (
    <Short ctx={ctx} reason={reason} onAdd={onAdd} onRunOnly={onRunOnly} />
  ) : (
    <Zero ctx={ctx} reason={reason} onAdd={onAdd} />
  );
}

function Short({
  ctx,
  reason,
  onAdd,
  onRunOnly,
}: {
  ctx: LockCtx;
  reason: CreditsReason;
  onAdd: (choice: AddChoice) => void;
  onRunOnly?: (type: ReviewType) => void;
}) {
  const n = reason.needed;
  // The one type the balance still covers (Technical first, the order Review setup lists them).
  const runType = onRunOnly
    ? FULL_REVIEW_TYPES.find((t) => reason.types.includes(t) && REVIEW_TYPE_COST[t] <= reason.have)
    : undefined;
  const [pick, setPick] = useState<"add" | "run">("add");
  const autoReload = useWalletStore((s) => s.settings?.autoReload ?? false);
  const reloadPack = packById(AUTO_RELOAD_DEFAULTS.packId);
  const rate = creditRateUsd(n);
  const price = customPriceUsd(n);
  const runCost = runType ? REVIEW_TYPE_COST[runType] : 0;
  const addLabel = `Add ${credits(n)}`;
  const runLabel = runType ? `Run ${TYPE_LABEL[runType]} only (${credits(runCost)})` : "";

  return (
    <div className="lock-body">
      <span className="lock-art" data-spot="10b-locked-feature">
        <Illustration name="10b-locked-feature" size={100} />
      </span>
      <h2 className="lock-title">{neededTitle(n)}</h2>
      <p className="lock-copy">
        {usesLine(reason.types)}. {ctx.orgName} has {reason.have}.
      </p>
      <fieldset className="lock-opts">
        <legend className="ui-visually-hidden">How to go on</legend>
        <OptionCard
          type="radio"
          name="lock-credits"
          value="add"
          checked={pick === "add"}
          onChange={(c) => c && setPick("add")}
          label={`Add ${credits(n)} and run the full review`}
          meta={<span className="lock-price">{formatUsd(price)}</span>}
          description={`${n === 1 ? "One credit at the single-credit rate" : `${formatUsd(rate)} a credit`}. Checkout opens with ${credits(n)} filled in and brings you back here when it's paid.`}
        />
        {runType && (
          <OptionCard
            type="radio"
            name="lock-credits"
            value="run"
            checked={pick === "run"}
            onChange={(c) => c && setPick("run")}
            label={`Run ${TYPE_LABEL[runType]} only`}
            meta={<span className="lock-price">{credits(runCost)}</span>}
            description={`Uses your ${credits(runCost)} now.`}
          />
        )}
      </fieldset>
      {!autoReload && (
        <p className="lock-note">
          <Icon name="refresh" size={16} />
          <span>
            Running low often?{" "}
            <button type="button" className="lock-link" onClick={() => ctx.leave("/configure/billing?tab=settings")}>
              Turn on auto-reload
            </button>{" "}
            to add {credits(reloadPack.credits)} when you drop below {AUTO_RELOAD_DEFAULTS.below}.
          </span>
        </p>
      )}
      <div className="lock-acts">
        <Button variant="ghost" className="lock-acts-start" onClick={ctx.close}>
          Back
        </Button>
        {runType && onRunOnly && (
          <Button variant={pick === "run" ? "primary" : "outline"} onClick={() => onRunOnly(runType)}>
            {runLabel}
          </Button>
        )}
        <Button variant={pick === "add" ? "primary" : "outline"} onClick={() => onAdd({ credits: n })}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

function Zero({ ctx, reason, onAdd }: { ctx: LockCtx; reason: CreditsReason; onAdd: (choice: AddChoice) => void }) {
  const pack = packById(DEFAULT_PACK_ID);
  const n = reason.needed;
  const fullCost = costFor(FULL_REVIEW_TYPES);
  const fullReviews = fullCost > 0 ? Math.floor(pack.credits / fullCost) : pack.credits;
  // A pack that doesn't cover the shortfall isn't a real option; fall back to custom only.
  const packCovers = pack.credits >= n;
  const [pick, setPick] = useState<"pack" | "custom">(packCovers ? "pack" : "custom");
  const cost = costFor(reason.types);

  return (
    <div className="lock-body">
      <span className="lock-art" data-spot="01b-credits">
        <Illustration name="01b-credits" size={100} />
      </span>
      <h2 className="lock-title">You&apos;re out of credits</h2>
      <p className="lock-copy">
        This review uses {credits(cost)}. {ctx.orgName} has 0.
      </p>
      <fieldset className="lock-opts">
        <legend className="ui-visually-hidden">How many credits</legend>
        {packCovers && (
          <OptionCard
            type="radio"
            name="lock-zero"
            value={pack.id}
            checked={pick === "pack"}
            onChange={(c) => c && setPick("pack")}
            label={`${credits(pack.credits)} · ${fullReviews} full reviews`}
            meta={<span className="lock-price">{formatUsd(pack.priceUsd)}</span>}
            description={`${formatUsd(pack.priceUsd / pack.credits)} a credit`}
          />
        )}
        <OptionCard
          type="radio"
          name="lock-zero"
          value="custom"
          checked={pick === "custom"}
          onChange={(c) => c && setPick("custom")}
          label={`${credits(n)} · Just this review`}
          meta={<span className="lock-price">{formatUsd(customPriceUsd(n))}</span>}
          description={`${formatUsd(creditRateUsd(n))} a credit`}
        />
      </fieldset>
      <p className="lock-copy">
        Your report stays uploaded. It starts as soon as the payment goes through.{" "}
        <button type="button" className="lock-link" onClick={() => ctx.leave(HOW_CREDITS_HREF)}>
          How credits work
        </button>
      </p>
      <div className="lock-acts">
        <Button variant="ghost" onClick={ctx.close}>
          Not now
        </Button>
        <Button onClick={() => onAdd(pick === "pack" ? { pack: pack.id } : { credits: n })}>Continue to checkout</Button>
      </div>
    </div>
  );
}
