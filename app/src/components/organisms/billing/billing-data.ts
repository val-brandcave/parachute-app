import { CREDIT_USD, REVIEW_TYPE_COST, formatUsd, usd } from "@/lib/pricing";
import { nextExpiring, type BalanceGrant } from "@/lib/wallet-breakdown";
import { remainingFromLedger } from "@/store/wallet.store";
import type { CreditLedgerEntry, CreditSource, Review, ReviewType } from "@/types";

/** The demo's "today" (6 Nov 2026). Prototype-only: keeps the statements and invoice copy on one month. */
export const DEMO_TODAY = new Date(2026, 10, 6, 12, 0).getTime();

export type UserName = (id?: string) => string | undefined;

/** "Dana Reyes" -> "D. Reyes". */
export function shortName(full?: string): string {
  if (!full) return "System";
  const parts = full.trim().split(/\s+/);
  return parts.length < 2 ? full : `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

export function typesLabel(types?: readonly ReviewType[]): string {
  if (!types || types.length === 0) return "";
  const t = Array.from(new Set(types));
  if (t.length > 1) return "Technical + Admin";
  return t[0] === "technical" ? "Technical" : "Admin";
}

export function sourceLabel(s: CreditSource): string {
  return s === "trial" ? "Trial" : s === "earned" ? "Earned" : "Purchased";
}

/* ---------------- Card metadata the settings row does not carry ---------------- */

const CARD_EXP_KEY = (orgId: string) => `parachute:billing:card-exp:${orgId}`;

/** Expiry of the card on file. The settings row stores only the last four digits. */
export function cardExpFor(orgId: string | null | undefined, last4?: string): string | null {
  if (typeof window !== "undefined" && orgId) {
    try {
      const v = window.localStorage.getItem(CARD_EXP_KEY(orgId));
      if (v) return v;
    } catch {
      /* private mode: fall through */
    }
  }
  return last4 === "4242" ? "08/28" : null;
}

export function rememberCardExp(orgId: string | null | undefined, exp: string) {
  if (!orgId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CARD_EXP_KEY(orgId), exp);
  } catch {
    /* ignore */
  }
}

/* ---------------- Activity ---------------- */

export interface ActivityRow {
  id: string;
  at: number;
  title: string;
  sub?: string;
  loan?: string;
  types?: string;
  credits: number;
  /** Dollars charged (0 for free runs). */
  amountUsd: number;
  /** "list ~$300" muted line under a $0 trial run. */
  listUsd?: number;
  /** Chips in the "Paid from" column. */
  from: { label: string; tone: "buy" | "trial" | "earn" | "card" | "refund" }[];
  by: string;
  /** Who did it, for the person filter. */
  byId?: string;
  receiptId?: string;
  kind: CreditLedgerEntry["kind"];
  /** Label for the row action: "Receipt", or "Details" on a failed-and-refunded run. */
  actionLabel?: "Receipt" | "Details";
}

function titleOf(e: CreditLedgerEntry, review?: Review): { title: string; sub?: string } {
  switch (e.kind) {
    case "trial_grant":
      return { title: "Trial credits granted", sub: "Welcome credits" };
    case "earned":
      return { title: "Setup credit", sub: e.note && e.note !== "Setup reward" ? e.note : "Reward for finishing a setup step" };
    case "purchase":
      return { title: e.auto ? `Auto-reload, ${e.credits} credits` : `Top-up, ${e.credits} credits` };
    case "adjustment":
      return { title: e.note ?? "Adjustment" };
    default: {
      if (review) return { title: review.propertyAddress, sub: e.kind === "refund" ? "Refunded" : review.propertyType };
      const [head, tail] = (e.note ?? "").split(" - ");
      return { title: head || (e.kind === "refund" ? "Refund" : e.loanNo ? `Review ${e.loanNo}` : "Review"), sub: tail };
    }
  }
}

export function buildActivity(
  ledger: readonly CreditLedgerEntry[],
  reviews: readonly Review[],
  userName: UserName,
  cardLast4?: string,
  /** Fold a failed run and its refund into one "±0" row. The CSV passes false to keep both raw rows. */
  pairRefunds = true,
): ActivityRow[] {
  const refunds = pairRefunds ? ledger.filter((e) => e.kind === "refund" && e.loanNo) : [];
  const pairedDebit = (e: CreditLedgerEntry) =>
    e.kind === "debit" && !!e.loanNo && refunds.some((r) => r.loanNo === e.loanNo);
  return [...ledger]
    .filter((e) => !(pairRefunds && e.kind === "refund" && e.loanNo && ledger.some((d) => d.kind === "debit" && d.loanNo === e.loanNo)))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((e): ActivityRow => {
      if (pairedDebit(e)) {
        const refund = refunds.find((r) => r.loanNo === e.loanNo)!;
        const review = e.reviewId ? reviews.find((r) => r.id === e.reviewId) : undefined;
        const { title } = titleOf(e, review);
        return {
          id: e.id,
          at: e.createdAt,
          title,
          sub: "Failed on our side · refunded",
          loan: e.loanNo,
          types: typesLabel(e.reviewTypes ?? review?.reviewTypes),
          credits: e.credits + refund.credits,
          amountUsd: 0,
          from: [{ label: "Refund", tone: "refund" }],
          by: "System",
          byId: e.actorId,
          receiptId: refund.receiptId,
          kind: "refund",
          actionLabel: "Details",
        };
      }
      const review = e.reviewId ? reviews.find((r) => r.id === e.reviewId) : undefined;
      const { title, sub } = titleOf(e, review);
      const isDebit = e.kind === "debit" || e.kind === "rescan";
      const credits = e.credits;
      const trialOnly = !!e.paidFrom && e.paidFrom.length > 0 && e.paidFrom.every((s) => s === "trial");
      const amountUsd = e.amountUsd ?? (isDebit ? usd(-credits) : 0);
      let from: ActivityRow["from"] = [];
      if (isDebit) from = (e.paidFrom ?? ["purchased"]).map((s) => ({ label: sourceLabel(s), tone: s === "trial" ? "trial" : "buy" }));
      else if (e.kind === "purchase") from = [{ label: cardLast4 ? `Visa •••• ${cardLast4}` : "Card", tone: "card" }];
      else if (e.kind === "earned") from = [{ label: "Earned", tone: "earn" }];
      else if (e.kind === "trial_grant") from = [{ label: "Trial", tone: "trial" }];
      else if (e.kind === "refund") from = [{ label: "Refund", tone: "refund" }];
      return {
        id: e.id,
        at: e.createdAt,
        title,
        sub,
        loan: e.loanNo ?? review?.loanNo,
        types: typesLabel(e.reviewTypes ?? review?.reviewTypes),
        credits,
        amountUsd: isDebit && trialOnly ? 0 : amountUsd,
        listUsd: isDebit && trialOnly ? usd(-credits) : undefined,
        from,
        by: e.actorId ? shortName(userName(e.actorId)) : "System",
        byId: e.actorId,
        receiptId: e.receiptId,
        kind: e.kind,
      };
    });
}

/** Invoiced orgs have no ledger: one row per review run, billed at list value. */
export function invoicedActivity(reviews: readonly Review[], userName: UserName): ActivityRow[] {
  const list = invoicedReviews(reviews);
  return list
    .map((r): ActivityRow => {
      const credits = r.reviewTypes.reduce((n, t) => n + (REVIEW_TYPE_COST[t] ?? 0), 0);
      return {
        id: r.id,
        at: rebasedDate(r, list),
        title: r.propertyAddress,
        sub: r.propertyType,
        loan: r.loanNo,
        types: typesLabel(r.reviewTypes),
        credits: -credits,
        amountUsd: credits * CREDIT_USD,
        from: [],
        by: shortName(userName(r.assigneeId)),
        byId: r.assigneeId,
        kind: "debit",
      };
    })
    .sort((a, b) => b.at - a.at);
}

export function signed(n: number): string {
  if (n === 0) return "±0";
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`;
}

export function dateLabel(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ---------------- CSV ---------------- */

function csvCell(v: string | number | undefined): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function activityCsv(rows: readonly ActivityRow[]): string {
  const head = ["Date", "Event", "Detail", "Loan / reference", "Review types", "Credits", "Amount (USD)", "List value (USD)", "Paid from", "By", "Receipt"];
  const lines = rows.map((r) =>
    [
      new Date(r.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      r.title,
      r.sub,
      r.loan,
      r.types,
      r.credits,
      r.amountUsd,
      r.listUsd,
      r.from.map((f) => f.label).join(" + "),
      r.by,
      r.receiptId,
    ]
      .map(csvCell)
      .join(","),
  );
  return [head.join(","), ...lines].join("\r\n");
}

export function downloadText(filename: string, text: string, mime = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------------- Expiry ---------------- */

const fmtLong = (ts: number) => new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Whole days from the demo's today to `ts` (never negative). */
export function daysUntil(ts: number): number {
  return Math.max(0, Math.ceil((ts - DEMO_TODAY) / 86_400_000));
}

/** "No expiry", or a long date. */
export function expiryLabel(g: BalanceGrant): string {
  return g.expiresAt === null ? "No expiry" : fmtLong(g.expiresAt);
}

/** One sentence: what is used first, and the next expiry (or that nothing expires soon). */
export function spendOrderSentence(grants: readonly BalanceGrant[]): string {
  const next = nextExpiring(grants);
  const firsts = ["trial", "earned"].filter((s) => grants.some((g) => g.source === s && g.remaining > 0));
  const lead =
    firsts.length === 2 ? "Trial and earned credits are used first." : firsts.length === 1 ? `${firsts[0] === "trial" ? "Trial" : "Earned"} credits are used first.` : "Oldest credits are used first.";
  if (!next) return `${lead} Nothing expires soon.`;
  const n = next.remaining;
  const what = next.source === "earned" ? `earned credit${n === 1 ? "" : "s"}` : `purchased credit${n === 1 ? "" : "s"}`;
  return `${lead} Next expiry: ${n} ${what} on ${fmtLong(next.expiresAt!)}.`;
}

export function remainingOf(ledger: readonly CreditLedgerEntry[]) {
  const r = remainingFromLedger(ledger);
  return { ...r, total: r.trial + r.earned + r.purchased };
}

/* ---------------- Statement ---------------- */

export interface StatementLine {
  id: string;
  type: string;
  by: string;
  paidFrom: string;
  credits: number;
  amountUsd: number;
}
export interface StatementGroup {
  key: string;
  loan: string;
  address: string;
  kind?: string;
  lines: StatementLine[];
}
export interface Statement {
  monthStart: number;
  monthEnd: number;
  groups: StatementGroup[];
  creditsUsed: number;
  chargedUsd: number;
  freeRuns: number;
  reviewTypes: number;
}

export function monthKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export function monthBounds(key: string) {
  const [y, m] = key.split("-").map(Number);
  return { start: new Date(y, m - 1, 1).getTime(), end: new Date(y, m, 0, 23, 59).getTime() };
}
export function monthTitle(key: string) {
  const { start } = monthBounds(key);
  return new Date(start).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const TYPE_NAME: Record<ReviewType, string> = { technical: "Technical review", administrative: "Administrative review" };

/** Statement for a wallet org: one line per review type of each debit in the month. */
export function walletStatement(
  ledger: readonly CreditLedgerEntry[],
  reviews: readonly Review[],
  userName: UserName,
  key: string,
): Statement {
  const { start, end } = monthBounds(key);
  const groups = new Map<string, StatementGroup>();
  let creditsUsed = 0;
  let chargedUsd = 0;
  let freeRuns = 0;
  let reviewTypes = 0;
  // A debit that was refunded in full (failed on our side) is not billable, so it is left off.
  const refunded = new Set(ledger.filter((e) => e.kind === "refund" && e.loanNo).map((e) => e.loanNo));
  for (const e of ledger) {
    if (e.kind !== "debit" && e.kind !== "rescan") continue;
    if (e.loanNo && refunded.has(e.loanNo)) continue;
    if (e.createdAt < start || e.createdAt > end) continue;
    const review = e.reviewId ? reviews.find((r) => r.id === e.reviewId) : undefined;
    const [noteHead] = (e.note ?? "").split(" - ");
    const loan = e.loanNo ?? review?.loanNo ?? "No reference";
    const g = groups.get(loan) ?? {
      key: loan,
      loan,
      address: review?.propertyAddress ?? noteHead ?? "",
      kind: review?.propertyType ?? undefined,
      lines: [],
    };
    const types = e.reviewTypes ?? review?.reviewTypes ?? [];
    const trialOnly = !!e.paidFrom?.length && e.paidFrom.every((s) => s === "trial");
    const perType = types.length ? Math.abs(e.credits) / types.length : Math.abs(e.credits);
    (types.length ? types : (["technical"] as ReviewType[])).forEach((t, i) => {
      const amountUsd = trialOnly ? 0 : perType * CREDIT_USD;
      g.lines.push({
        id: `${e.id}-${i}`,
        type: TYPE_NAME[t],
        by: shortName(userName(e.actorId)),
        paidFrom: trialOnly ? "Trial, free run" : (e.paidFrom ?? ["purchased"]).map(sourceLabel).join(" + "),
        credits: perType,
        amountUsd,
      });
      creditsUsed += perType;
      chargedUsd += amountUsd;
      reviewTypes += 1;
      if (trialOnly) freeRuns += 1;
    });
    groups.set(loan, g);
  }
  return { monthStart: start, monthEnd: end, groups: [...groups.values()], creditsUsed, chargedUsd, freeRuns, reviewTypes };
}

/** Statement for an invoiced org: derived from its reviews, billed at list value. */
export function invoicedStatement(reviews: readonly Review[], userName: UserName, key: string): Statement {
  const { start, end } = monthBounds(key);
  const groups: StatementGroup[] = [];
  let creditsUsed = 0;
  let chargedUsd = 0;
  let reviewTypes = 0;
  const all = invoicedReviews(reviews);
  for (const r of all) {
    // Only reviews run in this statement's month (seed dates are re-based onto the demo "today").
    const at = rebasedDate(r, all);
    if (at < start || at >= end) continue;
    const g: StatementGroup = { key: r.id, loan: r.loanNo, address: r.propertyAddress, kind: r.propertyType, lines: [] };
    for (const t of r.reviewTypes) {
      g.lines.push({
        id: `${r.id}-${t}`,
        type: TYPE_NAME[t],
        by: shortName(userName(r.assigneeId)),
        paidFrom: "Invoiced",
        credits: 1,
        amountUsd: CREDIT_USD,
      });
      creditsUsed += 1;
      chargedUsd += CREDIT_USD;
      reviewTypes += 1;
    }
    groups.push(g);
  }
  return { monthStart: start, monthEnd: end, groups, creditsUsed, chargedUsd, freeRuns: 0, reviewTypes };
}

/** Non-sample reviews of the org, newest first. */
export function invoicedReviews(reviews: readonly Review[]): Review[] {
  return reviews.filter((r) => !r.sample).sort((a, b) => b.orderedAt - a.orderedAt);
}

/** Seeded reviews sit in June; re-base them so the newest lands on the demo "today". */
export function rebasedDate(r: Review, all: readonly Review[]): number {
  const newest = Math.max(...all.map((x) => x.orderedAt));
  return DEMO_TODAY - (newest - r.orderedAt);
}

export function statementCsv(s: Statement): string {
  const head = ["Loan / reference", "Property", "Review", "Run by", "Paid from", "Credits", "Amount (USD)"];
  const lines = s.groups.flatMap((g) =>
    g.lines.map((l) => [g.loan, g.address, l.type, l.by, l.paidFrom, l.credits, l.amountUsd].map(csvCell).join(",")),
  );
  return [head.join(","), ...lines].join("\r\n");
}

export { formatUsd };
export type { ReviewType };
