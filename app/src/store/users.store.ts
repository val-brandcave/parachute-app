import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { DEFAULT_ORG_ID } from "@/lib/identity-defaults";
import { generateId, type User, type UserRole } from "@/types";
import { useSessionStore } from "./session.store";

/** Name + initials guessed from an email local part, for a fresh invite. */
function deriveIdentity(email: string): { name: string; initials: string } {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  const name = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  const initials = (parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : local.slice(0, 2)
  ).toUpperCase();
  return { name: name || email, initials };
}

const currentOrgId = () => useSessionStore.getState().orgId ?? DEFAULT_ORG_ID;

interface UsersState {
  /** Members of the CURRENT org (what the Members table, queue filters and
   *  assignee pickers read). */
  users: User[];
  /** Everyone in every org — only for id lookups (signatures, avatars, persona
   *  sign-in). */
  allUsers: User[];
  /** Load (once) and scope to the current org. `force` re-reads from the adapter. */
  fetchUsers: (force?: boolean) => Promise<void>;
  byId: (id: string) => User | undefined;
  // --- Member management (Organization → Members) ---
  inviteMember: (email: string, role: UserRole) => void;
  changeRole: (id: string, role: UserRole) => void;
  setStatus: (id: string, status: NonNullable<User["status"]>) => void;
  removeMember: (id: string) => void;
}

/** The review team. Resolves assignee → name/initials in the queue and backs the
 *  Organization → Members table. Member edits mutate in-memory (prototype); the
 *  fetch is a no-op once loaded so in-session changes stick across navigation —
 *  except `force` (persona switch / org reset), which re-reads the adapter. */
export const useUsersStore = create<UsersState>((set, get) => {
  const scope = (all: User[]) => all.filter((u) => u.orgId === currentOrgId());
  const mutate = (fn: (all: User[]) => User[]) =>
    set((s) => {
      const allUsers = fn(s.allUsers);
      return { allUsers, users: scope(allUsers) };
    });

  return {
    users: [],
    allUsers: [],
    fetchUsers: async (force = false) => {
      let all = get().allUsers;
      if (force || !all.length) {
        all = await adapter.getAll<User>(Collections.USERS);
      }
      set({ allUsers: all, users: scope(all) });
    },
    byId: (id) => get().allUsers.find((u) => u.id === id),

    inviteMember: (email, role) => {
      const { name, initials } = deriveIdentity(email);
      const member: User = {
        id: generateId(),
        name,
        initials,
        designation: "Invited",
        signatureName: name,
        email,
        role,
        orgId: currentOrgId(),
        status: "invited",
        createdAt: 0, // stamped by the caller/adapter in production
      };
      mutate((all) => [...all, member]);
    },
    changeRole: (id, role) =>
      mutate((all) => all.map((u) => (u.id === id ? { ...u, role } : u))),
    setStatus: (id, status) =>
      mutate((all) => all.map((u) => (u.id === id ? { ...u, status } : u))),
    removeMember: (id) => mutate((all) => all.filter((u) => u.id !== id)),
  };
});
