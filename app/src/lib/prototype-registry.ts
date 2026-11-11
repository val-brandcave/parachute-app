/**
 * Prototype registry (spec §6, state-system-draft §4.1 with the §6 axis changes).
 * The state pill and the Prototype Index both read this file. Pure data and lookups.
 */
import type { UserRole } from "@/types";
import { EARN_ENDING_DAYS, LOW_BALANCE_AT, TRIAL_GRANT_CREDITS } from "@/lib/pricing";
import { scenarioMatches, type Audience, type Scenario } from "@/lib/prototype/scenario";

export type {
  Audience,
  BonusState,
  DataState,
  Lifecycle,
  PaymentMethodState,
  RequestState,
  Scenario,
  SetupState,
  WalletState,
} from "@/lib/prototype/scenario";

export type BuildStatus = "built" | "variant" | "planned" | "retired";
export type GroupId =
  | "auth"
  | "onboarding"
  | "get-started"
  | "reviews"
  | "billing"
  | "configure"
  | "trust-learning"
  | "emails"
  | "integrations"
  | "design-system";

export interface PageState {
  id: string;
  label: string;
  description?: string;
  /** World patch applied to the scenario. */
  set?: Partial<Scenario>;
  /** Page-local view params: tab, variant, step, id. */
  view?: Record<string, string>;
  status: BuildStatus;
}

export interface ScreenDef {
  id: string;
  title: string;
  /** Pattern ok: "/reviews/[id]". */
  route: string;
  group: GroupId;
  status: BuildStatus;
  pillLabel?: string;
  states: PageState[];
  fill?: true;
  roles?: UserRole[];
  audiences?: Audience[];
  tags?: string[];
  thumb?: string;
}

export interface FlowDef {
  id: string;
  title: string;
  audience?: Audience;
  steps: { screen: string; state?: string; note?: string }[];
}

export interface Preset {
  id: string;
  label: string;
  description: string;
  scenario: Scenario;
  entry: string;
  legacyPersonaId?: string;
  status?: BuildStatus;
}

const built = "built" as const;

export const SCREENS: ScreenDef[] = [
  {
    id: "get-started",
    title: "Get started",
    route: "/get-started",
    group: "get-started",
    status: built,
    pillLabel: "Get started",
    tags: ["setup", "checklist", "credits"],
    states: [
      {
        id: "new",
        label: "Self-serve · New",
        description: `Self-serve, nothing done yet, ${TRIAL_GRANT_CREDITS} trial credits.`,
        set: { audience: "self_serve", lifecycle: "approved", wallet: "fresh", setup: "fresh", bonus: "open", data: "empty" },
        status: built,
      },
      {
        id: "mid",
        label: "Self-serve · Mid-setup",
        description: "First review run and a teammate invited.",
        set: { audience: "self_serve", lifecycle: "approved", wallet: "trial", setup: "mid", bonus: "open" },
        status: built,
      },
      {
        id: "almost",
        label: "Almost done",
        description: "One step left.",
        set: { audience: "self_serve", lifecycle: "approved", setup: "almost" },
        status: built,
      },
      {
        id: "done",
        label: "All done",
        description: "Setup is finished.",
        set: { setup: "done" },
        status: built,
      },
      {
        id: "call-booked",
        label: "Enterprise · Call booked",
        description: "Enterprise team waiting for approval; credits are held.",
        set: { audience: "enterprise", lifecycle: "pending", wallet: "held", setup: "fresh", data: "empty" },
        status: built,
      },
      {
        // The scenario has no axis for "call not booked yet"; it is a view param only.
        id: "book-later",
        label: "Enterprise · Book later",
        description: "Enterprise team that skipped booking: the tracker offers Book a call.",
        set: { audience: "enterprise", lifecycle: "pending", wallet: "held", setup: "fresh", data: "empty" },
        view: { call: "later" },
        status: built,
      },
      {
        id: "confirmed",
        label: "Enterprise · Confirmed",
        description: "Confirmed; trial credits ready, prepaid by default.",
        set: { audience: "enterprise", lifecycle: "approved", wallet: "fresh", setup: "fresh" },
        status: built,
      },
      {
        id: "confirmed-invoiced",
        label: "Enterprise · Confirmed (invoiced)",
        description: "Confirmed and invoiced: earn pills are hidden.",
        set: { audience: "enterprise", lifecycle: "approved", wallet: "invoiced", setup: "fresh" },
        status: built,
      },
      {
        id: "bonus-ending",
        label: "Bonus ending",
        description: "The setup bonus window is about to close.",
        set: { audience: "self_serve", lifecycle: "approved", setup: "mid", bonus: "ending" },
        status: built,
      },
      {
        id: "bonus-closed",
        label: "Bonus closed",
        description: "The setup bonus window has closed.",
        set: { audience: "self_serve", lifecycle: "approved", setup: "mid", bonus: "closed" },
        status: built,
      },
    ],
  },
  {
    id: "billing",
    title: "Billing & credits",
    route: "/configure/billing",
    group: "billing",
    status: built,
    pillLabel: "Billing",
    roles: ["org_admin"],
    tags: ["wallet", "credits", "invoices"],
    states: [
      { id: "trial", label: "Trial", description: "Part of the trial credits spent.", set: { audience: "self_serve", lifecycle: "approved", wallet: "trial" }, status: built },
      { id: "healthy", label: "Healthy", description: "Plenty of credits.", set: { audience: "self_serve", lifecycle: "approved", wallet: "healthy" }, status: built },
      { id: "low", label: "Low", description: `At or under ${LOW_BALANCE_AT} credits.`, set: { audience: "self_serve", lifecycle: "approved", wallet: "low" }, status: built },
      { id: "short", label: "Short", description: "Not enough for a full review.", set: { audience: "self_serve", lifecycle: "approved", wallet: "short" }, status: built },
      { id: "zero", label: "Zero", description: "No credits left.", set: { audience: "self_serve", lifecycle: "approved", wallet: "zero" }, status: built },
      { id: "expiring", label: "Expiring", description: "A purchased pack lapses soon.", set: { audience: "self_serve", lifecycle: "approved", wallet: "healthy", expiring: true }, status: built },
      { id: "auto-reload", label: "Auto-reload", description: "Auto-reload is on and has fired.", set: { audience: "self_serve", lifecycle: "approved", wallet: "low", autoReload: true, paymentMethod: "card" }, status: built },
      { id: "held", label: "Held", description: "Credits open after the setup call.", set: { audience: "enterprise", lifecycle: "pending", wallet: "held" }, status: built },
      { id: "invoiced", label: "Invoiced", description: "Billed monthly; no wallet.", set: { wallet: "invoiced" }, status: built },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    route: "/dashboard",
    group: "reviews",
    status: built,
    pillLabel: "Dashboard",
    tags: ["home", "stats"],
    states: [
      { id: "empty", label: "Empty", description: "No reviews yet.", set: { data: "empty" }, status: built },
      { id: "populated", label: "Populated", description: "A typical week.", set: { data: "populated" }, status: built },
      { id: "busy", label: "Busy", description: "A full pipeline.", set: { data: "busy" }, status: built },
      { id: "low-credits", label: "Low credits", description: "Dashboard with a low wallet.", set: { wallet: "low", data: "populated" }, status: built },
      { id: "request", label: "Request waiting", description: "A reviewer asked for credits.", set: { request: "open" }, status: built },
    ],
  },
];

export const FLOWS: FlowDef[] = [
  {
    id: "buy-credits",
    title: "Buy credits",
    audience: "self_serve",
    steps: [
      { screen: "billing", state: "low" },
      { screen: "billing", state: "healthy", note: "After checkout" },
    ],
  },
  {
    id: "enterprise-sign-up",
    title: "Enterprise sign-up",
    audience: "enterprise",
    steps: [
      { screen: "get-started", state: "call-booked" },
      { screen: "get-started", state: "pre-configured", note: "After Approve now" },
    ],
  },
];

const base = (patch: Partial<Scenario>): Scenario => ({
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
  ...patch,
});

export const PRESETS: Preset[] = [
  { id: "prospect", label: "Self-serve prospect", description: "Not signed up yet.", entry: "/auth/create-account", legacyPersonaId: "prospect", scenario: base({ lifecycle: "prospect", wallet: "held", setup: "hidden", data: "empty" }) },
  { id: "prospect-sales", label: "Enterprise verified", description: "Verified, no organization yet.", entry: "/welcome", legacyPersonaId: "prospect-sales", scenario: base({ audience: "enterprise", lifecycle: "verified", wallet: "held", setup: "hidden", data: "empty" }) },
  { id: "pending-admin", label: "Enterprise pending", description: "Waiting for approval; credits held.", entry: "/dashboard", legacyPersonaId: "pending-admin", scenario: base({ audience: "enterprise", lifecycle: "pending", wallet: "held", setup: "fresh", data: "empty" }) },
  { id: "trial-admin", label: "Self-serve trial", description: "Approved, on trial, setup under way.", entry: "/get-started", legacyPersonaId: "trial-admin", scenario: base({}) },
  { id: "payg-admin-low", label: "Self-serve low", description: "Low balance, setup done.", entry: "/dashboard", legacyPersonaId: "payg-admin-low", scenario: base({ wallet: "low", setup: "done" }) },
  { id: "reviewer", label: "Reviewer", description: "Trial org, signed in as a reviewer.", entry: "/dashboard", legacyPersonaId: "reviewer", scenario: base({ role: "reviewer" }) },
  { id: "approver", label: "Approver", description: "Healthy wallet, busy pipeline.", entry: "/dashboard", legacyPersonaId: "approver", scenario: base({ wallet: "healthy", setup: "done", role: "approver", data: "busy" }) },
  { id: "returning", label: "Enterprise approved", description: "Invoiced, set up.", entry: "/dashboard", legacyPersonaId: "returning", scenario: base({ audience: "enterprise", wallet: "invoiced", setup: "done", bonus: "closed", paymentMethod: "invoice" }) },
  { id: "enterprise-yc", label: "YouConnect", description: "Embedded in YouConnect.", entry: "/youconnect", legacyPersonaId: "enterprise-yc", scenario: base({ audience: "youconnect", wallet: "invoiced", setup: "done", bonus: "closed", paymentMethod: "invoice" }) },
  { id: "self-serve-zero", label: "Self-serve zero", description: "Out of credits.", entry: "/dashboard", scenario: base({ wallet: "zero", setup: "done" }) },
  { id: "bonus-ending", label: "Bonus ending", description: `Setup bonus closes within ${EARN_ENDING_DAYS} days.`, entry: "/get-started", scenario: base({ bonus: "ending" }) },
  { id: "bonus-closed", label: "Bonus closed", description: "Setup bonus window has closed.", entry: "/get-started", scenario: base({ bonus: "closed" }) },
  { id: "enterprise-call-booked", label: "Enterprise call booked", description: "Call booked, waiting for approval.", entry: "/get-started", scenario: base({ audience: "enterprise", lifecycle: "pending", wallet: "held", setup: "fresh", data: "empty" }) },
  { id: "enterprise-confirmed", label: "Enterprise confirmed", description: "Confirmed; trial credits ready, prepaid by default.", entry: "/get-started", scenario: base({ audience: "enterprise", wallet: "fresh", setup: "fresh" }) },
  { id: "reviewer-request-waiting", label: "Reviewer request waiting", description: "A reviewer asked an admin for credits.", entry: "/dashboard", scenario: base({ wallet: "short", request: "open" }) },
  { id: "suspended", label: "Suspended", description: "Planned (Q-E6).", entry: "/dashboard", status: "planned", scenario: base({ lifecycle: "suspended", wallet: "trial" }) },
];

/** Segments of a route pattern match `[param]` against any one path segment. */
function matchRoute(pattern: string, pathname: string): boolean {
  const a = pattern.split("/").filter(Boolean);
  const b = pathname.split("/").filter(Boolean);
  if (a.length !== b.length) return false;
  return a.every((seg, i) => (seg.startsWith("[") && seg.endsWith("]") ? true : seg === b[i]));
}

export function screenForPath(pathname: string): ScreenDef | undefined {
  const path = pathname.split(/[?#]/)[0];
  const exact = SCREENS.find((s) => !s.route.includes("[") && matchRoute(s.route, path));
  return exact ?? SCREENS.find((s) => s.route.includes("[") && matchRoute(s.route, path));
}

/**
 * The state the pill highlights: every `set` key equals the scenario and every `view` key
 * equals its URL param. The most specific match wins; a state with neither `set` nor `view`
 * never matches. No match means "Custom".
 */
export function activeState(screen: ScreenDef, sc: Scenario, view: URLSearchParams): PageState | undefined {
  let best: PageState | undefined;
  let bestScore = 0;
  for (const st of screen.states) {
    const setKeys = Object.keys(st.set ?? {}).length;
    const viewEntries = Object.entries(st.view ?? {});
    const score = setKeys + viewEntries.length;
    if (score === 0) continue;
    if (st.set && !scenarioMatches(sc, st.set)) continue;
    if (!viewEntries.every(([k, v]) => view.get(k) === v)) continue;
    if (score > bestScore) {
      best = st;
      bestScore = score;
    }
  }
  return best;
}
