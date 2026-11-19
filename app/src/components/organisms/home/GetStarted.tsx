"use client";

import { Suspense, useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Callout, useToast } from "@realwired/ui";
import { CreditChip, Icon, IconButton, Illustration, ProgressBar } from "@/components/atoms";
import { orgShortName } from "@/components/organisms/onboarding";
import { GetStartedSkeleton } from "@/components/organisms/Skeletons";
import { celebrate } from "@/lib/celebrate";
import { useCurrentUser } from "@/lib/current-user";
import { ROLE_META } from "@/lib/member-roles";
import { dist, dur, ease, useMotionMode } from "@/lib/motion";
import { EARN_CAP_CREDITS, EARN_WINDOW_DAYS, TRIAL_GRANT_CREDITS, costFor } from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { cn, formatShortDate } from "@/lib/utils";
import {
  setupEligible,
  useOrgInvites,
  useOrgStore,
  usePrefsStore,
  useSetupHidden,
  useSetupSummary,
  useUsersStore,
  type SetupSummary,
} from "@/store";
import type { Org } from "@/types";
import "@/app/bouncer/bouncer.css";
import { AllDone } from "./AllDone";
import { PendingTracker, type PendingTrackerStep } from "./PendingTracker";
import { ResourceCards } from "./ResourceCards";
import { SetupSection } from "./SetupSection";
import { useArrivalCelebration } from "./useArrivalCelebration";
import { useLockProbe } from "./useLockProbe";
import { useHeroWatch } from "./SetupProgressLine";
import { useStartGate } from "./useStartGate";
import "./get-started.css";
import "./gs-hero.css";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/* ---- Eastern-time call labels (the scheduler books in ET; see lib/call-slots.ts) ---- */
const TZ = "America/New_York";
const callDayFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "short", day: "numeric" });
const callTimeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });
const callShortFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" });
const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long" });

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
  const name = useUsersStore((s) => s.allUsers.find((u) => u.id === invite?.acceptedUserId)?.name);
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
        <strong>{name ?? invite.inviteeName ?? invite.email}</strong> accepted your invite as{" "}
        {ROLE_META[invite.role].label.toLowerCase()}
      </Callout>
    </div>
  );
}

/** Enterprise waiting on Realwired (board 9): the call, the hold, and the three-step tracker. */
function PendingCard({ org }: { org: Org }) {
  const toast = useToast();
  const short = orgShortName(org.name);
  const at = org.profile?.callBookedAt;
  const booked = at !== undefined;
  const steps: PendingTrackerStep[] = [
    { label: "Signed up", date: formatShortDate(org.createdAt), state: "done" },
    booked
      ? { label: "Call booked", date: callShortFmt.format(new Date(at)), state: "current" }
      : { label: "Book your setup call", state: "current" },
    { label: "Confirmed", date: "Usually same day", state: "todo" },
  ];
  return (
    <section className="card gs-pending" aria-labelledby="gs-pending-t">
      <div className="gs-pending-main">
        <span className="gs-pending-ic" aria-hidden="true">
          <Icon name="calendar-event" size={20} />
        </span>
        <div className="gs-pending-body">
          <h2 id="gs-pending-t" className="gs-pending-t">
            {booked
              ? `Call booked for ${callDayFmt.format(new Date(at))} at ${callTimeFmt.format(new Date(at))} ET`
              : "Book your setup call"}
          </h2>
          <p className="gs-pending-p">
            Your {TRIAL_GRANT_CREDITS} trial credits are held for {short} and open as soon as Realwired confirms the
            account.
          </p>
          <div className="gs-pending-actions">
            {booked ? (
              <>
                <Link href="/welcome/call" className="ui-btn ui-btn--sm ui-btn--outline">
                  Change call
                </Link>
                <button
                  type="button"
                  className="ui-btn ui-btn--sm ui-btn--ghost"
                  onClick={() =>
                    toast({ title: "Calendar invite", description: "The .ics download arrives with the real scheduler.", tone: "info" })
                  }
                >
                  Add to calendar
                </button>
              </>
            ) : (
              <Link href="/welcome/call" className="ui-btn ui-btn--sm ui-btn--primary">
                <span aria-hidden="true">
                  <Icon name="calendar-event" size={15} />
                </span>
                Book a call
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="gs-pending-track">
        <PendingTracker steps={steps} />
      </div>
    </section>
  );
}

/** "You're in." — the arrival visit from self-serve onboarding only. A slim navy-tinted
 *  strip: the trial grant as a credit chip, a quiet way into a first review, and dismiss. */
function WelcomeLine({ userId }: { userId: string }) {
  const mode = useMotionMode();
  const gate = useStartGate();
  const dismiss = () => usePrefsStore.getState().dismissWelcome(userId);
  const enter =
    mode === "full"
      ? { initial: { opacity: 0, y: dist.lift }, animate: { opacity: 1, y: 0, transition: { duration: dur.standard, ease: ease.enter } } }
      : { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: dur.reducedFade } } };
  return (
    <motion.div className="gs-welcome" role="status" {...enter} exit={{ opacity: 0, transition: { duration: dur.quick, ease: ease.exit } }}>
      <CreditChip tone="credit" size="sm" className="gs-welcome-chip">
        {plural(TRIAL_GRANT_CREDITS, "credit", "credits")}
      </CreditChip>
      <span className="gs-welcome-t">You&apos;re in. Your trial credits are ready to use.</span>
      {!gate.locked && (
        <Link href="/launchpad" className="gs-welcome-link">
          Start a review
        </Link>
      )}
      <IconButton name="close" size={16} aria-label="Dismiss" onClick={dismiss} className="gs-welcome-x" />
    </motion.div>
  );
}

/** On arrival, focus moves to the page h1 (motion-spec §3.7). Rendered inside the content
 *  so its effect runs once the content (and its h1) is actually in the DOM. */
function FocusHeading({ root }: { root: RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    root.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  }, [root]);
  return null;
}

/** The hero's lead line (the offer) and the progress meta, per state (spec §5.2 States).
 *  Pure on the summary. The headline itself is the greeting. */
function heroCopy(summary: SetupSummary, org: Org | null): { lead: string; meta: string; tone: "normal" | "ending" } {
  const short = orgShortName(org?.name ?? "your organization");
  const full = costFor(FULL_REVIEW_TYPES);
  const count = `${summary.doneCount} of ${summary.total} done`;
  const win = summary.earn.window;

  if (summary.pending) {
    const at = org?.profile?.callBookedAt;
    return {
      lead:
        at !== undefined
          ? `Get ${short} ready before your call on ${weekdayFmt.format(new Date(at))}.`
          : `Get ${short} ready while Realwired confirms it.`,
      meta: `your ${EARN_WINDOW_DAYS} days to earn start when ${short} is confirmed`,
      tone: "normal",
    };
  }
  if (org?.billing === "invoiced" || !win) {
    return { lead: `Finish setting up ${short}.`, meta: count, tone: "normal" };
  }
  if (win.state === "closed") {
    return {
      lead: `Finish setting up ${short}.`,
      meta: summary.earn.earnedCredits > 0 ? `Bonus window closed · you earned ${plural(summary.earn.earnedCredits, "credit", "credits")}` : "Bonus window closed",
      tone: "normal",
    };
  }
  const trialReviews = Math.floor(TRIAL_GRANT_CREDITS / full);
  const lead =
    org?.billing === "trial"
      ? `Your trial includes ${TRIAL_GRANT_CREDITS} credits, enough for ${plural(trialReviews, "full review", "full reviews")}. Earn ${EARN_CAP_CREDITS} more by finishing setup in your first ${EARN_WINDOW_DAYS} days.`
      : `Earn ${EARN_CAP_CREDITS} free credits by finishing setup in your first ${EARN_WINDOW_DAYS} days.`;
  const meta =
    summary.earn.reviewsLeftToEarn === 0
      ? `you earned ${plural(summary.earn.earnedCredits, "credit", "credits")}`
      : `${plural(win.daysLeft, "day", "days")} left to earn`;
  return { lead, meta, tone: win.state === "ending" ? "ending" : "normal" };
}

/** The Get started page body (spec §5.2, PC-1/35/36): one column — bodied hero, sections,
 *  "More resources". Setup-eligible orgs only; everyone else, and anyone who hid the guide,
 *  goes to the Dashboard. */
export function GetStarted() {
  const router = useRouter();
  const me = useCurrentUser();
  const org = useOrgStore((s) => s.org);
  const hidden = useSetupHidden();
  const summary = useSetupSummary();
  const welcomeDismissed = usePrefsStore((s) => !!s.welcomeDismissedBy[me.id]);
  const mode = useMotionMode();
  const away = (!!org && !setupEligible(org)) || hidden;
  const rootRef = useRef<HTMLDivElement>(null);
  useLockProbe();

  useEffect(() => {
    if (away) router.replace("/dashboard");
  }, [away, router]);

  // Same feel as Dashboard and Reviews: a short skeleton while "loading".
  const [minDone, setMinDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 700);
    return () => clearTimeout(t);
  }, []);
  const loading = !summary.ready || !minDone || !org;
  const { arrival, landed } = useArrivalCelebration(!loading && !away);
  // The header's progress line shows once this hero has scrolled away.
  const heroRef = useHeroWatch();

  // Enterprise confirmed: the approval celebration, once per user (pending Q-C9).
  const confirmed = !!org?.profile?.salesRequested && org.approval === "approved" && !summary.allDone;
  useEffect(() => {
    if (!loading && confirmed) void celebrate("approval", me.id);
  }, [loading, confirmed, me.id]);

  if (away) return null;

  const hero = heroCopy(summary, org);
  const greeting = summary.doneCount > 0 ? `Welcome back, ${me.firstName}` : `Welcome, ${me.firstName}`;
  const showWelcome = landed && arrival?.path === "self_serve" && !welcomeDismissed && !summary.pending;
  const fade = mode === "full" ? dur.standard : dur.reducedFade;

  return (
    <div className="pagebody gs-page" ref={rootRef}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: dur.quick }}>
            <GetStartedSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="gs-col"
            initial={mode === "full" ? { opacity: 0, y: dist.enter } : { opacity: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: fade, ease: ease.enter }}
          >
            <Suspense fallback={null}>
              <JoinedCallout />
            </Suspense>
            {summary.pending && org && <PendingCard org={org} />}
            {confirmed && (
              <Callout tone="success">
                {orgShortName(org.name)} is confirmed. Your {TRIAL_GRANT_CREDITS} trial credits are ready.
              </Callout>
            )}

            {summary.allDone ? (
              <AllDone summary={summary} />
            ) : (
              <>
                <header className="card gs-hero" ref={heroRef} aria-labelledby="gs-title">
                  <div className="gs-hero-text">
                    <h1 id="gs-title" className="gs-hero-h" tabIndex={-1}>
                      {greeting}
                    </h1>
                    <p className="gs-hero-lead">{hero.lead}</p>
                    <ProgressBar
                      value={summary.total > 0 ? summary.doneCount / summary.total : 0}
                      label={`${summary.doneCount} of ${summary.total} setup steps done`}
                      className="gs-hero-bar"
                    />
                    <div className="gs-hero-foot">
                      <p className={cn("gs-hero-meta", hero.tone === "ending" && "is-ending")}>
                        <b className="mono">
                          {summary.doneCount} of {summary.total} done
                        </b>
                        {hero.meta !== `${summary.doneCount} of ${summary.total} done` && <> · {hero.meta}</>}
                      </p>
                    </div>
                  </div>
                  <Illustration name="11b-earn-free-report" size={120} className="gs-hero-art" />
                </header>

                <AnimatePresence>{showWelcome && <WelcomeLine key="welcome" userId={me.id} />}</AnimatePresence>

                <div className="gs-secs">
                  {summary.sections.map((s) => (
                    <SetupSection key={s.id} section={s} summary={summary} />
                  ))}
                </div>
              </>
            )}

            <ResourceCards />
            <FocusHeading root={rootRef} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
