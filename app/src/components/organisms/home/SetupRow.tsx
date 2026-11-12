"use client";

import { useId, type MouseEvent } from "react";
import Link from "next/link";
import { useToast } from "@realwired/ui";
import { Icon, type IconName } from "@/components/atoms";
import { useCurrentUser } from "@/lib/current-user";
import { INVITE_HREF } from "@/lib/setup-steps";
import { cn, formatShortDate } from "@/lib/utils";
import { useLockStore, useOrgInvites, useOrgStore, useUsersStore, type DerivedStep, type SetupSummary } from "@/store";
import { useFirstOwnReview } from "./useFirstOwnReview";
import { useStartGate } from "./useStartGate";

/** "Upload an appraisal to start your first review" → bold "Upload an appraisal" + the rest (board copy). */
const LEAD_SPLIT = /\s(?=(?:so|for|with|to start|to learn)\s)/;
function splitCopy(text: string): [string, string] {
  const m = LEAD_SPLIT.exec(text);
  return m ? [text.slice(0, m.index), text.slice(m.index)] : [text, ""];
}

/** "Marcus Ortiz joined on Nov 11": the newest accepted invite, else the newest other teammate. */
function useJoinedLine(step: DerivedStep): string | undefined {
  const { invites } = useOrgInvites();
  const users = useUsersStore((s) => s.users);
  if (step.id !== "invite" || !step.done) return undefined;
  const accepted = invites.filter((i) => i.status === "accepted").sort((a, b) => (b.acceptedAt ?? 0) - (a.acceptedAt ?? 0))[0];
  if (accepted) {
    const name = users.find((u) => u.id === accepted.acceptedUserId)?.name ?? accepted.inviteeName ?? accepted.email;
    return `${name} joined on ${formatShortDate(accepted.acceptedAt ?? step.doneAt ?? accepted.sentAt)}`;
  }
  const mate = users.find((u) => u.id !== step.doneBy && u.role === "reviewer") ?? users.find((u) => u.id !== step.doneBy);
  if (!mate) return undefined;
  return step.doneAt ? `${mate.name} joined on ${formatShortDate(step.doneAt)}` : `${mate.name} joined`;
}

type RowAction =
  | { kind: "link"; label: string; href: string }
  | { kind: "lock"; label: string; reason: string; icon: IconName; open: (el: HTMLElement) => void }
  | { kind: "ask"; label: string; onClick: () => void }
  | { kind: "none" };

/**
 * One step row: a check, the board copy (bold lead) with an optional meta line, and its
 * button, always visible at rest. `primary` = the section's first not-done row (navy);
 * the rest are outline. Locked rows keep their button (`aria-disabled` + reason) and the
 * click opens the lock dialog; admin-only rows read "Ask <admin>" for other roles.
 */
export function SetupRow({ step, primary, summary }: { step: DerivedStep; primary: boolean; summary: SetupSummary }) {
  const me = useCurrentUser();
  const toast = useToast();
  const gate = useStartGate();
  const review = useFirstOwnReview();
  const orgName = useOrgStore((s) => s.org?.name);
  const openLock = useLockStore((s) => s.openLock);
  const joined = useJoinedLine(step);
  const reasonId = useId();

  const isAdmin = me.role === "org_admin";
  const admin = summary.adminFirst ?? "your admin";
  const [lead, rest] = splitCopy(step.descText);
  const reviewHref = review ? `/reviews/${review.id}` : "/reviews";

  const meta = step.done
    ? step.id === "first_review"
      ? review?.propertyAddress
      : step.id === "invite"
        ? joined
        : [summary.userName(step.doneBy), step.doneAt ? formatShortDate(step.doneAt) : null].filter(Boolean).join(", ")
    : step.doing?.note;

  const action = ((): RowAction => {
    const label = step.actionResolved?.label ?? step.label;
    // Enterprise waiting on its call: the whole first section is held (spec §5.2 board 9).
    if (summary.pending && step.section === "first_review") {
      return {
        kind: "lock",
        label: step.done && step.continueLabel ? step.continueLabel : label,
        reason: `Opens when ${orgName ?? "your organization"} is confirmed`,
        icon: "hourglass-high",
        open: (el) => openLock({ kind: "approval" }, { returnFocus: el }),
      };
    }
    if (step.done) {
      if (step.id === "first_review") return { kind: "link", label: step.continueLabel ?? "Open review", href: reviewHref };
      if (step.id === "invite")
        return isAdmin ? { kind: "link", label: step.continueLabel ?? "Manage team", href: INVITE_HREF } : { kind: "none" };
      if (step.adminOnly && !isAdmin) return { kind: "none" };
    } else if (step.adminOnly && !isAdmin) {
      return {
        kind: "ask",
        label: `Ask ${admin}`,
        onClick: () =>
          toast({
            title: `${admin} gets your note`,
            description: `We asked ${admin} to ${step.label.charAt(0).toLowerCase()}${step.label.slice(1)}.`,
            tone: "success",
          }),
      };
    }
    // Every "Upload appraisal" row is a Start site (§5.5).
    if (step.startsReview && !step.done && gate.locked) {
      return {
        kind: "lock",
        label,
        reason: gate.reasonText,
        icon: "hourglass-high",
        open: (el) => openLock({ kind: "approval" }, { returnFocus: el }),
      };
    }
    if (step.id === "tutorial" || step.id === "sign_workbook") {
      if (!review && !step.done) {
        return {
          kind: "lock",
          label,
          reason: "Run a review first",
          icon: "lock",
          open: (el) => openLock({ kind: "role", action: "Run a review first", admin }, { returnFocus: el }),
        };
      }
      return { kind: "link", label, href: step.id === "tutorial" ? `${reviewHref}?tour=first-review` : reviewHref };
    }
    if (!step.done && step.doing) {
      return { kind: "link", label: step.continueLabel ?? "Continue", href: step.doing.href ?? step.actionResolved?.href ?? "/dashboard" };
    }
    return step.actionResolved ? { kind: "link", label, href: step.actionResolved.href } : { kind: "none" };
  })();

  const filled = primary && !step.done && action.kind === "link";
  const btn = cn("ui-btn ui-btn--sm", filled ? "ui-btn--primary" : "ui-btn--outline");

  return (
    <li className={cn("gs-row", step.done && "is-done", step.doing && !step.done && "is-doing")}>
      <span className={cn("gs-cb", step.done && "is-on")} aria-hidden="true">
        {step.done && <Icon name="check" size={13} strokeWidth={2.8} />}
      </span>
      <div className="gs-row-tx">
        <span className="gs-row-copy">
          {step.done && <span className="ui-visually-hidden">Done: </span>}
          <b>{lead}</b>
          {rest}
        </span>
        {meta && <span className="gs-row-note">{meta}</span>}
      </div>
      <div className="gs-row-act">
        {action.kind === "link" && (
          <Link href={action.href} className={btn}>
            {action.label}
          </Link>
        )}
        {action.kind === "lock" && (
          <>
            <button
              type="button"
              className={cn(btn, "gs-row-locked")}
              aria-disabled="true"
              aria-describedby={reasonId}
              onClick={(e: MouseEvent<HTMLButtonElement>) => action.open(e.currentTarget)}
            >
              {action.label}
              <span aria-hidden="true" className="gs-row-lockic">
                <Icon name={action.icon} size={14} />
              </span>
            </button>
            <span id={reasonId} className="ui-visually-hidden">
              {action.reason}
            </span>
          </>
        )}
        {action.kind === "ask" && (
          <button type="button" className={btn} onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
    </li>
  );
}
