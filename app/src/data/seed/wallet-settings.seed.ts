import type { WalletSettings } from "@/types";

const T0 = 1_785_000_000_000;

/** One row per org (`id` === `orgId`). */
export const seedWalletSettings: WalletSettings[] = [
  {
    id: "org-001",
    orgId: "org-001",
    createdAt: T0,
    autoReload: false,
    reloadPackId: "pack5",
    reloadBelow: 2,
    paymentMethod: "invoice",
    billingEmail: "ap@meridiantrust.com",
  },
  {
    id: "org-hcb",
    orgId: "org-hcb",
    createdAt: T0,
    autoReload: false,
    reloadPackId: "pack5",
    reloadBelow: 2,
    paymentMethod: null,
    billingEmail: "dana.reyes@harborcommunitybank.com",
  },
  {
    id: "org-cedar",
    orgId: "org-cedar",
    createdAt: T0,
    autoReload: false,
    reloadPackId: "pack5",
    reloadBelow: 2,
    paymentMethod: "card",
    cardLast4: "4242",
    billingEmail: "ap@cedarridgebank.com",
  },
  {
    id: "org-lakeside",
    orgId: "org-lakeside",
    createdAt: T0,
    autoReload: false,
    reloadPackId: "pack5",
    reloadBelow: 2,
    paymentMethod: null,
    billingEmail: "leah@lakesidevaluation.com",
  },
];
