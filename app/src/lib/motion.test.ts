import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ease,
  dur,
  dist,
  stagger,
  staggerFor,
  motionOff,
  initMotionFlag,
  motionModeNow,
  markArrival,
  takeArrival,
} from "@/lib/motion";

function fakeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("motion tokens", () => {
  it("tokens match motion-contract", () => {
    expect(ease.standard).toEqual([0.2, 0, 0, 1]);
    expect(ease.enter).toEqual([0.05, 0.7, 0.1, 1]);
    expect(ease.exit).toEqual([0.3, 0, 1, 1]);
    expect(ease.linear).toBe("linear");
    expect(dur).toEqual({
      quick: 0.15,
      standard: 0.28,
      slow: 0.48,
      fill: 0.4,
      shake: 0.3,
      reducedFade: 0.12,
    });
    expect(dist).toEqual({ enter: 12, step: 16, panel: 24, lift: 8, shake: 6, icon: 6 });
    expect(stagger).toEqual({ gap: 0.06, maxTotal: 0.4, codeFill: 0.03 });
  });

  it("staggerFor(1) is 0.06", () => {
    expect(staggerFor(1)).toBe(0.06);
  });

  it("staggerFor(20) * 19 <= 0.4", () => {
    expect(staggerFor(20) * 19).toBeLessThanOrEqual(0.4 + 1e-9);
  });
});

describe("motionOff", () => {
  it("motionOff true under navigator.webdriver", () => {
    vi.stubGlobal("navigator", { webdriver: true });
    vi.stubGlobal("location", { search: "" });
    vi.stubGlobal("sessionStorage", fakeStorage());
    expect(motionOff()).toBe(true);
  });

  it("?motion=1 forces motion on", () => {
    const ss = fakeStorage();
    ss.setItem("parachute:motion", "0");
    vi.stubGlobal("navigator", { webdriver: true });
    vi.stubGlobal("location", { search: "?motion=1" });
    vi.stubGlobal("sessionStorage", ss);
    expect(motionOff()).toBe(false);
  });

  it("motionOff is read-only (no sessionStorage writes)", () => {
    const ss = fakeStorage();
    const set = vi.spyOn(ss, "setItem");
    const rm = vi.spyOn(ss, "removeItem");
    vi.stubGlobal("navigator", { webdriver: true });
    vi.stubGlobal("location", { search: "?motion=1" });
    vi.stubGlobal("sessionStorage", ss);
    motionOff();
    expect(set).not.toHaveBeenCalled();
    expect(rm).not.toHaveBeenCalled();
  });

  it("?motion=1 stays on across navigation under automation (sticky)", () => {
    const ss = fakeStorage();
    vi.stubGlobal("navigator", { webdriver: true });
    vi.stubGlobal("location", { search: "?motion=1" });
    vi.stubGlobal("sessionStorage", ss);
    initMotionFlag();
    vi.stubGlobal("location", { search: "" });
    expect(motionOff()).toBe(false);
  });

  it("?motion=0 is sticky for the tab", () => {
    const ss = fakeStorage();
    vi.stubGlobal("navigator", { webdriver: false });
    vi.stubGlobal("location", { search: "?motion=0" });
    vi.stubGlobal("sessionStorage", ss);
    initMotionFlag();
    expect(motionOff()).toBe(true);
    vi.stubGlobal("location", { search: "" });
    expect(motionOff()).toBe(true);
  });
});

describe("motionModeNow", () => {
  it("off under automation, reduced under OS setting, else full", () => {
    vi.stubGlobal("location", { search: "" });
    vi.stubGlobal("sessionStorage", fakeStorage());
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    vi.stubGlobal("navigator", { webdriver: false });
    expect(motionModeNow()).toBe("reduced");
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    expect(motionModeNow()).toBe("full");
    vi.stubGlobal("navigator", { webdriver: true });
    expect(motionModeNow()).toBe("off");
  });
});

describe("arrival hand-off", () => {
  it("takeArrival reads once", () => {
    vi.stubGlobal("sessionStorage", fakeStorage());
    markArrival({ path: "self_serve", at: 1000 });
    expect(takeArrival(2000)).toEqual({ path: "self_serve", at: 1000 });
    expect(takeArrival(2000)).toBeNull();
  });

  it("takeArrival returns null after 10 s", () => {
    vi.stubGlobal("sessionStorage", fakeStorage());
    markArrival({ path: "enterprise", at: 1000 });
    expect(takeArrival(1000 + 10_001)).toBeNull();
  });
});
