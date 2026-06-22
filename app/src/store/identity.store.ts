import { create } from "zustand";

/**
 * Avatars chosen via AvatarUpload, shared across the app so a new org logo or
 * profile photo reflects everywhere immediately (sidebar org card, topbar user
 * menu, etc.). Prototype: held in memory (data URLs), reset on full reload.
 */
interface IdentityState {
  userAvatar: string | null;
  orgAvatar: string | null;
  setUserAvatar: (url: string | null) => void;
  setOrgAvatar: (url: string | null) => void;
}

export const useIdentityStore = create<IdentityState>((set) => ({
  userAvatar: null,
  orgAvatar: null,
  setUserAvatar: (userAvatar) => set({ userAvatar }),
  setOrgAvatar: (orgAvatar) => set({ orgAvatar }),
}));
