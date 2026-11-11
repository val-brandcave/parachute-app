"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, CreditChip, Icon, Illustration, type IconName } from "@/components/atoms";
import { useCurrentOrg, useCurrentUser } from "@/lib/current-user";
import { INVOICED_CREDIT_USD, REVIEW_TYPE_COST, TRIAL_GRANT_CREDITS, costFor, formatUsd } from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { usageByPerson, type WalletView } from "@/lib/wallet-view";
import { useSetupSummary, useUsersStore, useWalletStore } from "@/store";
import type { BillingModel, UserRole } from "@/types";
import "./credits-chrome.css";

const DAY = 86_400_000;
const FULL_COST = costFor(FULL_REVIEW_TYPES);
const SINGLE_COST = REVIEW_TYPE_COST.technical;

const credits = (n: number) => `${n} credit${n === 1 ? "" : "s"}`;
const reviews = (n: number) => `${n} full review${n === 1 ? "" : "s"}`;

/** "about 2 weeks" from a runway in days. */
function runwayPhrase(days: number): string {
  if (days < 7) {
    const d = Math.max(1, Math.round(days));
    return `about ${d} day${d === 1 ? "" : "s"}`;
  }
  if (days < 56) {
    const w = Math.round(days / 7);
    return `about ${w} week${w === 1 ? "" : "s"}`;
  }
  const m = Math.round(days / 30);
  return `about ${m} month${m === 1 ? "" : "s"}`;
}

/** "Thursday" inside the coming week, else "Nov 24". */
function runsOutPhrase(at: number, now: number): string {
  const d = new Date(at);
  return at - now < 7 * DAY
    ? d.toLocaleDateString("en-US", { weekday: "long" })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Header credits popover content (spec §5.3, board 1 #credits-popover). One body per state:
 * healthy / low / zero, held, invoiced, and the non-admin variants (Reviewer and Approver ask
 * the admin instead of buying). Numbers come from the one wallet view; nothing here sums credits.
 * T4.4 adds the request card.
 */
export function CreditsPopover({
  view,
  role,
  billing,
  onClose,
}: {
  view: WalletView;
  role: UserRole;
  billing: BillingModel;
  onClose: () => void;
}) {
  const router = useRouter();
  const me = useCurrentUser();
  const { org, name: orgName } = useCurrentOrg();
  const ledger = useWalletStore((s) => s.ledger);
  const earn = useSetupSummary().earn;
  const users = useUsersStore((s) => s.allUsers);
  const [now] = useState(() => Date.now());
  const [asked, setAsked] = useState(false);

  const isAdmin = role === "org_admin";
  const admin =
    users.find((u) => u.id === org?.billingContactId) ??
    users.find((u) => u.orgId === org?.id && u.role === "org_admin");
  const adminFirst = admin?.name.split(" ")[0] ?? "your admin";

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const month = new Date(now);
  const mine =
    usageByPerson(ledger, {
      from: new Date(month.getFullYear(), month.getMonth(), 1).getTime(),
      to: new Date(month.getFullYear(), month.getMonth() + 1, 1).getTime(),
    }).find((r) => r.userId === me.id)?.credits ?? 0;

  const askButton = (
    <Button variant="primary" size="sm" onClick={() => setAsked(true)}>
      {asked ? `${adminFirst} has been asked` : `Ask ${adminFirst} for more credits`}
    </Button>
  );
  const usageButton = (
    <Button variant="outline" size="sm" onClick={() => go("/configure/billing?tab=usage")}>
      View usage
    </Button>
  );

  // Invoiced: the org pays a statement, so the popover shows usage, not a balance.
  if (billing === "invoiced") {
    const monthName = month.toLocaleDateString("en-US", { month: "long" });
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return (
      <div className="cp">
        <div className="cp-hd">
          <span className="cp-org">{orgName}</span>
          <p className="cp-muted">{monthName} so far</p>
          <div className="cp-big">
            <b>{credits(view.usedThisMonth)} used</b>
          </div>
          {isAdmin ? (
            <p className="cp-muted">
              Estimated {formatUsd(view.usedThisMonth * INVOICED_CREDIT_USD)} · Next statement {next}
            </p>
          ) : (
            <p className="cp-muted">You used {mine} this month</p>
          )}
        </div>
        <div className="cp-ft">{usageButton}</div>
      </div>
    );
  }

  // Held: enterprise org waiting on its setup call.
  if (view.held) {
    return (
      <div className="cp">
        <div className="cp-hd">
          <span className="cp-org">{orgName}</span>
          <div className="cp-spot">
            <Illustration name="09-approval-pending" size={48} />
            <div>
              <div className="cp-held-t">
                <Icon name="hourglass-high" size={15} /> Credits after your call
              </div>
              <p className="cp-muted">
                Your {TRIAL_GRANT_CREDITS} trial credits are held for {orgName.split(" ")[0]} and open once Realwired
                confirms the account.
              </p>
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="cp-ft">
            <Button variant="primary" size="sm" onClick={() => go("/get-started")}>
              View call details
            </Button>
          </div>
        )}
      </div>
    );
  }

  const zero = view.lowTone === "zero";
  const low = view.lowTone === "low";
  const total = view.usedThisMonth + view.balance;
  const pct = total > 0 ? Math.round((view.usedThisMonth / total) * 100) : 0;
  const earnOpen = earn.window !== null && earn.window.state !== "closed" && earn.reviewsLeftToEarn > 0;
  const daysLeft = earn.window?.daysLeft ?? 0;

  const rows: { icon: IconName; label: string; v: number }[] = [
    { icon: "reviews", label: "Full review", v: FULL_COST },
    { icon: "document", label: "Technical or administrative only", v: SINGLE_COST },
  ];

  return (
    <div className="cp">
      <div className="cp-hd">
        <span className="cp-org">{isAdmin ? orgName : `Team balance · ${orgName}`}</span>
        {zero ? (
          <div className="cp-spot">
            <Illustration name="01-credits" size={48} />
            <div>
              <div className="cp-big">
                <b className="cp-zero">0 credits</b>
              </div>
              <p className="cp-muted">New reviews can&rsquo;t start. Reviews already running finish normally.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="cp-big">
              <b>{credits(view.balance)}</b>
              <span className="cp-muted">
                {view.fullReviews === 0 ? "less than a full review" : `about ${reviews(view.fullReviews)}`}
              </span>
              {low && (
                <CreditChip tone="low" size="sm">
                  Running low
                </CreditChip>
              )}
            </div>
            {billing === "trial" && view.bySource.trial > 0 && <p className="cp-faint">Trial credits · never expire</p>}
            {view.runwayDays !== null && (
              <p className="cp-muted">
                At this month&rsquo;s pace, that lasts {runwayPhrase(view.runwayDays)}.
                {low && view.runsOutOn !== null && <> It runs out {runsOutPhrase(view.runsOutOn, now)}.</>}
              </p>
            )}
            {pct > 0 && (
              <div className="cp-bar" aria-hidden="true">
                <i style={{ width: `${pct}%` }} />
              </div>
            )}
          </>
        )}
        {!zero && <p className="cp-faint">{isAdmin ? `Used ${view.usedThisMonth} this month` : `You used ${mine} this month`}</p>}
      </div>
      {!zero && (
        <div className="cp-rows">
          {rows.map((r) => (
            <div key={r.label} className="cp-row">
              <Icon name={r.icon} size={15} />
              <span>{r.label}</span>
              <span className="cp-v">{credits(r.v)}</span>
            </div>
          ))}
        </div>
      )}
      {earnOpen && isAdmin && (
        <button type="button" className="cp-note" onClick={() => go("/get-started")}>
          <Icon name="gift" size={15} />
          <span>
            Earn {earn.reviewsLeftToEarn} more free review{earn.reviewsLeftToEarn === 1 ? "" : "s"} in the next{" "}
            {daysLeft} day{daysLeft === 1 ? "" : "s"}.
          </span>
        </button>
      )}
      <div className="cp-ft">
        {isAdmin ? (
          <>
            {!zero && usageButton}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                useWalletStore.getState().openTopUp({ reason: "manual" });
              }}
            >
              Add credits
            </Button>
          </>
        ) : (
          <>
            {usageButton}
            {askButton}
          </>
        )}
      </div>
    </div>
  );
}
