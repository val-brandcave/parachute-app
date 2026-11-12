"use client";

import { motion, type Variants } from "framer-motion";
import { Button, Illustration } from "@/components/atoms";
import { dist, dur, ease, staggerFor, useMotionMode } from "@/lib/motion";
import "./paid.css";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const cents = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface NextAction {
  id: string;
  title: string;
  body: string;
  cta: string;
  primary?: boolean;
  onClick: () => void;
}

/** The auto-reload offer renders as a quiet inline note, not a button. */
const QUIET_ACTION = "reload";

/**
 * Paid (spec §5.6): a compact, centred success state. The scene (`24-scene-checkout-success`),
 * the outcome in credits, one summary card (balance before → after, paid with, valid until,
 * PO) and a centred button row. The caller decides the actions: the first is the primary
 * (a `return` makes it "Back to …"), the rest are outline, and the auto-reload offer is a
 * quiet text link under the buttons.
 */
export function PaidStep({
  credits,
  amountUsd,
  balanceAfter,
  fullReviewsAfter,
  receiptId,
  emails,
  validUntil,
  paidWith,
  poNumber,
  actions,
  historical = false,
}: {
  credits: number;
  amountUsd: number;
  /** Kept for callers; the success state shows only where the balance is now. */
  balanceBefore?: number;
  balanceAfter: number;
  fullReviewsAfter: number;
  receiptId: string;
  emails: string[];
  validUntil: string;
  paidWith: string;
  poNumber?: string;
  actions: NextAction[];
  /** An older purchase (credits have been spent since): say "was", not "is now". */
  historical?: boolean;
}) {
  const mode = useMotionMode();
  const to = emails.length > 1 ? `${emails.slice(0, -1).join(", ")} and ${emails[emails.length - 1]}` : emails[0];
  const buttons = actions.filter((a) => a.id !== QUIET_ACTION);
  const quiet = actions.find((a) => a.id === QUIET_ACTION);

  const container: Variants = {
    hidden: {},
    shown: { transition: { staggerChildren: mode === "full" ? staggerFor(4) : 0 } },
  };
  const item: Variants =
    mode === "full"
      ? {
          hidden: { opacity: 0, y: dist.enter },
          shown: { opacity: 1, y: 0, transition: { duration: dur.standard, ease: ease.enter } },
        }
      : { hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: dur.reducedFade } } };

  return (
    <motion.div
      className="co-step co-paid"
      variants={container}
      initial={mode === "off" ? false : "hidden"}
      animate="shown"
    >
      <motion.header className="co-paid-head" variants={item}>
        <div className="co-paid-art">
          <Illustration name="24-scene-checkout-success" size={192} title="Credits added to your balance" />
        </div>
        <h1 className="co-title co-paid-title" tabIndex={-1}>
          {plural(credits, "credit", "credits")} added
        </h1>
      </motion.header>

      <motion.section className="co-paid-sum" aria-label="Payment summary" variants={item}>
        {/* Everything about the payment in one table: no before → after, just where you are now. */}
        <dl className="co-paid-rows">
          <div className="co-paid-row">
            <dt>Amount paid</dt>
            <dd className="mono">{cents(amountUsd)}</dd>
          </div>
          <div className="co-paid-row">
            <dt>{historical ? "Balance after purchase" : "New balance"}</dt>
            <dd className="co-paid-stack">
              <span className="co-paid-strong mono">{plural(balanceAfter, "credit", "credits")}</span>
              {fullReviewsAfter > 0 && (
                <span className="co-paid-sub">≈ {plural(fullReviewsAfter, "full review", "full reviews")}</span>
              )}
            </dd>
          </div>
          <div className="co-paid-row">
            <dt>Paid with</dt>
            <dd>{paidWith}</dd>
          </div>
          <div className="co-paid-row">
            <dt>Receipt</dt>
            <dd className="mono">{receiptId}</dd>
          </div>
          {to && (
            <div className="co-paid-row">
              <dt>Receipt sent to</dt>
              <dd>{to}</dd>
            </div>
          )}
          <div className="co-paid-row">
            <dt>Credits valid until</dt>
            <dd>{validUntil}</dd>
          </div>
          {poNumber && (
            <div className="co-paid-row">
              <dt>PO number</dt>
              <dd className="mono">{poNumber}</dd>
            </div>
          )}
        </dl>
      </motion.section>

      <motion.nav className="co-paid-next" aria-label="What next" variants={item}>
        <div className="co-paid-btns">
          {buttons.map((a, i) => (
            <Button key={a.id} variant={i === 0 ? "primary" : "outline"} onClick={a.onClick}>
              {a.cta}
            </Button>
          ))}
        </div>
        {quiet && (
          <p className="co-paid-note tw-pretty">
            {quiet.body}{" "}
            <button type="button" className="co-paid-link" onClick={quiet.onClick}>
              {quiet.cta}
            </button>
          </p>
        )}
      </motion.nav>
    </motion.div>
  );
}

/** Copy for the auto-reload next action, from pricing.ts. */
export function autoReloadPitch(): string {
  return "Never run out mid-review.";
}
