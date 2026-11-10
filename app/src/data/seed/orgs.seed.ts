import type { Org } from "@/types";

const T0 = 1_785_000_000_000; // fixed epoch (Jul 2026) — seeds must not call Date.now()

/**
 * Demo orgs. `org-001` is the original single-bank demo (Meridian via YouConnect:
 * invoiced, approved, set up). The rest back the self-serve personas — a brand-new
 * prospect has NO seeded org; `/welcome` creates it at runtime.
 */
export const seedOrgs: Org[] = [
  {
    id: "org-001",
    name: "Meridian Trust Bank, N.A.",
    brandPrimary: "#10344c",
    brandAccent: "#c9a84c",
    brandFont: "Roboto",
    createdAt: 1736928000000,
    profile: { kind: "bank", teamBand: "11+", volumeBand: "200+" },
    billing: "invoiced",
    approval: "approved",
    flags: { membersInBouncer: true },
    billingContactId: "user-001",
    securityPackSentAt: 1_760_000_000_000,
    onboardedAt: 1_737_000_000_000,
  },
  {
    id: "org-hcb",
    name: "Harbor Community Bank",
    brandPrimary: "#10344c",
    brandAccent: "#2a6f7f",
    brandFont: "Inter",
    createdAt: T0,
    profile: { kind: "bank", teamBand: "2-10", volumeBand: "lt50" },
    billing: "trial",
    approval: "approved",
    flags: { membersInBouncer: true },
    billingContactId: "user-dr",
  },
  {
    id: "org-cedar",
    name: "Cedar Ridge Community Bank",
    brandPrimary: "#1f4d3a",
    brandAccent: "#2a6f7f",
    brandFont: "Inter",
    createdAt: T0 - 60 * 86_400_000,
    profile: { kind: "bank", teamBand: "2-10", volumeBand: "50-200" },
    billing: "payg",
    approval: "approved",
    flags: { membersInBouncer: true },
    billingContactId: "user-cr1",
    securityPackSentAt: T0 - 50 * 86_400_000,
    onboardedAt: T0 - 58 * 86_400_000,
  },
  {
    id: "org-lakeside",
    name: "Lakeside Valuation",
    brandPrimary: "#10344c",
    brandAccent: "#2a6f7f",
    brandFont: "Inter",
    createdAt: T0 + 20 * 86_400_000,
    profile: { kind: "appraisal_firm", teamBand: "11+", volumeBand: "50-200", salesRequested: true },
    billing: "trial",
    approval: "pending",
    flags: { approvalGate: true, membersInBouncer: true },
    billingContactId: "user-lv1",
  },
];
