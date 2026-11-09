"use client";

import { useState } from "react";
import { useToast } from "@realwired/ui";
import { Button, Icon, Input, Label } from "@/components/atoms";
import { useWalletStore } from "@/store";
import { rememberCardExp } from "../billing-data";
import type { Billing } from "../useBilling";

const digits = (v: string) => v.replace(/\D/g, "");

/** Inline card form. Prototype only: accepts anything well-formed. Card data never reaches Parachute. */
export function AddCardForm({ b, onDone }: { b: Billing; onDone: () => void }) {
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
