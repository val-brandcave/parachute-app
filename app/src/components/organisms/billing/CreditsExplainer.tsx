"use client";

import { Accordion, useToast } from "@realwired/ui";
import { Button, Illustration } from "@/components/atoms";
import { CostBlock } from "@/components/organisms/checkout";
import { CUSTOM_CREDITS, LOW_BALANCE_AT, PURCHASED_LIFE_MONTHS } from "@/lib/pricing";
import { useOrgStore } from "@/store";
import "./billing-states.css";
import type { Billing } from "./useBilling";

/** `/configure/billing?tab=credits` (spec §5.7): what a credit buys, what happens at zero and at expiry,
 *  the FAQ, and the way to sales. Same page for every role; the sales panel only for wallet admins
 *  (it moves to the top while the organization waits for approval). */
export function CreditsExplainer({ b }: { b: Billing }) {
  const toast = useToast();
  const talk = () => {
    void useOrgStore.getState().requestSales();
    toast({ title: "We’ll be in touch", description: "A Realwired specialist will reach out about invoicing.", tone: "success" });
  };
  const sales = b.isAdmin && !b.invoiced;
  const panel = (
    <section className="card bl-card bl-sales" aria-labelledby="hcw-sales-t">
      <div className="bl-sales-main">
        <h2 className="bl-h" id="hcw-sales-t">
          Need an invoice or a larger volume?
        </h2>
        <p className="bl-body tw-pretty">
          Monthly invoicing, {CUSTOM_CREDITS.max}+ credits, or a contract for several branches.
        </p>
        <div>
          <Button variant="outline" size="sm" onClick={talk}>
            Talk to sales
          </Button>
        </div>
      </div>
      <Illustration name="12b-talk-to-sales" size={96} />
    </section>
  );

  return (
    <div className="us bl-stack hcw">
      {sales && b.wallet.held && panel}
      <section className="card bl-card hcw-hero">
        <div className="hcw-hero-text">
          <h2 className="hcw-title">How credits work</h2>
          <p className="hcw-lead tw-pretty">
            One credit pays for one review type on one appraisal. Buy them in packs, share them across your team, and see exactly where each one
            went.
          </p>
        </div>
        <Illustration name="20-scene-how-credits-work" size={420} className="hcw-scene" />
      </section>

      <CostBlock title="What a review costs" showLink={false} />

      <div className="hcw-two">
        <section className="card bl-card hcw-rule" aria-labelledby="hcw-zero-t">
          <div className="hcw-rule-tx">
            <h2 className="bl-h hcw-h" id="hcw-zero-t">
              When you reach zero
            </h2>
            <p className="bl-body tw-pretty">
              Reviews already running finish as normal. New reviews wait until someone adds credits. Admins get an email when {LOW_BALANCE_AT}{" "}
              credits are left.
            </p>
          </div>
          <Illustration name="02b-wallet-top-up" size={112} className="hcw-rule-ill" />
        </section>
        <section className="card bl-card hcw-rule" aria-labelledby="hcw-exp-t">
          <div className="hcw-rule-tx">
            <h2 className="bl-h hcw-h" id="hcw-exp-t">
              When credits expire
            </h2>
            <p className="bl-body tw-pretty">
              {`Purchased credits last ${PURCHASED_LIFE_MONTHS} months from the day you buy them. Trial and earned credits don’t expire. We use the credits that expire soonest first.`}
            </p>
          </div>
          <Illustration name="14-credits-expiring" size={112} className="hcw-rule-ill" />
        </section>
      </div>

      <section aria-labelledby="hcw-faq-t" className="bl-stack">
        <h2 className="bl-section" id="hcw-faq-t">
          Questions
        </h2>
        <Accordion
          className="card hcw-faq"
          items={[
            {
              id: "used",
              title: "When is a credit used?",
              children: "When a review starts. If a review fails to run on our side, the credit goes back to your balance.",
            },
            {
              id: "who",
              title: "Who can spend credits?",
              children:
                "Anyone on your team who starts a review. Credits come from one shared balance, and Billing shows who used what.",
            },
            {
              id: "invoice",
              title: "Can we pay by invoice instead of card?",
              children: "Yes, for larger teams. Talk to us and Realwired sets up monthly invoicing.",
            },
            {
              id: "unused",
              title: "What happens to unused credits?",
              children: `Purchased credits last ${PURCHASED_LIFE_MONTHS} months; trial and earned credits stay until you use them.`,
            },
            { id: "appraisers", title: "Do appraisers need an account?", children: "No. Only your reviewers sign in." },
          ]}
        />
      </section>

      {sales && !b.wallet.held && panel}
    </div>
  );
}
