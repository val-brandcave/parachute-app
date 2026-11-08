"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@realwired/ui";
import { Icon } from "@/components/atoms";
import { ActionMenu } from "@/components/molecules";
import { useCurrentUser } from "@/lib/current-user";
import { EARN_CAP_CREDITS, costFor } from "@/lib/pricing";
import {
  FULL_REVIEW_TYPES,
  SETUP_GROUP_LABEL,
  type SetupGroup,
} from "@/lib/setup-steps";
import { cn, formatStamp } from "@/lib/utils";
import { INVITE_HREF } from "@/lib/setup-steps";
import { useOrgInvites, usePrefsStore, useSetupSummary, type DerivedStep, type SetupSummary } from "@/store";
import { useSetupActions } from "./useSetupActions";

const GROUPS: SetupGroup[] = ["first", "team"];

/** The credit/cost pill on a step row's right-hand side. */
function SidePill({ step, capReached }: { step: DerivedStep; capReached: boolean }) {
  if (step.doing) return <span className="su-pill su-pill--doing">In progress</span>;
  switch (step.side) {
    case "free":
      return <span className="su-pill su-pill--outline">Free</span>;
    case "cost":
      return <span className="su-pill su-pill--cost">{costFor(FULL_REVIEW_TYPES)} credits</span>;
    case "reward":
      return capReached ? (
        <span className="su-pill su-pill--outline">No credit</span>
      ) : (
        <span className="su-pill su-pill--earn">+{step.reward} credit</span>
      );
    case "none":
      return <span className="su-pill su-pill--outline">No credit</span>;
    case "tick":
      return <span className="su-pill su-pill--outline">Tick only</span>;
  }
}

function StepRow({
  step,
  isNext,
  isAdmin,
  adminFirst,
  capReached,
}: {
  step: DerivedStep;
  isNext: boolean;
  isAdmin: boolean;
  adminFirst: string | null;
  capReached: boolean;
}) {
  const router = useRouter();
  const { playVideo, openDoc } = useSetupActions();
  const action = step.doing
    ? { label: step.continueLabel ?? "Continue", href: step.doing.href ?? step.action?.href ?? "/dashboard" }
    : step.action;
  const blocked = !!step.adminOnly && !isAdmin;

  return (
    <div className={cn("su-row", isNext && "is-next", step.doing && "is-doing")}>
      <span className="su-ico" aria-hidden="true">
        <Icon name="check" size={13} strokeWidth={3} />
      </span>
      <div className="su-body">
        <div className="su-title">
          {step.label}
          {isNext && <span className="su-tag">Next</span>}
        </div>
        <div className="su-desc">{step.descText}</div>
        <div className="su-meta">
          {step.doing ? (
            <span className="su-meta-doing">
              <Icon name={step.side === "tick" ? "clock" : "edit"} size={13} />
              {step.doing.note}
            </span>
          ) : (
            <span>
              <Icon name="clock" size={13} />~{step.minutes} min
            </span>
          )}
          {!step.doing && step.video && (
            <button type="button" className="su-link" onClick={() => playVideo(step.video!.label)}>
              <Icon name="play" size={13} />
              {step.video.label} · {step.video.length}
            </button>
          )}
          {!step.doing && step.doc && (
            <button
              type="button"
              className="su-link"
              onClick={() => (step.doc!.kind === "pack" ? router.push("/configure/security") : openDoc(step.doc!.label))}
            >
              <Icon name={step.doc.kind === "pack" ? "document" : "download"} size={13} />
              {step.doc.label}
            </button>
          )}
        </div>
      </div>
      <div className="su-side">
        <SidePill step={step} capReached={capReached} />
        {action &&
          (blocked ? (
            <span className="su-ask">Ask {adminFirst ?? "your admin"}</span>
          ) : (
            <Link
              href={action.href}
              className={cn("ui-btn ui-btn--sm", isNext ? "ui-btn--primary" : "ui-btn--outline")}
            >
              {action.label}
            </Link>
          ))}
      </div>
    </div>
  );
}

function DoneLine({ summary }: { summary: SetupSummary }) {
  const [open, setOpen] = useState(false);
  const doneSteps = summary.steps.filter((s) => s.done);
  const who = Array.from(
    new Set([summary.account.by, ...doneSteps.map((s) => s.doneBy)].filter(Boolean) as string[]),
  )
    .map((id) => summary.userName(id))
    .filter(Boolean);

  if (doneSteps.length === 0) {
    return (
      <div className="su-done">
        <Icon name="check" size={15} strokeWidth={2.4} />
        <span className="su-done-text">
          <b>Account created</b>{" "}
          <span className="su-faint">
            · {summary.userName(summary.account.by) ?? "You"}, {formatStamp(summary.account.doneAt)}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="su-done su-done--wrap">
      <Icon name="check" size={15} strokeWidth={2.4} />
      <div className="su-done-text">
        <div>
          <b>Account created</b>
          {doneSteps.map((s) => (
            <span key={s.id}>
              <span className="su-faint"> · </span>
              <b>{s.doneLabel}</b>
              {s.rewarded && <span className="su-pill su-pill--earn su-pill--xs">+{s.reward}</span>}
            </span>
          ))}
        </div>
        <div className="su-faint">· by {who.join(", ")}</div>
        {open && (
          <ul className="su-done-list">
            <li>
              Account created · {summary.userName(summary.account.by) ?? "You"}, {formatStamp(summary.account.doneAt)}
            </li>
            {doneSteps.map((s) => (
              <li key={s.id}>
                {s.doneLabel} · {summary.userName(s.doneBy) ?? "A teammate"}
                {s.doneAt ? `, ${formatStamp(s.doneAt)}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" className="su-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide" : "Show"}
        <Icon name="chevron-down" size={14} className={cn("su-toggle-ic", open && "is-open")} />
      </button>
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
  const isAdmin = me.role === "org_admin";
  const capReached = summary.earnedCredits >= EARN_CAP_CREDITS;
  const anyDone = summary.steps.some((s) => s.done);
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

  return (
    <section className="card su-card" aria-labelledby="su-title">
      <div className="su-head">
        <h2 className="su-h" id="su-title">
          Getting set up
        </h2>
        <div className="su-head-end">
          {anyDone ? (
            <span>
              {summary.doneCount} of {summary.total} done ·{" "}
              <span className="su-pill su-pill--earn su-pill--sm">+{summary.earnedCredits} credit{summary.earnedCredits === 1 ? "" : "s"}</span>{" "}
              earned of up to +{EARN_CAP_CREDITS}
            </span>
          ) : (
            <span>
              Earn up to <span className="su-pill su-pill--earn su-pill--sm">+{EARN_CAP_CREDITS} credits</span> for setup
            </span>
          )}
          <ActionMenu
            tooltip="Setup guide options"
            items={[
              { label: "Hide setup guide", icon: "eye-off", onClick: hide },
              { label: "Email me this list", icon: "mail", onClick: emailList },
            ]}
          />
        </div>
      </div>

      <DoneLine summary={summary} />

      {GROUPS.map((g) => {
        const all = steps.filter((s) => s.group === g);
        const left = all.filter((s) => !s.done);
        if (left.length === 0) return null;
        const doneInGroup = all.length - left.length;
        const nextId = left.find((s) => !s.doing)?.id;
        return (
          <div key={g}>
            <div className="su-group">
              <span>{SETUP_GROUP_LABEL[g]}</span>
              <span className="su-group-n">{doneInGroup === 0 ? `0 of ${all.length}` : `${left.length} left`}</span>
            </div>
            {left.map((s) => (
              <StepRow
                key={s.id}
                step={s}
                isNext={s.id === nextId}
                isAdmin={isAdmin}
                adminFirst={summary.adminFirst}
                capReached={capReached}
              />
            ))}
          </div>
        );
      })}
    </section>
  );
}
