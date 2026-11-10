"use client";

import { useState } from "react";
import { useToast } from "@realwired/ui";
import { Button } from "@/components/atoms";
import { useWalletStore } from "@/store";
import type { Billing } from "../useBilling";
import { SavedField, SettingsRow, SettingsSection } from "./SettingsParts";

/** Who receives receipts, and who handles billing. */
export function ContactSection({ b }: { b: Billing }) {
  const toast = useToast();
  const [handing, setHanding] = useState(false);
  const contactId = b.org?.billingContactId;

  const pick = async (id: string) => {
    await b.patchOrg({ billingContactId: id });
    const who = b.users.find((u) => u.id === id)?.name ?? "that member";
    setHanding(false);
    toast({ title: "Billing handed over", description: `${who} is now the billing contact.`, tone: "success" });
  };

  return (
    <SettingsSection title="Billing contact" desc="Receipts and statements go to this person.">
      <SettingsRow label="Billing email" desc="Receipts, statements and invoices are sent here." htmlFor="bs-email">
        <SavedField
          id="bs-email"
          label="Billing email"
          inputMode="email"
          value={b.settings?.billingEmail ?? ""}
          placeholder="billing@example.com"
          onCommit={async (v) => {
            if (!v.includes("@")) return;
            await useWalletStore.getState().setPaymentMethod({ billingEmail: v.trim() });
            toast({ title: "Billing email updated", description: `Receipts now go to ${v.trim()}.`, tone: "success" });
          }}
        />
      </SettingsRow>
      <SettingsRow label="Billing is handled by" desc="They can add credits and change these settings.">
        <div className="bs-handed">
          <strong>{b.userName(contactId) ?? "Not set"}</strong>
          {!handing && (
            <Button variant="outline" size="sm" onClick={() => setHanding(true)}>
              Hand billing to someone else
            </Button>
          )}
        </div>
        {handing && (
          <ul className="bl-people bs-people">
            {b.users
              .filter((u) => u.status !== "deactivated")
              .map((u) => (
                <li key={u.id}>
                  <button type="button" className="bl-person" disabled={u.id === contactId} onClick={() => pick(u.id)}>
                    <span>{u.name}</span>
                    <span className="bl-what-s">{u.id === contactId ? "Current contact" : u.role.replace("_", " ")}</span>
                  </button>
                </li>
              ))}
            <li>
              <Button variant="ghost" size="sm" onClick={() => setHanding(false)}>
                Cancel
              </Button>
            </li>
          </ul>
        )}
      </SettingsRow>
    </SettingsSection>
  );
}
