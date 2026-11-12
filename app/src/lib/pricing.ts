import type { CreditPackId, ReviewType, SetupSectionId, VolumeBand } from "@/types";

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

/** Credits earned per finished reward section (one full review) … */
export const EARN_REWARD_CREDITS = 2;
/** … up to this many earned credits in total (2 sections). */
export const EARN_CAP_CREDITS = 4;

/** Get started v4: sections that pay EARN_REWARD_CREDITS once all their steps are done
 *  inside the earn window. */
export const SETUP_REWARD_SECTIONS: SetupSectionId[] = ["first_review", "own_rules"];
/** Days after the trial grant (enterprise: after approval) during which setup earns credits. */
export const EARN_WINDOW_DAYS = 14;
/** At or under this many days left, the window reads "ending". */
export const EARN_ENDING_DAYS = 2;
/** At or under this balance the wallet reads "low" (PC-18). */
export const LOW_BALANCE_AT = 3;
/** Invoiced orgs: indicative billed value of one credit (placeholder for Ed). */
export const INVOICED_CREDIT_USD = 140;

/**
 * The price curve (user-approved "smooth curve", 12 Nov 2026). Price per credit is
 * CREDIT_USD up to the first anchor, then falls linearly between anchors to a floor at the
 * last one, rounded to whole dollars. Packs sit ON the curve, so a custom amount at a pack
 * size costs exactly the pack price and never more per credit than a smaller amount.
 * Anchors are [credits, $ per credit], ascending.
 */
export const PRICE_CURVE: readonly (readonly [number, number])[] = [
  [5, CREDIT_USD],
  [10, 140],
  [20, 130],
  [100, 100],
];

/** Lowest price per credit on the curve (at the last anchor and above). */
export const CREDIT_FLOOR_USD = PRICE_CURVE[PRICE_CURVE.length - 1][1];

/** Per-credit rate for any amount, read off PRICE_CURVE (whole dollars). */
export function creditRateUsd(credits: number): number {
  const [first] = PRICE_CURVE;
  if (credits <= first[0]) return first[1];
  for (let i = 1; i < PRICE_CURVE.length; i++) {
    const [x1, y1] = PRICE_CURVE[i];
    if (credits <= x1) {
      const [x0, y0] = PRICE_CURVE[i - 1];
      return Math.round(y0 + ((credits - x0) * (y1 - y0)) / (x1 - x0));
    }
  }
  return CREDIT_FLOOR_USD;
}

/** Total price for an amount: credits × the curve rate (whole dollars). */
export function customPriceUsd(credits: number): number {
  return credits * creditRateUsd(credits);
}

/** Whole-percent saving of an amount against the list price (CREDIT_USD a credit). */
export function savingPct(credits: number): number {
  return Math.round((1 - creditRateUsd(credits) / CREDIT_USD) * 100);
}

export interface CreditPack {
  id: CreditPackId;
  credits: number;
  priceUsd: number;
  /** Shown as a "Save N%" hint when set (derived from the curve). */
  note?: string;
}

const pack = (id: CreditPackId, credits: number): CreditPack => {
  const pct = savingPct(credits);
  return { id, credits, priceUsd: customPriceUsd(credits), ...(pct > 0 ? { note: `Save ${pct}%` } : {}) };
};

/** Top-up packs, priced off PRICE_CURVE ($750 / $1,400 / $2,600 today). */
export const CREDIT_PACKS: CreditPack[] = [pack("pack5", 5), pack("pack10", 10), pack("pack20", 20)];

export function packById(id: CreditPackId): CreditPack {
  return CREDIT_PACKS.find((p) => p.id === id) ?? CREDIT_PACKS[0];
}

/** Custom amounts in checkout. Above `max`, buyers are sent to sales. */
export const CUSTOM_CREDITS = { min: 1, max: 100 };

/**
 * The nudge toward a better rate: the smallest amount above `credits` (within
 * CUSTOM_CREDITS) whose per-credit price is lower, or null once the floor is reached.
 */
export function nextRateDrop(credits: number): { credits: number; add: number; rateUsd: number } | null {
  const now = creditRateUsd(credits);
  for (let n = Math.max(credits + 1, CUSTOM_CREDITS.min); n <= CUSTOM_CREDITS.max; n++) {
    const r = creditRateUsd(n);
    if (r < now) return { credits: n, add: n - credits, rateUsd: r };
  }
  return null;
}

/** Auto-reload defaults offered when an admin switches it on. */
export const AUTO_RELOAD_DEFAULTS: { packId: CreditPackId; below: number; monthlyCap: number } = {
  packId: "pack10",
  below: 2,
  monthlyCap: 3000,
};

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

/** On-screen labels for the volume answers, built from SALES_THRESHOLDS so 200 sits in one band only. */
export const VOLUME_BAND_LABEL: Record<VolumeBand, string> = {
  lt50: "Under 50",
  "50-200": `50–${SALES_THRESHOLDS.reportsPerMonth - 1}`,
  "200+": `${SALES_THRESHOLDS.reportsPerMonth}+`,
  unsure: "I'm not sure yet",
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

/**
 * Who waits for Realwired staff approval (RWT-1031 / ADR-009). Decided 9 Nov 2026:
 * self-serve teams are approved instantly; only orgs flagged for sales (the same
 * SALES_THRESHOLDS) wait, and they wait on the dashboard, not on a separate page.
 */
export function needsStaffApproval(profile: { teamBand: string; volumeBand: string }): boolean {
  return needsSalesFirst(profile);
}

/** Where org setup sends a new org: enterprise (book a call) or straight into self-serve.
 *  "unsure" volume routes self-serve. */
export function routeForProfile(profile: { teamBand: string; volumeBand: string }): "enterprise" | "self_serve" {
  return needsSalesFirst(profile) ? "enterprise" : "self_serve";
}

const DAY_MS = 86_400_000;

/** The setup-earning window that opens at the trial grant. Pure: `now` is passed in. */
export function earnWindow(
  grantAt: number,
  now: number,
): { endsAt: number; daysLeft: number; state: "open" | "ending" | "closed" } {
  const endsAt = grantAt + EARN_WINDOW_DAYS * DAY_MS;
  const daysLeft = Math.max(0, Math.ceil((endsAt - now) / DAY_MS));
  const state = daysLeft <= 0 ? "closed" : daysLeft <= EARN_ENDING_DAYS ? "ending" : "open";
  return { endsAt, daysLeft, state };
}

/** How many times auto-reload can fire a month within its default cap ("up to N times a month"). */
export function autoReloadTimesPerMonth(): number {
  return Math.floor(AUTO_RELOAD_DEFAULTS.monthlyCap / packById(AUTO_RELOAD_DEFAULTS.packId).priceUsd);
}

/** Indicative value of a credit balance, "~$900" style. */
export function approxValue(credits: number): string {
  return `~${formatUsd(usd(credits))}`;
}
