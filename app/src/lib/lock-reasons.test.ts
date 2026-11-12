import { describe, expect, it } from "vitest";
import { lockReasonForStart } from "./lock-reasons";
import type { ReviewType } from "@/types";

const BOTH: ReviewType[] = ["technical", "administrative"];
const base = { approval: "approved" as const, balance: 10, types: BOTH, role: "org_admin" as const, embedded: false };

describe("lockReasonForStart", () => {
  it("pending → approval", () => {
    expect(lockReasonForStart({ ...base, approval: "pending" })).toEqual({ kind: "approval" });
  });
  it("credits reason carries the shortfall", () => {
    expect(lockReasonForStart({ ...base, balance: 1 })).toEqual({ kind: "credits", needed: 1, have: 1, types: BOTH });
  });
  it("zero balance → needed 2", () => {
    expect(lockReasonForStart({ ...base, balance: 0 })).toMatchObject({ kind: "credits", needed: 2, have: 0 });
  });
  it("affordable → null", () => {
    expect(lockReasonForStart({ ...base, balance: 2 })).toBeNull();
  });
  it("embedded → null", () => {
    expect(lockReasonForStart({ ...base, balance: 0, approval: "pending", embedded: true })).toBeNull();
  });
  it("invoiced is never credit-locked", () => {
    expect(lockReasonForStart({ ...base, balance: 0, billing: "invoiced" })).toBeNull();
  });
});
