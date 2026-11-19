import { EARN_ENDING_DAYS } from "@/lib/pricing";
import type { Scenario } from "@/lib/prototype/scenario";
import type { BuildStatus } from "@/lib/prototype-registry";

/**
 * Prototype presets (spec §6): named scenarios the state pill, the Prototype Index and
 * /demo/<legacy id> land on. Moved out of lib/prototype-registry.ts in T5.0; filled by T5.4.
 *
 * `entry` is checked against the old persona entry routes (data/seed/demo-personas.seed.ts)
 * and state-system-draft §1.6. "/dashboard" means "the front door": it resolves through
 * `resolveEntryRoute`, so an org with setup open lands on Get started.
 *
 * `legacyPersonaId` keeps the nine old persona ids working as aliases (`/demo/<id>`,
 * `?persona=`). An alias keeps that persona's seeded identity (Lakeside, Cedar Ridge,
 * Meridian), so every earlier flow lands exactly where it used to; picking a preset from
 * the scenario popover or the Index rebuilds the stage org from `scenario` instead.
 */
export interface Preset {
  id: string;
  label: string;
  description: string;
  scenario: Scenario;
  entry: string;
  legacyPersonaId?: string;
  status?: BuildStatus;
}

const base = (patch: Partial<Scenario>): Scenario => ({
  audience: "self_serve",
  lifecycle: "approved",
  wallet: "trial",
  bonus: "open",
  autoReload: false,
  expiring: false,
  // Harbor's seed keeps a card on file (4242), so the self-serve presets do too.
  paymentMethod: "card",
  request: "none",
  setup: "mid",
  role: "org_admin",
  data: "populated",
  ...patch,
});

const invoicedEnterprise = (patch: Partial<Scenario> = {}): Scenario =>
  base({ audience: "enterprise", wallet: "invoiced", setup: "done", bonus: "closed", paymentMethod: "invoice", ...patch });

export const PRESETS: Preset[] = [
  {
    id: "prospect",
    label: "Self-serve prospect",
    description: "Not signed up yet.",
    entry: "/auth/create-account",
    legacyPersonaId: "prospect",
    scenario: base({ lifecycle: "prospect", wallet: "held", setup: "hidden", data: "empty", paymentMethod: "none" }),
  },
  {
    id: "prospect-sales",
    label: "Enterprise verified",
    description: "Verified e-mail, no organization yet.",
    entry: "/welcome",
    legacyPersonaId: "prospect-sales",
    scenario: base({ audience: "enterprise", lifecycle: "verified", wallet: "held", setup: "hidden", data: "empty", paymentMethod: "none" }),
  },
  {
    id: "pending-admin",
    label: "Enterprise pending",
    description: "Call booked, waiting for approval; credits held.",
    entry: "/dashboard",
    legacyPersonaId: "pending-admin",
    scenario: base({ audience: "enterprise", lifecycle: "pending", wallet: "held", setup: "fresh", data: "empty", paymentMethod: "none" }),
  },
  {
    id: "trial-admin",
    label: "Self-serve trial",
    description: "Approved, 4 trial credits, setup 2 of 8.",
    entry: "/dashboard",
    legacyPersonaId: "trial-admin",
    scenario: base({}),
  },
  {
    id: "payg-admin-low",
    label: "Self-serve short",
    description: "1 credit left, setup done: Start runs short.",
    entry: "/launchpad",
    legacyPersonaId: "payg-admin-low",
    scenario: base({ wallet: "short", setup: "done" }),
  },
  {
    id: "reviewer",
    label: "Reviewer",
    description: "Trial org, signed in as a reviewer.",
    entry: "/dashboard",
    legacyPersonaId: "reviewer",
    scenario: base({ role: "reviewer" }),
  },
  {
    id: "approver",
    label: "Approver",
    description: "Healthy wallet, busy pipeline.",
    entry: "/reviews",
    legacyPersonaId: "approver",
    scenario: base({ wallet: "healthy", setup: "done", role: "approver", data: "busy" }),
  },
  {
    id: "returning",
    label: "Enterprise invoiced",
    description: "Invoiced monthly, fully set up.",
    entry: "/launchpad",
    legacyPersonaId: "returning",
    scenario: invoicedEnterprise(),
  },
  {
    id: "enterprise-yc",
    label: "YouConnect",
    description: "Embedded in YouConnect, billed through it.",
    entry: "/youconnect",
    legacyPersonaId: "enterprise-yc",
    scenario: base({ audience: "youconnect", wallet: "invoiced", setup: "done", bonus: "closed", paymentMethod: "invoice" }),
  },
  {
    id: "self-serve-low",
    label: "Self-serve low",
    description: "3 credits, running low.",
    entry: "/configure/billing",
    scenario: base({ wallet: "low", setup: "done" }),
  },
  {
    id: "self-serve-zero",
    label: "Self-serve zero",
    description: "Out of credits.",
    entry: "/configure/billing",
    scenario: base({ wallet: "zero", setup: "done" }),
  },
  {
    id: "bonus-ending",
    label: "Bonus ending",
    description: `Setup bonus closes within ${EARN_ENDING_DAYS} days.`,
    entry: "/get-started",
    scenario: base({ bonus: "ending" }),
  },
  {
    id: "bonus-closed",
    label: "Bonus closed",
    description: "Setup bonus window has closed.",
    entry: "/get-started",
    scenario: base({ bonus: "closed" }),
  },
  {
    id: "enterprise-call-booked",
    label: "Enterprise call booked",
    description: "Call booked, waiting for approval.",
    entry: "/get-started",
    scenario: base({ audience: "enterprise", lifecycle: "pending", wallet: "held", setup: "fresh", data: "empty", paymentMethod: "none" }),
  },
  {
    id: "enterprise-confirmed",
    label: "Enterprise confirmed",
    description: "Confirmed; trial credits ready, prepaid by default.",
    entry: "/get-started",
    scenario: base({ audience: "enterprise", wallet: "fresh", setup: "fresh", paymentMethod: "none" }),
  },
  {
    id: "reviewer-request-waiting",
    label: "Reviewer request waiting",
    description: "A reviewer asked the admin for credits.",
    entry: "/dashboard",
    scenario: base({ wallet: "short", request: "open" }),
  },
  {
    // Carried item: the Billing invoiced-reviewer variant had no way in.
    id: "invoiced-reviewer",
    label: "Invoiced reviewer",
    description: "Reviewer at an invoiced organization: usage only, nothing to buy.",
    entry: "/configure/billing",
    scenario: invoicedEnterprise({ role: "reviewer" }),
  },
  {
    id: "suspended",
    label: "Suspended",
    description: "Planned (Q-E6).",
    entry: "/dashboard",
    status: "planned",
    scenario: base({ lifecycle: "suspended" }),
  },
];

export function presetFor(id: string | null | undefined): Preset | undefined {
  if (!id) return undefined;
  return PRESETS.find((p) => p.id === id) ?? PRESETS.find((p) => p.legacyPersonaId === id);
}
