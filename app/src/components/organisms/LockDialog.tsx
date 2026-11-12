"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@realwired/ui";
import { orgShortName } from "@/components/organisms/onboarding";
import { checkoutHref } from "@/lib/checkout";
import { useCurrentOrg, useCurrentUser } from "@/lib/current-user";
import { useUsersStore } from "@/store";
import { useLockStore, type LockReason } from "@/store/lock.store";
import type { CreditPackId, ReviewType } from "@/types";
import { ApprovalBody } from "./lock/ApprovalBody";
import { CreditsBody } from "./lock/CreditsBody";
import { LockPreview, type LockPreviewState } from "./lock/LockPreview";
import { ReviewerRequestBody } from "./lock/ReviewerRequestBody";
import { RoleBody } from "./lock/RoleBody";
import "./lock/lock.css";

/** What every lock body needs: who's asking, who can unlock it, and the exits. */
export interface LockCtx {
  orgName: string;
  /** First word of the org name ("Harbor"). */
  orgShort: string;
  /** Billing contact, else the first org admin ("Dana Reyes"); "your admin" when nobody resolves. */
  adminName: string;
  /** The same, capitalised for the start of a sentence ("Your admin"). */
  adminLead: string;
  /** "Dana", or the whole fallback phrase ("your admin"), never a word cut from it. */
  adminFirst: string;
  /** org_admin buys; everyone else asks. */
  isAdmin: boolean;
  /** Close and return focus to the opener. */
  close: () => void;
  /** Close without returning focus, then go somewhere. Fires once per opening. */
  leave: (href: string) => void;
}

const ADMIN_FALLBACK = "your admin";

/** Accessible name for the DS Dialog (its visible title is hidden; each body draws its own). */
const A11Y_TITLE: Record<LockReason["kind"], string> = {
  approval: "Waiting on setup",
  credits: "Not enough credits",
  role: "Only admins can buy credits",
};

// DS-candidate: Dialog centred-art layout — DS dialog headers are left-aligned with no art slot.
/**
 * Store-driven lock-then-explain dialog (spec §5.5), driven by `useLockStore`.
 * Mounted once per frame (AppShell, onboarding, checkout). DS `Dialog size="sm"` with
 * `hideTitle`: Radix portals it to body at `--rw-z-modal` (140), above the review
 * takeover (`.run`, 120), and its `role="dialog"` root is what RunExperience's Esc guard
 * looks for, so Esc closes only this dialog. Focus returns to the opener on close.
 */
export function LockDialog() {
  const router = useRouter();
  const reason = useLockStore((s) => s.reason);
  const storeReturn = useLockStore((s) => s.returnFocus);
  const user = useCurrentUser();
  const org = useCurrentOrg();
  const allUsers = useUsersStore((s) => s.allUsers);
  const [preview, setPreview] = useState<LockPreviewState | null>(null);

  // Keep the last reason so the body stays drawn through the exit animation, and a
  // per-open key so each opening starts fresh (note field, sent state, option choice).
  const [shown, setShown] = useState<{ reason: LockReason; key: number } | null>(null);
  if (reason && reason !== shown?.reason) setShown({ reason, key: (shown?.key ?? 0) + 1 });

  // Where focus goes back. Radix's own close-focus runs after the store clears, so hold it here.
  const returnRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (storeReturn) returnRef.current = storeReturn;
  }, [storeReturn]);

  // One exit per opening: the body stays clickable through the exit animation, so a
  // double click must not start a review twice (PC-32) or push checkout twice.
  const firedRef = useRef(false);
  useEffect(() => {
    firedRef.current = false;
  }, [shown?.key]);
  /** Clears the store without restoring focus. False when this opening already fired. */
  const claimExit = useCallback(() => {
    if (firedRef.current) return false;
    firedRef.current = true;
    returnRef.current = null;
    useLockStore.setState({ reason: null, returnFocus: null });
    return true;
  }, []);

  const close = useCallback(() => useLockStore.getState().close(), []);
  const leave = useCallback(
    (href: string) => {
      if (claimExit()) router.push(href);
    },
    [claimExit, router],
  );

  const admin = useMemo(() => {
    const inOrg = allUsers.filter((u) => u.orgId === user.orgId);
    const contact = org.org?.billingContactId ? inOrg.find((u) => u.id === org.org?.billingContactId) : undefined;
    return contact ?? inOrg.find((u) => u.role === "org_admin" && u.status !== "invited");
  }, [allUsers, user.orgId, org.org?.billingContactId]);

  const current = shown?.reason ?? null;
  const force = preview && current === preview.reason ? preview : null;
  const isAdmin = force?.role ? force.role === "admin" : user.role === "org_admin";
  // A role reason names the admin; trust it only when it is a real user, else the resolved admin.
  const roleAdmin = current?.kind === "role" ? allUsers.find((u) => u.name === current.admin) : undefined;
  const named = roleAdmin ?? admin;
  const adminName = named?.name ?? ADMIN_FALLBACK;
  const ctx: LockCtx = {
    orgName: org.name,
    orgShort: orgShortName(org.name),
    adminName,
    adminLead: adminName.charAt(0).toUpperCase() + adminName.slice(1),
    adminFirst: named ? named.name.split(" ")[0] : ADMIN_FALLBACK,
    isAdmin,
    close,
    leave,
  };

  const toCheckout = (r: Extract<LockReason, { kind: "credits" }>, choice: { credits: number } | { pack: CreditPackId }) => {
    if (r.onAdd) {
      if (claimExit()) r.onAdd(choice);
      return;
    }
    leave(checkoutHref({ ...choice, returnTo: r.resume ?? currentPath(), types: r.types }));
  };

  const runOnly = (r: Extract<LockReason, { kind: "credits" }>, type: ReviewType) => {
    if (claimExit()) r.onRunOnly?.(type);
  };

  let body: React.ReactNode = null;
  if (current?.kind === "approval") {
    const bookedAt = force?.booked === false ? undefined : (org.org?.profile?.callBookedAt ?? force?.bookedAt);
    body = <ApprovalBody ctx={ctx} bookedAt={bookedAt} signedUpAt={org.org?.createdAt} />;
  } else if (current?.kind === "credits") {
    const r = current;
    body = isAdmin ? (
      <CreditsBody
        ctx={ctx}
        reason={r}
        onAdd={(choice) => toCheckout(r, choice)}
        onRunOnly={r.onRunOnly ? (t) => runOnly(r, t) : undefined}
      />
    ) : (
      <ReviewerRequestBody ctx={ctx} title={neededTitle(r.needed)} />
    );
  } else if (current?.kind === "role") {
    body = <RoleBody ctx={ctx} />;
  }

  return (
    <>
      <Dialog
        open={reason !== null}
        onOpenChange={(o) => {
          if (!o) close();
        }}
        // Credits carry two option cards and three actions (board 2 draws them at 600 px).
        size={current?.kind === "credits" && isAdmin ? "md" : "sm"}
        hideTitle
        title={current ? A11Y_TITLE[current.kind] : "Locked"}
        className="lock-dlg"
        returnFocus={() => returnRef.current}
        initialFocus={() => document.querySelector<HTMLElement>(".lock-dlg .lock-acts .ui-btn--primary")}
      >
        <div key={shown?.key} data-lock-kind={current?.kind}>
          {body}
        </div>
      </Dialog>
      {process.env.NODE_ENV !== "production" && (
        <LockPreview
          ready={Boolean(org.org) && allUsers.length > 0}
          adminName={admin?.name ?? ADMIN_FALLBACK}
          callBookedAt={org.org?.profile?.callBookedAt}
          onPreview={setPreview}
        />
      )}
    </>
  );
}

export function neededTitle(needed: number): string {
  return `You need ${needed} more ${needed === 1 ? "credit" : "credits"}`;
}

function currentPath(): string {
  if (typeof window === "undefined") return "/";
  const sp = new URLSearchParams(window.location.search);
  sp.delete("lock");
  const qs = sp.toString();
  return window.location.pathname + (qs ? `?${qs}` : "");
}
