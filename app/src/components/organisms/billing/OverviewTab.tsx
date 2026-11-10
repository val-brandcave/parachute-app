"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Callout } from "@realwired/ui";
import { Button, CreditChip } from "@/components/atoms";
import { EmptyLine, EmptyState, GhostBars, GhostStats } from "@/components/molecules";
import { useApprovalPending } from "@/store";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { CREDIT_USD, approxValue, costFor, formatUsd, packById } from "@/lib/pricing";
import { balanceGrants, nextExpiring } from "@/lib/wallet-breakdown";
import { ActivityTable } from "./ActivityTable";
import { BalanceCard } from "./BalanceCard";
import {
  DAY,
  UsageCard,
  deltaOf,
  factsFor,
  runwayFill,
  runwayFor,
  runwayText,
  runwayWarn,
  useUsage,
  type Delta,
  type UsagePeriod,
} from "./usage";
import { DEMO_TODAY, daysUntil } from "./billing-data";
import type { Billing } from "./useBilling";

const EXPIRY_ALERT_DAYS = 30;
const longDate = (ts: number) =>
  new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const shortDate = (ts: number) => new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

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

/** The balance, how long it lasts, and the auto-reload state. */
function BalanceHero({
  b,
  showValue,
  onSettings,
  aside,
}: {
  b: Billing;
  showValue: boolean;
  onSettings?: () => void;
  aside?: React.ReactNode;
}) {
  const { all, anchor } = useUsage(b, false);
  const total = b.remaining.total;
  const full = Math.floor(total / costFor(FULL_REVIEW_TYPES));
  const run = useMemo(() => runwayFor(total, all, anchor), [total, all, anchor]);
  const s = b.settings;
  const pack = packById(s?.reloadPackId ?? "pack10");
  const low = run.days !== null && runwayWarn(run.days);
  const fill = run.days === null ? 0 : runwayFill(run.days);

  return (
    <section className="card bl-card ov-hero">
      <div className="ov-hero-top">
        <div>
          <h2 className="bl-h">Credit balance</h2>
          <div className="bl-big">
            <span className="bl-big-n">{total}</span>
            <span className="bl-big-u">
              {total === 1 ? "credit" : "credits"} ·{" "}
              {full === 0 ? "not enough for a full review" : `enough for ${full} full review${full === 1 ? "" : "s"}`}
              {showValue && ` · worth about ${approxValue(total).replace("~", "")}`}
            </span>
          </div>
        </div>
        {b.isAdmin && s && (
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

      <div className="ov-runway">
        {run.days === null ? (
          <p className="ov-run-line">
            <span>No reviews run in the last 30 days, so there is nothing to estimate yet.</span>
          </p>
        ) : (
          <>
            <div className={`ov-run-bar${low ? " is-low" : ""}`} role="img" aria-label={`Balance lasts ${runwayText(run.days)}`}>
              <i style={{ width: `${Math.max(2, Math.round(fill * 100))}%` }} />
            </div>
            <div className="ov-run-line">
              <span>
                At your last 30 days&rsquo; pace ({Math.round(run.pacePerDay * 10) / 10} credits a day), this lasts {runwayText(run.days)}.
              </span>
              <span className="ov-run-out">{run.days < 1 ? "Runs out today" : `Runs out around ${shortDate(run.runsOut!)}`}</span>
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

function Facts({ b, mine }: { b: Billing; mine: boolean }) {
  const { all, anchor } = useUsage(b, false);
  const f = useMemo(
    () => factsFor(all, b.ledger, anchor, mine ? { personId: b.me.id } : undefined),
    [all, b.ledger, anchor, mine, b.me.id],
  );
  const orgUsed = useMemo(() => factsFor(all, b.ledger, anchor).used, [all, b.ledger, anchor]);
  const share = orgUsed ? Math.round((f.used / orgUsed) * 100) : 0;
  const avgUsd = Math.round(f.avg * CREDIT_USD);
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
        d={f.reviews && f.prevReviews ? <DeltaLine d={deltaOf(f.avg, f.prevAvg)} /> : <>&nbsp;</>}
      />
      {mine ? (
        <Fact k="Your share" v={`${share}%`} small="of the organization" d={orgUsed ? `${f.used} of ${orgUsed} credits` : <>&nbsp;</>} />
      ) : (
        <Fact k="Spent, last 30 days" v={formatUsd(f.spent)} small="in top-ups" d={<DeltaLine d={deltaOf(f.spent, f.prevSpent)} />} />
      )}
    </div>
  );
}

/** Only when credits that expire within 30 days are still in the balance. */
function ExpiryAlert({ b, onBuy }: { b: Billing; onBuy?: () => void }) {
  const next = useMemo(() => nextExpiring(balanceGrants(b.ledger)), [b.ledger]);
  if (!next || next.expiresAt === null || next.expiresAt - DEMO_TODAY > EXPIRY_ALERT_DAYS * DAY) return null;
  const days = daysUntil(next.expiresAt);
  const n = next.remaining;
  return (
    <Callout
      tone="warning"
      action={
        onBuy ? (
          <Button size="sm" variant="tonal" onClick={onBuy}>
            Add credits
          </Button>
        ) : undefined
      }
    >
      <strong>
        {n} {next.source === "earned" ? "earned " : ""}credit
        {n === 1 ? "" : "s"} expire{n === 1 ? "s" : ""} on {longDate(next.expiresAt)}
      </strong>{" "}
      ({days} day{days === 1 ? "" : "s"} left). Credits that expire first are used first.
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
  const router = useRouter();
  const pending = useApprovalPending();
  // Level 1: no credit has ever moved. One block instead of a zero balance, zero facts and an empty chart.
  if (b.ledger.length === 0) {
    return (
      <div className="us bl-stack">
        <EmptyState
          title="Your balance and usage show up here"
          preview={
            <>
              <GhostStats count={3} />
              <GhostBars height={90} />
            </>
          }
          status={
            pending ? (
              <>
                <b>{b.org?.name ?? "Your organization"} is waiting for approval.</b> Credits and reviews open once it is approved.
              </>
            ) : undefined
          }
          actions={
            <Button variant="outline" iconRight="forward" onClick={() => router.push("/reviews/review-sample")}>
              Open the sample review
            </Button>
          }
        >
          Once credits are added you will see the balance, how long it lasts, and what each review used.
        </EmptyState>
      </div>
    );
  }
  return (
    <div className="us bl-stack">
      <BalanceHero b={b} showValue onSettings={onSettings} />
      <ExpiryAlert b={b} onBuy={b.openTopUp} />
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

/** Read-only for reviewers and approvers: the organization's balance and your own numbers. Credits only, no dollars. */
export function ReviewerBilling({ b, onViewAll }: { b: Billing; onViewAll: () => void }) {
  const mine = useMemo(
    () => b.rows.filter((r) => r.byId === b.me.id && (r.kind === "debit" || r.kind === "rescan" || r.kind === "refund")),
    [b.rows, b.me.id],
  );
  if (b.ledger.length === 0) {
    return (
      <div className="us bl-stack">
        <EmptyState
          title="Your organization has no credits yet"
          preview={<GhostStats count={3} />}
          actions={
            <Button iconLeft="send" onClick={b.askAdmin}>
              Ask your admin
            </Button>
          }
        >
          Only your organization admin can add credits. Once they do, the balance and the reviews you run show up here.
        </EmptyState>
      </div>
    );
  }
  return (
    <div className="us bl-stack">
      <BalanceHero
        b={b}
        showValue={false}
        aside={
          <div className="bl-ask">
            <p className="bl-body">Only your organization admin can buy credits. Ask {b.adminName}.</p>
            <div className="bl-row bl-row--tight bl-row--start">
              <Button iconLeft="send" onClick={b.askAdmin}>
                Ask your admin
              </Button>
              <span className="bl-note">We&rsquo;ll send {b.adminFirst} an email with your balance.</span>
            </div>
          </div>
        }
      />
      <ExpiryAlert b={b} />
      <Facts b={b} mine />
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
