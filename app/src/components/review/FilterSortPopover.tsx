"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/atoms";
import { SEV_META } from "@/lib/utils";
import type { Severity } from "@/types";

export type Sort = "severity" | "page";
export type SevFilter = Severity | "all";

const SORTS: { value: Sort; label: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
  { value: "severity", label: "Severity", icon: "warn" },
  { value: "page", label: "Page order", icon: "book" },
];

const FILTERS: { value: SevFilter; label: string }[] = [
  { value: "all", label: "All findings" },
  { value: "crit", label: SEV_META.crit.label },
  { value: "fail", label: SEV_META.fail.label },
  { value: "flag", label: SEV_META.flag.label },
  { value: "pass", label: SEV_META.pass.label },
];

/**
 * Consolidated "Filter & sort" control — the toolbar collapses sort + severity
 * filter into one icon button + popover (a badge counts the active, non-default
 * choices). Portal + fixed positioning so a scroll container can't clip it; same
 * dismissal contract as `ActionMenu`.
 */
export function FilterSortPopover({
  sort,
  setSort,
  sevFilter,
  setSevFilter,
  counts,
}: {
  sort: Sort;
  setSort: (s: Sort) => void;
  sevFilter: SevFilter;
  setSevFilter: (s: SevFilter) => void;
  counts: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ right: number; top?: number; bottom?: number } | null>(null);

  const activeCount = (sevFilter !== "all" ? 1 : 0) + (sort !== "severity" ? 1 : 0);

  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const popH = popRef.current?.offsetHeight ?? 0;
    const margin = 8;
    const right = Math.max(margin, window.innerWidth - r.right);
    const flipUp = r.bottom + popH + margin > window.innerHeight && r.top - popH - margin > 0;
    setPos(flipUp ? { right, bottom: window.innerHeight - r.top + 6 } : { right, top: r.bottom + 6 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const dismiss = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);

  return (
    <div className="fm-fs" ref={wrapRef}>
      <button
        className={`ui-btn ui-btn--outline ui-btn--sm${activeCount ? " fm-fs-on" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name="filter" size={15} />
        Filter &amp; sort
        {activeCount > 0 && <span className="fm-fs-badge">{activeCount}</span>}
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={popRef}
                className="fm-fs-pop"
                role="menu"
                style={{ position: "fixed", ...(pos ?? { right: -9999, top: 0 }) }}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
              >
                <div className="fm-fs-group">
                  <div className="fm-fs-label">Sort by</div>
                  {SORTS.map((o) => (
                    <button
                      key={o.value}
                      className={`fm-fs-opt${sort === o.value ? " on" : ""}`}
                      onClick={() => setSort(o.value)}
                    >
                      <Icon name={o.icon} size={15} />
                      {o.label}
                      {sort === o.value && <Icon name="check" size={15} className="fm-fs-tick" />}
                    </button>
                  ))}
                </div>

                <div className="fm-fs-sep" />

                <div className="fm-fs-group">
                  <div className="fm-fs-label">Show severity</div>
                  {FILTERS.map((o) => (
                    <button
                      key={o.value}
                      className={`fm-fs-opt${sevFilter === o.value ? " on" : ""}`}
                      onClick={() => setSevFilter(o.value)}
                    >
                      {o.value !== "all" && (
                        <span className={`fm-fs-dot fm-fs-dot--${o.value}`} />
                      )}
                      {o.label}
                      <span className="fm-fs-count">
                        {o.value === "all"
                          ? Object.values(counts).reduce((a, b) => a + b, 0)
                          : counts[o.value] ?? 0}
                      </span>
                      {sevFilter === o.value && <Icon name="check" size={15} className="fm-fs-tick" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
