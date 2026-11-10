import { CREDIT_PACKS, CREDIT_USD, formatUsd } from "@/lib/pricing";

/** Prepared, not offered. Plan numbers are working placeholders; dollars derive from CREDIT_USD. */
export const TEAM_ALLOWANCE_CREDITS = 20;
/** Discount applied to the monthly allowance against pay-as-you-go list value. */
export const TEAM_ALLOWANCE_DISCOUNT = 0.1;

export interface Plan {
  id: "payg" | "team" | "enterprise";
  name: string;
  price: string;
  priceNote: string;
  tag: string;
  features: string[];
  cta: string;
  ctaKind: "current" | "unavailable" | "talk";
}

export function buildPlans(): Plan[] {
  const sizes = CREDIT_PACKS.map((p) => p.credits).join(", ").replace(/, (\d+)$/, " or $1");
  const prices = CREDIT_PACKS.map((p) => `~${formatUsd(p.priceUsd)}`).join(" / ");
  const teamUsd = Math.round(TEAM_ALLOWANCE_CREDITS * CREDIT_USD * (1 - TEAM_ALLOWANCE_DISCOUNT));
  return [
    {
      id: "payg",
      name: "Pay as you go",
      price: `~${formatUsd(CREDIT_USD)} a credit [var]`,
      priceNote: "Buy packs when you need them.",
      tag: "Current",
      features: [`Packs of ${sizes} credits (${prices} [var])`, "Auto-reload is optional", "No monthly commitment"],
      cta: "Your plan",
      ctaKind: "current",
    },
    {
      id: "team",
      name: "Team allowance",
      price: `~${formatUsd(teamUsd)} a month [var]`,
      priceNote: `${TEAM_ALLOWANCE_CREDITS} credits a month.`,
      tag: "Not offered",
      features: [`${TEAM_ALLOWANCE_CREDITS} credits a month`, "Unused credits roll over one month", "One monthly charge"],
      cta: "Not available yet",
      ctaKind: "unavailable",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Invoice or ACH",
      priceNote: "For 11+ reviewers or around 200 reports a month.",
      tag: "Invoiced",
      features: ["Invoice or ACH", "Named contact", "Monthly review"],
      cta: "Talk to us",
      ctaKind: "talk",
    },
  ];
}
