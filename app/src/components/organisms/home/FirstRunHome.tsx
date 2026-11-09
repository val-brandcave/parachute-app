"use client";

import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Callout, CalloutAction, useToast } from "@realwired/ui";
import { PageHeader } from "@/components/templates/PageHeader";
import { useCurrentUser } from "@/lib/current-user";
import { Button } from "@/components/atoms";
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
import { SetupChecklist } from "./SetupChecklist";
import { GuidesCard, RecentReviews, SampleCard, SecurityPackCard } from "./HomeCards";

/** "Getting set up · 4 of 8" with a segmented progress bar. */
export function SetupMeta() {
  const { doneCount, total } = useSetupSummary();
  return (
    <div className="setupmeta" aria-label={`Getting set up, ${doneCount} of ${total} steps done`}>
      <span>
        Getting set up · <b>{doneCount} of {total}</b>
      </span>
      <span className="segbar" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i < doneCount ? "is-on" : undefined} />
        ))}
      </span>
    </div>
  );
}

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

/** First-run Home: the setup checklist is the empty state (C1 / C2). `stats`
 *  (StatBar + trend) is only passed once the org has enough completed reviews. */
export function FirstRunHome({ stats }: { stats?: ReactNode }) {
  const me = useCurrentUser();
  const { steps } = useSetupSummary();
  const hidden = useSetupHidden();
  const returning = steps.some((s) => s.done);
  return (
    <>
      <PageHeader
        title={`${returning ? "Welcome back" : "Welcome"}, ${me.firstName}.`}
        actions={<SetupMeta />}
      />
      <div className="pagebody">
        <PendingCallout />
        <WelcomeCallout />
        <Suspense fallback={null}>
          <JoinedCallout />
        </Suspense>
        {stats}
        <div className="home-grid">
          <div className="home-main">
            {hidden ? (
              <section className="card hm-card su-hidden">
                <div>
                  <h2 className="hm-h">Setup guide hidden</h2>
                  <p className="hm-p">It stays hidden for you only. Your team still sees it.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => usePrefsStore.getState().setSetupHidden(me.id, false)}
                >
                  Show setup guide
                </Button>
              </section>
            ) : (
              <SetupChecklist />
            )}
            <RecentReviews />
          </div>
          <div className="home-side">
            <SampleCard />
            <WalletCard />
            <SecurityPackCard />
            <GuidesCard />
          </div>
        </div>
      </div>
    </>
  );
}
