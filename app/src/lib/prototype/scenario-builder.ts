/**
 * Scenario to rows. Pure: `now` is passed in and ids come from the org id and a running
 * index, so the same `now` always yields the same rows (spec §6 recipes).
 * No store or adapter imports.
 */
import type { CreditLedgerEntry, CreditSource, ReviewType, SetupProgress, SetupStepId } from "@/types";
import { CREDIT_USD, EARN_ENDING_DAYS, EARN_WINDOW_DAYS, TRIAL_GRANT_CREDITS, costFor, packById } from "@/lib/pricing";
import type { Scenario } from "./scenario";

const HOUR = 3_600_000;
const DAY = 86_400_000;
const FULL: ReviewType[] = ["technical", "administrative"];
const ADMIN = "user-dr";
const MEMBER = "user-mo";

/* ------------------------------------------------------------------ normalize */

export function normalize(sc: Scenario): { scenario: Scenario; notes: string[] } {
  const s: Scenario = { ...sc };
  const notes: string[] = [];

  if (s.lifecycle === "prospect" || s.lifecycle === "verified") {
    s.wallet = "held";
    s.data = "empty";
    s.setup = "hidden";
    s.autoReload = false;
    s.expiring = false;
    notes.push(`A ${s.lifecycle} visitor has no organization yet, so there is no wallet, data or setup.`);
  }
  if (s.audience === "youconnect") {
    if (s.wallet !== "invoiced" || s.setup !== "done" || s.lifecycle !== "approved") {
      notes.push("YouConnect organizations are invoiced, fully set up and approved.");
    }
    s.wallet = "invoiced";
    s.setup = "done";
    s.lifecycle = "approved";
  }
  if (s.lifecycle === "pending") {
    if (s.audience !== "enterprise") notes.push("Only enterprise teams wait for approval: audience is now enterprise.");
    if (s.wallet !== "held") notes.push("Credits are held until approval: wallet is now held.");
    if (s.data !== "empty") notes.push("A pending organization has no reviews yet: data is now empty.");
    s.audience = "enterprise";
    s.wallet = "held";
    s.data = "empty";
  }
  if (s.wallet === "invoiced") {
    if (s.autoReload || s.expiring) notes.push("Invoiced organizations have no auto-reload or expiring credits.");
    if (s.bonus !== "closed") notes.push("Invoiced organizations have no setup bonus.");
    s.autoReload = false;
    s.expiring = false;
    s.bonus = "closed";
    if (s.paymentMethod === "card") s.paymentMethod = "invoice";
  }
  if (s.wallet === "held") {
    s.autoReload = false;
    s.expiring = false;
  }
  if ((s.setup === "done" || s.setup === "hidden") && s.lifecycle !== "prospect" && s.lifecycle !== "verified") {
    notes.push("Setup is finished. Pick New or Mid to see it.");
  }
  return { scenario: s, notes };
}

/* --------------------------------------------------------------------- ledger */

class Rows {
  readonly rows: CreditLedgerEntry[] = [];
  private n = 0;
  private receipt = 41_000;
  constructor(
    private readonly orgId: string,
    private readonly tag: string,
  ) {}
  private id() {
    return `led-sc-${this.tag}-${++this.n}`;
  }
  grant(at: number) {
    this.rows.push({
      id: this.id(),
      orgId: this.orgId,
      kind: "trial_grant",
      credits: TRIAL_GRANT_CREDITS,
      actorId: ADMIN,
      note: "Welcome trial credits",
      createdAt: at,
    });
  }
  pack(packId: "pack5" | "pack10" | "pack20", at: number, auto = false) {
    const p = packById(packId);
    this.rows.push({
      id: this.id(),
      orgId: this.orgId,
      kind: "purchase",
      credits: p.credits,
      amountUsd: p.priceUsd,
      packId,
      receiptId: `RCT-${++this.receipt}`,
      ...(auto ? { auto: true } : {}),
      actorId: auto ? ADMIN : MEMBER,
      note: `${p.credits}-credit pack`,
      createdAt: at,
    });
  }
  /** `count` full reviews (2 credits each) paid from `from`. */
  debits(count: number, from: CreditSource, start: number, step: number) {
    for (let i = 0; i < count; i++) {
      const cost = costFor(FULL);
      this.rows.push({
        id: this.id(),
        orgId: this.orgId,
        kind: "debit",
        credits: -cost,
        amountUsd: from === "trial" ? 0 : cost * CREDIT_USD,
        loanNo: `HCB-26-${String(1000 + this.n).padStart(4, "0")}`,
        reviewTypes: FULL,
        paidFrom: [from],
        receiptId: `RCT-${++this.receipt}`,
        actorId: i % 2 === 0 ? ADMIN : MEMBER,
        note: "Technical + Administrative",
        createdAt: start + i * step,
      });
    }
  }
}

/** Trial grant date for an earn-window state, measured from `now`. */
function grantAtForBonus(bonus: Scenario["bonus"], now: number): number {
  if (bonus === "closed") return now - (EARN_WINDOW_DAYS + 1) * DAY;
  if (bonus === "ending") return now - (EARN_WINDOW_DAYS - EARN_ENDING_DAYS) * DAY;
  return now - 2 * DAY; // open, 12 days left
}

export function buildLedger(sc: Scenario, now: number, orgId: string): CreditLedgerEntry[] {
  const { scenario: s } = normalize(sc);
  const w = s.wallet;
  if (w === "held" || w === "invoiced") return [];
  const r = new Rows(orgId, orgId.replace(/^org-/, ""));

  // Healthy spent its trial long ago, so the bonus modifier does not apply to it.
  let grantAt = w === "healthy" ? now - 30 * DAY : grantAtForBonus(s.bonus, now);
  if (w === "fresh" && s.bonus === "open") grantAt = now - HOUR;
  const after = (offset: number) => grantAt + offset;

  r.grant(grantAt);
  switch (w) {
    case "fresh":
      break;
    case "trial":
      // One full review on the first report: 6 - 2 = 4.
      r.debits(1, "trial", after(3 * HOUR), HOUR);
      break;
    case "healthy":
      // Trial spent over three reviews, then pack20 (-20d) and three more: 6 + 20 - 12 = 14.
      r.debits(3, "trial", now - 28 * DAY, 2 * DAY);
      r.pack("pack20", now - 20 * DAY);
      r.debits(3, "purchased", now - 18 * DAY, 6 * DAY);
      break;
    case "low":
      // pack10 + pack5 history: 6 + 15 - 18 = 3 (2 trial + 1 purchased).
      r.debits(2, "trial", after(HOUR), HOUR);
      r.pack("pack10", after(4 * HOUR));
      r.debits(4, "purchased", after(6 * HOUR), HOUR);
      r.pack("pack5", after(12 * HOUR), s.autoReload);
      r.debits(3, "purchased", after(14 * HOUR), HOUR);
      break;
    case "short":
      // 6 + 5 - 10 = 1.
      r.debits(3, "trial", after(HOUR), HOUR);
      r.pack("pack5", after(6 * HOUR), s.autoReload);
      r.debits(2, "purchased", after(8 * HOUR), HOUR);
      break;
    case "zero":
      // 6 + 10 - 16 = 0.
      r.debits(3, "trial", after(HOUR), HOUR);
      r.pack("pack10", after(6 * HOUR));
      r.debits(5, "purchased", after(8 * HOUR), HOUR);
      break;
  }

  if (s.expiring) {
    // A pack bought 359 days ago with 3 of its 5 credits left: it lapses in a few days.
    r.pack("pack5", now - 359 * DAY);
    r.debits(1, "purchased", now - 350 * DAY, DAY);
  }
  return r.rows.sort((a, b) => a.createdAt - b.createdAt);
}

/* ------------------------------------------------------------- setup progress */

/** The eight counted steps (the pre-ticked "account" line is extra), in checklist order. */
const COUNTED_STEPS: SetupStepId[] = [
  "first_review",
  "sign_workbook",
  "bank_policy",
  "security_pack",
  "checklist",
  "layout",
  "invite",
  "tutorial",
];

const DONE_IDS: Record<Scenario["setup"], SetupStepId[]> = {
  fresh: [],
  mid: ["first_review", "invite"],
  almost: COUNTED_STEPS.slice(0, 7),
  done: COUNTED_STEPS,
  hidden: COUNTED_STEPS,
};

export function buildSetupProgress(sc: Scenario, now: number, orgId: string): SetupProgress {
  const { scenario: s } = normalize(sc);
  const created = now - 2 * DAY;
  const completed: SetupProgress["completed"] = { account: created };
  const completedBy: NonNullable<SetupProgress["completedBy"]> = { account: ADMIN };
  DONE_IDS[s.setup].forEach((id, i) => {
    completed[id] = created + (i + 1) * HOUR;
    completedBy[id] = i % 2 === 0 ? ADMIN : MEMBER;
  });
  return {
    id: orgId,
    orgId,
    createdAt: created,
    completed,
    completedBy,
    ...(s.setup === "hidden" ? { dockDismissedAt: now, homeDismissedAt: now } : {}),
  };
}
