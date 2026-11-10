"use client";

import { Icon } from "@/components/atoms";
import type { Billing } from "../useBilling";
import { SettingsRow, SettingsSection } from "./SettingsParts";

/** Invoiced orgs: no card, no wallet. Billing terms in plain words. */
export function TermsSection({ b }: { b: Billing }) {
  const email = b.settings?.billingEmail ?? "your billing contact";
  return (
    <SettingsSection title="Billing terms" desc="Set by your agreement with Realwired.">
      <SettingsRow label="How you pay" desc="Usage is billed, not bought in advance.">
        <div className="bl-method bs-method">
          <Icon name="bank" size={18} />
          <span className="bl-method-n">
            <strong>Invoiced, paid by ACH</strong>
            <span className="bl-what-s">Net 30 against each invoice</span>
          </span>
        </div>
      </SettingsRow>
      <SettingsRow label="Invoices go to" desc="Change this under Billing contact.">
        <span className="bs-value">{email}</span>
      </SettingsRow>
    </SettingsSection>
  );
}
