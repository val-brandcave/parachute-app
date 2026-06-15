"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/atoms";
import { cn } from "@/lib/utils";
import {
  DateRangeCalendar,
  formatRange,
  type DateRange,
} from "./DateRangeCalendar";

export type { DateRange };

export type Period = "week" | "month" | "quarter" | "year" | "custom";

export const PERIOD_LABEL: Record<Period, string> = {
  week: "This week",
  month: "This month",
  quarter: "This quarter",
  year: "This year",
  custom: "Custom range",
};

/** The preset rows (custom is handled separately via the calendar). */
const PRESETS: Exclude<Period, "custom">[] = [
  "week",
  "month",
  "quarter",
  "year",
];

/** Resolves the display label, formatting the date range when custom. */
export function periodLabel(period: Period, range: DateRange | null): string {
  if (period === "custom" && range) return formatRange(range);
  return PERIOD_LABEL[period];
}

export function PeriodPicker({
  value,
  onChange,
  range = null,
  onRangeChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
  range?: DateRange | null;
  onRangeChange?: (r: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"list" | "calendar">("list");
  const [today] = useState(() => Date.now());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const isCustom = value === "custom" && !!range;

  // Opening always lands on the preset list; the calendar is an explicit step.
  const toggle = () => {
    setMode("list");
    setOpen((o) => !o);
  };

  return (
    <div className="periodpick" ref={ref}>
      <button className="periodpick-btn" onClick={toggle}>
        <Icon name={isCustom ? "calendar" : "checklist"} size={16} />
        {periodLabel(value, range)}
        <Icon name="chevron-down" size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className={cn(
              "periodpick-pop",
              mode === "calendar" && "periodpick-pop--cal",
            )}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
          >
            {mode === "list" ? (
              <>
                {PRESETS.map((p) => (
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
                <div className="periodpick-sep" />
                <button
                  className={cn(
                    "periodpick-item",
                    value === "custom" && "on",
                  )}
                  onClick={() => setMode("calendar")}
                >
                  <span className="periodpick-custom">
                    <Icon name="calendar" size={15} />
                    {isCustom ? formatRange(range!) : "Custom range"}
                  </span>
                  <Icon name="chevron-right" size={15} />
                </button>
              </>
            ) : (
              <DateRangeCalendar
                value={range}
                today={today}
                onCancel={() => setMode("list")}
                onApply={(r) => {
                  onRangeChange?.(r);
                  onChange("custom");
                  setOpen(false);
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
