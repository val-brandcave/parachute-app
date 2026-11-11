"use client";

import { useId } from "react";
import Link from "next/link";
import { Chip, Icon, Illustration } from "@/components/atoms";
import { orgShortName } from "@/components/organisms/onboarding";
import { useLockStore, useOrgStore, type SetupSummary } from "@/store";
import { reviewsPerSection } from "./EarnPill";
import { useStartGate } from "./useStartGate";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * "All 8 done" completion card (spot 08b, 120 px), replaces DoneCard. Its title is the
 * page h1 in this state. Below it, each section folds to one summary line.
 */
export function AllDone({ summary }: { summary: SetupSummary }) {
  const org = useOrgStore((s) => s.org);
  const gate = useStartGate();
  const openLock = useLockStore((s) => s.openLock);
  const reasonId = useId();
  const short = orgShortName(org?.name ?? "Your organization");
  const per = reviewsPerSection();
  const earnedReviews = summary.earn.awardedSections.length * per;
  const title =
    earnedReviews > 0
      ? `You earned ${plural(earnedReviews, "free review", "free reviews")}. ${short} is set up.`
      : `${short} is set up.`;
  const credits = summary.earn.earnedCredits;

  return (
    <>
      <section className="card gs-alldone" aria-labelledby="gs-title">
        <Illustration name="08b-signed-workbook" size={120} className="gs-alldone-art" />
        <div className="gs-alldone-body">
          <Chip tone="pass" className="gs-alldone-chip">
            <span aria-hidden="true">
              <Icon name="check" size={13} strokeWidth={2.6} />
            </span>
            All {summary.total} done
          </Chip>
          <h1 id="gs-title" className="gs-alldone-h" tabIndex={-1}>
            {title}
          </h1>
          <p className="gs-alldone-p">
            {credits > 0 && <>{plural(credits, "credit was", "credits were")} added to your balance. </>}
            Get started leaves the sidebar now; the Learning Center and Trust Center stay where they are.
          </p>
          <div className="gs-alldone-actions">
            <Link href="/dashboard" className="ui-btn ui-btn--sm ui-btn--primary">
              Go to Dashboard
            </Link>
            {gate.locked ? (
              <>
                <button
                  type="button"
                  className="ui-btn ui-btn--sm ui-btn--outline gs-row-locked"
                  aria-disabled="true"
                  aria-describedby={reasonId}
                  onClick={(e) => openLock({ kind: "approval" }, { returnFocus: e.currentTarget })}
                >
                  Start a review
                  <span aria-hidden="true" className="gs-row-lockic">
                    <Icon name="hourglass-high" size={14} />
                  </span>
                </button>
                <span id={reasonId} className="ui-visually-hidden">
                  {gate.reason}
                </span>
              </>
            ) : (
              <Link href="/launchpad" className="ui-btn ui-btn--sm ui-btn--outline">
                Start a review
              </Link>
            )}
          </div>
        </div>
      </section>
      <ul className="card gs-folded" aria-label="Setup sections">
        {summary.sections.map((s) => (
          <li key={s.id} className="gs-folded-row">
            <span className="gs-cb is-on" aria-hidden="true">
              <Icon name="check" size={13} strokeWidth={2.8} />
            </span>
            <span className="gs-folded-name">{s.title}</span>
            <span className="gs-folded-meta mono">
              {s.doneCount} of {s.total}
              {s.awarded && `, ${plural(per, "free review", "free reviews")} earned`}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
