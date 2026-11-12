"use client";

import { cn } from "@/lib/utils";

/**
 * A selectable tile (call-slot times, plan choices). A toggle button with
 * `aria-pressed`, so a row of tiles reads as a set of choices.
 *
 * DS-candidate: SelectTile — @realwired/ui has no tile/choice-card component.
 */
export function SelectTile({
  selected,
  onSelect,
  children,
  tone = "default",
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  tone?: "default";
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn("ui-tile", `ui-tile--${tone}`, selected && "is-selected", className)}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {children}
    </button>
  );
}
