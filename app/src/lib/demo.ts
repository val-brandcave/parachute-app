import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { demoPersonas, type DemoPersona } from "@/data/seed/demo-personas.seed";
import { seedOrgs } from "@/data/seed/orgs.seed";
import { seedUsers } from "@/data/seed/users.seed";
import { seedReviews } from "@/data/seed/reviews.seed";
import { seedCreditLedger } from "@/data/seed/credit-ledger.seed";
import { seedWalletSettings } from "@/data/seed/wallet-settings.seed";
import { seedSetupProgress } from "@/data/seed/setup-progress.seed";
import { DEFAULT_ORG_ID } from "@/lib/identity-defaults";

/* PROTOTYPE ONLY: demo persona helpers. Gated by NEXT_PUBLIC_DEMO_PERSONAS. */

export const DEMO_ENABLED = process.env.NEXT_PUBLIC_DEMO_PERSONAS !== "0";

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

async function replaceRows<T extends { id: string }>(
  collection: string,
  match: (row: T) => boolean,
  seeds: T[],
): Promise<void> {
  const existing = await adapter.getWhere<T>(collection, match);
  for (const row of existing) await adapter.remove(collection, row.id);
  if (seeds.length) await adapter.createMany(collection, seeds);
}

/**
 * Restore ONE org to its seed state: org row, members, ledger, wallet settings,
 * setup progress and reviews. Never calls the adapter's full clear/seed, so
 * prefs (theme, density) and every other org survive. An org with no seed (one
 * created at runtime by /welcome) is deleted; `removed: true` reports that.
 */
export async function resetOrgRows(orgId: string): Promise<{ removed: boolean }> {
  const seededOrg = seedOrgs.find((o) => o.id === orgId);
  await replaceRows(Collections.ORGS, (o: { id: string }) => o.id === orgId, seededOrg ? [seededOrg] : []);
  await replaceRows(Collections.USERS, (u: { orgId: string }) => u.orgId === orgId, seedUsers.filter((u) => u.orgId === orgId));
  await replaceRows(Collections.CREDIT_LEDGER, (e: { orgId: string }) => e.orgId === orgId, seedCreditLedger.filter((e) => e.orgId === orgId));
  await replaceRows(Collections.WALLET_SETTINGS, (w: { orgId: string }) => w.orgId === orgId, seedWalletSettings.filter((w) => w.orgId === orgId));
  await replaceRows(Collections.SETUP_PROGRESS, (p: { orgId: string }) => p.orgId === orgId, seedSetupProgress.filter((p) => p.orgId === orgId));
  await replaceRows(
    Collections.REVIEWS,
    (r: { orgId?: string }) => (r.orgId ?? DEFAULT_ORG_ID) === orgId,
    seedReviews.filter((r) => (r.orgId ?? DEFAULT_ORG_ID) === orgId),
  );
  return { removed: !seededOrg };
}
