import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import type { User } from "@/types";

interface UsersState {
  users: User[];
  fetchUsers: () => Promise<void>;
  byId: (id: string) => User | undefined;
}

/** The review team. Used to resolve assignee → name/initials in the queue. */
export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  fetchUsers: async () => {
    const users = await adapter.getAll<User>(Collections.USERS);
    set({ users });
  },
  byId: (id) => get().users.find((u) => u.id === id),
}));
