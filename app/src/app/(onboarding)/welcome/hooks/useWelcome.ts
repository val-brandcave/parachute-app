"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@realwired/ui";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { needsStaffApproval } from "@/lib/pricing";
import { landingRoute } from "@/lib/landing";
import { loadSessionData } from "@/store/session-data";
import { useOrgStore } from "@/store/org.store";
import { useSessionStore } from "@/store/session.store";
import { useWalletStore } from "@/store/wallet.store";
import {
  generateId,
  type Org,
  type OrgKind,
  type OrgProfile,
  type TeamBand,
  type User,
  type VolumeBand,
} from "@/types";

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
export const VOLUME_OPTIONS: { value: VolumeBand; label: string }[] = [
  { value: "lt50", label: "Under 50" },
  { value: "50-200", label: "50–200" },
  { value: "200+", label: "200+" },
];

const DEMO_ORG_NAME = "Harbor Community Bank";
const DEMO_EMAIL = "dana.reyes@harborcb.com";
const DEMO_NAME = "Dana Reyes";
const DEMO_LARGE_PROFILE: OrgProfile = { kind: "bank", teamBand: "11+", volumeBand: "200+" };

function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length >= 2 ? words[0][0] + words[words.length - 1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}

/* -------------------------------------------------------------- workspace */

/** Create the prospect as org_admin of a new org, sign them in, and load its data. */
async function createWorkspace(name: string, profile: OrgProfile): Promise<Org> {
  // Decided 9 Nov: self-serve teams are approved instantly; only sales-flagged
  // orgs (11+ reviewers or 200+ reports) wait, and they wait on the dashboard.
  const session = useSessionStore.getState();
  const fullName = session.name || DEMO_NAME;
  const userId = `user-${generateId().slice(0, 8)}`;
  const org = await useOrgStore.getState().createOrg({
    name,
    profile,
    adminId: userId,
    approvalGate: needsStaffApproval(profile),
  });
  const user: User = {
    id: userId,
    name: fullName,
    initials: initialsOf(fullName),
    designation: "Organization admin",
    signatureName: fullName,
    email: session.email ?? DEMO_EMAIL,
    role: "org_admin",
    orgId: org.id,
    status: "active",
    createdAt: Date.now(),
  };
  await adapter.create<User>(Collections.USERS, user);
  useSessionStore.getState().signIn({ userId, orgId: org.id, role: "org_admin" });
  await loadSessionData();
  // Not gated: approved on the spot, so the trial credits land now.
  if (!needsStaffApproval(profile)) await useWalletStore.getState().grantTrial();
  return org;
}

/** True when the session already owns a workspace made by this flow. */
function hasWorkspace(): boolean {
  const org = useOrgStore.getState().org;
  return !!org?.profile && org.id === useSessionStore.getState().orgId;
}

/** Single-flight, so a React strict-mode double effect cannot create two orgs. */
let ensuring: Promise<void> | null = null;
function ensureDemoWorkspace(profile: OrgProfile): Promise<void> {
  if (hasWorkspace()) return Promise.resolve();
  ensuring ??= createWorkspace(DEMO_ORG_NAME, profile)
    .then(() => undefined)
    .finally(() => {
      ensuring = null;
    });
  return ensuring;
}

/* ------------------------------------------------------------- /welcome */

export function useWelcomeSetup(opts: { preset?: string | null; step?: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const large = opts.preset === "large";
  const [name, setName] = useState(DEMO_ORG_NAME);
  const [kind, setKind] = useState<OrgKind>("bank");
  const [team, setTeam] = useState<TeamBand>(large ? "11+" : "2-10");
  const [volume, setVolume] = useState<VolumeBand>(large ? "200+" : "lt50");
  const [callRequested, setCallRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  // ?step=pending: demo shortcut into a gated workspace on the dashboard.
  const jump = opts.step === "pending";

  // A prospect arriving here is mid sign-up: make sure the session says so.
  useEffect(() => {
    const s = useSessionStore.getState();
    if (s.auth === "anonymous") s.verify({ email: DEMO_EMAIL, name: DEMO_NAME });
  }, []);

  useEffect(() => {
    if (!jump) return;
    let live = true;
    (async () => {
      await ensureDemoWorkspace(DEMO_LARGE_PROFILE);
      if (live) router.replace(landingRoute());
    })();
    return () => {
      live = false;
    };
  }, [jump, router]);

  const needsSales = needsStaffApproval({ teamBand: team, volumeBand: volume });
  const canContinue = name.trim().length > 1 && !busy;

  const bookCall = useCallback(() => {
    setCallRequested(true);
    toast({ title: "Call requested", description: "A Realwired specialist will email you.", tone: "success" });
  }, [toast]);

  const submit = useCallback(async () => {
    if (!name.trim()) return;
    setBusy(true);
    const profile: OrgProfile = {
      kind,
      teamBand: team,
      volumeBand: volume,
      ...(needsSales && callRequested ? { salesRequested: true } : {}),
    };
    await createWorkspace(name.trim(), profile);
    router.push(landingRoute());
  }, [name, kind, team, volume, needsSales, callRequested, router]);

  return {
    name, setName, kind, setKind, team, setTeam, volume, setVolume,
    needsSales, callRequested, bookCall, canContinue, submit, jumping: jump,
  };
}
