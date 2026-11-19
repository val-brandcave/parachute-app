import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { INVITE_LIFE_DAYS } from "@/data/seed/invites.seed";
import { DEFAULT_ORG_ID } from "@/lib/identity-defaults";
import { getCurrentUser } from "@/lib/current-user";
import { generateId, type User, type UserRole } from "@/types";
import type { Invite } from "@/types/invite.types";
import { useSessionStore } from "./session.store";
import { useUsersStore } from "./users.store";
import { useOnboardingStore } from "./onboarding.store";

/**
 * Mock of Realwired Admin ("Bouncer"): the product that owns members, roles,
 * invites and SSO. Parachute only mirrors this read-only (decision D10). The
 * invite records live in their own collection; accepting one creates the user.
 *
 * Backend: Bouncer would send the e-mail, own the accept link and create the
 * member. "Simulate accept" stands in for the invitee clicking that link.
 */

const DAY = 86_400_000;
const currentOrgId = () => useSessionStore.getState().orgId ?? DEFAULT_ORG_ID;

/** "l.chen@x.com" becomes "L Chen" with initials "LC". */
function deriveIdentity(email: string): { name: string; initials: string } {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  const name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  const initials = (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : local.slice(0, 2)).toUpperCase();
  return { name: name || email, initials };
}

export type InviteResultStatus = "sent" | "already_member" | "already_invited" | "invalid" | "wrong_domain";
export interface InviteResult {
  email: string;
  status: InviteResultStatus;
}
/** One person to invite. Each row carries its own role (PC-29). */
export interface InviteInput {
  email: string;
  role: UserRole;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface JoinedInfo {
  inviteId: string;
  name: string;
  role: UserRole;
}

interface BouncerState {
  /** Every org's invites (id lookups). */
  allInvites: Invite[];
  /** Invites of the current org, newest first. */
  invites: Invite[];
  loaded: boolean;
  /** The most recent invite accepted this session; the Back link carries it to Home. */
  lastJoinedId: string | null;
  fetchInvites: (force?: boolean) => Promise<void>;
  pending: () => Invite[];
  byId: (id: string) => Invite | undefined;
  /**
   * Send invites in one call, each with its own role. Returns one result per input
   * row, in order. Rows that aren't sent (invalid, already a member or invited,
   * outside `opts.domain` when one is given) create nothing.
   */
  sendInvites: (invites: InviteInput[], message?: string, opts?: { domain?: string }) => Promise<InviteResult[]>;
  resend: (id: string) => Promise<void>;
  revoke: (id: string) => Promise<void>;
  /** Prototype only: the invitee accepts. Creates the user and marks the invite accepted. */
  simulateAccept: (id: string) => Promise<JoinedInfo | null>;
  changeRole: (userId: string, role: UserRole) => void;
}

export const useBouncerStore = create<BouncerState>((set, get) => {
  const scope = (all: Invite[]) =>
    all.filter((i) => i.orgId === currentOrgId()).sort((a, b) => b.sentAt - a.sentAt);
  const commit = (all: Invite[]) => set({ allInvites: all, invites: scope(all) });

  return {
    allInvites: [],
    invites: [],
    loaded: false,
    lastJoinedId: null,

    fetchInvites: async (force = false) => {
      let all = get().allInvites;
      if (force || !get().loaded) all = await adapter.getAll<Invite>(Collections.INVITES);
      set({ allInvites: all, invites: scope(all), loaded: true });
    },

    pending: () => get().invites.filter((i) => i.status === "pending"),
    byId: (id) => get().allInvites.find((i) => i.id === id),

    sendInvites: async (rows, message, opts) => {
      const now = Date.now();
      const by = getCurrentUser().id;
      const orgId = currentOrgId();
      const domain = opts?.domain?.toLowerCase();
      const members = new Set(
        useUsersStore
          .getState()
          .allUsers.filter((u) => u.orgId === orgId && u.email)
          .map((u) => u.email!.toLowerCase()),
      );
      const invited = new Set(
        get()
          .allInvites.filter((i) => i.orgId === orgId && i.status === "pending")
          .map((i) => i.email.toLowerCase()),
      );
      const made: Invite[] = [];
      const results: InviteResult[] = [];
      for (const row of rows) {
        const email = row.email.trim().toLowerCase();
        let status: InviteResultStatus = "sent";
        if (!EMAIL_RE.test(email)) status = "invalid";
        else if (domain && email.split("@")[1] !== domain) status = "wrong_domain";
        else if (members.has(email)) status = "already_member";
        else if (invited.has(email)) status = "already_invited";
        results.push({ email, status });
        if (status !== "sent") continue;
        invited.add(email); // a duplicate later in the same batch reads as already invited
        const invite: Invite = {
          id: generateId(),
          createdAt: now,
          orgId,
          email,
          role: row.role,
          status: "pending",
          invitedById: by,
          sentAt: now,
          expiresAt: now + INVITE_LIFE_DAYS * DAY,
          message: message?.trim() || undefined,
        };
        await adapter.create<Invite>(Collections.INVITES, invite);
        made.push(invite);
      }
      if (made.length) commit([...get().allInvites, ...made]);
      return results;
    },

    resend: async (id) => {
      const now = Date.now();
      const patch = { sentAt: now, expiresAt: now + INVITE_LIFE_DAYS * DAY };
      await adapter.update<Invite>(Collections.INVITES, id, patch);
      commit(get().allInvites.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    },

    revoke: async (id) => {
      await adapter.update<Invite>(Collections.INVITES, id, { status: "revoked" });
      commit(get().allInvites.map((i) => (i.id === id ? { ...i, status: "revoked" as const } : i)));
    },

    simulateAccept: async (id) => {
      const invite = get().byId(id);
      if (!invite || invite.status !== "pending") return null;
      const now = Date.now();
      // "Last active" reads against the freshest sign-in (the demo clock), so the
      // new member is the most recent one rather than a wall-clock outlier.
      const clock = useUsersStore.getState().users.reduce((m, u) => Math.max(m, u.lastActiveAt ?? 0), 0) || now;
      const { name: guessed, initials } = deriveIdentity(invite.email);
      const name = invite.inviteeName ?? guessed;
      const user: User = {
        id: generateId(),
        name,
        initials: invite.inviteeName
          ? invite.inviteeName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
          : initials,
        designation: "Member",
        signatureName: name,
        email: invite.email,
        role: invite.role,
        orgId: invite.orgId,
        status: "active",
        lastActiveAt: clock,
        createdAt: now,
      };
      await adapter.create<User>(Collections.USERS, user);
      await useUsersStore.getState().fetchUsers(true);
      const patch = { status: "accepted" as const, acceptedAt: now, acceptedUserId: user.id };
      await adapter.update<Invite>(Collections.INVITES, id, patch);
      commit(get().allInvites.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      set({ lastJoinedId: id });
      // "Invite a teammate" completes once an invite is accepted.
      // Deferred: reward on an accepted approver invite.
      await useOnboardingStore.getState().complete("invite");
      return { inviteId: id, name, role: invite.role };
    },

    // Role edits are Bouncer's job; the users store only holds the result.
    changeRole: (userId, role) => {
      useUsersStore.getState().changeRole(userId, role);
      void adapter.update<User>(Collections.USERS, userId, { role });
    },
  };
});

/** The current org's invites, reloaded when the org changes (persona switch). */
export function useOrgInvites(): { invites: Invite[]; pending: Invite[] } {
  const orgId = useSessionStore((s) => s.orgId) ?? DEFAULT_ORG_ID;
  const all = useBouncerStore((s) => s.allInvites);
  useEffect(() => {
    void useBouncerStore.getState().fetchInvites(true);
  }, [orgId]);
  return useMemo(() => {
    const invites = all.filter((i) => i.orgId === orgId).sort((a, b) => b.sentAt - a.sentAt);
    return { invites, pending: invites.filter((i) => i.status === "pending") };
  }, [all, orgId]);
}
