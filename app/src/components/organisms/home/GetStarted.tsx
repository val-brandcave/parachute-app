"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Callout, CalloutAction, useToast } from "@realwired/ui";
import { useCurrentUser } from "@/lib/current-user";
import { Button, Icon } from "@/components/atoms";
import { WalletCard } from "@/components/organisms/wallet";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { TRIAL_GRANT_CREDITS, costFor } from "@/lib/pricing";
import {
  useApprovalPending,
  useOrgInvites,
  useOrgStore,
  usePrefsStore,
  useUsersStore,
  useWalletStore,
  useSetupHidden,
  useSetupSummary,
} from "@/store";
import { ROLE_META } from "@/lib/member-roles";
import "@/app/bouncer/bouncer.css";
import { AnimatePresence, motion } from "framer-motion";
import { GetStartedSkeleton } from "@/components/organisms/Skeletons";
import { SetupChecklist } from "./SetupChecklist";
import { GuidesCard, SampleCard, SecurityPackCard } from "./HomeCards";

/** G2: "<Name> accepted your invite as <role>", driven by `?joined=<inviteId>` from
 *  the Realwired Admin return link. Dismissing also clears the param. */
function JoinedCallout() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { invites } = useOrgInvites();
  const [gone, setGone] = useState<string | null>(null);
  const id = params.get("joined");
  const invite = id ? invites.find((i) => i.id === id && i.status === "accepted") : undefined;
  const users = useUsersName(invite?.acceptedUserId);
  if (!invite || gone === id) return null;
  return (
    <div className="bx-joined">
      <Callout
        tone="success"
        action={
          <Link className="bx-callout-link" href="/configure/organization?tab=members">
            View members
          </Link>
        }
        onDismiss={() => {
          setGone(id);
          router.replace(pathname);
        }}
      >
        <strong>{users ?? invite.inviteeName ?? invite.email}</strong> accepted your invite as{" "}
        {ROLE_META[invite.role].label.toLowerCase()}
      </Callout>
    </div>
  );
}

function useUsersName(userId?: string): string | undefined {
  return useUsersStore((s) => s.allUsers.find((u) => u.id === userId)?.name);
}

const SAMPLE_HREF = "/reviews/review-sample";

/** One-time arrival banner for an organization created in this session: the
 *  trial credits landed and the sample is open. Seeded personas never see it,
 *  and nobody sees it again once dismissed. */
function WelcomeCallout() {
  const router = useRouter();
  const me = useCurrentUser();
  const org = useOrgStore((s) => s.org);
  const ledger = useWalletStore((s) => s.ledger);
  const pending = useApprovalPending();
  const dismissed = usePrefsStore((s) => !!s.welcomeDismissedBy[me.id]);
  const grant = ledger.find((e) => e.kind === "trial_grant");
  if (!org || !grant || pending || dismissed || !org.flags?.welcomeBanner) return null;
  const dismiss = () => usePrefsStore.getState().dismissWelcome(me.id);
  const reviews = Math.floor(grant.credits / costFor(FULL_REVIEW_TYPES));
  return (
    <div className="hm-banner">
      <Callout
        tone="success"
        action={
          <Button
            variant="tonal"
            size="sm"
            iconRight="forward"
            onClick={() => {
              dismiss();
              router.push(SAMPLE_HREF);
            }}
          >
            Open the sample review
          </Button>
        }
        onDismiss={dismiss}
      >
        <span className="hm-banner-body">
          <strong>{org.name} is ready</strong>
          <span>
            {grant.credits} trial credits added, about {reviews} full review{reviews === 1 ? "" : "s"}. No card needed.
          </span>
        </span>
      </Callout>
    </div>
  );
}

/** Sales-flagged orgs wait here for Realwired to confirm them. The sample and
 *  the setup steps stay open; Start a review and the trial credits do not. */
function PendingCallout() {
  const router = useRouter();
  const me = useCurrentUser();
  const org = useOrgStore((s) => s.org);
  const requestSales = useOrgStore((s) => s.requestSales);
  const toast = useToast();
  const pending = useApprovalPending();
  if (!pending || !org) return null;
  const requested = !!org.profile?.salesRequested;
  const bookCall = async () => {
    await requestSales();
    toast({ title: "Call requested", description: "We will email you to find a time.", tone: "success" });
  };
  return (
    <div className="hm-banner">
      <Callout
        tone="warning"
        action={
          <Button variant="tonal" size="sm" iconRight="forward" onClick={() => router.push(SAMPLE_HREF)}>
            Open the sample review
          </Button>
        }
      >
        <span className="hm-banner-body">
          <strong>Realwired is confirming {org.name}</strong>
          <span>
            Usually within one business day. We&apos;ll email {me.email} when your {TRIAL_GRANT_CREDITS} trial credits
            arrive.{" "}
            {requested ? <>Call requested.</> : <CalloutAction onClick={bookCall}>Book a call</CalloutAction>}
          </span>
        </span>
      </Callout>
    </div>
  );
}

/** Shown once every step is done (or the guide was dismissed org-wide). */
function DoneCard() {
  const router = useRouter();
  return (
    <section className="card hm-card gs-done">
      <span className="gs-done-ic" aria-hidden="true">
        <Icon name="check-circle" size={22} />
      </span>
      <div className="gs-done-body">
        <h2 className="hm-h">You&apos;re set up</h2>
        <p className="hm-p">Every step is done. Get started leaves the sidebar, and your reviews live on the Dashboard.</p>
      </div>
      <Button variant="primary" size="sm" iconRight="forward" onClick={() => router.push("/dashboard")}>
        Go to Dashboard
      </Button>
    </section>
  );
}

/** The Get started page body: the setup checklist as the main column, the sample,
 *  wallet, IT pack and guides alongside. Self-serve orgs only; everyone else, and
 *  anyone who hid the guide, goes to the Dashboard. */
export function GetStarted() {
  const router = useRouter();
  const billing = useOrgStore((s) => s.org?.billing);
  const hidden = useSetupHidden();
  const { ready, allDone } = useSetupSummary();
  const selfServe = billing === "trial" || billing === "payg";
  const away = (!!billing && !selfServe) || hidden;

  useEffect(() => {
    if (away) router.replace("/dashboard");
  }, [away, router]);

  // Same feel as Dashboard and Reviews: a short skeleton while "loading".
  const [minDone, setMinDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 700);
    return () => clearTimeout(t);
  }, []);
  const loading = !ready || !minDone;

  if (away) return null;

  return (
    <div className="pagebody">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <GetStartedSkeleton />
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <PendingCallout />
      <WelcomeCallout />
      <Suspense fallback={null}>
        <JoinedCallout />
      </Suspense>
      <div className="home-grid">
        <div className="home-main">{allDone ? <DoneCard /> : <SetupChecklist />}</div>
        <div className="home-side">
          <SampleCard />
          {/* Once setup is done the wallet lives on Billing; keep what still helps. */}
          {!allDone && <WalletCard />}
          {!allDone && <SecurityPackCard />}
          <GuidesCard />
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
