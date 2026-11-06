import { useMemo } from "react";
import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import {
  ACCOUNT_STEP,
  SETUP_STEPS,
  rewardFor,
  stepDef,
  type SetupCtx,
  type SetupStepDef,
} from "@/lib/setup-steps";
import { SECURITY_LINK_DAYS } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/current-user";
import { generateId, type SecuritySend, type SetupProgress, type SetupStepId, type User } from "@/types";
import { useSessionStore } from "./session.store";
import { useWalletStore } from "./wallet.store";
import { useUsersStore } from "./users.store";
import { useOrgStore } from "./org.store";
import { usePrefsStore } from "./prefs.store";

export interface DerivedStep extends SetupStepDef {
  /** Resolved description (depends on the org). */
  descText: string;
  done: boolean;
  doneAt?: number;
  /** User id that completed it. */
  doneBy?: string;
  /** Started but not finished: the meta line (and where View/Continue goes). */
  doing?: { note: string; href?: string };
  /** Credits this step pays out when first completed (0 = none). */
  reward: number;
  /** Reward already collected for this step. */
  rewarded: boolean;
}

const earnedIdsOf = (ledger: { kind: string; setupStepId?: string }[]) =>
  new Set(ledger.filter((e) => e.kind === "earned" && e.setupStepId).map((e) => e.setupStepId as string));

/** Pure derivation: the checklist is never stored, only `completed` timestamps. */
export function deriveSteps(
  progress: SetupProgress | null,
  earnedStepIds: ReadonlySet<string>,
  ctx: SetupCtx,
): DerivedStep[] {
  return SETUP_STEPS.map((s) => {
    const doneAt = progress?.completed[s.id];
    const note = progress?.inProgress?.[s.id];
    return {
      ...s,
      descText: s.desc(ctx),
      done: doneAt !== undefined,
      doneAt,
      doneBy: progress?.completedBy?.[s.id],
      doing: doneAt === undefined && note ? note : undefined,
      reward: rewardFor(s.id),
      rewarded: earnedStepIds.has(s.id),
    };
  });
}

/** What the toast host shows after a credit is earned. */
export interface EarnedNotice {
  key: string;
  title: string;
  credits: number;
  orgName: string;
}

interface OnboardingState {
  orgId: string | null;
  progress: SetupProgress | null;
  earnedNotice: EarnedNotice | null;
  fetchProgress: (orgId?: string | null) => Promise<void>;
  /** Mark a step done (idempotent) and pay its reward through the wallet. */
  complete: (stepId: SetupStepId) => Promise<void>;
  /** Record a security-pack send (and complete the step). */
  sendSecurityPack: (to: string, note?: string) => Promise<SecuritySend | null>;
  dismissHome: () => Promise<void>;
  clearEarnedNotice: () => void;
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
    earnedNotice: null,

    fetchProgress: async (orgId) => {
      const id = orgId === undefined ? useSessionStore.getState().orgId : orgId;
      if (!id) {
        set({ orgId: null, progress: null });
        return;
      }
      let row = await adapter.getById<SetupProgress>(Collections.SETUP_PROGRESS, id);
      if (!row) {
        const now = Date.now();
        row = {
          id,
          orgId: id,
          createdAt: now,
          completed: { account: now },
          completedBy: { account: useSessionStore.getState().userId ?? undefined } as SetupProgress["completedBy"],
        };
        await adapter.create<SetupProgress>(Collections.SETUP_PROGRESS, row);
      }
      set({ orgId: id, progress: row });
    },

    complete: async (stepId) => {
      const current = get().progress;
      if (!current) return;
      if (current.completed[stepId] === undefined) {
        const inProgress = { ...(current.inProgress ?? {}) };
        delete inProgress[stepId];
        await patch({
          completed: { ...current.completed, [stepId]: Date.now() },
          completedBy: { ...(current.completedBy ?? {}), [stepId]: getCurrentUser().id },
          inProgress,
        });
      }
      const entry = await useWalletStore.getState().award(stepId); // idempotent + capped
      if (entry) {
        set({
          earnedNotice: {
            key: entry.id,
            title: stepDef(stepId)?.doneLabel ?? "Step complete",
            credits: entry.credits,
            orgName: useOrgStore.getState().org?.name ?? "your organization",
          },
        });
      }
    },

    sendSecurityPack: async (to, note) => {
      const current = get().progress;
      if (!current) return null;
      const now = Date.now();
      const send: SecuritySend = {
        id: generateId(),
        to,
        note: note || undefined,
        sentAt: now,
        expiresAt: now + SECURITY_LINK_DAYS * 86_400_000,
        byId: getCurrentUser().id,
      };
      await patch({ securitySends: [...(current.securitySends ?? []), send] });
      await useOrgStore.getState().patchOrg({ securityPackSentAt: now });
      await get().complete("security_pack");
      return send;
    },

    dismissHome: () => patch({ homeDismissedAt: Date.now() }),
    clearEarnedNotice: () => set({ earnedNotice: null }),
  };
});

export interface SetupSummary {
  ready: boolean;
  /** The pre-ticked first line. */
  account: { doneAt: number; by?: string };
  steps: DerivedStep[];
  /** Done count including "Account created". */
  doneCount: number;
  /** Total including "Account created". */
  total: number;
  allDone: boolean;
  /** First step that is not done. */
  next?: DerivedStep;
  /** Credits earned from setup so far. */
  earnedCredits: number;
  /** Users by id, for "by Dana Reyes". */
  userName: (id?: string) => string | undefined;
  /** The org_admin to ask when the current user can't act. */
  adminFirst: string | null;
}

/** Reactive derived checklist + counts for components. */
export function useSetupSummary(): SetupSummary {
  const progress = useOnboardingStore((s) => s.progress);
  const ledger = useWalletStore((s) => s.ledger);
  const users = useUsersStore((s) => s.users);
  const org = useOrgStore((s) => s.org);
  return useMemo(() => {
    const trial = org?.billing === "trial";
    const approver = users.find((u: User) => u.role === "approver");
    const admin = users.find((u: User) => u.id === org?.billingContactId) ?? users.find((u: User) => u.role === "org_admin");
    const steps = deriveSteps(progress, earnedIdsOf(ledger), {
      trial,
      approverFirst: approver ? approver.name.split(" ")[0] : null,
    });
    const doneCount = 1 + steps.filter((s) => s.done).length;
    const earnedCredits = ledger.filter((e) => e.kind === "earned").reduce((s, e) => s + e.credits, 0);
    return {
      ready: !!progress,
      account: {
        doneAt: progress?.completed[ACCOUNT_STEP.id] ?? progress?.createdAt ?? 0,
        by: progress?.completedBy?.[ACCOUNT_STEP.id] ?? org?.billingContactId,
      },
      steps,
      doneCount,
      total: steps.length + 1,
      allDone: steps.every((s) => s.done),
      next: steps.find((s) => !s.done && !s.doing) ?? steps.find((s) => !s.done),
      earnedCredits,
      userName: (id) => users.find((u: User) => u.id === id)?.name,
      adminFirst: admin ? admin.name.split(" ")[0] : null,
    };
  }, [progress, ledger, users, org]);
}

/** `"new"` = first-run Home; `"active"` = today's dashboard. Trial and
 *  pay-as-you-go orgs are `new` until setup is complete or Home is dismissed
 *  org-wide. Invoiced orgs are always `active`. Hiding the guide is per user and
 *  does NOT change the stage (see `useSetupHidden`). */
export function useOrgStage(): "new" | "active" {
  const progress = useOnboardingStore((s) => s.progress);
  const org = useOrgStore((s) => s.org);
  const summary = useSetupSummary();
  if (!progress || !org) return "active";
  if (org.billing !== "trial" && org.billing !== "payg") return "active";
  if (summary.allDone || progress.homeDismissedAt) return "active";
  return "new";
}

/** This user has hidden the setup guide (removes the checklist card and dock only). */
export function useSetupHidden(): boolean {
  const userId = useSessionStore((s) => s.userId);
  return usePrefsStore((s) => (userId ? !!s.setupHiddenBy[userId] : false));
}
