"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@realwired/ui";
import { Icon } from "@/components/atoms";
import { ActionMenu } from "@/components/molecules";
import { useCurrentUser } from "@/lib/current-user";
import { EARN_CAP_CREDITS } from "@/lib/pricing";
import { INVITE_HREF, SETUP_GROUP_LABEL, type SetupGroup } from "@/lib/setup-steps";
import { cn, formatStamp } from "@/lib/utils";
import {
  useApprovalPending,
  useOnboardingStore,
  useOrgInvites,
  useOrgStore,
  usePrefsStore,
  useSetupSummary,
  type DerivedStep,
  type SetupSummary,
} from "@/store";
import { useSetupActions } from "./useSetupActions";
import { GuidePlayer } from "./GuideVideo";
import { stepVideo } from "@/lib/guides";
import "./setup-checklist.css";

const GROUPS: SetupGroup[] = ["first", "team"];

/** The specific verb on the Up next button (rows keep the short label from setup-steps). */
const NEXT_CTA: Partial<Record<string, string>> = {
  sample_review: "Open sample",
  first_review: "Upload a report",
  bank_policy: "Upload policy",
  security_pack: "Send the pack",
  checklist: "Start the checklist",
  layout: "Start a layout",
  invite: "Invite a teammate",
};

/** "Priya has it · 220 Commerce Way" -> "Priya has it"; "Draft saved · 18 of 24 items mapped" -> "18 of 24 items mapped". */
function inlineState(step: DerivedStep): string {
  if (!step.doing) return `About ${step.minutes} min`;
  const parts = step.doing.note.split(" · ").filter((p) => p !== "Draft saved" && !p.includes("@"));
  return parts[0] ?? step.doing.note;
}

function StepRow({
  step,
  isAdmin,
  adminFirst,
  showReward,
  locked,
}: {
  step: DerivedStep;
  isAdmin: boolean;
  adminFirst: string | null;
  /** The step still earns a credit (not collected, cap not reached). */
  showReward: boolean;
  /** Closed until the organization is approved. */
  locked: boolean;
}) {
  const complete = useOnboardingStore((s) => s.complete);
  const action = step.doing
    ? { label: step.continueLabel ?? "Continue", href: step.doing.href ?? step.action?.href ?? "/dashboard" }
    : step.action;
  const blocked = !!step.adminOnly && !isAdmin;

  return (
    <div className={cn("sc-row", step.doing && "is-doing")}>
      <span className="sc-dot" aria-hidden="true" />
      <div className="sc-label">
        <span className="sc-label-t">{step.label}</span>
        <span className="sc-label-s">{locked ? "" : inlineState(step)}</span>
      </div>
      <span>
        {locked ? (
          <span className="sc-chip sc-chip--wait">After approval</span>
        ) : step.doing ? (
          <span className="sc-chip">In progress</span>
        ) : null}
      </span>
      <span className="sc-rw">
        {showReward && !locked && (
          <>
            <Icon name="coins" size={13} />
            +{step.reward}
          </>
        )}
      </span>
      <span className="sc-act">
        {locked ? null : blocked ? (
          <span className="sc-ask">Ask {adminFirst ?? "your admin"}</span>
        ) : action ? (
          <Link href={action.href} className="ui-btn ui-btn--sm ui-btn--outline">
            {action.label}
          </Link>
        ) : (
          <button type="button" className="ui-btn ui-btn--sm ui-btn--outline" onClick={() => void complete(step.id)}>
            Mark done
          </button>
        )}
      </span>
    </div>
  );
}

function UpNext({
  step,
  showReward,
  canSkip,
  onSkip,
  idleTitle,
}: {
  step?: DerivedStep;
  showReward: boolean;
  canSkip: boolean;
  onSkip: () => void;
  idleTitle: string;
}) {
  const router = useRouter();
  const complete = useOnboardingStore((s) => s.complete);
  const { openDoc } = useSetupActions();

  if (!step) {
    return (
      <div className="sc-next sc-next--idle">
        <div className="sc-next-label">Up next</div>
        <div className="sc-next-title">{idleTitle}</div>
        <p className="sc-next-desc">The remaining steps need an organization admin.</p>
      </div>
    );
  }

  const href = step.doing ? (step.doing.href ?? step.action?.href) : step.action?.href;
  const label = step.doing ? (step.continueLabel ?? "Continue") : (NEXT_CTA[step.id] ?? step.action?.label ?? "Continue");

  const video = step.video ? stepVideo(step.id, step.video) : null;

  return (
    <div className={cn("sc-next", video && "sc-next--media")}>
      <div className="sc-next-main">
      <div className="sc-next-label">Up next</div>
      <div className="sc-next-title">{step.label}</div>
      <p className="sc-next-desc">{step.descText}</p>
      <div className="sc-meta">
        <span>
          <Icon name="clock" size={13} />
          {step.doing ? inlineState(step) : `About ${step.minutes} min`}
        </span>
        {step.doc && (
          <button
            type="button"
            className="sc-link"
            onClick={() => (step.doc!.kind === "pack" ? router.push("/configure/security") : openDoc(step.doc!.label))}
          >
            <Icon name={step.doc.kind === "pack" ? "document" : "download"} size={13} />
            {step.doc.label}
          </button>
        )}
        {showReward && <span className="sc-reward">+{step.reward} credit</span>}
      </div>
      <div className="sc-actions">
        {href ? (
          <Link href={href} className="ui-btn ui-btn--primary">
            {label}
          </Link>
        ) : (
          <button type="button" className="ui-btn ui-btn--primary" onClick={() => void complete(step.id)}>
            Mark done
          </button>
        )}
        {canSkip && (
          <button type="button" className="ui-btn ui-btn--ghost" onClick={onSkip}>
            Skip for now
          </button>
        )}
      </div>
      </div>
      {video && (
        <div className="sc-next-media">
          {/* Keyed by step so skipping to another step loads its own video. */}
          <GuidePlayer key={video.id} guide={video} onReport={() => {}} />
        </div>
      )}
    </div>
  );
}

/** Lowercase the first letter so "Sample review opened" reads inside a sentence. */
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function DoneLine({ summary }: { summary: SetupSummary }) {
  const [open, setOpen] = useState(false);
  const doneSteps = summary.steps.filter((s) => s.done);
  const names = ["Account created", ...doneSteps.map((s) => lower(s.doneLabel))];

  return (
    <div className="sc-done">
      <div className="sc-done-line">
        <Icon name="check" size={15} strokeWidth={2.4} />
        <span className="sc-done-text">
          <b>{names.length} done</b> · {names.join(", ")}
        </span>
        <button type="button" className="sc-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Show"}
          <Icon name="chevron-down" size={14} className={cn("sc-toggle-ic", open && "is-open")} />
        </button>
      </div>
      {open && (
        <ul className="sc-done-list">
          <li>
            Account created <span>· {summary.userName(summary.account.by) ?? "You"}, {formatStamp(summary.account.doneAt)}</span>
          </li>
          {doneSteps.map((s) => (
            <li key={s.id}>
              {s.doneLabel}{" "}
              <span>
                · {summary.userName(s.doneBy) ?? "A teammate"}
                {s.doneAt ? `, ${formatStamp(s.doneAt)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** "Getting set up": the first-run checklist card on Home. */
export function SetupChecklist() {
  const summary = useSetupSummary();
  const me = useCurrentUser();
  const toast = useToast();
  const setHidden = usePrefsStore((s) => s.setSetupHidden);
  const { emailList } = useSetupActions();
  const awaiting = useApprovalPending();
  const isAdmin = me.role === "org_admin";
  const capReached = summary.earnedCredits >= EARN_CAP_CREDITS;
  // "Skip for now" is session-local (resets on reload); there is no per-user store for it yet.
  const [skipped, setSkipped] = useState<string[]>([]);
  // "Invite a teammate" shows its pending invites live from Realwired Admin.
  const { pending } = useOrgInvites();
  const steps = summary.steps.map((s) =>
    s.id === "invite" && !s.done && pending.length > 0
      ? {
          ...s,
          doing: {
            note:
              pending.length === 1
                ? `1 invite pending · ${pending[0].email}`
                : `${pending.length} invites pending`,
            href: INVITE_HREF,
          },
        }
      : s,
  );

  const hide = () => {
    setHidden(me.id, true);
    toast({
      title: "Setup guide hidden",
      description: "Reopen it from your user menu, under Setup guide.",
      tone: "neutral",
    });
  };

  const returning = summary.steps.some((s) => s.done);
  const pct = summary.total > 0 ? Math.round((summary.doneCount / summary.total) * 100) : 0;
  const orgName = useOrgStore((o) => o.org?.name);

  const isLocked = (s: DerivedStep) => awaiting && s.id === "first_review";
  const isBlocked = (s: DerivedStep) => !!s.adminOnly && !isAdmin;
  const showReward = (s: DerivedStep) => s.reward > 0 && !s.rewarded && !capReached;

  // Remaining steps in display order, skipped ones moved to the end.
  const remaining = steps.filter((s) => !s.done);
  const ordered = [
    ...remaining.filter((s) => !skipped.includes(s.id)),
    ...remaining.filter((s) => skipped.includes(s.id)),
  ];
  const actionable = ordered.filter((s) => !isLocked(s) && !isBlocked(s));
  const next = actionable.find((s) => !s.doing && s.action) ?? actionable.find((s) => s.doing) ?? actionable[0];
  const canSkip = !!next && actionable.length > 1;
  const idleTitle =
    awaiting && remaining.every((s) => isLocked(s) || isBlocked(s))
      ? "Your first report opens after approval"
      : `${summary.adminFirst ?? "Your admin"} can finish the rest`;

  return (
    <section className="card sc-card" id="setup" aria-labelledby="sc-title">
      <div className="sc-head">
        <div>
          <h2 className="sc-h" id="sc-title">
            {returning ? "Welcome back" : "Welcome"}, {me.firstName}
          </h2>
          <p className="sc-sub">
            {awaiting
              ? "You can do most of this while you wait."
              : `Finish setting up ${orgName ?? "your organization"}.`}
          </p>
        </div>
        <ActionMenu
          tooltip="Setup guide options"
          items={[
            { label: "Hide setup guide", icon: "eye-off", onClick: hide },
            { label: "Email me this list", icon: "mail", onClick: emailList },
          ]}
        />
      </div>

      <div className="sc-prog">
        <span
          className="sc-bar"
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={0}
          aria-valuemax={summary.total}
          aria-valuenow={summary.doneCount}
        >
          <i style={{ width: `${pct}%` }} />
        </span>
        <div className="sc-prog-meta">
          <span>
            <b>
              {summary.doneCount} of {summary.total}
            </b>{" "}
            steps done
          </span>
          {summary.earnedCredits > 0 ? (
            <span className="sc-earn is-on">
              <Icon name="coins" size={14} />
              {summary.earnedCredits} of {EARN_CAP_CREDITS} credits earned
            </span>
          ) : (
            <span className="sc-earn">Earn up to {EARN_CAP_CREDITS} credits</span>
          )}
        </div>
      </div>

      {remaining.length > 0 && (
        <UpNext
          key={next?.id ?? "idle"}
          step={next}
          showReward={!!next && showReward(next)}
          canSkip={canSkip}
          onSkip={() => next && setSkipped((k) => [...k, next.id])}
          idleTitle={idleTitle}
        />
      )}

      {GROUPS.map((g) => {
        const all = steps.filter((s) => s.group === g);
        const rows = ordered.filter((s) => s.group === g && s.id !== next?.id);
        if (rows.length === 0) return null;
        const doneInGroup = all.filter((s) => s.done).length;
        return (
          <div key={g}>
            <div className="sc-group">
              <span>{SETUP_GROUP_LABEL[g]}</span>
              <span className="sc-group-n">
                {doneInGroup} of {all.length}
              </span>
            </div>
            <div className="sc-list">
              {rows.map((s) => (
                <StepRow
                  key={s.id}
                  step={s}
                  isAdmin={isAdmin}
                  adminFirst={summary.adminFirst}
                  showReward={showReward(s)}
                  locked={isLocked(s)}
                />
              ))}
            </div>
          </div>
        );
      })}

      <DoneLine summary={summary} />
    </section>
  );
}
