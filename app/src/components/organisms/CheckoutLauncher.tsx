"use client";

import { Suspense, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@realwired/ui";
import { useOrgStore, useSessionStore, useUsersStore, useWalletStore } from "@/store";
import { useLockStore } from "@/store/lock.store";
import { getCurrentUser } from "@/lib/current-user";
import { checkoutBlock, checkoutHref, initialChoice, type CheckoutBlock } from "@/lib/checkout";
import type { ReviewType } from "@/types";

export interface LaunchCheckoutOpts {
  /** The SHORTFALL (cost − balance), never the full cost (RF2). Omitted = default pack. */
  needed?: number;
  /** Where "Back to …" lands. Defaults to the current path + search. */
  returnTo?: string;
  /** Review types carried back to Review setup. */
  types?: ReviewType[];
  /** Credit request being fulfilled (phase 4). */
  request?: string;
}

/** `checkoutBlock` (lib/checkout.ts, the one rule) for this session, read from the stores at call time. */
export function currentCheckoutBlock(): CheckoutBlock {
  const org = useOrgStore.getState().org;
  return checkoutBlock({
    embedded: useSessionStore.getState().mode === "embedded",
    billing: org?.billing,
    role: getCurrentUser().role,
    approval: org?.approval,
  });
}

/**
 * The one way into `/checkout/credits`. `launch` applies `currentCheckoutBlock()`: role
 * opens the role lock dialog, approval opens the approval lock dialog, an embedded
 * YouConnect session says credits are billed there, and invoiced is a silent no-op;
 * each returns false. Returns true when it navigated.
 */
export function useLaunchCheckout() {
  const router = useRouter();
  const toast = useToast();
  return useCallback(
    (o: LaunchCheckoutOpts, current?: string): boolean => {
      const block = currentCheckoutBlock();
      if (block === "role") {
        const me = getCurrentUser();
        const admin = useUsersStore
          .getState()
          .allUsers.find((u) => u.orgId === me.orgId && u.role === "org_admin");
        const adminName = admin?.name ?? "your admin";
        useLockStore.getState().openLock({ kind: "role", action: "buy credits", admin: adminName });
        return false;
      }
      if (block === "approval") {
        useLockStore.getState().openLock({ kind: "approval" });
        return false;
      }
      if (block === "embedded") {
        toast({ title: "Credits are billed through YouConnect.", tone: "info" });
        return false;
      }
      if (block) return false;
      const returnTo =
        o.returnTo ??
        current ??
        (typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined);
      router.push(
        checkoutHref({ ...initialChoice(o.needed), returnTo, types: o.types, request: o.request }),
      );
      return true;
    },
    [router, toast],
  );
}

function Launcher() {
  const pathname = usePathname();
  const search = useSearchParams();
  const intent = useWalletStore((s) => s.topUpIntent);
  const launch = useLaunchCheckout();

  useEffect(() => {
    if (!intent) return;
    useWalletStore.getState().clearTopUpIntent();
    const qs = search.toString();
    launch({ needed: intent.needed, request: intent.request }, pathname + (qs ? `?${qs}` : ""));
  }, [intent, pathname, search, launch]);

  return null;
}

/**
 * Turns an Add credits intent (`openTopUp`) into a trip to /checkout/credits
 * (spec §5.6): `checkoutHref({ credits|pack from initialChoice(needed), return:
 * path + search, request })`, then clears the intent. Mounted once in AppShell.
 */
export function CheckoutLauncher() {
  return (
    <Suspense fallback={null}>
      <Launcher />
    </Suspense>
  );
}
