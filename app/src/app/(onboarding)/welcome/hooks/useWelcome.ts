"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@realwired/ui";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { useCurrentUser } from "@/lib/current-user";
import { TRIAL_GRANT_CREDITS, costFor, needsSalesFirst } from "@/lib/pricing";
import { loadSessionData } from "@/store/session-data";
import { useDemoStore } from "@/store/demo.store";
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

/** Demo time slots offered under "Book a call" (today is Fri 6 Nov 2026). */
export const CALL_SLOTS = ["Mon 9 Nov · 10:00", "Mon 9 Nov · 14:30", "Tue 10 Nov · 09:30"];

const DEMO_ORG_NAME = "Harbor Community Bank";
const DEMO_EMAIL = "dana.reyes@harborcb.com";
const DEMO_NAME = "Dana Reyes";
const DEMO_PROFILE: OrgProfile = { kind: "bank", teamBand: "2-10", volumeBand: "lt50" };

function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length >= 2 ? words[0][0] + words[words.length - 1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}

/* -------------------------------------------------------------- workspace */

/** Create the prospect as org_admin of a new org, sign them in, and load its data. */
async function createWorkspace(name: string, profile: OrgProfile): Promise<Org> {
  const session = useSessionStore.getState();
  const fullName = session.name || DEMO_NAME;
  const userId = `user-${generateId().slice(0, 8)}`;
  const org = await useOrgStore.getState().createOrg({
    name,
    profile,
    adminId: userId,
    approvalGate: useDemoStore.getState().approvalGate,
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
  return org;
}

/** True when the session already owns a workspace made by this flow. */
function hasWorkspace(): boolean {
  const org = useOrgStore.getState().org;
  return !!org?.profile && org.id === useSessionStore.getState().orgId;
}

/** Single-flight, so a React strict-mode double effect cannot create two orgs. */
let ensuring: Promise<void> | null = null;
function ensureDemoWorkspace(): Promise<void> {
  if (hasWorkspace()) return Promise.resolve();
  ensuring ??= createWorkspace(DEMO_ORG_NAME, DEMO_PROFILE)
    .then(() => undefined)
    .finally(() => {
      ensuring = null;
    });
  return ensuring;
}

/** The session's workspace, or null (and a redirect to /welcome) when there is none. */
export function useWorkspace() {
  const router = useRouter();
  const org = useOrgStore((s) => s.org);
  const sessionOrgId = useSessionStore((s) => s.orgId);
  const ok = !!org?.profile && org.id === sessionOrgId;
  useEffect(() => {
    if (!ok) router.replace("/welcome");
  }, [ok, router]);
  return ok ? org : null;
}

/* ------------------------------------------------------------- B1 /welcome */

export function useWelcomeSetup(opts: { preset?: string | null; step?: string | null }) {
  const router = useRouter();
  const large = opts.preset === "large";
  const [name, setName] = useState(DEMO_ORG_NAME);
  const [kind, setKind] = useState<OrgKind>("bank");
  const [team, setTeam] = useState<TeamBand>(large ? "11+" : "2-10");
  const [volume, setVolume] = useState<VolumeBand>(large ? "200+" : "lt50");
  const [busy, setBusy] = useState(false);
  const jump = opts.step === "path" || opts.step === "pending" || opts.step === "ready" ? opts.step : null;

  // A prospect arriving here is mid sign-up: make sure the session says so.
  useEffect(() => {
    const s = useSessionStore.getState();
    if (s.auth === "anonymous") s.verify({ email: DEMO_EMAIL, name: DEMO_NAME });
  }, []);

  // ?step= jumps into the middle of the flow for demos.
  useEffect(() => {
    if (!jump) return;
    let live = true;
    (async () => {
      await ensureDemoWorkspace();
      const org = useOrgStore.getState();
      if (jump === "pending") {
        await org.setFlag("approvalGate", true);
        await useOrgStore.getState().patchOrg({ approval: "pending" });
      } else if (jump === "ready") {
        await useWalletStore.getState().grantTrial();
      }
      if (live) router.replace(`/welcome/${jump}`);
    })();
    return () => {
      live = false;
    };
  }, [jump, router]);

  const canContinue = name.trim().length > 1 && !busy;
  const submit = useCallback(async () => {
    if (!name.trim()) return;
    setBusy(true);
    await createWorkspace(name.trim(), { kind, teamBand: team, volumeBand: volume });
    router.push("/welcome/path");
  }, [name, kind, team, volume, router]);

  return { name, setName, kind, setKind, team, setTeam, volume, setVolume, canContinue, submit, jumping: !!jump };
}

/* ------------------------------------------------------ B2 /welcome/path */

export function useWelcomePath() {
  const router = useRouter();
  const toast = useToast();
  const org = useWorkspace();
  const profile = org?.profile;
  const salesFirst = profile ? needsSalesFirst(profile) : false;
  const [picked, setPicked] = useState<"trial" | "sales" | null>(null);
  const [slot, setSlot] = useState<string | null>(CALL_SLOTS[1]);
  const booked = !!profile?.salesRequested;
  const choice = picked ?? (salesFirst ? "sales" : "trial");

  const bookCall = useCallback(async () => {
    await useOrgStore.getState().requestSales(slot ?? undefined);
    toast({ title: "We’ll be in touch", description: "A Realwired specialist will reach out within one business day.", tone: "success" });
    setPicked("trial");
  }, [slot, toast]);

  const startTrial = useCallback(async () => {
    const current = useOrgStore.getState().org;
    if (!current) return;
    if (current.flags?.approvalGate) {
      await useOrgStore.getState().patchOrg({ approval: "pending" });
      router.push("/welcome/pending");
      return;
    }
    await useWalletStore.getState().grantTrial();
    router.push("/welcome/ready");
  }, [router]);

  const proceed = useCallback(async () => {
    if (choice === "sales" && !booked) await bookCall();
    await startTrial();
  }, [choice, booked, bookCall, startTrial]);

  const fullReviews = Math.floor(TRIAL_GRANT_CREDITS / costFor(["technical", "administrative"]));

  return { org, salesFirst, choice, setChoice: setPicked, slot, setSlot, booked, bookCall, proceed, trialCredits: TRIAL_GRANT_CREDITS, fullReviews };
}

/* --------------------------------------------------- B3 /welcome/pending */

export function useWelcomePending() {
  const router = useRouter();
  const toast = useToast();
  const org = useWorkspace();
  const user = useCurrentUser();
  const approved = org?.approval === "approved";

  // The demo dock's "Approve" flips approval; follow it to the ready screen.
  useEffect(() => {
    if (approved) router.replace("/welcome/ready");
  }, [approved, router]);

  const talkToUs = useCallback(async () => {
    await useOrgStore.getState().requestSales();
    toast({ title: "We’ll be in touch", description: "A Realwired specialist will reach out within one business day.", tone: "success" });
  }, [toast]);

  const addCard = useCallback(() => {
    toast({ title: "Cards open with Billing", description: "Adding a card is part of the next build.", tone: "neutral" });
  }, [toast]);

  return { org, user, talkToUs, addCard, trialCredits: TRIAL_GRANT_CREDITS };
}

/* ----------------------------------------------------- B4 /welcome/ready */

export function useWelcomeReady() {
  const org = useWorkspace();
  const toast = useToast();
  const balance = useWalletStore((s) => s.ledger.reduce((sum, e) => sum + e.credits, 0));
  const addCard = useCallback(() => {
    toast({ title: "Cards open with Billing", description: "Adding a card is part of the next build.", tone: "neutral" });
  }, [toast]);
  return { org, balance, addCard, firstReportCost: costFor(["technical", "administrative"]) };
}
