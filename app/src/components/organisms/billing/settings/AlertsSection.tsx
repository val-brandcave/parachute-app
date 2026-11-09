"use client";

import { Switch } from "@/components/atoms";
import { useWalletStore } from "@/store";
import type { Billing } from "../useBilling";
import { SavedField, SelectField, SettingsRow, SettingsSection } from "./SettingsParts";
import { EXPIRY_ALERT_DAYS, LOW_BELOW_OPTIONS, alertsOf } from "./settings-data";

/** Email alerts. Invoiced orgs have no balance, so only the spend alert applies. */
export function AlertsSection({ b, invoiced }: { b: Billing; invoiced: boolean }) {
  const a = alertsOf(b.settings);
  const save = useWalletStore.getState().setBillingSettings;
  const fallbackEmail = b.settings?.billingEmail ?? "the billing email";
  return (
    <SettingsSection title="Alerts" desc="Email notices so nothing surprises you. Changes save as you make them.">
      {!invoiced && (
        <>
          <SettingsRow label="Balance is low" desc="Email when the balance drops under this.">
            <div className="bs-inline">
              {a.low && (
                <SelectField
                  label="Low balance threshold"
                  value={a.lowBelow}
                  options={LOW_BELOW_OPTIONS.map((n) => ({ value: n, label: `${n} credits` }))}
                  onChange={(n) => void save({ alertLowBelow: n })}
                  width="md"
                />
              )}
              <Switch checked={a.low} onChange={(v) => void save({ alertLow: v })} label="Balance is low alert" />
            </div>
          </SettingsRow>
          <SettingsRow label="Credits are about to expire" desc={`Email ${EXPIRY_ALERT_DAYS} days before credits expire.`}>
            <div className="bs-inline">
              <Switch checked={a.expiry} onChange={(v) => void save({ alertExpiry: v })} label="Credits expiring alert" />
            </div>
          </SettingsRow>
        </>
      )}
      <SettingsRow
        label="Monthly spend passes a limit"
        desc={invoiced ? "Email when this month's billed amount passes the limit." : "Email when this month's purchases pass the limit."}
      >
        <div className="bs-inline">
          {a.spend && (
            <SavedField
              id="bs-spend"
              label="Spend alert in dollars"
              prefix="$"
              inputMode="numeric"
              width="sm"
              value={String(a.spendUsd)}
              onCommit={(v) => {
                const n = Number(v.replace(/[^0-9]/g, ""));
                return save({ alertSpendUsd: n > 0 ? n : a.spendUsd });
              }}
            />
          )}
          <Switch checked={a.spend} onChange={(v) => void save({ alertSpend: v })} label="Monthly spend alert" />
        </div>
      </SettingsRow>
      <SettingsRow
        label="Send alerts to"
        desc={`Separate several addresses with commas. Blank sends to ${fallbackEmail}.`}
        htmlFor="bs-emails"
      >
        <SavedField
          id="bs-emails"
          label="Alert recipients"
          inputMode="email"
          placeholder={b.settings?.billingEmail ?? "name@example.com"}
          value={a.emails}
          onCommit={(v) => save({ alertEmails: v.trim() })}
        />
      </SettingsRow>
    </SettingsSection>
  );
}
