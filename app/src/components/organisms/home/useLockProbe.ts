"use client";

import { useEffect } from "react";
import { useLockStore } from "@/store";

/**
 * Dev-only test probe: mirrors the lock store's current reason kind onto
 * `<html data-lock-kind>` so the T2.1 flow can prove a locked click reached the
 * store while `LockDialog` is still a stub. Compiled out of production builds.
 */
export function useLockProbe(): void {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const root = document.documentElement;
    const write = (kind: string | undefined) => {
      if (kind) root.dataset.lockKind = kind;
      else delete root.dataset.lockKind;
    };
    write(useLockStore.getState().reason?.kind);
    const off = useLockStore.subscribe((s) => write(s.reason?.kind));
    return () => {
      off();
      delete root.dataset.lockKind;
    };
  }, []);
}
