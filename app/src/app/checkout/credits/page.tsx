"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@realwired/ui";
import { Button, Icon } from "@/components/atoms";
import type { HStep } from "@/components/molecules";
import {
  AmountStep,
  CheckoutShell,
  OrderSummary,
  PaidStep,
  PaymentStep,
  ReviewStep,
} from "@/components/organisms/checkout";
import { autoReloadPitch, type NextAction } from "@/components/organisms/checkout/PaidStep";
import type { CheckoutBlock, CheckoutStep } from "@/lib/checkout";
import { useStepVariants, type Dir } from "@/lib/motion";
import { CREDIT_USD, CUSTOM_CREDITS, PURCHASED_LIFE_MONTHS, formatUsd } from "@/lib/pricing";
import { useLockStore, useWalletStore } from "@/store";
import { FULL_REVIEW_CREDITS, fullReviewsIn, lineFor, useCheckout } from "./hooks/useCheckout";

const STEPS: HStep[] = [
  { id: "amount", label: "Amount" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Checkout" },
];
const ORDER: CheckoutStep[] = ["amount", "payment", "review", "done"];

/** Full-page checkout (spec §5.6, PC-7, PC-8). */
export default function CheckoutCreditsPage() {
  return (
    <Suspense fallback={null}>
      <Checkout />
    </Suspense>
  );
}

function backLabel(returnTo: string): string {
  if (returnTo.startsWith("/reviews/")) return "Back to your review";
  if (returnTo.startsWith("/configure/billing")) return "Back to billing";
  return "Back to where you were";
}

function Checkout() {
  const router = useRouter();
  const toast = useToast();
  const co = useCheckout();
  const { draft, step, line, form, wallet } = co;
  const variants = useStepVariants();
  const ledger = useWalletStore((s) => s.ledger);

  // ---- Direction for the step transition (forward leaves left) ----
  const [prev, setPrev] = useState<{ step: CheckoutStep; dir: Dir }>({ step, dir: 1 });
  if (prev.step !== step) {
    setPrev({ step, dir: ORDER.indexOf(step) >= ORDER.indexOf(prev.step) ? 1 : -1 });
  }
  const dir = prev.dir;

  // ---- Focus the new step's heading after a step change (not on first load) ----
  // Runs as the entering step starts its animation, so it can never steal focus from
  // something the user already clicked inside the new step.
  const firstStep = useRef(step);
  const bodyRef = useRef<HTMLDivElement>(null);
  /** A field to focus instead of the heading when the step change was a correction. */
  const pendingFocus = useRef<"card" | null>(null);
  const focusHeading = (target: CheckoutStep) => {
    if (firstStep.current === target) return;
    firstStep.current = target;
    if (pendingFocus.current === "card" && target === "payment") {
      pendingFocus.current = null;
      bodyRef.current?.querySelector<HTMLElement>("#co-cc")?.focus();
      return;
    }
    bodyRef.current?.querySelector<HTMLElement>(`[data-step="${target}"] .co-title`)?.focus({ preventScroll: true });
  };

  // ---- Lock-then-explain: a reviewer or a pending org reaching the URL ----
  const lockedOnce = useRef(false);
  useEffect(() => {
    if (lockedOnce.current || !co.block || co.block === "invoiced" || co.block === "embedded") return;
    lockedOnce.current = true;
    const lock = useLockStore.getState();
    if (co.block === "role") lock.openLock({ kind: "role", action: "buy credits", admin: co.admin?.name ?? "your organization admin" });
    else lock.openLock({ kind: "approval" });
  }, [co.block, co.admin?.name]);

  // ---- Amount: Custom field ----
  const isCustom = "credits" in draft.choice;
  const [customText, setCustomText] = useState(() => ("credits" in draft.choice ? String(draft.choice.credits) : ""));
  const [customError, setCustomError] = useState<string | null>(null);
  const customRef = useRef<HTMLInputElement>(null);
  const customN = Number.parseInt(customText, 10);
  const customValid = Number.isFinite(customN) && customN >= CUSTOM_CREDITS.min && customN <= CUSTOM_CREDITS.max;
  const lineOk = isCustom && !customValid ? null : line;

  // Keep the field in step with the URL when it changes from outside (Back, reload).
  const urlCredits = "credits" in draft.choice ? draft.choice.credits : null;
  const [seenUrlCredits, setSeenUrlCredits] = useState(urlCredits);
  if (seenUrlCredits !== urlCredits) {
    setSeenUrlCredits(urlCredits);
    if (urlCredits !== null && urlCredits !== customN) setCustomText(String(urlCredits));
  }

  const onCustomText = (t: string) => {
    setCustomText(t);
    setCustomError(null);
    const n = Number.parseInt(t, 10);
    if (Number.isFinite(n) && n >= CUSTOM_CREDITS.min && n <= CUSTOM_CREDITS.max) co.setChoice({ credits: n });
  };
  const onPickCustom = () => {
    const n = customValid ? customN : line.credits;
    setCustomText(String(n));
    setCustomError(null);
    co.setChoice({ credits: n });
    window.setTimeout(() => customRef.current?.focus(), 60);
  };

  // ---- Payment: new card check ----
  const [cardError, setCardError] = useState<string | null>(null);
  const cardRef = useRef<HTMLInputElement>(null);

  // ---- Review: pay (paying = agreeing; the terms line sits under Pay) ----
  const [paying, setPaying] = useState(false);
  /** Synchronous in-flight flag: a second click lands before `paying` re-renders. */
  // It holds the epoch of the attempt in flight; leaving Paid (browser Back into this same
  // mounted page) bumps the epoch, which re-arms Pay for a new order.
  const payInFlight = useRef<number | null>(null);
  const [payEpoch, setPayEpoch] = useState(0);
  const [lastStep, setLastStep] = useState(step);
  if (lastStep !== step) {
    setLastStep(step);
    if (lastStep === "done") {
      setPayEpoch((e) => e + 1);
      setPaying(false);
    }
  }

  // A saved card skips Payment. Until the buyer opens it, Payment is reachable, not done.
  const [visitedPayment, setVisitedPayment] = useState(step === "payment");
  if (step === "payment" && !visitedPayment) setVisitedPayment(true);

  const talkToUs = () =>
    toast({ title: "We’ll be in touch", description: "A Realwired specialist will reach out about pricing and invoicing.", tone: "success" });

  const amountNext = () => {
    if (isCustom && !customValid) {
      setCustomError(
        customN > CUSTOM_CREDITS.max
          ? `Over ${CUSTOM_CREDITS.max} credits? Talk to sales for volume pricing.`
          : `Enter ${CUSTOM_CREDITS.min} to ${CUSTOM_CREDITS.max} credits.`,
      );
      customRef.current?.focus();
      return;
    }
    // A saved card skips Payment; the stepper still opens it.
    co.go(co.savedCard && form?.payWith !== "new" ? "review" : "payment");
  };

  const paymentNext = () => {
    if (form?.payWith === "new" && form.cardNumber.replace(/\D/g, "").length < 12) {
      setCardError("Enter the card number");
      cardRef.current?.focus();
      return;
    }
    setCardError(null);
    co.go("review");
  };

  const onPay = async () => {
    if (payInFlight.current === payEpoch || paying) return;
    if (co.block === "approval" || co.block === "role") {
      const lock = useLockStore.getState();
      if (co.block === "role") lock.openLock({ kind: "role", action: "buy credits", admin: co.admin?.name ?? "your organization admin" });
      else lock.openLock({ kind: "approval" });
      return;
    }
    if (form?.payWith === "new" && form.cardNumber.replace(/\D/g, "").length < 12) {
      // A reload keeps "new card" but never the digits: ask for them again on Payment.
      setCardError("Enter the card number");
      pendingFocus.current = "card";
      co.go("payment");
      return;
    }
    if (draft.error === "card") {
      // Prototype decline: back to Payment, where the callout explains.
      co.go("payment");
      return;
    }
    payInFlight.current = payEpoch;
    setPaying(true);
    let receiptId: string;
    let settingsFailed = false;
    try {
      ({ receiptId, settingsFailed } = await co.pay());
    } catch {
      // purchase() itself failed: nothing was bought, so a retry is safe.
      payInFlight.current = null;
      setPaying(false);
      toast({ title: "Payment didn’t go through", description: "Nothing was charged. Try again.", tone: "danger" });
      return;
    }
    // Paid. Stay busy until the step changes; never re-arm Pay on this page.
    co.finish(receiptId);
    if (settingsFailed) {
      toast({
        title: "Payment went through",
        description: "Some billing details didn’t save. Check them in Billing settings.",
        tone: "warning",
      });
    }
  };

  // ---- Summary CTA per step ----
  const summaryCta =
    step === "amount"
      ? co.savedCard && form?.payWith !== "new"
        ? { label: "Continue to checkout", run: amountNext }
        : { label: "Next: Payment", run: amountNext }
      : step === "payment"
        ? { label: "Continue to checkout", run: paymentNext }
        : { label: `Pay ${formatUsd(line.priceUsd)}`, run: onPay };

  // ---- Stepper ----
  const idx = ORDER.indexOf(step);
  const skippedPayment = co.savedCard && form?.payWith !== "new" && !visitedPayment;
  const done =
    step === "done"
      ? STEPS.map((s) => s.id)
      : STEPS.filter((s, i) => i < idx && !(s.id === "payment" && skippedPayment)).map((s) => s.id);
  const onSelectStep = step === "done" ? undefined : (id: string) => id !== step && co.go(id as CheckoutStep);

  const cardLast4 = co.settings?.cardLast4;
  const payingWith =
    form?.payWith === "new"
      ? form.cardNumber.replace(/\D/g, "").length >= 4
        ? `Card ending in ${form.cardNumber.replace(/\D/g, "").slice(-4)}`
        : "A new card"
      : cardLast4
        ? `Visa ending in ${cardLast4}`
        : "A new card";
  const emails = [form?.email, form?.receiptCc].map((e) => e?.trim()).filter((e): e is string => !!e);

  const fullAfter = lineOk ? fullReviewsIn(wallet.balance + lineOk.credits) : null;

  // ---- Blocked viewers: a plain explanation, never a blank page ----
  if (co.block) {
    return (
      <CheckoutShell steps={STEPS} current="amount" done={[]} onExit={co.exit}>
        <BlockedNote
          kind={co.block}
          admin={co.admin?.name}
          onExplain={() => {
            const lock = useLockStore.getState();
            if (co.block === "role") lock.openLock({ kind: "role", action: "buy credits", admin: co.admin?.name ?? "your organization admin" });
            else if (co.block === "approval") lock.openLock({ kind: "approval" });
          }}
          onExit={co.exit}
        />
      </CheckoutShell>
    );
  }

  let body: React.ReactNode = null;
  if (step === "amount") {
    body = (
      <AmountStep
        ref={customRef}
        orgName={co.org.name}
        selectedPack={"pack" in draft.choice ? draft.choice.pack : null}
        customText={customText}
        customError={customError}
        credits={lineOk ? lineOk.credits : null}
        fullReviewCredits={FULL_REVIEW_CREDITS}
        onPickPack={(id) => {
          setCustomError(null);
          co.setChoice({ pack: id });
        }}
        onPickCustom={onPickCustom}
        onCustomText={onCustomText}
        onTalkToUs={talkToUs}
      />
    );
  } else if (step === "payment" && form) {
    body = (
      <PaymentStep
        form={form}
        onChange={(patch) => {
          if ("cardNumber" in patch || "payWith" in patch) setCardError(null);
          co.setForm(patch);
        }}
        savedCardLast4={co.savedCard && cardLast4 ? cardLast4 : null}
        savedCardExpiry={co.settings?.cardExpiry}
        cardholder={co.user.name}
        declined={draft.error === "card"}
        cardError={cardError}
        cardRef={cardRef}
        autoReloadOn={!!co.settings?.autoReload}
      />
    );
  } else if (step === "review" && form) {
    body = (
      <ReviewStep
        line={line}
        validUntil={co.validUntil}
        payingWith={payingWith}
        receiptTo={emails.join(", ")}
        poNumber={form.poNumber.trim()}
        autoReload={form.autoReload || !!co.settings?.autoReload}
        onChangePayment={() => co.go("payment")}
        onTurnOnAutoReload={() => co.setForm({ autoReload: true })}
      />
    );
  } else if (step === "done" && co.paidEntry) {
    const e = co.paidEntry;
    const credits = e.credits;
    const after = wallet.balance;
    const at = ledger.indexOf(e);
    const laterPurchase = at >= 0 && ledger.slice(at + 1).some((x) => x.orgId === e.orgId && x.kind === "purchase");
    const paidLine = e.packId ? lineFor({ pack: e.packId }) : lineFor({ credits });
    // Three cards (spec §5.6): the primary (way back when there is a `return`, else Start a
    // review), View receipt, then Set up auto-reload only if it was skipped. Start a review
    // fills the third slot after a `return` that isn't a review.
    const start: NextAction = {
      id: "start",
      title: "Start a review",
      body: "Upload a report and run Technical, Administrative or both.",
      cta: "Start a review",
      primary: !draft.hasReturn,
      onClick: () => router.push("/launchpad"),
    };
    const actions: NextAction[] = [
      draft.hasReturn
        ? {
            id: "back",
            title: backLabel(draft.returnTo),
            body: draft.returnTo.startsWith("/reviews/")
              ? "Review setup opens where you left it, with the same review types selected."
              : "Pick up where you left off.",
            cta: backLabel(draft.returnTo),
            primary: true,
            onClick: () => router.push(co.returnHref),
          }
        : start,
      {
        id: "receipt",
        title: "View receipt",
        body: "Download the PDF for your records or forward it to accounts payable.",
        cta: "View receipt",
        onClick: () => e.receiptId && useWalletStore.getState().openReceipt(e.receiptId),
      },
    ];
    if (!co.settings?.autoReload) {
      actions.push({
        id: "reload",
        title: "Set up auto-reload",
        body: autoReloadPitch(),
        cta: "Set up auto-reload",
        onClick: () => router.push("/configure/billing?tab=settings"),
      });
    } else if (draft.hasReturn && !draft.returnTo.startsWith("/reviews/")) {
      actions.push(start);
    }
    body = (
      <PaidStep
        credits={credits}
        amountUsd={e.amountUsd ?? paidLine.priceUsd}
        // The purchase's own before → after (ledger as it stood then). The live balance can be
        // lower if reviews ran since (e.g. reopening an older receipt), so it isn't used here.
        balanceBefore={co.paidBefore ?? Math.max(0, after - credits)}
        balanceAfter={co.paidBefore != null ? co.paidBefore + credits : after}
        fullReviewsAfter={fullReviewsIn(co.paidBefore != null ? co.paidBefore + credits : after)}
        // "was" only when a later purchase exists: the latest pack reads as a fresh purchase
        // (the prototype's Paid state seeds spends after it; that is staging, not history).
        historical={laterPurchase}
        receiptId={e.receiptId ?? ""}
        emails={[co.settings?.billingEmail, co.settings?.receiptCc].filter((x): x is string => !!x)}
        validUntil={co.validUntil}
        paidWith={cardLast4 ? `Visa ending in ${cardLast4}` : "Card"}
        poNumber={co.settings?.poNumber}
        actions={actions}
      />
    );
  }

  const aside =
    step === "done" ? undefined : (
      <OrderSummary
        line={lineOk}
        balance={wallet.balance}
        fullReviewsAfter={fullAfter}
        listRateUsd={CREDIT_USD}
        cta={summaryCta.label}
        ctaBusy={step === "review" && paying}
        onCta={summaryCta.run}
        onTalkToUs={talkToUs}
        terms={
          step === "review" ? (
            <>
              By paying you agree to the{" "}
              <a href="#" className="co-link" onClick={(ev) => ev.preventDefault()}>
                credit terms
              </a>
              . Purchased credits last {PURCHASED_LIFE_MONTHS} months and are shared across {co.org.name}.
            </>
          ) : undefined
        }
      />
    );

  return (
    <CheckoutShell
      steps={STEPS}
      current={step === "done" ? "review" : step}
      done={done}
      onSelectStep={onSelectStep}
      onExit={co.exit}
      aside={aside}
    >
      <div ref={bodyRef} className="co-body">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="co-stage"
            data-step={step}
            onAnimationStart={(def) => def === "center" && focusHeading(step)}
          >
            {body}
          </motion.div>
        </AnimatePresence>
      </div>
    </CheckoutShell>
  );
}

function BlockedNote({
  kind,
  admin,
  onExplain,
  onExit,
}: {
  kind: Exclude<CheckoutBlock, null>;
  admin?: string;
  onExplain: () => void;
  onExit: () => void;
}) {
  const first = admin?.split(" ")[0];
  const copy =
    kind === "role"
      ? {
          icon: "lock" as const,
          title: "Only an admin can buy credits",
          body: `Credits are bought by your organization's admin${admin ? `, ${admin}` : ""}. Ask ${first ?? "them"} to add credits; you'll see the new balance as soon as they do.`,
          cta: first ? `Ask ${first}` : "Ask your admin",
        }
      : kind === "approval"
        ? {
            icon: "hourglass-high" as const,
            title: "Credits open after your setup call",
            body: "Realwired is setting up your workspace. You can buy credits once it is approved.",
            cta: "Why am I waiting?",
          }
        : kind === "embedded"
          ? {
              icon: "file-invoice" as const,
              title: "Credits are billed through YouConnect",
              body: "This session runs inside YouConnect, so reviews are billed there and there are no credits to buy here.",
              cta: null,
            }
          : {
              icon: "file-invoice" as const,
              title: "Your organization is billed monthly",
              body: "Reviews are invoiced at the end of each month, so there are no credits to buy.",
              cta: null,
            };
  return (
    <div className="co-step co-blocked">
      <span className="co-blocked-ic" aria-hidden="true">
        <Icon name={copy.icon} size={22} />
      </span>
      <h1 className="co-title" tabIndex={-1}>
        {copy.title}
      </h1>
      <p className="co-lede tw-pretty">{copy.body}</p>
      <div className="co-blocked-acts">
        {copy.cta && <Button onClick={onExplain}>{copy.cta}</Button>}
        <Button variant="outline" onClick={onExit}>
          Exit checkout
        </Button>
      </div>
    </div>
  );
}
