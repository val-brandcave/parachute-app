"use client";

import { useToast } from "@realwired/ui";
import { Button, Illustration } from "@/components/atoms";
import { AUTO_RELOAD_DEFAULTS, autoReloadTimesPerMonth, formatUsd, packById } from "@/lib/pricing";
import { useWalletStore } from "@/store";
import "./billing-states.css";
import type { Billing } from "./useBilling";

/**
 * "Never stop at Start": the fix beside the low-balance warning (spec §5.8). Offers the
 * default reload (pack, trigger and cap all from pricing.ts) and turns it on in one click
 * when a card is on file; otherwise it hands over to Settings, where the card lives.
 */
export function AutoReloadOffer({ b, onSettings }: { b: Billing; onSettings: () => void }) {
  const toast = useToast();
  const pack = packById(AUTO_RELOAD_DEFAULTS.packId);
  const card = b.settings?.paymentMethod === "card" && b.settings.cardLast4 ? `Visa ending in ${b.settings.cardLast4}` : null;
  const times = autoReloadTimesPerMonth();

  const turnOn = () => {
    if (!card) return onSettings();
    void useWalletStore.getState().setBillingSettings({
      autoReload: true,
      reloadPackId: AUTO_RELOAD_DEFAULTS.packId,
      reloadBelow: AUTO_RELOAD_DEFAULTS.below,
      monthlyCap: AUTO_RELOAD_DEFAULTS.monthlyCap,
    });
    toast({
      title: "Auto-reload is on",
      description: `${pack.credits} credits are added when the balance drops below ${AUTO_RELOAD_DEFAULTS.below}.`,
      tone: "success",
    });
  };

  return (
    <section className="card bl-card bl-offer" aria-labelledby="bl-offer-t">
      <div className="bl-offer-head">
        <div className="bl-offer-tx">
          <h2 className="bl-h" id="bl-offer-t">
            Never stop at Start
          </h2>
          <p className="bl-body tw-pretty">
            Auto-reload adds credits to {card ?? "your card"}{" "}
            before you run out, so reviewers aren&rsquo;t blocked mid-week.
          </p>
        </div>
        <Illustration name="14-credits-expiring" size={96} className="bl-offer-ill" />
      </div>
      <div className="bl-offer-opt">
        <b>
          {pack.credits} credits when below {AUTO_RELOAD_DEFAULTS.below}
        </b>
        <span className="bl-sub">
          {formatUsd(pack.priceUsd)} each time · up to {times} times a month
        </span>
      </div>
      <div className="bl-row bl-row--tight bl-row--start">
        <Button size="sm" onClick={turnOn}>
          {card ? "Turn on auto-reload" : "Add a card to turn on"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onSettings}>
          Change amount
        </Button>
      </div>
    </section>
  );
}
