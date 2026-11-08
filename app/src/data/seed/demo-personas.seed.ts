import type { IconName } from "@/components/atoms";
import type { AppMode } from "@/store/session.store";

/* PROTOTYPE ONLY: the demo persona switcher. Everything demo-only lives in files
   named demo* (plus a few gated hooks); deleting them removes the feature. */

export type PersonaGroup = "signup" | "signed_in" | "yc";

export interface DemoPersona {
  id: string;
  label: string;
  description: string;
  group: PersonaGroup;
  icon: IconName;
  /** null = nobody signed in (prospects). */
  userId: string | null;
  orgId: string | null;
  mode: AppMode;
  /** Where applying the persona lands. Some routes arrive in later phases. */
  entryRoute: string;
}

export const PERSONA_GROUP_LABEL: Record<PersonaGroup, string> = {
  signup: "Sign up",
  signed_in: "Signed in",
  yc: "From YouConnect",
};

export const demoPersonas: DemoPersona[] = [
  {
    id: "prospect",
    label: "Brand-new prospect",
    description: "No account yet. Create one, set up the org, land on a trial.",
    group: "signup",
    icon: "user-plus",
    userId: null,
    orgId: null,
    mode: "full",
    entryRoute: "/auth/create-account",
  },
  {
    id: "prospect-sales",
    label: "Large prospect",
    description: "11+ reviewers, 200+ reports a month. Talk to us leads.",
    group: "signup",
    icon: "bank",
    userId: null,
    orgId: null,
    mode: "full",
    entryRoute: "/welcome?preset=large",
  },
  {
    id: "pending-admin",
    label: "Admin awaiting approval",
    description: "Lakeside Valuation. Workspace is being reviewed.",
    group: "signed_in",
    icon: "clock",
    userId: "user-lv1",
    orgId: "org-lakeside",
    mode: "full",
    entryRoute: "/welcome/pending",
  },
  {
    id: "trial-admin",
    label: "Trial admin, mid-setup",
    description: "Dana at Harbor Community Bank. First-run Home, setup 4 of 9.",
    group: "signed_in",
    icon: "gift",
    userId: "user-dr",
    orgId: "org-hcb",
    mode: "full",
    entryRoute: "/dashboard",
  },
  {
    id: "payg-admin-low",
    label: "Pay-as-you-go admin, 1 credit",
    description: "Carla at Cedar Ridge. Auto-reload off, Start will block.",
    group: "signed_in",
    icon: "wallet",
    userId: "user-cr1",
    orgId: "org-cedar",
    mode: "full",
    entryRoute: "/launchpad",
  },
  {
    id: "reviewer",
    label: "Reviewer",
    description: "Marcus at Harbor Community Bank. Wallet is read-only.",
    group: "signed_in",
    icon: "reviews",
    userId: "user-mo",
    orgId: "org-hcb",
    mode: "full",
    entryRoute: "/launchpad",
  },
  {
    id: "approver",
    label: "Approver",
    description: "Henry at Cedar Ridge. Signs off reviews.",
    group: "signed_in",
    icon: "check-circle",
    userId: "user-cr2",
    orgId: "org-cedar",
    mode: "full",
    entryRoute: "/reviews",
  },
  {
    id: "returning",
    label: "Returning user",
    description: "Val at Meridian Trust, the original demo. Invoiced, fully set up.",
    group: "signed_in",
    icon: "dashboard",
    userId: "user-001",
    orgId: "org-001",
    mode: "full",
    entryRoute: "/launchpad",
  },
  {
    id: "enterprise-yc",
    label: "Meridian via YouConnect",
    description: "Embedded entry. Billed through YouConnect, no wallet.",
    group: "yc",
    icon: "connect",
    userId: "user-001",
    orgId: "org-001",
    mode: "embedded",
    entryRoute: "/youconnect",
  },
];
