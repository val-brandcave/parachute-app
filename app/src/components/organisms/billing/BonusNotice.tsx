"use client";

import Link from "next/link";
import { Button, Icon } from "@/components/atoms";
import { CREDIT_PACKS, formatUsd } from "@/lib/pricing";
import { stepDef } from "@/lib/setup-steps";
import { useSetupSummary, useWalletStore, useWalletView } from "@/store";
import "./billing-states.css";
import { TalkToUs } from "./TalkToUs";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const monthDay = (ts: number) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/**
 * The setup bonus, as a notice (spec §5.8 "Bonus ending / closed"; also mounted on the Dashboard).
 * Open: how many free reviews are left to earn and the days left. Ending: the next section to
 * finish, with its button. Closed: what was earned, and the way to add more. Renders nothing when
 * there is nothing to say (no window yet, or every bonus earned).
 */
export function BonusNotice({ className }: { className?: string }) {
  const { earn, sections } = useSetupSummary();
  const wallet = useWalletView();
  if (!earn.window || wallet.held) return null;

  const rewards = sections.filter((s) => s.reward > 0);
  const earned = rewards.filter((s) => s.awarded).length;
  const next = rewards.find((s) => !s.awarded);
  const { daysLeft, endsAt, state } = earn.window;

  if (state === "closed") {
    if (!next) return null;
    const pack = CREDIT_PACKS[0];
    const stays = wallet.bySource.trial + wallet.bySource.earned;
    return (
      <Notice
        className={className}
        title="The bonus window has closed"
        actions={
          <>
            <TalkToUs>Talk to us about invoicing</TalkToUs>
            <Button size="sm" variant="outline" iconLeft="add" onClick={() => useWalletStore.getState().openTopUp({ reason: "manual" })}>
              Add credits
            </Button>
          </>
        }
      >
        {earned > 0 ? `You earned ${plural(earned, "bonus full review", "bonus full reviews")}. ` : "No bonus reviews were earned. "}
        {stays > 0 ? `Your ${stays} trial and earned credits are still yours and never expire. ` : ""}
        When you need more, packs start at {pack.credits} credits for {formatUsd(pack.priceUsd)}.
      </Notice>
    );
  }

  if (!next) return null;

  if (state === "ending") {
    const step = next.primaryId ? stepDef(next.primaryId) : undefined;
    return (
      <Notice
        className={className}
        title={`${plural(daysLeft, "day", "days")} left to earn your bonus reviews`}
        actions={
          <Link href={step?.action?.href ?? "/get-started"} className="ui-btn ui-btn--sm ui-btn--primary">
            {step?.action?.label ?? "Open Get started"}
          </Link>
        }
      >
        {earned > 0 ? `You've earned ${earned} of ${rewards.length} bonus full reviews. ` : ""}
        Finish &ldquo;{next.title}&rdquo; before {monthDay(endsAt)} to earn {earned > 0 ? "the other one" : "a bonus full review"}. Your trial
        credits stay either way.
      </Notice>
    );
  }

  const left = earn.reviewsLeftToEarn;
  return (
    <Notice
      className={className}
      title={`Earn ${plural(left, "more full review", "more full reviews")} by finishing setup`}
      actions={
        <Link href="/get-started" className="ui-btn ui-btn--sm ui-btn--outline">
          Open Get started
        </Link>
      }
    >
      {plural(daysLeft, "day", "days")} left to complete the tasks on Get started.
    </Notice>
  );
}

function Notice({
  title,
  children,
  actions,
  className,
}: {
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card bl-bonus${className ? ` ${className}` : ""}`} aria-label="Setup bonus">
      <span className="bl-bonus-ic" aria-hidden="true">
        <Icon name="gift" size={20} />
      </span>
      <div className="bl-bonus-main">
        <h2 className="bl-h">{title}</h2>
        <p className="bl-body tw-pretty">{children}</p>
      </div>
      <div className="bl-bonus-act">{actions}</div>
    </section>
  );
}
