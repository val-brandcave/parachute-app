"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring", stiffness: 520, damping: 42 } as const;

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const thumbId = useId();
  return (
    <div className="ui-seg" role="tablist">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
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
          </button>
        );
      })}
    </div>
  );
}
