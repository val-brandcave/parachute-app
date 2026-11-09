"use client";

import { useMemo } from "react";
import { useToast } from "@realwired/ui";
import { useCurrentOrg, useCurrentUser } from "@/lib/current-user";
import { useOrgStore, useReviewsStore, useUsersStore, useWalletStore } from "@/store";
import { buildActivity, remainingOf, shortName } from "./billing-data";

/** Everything the billing screens read: org, role, wallet, derived activity. */
export function useBilling() {
  const toast = useToast();
  const me = useCurrentUser();
  const { org } = useCurrentOrg();
  const ledger = useWalletStore((s) => s.ledger);
  const settings = useWalletStore((s) => s.settings);
  const reviews = useReviewsStore((s) => s.reviews);
  const users = useUsersStore((s) => s.users);
  const allUsers = useUsersStore((s) => s.allUsers);

  const isAdmin = me.role === "org_admin";
  const invoiced = org?.billing === "invoiced";
  const userName = (id?: string) => allUsers.find((u) => u.id === id)?.name;

  const admin = users.find((u) => u.id === org?.billingContactId) ?? users.find((u) => u.role === "org_admin");
  const adminName = admin?.name ?? "your admin";

  const remaining = useMemo(() => remainingOf(ledger), [ledger]);
  const rows = useMemo(
    () => buildActivity(ledger, reviews, (id) => allUsers.find((u) => u.id === id)?.name, settings?.paymentMethod === "card" ? settings.cardLast4 : undefined),
    [ledger, reviews, allUsers, settings],
  );

  const askAdmin = () =>
    toast({ title: `We emailed ${adminName}`, description: "They can add credits from Billing & credits.", tone: "success" });

  return {
    me,
    org,
    isAdmin,
    invoiced,
    ledger,
    settings,
    reviews,
    users,
    userName,
    admin,
    adminName,
    adminFirst: adminName.split(" ")[0],
    remaining,
    rows,
    askAdmin,
    openTopUp: () => useWalletStore.getState().openTopUp({ reason: "manual" }),
    openReceipt: (id: string) => useWalletStore.getState().openReceipt(id),
    patchOrg: (p: Parameters<ReturnType<typeof useOrgStore.getState>["patchOrg"]>[0]) => useOrgStore.getState().patchOrg(p),
    shortName,
  };
}
export type Billing = ReturnType<typeof useBilling>;
