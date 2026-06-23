"use client";

import { cn } from "@/lib/utils";

/** Accessible on/off switch. Canonical reusable toggle for settings rows.
 *  `size="sm"` is a compact variant for dense rows (e.g. the Builder section list). */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  size = "md",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: "md" | "sm";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={cn("ui-switch", size === "sm" && "ui-switch--sm", checked && "on")}
      onClick={() => onChange(!checked)}
    >
      <span className="ui-switch-thumb" />
    </button>
  );
}
