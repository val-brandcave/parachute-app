"use client";

import { useSearchParams } from "next/navigation";

/**
 * The `?variant=` param the Prototype Index and state pill use to open an auth screen in a
 * given state (wrong-code, expired, bad-credentials, sent, ...). Null when absent or "default".
 * The caller's page needs a Suspense boundary.
 */
export function useAuthVariant(): string | null {
  const v = useSearchParams().get("variant");
  return v && v !== "default" ? v : null;
}
