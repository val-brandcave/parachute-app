/**
 * Prototype registry (spec §6, state-system-draft §4.1 with the §6 axis changes).
 * The state pill and the Prototype Index both read this file. Pure data and lookups.
 */
import type { UserRole } from "@/types";
import { LOW_BALANCE_AT, TRIAL_GRANT_CREDITS } from "@/lib/pricing";
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

export type { Preset } from "@/lib/prototype/presets";

const built = "built" as const;

/** Billing state bases: self-serve, approved, with reviews, as the admin or as a reviewer.
 *  `data` is pinned because Held (pending) forces it empty, and invoiced usage is its reviews. */
const SS_ADMIN: Partial<Scenario> = { audience: "self_serve", lifecycle: "approved", role: "org_admin", data: "populated" };
const SS_REVIEWER: Partial<Scenario> = { audience: "self_serve", lifecycle: "approved", role: "reviewer", data: "populated" };

/** Shorthand for a state with a world patch. */
const st = (id: string, label: string, set?: Partial<Scenario>, description?: string, view?: Record<string, string>): PageState => ({
  id,
  label,
  description,
  set,
  view,
  status: built,
});
/** Auth screens: a variant is a URL param only (the page reads `?variant=`). */
const variant = (id: string, label: string, description: string): PageState => ({
  id,
  label,
  description,
  view: { variant: id },
  status: built,
});

const SELF = { audience: "self_serve", lifecycle: "approved" } as const satisfies Partial<Scenario>;
const ENT_PENDING = { audience: "enterprise", lifecycle: "pending", wallet: "held", setup: "fresh", data: "empty" } as const satisfies Partial<Scenario>;

export const SCREENS: ScreenDef[] = [
  // ───────────────────────────── Auth ─────────────────────────────
  {
    id: "create-account",
    title: "Create account",
    route: "/auth/create-account",
    group: "auth",
    status: built,
    pillLabel: "Create account",
    fill: true,
    tags: ["keycloak", "register", "sign up"],
    states: [
      st("default", "Default", undefined, "Pre-filled demo account.", { variant: "default" }),
      variant("invalid-email", "Bad email", "The email check has failed."),
      variant("weak-password", "Weak password", "The password is under 12 characters."),
    ],
  },
  {
    id: "verify",
    title: "Verify email",
    route: "/auth/verify",
    group: "auth",
    status: built,
    pillLabel: "Verify",
    fill: true,
    tags: ["keycloak", "code", "otp"],
    states: [
      st("default", "Default", undefined, "Waiting for the six digits.", { variant: "default" }),
      variant("wrong-code", "Wrong code", "The code did not match."),
      variant("expired", "Expired", "The code has expired."),
    ],
  },
  {
    id: "sign-in",
    title: "Sign in",
    route: "/auth/sign-in",
    group: "auth",
    status: built,
    pillLabel: "Sign in",
    fill: true,
    tags: ["keycloak", "login", "password"],
    states: [
      st("default", "Default", undefined, "Email first.", { variant: "default" }),
      variant("bad-credentials", "Bad password", "The password step with a wrong-credentials error."),
    ],
  },
  {
    id: "reset",
    title: "Reset password",
    route: "/auth/reset",
    group: "auth",
    status: built,
    pillLabel: "Reset",
    fill: true,
    tags: ["keycloak", "forgot"],
    states: [st("default", "Default", undefined, "Ask for the email.", { variant: "default" }), variant("sent", "Sent", "The link-sent confirmation.")],
  },
  {
    id: "mfa",
    title: "Authenticator code",
    route: "/auth/mfa",
    group: "auth",
    status: built,
    pillLabel: "MFA",
    fill: true,
    tags: ["keycloak", "otp", "two-factor"],
    states: [st("default", "Default", undefined, "Waiting for the six digits.", { variant: "default" }), variant("wrong-code", "Wrong code", "The code did not match.")],
  },

  // ───────────────────────────── Onboarding ─────────────────────────────
  {
    id: "welcome",
    title: "Set up your organization",
    route: "/welcome",
    group: "onboarding",
    status: built,
    pillLabel: "Org setup",
    fill: true,
    tags: ["onboarding", "routing", "team", "volume"],
    states: [
      st("self-serve", "Self-serve", { audience: "self_serve", lifecycle: "verified", wallet: "held", setup: "hidden", data: "empty" }, "Verified, no organization yet. Wand fills 2–10 reviewers, under 50 reports."),
      st("enterprise", "Enterprise", { audience: "enterprise", lifecycle: "verified", wallet: "held", setup: "hidden", data: "empty" }, "Verified, no organization yet. Shift-wand fills 11+ reviewers, 200+ reports."),
    ],
  },
  {
    id: "welcome-path",
    title: "Choose a path",
    route: "/welcome/path",
    group: "onboarding",
    status: built,
    pillLabel: "Path",
    tags: ["onboarding"],
    states: [],
  },
  {
    id: "welcome-call",
    title: "Book a setup call",
    route: "/welcome/call",
    group: "onboarding",
    status: built,
    pillLabel: "Setup call",
    fill: true,
    audiences: ["enterprise"],
    tags: ["onboarding", "call", "scheduler"],
    states: [st("pick", "Pick a time", { audience: "enterprise", lifecycle: "verified", wallet: "held", setup: "hidden", data: "empty" }, "Enterprise, no call booked yet.")],
  },
  {
    id: "welcome-invite",
    title: "Invite your team",
    route: "/welcome/invite",
    group: "onboarding",
    status: built,
    pillLabel: "Invite",
    fill: true,
    tags: ["onboarding", "invite", "team"],
    states: [],
  },
  {
    id: "welcome-pending",
    title: "Waiting for approval",
    route: "/welcome/pending",
    group: "onboarding",
    status: built,
    pillLabel: "Pending",
    audiences: ["enterprise"],
    tags: ["onboarding", "approval"],
    states: [st("pending", "Pending", ENT_PENDING, "Enterprise, waiting for approval.")],
  },
  {
    id: "welcome-ready",
    title: "You are in",
    route: "/welcome/ready",
    group: "onboarding",
    status: built,
    pillLabel: "Ready",
    tags: ["onboarding", "interstitial"],
    states: [],
  },

  // ───────────────────────────── Get started ─────────────────────────────
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
        label: "New",
        description: `Self-serve, nothing done yet, ${TRIAL_GRANT_CREDITS} trial credits.`,
        set: { audience: "self_serve", lifecycle: "approved", wallet: "fresh", setup: "fresh", bonus: "open", data: "empty" },
        status: built,
      },
      {
        id: "mid",
        label: "Mid-setup",
        description: "First review run and a teammate invited.",
        set: { audience: "self_serve", lifecycle: "approved", wallet: "trial", setup: "mid", bonus: "open" },
        status: built,
      },
      {
        id: "almost",
        label: "Almost",
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
        label: "Call booked",
        description: "Enterprise team waiting for approval; credits are held.",
        set: { audience: "enterprise", lifecycle: "pending", wallet: "held", setup: "fresh", data: "empty" },
        status: built,
      },
      {
        // The scenario has no axis for "call not booked yet"; it is a view param only.
        id: "book-later",
        label: "Book later",
        description: "Enterprise team that skipped booking: the tracker offers Book a call.",
        set: { audience: "enterprise", lifecycle: "pending", wallet: "held", setup: "fresh", data: "empty" },
        view: { call: "later" },
        status: built,
      },
      {
        id: "confirmed",
        label: "Confirmed",
        description: "Confirmed; trial credits ready, prepaid by default.",
        set: { audience: "enterprise", lifecycle: "approved", wallet: "fresh", setup: "fresh" },
        status: built,
      },
      {
        id: "confirmed-invoiced",
        label: "Invoiced",
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

  // ───────────────────────────── Reviews ─────────────────────────────
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
  {
    id: "launchpad",
    title: "Start a review",
    route: "/launchpad",
    group: "reviews",
    status: built,
    pillLabel: "Start",
    tags: ["order", "upload", "start", "lock"],
    states: [
      st("ready", "Ready", { ...SELF, wallet: "healthy" }, "Enough credits to start."),
      st("short", "Short", { ...SELF, wallet: "short" }, "Not enough for a full review: Start explains."),
      st("zero", "Zero", { ...SELF, wallet: "zero" }, "No credits left: Start explains."),
      st("pending", "Pending", ENT_PENDING, "Waiting on Realwired: Start explains."),
      st("reviewer-short", "Reviewer · Short", { ...SELF, wallet: "short", role: "reviewer" }, "A reviewer can ask an admin for credits."),
    ],
  },
  {
    id: "reviews",
    title: "Reviews",
    route: "/reviews",
    group: "reviews",
    status: built,
    pillLabel: "Reviews",
    tags: ["queue", "table"],
    states: [
      st("empty", "Empty", { data: "empty" }, "No reviews yet."),
      st("populated", "Populated", { data: "populated" }, "A typical queue."),
      st("busy", "Busy", { data: "busy" }, "A full pipeline."),
    ],
  },
  {
    id: "review",
    title: "Review",
    route: "/reviews/[id]",
    group: "reviews",
    status: built,
    pillLabel: "Review",
    tags: ["workbook", "run", "sign", "findings"],
    states: [],
  },

  // ───────────────────────────── Billing & credits ─────────────────────────────
  {
    id: "billing",
    title: "Billing & credits",
    route: "/configure/billing",
    group: "billing",
    status: built,
    pillLabel: "Billing",
    tags: ["wallet", "credits", "invoices"],
    // Every spec §5.8 row, one click each (T5.4 fix round 1). Admin states pin `role:
    // org_admin` so they read as themselves after a reviewer state.
    states: [
      { id: "fresh", label: "Never used", description: `${TRIAL_GRANT_CREDITS} trial credits, nothing spent.`, set: { ...SS_ADMIN, wallet: "fresh", bonus: "open", data: "empty" }, status: built },
      { id: "trial", label: "Trial", description: "Part of the trial credits spent.", set: { ...SS_ADMIN, wallet: "trial" }, status: built },
      { id: "healthy", label: "Healthy", description: "Plenty of credits.", set: { ...SS_ADMIN, wallet: "healthy" }, status: built },
      { id: "low", label: "Low", description: `At or under ${LOW_BALANCE_AT} credits.`, set: { ...SS_ADMIN, wallet: "low" }, status: built },
      { id: "short", label: "Short", description: "Not enough for a full review.", set: { ...SS_ADMIN, wallet: "short" }, status: built },
      { id: "zero", label: "Zero", description: "No credits left.", set: { ...SS_ADMIN, wallet: "zero" }, status: built },
      { id: "expiring", label: "Expiring", description: "A purchased pack lapses soon.", set: { ...SS_ADMIN, wallet: "healthy", expiring: true }, status: built },
      { id: "auto-reload", label: "Auto-reload", description: "Auto-reload is on and has fired.", set: { ...SS_ADMIN, wallet: "low", autoReload: true, paymentMethod: "card" }, status: built },
      { id: "bonus-ending", label: "Bonus ending", description: "The setup bonus window is about to close.", set: { ...SS_ADMIN, wallet: "trial", bonus: "ending" }, status: built },
      { id: "bonus-closed", label: "Bonus closed", description: "The setup bonus window has closed.", set: { ...SS_ADMIN, wallet: "trial", bonus: "closed" }, status: built },
      { id: "held", label: "Held", description: "Credits open after the setup call.", set: { audience: "enterprise", lifecycle: "pending", wallet: "held", role: "org_admin" }, status: built },
      // Spec §5.8: a self-serve org that moved to monthly invoicing after a call (not a sales-led
      // enterprise org, which would still be on Get started and show the never-used Usage page).
      { id: "invoiced", label: "Invoiced", description: "Billed monthly; no wallet.", set: { ...SS_ADMIN, wallet: "invoiced" }, status: built },
      { id: "reviewer-healthy", label: "Reviewer healthy", description: "A reviewer's view of a healthy team balance.", set: { ...SS_REVIEWER, wallet: "healthy" }, status: built },
      { id: "reviewer-low", label: "Reviewer low", description: "A reviewer's view of a low team balance.", set: { ...SS_REVIEWER, wallet: "low" }, status: built },
      { id: "reviewer-zero", label: "Reviewer zero", description: "A reviewer's view at zero.", set: { ...SS_REVIEWER, wallet: "zero" }, status: built },
      { id: "reviewer-requested", label: "Reviewer asked", description: "The reviewer asked the admin for more credits.", set: { ...SS_REVIEWER, wallet: "short", request: "open" }, status: built },
    ],
  },
  {
    id: "billing-credits",
    title: "Credit history",
    route: "/configure/billing/credits",
    group: "billing",
    status: built,
    pillLabel: "Credit history",
    roles: ["org_admin"],
    tags: ["ledger", "credits"],
    states: [],
  },
  {
    id: "billing-statement",
    title: "Statement",
    route: "/configure/billing/statement",
    group: "billing",
    status: built,
    pillLabel: "Statement",
    roles: ["org_admin"],
    tags: ["invoice", "statement", "print"],
    states: [],
  },
  {
    id: "checkout",
    title: "Checkout",
    route: "/checkout/credits",
    group: "billing",
    status: built,
    pillLabel: "Checkout",
    roles: ["org_admin"],
    tags: ["credits", "buy", "pay"],
    states: [
      { id: "amount", label: "Amount", view: { step: "amount" }, status: built },
      { id: "payment", label: "Payment", view: { step: "payment" }, status: built },
      { id: "review", label: "Review", view: { step: "review" }, status: built },
      { id: "paid", label: "Paid", view: { step: "done" }, status: built },
      { id: "declined", label: "Card declined", view: { step: "payment", error: "card" }, status: built },
    ],
  },

  // ───────────────────────────── Configure ─────────────────────────────
  {
    id: "configure",
    title: "Configure",
    route: "/configure",
    group: "configure",
    status: built,
    pillLabel: "Configure",
    roles: ["org_admin"],
    tags: ["settings", "hub"],
    states: [],
  },
  {
    id: "organization",
    title: "Organization",
    route: "/configure/organization",
    group: "configure",
    status: built,
    pillLabel: "Organization",
    roles: ["org_admin"],
    tags: ["settings", "members", "profile"],
    states: [],
  },
  {
    id: "defaults",
    title: "Review defaults",
    route: "/configure/defaults",
    group: "configure",
    status: built,
    pillLabel: "Defaults",
    roles: ["org_admin"],
    tags: ["settings", "intake", "deliverables"],
    states: [],
  },
  {
    id: "checklists",
    title: "Compliance checklists",
    route: "/configure/checklists",
    group: "configure",
    status: built,
    pillLabel: "Checklists",
    roles: ["org_admin"],
    tags: ["checklist", "policy"],
    states: [],
  },
  {
    id: "checklist",
    title: "Checklist editor",
    route: "/configure/checklists/[id]",
    group: "configure",
    status: built,
    pillLabel: "Checklist",
    roles: ["org_admin"],
    tags: ["checklist", "mapper"],
    states: [],
  },
  {
    id: "responses",
    title: "Response library",
    route: "/configure/responses",
    group: "configure",
    status: built,
    pillLabel: "Responses",
    roles: ["org_admin"],
    tags: ["responses", "library"],
    states: [],
  },
  {
    id: "workbook-layouts",
    title: "Workbook layouts",
    route: "/configure/workbook-layouts",
    group: "configure",
    status: built,
    pillLabel: "Layouts",
    roles: ["org_admin"],
    tags: ["workbook", "layout"],
    states: [],
  },
  {
    id: "workbook-layout",
    title: "Org workbook layout",
    route: "/configure/workbook-layouts/view",
    group: "configure",
    status: built,
    pillLabel: "Layout",
    roles: ["org_admin"],
    tags: ["workbook", "layout"],
    states: [],
  },
  {
    id: "security",
    title: "Security",
    route: "/configure/security",
    group: "configure",
    status: built,
    pillLabel: "Security",
    roles: ["org_admin"],
    tags: ["trust", "pack", "it"],
    states: [],
  },
  {
    id: "profile",
    title: "Profile",
    route: "/profile",
    group: "configure",
    status: built,
    pillLabel: "Profile",
    tags: ["theme", "density", "notifications"],
    states: [],
  },

  // ───────────────────────────── Trust & Learning ─────────────────────────────
  {
    id: "trust",
    title: "Trust Center",
    route: "/trust",
    group: "trust-learning",
    status: built,
    pillLabel: "Trust Center",
    tags: ["security", "vendor"],
    states: [],
  },
  {
    id: "learn",
    title: "Learning Center",
    route: "/learn",
    group: "trust-learning",
    status: built,
    pillLabel: "Learning Center",
    tags: ["guides", "videos"],
    states: [],
  },

  {
    id: "shared-trust",
    title: "Shared Trust Center",
    route: "/shared/trust/[token]",
    group: "trust-learning",
    status: built,
    pillLabel: "Shared link",
    tags: ["security", "vendor", "public", "it", "share"],
    states: [],
  },

  // ───────────────────────────── Emails ─────────────────────────────
  {
    id: "emails",
    title: "E-mail previews",
    route: "/emails",
    group: "emails",
    status: built,
    pillLabel: "E-mails",
    tags: ["receipt", "notification", "transactional"],
    states: [],
  },

  // ───────────────────────────── Integrations ─────────────────────────────
  {
    id: "youconnect",
    title: "YouConnect",
    route: "/youconnect",
    group: "integrations",
    status: built,
    pillLabel: "YouConnect",
    audiences: ["youconnect"],
    tags: ["embedded", "partner"],
    states: [],
  },
  {
    id: "launch",
    title: "Launch",
    route: "/launch",
    group: "integrations",
    status: built,
    pillLabel: "Launch",
    audiences: ["youconnect"],
    tags: ["embedded", "sso", "interstitial"],
    states: [],
  },
  {
    id: "launch-bouncer",
    title: "Launch (Bouncer)",
    route: "/launch/bouncer",
    group: "integrations",
    status: "variant",
    pillLabel: "Launch",
    tags: ["bouncer", "embedded", "sso"],
    states: [],
  },
  {
    id: "bouncer",
    title: "Bouncer",
    route: "/bouncer",
    group: "integrations",
    status: built,
    pillLabel: "Bouncer",
    tags: ["admin", "invite", "access"],
    states: [],
  },

  // ───────────────────────────── Design system and prototype ─────────────────────────────
  {
    id: "components",
    title: "Components",
    route: "/components",
    group: "design-system",
    status: built,
    pillLabel: "Components",
    tags: ["design system", "patterns"],
    states: [],
  },
  {
    id: "styleguide",
    title: "Style guide",
    route: "/styleguide",
    group: "design-system",
    status: built,
    pillLabel: "Style guide",
    tags: ["design system", "tokens", "type"],
    states: [],
  },
  {
    id: "prototype",
    title: "Prototype Index",
    route: "/prototype",
    group: "design-system",
    status: built,
    pillLabel: "Index",
    tags: ["index", "states", "flows"],
    states: [],
  },
  {
    id: "start",
    title: "Start (launcher)",
    route: "/start",
    group: "design-system",
    status: "retired",
    pillLabel: "Start",
    tags: ["launcher", "personas"],
    states: [],
  },
  {
    id: "demo-persona",
    title: "Demo persona alias",
    route: "/demo/[persona]",
    group: "design-system",
    status: "variant",
    pillLabel: "Demo",
    tags: ["alias", "preset", "legacy"],
    states: [],
  },
];

/** Routes with a `page.tsx` that are plumbing, not screens (the dev check skips them). */
export const NON_SCREEN_ROUTES = ["/prototype/go"];

export const FLOWS: FlowDef[] = [
  {
    id: "self-serve-sign-up",
    title: "Self-serve sign-up",
    audience: "self_serve",
    steps: [
      { screen: "create-account" },
      { screen: "verify", note: "Any six digits except 000000" },
      { screen: "welcome", state: "self-serve", note: "Wand fills 2–10 / Under 50" },
      { screen: "get-started", state: "new", note: "Trial credits granted" },
    ],
  },
  {
    id: "enterprise-sign-up",
    title: "Enterprise sign-up",
    audience: "enterprise",
    steps: [
      { screen: "create-account" },
      { screen: "verify" },
      { screen: "welcome", state: "enterprise", note: "Shift-wand fills 11+ / 200+" },
      { screen: "welcome-call", state: "pick" },
      { screen: "get-started", state: "call-booked" },
      { screen: "get-started", state: "confirmed", note: "After Approve now" },
    ],
  },
  {
    id: "first-review",
    title: "First review",
    audience: "self_serve",
    steps: [
      { screen: "get-started", state: "new" },
      { screen: "launchpad", state: "ready" },
      { screen: "review", note: "Confirm, progress, workbook, sign" },
      { screen: "get-started", state: "mid", note: "First review done" },
    ],
  },
  {
    id: "buy-credits",
    title: "Buy credits",
    audience: "self_serve",
    steps: [
      { screen: "billing", state: "low" },
      { screen: "checkout", state: "amount" },
      { screen: "checkout", state: "payment" },
      { screen: "checkout", state: "review" },
      { screen: "checkout", state: "paid" },
      { screen: "billing", state: "healthy", note: "After checkout" },
    ],
  },
  {
    id: "out-of-credits",
    title: "Out of credits at Start",
    audience: "self_serve",
    steps: [
      { screen: "dashboard", state: "low-credits" },
      { screen: "launchpad", state: "zero", note: "Start explains" },
      { screen: "checkout", state: "amount", note: "Prefilled with the shortfall" },
      { screen: "launchpad", state: "ready", note: "Back with credits" },
    ],
  },
  {
    id: "reviewer-asks",
    title: "Reviewer asks for credits",
    audience: "self_serve",
    steps: [
      { screen: "launchpad", state: "reviewer-short", note: "Reviewer sends the request" },
      { screen: "dashboard", state: "request", note: "Admin sees it waiting" },
      { screen: "checkout", state: "amount" },
    ],
  },
  {
    id: "reviewer-day",
    title: "Reviewer day",
    audience: "self_serve",
    steps: [
      { screen: "reviews", state: "populated" },
      { screen: "review", note: "Ready, then sign" },
      { screen: "dashboard", state: "populated" },
    ],
  },
  {
    id: "youconnect-embedded",
    title: "YouConnect embedded",
    audience: "youconnect",
    steps: [
      { screen: "youconnect" },
      { screen: "launch", note: "Sign-in hand-off" },
      { screen: "review", note: "Embedded run, returns on sign" },
    ],
  },
  {
    id: "trust-handoff",
    title: "Trust Center hand-off to IT",
    audience: "enterprise",
    steps: [
      { screen: "get-started", state: "call-booked", note: "Before your call: invite IT" },
      { screen: "security", note: "Send the security pack" },
      { screen: "trust", note: "What IT sees" },
    ],
  },
];

// PRESETS live in lib/prototype/presets.ts (T5.0; filled by T5.4); re-exported here so the
// pill, the Index and the tests keep one import path.
export { PRESETS } from "@/lib/prototype/presets";

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
