"use client";

import { Suspense, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@realwired/ui";
import { useOrgStore, useSessionStore, useUsersStore, useWalletStore } from "@/store";
import { useLockStore } from "@/store/lock.store";
import { getCurrentUser } from "@/lib/current-user";
import { checkoutHref, initialChoice } from "@/lib/checkout";
import type { ReviewType } from "@/types";

/** Why checkout can't open for this session (null = it can). */
export type CheckoutBlock = "embedded" | "invoiced" | "role" | null;

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

/** Same rule everywhere: no checkout inside an embedded YouConnect session, for an
 *  invoiced org, or for anyone who isn't an org admin. Reads stores at call time. */
export function checkoutBlock(): CheckoutBlock {
  if (useSessionStore.getState().mode === "embedded") return "embedded";
  if (useOrgStore.getState().org?.billing === "invoiced") return "invoiced";
  if (getCurrentUser().role !== "org_admin") return "role";
  return null;
}

/**
 * The one way into `/checkout/credits`. `launch` applies `checkoutBlock()`; on the
 * role path it explains (toast now; the role lock dialog once T4.1 fills it), in an
 * embedded YouConnect session it says credits are billed there, and invoiced is a
 * silent no-op; each returns false. Returns true when it
 * navigated.
 */
export function useLaunchCheckout() {
  const router = useRouter();
  const toast = useToast();
  return useCallback(
    (o: LaunchCheckoutOpts, current?: string): boolean => {
      const block = checkoutBlock();
      if (block === "role") {
        const me = getCurrentUser();
        const admin = useUsersStore
          .getState()
          .allUsers.find((u) => u.orgId === me.orgId && u.role === "org_admin");
        const adminName = admin?.name ?? "your organization admin";
        const first = admin ? admin.name.split(" ")[0] : "your organization admin";
        // T4.1: drop this toast once LockDialog renders the role body
        toast({ title: "Only admins can buy credits", description: `Ask ${first}.`, tone: "info" });
        useLockStore.getState().openLock({ kind: "role", action: "buy credits", admin: adminName });
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
