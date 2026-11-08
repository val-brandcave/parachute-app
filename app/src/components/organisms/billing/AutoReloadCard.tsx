"use client";

import Link from "next/link";
import { Chip, Switch } from "@/components/atoms";
import { AUTO_RELOAD_DEFAULTS, CREDIT_PACKS, formatUsd, packById } from "@/lib/pricing";
import { useWalletStore } from "@/store";
import { DEMO_TODAY } from "./billing-data";
import type { Billing } from "./useBilling";

const BELOW_OPTIONS = [1, 2, 3, 4, 5];

/** Auto-reload: off by default (opt-in). Changes save as you make them. `wide` lays the fields on one row (Payment tab). */
export function AutoReloadCard({ b, wide }: { b: Billing; wide?: boolean }) {
  const s = b.settings;
  const on = !!s?.autoReload;
  const pack = packById(s?.reloadPackId ?? AUTO_RELOAD_DEFAULTS.packId);
  const below = s?.reloadBelow ?? AUTO_RELOAD_DEFAULTS.below;
  const cap = s?.monthlyCap ?? AUTO_RELOAD_DEFAULTS.monthlyCap;
  const hasCard = s?.paymentMethod === "card" && !!s.cardLast4;
  const set = useWalletStore.getState().setAutoReload;
  const monthStart = new Date(new Date(DEMO_TODAY).getFullYear(), new Date(DEMO_TODAY).getMonth(), 1).getTime();
  const used = b.ledger
    .filter((e) => e.kind === "purchase" && e.auto && e.createdAt >= monthStart)
    .reduce((n, e) => n + (e.amountUsd ?? 0), 0);

  const toggle = (next: boolean) => {
    if (next && !hasCard) return;
    void set({
      autoReload: next,
      reloadPackId: s?.reloadPackId ?? AUTO_RELOAD_DEFAULTS.packId,
      reloadBelow: below,
      monthlyCap: cap,
    });
  };

  return (
    <section className={`card bl-card bl-reload${wide ? " bl-reload--wide" : ""}`}>
      <div className="bl-row">
        <div>
          <h2 className="bl-h">Auto-reload</h2>
          <p className="bl-sub">
            {wide ? "Keeps a review from stopping at Start. Charged to your default card." : "Keeps a review from stopping at Start."}
          </p>
        </div>
        <div className="bl-row bl-row--tight">
          {wide && on && <Chip tone="pass">On</Chip>}
          <Switch checked={on} onChange={toggle} label="Auto-reload" disabled={!hasCard && !on} />
        </div>
      </div>

      {on ? (
        <>
          <div className="bl-reload-fields">
            <span>When below</span>
            <div className="field bl-sel">
              <select aria-label="Reload threshold" value={below} onChange={(e) => void set({ reloadBelow: Number(e.target.value) })}>
                {BELOW_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <span>add</span>
            <div className="field bl-sel bl-sel--pack">
              <select aria-label="Pack to add" value={pack.id} onChange={(e) => void set({ reloadPackId: e.target.value as typeof pack.id })}>
                {CREDIT_PACKS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.credits} credits (~{formatUsd(p.priceUsd)})
                  </option>
                ))}
              </select>
            </div>
            <span>monthly cap</span>
            <div className="field bl-sel bl-sel--cap">
              <input
                aria-label="Monthly cap in dollars"
                inputMode="numeric"
                value={formatUsd(cap)}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[^0-9]/g, ""));
                  void set({ monthlyCap: n > 0 ? n : AUTO_RELOAD_DEFAULTS.monthlyCap });
                }}
              />
            </div>
          </div>
          <p className="bl-note">
            Used this month: {formatUsd(used)} of {formatUsd(cap)}. We email {s?.billingEmail ?? "your billing contact"} after every top-up.
          </p>
        </>
      ) : (
        <>
          <p className="bl-body">
            When the balance drops below {below} credits, add {pack.credits} credits (~{formatUsd(pack.priceUsd)}). At most {formatUsd(cap)} a month.
          </p>
          <div className="bl-row bl-foot">
            <span className="su-pill">Off · opt-in</span>
            {hasCard ? (
              <button type="button" className="hm-link" onClick={() => toggle(true)}>
                Turn on
              </button>
            ) : (
              <Link className="hm-link" href="/configure/billing?tab=payment">
                Add a card first
              </Link>
            )}
          </div>
        </>
      )}
    </section>
  );
}
