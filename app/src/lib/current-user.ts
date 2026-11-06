import { useMemo } from "react";
import type { Org, OrgKind, UserRole } from "@/types";
import { useSessionStore, type AuthState } from "@/store/session.store";
import { useUsersStore } from "@/store/users.store";
import { useOrgStore } from "@/store/org.store";
import { DEFAULT_ORG_ID } from "@/lib/identity-defaults";

/**
 * The signed-in user and org.
 *
 * Source of truth is the session store (who) + the users / org stores (details).
 * `useCurrentUser()` / `useCurrentOrg()` are the hooks for components;
 * `getCurrentUser()` / `getCurrentOrg()` are for store actions and handlers.
 *
 * `CURRENT_USER` / `CURRENT_ORG` stay as FALLBACKS — used before the stores have
 * loaded, while anonymous, and by call sites not yet migrated to the hooks.
 */
export const CURRENT_USER = {
  id: "user-001", // matches seedUsers — drives "Mine only" in the review queue
  name: "Val Vinnakota",
  firstName: "Val",
  email: "val@brandcave.co",
  initials: "VV",
  designation: "Chief Appraiser, MAI",
  signatureName: "Val Vinnakota",
} as const;

export const CURRENT_ORG = {
  name: "Meridian Trust Bank, N.A.",
  kind: "Organization",
  initials: "MT",
} as const;

export interface CurrentUser {
  id: string;
  name: string;
  firstName: string;
  email: string;
  initials: string;
  designation: string;
  signatureName: string;
  role: UserRole;
  orgId: string;
  auth: AuthState;
}

export interface CurrentOrg {
  id: string;
  name: string;
  /** Display label for the org's kind ("Bank", "Appraisal firm"). */
  kind: string;
  kindId: OrgKind | null;
  initials: string;
  /** The full record, once loaded. */
  org: Org | null;
}

const KIND_LABEL: Record<OrgKind, string> = {
  bank: "Bank",
  appraisal_firm: "Appraisal firm",
};

function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w[0] ?? ""));
  return (words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}

function resolveUser(
  userId: string | null,
  role: UserRole | null,
  orgId: string | null,
  auth: AuthState,
  find: (id: string) => ReturnType<typeof useUsersStore.getState>["allUsers"][number] | undefined,
): CurrentUser {
  const u = userId ? find(userId) : undefined;
  if (!u) {
    return { ...CURRENT_USER, role: role ?? "org_admin", orgId: orgId ?? DEFAULT_ORG_ID, auth };
  }
  return {
    id: u.id,
    name: u.name,
    firstName: u.name.split(" ")[0],
    email: u.email ?? "",
    initials: u.initials,
    designation: u.designation,
    signatureName: u.signatureName,
    role: role ?? u.role,
    orgId: u.orgId,
    auth,
  };
}

function resolveOrg(orgId: string | null, org: Org | null): CurrentOrg {
  const record = org && org.id === (orgId ?? DEFAULT_ORG_ID) ? org : null;
  if (!record) {
    return {
      id: orgId ?? DEFAULT_ORG_ID,
      name: CURRENT_ORG.name,
      kind: CURRENT_ORG.kind,
      kindId: null,
      initials: CURRENT_ORG.initials,
      org: null,
    };
  }
  return {
    id: record.id,
    name: record.name,
    kind: record.profile ? KIND_LABEL[record.profile.kind] : CURRENT_ORG.kind,
    kindId: record.profile?.kind ?? null,
    initials: initialsOf(record.name),
    org: record,
  };
}

export function useCurrentUser(): CurrentUser {
  const userId = useSessionStore((s) => s.userId);
  const role = useSessionStore((s) => s.role);
  const orgId = useSessionStore((s) => s.orgId);
  const auth = useSessionStore((s) => s.auth);
  const allUsers = useUsersStore((s) => s.allUsers);
  return useMemo(
    () => resolveUser(userId, role, orgId, auth, (id) => allUsers.find((u) => u.id === id)),
    [userId, role, orgId, auth, allUsers],
  );
}

export function useCurrentOrg(): CurrentOrg {
  const orgId = useSessionStore((s) => s.orgId);
  const org = useOrgStore((s) => s.org);
  return useMemo(() => resolveOrg(orgId, org), [orgId, org]);
}

export function getCurrentUser(): CurrentUser {
  const s = useSessionStore.getState();
  return resolveUser(s.userId, s.role, s.orgId, s.auth, useUsersStore.getState().byId);
}

export function getCurrentOrg(): CurrentOrg {
  return resolveOrg(useSessionStore.getState().orgId, useOrgStore.getState().org);
}
