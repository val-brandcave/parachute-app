import { useCallback } from "react";
import { useApprovalPending, useOrgStore } from "@/store";
import { useLockStore, type LockReason } from "@/store/lock.store";

/** Fallback reason line (no org name yet). Prefer `useStartGate().reasonText`. */
export const START_LOCKED_REASON = "Opens after your setup call";

/** "Opens after Harbor's setup call" — the short org name, spec §5.5. */
export function startLockedReason(orgName?: string | null): string {
  const short = orgName?.trim().split(/\s+/)[0];
  return short ? `Opens after ${short}'s setup call` : START_LOCKED_REASON;
}

/**
 * Every "Start a review" site reads this (spec §5.5). While the org waits for Realwired
 * approval the action stays visible and clickable: `aria-disabled` + `reasonText`, and a
 * click calls `explain()`, which opens the approval lock dialog. Never `disabled`.
 * Credits are checked at the real Start (Review setup), not here.
 */
export function useStartGate(): {
  locked: boolean;
  reason: LockReason | null;
  reasonText: string;
  explain: (returnFocus?: HTMLElement | null) => void;
} {
  const locked = useApprovalPending();
  const orgName = useOrgStore((s) => s.org?.name);
  const reason: LockReason | null = locked ? { kind: "approval" } : null;
  const explain = useCallback(
    (returnFocus?: HTMLElement | null) => {
      if (!locked) return;
      useLockStore.getState().openLock({ kind: "approval" }, { returnFocus });
    },
    [locked],
  );
  return { locked, reason, reasonText: startLockedReason(orgName), explain };
}
