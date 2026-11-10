"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, CreditChip } from "@/components/atoms";
import { HcCard } from "@/components/organisms/home/HcFrame";
import { useCurrentUser } from "@/lib/current-user";
import { TRIAL_GRANT_CREDITS, costFor } from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { balanceGrants } from "@/lib/wallet-breakdown";
import { useApprovalPending, useReviewsStore, useSetupSummary, useWalletStore } from "@/store";
import { buildUsageLines, runwayFill, runwayFor, runwayText, runwayWarn, usageAnchor } from "@/components/organisms/billing/usage/usage-data";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const MAX_TOKENS = 10;

/** One small page per full review the balance covers. Decorative: the sentence carries the meaning. */
function Tokens({ full, half, mode }: { full: number; half?: boolean; mode?: "low" | "dashed" }) {
  return (
    <div className="hc-tokens" aria-hidden="true">
      {mode ? (
        <i className={`hc-tok is-${mode}`} />
      ) : (
        <>
          {Array.from({ length: full }, (_, i) => (
            <i key={i} className="hc-tok" />
          ))}
          {half && <i className="hc-tok is-half" />}
        </>
      )}
    </div>
  );
}

/** Home wallet card. One picture per stage, so it scales from a trial to a bank running hundreds of
 *  reviews a month: trial = progress bar of the trial grant; paid with usage = runway bar (how long
 *  the balance lasts at the last 30 days' pace, same scale as Billing); paid with no usage yet =
 *  review tokens only while they are few enough to count (<= MAX_TOKENS). Spend order and expiry
 *  live on Billing. */
export function WalletCard() {
  const router = useRouter();
  const ledger = useWalletStore((s) => s.ledger);
  const reviews = useReviewsStore((s) => s.reviews);
  const pending = useApprovalPending();
  const isAdmin = useCurrentUser().role === "org_admin";
  const { adminFirst } = useSetupSummary();

  const grants = balanceGrants(ledger);
  const live = grants.filter((g) => g.remaining > 0);
  const balance = live.reduce((n, g) => n + g.remaining, 0);
  const fullCost = costFor(FULL_REVIEW_TYPES);
  const full = Math.floor(balance / fullCost);
  const spare = balance - full * fullCost > 0;
  const allTrial = live.length > 0 && live.every((g) => g.source === "trial");
  const low = !pending && balance < fullCost;
  const enough = `Enough for ${full} full ${plural(full, "review", "reviews")}`;
  const openTopUp = () => useWalletStore.getState().openTopUp({ reason: "low_balance", needed: fullCost - balance });
  const viewBalance = () => router.push("/configure/billing");
  const run = useMemo(() => {
    const lines = buildUsageLines(ledger, reviews, false);
    return runwayFor(balance, lines, usageAnchor(lines, ledger));
  }, [ledger, reviews, balance]);

  const viewBtn = (variant: "outline" | "ghost") => (
    <Button variant={variant} size="sm" onClick={viewBalance}>
      View balance
    </Button>
  );

  if (pending) {
    return (
      <HcCard
        title="Wallet"
        right={
          <CreditChip tone="low" size="sm">
            Pending
          </CreditChip>
        }
        meta="Usually within one business day"
      >
        <div className="hc-big is-muted">
          <span className="hc-n">{TRIAL_GRANT_CREDITS}</span>
          <span className="hc-u">trial credits</span>
        </div>
        <div className="hc-tokens" aria-hidden="true">
          {Array.from({ length: Math.floor(TRIAL_GRANT_CREDITS / fullCost) }, (_, i) => (
            <i key={i} className="hc-tok is-dashed" />
          ))}
        </div>
        <p className="hc-line">Arrives when Realwired confirms your organization.</p>
      </HcCard>
    );
  }

  if (low) {
    return (
      <HcCard
        title="Wallet"
        right={
          <CreditChip tone="low" size="sm">
            Low
          </CreditChip>
        }
        actions={
          isAdmin ? (
            <>
              <Button variant="primary" size="sm" onClick={openTopUp}>
                Add credits
              </Button>
              {viewBtn("ghost")}
            </>
          ) : (
            viewBtn("outline")
          )
        }
        meta={isAdmin ? `${fullCost} credits per review` : `Ask ${adminFirst ?? "your admin"} to add credits`}
      >
        <div className="hc-big">
          <span className="hc-n">{balance}</span>
          <span className="hc-u">{plural(balance, "credit", "credits")}</span>
        </div>
        <Tokens full={1} mode="low" />
        <p className="hc-line">Not enough for a full review</p>
      </HcCard>
    );
  }

  if (allTrial) {
    return (
      <HcCard
        title="Wallet"
        right={<CreditChip tone="trial" size="sm">Trial</CreditChip>}
        actions={
          isAdmin ? (
            <Button variant="outline" size="sm" onClick={() => router.push("/configure/billing?tab=settings")}>
              Add a card
            </Button>
          ) : (
            viewBtn("outline")
          )
        }
        meta={isAdmin ? "No card needed yet" : `${fullCost} credits per review`}
      >
        <div className="hc-big">
          <span className="hc-n">{balance}</span>
          <span className="hc-u">
            of {TRIAL_GRANT_CREDITS} trial {plural(TRIAL_GRANT_CREDITS, "credit", "credits")} left
          </span>
        </div>
        <div
          className="hc-bar"
          role="progressbar"
          aria-label="Trial credits left"
          aria-valuemin={0}
          aria-valuemax={TRIAL_GRANT_CREDITS}
          aria-valuenow={balance}
        >
          <i style={{ width: `${Math.min(100, (balance / TRIAL_GRANT_CREDITS) * 100)}%` }} />
        </div>
        <p className="hc-line">{enough}</p>
      </HcCard>
    );
  }

  // Paid, with usage to go on: how long the balance lasts. Works the same at 13 credits or 400.
  if (run.days !== null) {
    const warn = runwayWarn(run.days);
    return (
      <HcCard
        title="Wallet"
        actions={viewBtn("outline")}
        meta={`${enough.replace("Enough for", "Covers")}`}
      >
        <div className="hc-big">
          <span className="hc-n">{balance}</span>
          <span className="hc-u">{plural(balance, "credit", "credits")}</span>
        </div>
        <div
          className={`hc-bar${warn ? " is-warn" : ""}`}
          role="img"
          aria-label={`Balance lasts ${runwayText(run.days)} at your current pace`}
        >
          <i style={{ width: `${Math.round(runwayFill(run.days) * 100)}%` }} />
        </div>
        <p className="hc-line">Lasts {runwayText(run.days)} at your pace</p>
      </HcCard>
    );
  }

  // Paid, nothing run yet: count reviews; show the tokens only while they are few enough to count.
  return (
    <HcCard title="Wallet" actions={viewBtn("outline")} meta={`${fullCost} credits per review`}>
      <div className="hc-big">
        <span className="hc-n">{balance}</span>
        <span className="hc-u">{plural(balance, "credit", "credits")}</span>
      </div>
      {full <= MAX_TOKENS && <Tokens full={full} half={spare} />}
      <p className="hc-line">{enough}</p>
    </HcCard>
  );
}
