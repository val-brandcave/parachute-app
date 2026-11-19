"use client";

import { cloneElement, useId, type MouseEvent, type ReactElement } from "react";
import { Icon } from "@/components/atoms";
import { useLockStore, type LockReason } from "@/store/lock.store";

/** One-line reason for screen readers (aria-describedby). The dialog carries the full story. */
export function lockReasonText(reason: LockReason): string {
  switch (reason.kind) {
    case "approval":
      return "Opens once Realwired confirms your organization. Select to see why.";
    case "credits":
      return `Needs ${reason.needed} more ${reason.needed === 1 ? "credit" : "credits"}. Select to add credits.`;
    case "role":
      return `Only admins can ${reason.action}. Select to ask ${reason.admin}.`;
    case "needs-review":
      return "Run a review first. Select to see how.";
  }
}

type TriggerProps = {
  children?: React.ReactNode;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  "aria-disabled"?: boolean | "true" | "false";
  "aria-describedby"?: string;
};

/**
 * Lock-then-explain wrapper (spec §5.5). Keeps the trigger's look, adds a trailing 14 px
 * `lock` / `hourglass-high` glyph, `aria-disabled="true"` and `aria-describedby` (a visually
 * hidden reason, or `describedBy` when the caller already shows one). A click opens the lock
 * dialog with focus returning to the trigger. Never sets `disabled`.
 * // DS-candidate: LockedAction — extracted from the inline start-locked pattern in AppShell.
 */
export function LockedAction({
  reason,
  glyph,
  describedBy,
  children,
}: {
  reason: LockReason;
  glyph?: "lock" | "hourglass";
  describedBy?: string;
  children: ReactElement<TriggerProps>;
}) {
  const id = useId();
  const reasonId = describedBy ?? `${id}-reason`;
  const icon = (glyph ?? (reason.kind === "approval" ? "hourglass" : "lock")) === "hourglass" ? "hourglass-high" : "lock";
  const child = cloneElement(children, {
    "aria-disabled": "true",
    "aria-describedby": [children.props["aria-describedby"], reasonId].filter(Boolean).join(" "),
    onClick: (e: MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      useLockStore.getState().openLock(reason, { returnFocus: e.currentTarget });
    },
    children: (
      <>
        {children.props.children}
        <span className="locked-glyph" aria-hidden="true">
          <Icon name={icon} size={14} />
        </span>
      </>
    ),
  });
  return (
    <>
      {child}
      {!describedBy && (
        <span id={reasonId} className="ui-visually-hidden">
          {lockReasonText(reason)}
        </span>
      )}
    </>
  );
}
