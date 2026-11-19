"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { Chip, Icon, Illustration } from "@/components/atoms";
import { orgShortName } from "@/components/organisms/onboarding";
import { celebrate } from "@/lib/celebrate";
import { useCurrentUser } from "@/lib/current-user";
import { useLockStore, useOrgStore, type SetupSummary } from "@/store";
import { SetupSection } from "./SetupSection";
import { useStartGate } from "./useStartGate";
import "./gs-cards.css";

/** Let the page land before the confetti (same beat as the arrival celebration). */
const LAND_DELAY_MS = 200;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * "All 8 done" completion card: text (chip, h1, lead, actions) left, spot 08b (120 px)
 * right, the same arrangement as the in-progress hero. Its title is the page h1 in this
 * state. Below it the real section accordions stay, folded, each with what it earned.
 * Finishing setup fires the "setup-done" confetti once per user.
 */
export function AllDone({ summary }: { summary: SetupSummary }) {
  const org = useOrgStore((s) => s.org);
  const gate = useStartGate();
  const openLock = useLockStore((s) => s.openLock);
  const reasonId = useId();
  const short = orgShortName(org?.name ?? "Your organization");
  const credits = summary.earn.earnedCredits;
  // Credits are the one unit on Get started (badges, hero, toast), so the title counts credits too.
  const title = credits > 0 ? `You earned ${plural(credits, "credit", "credits")}. ${short} is set up.` : `${short} is set up.`;
  const me = useCurrentUser();

  useEffect(() => {
    // celebrate() enforces once per user (marked even when motion is off), so a later
    // visit to a finished Get started stays quiet.
    const t = setTimeout(() => void celebrate("setup-done", me.id), LAND_DELAY_MS);
    return () => clearTimeout(t);
  }, [me.id]);

  return (
    <>
      <section className="card gs-alldone" aria-labelledby="gs-title">
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
                  {gate.reasonText}
                </span>
              </>
            ) : (
              <Link href="/launchpad" className="ui-btn ui-btn--sm ui-btn--outline">
                Start a review
              </Link>
            )}
          </div>
        </div>
        <Illustration name="08b-signed-workbook" size={120} className="gs-alldone-art" />
      </section>
      <div className="gs-secs">
        {summary.sections.map((s) => (
          <SetupSection key={s.id} section={s} summary={summary} />
        ))}
      </div>
    </>
  );
}
