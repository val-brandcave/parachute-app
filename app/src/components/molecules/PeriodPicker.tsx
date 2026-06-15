"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type Period = "week" | "month" | "quarter" | "year";

export const PERIOD_LABEL: Record<Period, string> = {
  week: "This week",
  month: "This month",
  quarter: "This quarter",
  year: "This year",
};

export function PeriodPicker({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="periodpick" ref={ref}>
      <button className="periodpick-btn" onClick={() => setOpen((o) => !o)}>
        <Icon name="checklist" size={16} />
        {PERIOD_LABEL[value]}
        <Icon name="chevron-down" size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="periodpick-pop"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
          >
            {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
              <button
                key={p}
                className={cn("periodpick-item", value === p && "on")}
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
              >
                {PERIOD_LABEL[p]}
                {value === p && <Icon name="check" size={15} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
