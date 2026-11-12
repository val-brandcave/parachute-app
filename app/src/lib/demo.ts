import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { demoPersonas, type DemoPersona } from "@/data/seed/demo-personas.seed";
import { seedOrgs } from "@/data/seed/orgs.seed";
import { seedUsers } from "@/data/seed/users.seed";
import { seedReviews } from "@/data/seed/reviews.seed";
import { seedCreditLedger } from "@/data/seed/credit-ledger.seed";
import { seedWalletSettings } from "@/data/seed/wallet-settings.seed";
import { seedSetupProgress } from "@/data/seed/setup-progress.seed";
import { seedInvites } from "@/data/seed/invites.seed";
import { fixtureCreditRequest, fixtureReviews } from "@/data/seed/scenario-fixtures.seed";
import { DEFAULT_ORG_ID } from "@/lib/identity-defaults";
import { buildSlots } from "@/lib/call-slots";
import { buildLedger, buildSetupProgress, normalize } from "@/lib/prototype/scenario-builder";
import type { Scenario } from "@/lib/prototype/scenario";
import type { Org, SetupProgress, UserRole, WalletSettings } from "@/types";

/* PROTOTYPE ONLY: scenario + legacy persona helpers. */

/** Kill switch (spec §6): `NEXT_PUBLIC_PROTOTYPE_CONTROLS=0`, or the old name
 *  `NEXT_PUBLIC_DEMO_PERSONAS=0`, removes every prototype control. Literal reads so
 *  Next inlines them at build time. */
export const PROTO_ENABLED =
  process.env.NEXT_PUBLIC_PROTOTYPE_CONTROLS !== "0" && process.env.NEXT_PUBLIC_DEMO_PERSONAS !== "0";
/** Old name, kept for the files that still read it. */
export const DEMO_ENABLED = PROTO_ENABLED;

/** The org every self-serve and enterprise scenario is staged on (PC-19). Same value as
 *  `STAGE_ORG_ID` in store/org.store.ts; repeated here so lib never imports a store. */
export const STAGE_ORG = "org-hcb";
/** YouConnect scenarios use Meridian, read-only from the scenario's point of view. */
export const YC_ORG = "org-001";

/** Who the scenario's `role` signs in as, on the stage org. */
export const STAGE_USER: Record<UserRole, string> = {
  org_admin: "user-dr",
  reviewer: "user-mo",
  approver: "user-pn",
};

const PERSONA_KEY = "parachute:demo:persona";

export function personaById(id: string | null | undefined): DemoPersona | undefined {
  return demoPersonas.find((p) => p.id === id);
}

export function readStoredPersona(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PERSONA_KEY);
}

export function storePersona(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(PERSONA_KEY, id);
  else window.localStorage.removeItem(PERSONA_KEY);
}

/** `?persona=` on the landing URL, read once. */
export function readPersonaParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("persona");
}

/** Drop `?persona=` from the address bar so a reload does not re-apply it. */
export function clearPersonaParam(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("persona")) return;
  url.searchParams.delete("persona");
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}

/** Replace every row of `collection` that `match`es with `rows`. Other rows (other orgs,
 *  prefs, theme) are untouched; never calls the adapter's full clear/seed. */
export async function replaceRows<T extends { id: string }>(
  collection: string,
  match: (row: T) => boolean,
  rows: T[],
): Promise<void> {
  const existing = await adapter.getWhere<T>(collection, match);
  for (const row of existing) await adapter.remove(collection, row.id);
  if (rows.length) await adapter.createMany(collection, rows);
}

const byOrg = (orgId: string) => (r: { orgId?: string }) => (r.orgId ?? DEFAULT_ORG_ID) === orgId;

/**
 * Restore ONE org to its seed state: org row, members, ledger, wallet settings,
 * setup progress and reviews. An org with no seed (one created at runtime by
 * /welcome) is deleted; `removed: true` reports that.
 */
export async function resetOrgRows(orgId: string): Promise<{ removed: boolean }> {
  const seededOrg = seedOrgs.find((o) => o.id === orgId);
  await replaceRows(Collections.ORGS, (o: { id: string }) => o.id === orgId, seededOrg ? [seededOrg] : []);
  await replaceRows(Collections.USERS, byOrg(orgId), seedUsers.filter((u) => u.orgId === orgId));
  await replaceRows(Collections.CREDIT_LEDGER, byOrg(orgId), seedCreditLedger.filter((e) => e.orgId === orgId));
  await replaceRows(Collections.WALLET_SETTINGS, byOrg(orgId), seedWalletSettings.filter((w) => w.orgId === orgId));
  await replaceRows(Collections.SETUP_PROGRESS, byOrg(orgId), seedSetupProgress.filter((p) => p.orgId === orgId));
  await replaceRows(Collections.REVIEWS, byOrg(orgId), seedReviews.filter((r) => (r.orgId ?? DEFAULT_ORG_ID) === orgId));
  return { removed: !seededOrg };
}

/* ------------------------------------------------------------- stage org */

const DAY = 86_400_000;
const LEDGER_LEAD = 3_600_000;
type View = Record<string, string> | undefined;

/** The stage org's row for a scenario. */
function stageOrg(s: Scenario, now: number, view: View): Org {
  const seed = seedOrgs.find((o) => o.id === STAGE_ORG)!;
  const enterprise = s.audience === "enterprise";
  const pending = s.lifecycle === "pending";
  const purchased = s.wallet === "healthy" || s.wallet === "low" || s.wallet === "short" || s.wallet === "zero";
  const billing: Org["billing"] = s.wallet === "invoiced" ? "invoiced" : purchased ? "payg" : "trial";
  // The second offered slot, so it always reads as "in a couple of days".
  const slot = buildSlots(now)[1]?.times[2];
  const booked = pending && view?.call !== "later" && slot;
  const profile: Org["profile"] = enterprise
    ? {
        kind: "bank",
        teamBand: "11+",
        volumeBand: "200+",
        salesRequested: true,
        ...(booked ? { callBookedAt: slot.at, callSlot: slot.label } : {}),
      }
    : seed.profile;
  const setupDone = s.setup === "done" || s.setup === "hidden";
  return {
    ...seed,
    profile,
    billing,
    approval: pending ? "pending" : "approved",
    flags: { ...seed.flags, approvalGate: enterprise || undefined },
    ...(setupDone ? { onboardedAt: now - 20 * DAY, securityPackSentAt: now - 25 * DAY } : {}),
    updatedAt: now,
  };
}

function stageWallet(s: Scenario): WalletSettings {
  const seed = seedWalletSettings.find((w) => w.orgId === STAGE_ORG)!;
  const card = s.paymentMethod === "card";
  return {
    ...seed,
    autoReload: s.autoReload,
    paymentMethod: card ? "card" : s.paymentMethod === "invoice" ? "invoice" : null,
    cardLast4: card ? seed.cardLast4 : undefined,
    cardExpiry: card ? seed.cardExpiry : undefined,
  };
}

function stageSetup(s: Scenario, now: number): SetupProgress {
  const built = buildSetupProgress(s, now, STAGE_ORG);
  if (s.setup !== "mid") return built;
  // Mid keeps the seed's "doing" notes for steps still open (the checklist draft).
  const seed = seedSetupProgress.find((p) => p.orgId === STAGE_ORG);
  const inProgress = Object.fromEntries(
    Object.entries(seed?.inProgress ?? {}).filter(([id]) => built.completed[id as keyof SetupProgress["completed"]] === undefined),
  );
  return { ...built, inProgress };
}

/**
 * Rebuild the stage org (`org-hcb`) from a scenario (spec §6): org row, members, ledger
 * (`buildLedger`), wallet settings, setup progress, reviews (`data` fixtures), invites and
 * credit requests. `now` comes from the click. Pure row replacement through `replaceRows`,
 * so other orgs, prefs and theme survive. Prospect / verified and YouConnect scenarios
 * have no stage org to build and leave it untouched.
 */
export async function rebuildStageOrg(sc: Scenario, now: number, view?: Record<string, string>): Promise<void> {
  const { scenario: s } = normalize(sc);
  if (s.lifecycle === "prospect" || s.lifecycle === "verified" || s.audience === "youconnect") return;
  const org = stageOrg(s, now, view);
  const sample = seedReviews.filter((r) => r.orgId === STAGE_ORG && r.sample);

  await replaceRows(Collections.ORGS, (o: { id: string }) => o.id === STAGE_ORG, [org]);
  await replaceRows(Collections.USERS, byOrg(STAGE_ORG), seedUsers.filter((u) => u.orgId === STAGE_ORG));
  // The ledger is anchored an hour back: pages keep the `now` they mounted with, so a window
  // built exactly on the click (bonus "ending" = 2 days left) would read 3 days until reload.
  await replaceRows(Collections.CREDIT_LEDGER, byOrg(STAGE_ORG), buildLedger(s, now - LEDGER_LEAD, STAGE_ORG));
  await replaceRows(Collections.WALLET_SETTINGS, byOrg(STAGE_ORG), [stageWallet(s)]);
  await replaceRows(Collections.SETUP_PROGRESS, byOrg(STAGE_ORG), [stageSetup(s, now)]);
  await replaceRows(Collections.REVIEWS, byOrg(STAGE_ORG), [...fixtureReviews(s.data, STAGE_ORG, org.name), ...sample]);
  await replaceRows(Collections.INVITES, byOrg(STAGE_ORG), seedInvites.filter((i) => i.orgId === STAGE_ORG));
  await replaceRows(
    Collections.CREDIT_REQUESTS,
    byOrg(STAGE_ORG),
    s.request === "open" ? [fixtureCreditRequest(STAGE_ORG, now)] : [],
  );
}
