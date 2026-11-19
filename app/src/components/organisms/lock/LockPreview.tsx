"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@realwired/ui";
import { costFor } from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { useLockStore, type LockReason } from "@/store/lock.store";
import type { ReviewType } from "@/types";

/** Prototype-only overrides from the `?lock=` preview (never set in production). */
export interface LockPreviewState {
  reason: LockReason;
  booked?: boolean;
  bookedAt?: number;
  role?: "admin" | "reviewer";
}

export type LockPreviewKind =
  | "approval"
  | "approval-unbooked"
  | "approval-reviewer"
  | "credits-short"
  | "credits-zero"
  | "credits-reviewer"
  | "role";

type PreviewWindow = {
  __parachuteLock?: (k: LockPreviewKind) => boolean;
  /** How many times the preview's onRunOnly ran (the flow's double-click check). */
  __lockRunOnlyCalls?: number;
};

/**
 * PROTOTYPE ONLY. Rendered by LockDialog under `process.env.NODE_ENV !== "production"`,
 * so it tree-shakes out of production builds. Opens each lock variant from
 * `?lock=<kind>` on /dashboard, or from `window.__parachuteLock(kind)` (the current
 * focus becomes the opener). Reports its overrides back through `onPreview`.
 */
export function LockPreview({
  ready,
  adminName,
  callBookedAt,
  onPreview,
}: {
  /** Org and users loaded, so names read right. */
  ready: boolean;
  adminName: string;
  callBookedAt?: number;
  onPreview: (p: LockPreviewState) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const openPreview = useCallback(
    (kind: LockPreviewKind, now: number) => {
      const ranOnly = (t: ReviewType) => {
        const w = window as unknown as PreviewWindow;
        w.__lockRunOnlyCalls = (w.__lockRunOnlyCalls ?? 0) + 1;
        toast({ title: `Preview: ${t === "technical" ? "Technical" : "Administrative"} review would start now`, tone: "info" });
      };
      const p = previewFor(kind, now, callBookedAt, adminName, ranOnly);
      if (!p) return false;
      onPreview(p);
      useLockStore.getState().openLock(p.reason);
      return true;
    },
    [callBookedAt, adminName, toast, onPreview],
  );

  useEffect(() => {
    const w = window as unknown as PreviewWindow;
    w.__parachuteLock = (k) => openPreview(k, Date.now());
    return () => {
      delete w.__parachuteLock;
    };
  }, [openPreview]);

  useEffect(() => {
    if (pathname !== "/dashboard" || !ready) return;
    const sp = new URLSearchParams(window.location.search);
    const kind = sp.get("lock") as LockPreviewKind | null;
    if (!kind) return;
    sp.delete("lock");
    const qs = sp.toString();
    router.replace(pathname + (qs ? `?${qs}` : ""));
    // Next tick: opening sets the dialog's preview state, which an effect body shouldn't do
    // synchronously. No cleanup: the param is already gone, so a re-run must not cancel it.
    window.setTimeout(() => openPreview(kind, Date.now()), 0);
  }, [pathname, ready, openPreview, router]);

  return null;
}

/** The seven previews. Numbers come from pricing (a full review's cost). */
function previewFor(
  kind: LockPreviewKind,
  now: number,
  callBookedAt: number | undefined,
  adminName: string,
  onRunOnly: (t: ReviewType) => void,
): LockPreviewState | null {
  const full = costFor(FULL_REVIEW_TYPES);
  const types = [...FULL_REVIEW_TYPES];
  // Fallback when the org has no call: tomorrow, 10:00 AM ET (15:00 UTC).
  const tomorrow = new Date(now + 86_400_000);
  tomorrow.setUTCHours(15, 0, 0, 0);
  const bookedAt = callBookedAt ?? tomorrow.getTime();
  switch (kind) {
    case "approval":
      return { reason: { kind: "approval" }, booked: true, bookedAt, role: "admin" };
    case "approval-unbooked":
      return { reason: { kind: "approval" }, booked: false, role: "admin" };
    case "approval-reviewer":
      return { reason: { kind: "approval" }, booked: true, bookedAt, role: "reviewer" };
    case "credits-short":
      return { reason: { kind: "credits", needed: full - 1, have: 1, types, onRunOnly } };
    case "credits-zero":
      return { reason: { kind: "credits", needed: full, have: 0, types } };
    case "credits-reviewer":
      return { reason: { kind: "credits", needed: full - 1, have: 1, types }, role: "reviewer" };
    case "role":
      return { reason: { kind: "role", action: "buy credits", admin: adminName } };
    default:
      return null;
  }
}
