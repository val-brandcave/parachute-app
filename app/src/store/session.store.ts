import { create } from "zustand";
import type { UserRole } from "@/types";
import { DEFAULT_ORG_ID, DEFAULT_USER_ID } from "@/lib/identity-defaults";

/**
 * App entry mode (the "one app, three entry modes" model from the J1/J3 build
 * plan). `full` = the standalone Parachute app (dashboard, queue, nav). `embedded`
 * = entered via the YouConnect SSO handoff for a single document: no dashboard /
 * queue / nav, a trust strip in the run flow, and "return to YouConnect" on sign.
 * (`admin` / J2 is deferred.)
 */
export type AppMode = "full" | "embedded";

/** Where the visitor is in the sign-up / sign-in ladder.
 *  anonymous = nobody; verified = e-mail confirmed, no org yet; signed_in = a member of an org. */
export type AuthState = "anonymous" | "verified" | "signed_in";

interface SessionState {
  mode: AppMode;
  /** Where an embedded session returns to on close/sign (e.g. "YouConnect"). */
  returnLabel: string | null;
  /** The signed-in member. Defaults to the original demo user so the app works
   *  with no persona applied. null while anonymous / verified. */
  userId: string | null;
  orgId: string | null;
  role: UserRole | null;
  auth: AuthState;
  /** Sign-up identity carried from create-account until /welcome makes the user. */
  email: string | null;
  name: string | null;
  setMode: (mode: AppMode, opts?: { returnLabel?: string }) => void;
  signIn: (who: { userId: string; orgId: string; role: UserRole }) => void;
  /** E-mail verified but no org yet (the prospect mid-sign-up). */
  verify: (who?: { email: string; name: string }) => void;
  signOut: () => void;
  /** Reset the ENTRY MODE only (identity is untouched — use signIn/signOut). */
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  mode: "full",
  returnLabel: null,
  userId: DEFAULT_USER_ID,
  orgId: DEFAULT_ORG_ID,
  role: "org_admin",
  auth: "signed_in",
  email: null,
  name: null,
  setMode: (mode, opts) =>
    set({ mode, returnLabel: mode === "embedded" ? opts?.returnLabel ?? "YouConnect" : null }),
  signIn: ({ userId, orgId, role }) =>
    set({ userId, orgId, role, auth: "signed_in", email: null, name: null }),
  verify: (who) =>
    set({ userId: null, orgId: null, role: null, auth: "verified", email: who?.email ?? null, name: who?.name ?? null }),
  signOut: () =>
    set({ userId: null, orgId: null, role: null, auth: "anonymous", email: null, name: null }),
  reset: () => set({ mode: "full", returnLabel: null }),
}));
