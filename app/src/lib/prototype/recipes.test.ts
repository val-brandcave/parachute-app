/**
 * RF3 cross-check (T0.6): every scenario wallet recipe, fed through THE wallet
 * derivation, lands on the spec §6 number. If this fails, the recipe
 * (scenario-builder) or the derivation (wallet-view) is wrong — fix at the source.
 */
import { describe, expect, test } from "vitest";
import { walletView } from "@/lib/wallet-view";
import { DEFAULT_SCENARIO, type Scenario, type WalletState } from "./scenario";
import { buildLedger, normalize } from "./scenario-builder";

const NOW = Date.UTC(2026, 10, 11, 15, 0, 0);

const EXPECTED: { wallet: WalletState; balance: number; lowTone: "ok" | "low" | "zero" }[] = [
  { wallet: "fresh", balance: 6, lowTone: "ok" },
  { wallet: "trial", balance: 4, lowTone: "ok" },
  { wallet: "healthy", balance: 14, lowTone: "ok" },
  { wallet: "low", balance: 3, lowTone: "low" },
  { wallet: "short", balance: 1, lowTone: "low" },
  { wallet: "zero", balance: 0, lowTone: "zero" },
];

function scenarioFor(wallet: WalletState): Scenario {
  return normalize({
    ...DEFAULT_SCENARIO,
    audience: "self_serve",
    lifecycle: "approved",
    wallet,
    autoReload: false,
    expiring: false,
  }).scenario;
}

describe("wallet recipes → walletView (spec §6)", () => {
  for (const { wallet, balance, lowTone } of EXPECTED) {
    test(`${wallet} → balance ${balance}, lowTone ${lowTone}`, () => {
      const sc = scenarioFor(wallet);
      expect(sc.wallet).toBe(wallet);
      const view = walletView(buildLedger(sc, NOW, "org-hcb"), { now: NOW });
      expect(view.balance).toBe(balance);
      expect(view.lowTone).toBe(lowTone);
      const { trial, earned, purchased } = view.bySource;
      expect(trial + earned + purchased).toBe(balance);
    });
  }

  test("held → empty ledger", () => {
    const sc = normalize({ ...DEFAULT_SCENARIO, lifecycle: "pending" }).scenario;
    expect(sc.wallet).toBe("held");
    expect(buildLedger(sc, NOW, "org-hcb")).toEqual([]);
  });

  test("low is 2 trial + 1 purchased", () => {
    const view = walletView(buildLedger(scenarioFor("low"), NOW, "org-hcb"), { now: NOW });
    expect(view.bySource.trial).toBe(2);
    expect(view.bySource.purchased).toBe(1);
  });
});
