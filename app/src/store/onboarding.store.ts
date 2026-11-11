import { useMemo, useState } from "react";
import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import {
  ACCOUNT_STEP,
  SETUP_SECTIONS,
  SETUP_STEPS,
  sectionDef,
  sectionReward,
  sectionRewardDue,
  type SetupCtx,
  type SetupStepDef,
} from "@/lib/setup-steps";
import { SECURITY_LINK_DAYS, earnWindow } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/current-user";
import {
  generateId,
  type CreditLedgerEntry,
  type SecuritySend,
  type SetupProgress,
  type SetupSectionId,
  type SetupStepId,
  type User,
} from "@/types";
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
  /** The action with its label resolved for the org kind (absent = no button). */
  actionResolved?: { label: string; href: string };
}

/** Sections already paid (one `earned` row per section). */
export const awardedSectionsOf = (ledger: readonly CreditLedgerEntry[]): SetupSectionId[] =>
  ledger.filter((e) => e.kind === "earned" && e.setupSectionId).map((e) => e.setupSectionId as SetupSectionId);

/** When the earn window opened: the trial grant (for enterprise orgs that is approval). */
export const earnGrantAt = (ledger: readonly CreditLedgerEntry[]): number | null =>
  ledger.find((e) => e.kind === "trial_grant")?.createdAt ?? null;

/** Pure derivation: the checklist is never stored, only `completed` timestamps. */
export function deriveSteps(progress: SetupProgress | null, ctx: SetupCtx): DerivedStep[] {
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
      actionResolved: s.action ? { ...s.action, label: s.actionLabel?.(ctx) ?? s.action.label } : undefined,
    };
  });
}

/** What the toast host shows after a credit is earned. */
export interface EarnedNotice {
  key: string;
  title: string;
  credits: number;
  orgName: string;
  /** The section whose reward this was (drives the earn-pill burst). */
  sectionId?: SetupSectionId;
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
      // Section reward (v4): pays once every step of the section is done inside the earn window.
      const step = SETUP_STEPS.find((s) => s.id === stepId);
      if (!step || sectionReward(step.section) <= 0) return;
      const wallet = useWalletStore.getState();
      const grantAt = earnGrantAt(wallet.ledger);
      if (grantAt === null) return; // enterprise before approval: the window has not opened
      const done = Object.keys(get().progress?.completed ?? {}) as SetupStepId[];
      const due = sectionRewardDue(done, step.section, earnWindow(grantAt, Date.now()), awardedSectionsOf(wallet.ledger));
      if (!due) return;
      const entry = await wallet.awardSection(step.section); // idempotent + capped
      if (entry) {
        const org = useOrgStore.getState().org;
        set({
          earnedNotice: {
            key: entry.id,
            title: sectionDef(step.section).title(org?.profile?.kind ?? "bank"),
            credits: entry.credits,
            orgName: org?.name ?? "your organization",
            sectionId: step.section,
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

export interface SectionSummary {
  id: SetupSectionId;
  title: string;
  sub: string;
  steps: DerivedStep[];
  doneCount: number;
  total: number;
  allDone: boolean;
  /** Credits the section pays (0 = no reward, e.g. team). */
  reward: number;
  /** Its reward is already in the ledger. */
  awarded: boolean;
  /** First not-done step: the one row that gets the navy primary button. */
  primaryId?: SetupStepId;
}

export interface EarnSummary {
  /** When the window opened (trial grant / approval); null = not open yet (enterprise pending). */
  grantAt: number | null;
  /** null while the window has not opened. */
  window: ReturnType<typeof earnWindow> | null;
  awardedSections: SetupSectionId[];
  /** Credits earned from setup so far. */
  earnedCredits: number;
  /** Free reviews still earnable (reward sections not yet paid), 0 once the window closes. */
  reviewsLeftToEarn: number;
}

export interface SetupSummary {
  ready: boolean;
  /** The pre-ticked account line (not counted). */
  account: { doneAt: number; by?: string };
  steps: DerivedStep[];
  sections: SectionSummary[];
  /** Done count of the 8 counted steps. */
  doneCount: number;
  /** Always SETUP_STEPS.length (8). */
  total: number;
  allDone: boolean;
  /** First step that is not done. */
  next?: DerivedStep;
  /** Credits earned from setup so far (= earn.earnedCredits). */
  earnedCredits: number;
  earn: EarnSummary;
  /** Enterprise org waiting on its call / Realwired confirmation. */
  pending: boolean;
  /** Users by id, for "by Dana Reyes". */
  userName: (id?: string) => string | undefined;
  /** The org_admin to ask when the current user can't act. */
  adminFirst: string | null;
}

/** Pure: the earn summary at `now`. */
export function deriveEarn(ledger: readonly CreditLedgerEntry[], now: number): EarnSummary {
  const grantAt = earnGrantAt(ledger);
  const window = grantAt === null ? null : earnWindow(grantAt, now);
  const awardedSections = awardedSectionsOf(ledger);
  const earnedCredits = ledger.filter((e) => e.kind === "earned").reduce((s, e) => s + e.credits, 0);
  const rewardSections = SETUP_SECTIONS.filter((s) => s.reward).map((s) => s.id);
  const reviewsLeftToEarn =
    window?.state === "closed" ? 0 : rewardSections.filter((id) => !awardedSections.includes(id)).length;
  return { grantAt, window, awardedSections, earnedCredits, reviewsLeftToEarn };
}

/** Reactive derived checklist + counts for components. `now` comes from a lazy useState
 *  so render stays pure (React 19); it is fixed for the life of the component. */
export function useSetupSummary(): SetupSummary {
  const progress = useOnboardingStore((s) => s.progress);
  const ledger = useWalletStore((s) => s.ledger);
  const users = useUsersStore((s) => s.users);
  const org = useOrgStore((s) => s.org);
  const [now] = useState(() => Date.now());
  return useMemo(() => {
    const trial = org?.billing === "trial";
    const kind = org?.profile?.kind ?? "bank";
    const pending = org?.approval === "pending";
    const approver = users.find((u: User) => u.role === "approver");
    const admin = users.find((u: User) => u.id === org?.billingContactId) ?? users.find((u: User) => u.role === "org_admin");
    const steps = deriveSteps(progress, {
      trial,
      approverFirst: approver ? approver.name.split(" ")[0] : null,
      kind,
      pending,
    });
    const earn = deriveEarn(ledger, now);
    const sections: SectionSummary[] = SETUP_SECTIONS.map((def) => {
      const own = steps.filter((s) => s.section === def.id);
      const doneCount = own.filter((s) => s.done).length;
      return {
        id: def.id,
        title: def.title(kind),
        sub: def.sub(kind, pending, org?.name ? org.name.trim().split(/\s+/)[0] : undefined),
        steps: own,
        doneCount,
        total: own.length,
        allDone: doneCount === own.length,
        reward: sectionReward(def.id),
        awarded: earn.awardedSections.includes(def.id),
        primaryId: own.find((s) => !s.done)?.id,
      };
    });
    const doneCount = steps.filter((s) => s.done).length;
    return {
      ready: !!progress,
      account: {
        doneAt: progress?.completed[ACCOUNT_STEP.id] ?? progress?.createdAt ?? 0,
        by: progress?.completedBy?.[ACCOUNT_STEP.id] ?? org?.billingContactId,
      },
      steps,
      sections,
      doneCount,
      total: steps.length,
      allDone: steps.every((s) => s.done),
      next: steps.find((s) => !s.done && !s.doing) ?? steps.find((s) => !s.done),
      earnedCredits: earn.earnedCredits,
      earn,
      pending,
      userName: (id) => users.find((u: User) => u.id === id)?.name,
      adminFirst: admin ? admin.name.split(" ")[0] : null,
    };
  }, [progress, ledger, users, org, now]);
}

/** Trial / pay-as-you-go orgs, and invoiced orgs that came through sales (enterprise,
 *  `profile.salesRequested`), get the setup guide. Plain invoiced (YouConnect) orgs never do. */
export function setupEligible(org: { billing?: string; profile?: { salesRequested?: boolean } } | null): boolean {
  if (!org) return false;
  if (org.billing === "trial" || org.billing === "payg") return true;
  return org.billing === "invoiced" && !!org.profile?.salesRequested;
}

/** `"new"` = first-run Home; `"active"` = today's dashboard. Setup-eligible orgs
 *  (see `setupEligible`) are `new` until setup is complete or Home is dismissed
 *  org-wide. Other invoiced orgs are always `active`. Hiding the guide is per user and
 *  does NOT change the stage (see `useSetupHidden`). */
export function useOrgStage(): "new" | "active" {
  const progress = useOnboardingStore((s) => s.progress);
  const org = useOrgStore((s) => s.org);
  const summary = useSetupSummary();
  if (!progress || !org) return "active";
  if (!setupEligible(org)) return "active";
  if (summary.allDone || progress.homeDismissedAt) return "active";
  return "new";
}

/** This user has hidden the setup guide (removes the checklist card and dock only). */
export function useSetupHidden(): boolean {
  const userId = useSessionStore((s) => s.userId);
  return usePrefsStore((s) => (userId ? !!s.setupHiddenBy[userId] : false));
}

/** The org is waiting for Realwired staff approval: no trial credits yet and no
 *  new reviews (the sample stays open). Drives the dashboard's pending state and
 *  every "Start a review" entry point. */
export function useApprovalPending(): boolean {
  return useOrgStore((s) => s.org?.approval === "pending");
}
