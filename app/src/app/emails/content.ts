import {
  CREDIT_PACKS,
  CREDIT_USD,
  EARN_CAP_CREDITS,
  EARN_REWARD_CREDITS,
  TRIAL_GRANT_CREDITS,
  DEFAULT_PACK_ID,
  approxValue,
  costFor,
  formatUsd,
} from "@/lib/pricing";
import { checkoutHref } from "@/lib/checkout";
import { slotLabel } from "@/lib/call-slots";
import { seedCreditLedger } from "@/data/seed/credit-ledger.seed";

/**
 * PROTOTYPE e-mail copy. Edit the words here; the layout is in EmailCard.tsx.
 * Every number is imported from pricing.ts or the HCB seed ledger, so the
 * e-mails never disagree with the app.
 *
 * Inline emphasis: wrap text in **double asterisks** to make it bold.
 */

export type EmailBlock =
  | { kind: "p"; text: string }
  | { kind: "code"; value: string }
  | { kind: "rows"; rows: [label: string, value: string][] }
  /** `href`: where the live e-mail's button goes (the preview renders it as a link). */
  | { kind: "cta"; label: string; href?: string }
  | { kind: "small"; text: string };

export interface EmailSpec {
  /** Anchor: `/emails#receipt`. */
  id: string;
  /** Short name for the filter chips. */
  chip: string;
  /** Wordmark at the right of the e-mail header. */
  product: "Realwired ID" | "Parachute";
  from: string;
  fromAddress: string;
  to: string;
  subject: string;
  blocks: EmailBlock[];
}

const FROM_PARACHUTE = { from: "Parachute", fromAddress: "no-reply@parachute.realwired.com" };
const TO = "dana.reyes@harborcb.com";
const FIRST = "Dana";
const ORG = "Harbor Community Bank";
const BILLING_EMAIL = "billing@harborcb.com";

const ledger = seedCreditLedger.filter((e) => e.orgId === "org-hcb");
const balanceThrough = (id: string) => {
  const idx = ledger.findIndex((e) => e.id === id);
  return ledger.slice(0, idx + 1).reduce((s, e) => s + e.credits, 0);
};
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const day = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const dayYear = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const time = (t: number) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const sep = "·";
const fullReview = costFor(["technical", "administrative"]);
const sampleCount = Math.floor(TRIAL_GRANT_CREDITS / fullReview);
const packList = CREDIT_PACKS.map((p) => `${p.credits}`).join(", ").replace(/, (\d+)$/, " or $1");
const packPrices = CREDIT_PACKS.map((p) => formatUsd(p.priceUsd)).join(", ");

// "You earned a free review": Harbor finishes "Run your first review" (section reward, Get started v4).
// The seed ledger has no earned row (Harbor is mid-setup), so the e-mail shows the reward on top of today's balance.
const earnedAt = ledger[ledger.length - 1].createdAt;
const earnedBalance = ledger.reduce((s, e) => s + e.credits, 0) + EARN_REWARD_CREDITS;
const rewardReviews = Math.floor(EARN_REWARD_CREDITS / costFor(["technical", "administrative"]));
const remainingReviews = Math.floor(Math.max(EARN_CAP_CREDITS - EARN_REWARD_CREDITS, 0) / EARN_REWARD_CREDITS);

// Receipt: the 220 Commerce Way debit.
const receiptRow = ledger.find((e) => e.receiptId === "RCT-40918")!;
const receiptBalance = balanceThrough(receiptRow.id);
const receiptCredits = Math.abs(receiptRow.credits);

const LOW_BALANCE = 1;

// Every "Add credits" e-mail button opens checkout on the default pack (no `return`:
// Exit checkout falls back to Billing).
const ADD_CREDITS_HREF = checkoutHref({ pack: DEFAULT_PACK_ID });

// Setup call: the demo slot is Fri 13 Nov, 10:00 AM Eastern.
const CALL_AT = Date.UTC(2026, 10, 13, 15, 0);
const CALL_WHEN = slotLabel(CALL_AT);

export const emails: EmailSpec[] = [
  {
    id: "verify",
    chip: "Verify code",
    product: "Realwired ID",
    from: "Realwired ID",
    fromAddress: "no-reply@id.realwired.com",
    to: TO,
    subject: "Your Parachute verification code",
    blocks: [
      { kind: "p", text: `Hi ${FIRST},` },
      { kind: "p", text: `Enter this code to verify ${TO}. It expires in 10 minutes.` },
      { kind: "code", value: "481 062" },
      { kind: "cta", label: "Verify email" },
      {
        kind: "small",
        text: "If you didn't create a Parachute account, you can ignore this email. Nobody can use the code without access to this inbox.",
      },
    ],
  },
  {
    id: "ready",
    chip: "Org is ready",
    product: "Parachute",
    ...FROM_PARACHUTE,
    to: TO,
    subject: `${ORG} is ready`,
    blocks: [
      { kind: "p", text: `Hi ${FIRST},` },
      { kind: "p", text: `${ORG} is set up on Parachute. Your trial is open and nothing needs a card.` },
      {
        kind: "rows",
        rows: [
          ["Trial credits", `${TRIAL_GRANT_CREDITS} ${sep} ${approxValue(TRIAL_GRANT_CREDITS)} value`],
          ["Full reviews", `About ${sampleCount}`],
        ],
      },
      {
        kind: "p",
        text: "Start with your first review: upload a commercial appraisal and see every figure checked. Then upload your credit policy, publish a compliance checklist and brand your workbook.",
      },
      { kind: "cta", label: "Go to Parachute" },
      {
        kind: "small",
        text: `Credits that expire soonest are used first; trial credits go last. 1 credit = 1 review type on 1 report, about ${formatUsd(CREDIT_USD)}.`,
      },
    ],
  },
  {
    id: "earned",
    chip: "Review earned",
    product: "Parachute",
    ...FROM_PARACHUTE,
    to: TO,
    subject: `You earned ${plural(rewardReviews, "free review", "free reviews")}`,
    blocks: [
      { kind: "p", text: `Hi ${FIRST},` },
      {
        kind: "p",
        text: `You finished "Run your first review" on ${ORG}, so we added ${plural(EARN_REWARD_CREDITS, "credit", "credits")} to your balance: ${plural(rewardReviews, "full review", "full reviews")}, free.`,
      },
      {
        kind: "rows",
        rows: [
          [`${day(earnedAt)} ${sep} ${time(earnedAt)}`, "Setup reward"],
          ["Run your first review", `+${EARN_REWARD_CREDITS} ${sep} $0`],
          ["Paid from", "Earned"],
          ["Balance", `${plural(earnedBalance, "credit", "credits")} ${sep} ${approxValue(earnedBalance)}`],
        ],
      },
      { kind: "cta", label: "Back to Get started" },
      {
        kind: "small",
        text: `Earned credits don't expire. Finish "Make it your bank's review" to earn ${plural(remainingReviews, "more free review", "more free reviews")}.`,
      },
    ],
  },
  {
    id: "low-balance",
    chip: "Low balance",
    product: "Parachute",
    ...FROM_PARACHUTE,
    to: TO,
    subject: `${plural(LOW_BALANCE, "credit", "credits")} left on ${ORG}`,
    blocks: [
      { kind: "p", text: `Hi ${FIRST},` },
      {
        kind: "p",
        text: `${ORG} has **${plural(LOW_BALANCE, "credit", "credits")} left** (${approxValue(LOW_BALANCE)}). A full review uses ${fullReview} credits, so the next full review will wait until credits are added.`,
      },
      {
        kind: "rows",
        rows: [
          ["Balance", `${plural(LOW_BALANCE, "credit", "credits")} ${sep} ${approxValue(LOW_BALANCE)}`],
          ["Full review", `${fullReview} credits ${sep} ${approxValue(fullReview)}`],
          ["Auto-reload", "Off"],
        ],
      },
      { kind: "cta", label: "Add credits", href: ADD_CREDITS_HREF },
      {
        kind: "small",
        text: `Packs of ${packList} credits (${packPrices}). Only an organization admin can buy. Uploads stay saved as drafts until the balance covers them.`,
      },
    ],
  },
  {
    id: "zero-balance",
    chip: "Zero balance",
    product: "Parachute",
    ...FROM_PARACHUTE,
    to: TO,
    subject: `${ORG} is out of credits`,
    blocks: [
      { kind: "p", text: `Hi ${FIRST},` },
      {
        kind: "p",
        text: `${ORG} has **0 credits left**. A full review uses ${fullReview} credits, so new reviews wait at Start until credits are added. Uploads stay saved as drafts and nothing is charged.`,
      },
      {
        kind: "rows",
        rows: [
          ["Balance", "0 credits"],
          ["Full review", `${fullReview} credits ${sep} ${approxValue(fullReview)}`],
          ["Auto-reload", "Off"],
        ],
      },
      { kind: "cta", label: "Add credits", href: ADD_CREDITS_HREF },
      {
        kind: "small",
        text: `Packs of ${packList} credits (${packPrices}). Only an organization admin can buy.`,
      },
    ],
  },
  {
    id: "receipt",
    chip: "Receipt",
    product: "Parachute",
    ...FROM_PARACHUTE,
    to: TO,
    subject: "Receipt · 220 Commerce Way",
    blocks: [
      { kind: "p", text: `Hi ${FIRST},` },
      { kind: "p", text: "The review of 220 Commerce Way, Norfolk, VA is ready. Here is the receipt for your loan file." },
      {
        kind: "rows",
        rows: [
          ["Receipt", dayYear(receiptRow.createdAt)],
          ["Loan", receiptRow.loanNo ?? ""],
          [
            "Review types",
            (receiptRow.reviewTypes ?? [])
              .map((t) => (t === "technical" ? "Technical" : "Administrative"))
              .join(" + "),
          ],
          [
            "Credits",
            `${receiptCredits} ${sep} ${(receiptRow.amountUsd ?? 0) === 0 ? `$0, list ${approxValue(receiptCredits)}` : approxValue(receiptCredits)}`,
          ],
          [
            "Paid from",
            (receiptRow.paidFrom ?? []).map((s) => s[0].toUpperCase() + s.slice(1)).join(", ") || "Credits",
          ],
          ["Balance after", plural(receiptBalance, "credit", "credits")],
        ],
      },
      { kind: "cta", label: "Download PDF" },
      {
        kind: "small",
        text: `Re-scans after send-back are included. Receipts also go to ${BILLING_EMAIL}.`,
      },
    ],
  },
  {
    id: "call-booked",
    chip: "Call booked",
    product: "Parachute",
    ...FROM_PARACHUTE,
    to: TO,
    subject: `Your setup call is booked: ${CALL_WHEN}`,
    blocks: [
      { kind: "p", text: `Hi ${FIRST},` },
      {
        kind: "p",
        text: `Your twenty-minute setup call for ${ORG} is booked. Realwired's onboarding team will confirm the account on the call and run your first review with you.`,
      },
      {
        kind: "rows",
        rows: [
          ["When", `${CALL_WHEN} ${sep} Eastern Time`],
          ["Length", "20 minutes"],
          ["Trial credits", `${plural(TRIAL_GRANT_CREDITS, "credit", "credits")} ${sep} open once the account is confirmed`],
        ],
      },
      { kind: "cta", label: "Open Parachute" },
      {
        kind: "small",
        text: "Until then you can upload your policy and invite your team. To change the time, reply to this e-mail.",
      },
    ],
  },
  {
    id: "enterprise-confirmed",
    chip: "Account confirmed",
    product: "Parachute",
    ...FROM_PARACHUTE,
    to: TO,
    subject: `${ORG} is confirmed`,
    blocks: [
      { kind: "p", text: `Hi ${FIRST},` },
      {
        kind: "p",
        text: `Thanks for the call. ${ORG} is confirmed on Parachute and your trial credits are open.`,
      },
      {
        kind: "rows",
        rows: [
          ["Trial credits", `${TRIAL_GRANT_CREDITS} ${sep} ${approxValue(TRIAL_GRANT_CREDITS)} value`],
          ["Full reviews", `About ${sampleCount}`],
          ["Billing", "Set up on the call"],
        ],
      },
      { kind: "cta", label: "Go to Parachute" },
      {
        kind: "small",
        text: `Credits that expire soonest are used first; trial credits go last. 1 credit = 1 review type on 1 report, about ${formatUsd(CREDIT_USD)}.`,
      },
    ],
  },
];

/** Used by the band copy. */
export const EMAILS_NOTE =
  "Realwired-branded transactional e-mails. Keycloak sends the verify code; Parachute sends the rest.";
