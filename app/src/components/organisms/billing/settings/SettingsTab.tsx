"use client";

import type { useBilling } from "../useBilling";
import "../billing-settings.css";
import { AlertsSection } from "./AlertsSection";
import { AutoReloadSection } from "./AutoReloadSection";
import { ContactSection } from "./ContactSection";
import { FinanceSection } from "./FinanceSection";
import { PaymentSection } from "./PaymentSection";
import { TermsSection } from "./TermsSection";

/** Billing > Settings for org admins. Invoiced orgs get terms instead of card and auto-reload. */
export function SettingsTab({ b, invoiced }: { b: ReturnType<typeof useBilling>; invoiced: boolean }) {
  return (
    <div className="bl-stack">
      {invoiced ? (
        <TermsSection b={b} />
      ) : (
        <>
          <PaymentSection b={b} />
          <AutoReloadSection b={b} />
        </>
      )}
      <AlertsSection b={b} invoiced={invoiced} />
      <ContactSection b={b} />
      <FinanceSection b={b} />
    </div>
  );
}
