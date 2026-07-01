"use client";

import { useId, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring", stiffness: 520, damping: 42 } as const;

/**
 * Lifecycle/section tab bar. The active background is a single Framer pill that
 * slides between tabs via a shared `layoutId` (same pattern as the nav rail),
 * and tabs animate in/out + reflow with `layout` so hiding tabs (e.g. the queue
 * search hides empty tabs) feels smooth rather than a jump. `useId` scopes the
 * pill per instance so multiple tab bars on a page don't share one pill.
 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number; leading?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const pillId = useId();
  return (
    <div className="qtabs" role="tablist">
      <AnimatePresence initial={false} mode="popLayout">
        {tabs.map((t) => {
          const on = value === t.value;
          return (
            <motion.button
              key={t.value}
              layout
              role="tab"
              aria-selected={on}
              className={cn("qtab", on && "on")}
              onClick={() => onChange(t.value)}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={SPRING}
            >
              {on && (
                <motion.span
                  layoutId={pillId}
                  className="qtab-pill"
                  transition={SPRING}
                />
              )}
              {t.leading != null && <span className="qtab-lead">{t.leading}</span>}
              <span className="qtab-lb">{t.label}</span>
              {t.count != null && <span className="cnt">{t.count}</span>}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
