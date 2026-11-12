import { describe, expect, it } from "vitest";
import { canRequest, nextStatus } from "./credit-requests";
import type { CreditRequest } from "@/types";

const T = 1_800_000_000_000;
const req = (over: Partial<CreditRequest> = {}): CreditRequest => ({
  id: "cr-1",
  orgId: "org-hcb",
  requesterId: "user-mo",
  createdAt: T,
  status: "open",
  ...over,
});

describe("credit requests", () => {
  it("one open request per requester", () => {
    expect(canRequest([], "user-mo")).toBe(true);
    expect(canRequest([req()], "user-mo")).toBe(false);
    expect(canRequest([req({ status: "opened" })], "user-mo")).toBe(false);
    expect(canRequest([req()], "user-other")).toBe(true);
  });

  it("open → opened → fulfilled", () => {
    const opened = nextStatus(req(), "open", T + 1);
    expect(opened).toMatchObject({ status: "opened", openedAt: T + 1 });
    const done = nextStatus(opened, "fulfil", T + 2);
    expect(done).toMatchObject({ status: "fulfilled", resolvedAt: T + 2 });
    expect(nextStatus(done, "dismiss", T + 3)).toBe(done);
  });

  it("dismissed allows asking again", () => {
    const dismissed = nextStatus(req(), "dismiss", T + 1);
    expect(dismissed.status).toBe("dismissed");
    expect(canRequest([dismissed], "user-mo")).toBe(true);
  });

  it("remind sets remindedAt only while open/opened", () => {
    expect(nextStatus(req(), "remind", T + 5).remindedAt).toBe(T + 5);
    expect(nextStatus(req({ status: "opened" }), "remind", T + 6).remindedAt).toBe(T + 6);
    const cancelled = nextStatus(req(), "cancel", T + 1);
    expect(nextStatus(cancelled, "remind", T + 7).remindedAt).toBeUndefined();
  });
});
