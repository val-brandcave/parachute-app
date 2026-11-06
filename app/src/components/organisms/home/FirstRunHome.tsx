"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { useCurrentUser } from "@/lib/current-user";
import { Button } from "@/components/atoms";
import { usePrefsStore, useSetupHidden, useSetupSummary } from "@/store";
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
