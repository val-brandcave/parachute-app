"use client";

import { useEffect, useMemo } from "react";
import { useToast } from "@realwired/ui";
import { useCurrentOrg, useCurrentUser } from "@/lib/current-user";
import { INVITE_LIFE_DAYS } from "@/data/seed/invites.seed";
import { ROLE_META, ROLE_ORDER } from "@/lib/member-roles";
import { useBouncerStore, useOrgInvites, useUsersStore } from "@/store";
import type { User, UserRole } from "@/types";

/** Page hook for the Realwired Admin mock: members, invites and their actions. */
export function useBouncerAdmin() {
  const me = useCurrentUser();
  const { org, name: orgName } = useCurrentOrg();
  const toast = useToast();
  const users = useUsersStore((s) => s.users);
  const { invites, pending } = useOrgInvites();
  const lastJoinedId = useBouncerStore((s) => s.lastJoinedId);
  const store = useBouncerStore;

  useEffect(() => {
    void useUsersStore.getState().fetchUsers();
  }, []);

  const members = useMemo(
    () =>
      [...users].sort(
        (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name),
      ),
    [users],
  );

  /** The first org admin is the account holder: locked. */
  const ownerId = useMemo(
    () => users.filter((u) => u.role === "org_admin").sort((a, b) => a.createdAt - b.createdAt)[0]?.id,
    [users],
  );

  /** The verified domain: the billing contact's e-mail domain. */
  const domain = useMemo(() => {
    const contact = users.find((u) => u.id === org?.billingContactId) ?? users.find((u) => u.role === "org_admin");
    return contact?.email?.split("@")[1]?.toLowerCase() ?? null;
  }, [users, org]);

  /** Relative times read from the freshest sign-in, not the wall clock. */
  const anchor = useMemo(
    () => users.reduce((m, u) => Math.max(m, u.lastActiveAt ?? 0), 0) + 3_600_000,
    [users],
  );

  /** Only an org admin manages members; everyone else gets a read-only view. */
  const canManage = me.role === "org_admin";
  const adminName = (
    users.find((u) => u.id === org?.billingContactId && u.role === "org_admin") ??
    users.find((u) => u.role === "org_admin")
  )?.name;

  const inviter = (id: string) => users.find((u) => u.id === id)?.name ?? "A teammate";

  const changeRole = (u: User, role: UserRole) => {
    if (u.role === role) return;
    store.getState().changeRole(u.id, role);
    toast({ title: `${u.name} is now ${ROLE_META[role].label.toLowerCase()}`, tone: "success" });
  };

  const sendInvites = async (emails: string[], role: UserRole, message?: string) => {
    const made = await store.getState().sendInvites(emails, role, message);
    toast({
      title: made.length === 1 ? "Invite sent" : `${made.length} invites sent`,
      description: made.length === 1 ? made[0].email : `As ${ROLE_META[role].label.toLowerCase()}, expiring in ${INVITE_LIFE_DAYS} days.`,
      tone: "success",
    });
    return made;
  };

  const resend = async (id: string, email: string) => {
    await store.getState().resend(id);
    toast({ title: "Invite resent", description: `${email} has ${INVITE_LIFE_DAYS} more days.`, tone: "success" });
  };

  const revoke = async (id: string, email: string) => {
    await store.getState().revoke(id);
    toast({ title: "Invite revoked", description: email, tone: "neutral" });
  };

  const simulateAccept = async (id: string) => {
    const joined = await store.getState().simulateAccept(id);
    if (joined) {
      toast({
        title: `${joined.name} joined`,
        description: `As ${ROLE_META[joined.role].label.toLowerCase()}. Prototype only.`,
        tone: "success",
      });
    }
  };

  return {
    me,
    orgName,
    domain,
    canManage,
    adminName,
    members,
    ownerId,
    anchor,
    invites,
    pending,
    lastJoinedId,
    inviter,
    changeRole,
    sendInvites,
    resend,
    revoke,
    simulateAccept,
  };
}

export type BouncerAdmin = ReturnType<typeof useBouncerAdmin>;
