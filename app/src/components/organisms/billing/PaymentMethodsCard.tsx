"use client";

import Link from "next/link";
import { useToast } from "@realwired/ui";
import { Button, Icon } from "@/components/atoms";
import { SALES_THRESHOLDS } from "@/lib/pricing";
import { cardExpFor } from "./billing-data";
import type { Billing } from "./useBilling";

/** Overview card: the card on file (or an empty state) plus the invoice route for big teams. */
export function PaymentMethodsCard({ b }: { b: Billing }) {
  const toast = useToast();
  const s = b.settings;
  const last4 = s?.paymentMethod === "card" ? s.cardLast4 : undefined;
  const exp = cardExpFor(b.org?.id, last4);
  return (
    <section className="card bl-card">
      <div className="bl-row">
        <div>
          <h2 className="bl-h">Payment methods</h2>
          <p className="bl-sub">Charged when you add credits.</p>
        </div>
        <Link href="/configure/billing?tab=payment" className="hm-link">
          Manage
        </Link>
      </div>
      {last4 ? (
        <div className="bl-method">
          <span className="bl-brand">VISA</span>
          <span className="bl-method-n">
            •••• {last4}
            {exp && <> · exp {exp}</>}
          </span>
          <span className="su-pill su-pill--sm">Default</span>
        </div>
      ) : (
        <div className="bl-method bl-method--empty">
          <Icon name="credit-card" size={18} />
          <span className="bl-method-n">No card on file</span>
          <Link className="hm-link" href="/configure/billing?tab=payment">
            Add a card
          </Link>
        </div>
      )}
      <div className="bl-method bl-method--dashed">
        <Icon name="bank" size={16} />
        <span className="bl-method-n">Invoice or ACH for {SALES_THRESHOLDS.reviewers}+ reviewers</span>
        <Button variant="ghost" size="sm" onClick={() => toast({ title: "We will be in touch", description: "Realwired will email you about invoicing.", tone: "info" })}>
          Talk to us
        </Button>
      </div>
    </section>
  );
}
