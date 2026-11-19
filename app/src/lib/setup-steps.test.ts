import { describe, expect, it } from "vitest";
import { SETUP_SECTIONS, SETUP_STEPS, sectionReward, sectionRewardDue, stepsIn } from "./setup-steps";
import { earnWindow } from "./pricing";
import type { SetupStepId } from "@/types";

const DAY = 86_400_000;
const GRANT = 1_800_000_000_000;

describe("setup steps", () => {
  it("8 steps in 3 sections, in board order", () => {
    expect(SETUP_STEPS).toHaveLength(8);
    expect(SETUP_SECTIONS.map((s) => s.id)).toEqual(["first_review", "own_rules", "team"]);
    expect(SETUP_STEPS.map((s) => s.id)).toEqual([
      "first_review",
      "tutorial",
      "sign_workbook",
      "bank_policy",
      "checklist",
      "layout",
      "invite",
      "security_pack",
    ]);
    expect(SETUP_STEPS.map((s) => s.section)).toEqual([
      "first_review",
      "first_review",
      "first_review",
      "own_rules",
      "own_rules",
      "own_rules",
      "team",
      "team",
    ]);
  });

  it("no sample_review; tutorial in first_review", () => {
    expect(SETUP_STEPS.some((s) => s.id === "sample_review")).toBe(false);
    expect(stepsIn("first_review").map((s) => s.id)).toContain("tutorial");
  });

  it("only first_review and own_rules carry rewards", () => {
    expect(SETUP_SECTIONS.filter((s) => s.reward).map((s) => s.id)).toEqual(["first_review", "own_rules"]);
    expect(sectionReward("first_review")).toBeGreaterThan(0);
    expect(sectionReward("own_rules")).toBeGreaterThan(0);
    expect(sectionReward("team")).toBe(0);
  });

  it("bank vs appraisal-firm copy differs for own_rules", () => {
    const own = SETUP_SECTIONS.find((s) => s.id === "own_rules")!;
    expect(own.title("bank")).toBe("Make it your bank's review");
    expect(own.title("appraisal_firm")).toBe("Make it your firm's review");
    const policy = SETUP_STEPS.find((s) => s.id === "bank_policy")!;
    const ctx = { trial: true, approverFirst: null };
    expect(policy.desc({ ...ctx, kind: "bank" })).toContain("credit policy");
    expect(policy.desc({ ...ctx, kind: "appraisal_firm" })).toContain("review guidelines");
    expect(policy.actionLabel!({ ...ctx, kind: "appraisal_firm" })).toBe("Upload guidelines");
  });
});

describe("sectionRewardDue", () => {
  const allFirst: SetupStepId[] = ["first_review", "tutorial", "sign_workbook"];

  it("all done inside window → true", () => {
    expect(sectionRewardDue(allFirst, "first_review", earnWindow(GRANT, GRANT + DAY), [])).toBe(true);
  });

  it("window closed → false", () => {
    expect(sectionRewardDue(allFirst, "first_review", earnWindow(GRANT, GRANT + 20 * DAY), [])).toBe(false);
  });

  it("already awarded → false", () => {
    expect(sectionRewardDue(allFirst, "first_review", earnWindow(GRANT, GRANT + DAY), ["first_review"])).toBe(false);
  });

  it("an unfinished step → false; team never pays", () => {
    expect(sectionRewardDue(["first_review"], "first_review", earnWindow(GRANT, GRANT + DAY), [])).toBe(false);
    expect(sectionRewardDue(["invite", "security_pack"], "team", earnWindow(GRANT, GRANT + DAY), [])).toBe(false);
  });
});
