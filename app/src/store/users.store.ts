import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { generateId, type User, type UserRole } from "@/types";

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

interface UsersState {
  users: User[];
  fetchUsers: () => Promise<void>;
  byId: (id: string) => User | undefined;
  // --- Member management (Organization → Members) ---
  inviteMember: (email: string, role: UserRole) => void;
  changeRole: (id: string, role: UserRole) => void;
  setStatus: (id: string, status: NonNullable<User["status"]>) => void;
  removeMember: (id: string) => void;
}

/** The review team. Resolves assignee → name/initials in the queue and backs the
 *  Organization → Members table. Member edits mutate in-memory (prototype); the
 *  fetch is a no-op once loaded so in-session changes stick across navigation. */
export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  fetchUsers: async () => {
    if (get().users.length) return; // keep in-session member edits
    const users = await adapter.getAll<User>(Collections.USERS);
    set({ users });
  },
  byId: (id) => get().users.find((u) => u.id === id),

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
      status: "invited",
      createdAt: 0, // stamped by the caller/adapter in production
    };
    set((s) => ({ users: [...s.users, member] }));
  },
  changeRole: (id, role) =>
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, role } : u)),
    })),
  setStatus: (id, status) =>
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, status } : u)),
    })),
  removeMember: (id) =>
    set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
}));
