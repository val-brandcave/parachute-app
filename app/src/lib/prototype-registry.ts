/**
 * Prototype registry (spec §6, state-system-draft §4.1 with the §6 axis changes).
 * The state pill and the Prototype Index both read this file. Pure data and lookups.
 */
import type { UserRole } from "@/types";
import { LOW_BALANCE_AT, TRIAL_GRANT_CREDITS } from "@/lib/pricing";
import { presetFor } from "@/lib/prototype/presets";
import { normalize } from "@/lib/prototype/scenario-builder";
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
  /** Shown inline in the pill. The rest sit under "More" (no key states: the first 4 inline). */
  key?: boolean;
  /** Heading for this state in the pill's More list ("Self-serve", "Enterprise", "Reviewer view", "Edge cases"). */
  group?: string;
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
  /**
   * The world this screen needs, applied under every state's `set` (and on a plain screen
   * landing), so a state lands showing what its label says whatever the previous screen left
   * behind (a reviewer role from Billing must not lock Checkout).
   */
  base?: Partial<Scenario>;
  /**
   * Where this screen renders besides `route`: a path plus query params that must match. A
   * tab of another route's page (How credits work is `/configure/billing?tab=credits`).
   */
  alsoAt?: { path: string; query: Record<string, string> };
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

/** Pill placement: `key` shows the state inline; `grouped` files it under a More heading. */
const key = (s: PageState): PageState => ({ ...s, key: true });
const grouped = (group: string, s: PageState): PageState => ({ ...s, group });
const SELF_SERVE = "Self-serve";
const ENTERPRISE = "Enterprise";
const REVIEWER_VIEW = "Reviewer view";
const EDGE = "Edge cases";

const SELF = { audience: "self_serve", lifecycle: "approved" } as const satisfies Partial<Scenario>;
const ADMIN = { role: "org_admin" } as const satisfies Partial<Scenario>;

/**
 * Billing & credits states, every spec §5.8 row (T5.4 fix round 1). Admin states pin
 * `role: org_admin` so they read as themselves after a reviewer state. Shared by the
 * Overview (`billing`) and the How credits work tab (`billing-credits`, a subset).
 */
const BILLING_STATES: PageState[] = [
  key(st("healthy", "Healthy", { ...SS_ADMIN, wallet: "healthy" }, "Plenty of credits.")),
  key(st("low", "Low", { ...SS_ADMIN, wallet: "low" }, `At or under ${LOW_BALANCE_AT} credits.`)),
  key(st("zero", "Zero", { ...SS_ADMIN, wallet: "zero" }, "No credits left.")),
  // Spec §5.8: a self-serve org that moved to monthly invoicing after a call (not a sales-led
  // enterprise org, which would still be on Get started and show the never-used Usage page).
  key(st("invoiced", "Invoiced", { ...SS_ADMIN, wallet: "invoiced" }, "Billed monthly; no wallet.")),
  grouped(SELF_SERVE, st("fresh", "Never used", { ...SS_ADMIN, wallet: "fresh", bonus: "open", data: "empty" }, `${TRIAL_GRANT_CREDITS} trial credits, nothing spent.`)),
  grouped(SELF_SERVE, st("trial", "Trial", { ...SS_ADMIN, wallet: "trial" }, "Part of the trial credits spent.")),
  grouped(SELF_SERVE, st("short", "Short", { ...SS_ADMIN, wallet: "short" }, "Not enough for a full review.")),
  // Overview-only modifiers: the expiry alert, the auto-reload chip (vs the offer), BonusNotice.
  grouped(EDGE, st("expiring", "Expiring", { ...SS_ADMIN, wallet: "healthy", expiring: true }, "A purchased pack lapses soon.")),
  grouped(EDGE, st("auto-reload", "Auto-reload", { ...SS_ADMIN, wallet: "low", autoReload: true, paymentMethod: "card" }, "Auto-reload is on and has fired.")),
  grouped(EDGE, st("bonus-ending", "Bonus ending", { ...SS_ADMIN, wallet: "trial", bonus: "ending" }, "The setup bonus window is about to close.")),
  grouped(EDGE, st("bonus-closed", "Bonus closed", { ...SS_ADMIN, wallet: "trial", bonus: "closed" }, "The setup bonus window has closed.")),
  grouped(ENTERPRISE, st("held", "Held", { audience: "enterprise", lifecycle: "pending", wallet: "held", role: "org_admin" }, "Credits open after the setup call.")),
  grouped(REVIEWER_VIEW, st("reviewer-healthy", "Reviewer healthy", { ...SS_REVIEWER, wallet: "healthy" }, "A reviewer's view of a healthy team balance.")),
  grouped(REVIEWER_VIEW, st("reviewer-low", "Reviewer low", { ...SS_REVIEWER, wallet: "low" }, "A reviewer's view of a low team balance.")),
  grouped(REVIEWER_VIEW, st("reviewer-zero", "Reviewer zero", { ...SS_REVIEWER, wallet: "zero" }, "A reviewer's view at zero.")),
  grouped(REVIEWER_VIEW, st("reviewer-requested", "Reviewer asked", { ...SS_REVIEWER, wallet: "short", request: "open" }, "The reviewer asked the admin for more credits.")),
];

/**
 * How credits work reads only the role, invoiced and held (CreditsExplainer, BillingBand);
 * the header pill adds the balance. Expiring, Auto-reload and Bonus ending / closed render
 * exactly like Healthy, Low and Trial there, and the reviewer balances differ only in the
 * header number, so one Reviewer state stands for them.
 */
const CREDITS_TAB_IDS = ["healthy", "low", "zero", "invoiced", "fresh", "trial", "short", "held"];
const CREDITS_TAB_STATES: PageState[] = [
  ...BILLING_STATES.filter((s) => CREDITS_TAB_IDS.includes(s.id)),
  { ...BILLING_STATES.find((s) => s.id === "reviewer-healthy")!, label: "Reviewer", description: "A reviewer's view: no sales panel, no Add credits." },
];

/** The checkout recipe's latest pack (wallet low: the pack5 bought after the pack10). `step=done`
 *  only renders with a receipt that exists; scenario-builder.test pins this id. */
export const CHECKOUT_PAID_RECEIPT = "RCT-41008";
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
    // Retired step: page.tsx is an unconditional server redirect to /get-started, so no
    // scenario reaches it and it has no states of its own.
    status: "retired",
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
    // Retired step: page.tsx is an unconditional server redirect to /get-started, so no
    // scenario reaches it and it has no states of its own.
    status: "retired",
    pillLabel: "Pending",
    audiences: ["enterprise"],
    tags: ["onboarding", "approval"],
    states: [],
  },
  {
    id: "welcome-ready",
    title: "You are in",
    route: "/welcome/ready",
    group: "onboarding",
    // Retired step: page.tsx is an unconditional server redirect to /get-started, so no
    // scenario reaches it and it has no states of its own.
    status: "retired",
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
    // Every state as the admin: a reviewer state left over from Billing must not leak in.
    base: ADMIN,
    states: [
      {
        id: "new",
        label: "New",
        description: `Self-serve, nothing done yet, ${TRIAL_GRANT_CREDITS} trial credits.`,
        set: { audience: "self_serve", lifecycle: "approved", wallet: "fresh", setup: "fresh", bonus: "open", data: "empty" },
        status: built,
        key: true,
      },
      {
        id: "mid",
        label: "Mid-setup",
        description: "First review run and a teammate invited.",
        set: { audience: "self_serve", lifecycle: "approved", wallet: "trial", setup: "mid", bonus: "open" },
        status: built,
        key: true,
      },
      {
        id: "almost",
        label: "Almost",
        description: "One step left.",
        set: { audience: "self_serve", lifecycle: "approved", setup: "almost" },
        status: built,
        group: "Self-serve",
      },
      {
        id: "done",
        label: "All done",
        description: "Setup is finished.",
        // Wallet + bonus pinned (like Mid-setup), so the 4 earned credits land on top of the
        // trial's 4 and the header agrees with "You earned 4 credits".
        set: { audience: "self_serve", lifecycle: "approved", wallet: "trial", setup: "done", bonus: "open" },
        status: built,
        key: true,
      },
      {
        id: "call-booked",
        label: "Call booked",
        description: "Enterprise team waiting for approval; credits are held.",
        set: { audience: "enterprise", lifecycle: "pending", wallet: "held", setup: "fresh", data: "empty" },
        status: built,
        key: true,
      },
      {
        // The scenario has no axis for "call not booked yet"; it is a view param only.
        id: "book-later",
        label: "Book later",
        description: "Enterprise team that skipped booking: the tracker offers Book a call.",
        set: { audience: "enterprise", lifecycle: "pending", wallet: "held", setup: "fresh", data: "empty" },
        view: { call: "later" },
        status: built,
        group: "Enterprise",
      },
      {
        id: "confirmed",
        label: "Confirmed",
        description: "Confirmed; trial credits ready, prepaid by default.",
        set: { audience: "enterprise", lifecycle: "approved", wallet: "fresh", setup: "fresh" },
        status: built,
        group: "Enterprise",
      },
      {
        id: "confirmed-invoiced",
        label: "Invoiced",
        description: "Confirmed and invoiced: earn pills are hidden.",
        set: { audience: "enterprise", lifecycle: "approved", wallet: "invoiced", setup: "fresh" },
        status: built,
        group: "Enterprise",
      },
      {
        id: "bonus-ending",
        label: "Bonus ending",
        description: "The setup bonus window is about to close.",
        set: { audience: "self_serve", lifecycle: "approved", setup: "mid", bonus: "ending" },
        status: built,
        group: "Edge cases",
      },
      {
        id: "bonus-closed",
        label: "Bonus closed",
        description: "The setup bonus window has closed.",
        set: { audience: "self_serve", lifecycle: "approved", setup: "mid", bonus: "closed" },
        status: built,
        group: "Edge cases",
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
      key(st("empty", "Empty", { data: "empty" }, "No reviews yet.")),
      key(st("populated", "Populated", { data: "populated" }, "A typical week.")),
      key(st("busy", "Busy", { data: "busy", wallet: "invoiced" }, "An established bank, a full month.")),
      key(st("low-credits", "Low credits", { wallet: "low", data: "populated" }, "Dashboard with a low wallet.")),
      // Role lens (dashboard v2, 21 Nov 2026): same page, sections reorder per role.
      // Role lens + Busy show an ESTABLISHED (invoiced) bank with a full month of mock data
      // (Val, 21 Nov); Populated stays the trial org's own small data the flows land on.
      // The extra `wallet` key also makes each one out-score Low credits / Populated in `activeState`.
      grouped("Role lens", st("as-reviewer", "As reviewer", { role: "reviewer", data: "populated", wallet: "invoiced" }, "Their work first, then value, then insights.")),
      grouped("Role lens", st("as-approver", "As chief appraiser", { role: "approver", data: "busy", wallet: "invoiced" }, "Insights, firms and portfolio risk right after the work.")),
      grouped("Role lens", st("as-admin", "As admin", { role: "org_admin", data: "populated", wallet: "invoiced" }, "Value band (with spend) leads, then the work.")),
      // The request shows in the admin's header credits popover: pin the admin.
      grouped("Credits", st("request", "Request waiting", { ...ADMIN, request: "open" }, "A reviewer asked for credits; the admin sees it in the credits pill.")),
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
    // The admin, unless the state says reviewer (Start's lock reason depends on the role).
    base: ADMIN,
    states: [
      key(st("ready", "Ready", { ...SELF, wallet: "healthy" }, "Enough credits to start.")),
      key(st("short", "Short", { ...SELF, wallet: "short" }, "Not enough for a full review: Start explains.")),
      key(st("zero", "Zero", { ...SELF, wallet: "zero" }, "No credits left: Start explains.")),
      key(st("pending", "Pending", ENT_PENDING, "Waiting on Realwired: Start explains.")),
      grouped(REVIEWER_VIEW, st("reviewer-short", "Reviewer · Short", { ...SELF, wallet: "short", role: "reviewer" }, "A reviewer can ask an admin for credits.")),
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
    // The Overview tab (and Usage, Invoices, Settings): every spec §5.8 row, one click each.
    states: BILLING_STATES,
  },
  {
    // `/configure/billing/credits` redirects to the How credits work tab; the pill shows this
    // screen's states there (alsoAt), not the Overview's.
    id: "billing-credits",
    title: "How credits work",
    route: "/configure/billing/credits",
    alsoAt: { path: "/configure/billing", query: { tab: "credits" } },
    group: "billing",
    status: built,
    pillLabel: "How credits work",
    tags: ["explainer", "credits", "faq"],
    states: CREDITS_TAB_STATES,
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
    // An admin of an approved, metered (pay-as-you-go) org with a saved card: anything else
    // locks the page (role, approval) or has no checkout at all (invoiced).
    base: { ...SS_ADMIN, wallet: "low", paymentMethod: "card" },
    states: [
      key({ id: "amount", label: "Amount", description: "Pick a pack or a custom amount.", view: { step: "amount" }, status: built }),
      key({ id: "payment", label: "Payment", description: "The saved card, or a new one.", view: { step: "payment" }, status: built }),
      // id kept as "review" (deep links, flows); the step is called Checkout in the UI.
      key({ id: "review", label: "Checkout", description: "Review and pay.", view: { step: "review" }, status: built }),
      // step=done renders only with a receipt that exists in the ledger.
      key({ id: "paid", label: "Paid", description: "The receipt for the latest pack.", view: { step: "done", receipt: CHECKOUT_PAID_RECEIPT }, status: built }),
      grouped(EDGE, { id: "declined", label: "Card declined", description: "Payment with the card-declined error.", view: { step: "payment", error: "card" }, status: built }),
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

export function screenForPath(pathname: string, query?: URLSearchParams | string): ScreenDef | undefined {
  const [path, inline = ""] = pathname.split("#")[0].split("?");
  const params = new URLSearchParams(query ?? inline);
  // A tab that is its own screen (How credits work) wins over the page that hosts it.
  const tab = SCREENS.find(
    (s) => s.alsoAt && matchRoute(s.alsoAt.path, path) && Object.entries(s.alsoAt.query).every(([k, v]) => params.get(k) === v),
  );
  if (tab) return tab;
  const exact = SCREENS.find((s) => !s.route.includes("[") && matchRoute(s.route, path));
  return exact ?? SCREENS.find((s) => s.route.includes("[") && matchRoute(s.route, path));
}

/** The world a state stands for: the screen's base under the state's own `set`. */
export function stateWorld(screen: ScreenDef | undefined, state?: PageState): Partial<Scenario> {
  return { ...screen?.base, ...state?.set };
}

/** Modifiers a page state switches off unless it sets them, so a state reads as itself
 *  (no "expiring" banner left over on Auto-reload). */
const MODIFIER_RESET: Partial<Scenario> = { autoReload: false, expiring: false, request: "none" };

/**
 * The scenario patch that lands a page state (the pill, Alt+digit, /prototype/go): the
 * screen's `base` plus the state's `set`, over the current scenario minus leftover modifiers.
 * When leftovers make it impossible — normalize would undo it, e.g. Invoiced right after Held
 * (pending forces a held wallet) — it starts again from the trial-admin preset, so one click
 * always lands on the state. Without a state (a plain screen landing) only the base applies,
 * and only when the current scenario is not already on it: returns null for "apply nothing".
 */
export function patchForState(current: Scenario, screen: ScreenDef | undefined, state?: PageState): Partial<Scenario> | null {
  const want = stateWorld(screen, state);
  if (!state && (!Object.keys(want).length || scenarioMatches(current, want))) return null;
  const patch = state ? { ...MODIFIER_RESET, ...want } : want;
  if (scenarioMatches(normalize({ ...current, ...patch }).scenario, want)) return patch;
  return { ...presetFor("trial-admin")!.scenario, ...patch };
}

/**
 * The state the pill highlights: every key of its world (screen base + `set`) equals the
 * scenario and every `view` key equals its URL param. The most specific match wins; a state
 * with neither `set` nor `view` never matches. No match means "Custom".
 */
export function activeState(screen: ScreenDef, sc: Scenario, view: URLSearchParams): PageState | undefined {
  let best: PageState | undefined;
  let bestScore = 0;
  for (const st of screen.states) {
    const setKeys = Object.keys(st.set ?? {}).length;
    const viewEntries = Object.entries(st.view ?? {});
    const score = setKeys + viewEntries.length;
    if (score === 0) continue;
    if (!scenarioMatches(sc, stateWorld(screen, st))) continue;
    if (!viewEntries.every(([k, v]) => view.get(k) === v)) continue;
    if (score > bestScore) {
      best = st;
      bestScore = score;
    }
  }
  return best;
}
