"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Callout } from "@realwired/ui";
import { Icon, Tooltip } from "@/components/atoms";
import { formatUsd } from "@/lib/pricing";
import { useBuildNotes, useOrgStore, useSessionStore, useWalletStore } from "@/store";
import type { Review } from "@/types";
import { deriveValue, methodLine } from "./value-model";
import "./value.css";

const BANNER_KEY = "parachute:value-banner-dismissed";

function readDismissed(userId: string | null): boolean {
  try {
    const raw = window.localStorage.getItem(BANNER_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(userId ?? "anon");
  } catch {
    return false;
  }
}

function writeDismissed(userId: string | null) {
  try {
    const raw = window.localStorage.getItem(BANNER_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const id = userId ?? "anon";
    if (!ids.includes(id)) window.localStorage.setItem(BANNER_KEY, JSON.stringify([...ids, id]));
  } catch {
    /* storage unavailable: the banner just returns next visit */
  }
}

const num = (n: number) => n.toLocaleString("en-US");
const hours = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Whether the strip belongs on this org's dashboard: invoiced orgs always (they
 * are established), trial and pay-as-you-go orgs once a real review has run.
 */
export function useShowValueStrip(reviews: readonly Review[]): boolean {
  const billing = useOrgStore((s) => s.org?.billing);
  if (billing === "invoiced") return true;
  return reviews.some((r) => r.status === "completed");
}

/** H1: four monochrome value cards with a placeholder banner. Mounted in the dashboard's active branch. */
export function ValueStrip({ reviews }: { reviews: readonly Review[] }) {
  const billing = useOrgStore((s) => s.org?.billing);
  const ledger = useWalletStore((s) => s.ledger);
  const userId = useSessionStore((s) => s.userId);
  const buildNotes = useBuildNotes();
  const [now] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(() => readDismissed(userId));

  const invoiced = billing === "invoiced";
  const v = useMemo(() => deriveValue(reviews, ledger, invoiced, now), [reviews, ledger, invoiced, now]);

  return (
    <section className="vl" aria-label="Value this month">
      {buildNotes && !dismissed && (
        <div className="vl-banner">
          <Callout
            tone="info"
            onDismiss={() => {
              writeDismissed(userId);
              setDismissed(true);
            }}
          >
            Needs engine v2 API sample — figures are layout placeholders.
          </Callout>
        </div>
      )}
      <div className="vl-grid">
        <Tooltip
          block
          panel
          content={
            <span className="vl-method">
              <strong>How this is worked out</strong>
              <span>Reviews × time saved per review type.</span>
              <span>{methodLine()}.</span>
            </span>
          }
        >
          <div className="vl-card">
            <div className="vl-k">
              Hours saved this month
              <Icon name="info" size={14} />
            </div>
            <div className="vl-v">
              ~{hours(v.hoursSaved)} <small>hours</small>
            </div>
            <div className="vl-sub">
              {v.reviews} {v.reviews === 1 ? "review" : "reviews"} · method on hover
            </div>
          </div>
        </Tooltip>

        <div className="vl-card">
          <div className="vl-k">Math checks re-run</div>
          <div className="vl-v">{num(v.mathChecks)}</div>
          <div className="vl-sub">DCF, cap rate, adjustments</div>
        </div>

        <div className="vl-card">
          <div className="vl-k">Findings raised</div>
          <div className="vl-v">{num(v.findings)}</div>
          <div className="vl-sub">
            Across {v.findingReviews} {v.findingReviews === 1 ? "report" : "reports"}
          </div>
        </div>

        <div className="vl-card">
          <div className="vl-k">Spend this month</div>
          <div className="vl-v">~{formatUsd(v.spendUsd)}</div>
          <div className="vl-sub">
            {v.spendCredits} {v.spendCredits === 1 ? "credit" : "credits"}
            <span aria-hidden> · </span>
            <Link className="vl-export" href="/configure/billing?tab=activity">
              <Icon name="download" size={14} />
              Export
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
