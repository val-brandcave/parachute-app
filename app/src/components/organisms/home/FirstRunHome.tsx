"use client";

import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Callout } from "@realwired/ui";
import { PageHeader } from "@/components/templates/PageHeader";
import { useCurrentUser } from "@/lib/current-user";
import { Button } from "@/components/atoms";
import { useOrgInvites, usePrefsStore, useUsersStore, useSetupHidden, useSetupSummary } from "@/store";
import { ROLE_META } from "@/lib/member-roles";
import "@/app/bouncer/bouncer.css";
import { SetupChecklist } from "./SetupChecklist";
import { GuidesCard, RecentReviews, SampleCard, SecurityPackCard, WalletCard } from "./HomeCards";

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
