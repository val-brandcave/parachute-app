import { describe, expect, it } from "vitest";
import type { Finding, Review } from "@/types";
import {
  CATEGORY_ORDER,
  deriveInsights,
  toEngineCategory,
  toPropertyType,
  type InsightsInput,
} from "./insights-model";

const DAY = 86400000;
const NOW = Date.UTC(2026, 10, 21);

let n = 0;
function review(p: Partial<Review> = {}): Review {
  n++;
  return {
    id: `r-${n}`,
    createdAt: NOW - 3 * DAY,
    propertyAddress: `${n} Main St`,
    propertyType: "Office (Medical)",
    bank: "Bank",
    appraisalFirm: "Apex Appraisal Partners",
    loanNo: `L-${n}`,
    status: "completed",
    reviewTypes: ["technical"],
    assigneeId: "user-001",
    source: "yc",
    riskRating: null,
    openFindings: 0,
    flaggedCount: 0,
    worstSeverity: null,
    pipelineStage: 5,
    slaDueAt: NOW + 5 * DAY,
    orderedAt: NOW - 3 * DAY,
    ...p,
  } as Review;
}

function finding(p: Partial<Finding>): Finding {
  n++;
  return {
    id: `f-${n}`,
    createdAt: NOW,
    reviewId: "r-x",
    category: "Valuation Analysis",
    severity: "fail",
    status: "FAIL",
    confidence: 0.9,
    page: 1,
    question: "",
    analysis: "",
    evidence: "",
    auditTag: "FLAGGED",
    auditText: "",
    material: true,
    suggestedDisposition: "accepted",
    ...p,
  } as Finding;
}

const base = (p: Partial<InsightsInput>): InsightsInput => ({
  reviews: [],
  own: true,
  period: "month",
  range: null,
  now: NOW,
  completed: 0,
  ...p,
});

describe("needsYou", () => {
  it("puts overdue first, then SLA ascending, max 5, live counts", () => {
    const overdueLate = review({ status: "in_review", slaDueAt: NOW - 1 * DAY });
    const overdueEarly = review({ status: "running", slaDueAt: NOW - 4 * DAY, worstSeverity: "crit" });
    const rej = review({ status: "autorejected", slaDueAt: NOW - 10 * DAY }); // not overdue (status)
    const soon = review({ status: "in_review", slaDueAt: NOW + 1 * DAY });
    const later = [2, 3, 4].map((d) => review({ status: "in_review", slaDueAt: NOW + d * DAY }));
    const intake = review({ status: "intake", source: "yc" });
    const manualIntake = review({ status: "intake", source: "manual" });
    const ins = deriveInsights(
      base({ reviews: [soon, ...later, rej, overdueLate, overdueEarly, intake, manualIntake] }),
    );
    const ny = ins.needsYou;
    expect(ny.waiting).toBe(7);
    expect(ny.overdue).toBe(2);
    expect(ny.newFromYc).toBe(1);
    expect(ny.urgent.map((u) => u.review.id)).toEqual([
      overdueEarly.id,
      overdueLate.id,
      rej.id,
      soon.id,
      later[0].id,
    ]);
    expect(ny.urgent[0].worst).toBe("crit");
    expect(ny.urgent[0].dueInMs).toBe(-4 * DAY);
  });
});

describe("category + property mapping", () => {
  it("maps checklist categories into the six engine categories", () => {
    expect(toEngineCategory("Valuation Analysis")).toBe("Valuation");
    expect(toEngineCategory("Mathematical Accuracy")).toBe("Valuation");
    expect(toEngineCategory("Income Approach")).toBe("Methodology");
    expect(toEngineCategory("Cost Approach")).toBe("Methodology");
    expect(toEngineCategory("Highest & Best Use")).toBe("Property Analysis");
    expect(toEngineCategory("USPAP Compliance")).toBe("USPAP Compliance");
    expect(toEngineCategory("Bank Policy")).toBe("FIRREA");
    expect(toEngineCategory("Something new")).toBe("Documentation");
    for (const c of ["a", "Reviewer Note", "Market Analysis"]) {
      expect(CATEGORY_ORDER).toContain(toEngineCategory(c));
    }
  });
  it("normalises property types", () => {
    expect(toPropertyType("Office (Medical)")).toBe("Office");
    expect(toPropertyType("Industrial (Warehouse)")).toBe("Industrial");
    expect(toPropertyType("Multifamily (Garden)")).toBe("Multifamily");
    expect(toPropertyType("Mixed-Use")).toBe("Other");
  });
});

describe("own mode", () => {
  it("returns sane zeros with no data", () => {
    const ins = deriveInsights(base({}));
    expect(ins.value.issues).toBe(0);
    expect(ins.value.hoursSaved).toBe(0);
    expect(ins.value.hoursPerReview).toBe(0);
    expect(ins.value.completedDelta).toBeNull();
    expect(ins.categories).toEqual([]);
    expect(ins.firms).toEqual([]);
    expect(ins.risk).toEqual([]);
    expect(ins.agreement).toEqual({ concurred: 0, edited: 0, rejected: 0, decisions: 0, mostRejectedCategory: null });
  });

  it("falls back to review counters without findings, consistently, and skips null risk", () => {
    const a = review({ openFindings: 3, worstSeverity: "crit", riskRating: "elevated", reviewTypes: ["technical", "administrative"] });
    const b = review({ status: "returned", openFindings: 1, worstSeverity: "flag", riskRating: "low", propertyType: "Retail (Strip)" });
    const old = review({ orderedAt: NOW - 200 * DAY, openFindings: 9 }); // outside the month window
    const ins = deriveInsights(base({ reviews: [a, b, old], completed: 1 }));
    expect(ins.value.issues).toBe(4);
    expect(ins.value.issuesCriticalHigh).toBe(1);
    expect(ins.value.hoursSaved).toBe(4.5);
    // Categories account for every issue and every critical/high one.
    expect(ins.categories.reduce((s, c) => s + c.total, 0)).toBe(4);
    expect(ins.categories.reduce((s, c) => s + c.criticalHigh, 0)).toBe(1);
    for (const c of ins.categories) expect(CATEGORY_ORDER).toContain(c.category);
    expect(ins.firms[0]).toMatchObject({ reports: 2, issuesPerReport: 2, returnedRate: 0.5, trend: "same" });
    expect(CATEGORY_ORDER).toContain(ins.firms[0].topCategory);
    expect(ins.risk.map((r) => r.propertyType).sort()).toEqual(["Office", "Retail"]);
    // completed + returned => all 4 decided, split 3 / 1 / 0 (largest remainder).
    expect(ins.agreement).toMatchObject({ decisions: 4, concurred: 0.75, edited: 0.25, rejected: 0 });
    expect(ins.agreement.mostRejectedCategory).toBeNull();
    // (28 + 6 + 28) checks * 3% = 1.86 -> 2.
    expect(ins.value.checksCorrected).toBe(2);
  });

  it("fallback is deterministic, ~78/14/8 at scale, and decides about half of an in_review review", () => {
    const decided = Array.from({ length: 20 }, () => review({ openFindings: 5, worstSeverity: "fail" }));
    const pending = review({ status: "in_review", openFindings: 4, worstSeverity: "flag" });
    const input = base({ reviews: [...decided, pending] });
    const a = deriveInsights(input);
    expect(deriveInsights(input)).toEqual(a);
    expect(a.value.issues).toBe(104);
    expect(a.value.issuesCriticalHigh).toBe(20);
    const ag = a.agreement;
    // 20 decided reviews x 5 + half of the in_review review's 4.
    expect(ag.decisions).toBe(102);
    expect(ag.concurred + ag.edited + ag.rejected).toBeCloseTo(1, 5);
    expect(ag.concurred).toBeCloseTo(0.78, 1);
    expect(ag.edited).toBeCloseTo(0.14, 1);
    expect(ag.rejected).toBeCloseTo(0.08, 1);
    expect(CATEGORY_ORDER).toContain(ag.mostRejectedCategory);
    // Weighted toward Valuation / USPAP / Property Analysis.
    const top3 = a.categories.slice(0, 3).map((c) => c.category);
    expect(top3.filter((c) => ["Valuation", "USPAP Compliance", "Property Analysis"].includes(c)).length).toBeGreaterThanOrEqual(2);
    // 21 technical reviews * 28 checks = 588, 3% = 18.
    expect(a.value.checksCorrected).toBe(18);
  });

  it("checksCorrected: ~3% of checksRun, min 1 only when there are issues", () => {
    const admin = (openFindings: number) => review({ reviewTypes: ["administrative"], openFindings });
    const clean = deriveInsights(base({ reviews: [admin(0)] }));
    expect(clean.value.checksRun).toBe(6);
    expect(clean.value.checksCorrected).toBe(0); // round(0.18) = 0, no issues
    const withIssues = deriveInsights(base({ reviews: [admin(2)] }));
    expect(withIssues.value.checksCorrected).toBe(1); // forced minimum
    expect(deriveInsights(base({ reviews: [] })).value.checksCorrected).toBe(0);
  });

  it("uses findings + dispositions where present", () => {
    const r = review({ id: "r-f", openFindings: 0 });
    const f1 = finding({ reviewId: "r-f", category: "Valuation Analysis", severity: "crit" });
    const f2 = finding({ reviewId: "r-f", category: "Income Approach", severity: "flag" });
    const f3 = finding({ reviewId: "r-f", category: "Income Approach", severity: "pass" });
    const ins = deriveInsights(
      base({
        reviews: [r],
        findings: [f1, f2, f3],
        findingStates: { [f1.id]: { disposition: "accepted" }, [f2.id]: { disposition: "rejected" } },
      }),
    );
    expect(ins.value.issues).toBe(2);
    expect(ins.value.issuesCriticalHigh).toBe(1);
    expect(ins.categories.map((c) => c.category).sort()).toEqual(["Methodology", "Valuation"]);
    expect(ins.agreement).toMatchObject({ concurred: 0.5, rejected: 0.5, decisions: 2, mostRejectedCategory: "Methodology" });
  });
});

describe("demo mode", () => {
  const firms = ["A Co", "B Co", "C Co"].map((f) => review({ appraisalFirm: f }));

  it("is deterministic", () => {
    const a = deriveInsights(base({ own: false, completed: 20, reviews: firms }));
    const b = deriveInsights(base({ own: false, completed: 20, reviews: firms }));
    expect(a).toEqual(b);
  });

  it("hits the target shape at completed ≈ 20", () => {
    const ins = deriveInsights(base({ own: false, completed: 20, reviews: firms }));
    const v = ins.value;
    expect(v.issuesPerReport).toBeGreaterThanOrEqual(1.9);
    expect(v.issuesPerReport).toBeLessThanOrEqual(2.4);
    expect(v.issuesCriticalHigh / v.issues).toBeGreaterThan(0.3);
    expect(v.issuesCriticalHigh / v.issues).toBeLessThan(0.5);
    expect(ins.categories[0].category).toBe("Valuation");
    expect(ins.categories.reduce((s, c) => s + c.total, 0)).toBe(v.issues);
    expect(ins.firms.length).toBe(6);
    expect(ins.firms[0].firm).toBe("A Co"); // reuses the org's firm names
    expect(ins.firms[0].issuesPerReport).toBeGreaterThan(2.8);
    expect(ins.firms[5].returnedRate).toBe(0);
    expect(v.checksRun / 20).toBeGreaterThan(26);
    expect(v.checksCorrected / v.checksRun).toBeLessThan(0.035);
    expect(ins.agreement.mostRejectedCategory).toBe("Valuation");
    expect(ins.risk.length).toBe(5);
    expect(ins.risk.reduce((s, r) => s + r.reports, 0)).toBe(20);
    expect(v.hoursPerReview).toBe(2.4);
  });

  it("scales with completed", () => {
    const small = deriveInsights(base({ own: false, completed: 8, reviews: firms }));
    const big = deriveInsights(base({ own: false, completed: 200, period: "year", reviews: firms }));
    expect(big.value.issues).toBeGreaterThan(small.value.issues * 10);
    expect(big.firms.reduce((s, f) => s + f.reports, 0)).toBe(200);
  });

  it("agreement shares sum to ~1", () => {
    for (const period of ["week", "month", "quarter", "year"] as const) {
      const a = deriveInsights(base({ own: false, completed: 20, period, reviews: firms })).agreement;
      expect(a.concurred + a.edited + a.rejected).toBeCloseTo(1, 5);
      expect(a.concurred).toBeGreaterThan(0.75);
    }
  });

  it("uses the trend's previous total for the delta when given", () => {
    const ins = deriveInsights(base({ own: false, completed: 20, prevCompleted: 18, reviews: firms }));
    expect(ins.value.completedDelta).toBe(0.11);
  });
});
