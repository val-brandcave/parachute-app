"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import { useWalletStore } from "@/store";
import type { Billing } from "../useBilling";
import { SavedField, SettingsRow, SettingsSection } from "./SettingsParts";
import { addressOf } from "./settings-data";

/** Details printed on every receipt and statement, plus the documents a finance team asks for. */
export function FinanceSection({ b }: { b: Billing }) {
  const router = useRouter();
  const s = b.settings;
  const save = useWalletStore.getState().setBillingSettings;
  return (
    <SettingsSection
      title="For your finance team"
      desc="Printed on receipts and statements, and ready when procurement asks."
      action={
        <div className="bl-actions">
          <a className="ui-btn ui-btn--outline ui-btn--sm" href="/billing/realwired-w9.pdf" download="Realwired-W-9.pdf">
            Realwired W-9
          </a>
          <Button variant="outline" size="sm" onClick={() => router.push("/configure/security")}>
            Security pack
          </Button>
        </div>
      }
    >
      <SettingsRow label="PO number" desc="Shown on every receipt and statement. Leave blank if you do not use one." htmlFor="bs-po">
        <SavedField id="bs-po" label="PO number" value={s?.poNumber ?? ""} onCommit={(v) => save({ poNumber: v.trim() })} width="md" />
      </SettingsRow>
      <SettingsRow label="Tax ID (EIN)" desc="For example 12-3456789." htmlFor="bs-tax">
        <SavedField id="bs-tax" label="Tax ID" value={s?.taxId ?? ""} placeholder="12-3456789" onCommit={(v) => save({ taxId: v.trim() })} width="md" />
      </SettingsRow>
      <SettingsRow label="Billing address" desc="Where invoices and receipts are addressed." htmlFor="bs-addr">
        <SavedField
          id="bs-addr"
          label="Billing address"
          multiline
          value={addressOf(s, b.org?.id, b.org?.name)}
          onCommit={(v) => save({ billingAddress: v.trim() })}
        />
      </SettingsRow>
    </SettingsSection>
  );
}
