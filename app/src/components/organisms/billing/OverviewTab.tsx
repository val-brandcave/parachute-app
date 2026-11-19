"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Callout, useToast } from "@realwired/ui";
import { Button, CreditChip, Icon, Illustration } from "@/components/atoms";
import { useCreditRequestStore, usePrefsStore } from "@/store";
import { isLive } from "@/lib/credit-requests";
import { EmptyLine } from "@/components/molecules";
import { BillingEmptyCard } from "./BillingEmptyCard";
import { usageByPerson } from "@/lib/wallet-view";
import { AUTO_RELOAD_DEFAULTS, CREDIT_USD, approxValue, costFor, formatUsd, packById } from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { nextExpiring } from "@/lib/wallet-breakdown";
import { ActivityTable } from "./ActivityTable";
import { AutoReloadOffer } from "./AutoReloadOffer";
import { BalanceCard } from "./BalanceCard";
import { BonusNotice } from "./BonusNotice";
import { RequestCreditsDialog } from "./RequestCreditsDialog";
import { PendingTracker, type PendingTrackerStep } from "@/components/organisms/home/PendingTracker";
import {
  DAY,
  UsageCard,
  deltaOf,
  factsFor,
  runwayFill,
  runwayText,
  useUsage,
  type Delta,
  type UsagePeriod,
} from "./usage";
import { daysUntil } from "./billing-data";
import "./billing-states.css";
import type { Billing } from "./useBilling";

const EXPIRY_ALERT_DAYS = 30;
const FULL_COST = costFor(FULL_REVIEW_TYPES);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const dayLong = (ts: number) => new Date(ts).toLocaleDateString("en-US", { weekday: "long" });
const dayShort = (ts: number) => new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const monthDay = (ts: number) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const monthDayYear = (ts: number) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const timeOf = (ts: number) => new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function DeltaLine({ d }: { d: Delta }) {
  if (d.pct === null) return <>&nbsp;</>;
  const sign = d.pct > 0 ? "+" : d.pct < 0 ? "−" : "";
  return (
    <>
      {sign}
      {Math.abs(d.pct)}% vs previous 30 days
    </>
  );
}

/** Pending approval: the credits are held, so the hero is the tracker, not a number. Add credits is locked in the band. */
function HeldHero({ b }: { b: Billing }) {
  const at = b.org?.profile?.callBookedAt;
  const steps: PendingTrackerStep[] = [
    { label: "Signed up", date: b.org?.createdAt ? monthDay(b.org.createdAt) : undefined, state: "done" },
    at !== undefined
      ? { label: "Call booked", date: `${monthDay(at)}, ${timeOf(at)}`, state: "current" }
      : { label: "Book your setup call", state: "current" },
    { label: "Confirmed", date: "Usually same day", state: "todo" },
  ];
  return (
    <section className="card bl-card ov-hero ov-held" aria-labelledby="ov-held-t" data-tour="billing-balance">
      <div className="ov-hero-top">
        <div>
          <h2 className="bl-h" id="ov-held-t">
            On hold
          </h2>
          <p className="bl-body tw-pretty ov-lead">
            <b>{b.org?.name ?? "Your organization"} is waiting for approval.</b> Your trial credits are held until Realwired confirms your account.
            Reviews that are already uploaded wait with them.
          </p>
        </div>
        <Illustration name="09b-approval-pending" size={120} />
      </div>
      <div className="ov-runway">
        <PendingTracker steps={steps} />
      </div>
    </section>
  );
}

/** The balance, how long it lasts, and the auto-reload state. Amber only when low, red only at zero. */
function BalanceHero({
  b,
  showValue,
  onSettings,
  aside,
  offerBeside,
}: {
  b: Billing;
  showValue: boolean;
  onSettings?: () => void;
  aside?: React.ReactNode;
  /** The AutoReloadOffer card sits beside the hero, so the hero drops its own auto-reload chip. */
  offerBeside?: boolean;
}) {
  const w = b.wallet;
  const total = w.balance;
  const full = w.fullReviews;
  const tone = w.lowTone;
  const days = w.runwayDays;
  const s = b.settings;
  const pack = packById(s?.reloadPackId ?? AUTO_RELOAD_DEFAULTS.packId);
  const fill = tone === "zero" ? 0 : days === null ? 0 : runwayFill(days);
  const weekly = days !== null && days > 0 ? Math.round(w.pacePerWeek) : null;
  const onlyTrial = total > 0 && w.bySource.trial === total;
  const unit = total === 1 ? "credit" : "credits";

  return (
    <section className={`card bl-card ov-hero is-${tone}`} data-tour="billing-balance">
      <div className="ov-hero-top">
        <div>
          <h2 className="bl-h">{b.isAdmin ? "Credit balance" : "Team balance"}</h2>
          <div className="bl-big">
            <span className="bl-big-n">{total}</span>
            <span className="bl-big-u">{onlyTrial ? `trial ${unit}` : unit}</span>
            {tone === "low" && <CreditChip tone="low">Running low</CreditChip>}
            {tone === "zero" && <CreditChip tone="zero">Out of credits</CreditChip>}
          </div>
          <p className="bl-body tw-pretty ov-lead">
            {tone === "zero" ? (
              "New reviews can’t start. Reviews already running finish normally."
            ) : (
              <>
                {full === 0 ? "Not enough for a full review." : `Enough for ${plural(full, "full review", "full reviews")}.`}
                {showValue && ` About ${approxValue(total).replace("~", "")} at list price.`}
                {tone === "low" && weekly !== null && w.runsOutOn !== null && (
                  <>
                    {" "}
                    At your pace of about {plural(weekly, "credit", "credits")} a week, this runs out on <b>{dayLong(w.runsOutOn)}</b>.
                  </>
                )}
                {onlyTrial && " Trial credits never expire, so there’s no clock on using them."}
                {!b.isAdmin && ` Shared by everyone at ${b.org?.name ?? "your organization"}. ${b.adminName} manages billing.`}
              </>
            )}
          </p>
        </div>
        {tone === "zero" && <Illustration name="01b-credits" size={120} />}
        {b.isAdmin && s && !offerBeside && tone !== "zero" && (
          <div className="bl-row bl-row--tight">
            {s.autoReload ? (
              <CreditChip tone="free">
                Auto-reload on · {pack.credits} credits below {s.reloadBelow}
              </CreditChip>
            ) : (
              <CreditChip tone="money">Auto-reload off</CreditChip>
            )}
            {onSettings && (
              <Button variant="ghost" size="sm" onClick={onSettings}>
                {s.autoReload ? "Change" : "Turn on"}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="ov-runway" data-tour="billing-runway">
        {tone === "zero" ? (
          <div className="ov-run-bar is-zero" role="img" aria-label="No credits left">
            <i style={{ width: "2%" }} />
          </div>
        ) : days === null ? (
          <p className="ov-run-line">
            <span>No reviews run in the last 30 days, so there is nothing to estimate yet.</span>
          </p>
        ) : (
          <>
            <div className={`ov-run-bar${tone === "low" ? " is-low" : ""}`} role="img" aria-label={`Balance lasts ${runwayText(days)}`}>
              <i style={{ width: `${Math.max(2, Math.round(fill * 100))}%` }} />
            </div>
            <div className="ov-run-line">
              <span>At the last 30 days&rsquo; pace, this lasts {runwayText(days)}.</span>
              <span className="ov-run-out">Runs out {dayShort(w.runsOutOn!)}</span>
            </div>
          </>
        )}
      </div>
      {aside}
    </section>
  );
}

function Fact({ k, v, small, d }: { k: string; v: React.ReactNode; small?: React.ReactNode; d: React.ReactNode }) {
  return (
    <section className="card ov-fact">
      <span className="ov-fact-k">{k}</span>
      <span className="ov-fact-v">
        {v}
        {small && <small>{small}</small>}
      </span>
      <span className="ov-fact-d">{d}</span>
    </section>
  );
}

const NBSP = <>&nbsp;</>;

function Facts({ b, mine }: { b: Billing; mine: boolean }) {
  const { all, anchor } = useUsage(b, false);
  const f = useMemo(
    () => factsFor(all, b.ledger, anchor, mine ? { personId: b.me.id } : undefined),
    [all, b.ledger, anchor, mine, b.me.id],
  );
  const orgUsed = useMemo(() => factsFor(all, b.ledger, anchor).used, [all, b.ledger, anchor]);
  const share = orgUsed ? Math.round((f.used / orgUsed) * 100) : 0;
  const avgUsd = Math.round(f.avg * CREDIT_USD);
  const w = b.wallet;
  const autoReload = b.settings?.autoReload ? "On" : "Off";

  if (!mine && w.lowTone === "low") {
    const weekly = w.runwayDays !== null && w.runwayDays > 0 ? Math.round(w.pacePerWeek) : null;
    return (
      <div className="ov-facts">
        <Fact k="Used this month" v={w.usedThisMonth} d={NBSP} />
        <Fact k="Weekly pace" v={weekly === null ? "–" : `~${weekly}`} small="credits" d={NBSP} />
        <Fact k="Runs out" v={w.runsOutOn === null ? "–" : <span className="ov-warn">{dayShort(w.runsOutOn)}</span>} d={NBSP} />
        <Fact k="Auto-reload" v={autoReload} d={NBSP} />
      </div>
    );
  }
  if (!mine && w.lowTone === "zero") {
    const last = w.lastDebitAt ?? 0;
    const sameDay = last > 0 && new Date(last).toDateString() === new Date(b.now).toDateString();
    const waiting = b.reviews.filter((r) => r.status === "intake" && !r.sample).length;
    return (
      <div className="ov-facts">
        <Fact k="Used this month" v={w.usedThisMonth} d={NBSP} />
        <Fact
          k="Ran out"
          v={last === 0 ? "–" : <span className="ov-bad">{sameDay ? `Today, ${timeOf(last)}` : `${monthDay(last)}, ${timeOf(last)}`}</span>}
          d={NBSP}
        />
        <Fact k="Waiting to start" v={waiting} small={waiting === 1 ? "report" : "reports"} d={NBSP} />
        <Fact k="Auto-reload" v={autoReload} d={NBSP} />
      </div>
    );
  }
  return (
    <div className="ov-facts">
      <Fact
        k={mine ? "Used by you, last 30 days" : "Used, last 30 days"}
        v={f.used}
        small={f.used === 1 ? "credit" : "credits"}
        d={<DeltaLine d={deltaOf(f.used, f.prevUsed)} />}
      />
      <Fact k={mine ? "Reviews you ran" : "Reviews run"} v={f.reviews} d={<DeltaLine d={deltaOf(f.reviews, f.prevReviews)} />} />
      <Fact
        k="Average per review"
        v={f.reviews ? (Math.round(f.avg * 10) / 10).toString() : "0"}
        small={b.isAdmin && f.reviews ? `credits · ~${formatUsd(avgUsd)}` : "credits"}
        d={f.reviews && f.prevReviews ? <DeltaLine d={deltaOf(f.avg, f.prevAvg)} /> : NBSP}
      />
      {mine ? (
        <Fact k="Your share" v={`${share}%`} small="of the organization" d={orgUsed ? `${f.used} of ${orgUsed} credits` : NBSP} />
      ) : (
        <Fact k="Spent, last 30 days" v={formatUsd(f.spent)} small="in top-ups" d={<DeltaLine d={deltaOf(f.spent, f.prevSpent)} />} />
      )}
    </div>
  );
}

/** Reviewer facts (§5.8): what you used, what the team used, when it runs out, who to ask. */
function ReviewerFacts({ b }: { b: Billing }) {
  const w = b.wallet;
  const mine = useMemo(() => {
    const d = new Date(b.now);
    const span = { from: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), to: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() };
    return usageByPerson(b.ledger, span).find((r) => r.userId === b.me.id)?.credits ?? 0;
  }, [b.ledger, b.me.id, b.now]);
  return (
    <div className="ov-facts">
      <Fact k="You used this month" v={mine} small={mine === 1 ? "credit" : "credits"} d={NBSP} />
      <Fact k="Team used this month" v={w.usedThisMonth} small={w.usedThisMonth === 1 ? "credit" : "credits"} d={NBSP} />
      <Fact
        k="Runs out"
        v={w.runsOutOn === null ? "–" : <span className={w.lowTone === "ok" ? undefined : w.lowTone === "zero" ? "ov-bad" : "ov-warn"}>About {dayLong(w.runsOutOn)}</span>}
        d={NBSP}
      />
      <Fact k="Admin" v={<span className="ov-fact-name">{b.adminName}</span>} d={NBSP} />
    </div>
  );
}

/** Only when credits that expire within 30 days are still in the balance. Spending them is the point, so the action is Start. */
function ExpiryAlert({ b }: { b: Billing }) {
  const next = useMemo(() => nextExpiring(b.wallet.grants), [b.wallet.grants]);
  if (!next || next.expiresAt === null || next.expiresAt - b.now > EXPIRY_ALERT_DAYS * DAY) return null;
  const days = daysUntil(next.expiresAt, b.now);
  const n = next.remaining;
  const reviews = Math.ceil(n / FULL_COST);
  const pack = next.entry.packId ? packById(next.entry.packId) : null;
  return (
    <Callout
      tone="warning"
      action={
        <Link href="/launchpad" className="ui-btn ui-btn--sm ui-btn--tonal">
          Start a review
        </Link>
      }
    >
      <strong>
        {plural(n, "credit", "credits")} {n === 1 ? "expires" : "expire"} in {plural(days, "day", "days")}, on {monthDay(next.expiresAt)}.
      </strong>{" "}
      {pack ? `They’re from the ${pack.credits}-credit pack bought ${monthDayYear(next.entry.createdAt)}. ` : ""}We use credits that expire soonest
      first, so {plural(reviews, "full review", "full reviews")}
      {days <= 7 ? " this week" : ""} use{reviews === 1 ? "s" : ""} {n === 1 ? "it" : "them"} up.
    </Callout>
  );
}

/** Overview: balance and runway, expiry alert, four facts, a compact chart, what is in the balance, recent activity. */
export function OverviewTab({
  b,
  onViewAll,
  onUsage,
  onSettings,
}: {
  b: Billing;
  onViewAll: () => void;
  onUsage: () => void;
  onSettings: () => void;
}) {
  const { lines, anchor } = useUsage(b, false);
  const [period, setPeriod] = useState<UsagePeriod>("30d");
  if (b.wallet.held) {
    return (
      <div className="us bl-stack">
        <HeldHero b={b} />
      </div>
    );
  }
  // Level 1: no credit has ever moved. One block instead of a zero balance, zero facts and an empty chart.
  if (b.ledger.length === 0) {
    return (
      <div className="us bl-stack">
        <BillingEmptyCard
          title="Your balance and usage show up here"
          ill="02b-wallet-top-up"
          action={
            b.isAdmin ? (
              <Button iconLeft="add" onClick={b.openTopUp}>
                Add credits
              </Button>
            ) : undefined
          }
        >
          Once credits are added you will see the balance, how long it lasts, and what each review used.
        </BillingEmptyCard>
      </div>
    );
  }
  const offer = b.wallet.lowTone === "low" && !b.settings?.autoReload;
  const hero = <BalanceHero b={b} showValue onSettings={onSettings} offerBeside={offer} />;
  return (
    <div className="us bl-stack">
      {offer ? (
        <div className="ov-split">
          {hero}
          <AutoReloadOffer b={b} onSettings={onSettings} />
        </div>
      ) : (
        hero
      )}
      <ExpiryAlert b={b} />
      <BonusNotice />
      <Facts b={b} mine={false} />
      <UsageCard
        compact
        lines={lines}
        anchor={anchor}
        userName={b.userName}
        unit="credits"
        period={period}
        onPeriod={setPeriod}
        by="type"
        onBy={() => {}}
        view="daily"
        onView={() => {}}
        byOptions={["type"]}
        scopeNote="By review type"
        action={
          <Button variant="ghost" size="sm" onClick={onUsage}>
            See usage
          </Button>
        }
      />
      <BalanceCard b={b} />
      {b.rows.length > 0 && (
        <>
          <div className="bl-row bl-sechead">
            <h2 className="bl-section">Recent activity</h2>
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View all
            </Button>
          </div>
          <ActivityTable
            rows={b.rows}
            limit={5}
            onReceipt={b.openReceipt}
            footer={b.rows.length > 5 ? `Showing the latest 5 of ${b.rows.length} movements.` : undefined}
          />
        </>
      )}
    </div>
  );
}

/** "just now", "2 h ago", "yesterday", else "Nov 9". Pure: `now` is passed in. */
function agoText(at: number, now: number): string {
  const mins = Math.floor((now - at) / 60_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  if (hours < 48) return "yesterday";
  return monthDay(at);
}

/**
 * Reviewer credit request (spec §5.9): a one-line explanation and a CTA that opens
 * `RequestCreditsDialog` (amount + note), then the tracker. One live request per
 * requester; while one is open the CTA is not offered. Resolved requests read back as
 * "Credits added" (plus a toast the first time) or "<Admin> closed your request" with Ask again.
 */
function RequestAsk({ b }: { b: Billing }) {
  const toast = useToast();
  const requests = useCreditRequestStore((s) => s.requests);
  const [now] = useState(() => Date.now());
  const [open, setOpen] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const orgId = b.org?.id;
  const last = useMemo(
    () =>
      requests
        .filter((r) => r.requesterId === b.me.id && r.orgId === orgId)
        .sort((x, y) => y.createdAt - x.createdAt)[0],
    [requests, b.me.id, orgId],
  );
  const live = !!last && isLive(last);
  const resolved = last && !live && last.status !== "cancelled" ? last : undefined;

  // The "Credits added" toast fires once per fulfilled request, remembered in this browser (prefs).
  useEffect(() => {
    if (!last || last.status !== "fulfilled") return;
    if (!usePrefsStore.getState().markRequestSeen(b.me.id, last.id, last.resolvedAt ?? 1)) return;
    toast({ title: "Credits added", description: `${b.adminFirst} added credits to ${b.org?.name ?? "your organization"}.`, tone: "success" });
  }, [last, toast, b.me.id, b.adminFirst, b.org?.name]);

  const send = async ({ credits, note }: { credits: number; note: string }) => {
    const made = await useCreditRequestStore.getState().request({ credits, note });
    if (!made) return false;
    toast({ title: `Request sent to ${b.adminFirst}`, description: "You'll see it here until it's answered.", tone: "success" });
    return true;
  };
  const remind = async () => {
    if (!last) return;
    await useCreditRequestStore.getState().remind(last.id);
    toast({ title: `We reminded ${b.adminFirst}`, tone: "success" });
  };
  const cancel = async () => {
    if (!last) return;
    await useCreditRequestStore.getState().cancel(last.id);
  };

  const dialog = (
    <RequestCreditsDialog
      open={open}
      onClose={() => setOpen(false)}
      adminFirst={b.adminFirst}
      balance={b.wallet.balance}
      fullCost={FULL_COST}
      onSend={send}
      // Cancel returns to the CTA; after a send the CTA is gone, so focus lands on the tracker.
      returnFocus={() => ctaRef.current?.querySelector<HTMLElement>("button") ?? statusRef.current}
    />
  );

  if (live && last) {
    return (
      <>
        <div className="bl-ask rq" role="status" ref={statusRef} tabIndex={-1}>
          <p className="bl-body rq-title">
            <Icon name="hourglass-high" size={16} /> You asked {b.adminName}
            {last.credits ? ` for ${plural(last.credits, "credit", "credits")}` : ""} {agoText(last.createdAt, now)}
          </p>
          {last.note && <p className="rq-quote">&ldquo;{last.note}&rdquo;</p>}
          <p className="bl-note">
            {last.status === "opened" ? `${b.adminFirst} has seen your request.` : `${b.adminFirst} has not opened it yet.`}
            {last.remindedAt ? ` You reminded ${b.adminFirst} ${agoText(last.remindedAt, now)}.` : ""}
          </p>
          <div className="bl-row bl-row--tight bl-row--start rq-actions">
            {!last.remindedAt && (
              <Button variant="outline" size="sm" iconLeft="send" onClick={remind}>
                Remind {b.adminFirst}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={cancel}>
              Cancel request
            </Button>
          </div>
        </div>
        {dialog}
      </>
    );
  }

  return (
    <>
      <div className="bl-ask rq" ref={statusRef} tabIndex={-1}>
        {resolved && resolved.status === "fulfilled" && (
          <p className="bl-body rq-title rq-title--ok" role="status">
            <Icon name="check-circle" size={16} /> Credits added
            <span className="rq-when">{resolved.resolvedAt ? agoText(resolved.resolvedAt, now) : ""}</span>
          </p>
        )}
        {resolved && resolved.status === "dismissed" && (
          <p className="bl-body rq-title" role="status">
            <Icon name="info" size={16} /> {b.adminFirst} closed your request
            <span className="rq-when">{resolved.resolvedAt ? agoText(resolved.resolvedAt, now) : ""}</span>
          </p>
        )}
        {!resolved && <p className="bl-body">Only your organization admin can buy credits.</p>}
        <div className="bl-row bl-row--tight bl-row--start" ref={ctaRef}>
          <Button
            variant={resolved ? "outline" : "primary"}
            size={resolved ? "sm" : "md"}
            iconLeft="send"
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            {resolved ? (resolved.status === "dismissed" ? "Ask again" : "Ask for more") : `Ask ${b.adminFirst} for credits`}
          </Button>
        </div>
      </div>
      {dialog}
    </>
  );
}

/** Read-only for reviewers and approvers: the organization's balance and your own numbers. Credits only, no dollars. */
export function ReviewerBilling({ b, onViewAll }: { b: Billing; onViewAll: () => void }) {
  const mine = useMemo(
    () => b.rows.filter((r) => r.byId === b.me.id && (r.kind === "debit" || r.kind === "rescan" || r.kind === "refund")),
    [b.rows, b.me.id],
  );
  if (b.ledger.length === 0) {
    return (
      <div className="us bl-stack">
        <BillingEmptyCard title="Your organization has no credits yet" ill="02b-wallet-top-up">
          Only your organization admin can add credits. Once they do, the balance and the reviews you run show up here.
        </BillingEmptyCard>
        <RequestAsk b={b} />
      </div>
    );
  }
  return (
    <div className="us bl-stack">
      <BalanceHero
        b={b}
        showValue={false}
        aside={<RequestAsk b={b} />}
      />
      <ExpiryAlert b={b} />
      <ReviewerFacts b={b} />
      <BalanceCard b={b} showValue={false} />
      <div className="bl-row bl-sechead">
        <h2 className="bl-section">Your recent activity</h2>
        {mine.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
          </Button>
        )}
      </div>
      {mine.length === 0 ? (
        <div className="card">
          <EmptyLine>You have not run a review yet. The ones you run will be listed here.</EmptyLine>
        </div>
      ) : (
        <ActivityTable
          rows={mine}
          limit={5}
          showAmounts={false}
          footer={mine.length > 5 ? `Showing your latest 5 of ${mine.length}.` : undefined}
        />
      )}
    </div>
  );
}
