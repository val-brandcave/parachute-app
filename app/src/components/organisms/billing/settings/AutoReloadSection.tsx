"use client";

import { useState } from "react";
import { Chip, Switch } from "@/components/atoms";
import { SettingVideoHint } from "@/components/organisms/SettingVideoHint";
import { AUTO_RELOAD_DEFAULTS, CREDIT_PACKS, formatUsd, packById } from "@/lib/pricing";
import { useWalletStore } from "@/store";
import { DEMO_TODAY } from "../billing-data";
import type { Billing } from "../useBilling";
import { SavedField, SelectField, SettingsRow, SettingsSection } from "./SettingsParts";

const BELOW_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n} credit${n === 1 ? "" : "s"}` }));

/** Auto-reload: off until someone opts in. Changes save as you make them. */
export function AutoReloadSection({ b }: { b: Billing }) {
  const s = b.settings;
  const on = !!s?.autoReload;
  const pack = packById(s?.reloadPackId ?? AUTO_RELOAD_DEFAULTS.packId);
  const below = s?.reloadBelow ?? AUTO_RELOAD_DEFAULTS.below;
  const cap = s?.monthlyCap ?? AUTO_RELOAD_DEFAULTS.monthlyCap;
  const hasCard = s?.paymentMethod === "card" && !!s.cardLast4;
  // First flip of the switch shows "Buying credits and auto-reload" once; it never gates the switch.
  const [flipped, setFlipped] = useState(false);
  const [needCard, setNeedCard] = useState(false);
  const set = useWalletStore.getState().setAutoReload;
  const monthStart = new Date(new Date(DEMO_TODAY).getFullYear(), new Date(DEMO_TODAY).getMonth(), 1).getTime();
  const used = b.ledger
    .filter((e) => e.kind === "purchase" && e.auto && e.createdAt >= monthStart)
    .reduce((n, e) => n + (e.amountUsd ?? 0), 0);

  const toggle = (next: boolean) => {
    if (next && !hasCard) {
      // Lock-then-explain: say why instead of silently ignoring the click.
      setNeedCard(true);
      return;
    }
    setNeedCard(false);
    setFlipped(true);
    void set({ autoReload: next, reloadPackId: pack.id, reloadBelow: below, monthlyCap: cap });
  };

  return (
    <SettingsSection title="Auto-reload" desc="Keeps a review from stopping at Start. Charged to your default card.">
      <SettingsRow
        label="Add credits automatically"
        desc={
          hasCard ? (
            `We email ${s?.billingEmail ?? "your billing contact"} after every top-up.`
          ) : (
            <span id="bs-ar-reason">Needs a card on file. Add one under Payment method above.</span>
          )
        }
      >
        <div className="bs-inline">
          {on && <Chip tone="pass">On</Chip>}
          <Switch
            checked={on}
            onChange={toggle}
            label="Auto-reload"
            ariaDisabled={!hasCard && !on}
            describedBy={!hasCard && !on ? "bs-ar-reason" : undefined}
          />
        </div>
      </SettingsRow>
      {needCard && !hasCard && (
        <p className="bs-desc" role="status" data-testid="ar-need-card">
          Add a card to turn on auto-reload. <button
            type="button"
            className="hm-link"
            onClick={() =>
              Array.from(document.querySelectorAll("h2"))
                .find((h) => h.textContent === "Payment method")
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          >
            Go to Payment method
          </button>
          .
        </p>
      )}
      <SettingVideoHint hintId="auto-reload" videoId="buying-credits" show={flipped} />
      {on && (
        <>
          <SettingsRow label="When the balance falls below" desc="A top-up is bought at Start when you are under this.">
            <SelectField label="Reload threshold" value={below} options={BELOW_OPTIONS} onChange={(n) => void set({ reloadBelow: n })} width="md" />
          </SettingsRow>
          <SettingsRow label="Add this pack" desc="Credits added each time it triggers.">
            <SelectField
              label="Pack to add"
              value={pack.id}
              options={CREDIT_PACKS.map((p) => ({ value: p.id, label: `${p.credits} credits (~${formatUsd(p.priceUsd)})` }))}
              onChange={(id) => void set({ reloadPackId: id })}
              width="lg"
            />
          </SettingsRow>
          <SettingsRow
            label="Monthly limit"
            desc={`This month: ${formatUsd(used)} of ${formatUsd(cap)} used by auto-reload. It stops reloading at the limit.`}
            htmlFor="bs-cap"
          >
            <SavedField
              id="bs-cap"
              label="Monthly limit in dollars"
              prefix="$"
              inputMode="numeric"
              width="sm"
              value={String(cap)}
              onCommit={(v) => {
                const n = Number(v.replace(/[^0-9]/g, ""));
                return set({ monthlyCap: n > 0 ? n : AUTO_RELOAD_DEFAULTS.monthlyCap });
              }}
            />
          </SettingsRow>
        </>
      )}
    </SettingsSection>
  );
}
