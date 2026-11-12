/**
 * The prototype scenario: one global record of the axes in spec §6. Pure types and
 * constants, no store or adapter imports. `normalize()` lives in scenario-builder.ts.
 */
import type { UserRole } from "@/types";

export type Audience = "self_serve" | "enterprise" | "youconnect";
export type Lifecycle = "prospect" | "verified" | "pending" | "approved" | "suspended";
export type WalletState = "held" | "fresh" | "trial" | "healthy" | "low" | "short" | "zero" | "invoiced";
export type BonusState = "open" | "ending" | "closed";
export type PaymentMethodState = "none" | "card" | "invoice";
export type RequestState = "none" | "open";
export type SetupState = "fresh" | "mid" | "almost" | "done" | "hidden";
export type DataState = "empty" | "populated" | "busy";

export interface Scenario {
  audience: Audience;
  lifecycle: Lifecycle;
  wallet: WalletState;
  bonus: BonusState;
  autoReload: boolean;
  expiring: boolean;
  paymentMethod: PaymentMethodState;
  request: RequestState;
  setup: SetupState;
  role: UserRole;
  data: DataState;
}

/** Self-serve, approved, 4 credits left, 2 of 8 setup steps, admin, with reviews. */
export const DEFAULT_SCENARIO: Scenario = {
  audience: "self_serve",
  lifecycle: "approved",
  wallet: "trial",
  bonus: "open",
  autoReload: false,
  expiring: false,
  paymentMethod: "none",
  request: "none",
  setup: "mid",
  role: "org_admin",
  data: "populated",
};

/** Axis keys, in display order. */
export const SCENARIO_AXES = [
  "audience",
  "lifecycle",
  "wallet",
  "bonus",
  "autoReload",
  "expiring",
  "paymentMethod",
  "request",
  "setup",
  "role",
  "data",
] as const satisfies readonly (keyof Scenario)[];

/** True when every key in `patch` equals the scenario's value. */
export function scenarioMatches(sc: Scenario, patch: Partial<Scenario>): boolean {
  return (Object.keys(patch) as (keyof Scenario)[]).every((k) => sc[k] === patch[k]);
}
