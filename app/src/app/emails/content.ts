import {
  CREDIT_PACKS,
  CREDIT_USD,
  EARNED_LIFE_DAYS,
  EARN_CAP_CREDITS,
  EARN_REWARD_CREDITS,
  TRIAL_GRANT_CREDITS,
  approxValue,
  costFor,
  formatUsd,
} from "@/lib/pricing";
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
  | { kind: "cta"; label: string }
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

// "You earned a credit": the bank-policy reward row.
const earnedRow = ledger.find((e) => e.kind === "earned" && e.setupStepId === "bank_policy")!;
const earnedBalance = balanceThrough(earnedRow.id);
const remainingRewards = Math.max(EARN_CAP_CREDITS - EARN_REWARD_CREDITS, 0);

// Receipt: the 220 Commerce Way debit.
const receiptRow = ledger.find((e) => e.receiptId === "RCT-40918")!;
const receiptBalance = balanceThrough(receiptRow.id);
const receiptCredits = Math.abs(receiptRow.credits);

const LOW_BALANCE = 1;

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
          ["Sample review", `Free ${sep} included`],
        ],
      },
      {
        kind: "p",
        text: "Start with the sample review: a finished review on 4410 Bayside Office Park, a fictional office building. Then add your bank policy, publish a compliance checklist and set a workbook layout.",
      },
      { kind: "cta", label: "Go to Parachute" },
      {
        kind: "small",
        text: `Trial credits are spent before any you earn or buy. 1 credit = 1 review type on 1 report, about ${formatUsd(CREDIT_USD)}.`,
      },
    ],
  },
  {
    id: "earned",
    chip: "Credit earned",
    product: "Parachute",
    ...FROM_PARACHUTE,
    to: TO,
    subject: "You earned a credit",
    blocks: [
      { kind: "p", text: `Hi ${FIRST},` },
      {
        kind: "p",
        text: `Your bank policy is active on ${ORG}. Every review now checks reports against it, and we added ${plural(EARN_REWARD_CREDITS, "credit", "credits")} to your balance.`,
      },
      {
        kind: "rows",
        rows: [
          [`${day(earnedRow.createdAt)} ${sep} ${time(earnedRow.createdAt)}`, "Setup credit"],
          ["Bank policy uploaded", `+${earnedRow.credits} ${sep} $0`],
          ["Paid from", "Earned"],
          ["Balance", `${plural(earnedBalance, "credit", "credits")} ${sep} ${approxValue(earnedBalance)}`],
        ],
      },
      { kind: "cta", label: "View billing" },
      {
        kind: "small",
        text: `Earned credits last ${EARNED_LIFE_DAYS} days. ${remainingRewards === 1 ? "One more setup step" : `${remainingRewards} more setup steps`} can each earn ${EARN_REWARD_CREDITS} credit: a published compliance checklist and a custom workbook layout.`,
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
      { kind: "cta", label: "Add credits" },
      {
        kind: "small",
        text: `Packs of ${packList} credits (${packPrices}). Only an organization admin can buy. Uploads stay saved as drafts until the balance covers them.`,
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
];

/** Used by the band copy. */
export const EMAILS_NOTE =
  "Realwired-branded transactional e-mails. Keycloak sends the verify code; Parachute sends the rest.";
