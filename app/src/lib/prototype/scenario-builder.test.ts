import { describe, expect, it } from "vitest";
import { earnWindow } from "@/lib/pricing";
import type { CreditLedgerEntry } from "@/types";
import { DEFAULT_SCENARIO, type Scenario } from "./scenario";
import { CHECKOUT_PAID_RECEIPT, PRESETS, SCREENS, activeState, patchForState, screenForPath } from "@/lib/prototype-registry";
import { buildLedger, buildSetupProgress, normalize } from "./scenario-builder";

const NOW = Date.UTC(2026, 10, 12, 12, 0);
const HOUR = 3_600_000;
const DAY = 86_400_000;
const ORG = "org-hcb";

const sc = (patch: Partial<Scenario>): Scenario => ({ ...DEFAULT_SCENARIO, ...patch });
const sum = (rows: CreditLedgerEntry[]) => rows.reduce((s, r) => s + r.credits, 0);

describe("normalize", () => {
  it("pending forces held, empty, enterprise", () => {
    const { scenario, notes } = normalize(sc({ lifecycle: "pending", audience: "self_serve", wallet: "healthy", data: "busy" }));
    expect(scenario.wallet).toBe("held");
    expect(scenario.data).toBe("empty");
    expect(scenario.audience).toBe("enterprise");
    expect(notes.length).toBeGreaterThan(0);
  });

  it("youconnect forces invoiced, done, approved", () => {
    const { scenario } = normalize(sc({ audience: "youconnect", wallet: "low", setup: "mid", lifecycle: "pending" }));
    expect(scenario.wallet).toBe("invoiced");
    expect(scenario.setup).toBe("done");
    expect(scenario.lifecycle).toBe("approved");
  });

  it("invoiced turns off autoReload and expiring", () => {
    const { scenario } = normalize(sc({ wallet: "invoiced", autoReload: true, expiring: true }));
    expect(scenario.autoReload).toBe(false);
    expect(scenario.expiring).toBe(false);
  });

  it("a valid scenario passes through unchanged with no notes", () => {
    const input = sc({ wallet: "low" });
    const { scenario, notes } = normalize(input);
    expect(scenario).toEqual(input);
    expect(notes).toEqual([]);
  });
});

describe("buildLedger", () => {
  it("fresh = one trial_grant 6 at now−1h", () => {
    const rows = buildLedger(sc({ wallet: "fresh" }), NOW, ORG);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "trial_grant", credits: 6, createdAt: NOW - HOUR, orgId: ORG });
  });

  it.each([
    ["trial", 4],
    ["healthy", 14],
    ["low", 3],
    ["short", 1],
    ["zero", 0],
  ] as const)("recipe %s sums to %i", (wallet, balance) => {
    expect(sum(buildLedger(sc({ wallet }), NOW, ORG))).toBe(balance);
  });

  it("low = 2 trial + 1 purchased", () => {
    const rows = buildLedger(sc({ wallet: "low" }), NOW, ORG);
    const trialSpent = rows.filter((r) => r.kind === "debit" && r.paidFrom?.includes("trial")).reduce((s, r) => s - r.credits, 0);
    const purchased = rows.filter((r) => r.kind === "purchase").reduce((s, r) => s + r.credits, 0);
    expect(6 - trialSpent).toBe(2);
    expect(purchased).toBe(15);
  });

  it("held and invoiced have no wallet rows", () => {
    expect(buildLedger(sc({ wallet: "held" }), NOW, ORG)).toEqual([]);
    expect(buildLedger(sc({ wallet: "invoiced" }), NOW, ORG)).toEqual([]);
  });

  it("debits carry the fields walletView reads", () => {
    const debits = buildLedger(sc({ wallet: "healthy" }), NOW, ORG).filter((r) => r.kind === "debit");
    expect(debits.length).toBe(6);
    for (const d of debits) {
      expect(d.credits).toBeLessThan(0);
      expect(d.reviewTypes?.length).toBeGreaterThan(0);
      expect(d.paidFrom?.length).toBeGreaterThan(0);
      expect(d.actorId).toBeTruthy();
      expect(d.receiptId).toBeTruthy();
    }
  });

  it("+expiring adds pack5 at now−359d with 3 left", () => {
    const base = buildLedger(sc({ wallet: "healthy" }), NOW, ORG);
    const rows = buildLedger(sc({ wallet: "healthy", expiring: true }), NOW, ORG);
    const pack = rows.find((r) => r.kind === "purchase" && r.packId === "pack5");
    expect(pack?.createdAt).toBe(NOW - 359 * DAY);
    expect(pack?.credits).toBe(5);
    expect(sum(rows) - sum(base)).toBe(3);
  });

  it("+autoReload on low marks a purchase auto without changing the balance", () => {
    const rows = buildLedger(sc({ wallet: "low", autoReload: true }), NOW, ORG);
    expect(rows.some((r) => r.kind === "purchase" && r.auto === true)).toBe(true);
    expect(sum(rows)).toBe(3);
  });

  it("bonus ending sets the grant so earnWindow is ending", () => {
    const rows = buildLedger(sc({ wallet: "trial", bonus: "ending" }), NOW, ORG);
    const grant = rows.find((r) => r.kind === "trial_grant")!;
    expect(earnWindow(grant.createdAt, NOW).state).toBe("ending");
  });

  it("bonus open and closed set the grant accordingly", () => {
    const open = buildLedger(sc({ wallet: "trial", bonus: "open" }), NOW, ORG).find((r) => r.kind === "trial_grant")!;
    const closed = buildLedger(sc({ wallet: "trial", bonus: "closed" }), NOW, ORG).find((r) => r.kind === "trial_grant")!;
    expect(earnWindow(open.createdAt, NOW).state).toBe("open");
    expect(earnWindow(closed.createdAt, NOW).state).toBe("closed");
  });

  it("same now → same ids", () => {
    const a = buildLedger(sc({ wallet: "low", expiring: true }), NOW, ORG).map((r) => r.id);
    const b = buildLedger(sc({ wallet: "low", expiring: true }), NOW, ORG).map((r) => r.id);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(a.length);
  });
});

describe("buildSetupProgress", () => {
  const count = (p: ReturnType<typeof buildSetupProgress>) => Object.keys(p.completed).filter((k) => k !== "account").length;

  it("fresh 0, mid 2, almost 7, done 8", () => {
    expect(count(buildSetupProgress(sc({ setup: "fresh" }), NOW, ORG))).toBe(0);
    expect(count(buildSetupProgress(sc({ setup: "mid" }), NOW, ORG))).toBe(2);
    expect(count(buildSetupProgress(sc({ setup: "almost" }), NOW, ORG))).toBe(7);
    expect(count(buildSetupProgress(sc({ setup: "done" }), NOW, ORG))).toBe(8);
  });

  it("mid = first_review + invite; id equals orgId; account always done", () => {
    const p = buildSetupProgress(sc({ setup: "mid" }), NOW, ORG);
    expect(p.id).toBe(ORG);
    expect(p.orgId).toBe(ORG);
    expect(p.completed.first_review).toBeDefined();
    expect(p.completed.invite).toBeDefined();
    expect(p.completed.account).toBeDefined();
  });

  it("hidden is complete and dismissed", () => {
    const p = buildSetupProgress(sc({ setup: "hidden" }), NOW, ORG);
    expect(count(p)).toBe(8);
    expect(p.homeDismissedAt).toBe(NOW);
  });
});

describe("registry", () => {
  it("screenForPath finds billing and dashboard, and nothing for unknown paths", () => {
    expect(screenForPath("/configure/billing")?.id).toBe("billing");
    expect(screenForPath("/dashboard")?.id).toBe("dashboard");
    expect(screenForPath("/dashboard?x=1")?.id).toBe("dashboard");
    expect(screenForPath("/nope")).toBeUndefined();
  });

  it("the How credits work tab is its own screen", () => {
    expect(screenForPath("/configure/billing", "tab=credits")?.id).toBe("billing-credits");
    expect(screenForPath("/configure/billing?tab=credits")?.id).toBe("billing-credits");
    expect(screenForPath("/configure/billing", "tab=usage")?.id).toBe("billing");
  });

  it("every screen has at most 4 key states, and screens over 4 states mark some", () => {
    for (const s of SCREENS) {
      const keys = s.states.filter((x) => x.key).length;
      expect(keys, s.id).toBeLessThanOrEqual(4);
      if (s.states.length > 4) expect(keys, s.id).toBeGreaterThan(0);
      for (const x of s.states.filter((y) => !y.key && s.states.length > 4)) expect(x.group, `${s.id}/${x.id}`).toBeTruthy();
    }
  });

  it("a checkout state lands as an admin with a card, whatever the previous screen left", () => {
    const co = SCREENS.find((s) => s.id === "checkout")!;
    const amount = co.states.find((s) => s.id === "amount")!;
    const reviewer = sc({ role: "reviewer", wallet: "short", request: "open" });
    const next = normalize({ ...reviewer, ...patchForState(reviewer, co, amount) }).scenario;
    expect(next).toMatchObject({ role: "org_admin", lifecycle: "approved", paymentMethod: "card", request: "none" });
    expect(activeState(co, next, new URLSearchParams("step=amount"))?.id).toBe("amount");
    // From a pending org the base is impossible over the leftovers: restart from trial-admin.
    const pending = sc({ audience: "enterprise", lifecycle: "pending", wallet: "held", data: "empty" });
    expect(normalize({ ...pending, ...patchForState(pending, co, amount) }).scenario).toMatchObject({ lifecycle: "approved", wallet: "low", role: "org_admin" });
  });

  it("checkout Paid opens a receipt that the checkout base's ledger holds", () => {
    const co = SCREENS.find((s) => s.id === "checkout")!;
    const paid = co.states.find((s) => s.id === "paid")!;
    expect(paid.view?.receipt).toBe(CHECKOUT_PAID_RECEIPT);
    const world = normalize({ ...DEFAULT_SCENARIO, autoReload: false, expiring: false, ...co.base }).scenario;
    const entry = buildLedger(world, NOW, ORG).find((e) => e.receiptId === CHECKOUT_PAID_RECEIPT);
    expect(entry?.kind).toBe("purchase");
  });

  it("a plain screen landing applies the base only when the scenario is off it", () => {
    const co = SCREENS.find((s) => s.id === "checkout")!;
    const on = normalize({ ...DEFAULT_SCENARIO, ...co.base }).scenario;
    expect(patchForState(on, co)).toBeNull();
    expect(patchForState(sc({ role: "reviewer" }), co)).toMatchObject({ role: "org_admin" });
    expect(patchForState(DEFAULT_SCENARIO, SCREENS.find((s) => s.id === "reviews"))).toBeNull();
  });

  it("the default scenario highlights Self-serve Mid-setup on Get started", () => {
    const gs = SCREENS.find((s) => s.id === "get-started")!;
    expect(activeState(gs, DEFAULT_SCENARIO, new URLSearchParams())?.id).toBe("mid");
  });

  it("a view-only difference matches on the view param", () => {
    const gs = SCREENS.find((s) => s.id === "get-started")!;
    const booked = sc({ audience: "enterprise", lifecycle: "pending", wallet: "held", setup: "fresh", data: "empty" });
    expect(activeState(gs, booked, new URLSearchParams())?.id).toBe("call-booked");
    expect(activeState(gs, booked, new URLSearchParams("call=later"))?.id).toBe("book-later");
  });

  it("Confirmed is approved enterprise with fresh trial credits", () => {
    const gs = SCREENS.find((s) => s.id === "get-started")!;
    const confirmed = gs.states.find((s) => s.id === "confirmed")!;
    expect(confirmed.set).toMatchObject({ audience: "enterprise", lifecycle: "approved", wallet: "fresh", setup: "fresh" });
  });

  it("every built preset is a fixed point of normalize", () => {
    for (const p of PRESETS.filter((x) => x.status !== "planned")) {
      expect(normalize(p.scenario).scenario, p.id).toEqual(p.scenario);
    }
  });
});
