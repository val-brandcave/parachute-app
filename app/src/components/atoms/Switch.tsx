"use client";

import { cn } from "@/lib/utils";

/** Accessible on/off switch. Canonical reusable toggle for settings rows.
 *  `size="sm"` is a compact variant for dense rows (e.g. the Builder section list). */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  ariaDisabled,
  describedBy,
  size = "md",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  /** Prefer `ariaDisabled` for actions (house rule); `disabled` stays for genuinely inert rows. */
  disabled?: boolean;
  /** Lock-then-explain: looks muted and announces aria-disabled but still fires onChange, so
   *  the caller can explain why (house rule: never `disabled` on an action). */
  ariaDisabled?: boolean;
  /** Id of the element carrying the reason (pair with ariaDisabled). */
  describedBy?: string;
  size?: "md" | "sm";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      aria-disabled={ariaDisabled || undefined}
      aria-describedby={describedBy}
      className={cn("ui-switch", size === "sm" && "ui-switch--sm", checked && "on", ariaDisabled && "is-locked")}
      onClick={() => onChange(!checked)}
    >
      <span className="ui-switch-thumb" />
    </button>
  );
}
