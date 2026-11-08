import type { CreditPackId, ReviewType, SetupStepId } from "@/types";

/**
 * Every commercial number in the self-serve flow lives HERE and nowhere else.
 * They are placeholders — Ed sets the real ones — so no screen may hard-code a
 * price, a credit count or a threshold in its copy. Import from this file.
 */

/** What one credit is worth in dollars (indicative). */
export const CREDIT_USD = 150;

/** Credits consumed per review type, per review. */
export const REVIEW_TYPE_COST: Record<ReviewType, number> = {
  technical: 1,
  administrative: 1,
};

/** Credits granted to a new workspace. */
export const TRIAL_GRANT_CREDITS = 6;
/** Days until unused trial credits lapse. */
export const TRIAL_EXPIRY_DAYS = 30;

/** Credits earned per completed reward-bearing setup step … */
export const EARN_REWARD_CREDITS = 1;
/** … up to this many earned credits in total. */
export const EARN_CAP_CREDITS = 3;

/** Setup steps that pay out a reward when first completed. Total is bounded by
 *  EARN_CAP_CREDITS regardless. */
export const SETUP_REWARD_STEPS: SetupStepId[] = ["bank_policy", "checklist", "layout"];

export interface CreditPack {
  id: CreditPackId;
  credits: number;
  priceUsd: number;
  /** Shown as a "Best value" style hint when set. */
  note?: string;
}

/** Top-up packs. Price per credit falls as the pack grows. */
export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack5", credits: 5, priceUsd: 750 },
  { id: "pack10", credits: 10, priceUsd: 1400, note: "Save 7%" },
  { id: "pack20", credits: 20, priceUsd: 2600, note: "Save 13%" },
];

export function packById(id: CreditPackId): CreditPack {
  return CREDIT_PACKS.find((p) => p.id === id) ?? CREDIT_PACKS[0];
}

/** Auto-reload defaults offered when an admin switches it on. */
export const AUTO_RELOAD_DEFAULTS: { packId: CreditPackId; below: number; monthlyCap: number } = {
  packId: "pack10",
  below: 2,
  monthlyCap: 3000,
};

/** Days an earned setup credit lasts. */
export const EARNED_LIFE_DAYS = 90;
/** Months a purchased credit lasts. */
export const PURCHASED_LIFE_MONTHS = 12;
/** Pack pre-selected in the Add credits dialog. */
export const DEFAULT_PACK_ID: CreditPackId = "pack10";

/** Above these, "Talk to us" becomes the primary path. */
export const SALES_THRESHOLDS = {
  /** reviewers at or above this count */
  reviewers: 11,
  /** reports a month at or above this count */
  reportsPerMonth: 200,
};

/** Days a security-pack link stays valid after it is sent. */
export const SECURITY_LINK_DAYS = 30;

/** Credits a set of review types costs (types de-duplicated). */
export function costFor(types: readonly ReviewType[]): number {
  return Array.from(new Set(types)).reduce((sum, t) => sum + (REVIEW_TYPE_COST[t] ?? 0), 0);
}

/** Dollar value of a credit amount. */
export function usd(credits: number): number {
  return credits * CREDIT_USD;
}

/** "$300" style formatting for a dollar amount. */
export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/** True when the org-setup answers put "Talk to us" first (11+ reviewers or 200+ reports a month). */
export function needsSalesFirst(profile: { teamBand: string; volumeBand: string }): boolean {
  return profile.teamBand === "11+" || profile.volumeBand === "200+";
}

/** Indicative value of a credit balance, "~$900" style. */
export function approxValue(credits: number): string {
  return `~${formatUsd(usd(credits))}`;
}
