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

describe("price curve", () => {
  const { creditRateUsd, customPriceUsd, nextRateDrop, savingPct, CREDIT_PACKS, CREDIT_USD, CREDIT_FLOOR_USD, CUSTOM_CREDITS, PRICE_CURVE } = pricing;
  const range = Array.from({ length: CUSTOM_CREDITS.max }, (_, i) => i + 1);

  test("list price from 1 to the first anchor", () => {
    for (let n = 1; n <= PRICE_CURVE[0][0]; n++) expect(creditRateUsd(n)).toBe(CREDIT_USD);
  });
  test("passes exactly through every anchor", () => {
    for (const [n, rate] of PRICE_CURVE) expect(creditRateUsd(n)).toBe(rate);
  });
  test("endpoints and sample values", () => {
    expect([1, 5, 10, 15, 20, 40, 60, 80, 100].map(creditRateUsd)).toEqual([150, 150, 140, 135, 130, 123, 115, 108, 100]);
  });
  test("packs equal the curve at their sizes", () => {
    expect(CREDIT_PACKS.map((p) => p.priceUsd)).toEqual([750, 1400, 2600]);
    for (const p of CREDIT_PACKS) expect(p.priceUsd).toBe(customPriceUsd(p.credits));
  });
  test("pack savings notes come from the curve", () => {
    expect(CREDIT_PACKS.map((p) => p.note)).toEqual([undefined, "Save 7%", "Save 13%"]);
    expect(savingPct(5)).toBe(0);
  });
  test("whole dollars, monotonic non-increasing rate, rising total", () => {
    for (const n of range) {
      expect(Number.isInteger(creditRateUsd(n))).toBe(true);
      if (n > 1) {
        expect(creditRateUsd(n)).toBeLessThanOrEqual(creditRateUsd(n - 1));
        expect(customPriceUsd(n)).toBeGreaterThan(customPriceUsd(n - 1));
      }
    }
  });
  test("strictly falls with every credit from 5 to 20", () => {
    for (let n = 6; n <= 20; n++) expect(creditRateUsd(n)).toBeLessThan(creditRateUsd(n - 1));
  });
  test("floor at the last anchor and beyond", () => {
    expect(CREDIT_FLOOR_USD).toBe(100);
    for (const n of range) expect(creditRateUsd(n)).toBeGreaterThanOrEqual(CREDIT_FLOOR_USD);
    expect(creditRateUsd(250)).toBe(CREDIT_FLOOR_USD);
  });
  test("nextRateDrop finds the next cheaper amount", () => {
    expect(nextRateDrop(1)).toEqual({ credits: 6, add: 5, rateUsd: 148 });
    expect(nextRateDrop(5)).toEqual({ credits: 6, add: 1, rateUsd: 148 });
    expect(nextRateDrop(20)).toEqual({ credits: 22, add: 2, rateUsd: 129 });
    expect(nextRateDrop(97)).toEqual({ credits: 99, add: 2, rateUsd: 100 });
    expect(nextRateDrop(99)).toBeNull();
    expect(nextRateDrop(100)).toBeNull();
  });
});
