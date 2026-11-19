import { create } from "zustand";
import { seedUsers } from "@/data/seed/users.seed";
import {
  STAGE_ORG,
  STAGE_USER,
  YC_ORG,
  personaById,
  rebuildStageOrg,
  resetOrgRows,
  storePersona,
} from "@/lib/demo";
import { markArrival } from "@/lib/motion";
import { SETUP_STEPS } from "@/lib/setup-steps";
import { presetFor, type Preset } from "@/lib/prototype/presets";
import { normalize } from "@/lib/prototype/scenario-builder";
import type { Scenario } from "@/lib/prototype/scenario";
import { useIdentityStore } from "./identity.store";
import { useOnboardingStore } from "./onboarding.store";
import { useOrderStore } from "./order.store";
import { useOrgStore } from "./org.store";
import { usePrefsStore } from "./prefs.store";
import { useRunStore } from "./run.store";
import { useSessionStore } from "./session.store";
import { loadSessionData } from "./session-data";
import { useWalletStore } from "./wallet.store";

/* PROTOTYPE ONLY: the scenario behind the state pill and the scenario popover (spec §6).
 * Replaced store/demo.store.ts (deleted in T5.9); SeedProvider and sign-in enter legacy personas via enterPreset. */

const KEY = "parachute:proto:scenario";
const CELEBRATED_KEY = "parachute:celebrated";
const WELCOME_KEY = "parachute:welcome-dismissed";

/** The seed's own state: Harbor, trial, 2 of 8, Dana. A fresh browser starts here. */
const SEED_SCENARIO: Scenario = presetFor("trial-admin")!.scenario;

interface Persisted {
  scenario: Scenario;
  legacy: string | null;
  /** An action (Add 5, Spend 1, Complete next step) changed rows the scenario doesn't describe. */
  edited?: boolean;
}

function readPersisted(): Persisted {
  const fallback: Persisted = { scenario: SEED_SCENARIO, legacy: null };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fallback;
    const p = JSON.parse(raw) as Partial<Persisted>;
    return { scenario: normalize({ ...SEED_SCENARIO, ...p.scenario }).scenario, legacy: p.legacy ?? null, edited: !!p.edited };
  } catch {
    return fallback;
  }
}

function writePersisted(p: Persisted): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage blocked: the scenario holds for this page view */
  }
}

/** Merge view params into the address bar without a history entry. Next syncs
 *  `useSearchParams` with native `history.replaceState`. An empty value removes the key. */
function applyView(view: Record<string, string>): void {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(view)) {
    if (v === "") url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}

/** Close takeovers and reload every org-scoped store after an identity change. */
async function reloadSession(): Promise<void> {
  useRunStore.getState().close();
  useOrderStore.getState().close();
  useIdentityStore.getState().setUserAvatar(null);
  useIdentityStore.getState().setOrgAvatar(null);
  await loadSessionData();
}

/** Sign in as whoever the scenario stages. `storePersona` keeps SeedProvider's reload path
 *  in step: a remembered persona is re-applied on reload, a plain session is restored. */
function signInFor(s: Scenario): void {
  const session = useSessionStore.getState();
  if (s.lifecycle === "prospect") {
    session.signOut();
    session.setMode("full");
    storePersona("prospect");
    return;
  }
  if (s.lifecycle === "verified") {
    session.verify();
    session.setMode("full");
    storePersona("prospect-sales");
    return;
  }
  if (s.audience === "youconnect") {
    session.signIn({ userId: "user-001", orgId: YC_ORG, role: "org_admin" });
    session.setMode("embedded", { returnLabel: "YouConnect" });
    storePersona("enterprise-yc");
    return;
  }
  session.signIn({ userId: STAGE_USER[s.role], orgId: STAGE_ORG, role: s.role });
  session.setMode("full");
  storePersona(null);
}

export type { ProtoFill } from "./proto-fill.store";

/**
 * Single flight for everything that rewrites stage-org rows. `replaceRows` reads, removes,
 * then writes, so two overlapping applies (StrictMode's double effect, a `?s=` link landing
 * mid-apply) used to double every row. Each job starts only after the previous one settles.
 */
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(job: () => Promise<T>): Promise<T> {
  const run = chain.then(job, job);
  chain = run.catch(() => undefined);
  return run;
}

interface ProtoState {
  scenario: Scenario;
  /** Normalization notes from the last apply (spec §6 "explain themselves"). */
  notes: string[];
  /** A legacy persona alias is active (its own seeded identity, not the stage org). */
  legacy: string | null;
  /** Rows were edited by an action since the last apply: no page state matches ("Custom"). */
  edited: boolean;
  busy: boolean;
  /** When the last apply finished: drives the pill's 1-second "Applied" tick. */
  appliedAt: number;
  /** Effective hidden: the persisted pref or a `?controls=0` link. */
  hidden: boolean;
  /** `?controls=0` hid the controls for this page view (never persisted). */
  forced: boolean;
  popoverOpen: boolean;

  apply: (patch: Partial<Scenario>, view?: Record<string, string>) => Promise<void>;
  /** Reset org: rebuild the stage org from the current scenario (or a legacy org to seed). */
  reset: () => Promise<void>;
  /** A preset: legacy aliases keep their persona's identity; otherwise a full apply. */
  enterPreset: (preset: Preset, opts?: { alias?: boolean }) => Promise<void>;
  toggleHidden: () => void;
  forceHidden: () => void;
  setPopoverOpen: (open: boolean) => void;

  /* Scenario actions. Each returns the line the popover shows back. */
  approveNow: () => Promise<string>;
  completeNextStep: () => Promise<string>;
  addCredits: (n: number) => Promise<string>;
  spendCredit: () => Promise<string>;
  resetToursAndCelebrations: () => string;
  /** Arms the one-shot arrival mark; the caller then opens Get started. */
  replayArrival: () => string;
}

const initial = readPersisted();

export const useProtoStore = create<ProtoState>((set, get) => {
  const commit = (scenario: Scenario, legacy: string | null, extra: Partial<ProtoState> = {}) => {
    const edited = extra.edited ?? false;
    writePersisted({ scenario, legacy, edited });
    set({ scenario, legacy, ...extra, edited });
  };
  /** After an action that edits rows the scenario doesn't describe: the pill shows "Custom". */
  const markEdited = () => commit(get().scenario, get().legacy, { edited: true });

  /** The apply itself; callers go through `serial`. */
  const applyNow = async (patch: Partial<Scenario>, view?: Record<string, string>) => {
    const now = Date.now();
    const { scenario, notes } = normalize({ ...get().scenario, ...patch });
    set({ busy: true });
    try {
      await rebuildStageOrg(scenario, now, view);
      signInFor(scenario);
      await reloadSession();
      if (view) applyView(view);
      commit(scenario, null, { notes, appliedAt: Date.now() });
    } finally {
      set({ busy: false });
    }
  };
  const userId = () => useSessionStore.getState().userId;
  const invoiced = () => useOrgStore.getState().org?.billing === "invoiced";

  return {
    scenario: initial.scenario,
    notes: [],
    legacy: initial.legacy,
    edited: initial.edited ?? false,
    busy: false,
    appliedAt: 0,
    hidden: usePrefsStore.getState().protoHidden,
    forced: false,
    popoverOpen: false,

    apply: (patch, view) => serial(() => applyNow(patch, view)),

    reset: () =>
      serial(async () => {
        const { legacy, scenario } = get();
        const orgId = useSessionStore.getState().orgId;
        if (legacy && orgId && orgId !== STAGE_ORG && orgId !== YC_ORG) {
          set({ busy: true });
          try {
            await resetOrgRows(orgId);
            await reloadSession();
            commit(scenario, legacy, { appliedAt: Date.now() });
          } finally {
            set({ busy: false });
          }
          return;
        }
        await applyNow(scenario);
      }),

    enterPreset: (preset, opts) =>
      serial(async () => {
        const persona = opts?.alias ? personaById(preset.legacyPersonaId) : undefined;
        if (!persona) {
          await applyNow(preset.scenario);
          return;
        }
        // Legacy alias: the persona's seeded identity, rows untouched (the old /demo/<id>).
        const session = useSessionStore.getState();
        if (persona.userId && persona.orgId) {
          const role = seedUsers.find((u) => u.id === persona.userId)?.role ?? "reviewer";
          session.signIn({ userId: persona.userId, orgId: persona.orgId, role });
        } else {
          session.signOut();
        }
        session.setMode(persona.mode, { returnLabel: "YouConnect" });
        storePersona(persona.id);
        await reloadSession();
        commit(normalize(preset.scenario).scenario, persona.id, { notes: [], appliedAt: Date.now() });
      }),

    toggleHidden: () => {
      const next = !get().hidden;
      usePrefsStore.getState().setProtoHidden(next);
      set({ hidden: next, forced: false, popoverOpen: false });
    },
    forceHidden: () => set({ hidden: true, forced: true, popoverOpen: false }),
    setPopoverOpen: (popoverOpen) => set({ popoverOpen }),

    approveNow: async () => {
      const org = useOrgStore.getState().org;
      if (!org) return "No organization yet: pick an approved scenario first.";
      if (org.approval !== "pending") return `${org.name} is already approved.`;
      await useOrgStore.getState().approve();
      const sc = get().scenario;
      const next = normalize({ ...sc, lifecycle: "approved", wallet: sc.wallet === "held" ? "fresh" : sc.wallet }).scenario;
      commit(next, get().legacy, { appliedAt: Date.now() });
      return `${org.name} is approved.`;
    },

    completeNextStep: async () => {
      const ob = useOnboardingStore.getState();
      if (!ob.progress) return "This organization has no setup checklist.";
      const next = SETUP_STEPS.find((s) => ob.progress?.completed[s.id] === undefined);
      if (!next) return "Setup is already finished.";
      await ob.complete(next.id);
      markEdited();
      return `Done: ${next.id.replace(/_/g, " ")}.`;
    },

    addCredits: async (n) => {
      if (invoiced()) return "Invoiced organizations have no balance to add to.";
      if (!useOrgStore.getState().org) return "No organization yet.";
      await useWalletStore.getState().adjust(n, "Prototype credits");
      markEdited();
      return `Added ${n} credits.`;
    },

    spendCredit: async () => {
      if (invoiced()) return "Invoiced organizations have no balance to spend.";
      const balance = useWalletStore.getState().balance();
      if (balance <= 0) return "The balance is already 0.";
      await useWalletStore.getState().adjust(-1, "Prototype spend");
      markEdited();
      return "Spent 1 credit.";
    },

    resetToursAndCelebrations: () => {
      const id = userId();
      if (!id) return "Nobody is signed in.";
      usePrefsStore.getState().clearCelebrationsAndTours(id);
      return "Tours and celebrations will play again.";
    },

    replayArrival: () => {
      const id = userId();
      // celebrate() plays once per user and the welcome line hides once dismissed: clear both
      // for this user so the arrival plays as if they had just finished onboarding.
      const prefs = usePrefsStore.getState();
      if (id) {
        const celebratedBy = { ...prefs.celebratedBy, [id]: { ...prefs.celebratedBy[id], onboarding: undefined } };
        const welcomeDismissedBy = { ...prefs.welcomeDismissedBy };
        delete welcomeDismissedBy[id];
        usePrefsStore.setState({ celebratedBy, welcomeDismissedBy });
        try {
          window.localStorage.setItem(CELEBRATED_KEY, JSON.stringify(celebratedBy));
          window.localStorage.setItem(WELCOME_KEY, JSON.stringify(welcomeDismissedBy));
        } catch {
          /* storage blocked: the replay still plays for this page view */
        }
      }
      markArrival({ path: get().scenario.audience === "enterprise" ? "enterprise" : "self_serve", at: Date.now() });
      return "Arrival armed: opening Get started.";
    },
  };
});
