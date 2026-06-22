"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/atoms";
import type { ResponseTemplate } from "@/types";

// Master pane: response templates grouped by disposition, with a short body
// preview. Groups are independently collapsible accordions with a count badge;
// the selected row carries the active treatment. After a save the list opens
// the saved row's group, scrolls it into view, and pulses it.
export function ResponseList({
  groups,
  selectedId,
  onSelect,
  savedTick = 0,
}: {
  groups: { group: string; items: ResponseTemplate[] }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  savedTick?: number;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const rowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // React to a save: make sure the saved row's group is open, scroll it into
  // view, and pulse it. setState/scroll run inside rAF (not synchronously in
  // the effect body) and the scroll waits a frame so the expanded row exists.
  useEffect(() => {
    if (!savedTick || !selectedId) return;
    const id = selectedId;
    const group = groups.find((g) => g.items.some((t) => t.id === id))?.group;
    const raf1 = requestAnimationFrame(() => {
      if (group) {
        setCollapsed((prev) => {
          if (!prev.has(group)) return prev;
          const next = new Set(prev);
          next.delete(group);
          return next;
        });
      }
      requestAnimationFrame(() => {
        const el = rowRefs.current.get(id);
        if (!el) return;
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        el.classList.remove("flash");
        void el.offsetWidth; // restart the animation
        el.classList.add("flash");
      });
    });
    return () => cancelAnimationFrame(raf1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedTick]);

  if (!groups.length) {
    return (
      <div className="resp-list-empty text-secondary">
        No templates here yet. Use “New template” to add one.
      </div>
    );
  }

  const toggle = (group: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  return (
    <div className="resp-list">
      {groups.map(({ group, items }) => {
        const open = !collapsed.has(group);
        return (
          <div key={group} className="resp-group">
            <button
              type="button"
              className="resp-acc-h"
              aria-expanded={open}
              onClick={() => toggle(group)}
            >
              <Icon
                name="chevron-down"
                size={15}
                className={`resp-acc-caret${open ? "" : " closed"}`}
              />
              <span className="resp-acc-name">{group}</span>
              <span className="resp-acc-count">{items.length}</span>
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{ overflow: "hidden" }}
                >
                  {items.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      ref={(el) => {
                        if (el) rowRefs.current.set(t.id, el);
                        else rowRefs.current.delete(t.id);
                      }}
                      className={`resp-row${t.id === selectedId ? " sel" : ""}`}
                      onClick={() => onSelect(t.id)}
                    >
                      <span className="resp-row-name">{t.name}</span>
                      <span className="resp-row-prev">{t.body.slice(0, 78)}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
