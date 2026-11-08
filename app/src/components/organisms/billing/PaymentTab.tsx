"use client";

import { useState } from "react";
import { useToast } from "@realwired/ui";
import { Button, Icon, Input, Label } from "@/components/atoms";
import { useWalletStore } from "@/store";
import { AutoReloadCard } from "./AutoReloadCard";
import { cardExpFor, rememberCardExp } from "./billing-data";
import type { Billing } from "./useBilling";

const ADDRESSES: Record<string, string[]> = {
  "org-hcb": ["Harbor Community Bank", "500 Granby Street, Suite 1200", "Norfolk, VA 23510"],
  "org-cedar": ["Cedar Ridge Community Bank", "74 Mill Street", "Cedar Ridge, VA 24101"],
  "org-001": ["Meridian Trust Bank, N.A.", "1 Meridian Plaza", "Richmond, VA 23219"],
};

const digits = (v: string) => v.replace(/\D/g, "");

/** Inline card form. Prototype only: accepts anything well-formed. Card data never reaches Parachute. */
function AddCardForm({ b, onDone }: { b: Billing; onDone: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [num, setNum] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const valid = name.trim().length > 1 && digits(num).length >= 13 && /^\d{2}\s?\/\s?\d{2}$/.test(exp.trim()) && digits(cvc).length >= 3;

  const save = async () => {
    const last4 = digits(num).slice(-4);
    rememberCardExp(b.org?.id, exp.replace(/\s/g, ""));
    await useWalletStore.getState().setPaymentMethod({ paymentMethod: "card", cardLast4: last4 });
    toast({ title: "Card saved", description: `Visa •••• ${last4} is now your default card.`, tone: "success" });
    onDone();
  };

  return (
    <form
      className="bl-cardform"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void save();
      }}
    >
      <div className="field">
        <Label htmlFor="bl-cc-name">Name on card</Label>
        <Input id="bl-cc-name" autoComplete="cc-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <Label htmlFor="bl-cc-num">Card number</Label>
        <Input id="bl-cc-num" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" value={num} onChange={(e) => setNum(e.target.value)} />
      </div>
      <div className="bl-cardform-row">
        <div className="field">
          <Label htmlFor="bl-cc-exp">Expiry</Label>
          <Input id="bl-cc-exp" autoComplete="cc-exp" placeholder="MM/YY" value={exp} onChange={(e) => setExp(e.target.value)} />
        </div>
        <div className="field">
          <Label htmlFor="bl-cc-cvc">CVC</Label>
          <Input id="bl-cc-cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value)} />
        </div>
      </div>
      <p className="bl-note bl-lock">
        <Icon name="lock" size={13} /> Card details are collected by our payment provider; Parachute never stores them.
      </p>
      <div className="bl-actions">
        <Button variant="ghost" type="button" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid}>
          Save card
        </Button>
      </div>
    </form>
  );
}

function BillingContact({ b }: { b: Billing }) {
  const toast = useToast();
  const email = b.settings?.billingEmail ?? "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(email);
  const [handing, setHanding] = useState(false);
  const address = ADDRESSES[b.org?.id ?? ""] ?? [b.org?.name ?? "Your organization"];
  const contactId = b.org?.billingContactId;

  const saveEmail = async () => {
    await useWalletStore.getState().setPaymentMethod({ billingEmail: draft.trim() });
    setEditing(false);
    toast({ title: "Billing email updated", description: `Receipts now go to ${draft.trim()}.`, tone: "success" });
  };

  const pick = async (id: string) => {
    await b.patchOrg({ billingContactId: id });
    const who = b.users.find((u) => u.id === id)?.name ?? "that member";
    setHanding(false);
    toast({ title: "Billing handed over", description: `${who} is now the billing contact.`, tone: "success" });
  };

  return (
    <section className="card bl-card">
      <div className="bl-row">
        <div>
          <h2 className="bl-h">Billing contact</h2>
          <p className="bl-sub">Receipts and statements go here.</p>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" iconLeft="edit" onClick={() => { setDraft(email); setEditing(true); }}>
            Edit
          </Button>
        )}
      </div>
      <div className="bl-kv">
        <span className="bl-kv-k">Billing email</span>
        {editing ? (
          <div className="bl-inline">
            <Input aria-label="Billing email" type="email" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <Button size="sm" disabled={!draft.includes("@")} onClick={saveEmail}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <span className="bl-kv-v">{email || "Not set"}</span>
        )}
      </div>
      <div className="bl-kv">
        <span className="bl-kv-k">Billing address</span>
        <span className="bl-kv-v">
          {address.map((l) => (
            <span key={l} className="bl-line">
              {l}
            </span>
          ))}
        </span>
      </div>
      <div className="bl-kv bl-kv--rule">
        <span className="bl-kv-k">Billing is handled by</span>
        <span className="bl-kv-v">{b.userName(contactId) ?? "Not set"}</span>
        {!handing ? (
          <button type="button" className="hm-link bl-hand" onClick={() => setHanding(true)}>
            Hand billing to someone else
          </button>
        ) : (
          <ul className="bl-people">
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
          </ul>
        )}
      </div>
    </section>
  );
}

/** E2: auto-reload, the card on file, billing email, address and who handles billing. */
export function PaymentTab({ b }: { b: Billing }) {
  const s = b.settings;
  const last4 = s?.paymentMethod === "card" ? s.cardLast4 : undefined;
  const exp = cardExpFor(b.org?.id, last4);
  const [adding, setAdding] = useState(false);
  return (
    <div className="bl-stack">
      <AutoReloadCard b={b} wide />
      <div className="bl-split">
        <section className="card bl-card">
          <div className="bl-row">
            <div>
              <h2 className="bl-h">Payment methods</h2>
              <p className="bl-sub">Cards on file for {b.org?.name}.</p>
            </div>
            {!adding && (
              <Button variant="outline" size="sm" iconLeft="add" onClick={() => setAdding(true)}>
                {last4 ? "Replace card" : "Add a card"}
              </Button>
            )}
          </div>
          {last4 ? (
            <div className="bl-method bl-method--tall">
              <span className="bl-brand">VISA</span>
              <span className="bl-method-n">
                <strong>Visa •••• {last4}</strong>
                <span className="bl-what-s">{exp ? `exp ${exp} · ` : ""}added by {b.userName(b.org?.billingContactId) ?? "your admin"}</span>
              </span>
              <span className="su-pill su-pill--sm">Default</span>
            </div>
          ) : (
            !adding && (
              <div className="bl-method bl-method--empty">
                <Icon name="credit-card" size={18} />
                <span className="bl-method-n">No card on file</span>
              </div>
            )
          )}
          {adding && <AddCardForm b={b} onDone={() => setAdding(false)} />}
          {!adding && (
            <p className="bl-note bl-lock">
              <Icon name="lock" size={13} /> Card details are collected by our payment provider; Parachute never stores them.
            </p>
          )}
        </section>
        <BillingContact b={b} />
      </div>
    </div>
  );
}
