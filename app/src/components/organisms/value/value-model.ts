import { CREDIT_USD, costFor } from "@/lib/pricing";
import type { CreditLedgerEntry, Review, ReviewType } from "@/types";

/**
 * Value-strip model (PROTOTYPE). The engine does not yet report these numbers,
 * so everything is derived from the org's own reviews, findings and ledger,
 * driven by the placeholder constants below. Replace with the engine v2 API
 * sample when it exists.
 */

/** Hours a reviewer saves per completed review, by review type (placeholder). */
export const HOURS_SAVED_PER_REVIEW: Record<ReviewType, number> = {
  technical: 3,
  administrative: 1,
};

/** Arithmetic checks the engine re-runs per technical review (placeholder). */
export const MATH_CHECKS_PER_TECHNICAL = 28;
/** …and per administrative review. */
export const MATH_CHECKS_PER_ADMIN = 6;

/** A review the pipeline has finished with, so its savings count. */
export function isProcessed(r: Review): boolean {
  return r.status === "in_review" || r.status === "completed" || r.status === "returned";
}

export interface ValueFigures {
  reviews: number;
  hoursSaved: number;
  mathChecks: number;
  findings: number;
  /** Distinct reviews with at least one finding. */
  findingReviews: number;
  spendUsd: number;
  spendCredits: number;
}

const inMonth = (t: number, now: number) => {
  const a = new Date(t);
  const b = new Date(now);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
};

/**
 * @param reviews non-sample reviews of this org
 * @param ledger  this org's wallet ledger (empty for invoiced orgs)
 * @param invoiced org is billed by invoice: spend is reviews x price instead of debits
 */
export function deriveValue(
  reviews: readonly Review[],
  ledger: readonly CreditLedgerEntry[],
  invoiced: boolean,
  now: number,
): ValueFigures {
  const done = reviews.filter(isProcessed);
  const hoursSaved = done.reduce(
    (sum, r) => sum + r.reviewTypes.reduce((s, t) => s + (HOURS_SAVED_PER_REVIEW[t] ?? 0), 0),
    0,
  );
  const mathChecks = done.reduce(
    (sum, r) =>
      sum +
      r.reviewTypes.reduce(
        (s, t) => s + (t === "technical" ? MATH_CHECKS_PER_TECHNICAL : MATH_CHECKS_PER_ADMIN),
        0,
      ),
    0,
  );
  const withFindings = done.filter((r) => r.openFindings > 0);
  const findings = withFindings.reduce((s, r) => s + r.openFindings, 0);

  let spendCredits: number;
  if (invoiced) {
    spendCredits = done.reduce((s, r) => s + costFor(r.reviewTypes), 0);
  } else {
    spendCredits = ledger
      .filter((e) => e.kind === "debit" && inMonth(e.createdAt, now))
      .reduce((s, e) => s + -e.credits, 0);
  }

  return {
    reviews: done.length,
    hoursSaved,
    mathChecks,
    findings,
    findingReviews: withFindings.length,
    spendUsd: spendCredits * CREDIT_USD,
    spendCredits,
  };
}

/** "reviews x ~1.5 h per Technical review, ~0.5 h per Administrative review". */
export function methodLine(): string {
  const label: Record<ReviewType, string> = { technical: "Technical", administrative: "Administrative" };
  return (Object.keys(HOURS_SAVED_PER_REVIEW) as ReviewType[])
    .map((t) => `~${HOURS_SAVED_PER_REVIEW[t]} h per ${label[t]} review`)
    .join(", ");
}
