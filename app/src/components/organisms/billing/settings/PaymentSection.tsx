"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/atoms";
import { cardExpFor } from "../billing-data";
import type { Billing } from "../useBilling";
import { AddCardForm } from "./AddCardForm";
import { SettingsRow, SettingsSection } from "./SettingsParts";

/** The card on file, with replace and add. Card details never reach Parachute. */
export function PaymentSection({ b }: { b: Billing }) {
  const s = b.settings;
  const last4 = s?.paymentMethod === "card" ? s.cardLast4 : undefined;
  const exp = cardExpFor(b.org?.id, last4);
  const [adding, setAdding] = useState(false);
  return (
    <SettingsSection title="Payment method" desc={`Charged when ${b.org?.name ?? "your organization"} adds credits.`}>
      <SettingsRow label="Card on file" desc="Used for top-ups and auto-reload.">
        {adding ? (
          <AddCardForm b={b} onDone={() => setAdding(false)} />
        ) : (
          <div className="bs-card-line">
            {last4 ? (
              <div className="bl-method bs-method">
                <span className="bl-brand">VISA</span>
                <span className="bl-method-n">
                  <strong>Visa •••• {last4}</strong>
                  <span className="bl-what-s">
                    {exp ? `Expires ${exp}, ` : ""}added by {b.userName(b.org?.billingContactId) ?? "your admin"}
                  </span>
                </span>
                <span className="su-pill su-pill--sm">Default</span>
              </div>
            ) : (
              <div className="bl-method bs-method bl-method--empty">
                <Icon name="credit-card" size={18} />
                <span className="bl-method-n">No card on file</span>
              </div>
            )}
            <Button variant="outline" size="sm" iconLeft={last4 ? "refresh" : "add"} onClick={() => setAdding(true)}>
              {last4 ? "Replace card" : "Add a card"}
            </Button>
          </div>
        )}
        {!adding && (
          <p className="bl-note bl-lock bs-lock">
            <Icon name="lock" size={13} /> Card details are collected by our payment provider; Parachute never stores them.
          </p>
        )}
      </SettingsRow>
    </SettingsSection>
  );
}
