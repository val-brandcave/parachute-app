"use client";

import { useCallback, useEffect, useState } from "react";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { routeForProfile, VOLUME_BAND_LABEL } from "@/lib/pricing";
import { useOnboardingFrame, useStepNav, type InterstitialPath } from "@/components/organisms/onboarding";
import { loadSessionData } from "@/store/session-data";
import { STAGE_ORG_ID, useOrgStore } from "@/store/org.store";
import { useSessionStore } from "@/store/session.store";
import { useUsersStore } from "@/store/users.store";
import { useWalletStore } from "@/store/wallet.store";
import type { OrgKind, OrgProfile, TeamBand, User, VolumeBand } from "@/types";

/* ------------------------------------------------------------------ copy */

export const KIND_OPTIONS: { value: OrgKind; label: string }[] = [
  { value: "bank", label: "Bank or lender" },
  { value: "appraisal_firm", label: "Appraisal firm" },
];
export const TEAM_OPTIONS: { value: TeamBand; label: string }[] = [
  { value: "1", label: "Just me" },
  { value: "2-10", label: "2–10" },
  { value: "11+", label: "11+" },
];
const VOLUME_ORDER: VolumeBand[] = ["lt50", "50-200", "200+", "unsure"];
export const VOLUME_OPTIONS: { value: VolumeBand; label: string }[] = VOLUME_ORDER.map((v) => ({
  value: v,
  label: VOLUME_BAND_LABEL[v],
}));

/** The stage org (PC-19) and its seeded first admin. */
const STAGE_ORG_NAME = "Harbor Community Bank";
const STAGE_ADMIN_ID = "user-dr";
const DEMO_EMAIL = "dana.reyes@harborcb.com";
const DEMO_NAME = "Dana Reyes";

/** Primary-button busy beat (motion-spec §4: mock latency 500–700 ms). */
const MOCK_LATENCY_MS = 600;

const NAME_REQUIRED = "Enter your organization's name";

function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length >= 2 ? words[0][0] + words[words.length - 1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/* -------------------------------------------------------------- workspace */

/**
 * Create or update the stage org `org-hcb` (PC-19: same id every time, so demo
 * resets don't pile up orgs), sign its first admin in and load its data.
 * Self-serve gets the trial now; enterprise waits for approval (`approve()` grants it).
 */
async function setUpStageOrg(name: string, profile: OrgProfile, route: "self_serve" | "enterprise"): Promise<void> {
  const session = useSessionStore.getState();
  await useOrgStore.getState().upsertStageOrg({
    name,
    profile,
    adminId: STAGE_ADMIN_ID,
    approvalGate: route === "enterprise",
  });
  // The seeded admin normally exists; recreate it if a reset removed it.
  const admin = await adapter.getById<User>(Collections.USERS, STAGE_ADMIN_ID);
  if (!admin) {
    const fullName = session.name || DEMO_NAME;
    await adapter.create<User>(Collections.USERS, {
      id: STAGE_ADMIN_ID,
      name: fullName,
      initials: initialsOf(fullName),
      designation: "Organization admin",
      signatureName: fullName,
      email: session.email ?? DEMO_EMAIL,
      role: "org_admin",
      orgId: STAGE_ORG_ID,
      status: "active",
      createdAt: Date.now(),
    });
  }
  useSessionStore.getState().signIn({ userId: STAGE_ADMIN_ID, orgId: STAGE_ORG_ID, role: "org_admin" });
  await loadSessionData();
  if (route === "self_serve") await useWalletStore.getState().grantTrial();
}

/* ------------------------------------------------------------- /welcome */

export function useWelcomeSetup() {
  const { go } = useStepNav();
  const frame = useOnboardingFrame();
  const [name, setNameState] = useState(STAGE_ORG_NAME);
  const [kind, setKindState] = useState<OrgKind>("bank");
  const [team, setTeam] = useState<TeamBand>("2-10");
  const [volume, setVolume] = useState<VolumeBand>("lt50");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);

  // A prospect arriving here is mid sign-up: make sure the session says so.
  useEffect(() => {
    const s = useSessionStore.getState();
    if (s.auth === "anonymous") s.verify({ email: DEMO_EMAIL, name: DEMO_NAME });
  }, []);

  const route = routeForProfile({ teamBand: team, volumeBand: volume });
  // Which answer crossed the threshold (each one tested on its own), for the petrol marker.
  const trigger = {
    team: routeForProfile({ teamBand: team, volumeBand: "lt50" }) === "enterprise",
    volume: routeForProfile({ teamBand: "1", volumeBand: volume }) === "enterprise",
  };

  const setName = useCallback((v: string) => {
    setNameState(v);
    setNameError(null);
  }, []);
  const setKind = useCallback(
    (k: OrgKind) => {
      setKindState(k);
      frame?.setKind(k);
    },
    [frame],
  );

  const submit = useCallback(async () => {
    if (busy) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(NAME_REQUIRED);
      setShake((n) => n + 1);
      return;
    }
    setBusy(true);
    setFormError(null);
    const profile: OrgProfile = { kind, teamBand: team, volumeBand: volume };
    try {
      await Promise.all([setUpStageOrg(trimmed, profile, route), wait(MOCK_LATENCY_MS)]);
    } catch {
      setBusy(false);
      setFormError("We couldn't create your organization. Try again.");
      return;
    }
    await go(route === "enterprise" ? "/welcome/call" : "/welcome/invite", 1);
  }, [busy, name, kind, team, volume, route, go]);

  return {
    name, setName, nameError, shake,
    kind, setKind, team, setTeam, volume, setVolume,
    route, trigger, unsure: volume === "unsure",
    busy, formError, submit,
  };
}

/* -------------------------------------------------- /welcome/invite, /call */

/** The org being set up and the admin's e-mail domain (InviteStep restricts to it). */
export function useStageOrg(): { orgName: string; domain: string | undefined } {
  const org = useOrgStore((s) => s.org);
  const userId = useSessionStore((s) => s.userId);
  const sessionEmail = useSessionStore((s) => s.email);
  const admin = useUsersStore((s) => (userId ? s.byId(userId) : undefined));
  const orgName = org?.id === STAGE_ORG_ID ? org.name : STAGE_ORG_NAME;
  const email = admin?.email ?? sessionEmail ?? DEMO_EMAIL;
  const domain = email.includes("@") ? email.split("@")[1] : undefined;
  return { orgName, domain };
}

/** Hand the last step off to the interstitial (T4). Its `work` reloads the session's
 *  stores so Get started lands with fresh data. */
export function useFinishOnboarding(): (path: InterstitialPath) => void {
  const frame = useOnboardingFrame();
  return useCallback((path: InterstitialPath) => frame?.finish(path, loadSessionData), [frame]);
}
