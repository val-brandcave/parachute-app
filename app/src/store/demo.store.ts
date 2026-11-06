import { create } from "zustand";
import { resetOrgRows, personaById, storePersona } from "@/lib/demo";
import type { DemoPersona } from "@/data/seed/demo-personas.seed";
import { seedUsers } from "@/data/seed/users.seed";
import { useSessionStore } from "./session.store";
import { useIdentityStore } from "./identity.store";
import { useRunStore } from "./run.store";
import { useOrderStore } from "./order.store";
import { useOrgStore } from "./org.store";
import { useWalletStore } from "./wallet.store";
import { loadSessionData } from "./session-data";

/* PROTOTYPE ONLY: persona switcher state. */

const GATE_KEY = "parachute:demo:approval-gate";
function readGate(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(GATE_KEY) === "1";
}
function storeGate(on: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GATE_KEY, on ? "1" : "0");
}

interface DemoState {
  personaId: string | null;
  /** Staff approval (RWT-1031) for NEW workspaces and the current one. */
  approvalGate: boolean;
  setApprovalGate: (on: boolean) => Promise<void>;
  dockOpen: boolean;
  toggleDock: () => void;
  /** Become a persona: set the session, reload org-scoped data, close takeovers.
   *  Returns the persona so the caller can route to `entryRoute`. */
  apply: (personaId: string) => Promise<DemoPersona | null>;
  /** Restore one org's rows to seed. `removed` = it was a runtime-created org. */
  resetOrg: (orgId?: string) => Promise<{ removed: boolean }>;
  /** Approve a pending workspace and grant its trial credits. */
  approveOrg: () => Promise<void>;
  addCredits: (n: number) => Promise<void>;
}

export const useDemoStore = create<DemoState>((set) => ({
  personaId: null,
  approvalGate: readGate(),
  setApprovalGate: async (on) => {
    storeGate(on);
    set({ approvalGate: on });
    // Also flip the flag on the current workspace so B2 reacts immediately.
    const org = useOrgStore.getState().org;
    if (org?.profile && org.id === useSessionStore.getState().orgId) {
      await useOrgStore.getState().setFlag("approvalGate", on);
    }
  },
  dockOpen: false,
  toggleDock: () => set((s) => ({ dockOpen: !s.dockOpen })),

  apply: async (personaId) => {
    const persona = personaById(personaId);
    if (!persona) return null;
    const session = useSessionStore.getState();
    if (persona.userId && persona.orgId) {
      const role = seedUsers.find((u) => u.id === persona.userId)?.role ?? "reviewer";
      session.signIn({ userId: persona.userId, orgId: persona.orgId, role });
    } else {
      session.signOut();
    }
    session.setMode(persona.mode, { returnLabel: "YouConnect" });
    useRunStore.getState().close();
    useOrderStore.getState().close();
    useIdentityStore.getState().setUserAvatar(null);
    useIdentityStore.getState().setOrgAvatar(null);
    await loadSessionData();
    storePersona(persona.id);
    set({ personaId: persona.id });
    return persona;
  },

  resetOrg: async (orgId) => {
    const id = orgId ?? useSessionStore.getState().orgId;
    if (!id) return { removed: false };
    const result = await resetOrgRows(id);
    if (result.removed) {
      useSessionStore.getState().signOut();
      storePersona(null);
      set({ personaId: null });
    }
    await loadSessionData();
    return result;
  },

  approveOrg: async () => {
    await useOrgStore.getState().approve();
    await useWalletStore.getState().grantTrial();
  },

  addCredits: async (n) => {
    await useWalletStore.getState().adjust(n, "Demo credits");
  },
}));
