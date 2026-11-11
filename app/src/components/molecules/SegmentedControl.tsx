"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { dur, useMotionMode } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring", stiffness: 520, damping: 42 } as const;

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  block,
  label,
  press = false,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  /** Fill the available width, splitting evenly. */
  block?: boolean;
  /** Accessible name for the group. */
  label?: string;
  /**
   * Tactile press: the segment scales to 0.97 for `dur.quick` while pressed (full motion only).
   * DS-candidate: SegmentedControl `press` — @realwired/ui has no segmented control.
   */
  press?: boolean;
}) {
  const thumbId = useId();
  const mode = useMotionMode();
  const pressable = press && mode === "full";
  return (
    <div className={cn("ui-seg", block && "ui-seg--block")} role="tablist" aria-label={label}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <motion.button
            type="button"
            key={o.value}
            whileTap={pressable ? { scale: 0.97 } : undefined}
            transition={{ duration: dur.quick }}
            role="tab"
            aria-selected={on}
            className={cn(on && "on")}
            onClick={() => onChange(o.value)}
          >
            {on && (
              <motion.span
                layoutId={thumbId}
                className="ui-seg-thumb"
                transition={SPRING}
              />
            )}
            <span className="ui-seg-lb">{o.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
