"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/atoms";

export type AttFilter = "all" | "attention" | "pending" | "attested";

const FILTERS: { value: AttFilter; label: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
  { value: "all", label: "All items", icon: "checklist" },
  { value: "attention", label: "Needs attention", icon: "flag" },
  { value: "pending", label: "Pending", icon: "clock" },
  { value: "attested", label: "Attested", icon: "check-circle" },
];

/**
 * The Administrative "Show" filter — the attestation equivalent of the Findings
 * Filter-&-sort popover (same `.fm-fs-*` shell, portal + fixed positioning so a
 * scroll container can't clip it). One axis only (no sort): All · Needs
 * attention · Pending · Attested, each with a live count; the badge shows when a
 * non-default filter is active.
 */
export function AttestFilterPopover({
  filter,
  setFilter,
  counts,
}: {
  filter: AttFilter;
  setFilter: (f: AttFilter) => void;
  counts: Record<AttFilter, number>;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ right: number; top?: number; bottom?: number } | null>(null);

  const activeCount = filter !== "all" ? 1 : 0;

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
        Show
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
                  <div className="fm-fs-label">Show items</div>
                  {FILTERS.map((o) => (
                    <button
                      key={o.value}
                      className={`fm-fs-opt${filter === o.value ? " on" : ""}`}
                      onClick={() => {
                        setFilter(o.value);
                        setOpen(false);
                      }}
                    >
                      <Icon name={o.icon} size={15} />
                      {o.label}
                      <span className="fm-fs-count">{counts[o.value]}</span>
                      {filter === o.value && <Icon name="check" size={15} className="fm-fs-tick" />}
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
