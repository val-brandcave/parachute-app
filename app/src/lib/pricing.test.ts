import { describe, expect, test } from "vitest";
import * as pricing from "./pricing";
import {
  autoReloadTimesPerMonth,
  earnWindow,
  routeForProfile,
  VOLUME_BAND_LABEL,
} from "./pricing";

const DAY = 86_400_000;

describe("routeForProfile", () => {
  test("11+ team → enterprise", () => {
    expect(routeForProfile({ teamBand: "11+", volumeBand: "lt50" })).toBe("enterprise");
  });
  test("200+ volume → enterprise", () => {
    expect(routeForProfile({ teamBand: "2-10", volumeBand: "200+" })).toBe("enterprise");
  });
  test("unsure volume → self_serve", () => {
    expect(routeForProfile({ teamBand: "2-10", volumeBand: "unsure" })).toBe("self_serve");
  });
  test("2-10 / lt50 → self_serve", () => {
    expect(routeForProfile({ teamBand: "2-10", volumeBand: "lt50" })).toBe("self_serve");
  });
});

describe("VOLUME_BAND_LABEL", () => {
  test("200 appears in exactly one label", () => {
    expect(VOLUME_BAND_LABEL["50-200"]).toBe("50–199");
    expect(VOLUME_BAND_LABEL["200+"]).toBe("200+");
    const with200 = Object.values(VOLUME_BAND_LABEL).filter((l) => l.includes("200"));
    expect(with200).toEqual(["200+"]);
  });
});

describe("earnWindow", () => {
  const grantAt = Date.UTC(2026, 10, 1);
  test("day 0 open, 14 left", () => {
    expect(earnWindow(grantAt, grantAt)).toEqual({ endsAt: grantAt + 14 * DAY, daysLeft: 14, state: "open" });
  });
  test("day 12 ending", () => {
    const w = earnWindow(grantAt, grantAt + 12 * DAY);
    expect(w.state).toBe("ending");
    expect(w.daysLeft).toBe(2);
  });
  test("day 14 closed, 0 left", () => {
    const w = earnWindow(grantAt, grantAt + 14 * DAY);
    expect(w.state).toBe("closed");
    expect(w.daysLeft).toBe(0);
  });
});

test("autoReloadTimesPerMonth() === 2", () => {
  expect(autoReloadTimesPerMonth()).toBe(2);
});

test("TRIAL_EXPIRY_DAYS is gone", () => {
  expect("TRIAL_EXPIRY_DAYS" in pricing).toBe(false);
});
