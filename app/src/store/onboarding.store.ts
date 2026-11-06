import { useMemo } from "react";
import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { SETUP_STEPS, rewardFor, type SetupGroup } from "@/lib/setup-steps";
import type { SetupProgress, SetupStepId } from "@/types";
import { useSessionStore } from "./session.store";
import { useWalletStore } from "./wallet.store";

export interface DerivedStep {
  id: SetupStepId;
  group: SetupGroup;
  label: string;
  desc: string;
  href: string;
  done: boolean;
  doneAt?: number;
  /** Credits this step pays out when first completed (0 = none). */
  reward: number;
  /** Reward already collected for this step. */
  rewarded: boolean;
}

/** Pure derivation: the checklist is never stored, only `completed` timestamps. */
export function deriveSteps(
  progress: SetupProgress | null,
  earnedStepIds: ReadonlySet<string>,
): DerivedStep[] {
  return SETUP_STEPS.map((s) => {
    const doneAt = progress?.completed[s.id];
    return {
      ...s,
      done: doneAt !== undefined,
      doneAt,
      reward: rewardFor(s.id),
      rewarded: earnedStepIds.has(s.id),
    };
  });
}

const earnedIdsOf = (ledger: { kind: string; setupStepId?: string }[]) =>
  new Set(ledger.filter((e) => e.kind === "earned" && e.setupStepId).map((e) => e.setupStepId as string));

interface OnboardingState {
  orgId: string | null;
  progress: SetupProgress | null;
  fetchProgress: (orgId?: string | null) => Promise<void>;
  /** Derived steps for imperative use. Components should use `useSetupSteps()`. */
  steps: () => DerivedStep[];
  doneCount: () => number;
  /** Mark a step done (idempotent) and pay its reward through the wallet. */
  complete: (stepId: SetupStepId) => Promise<void>;
  dismissDock: () => Promise<void>;
  dismissHome: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => {
  const patch = async (partial: Partial<SetupProgress>) => {
    const current = get().progress;
    if (!current) return;
    await adapter.update<SetupProgress>(Collections.SETUP_PROGRESS, current.id, partial);
    set({ progress: { ...current, ...partial } });
  };

  return {
    orgId: null,
    progress: null,

    fetchProgress: async (orgId) => {
      const id = orgId === undefined ? useSessionStore.getState().orgId : orgId;
      if (!id) {
        set({ orgId: null, progress: null });
        return;
      }
      let row = await adapter.getById<SetupProgress>(Collections.SETUP_PROGRESS, id);
      if (!row) {
        row = { id, orgId: id, createdAt: Date.now(), completed: {} };
        await adapter.create<SetupProgress>(Collections.SETUP_PROGRESS, row);
      }
      set({ orgId: id, progress: row });
    },

    steps: () => deriveSteps(get().progress, earnedIdsOf(useWalletStore.getState().ledger)),
    doneCount: () => get().steps().filter((s) => s.done).length,

    complete: async (stepId) => {
      const current = get().progress;
      if (!current) return;
      if (current.completed[stepId] === undefined) {
        await patch({ completed: { ...current.completed, [stepId]: Date.now() } });
      }
      await useWalletStore.getState().award(stepId); // idempotent + capped
    },

    dismissDock: () => patch({ dockDismissedAt: Date.now() }),
    dismissHome: () => patch({ homeDismissedAt: Date.now() }),
  };
});

/** Reactive derived checklist for components. */
export function useSetupSteps(): DerivedStep[] {
  const progress = useOnboardingStore((s) => s.progress);
  const ledger = useWalletStore((s) => s.ledger);
  return useMemo(() => deriveSteps(progress, earnedIdsOf(ledger)), [progress, ledger]);
}
