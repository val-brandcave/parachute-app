"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/atoms";
import { SegmentedControl } from "@/components/molecules";
import type { ResponseTemplate, TemplateScope } from "@/types";

/**
 * Response-template picker — the composer's "Insert template" dropdown. A
 * portal popover (same escape pattern as `ActionMenu`: fixed position from the
 * trigger rect, flips/clamps to the viewport, dismiss on outside-click / Esc /
 * scroll / resize) so a card's `overflow` never clips it. Two scopes (the org
 * library vs. the reviewer's own voice), grouped by template group. Picking one
 * hands the raw body up; the composer fills its merge fields.
 */
export function ResponseTemplatePicker({
  responses,
  onPick,
}: {
  responses: ResponseTemplate[];
  onPick: (t: ResponseTemplate) => void;
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<TemplateScope>("org");
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  const groups = useMemo(() => {
    const inScope = responses.filter((r) => r.scope === scope);
    const byGroup = new Map<string, ResponseTemplate[]>();
    inScope.forEach((r) => {
      const arr = byGroup.get(r.group) ?? [];
      arr.push(r);
      byGroup.set(r.group, arr);
    });
    return [...byGroup.entries()];
  }, [responses, scope]);

  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const popH = popRef.current?.offsetHeight ?? 0;
    const margin = 8;
    const width = Math.max(320, r.width);
    const left = Math.min(r.left, window.innerWidth - width - margin);
    const flipUp =
      r.bottom + popH + margin > window.innerHeight && r.top - popH - margin > 0;
    setPos(
      flipUp
        ? { left, width, bottom: window.innerHeight - r.top + 6 }
        : { left, width, top: r.bottom + 6 },
    );
  }, [open, scope, groups.length]);

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
    <div className="rtpick" ref={wrapRef}>
      <button
        type="button"
        className="rtpick-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name="ai" size={15} />
        Insert response template
        <Icon name="chevron-down" size={15} />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={popRef}
                className="rtpick-pop"
                role="menu"
                style={{ position: "fixed", ...(pos ?? { left: -9999, top: 0, width: 320 }) }}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
              >
                <div className="rtpick-head">
                  <SegmentedControl
                    options={[
                      { value: "org", label: "Org library" },
                      { value: "mine", label: "My voice" },
                    ]}
                    value={scope}
                    onChange={setScope}
                  />
                </div>
                <div className="rtpick-list scroll">
                  {groups.map(([group, items]) => (
                    <div key={group} className="rtpick-group">
                      <div className="rtpick-grouph">{group}</div>
                      {items.map((t) => (
                        <button
                          key={t.id}
                          role="menuitem"
                          className="rtpick-item"
                          onClick={() => {
                            onPick(t);
                            setOpen(false);
                          }}
                        >
                          <span className="rtpick-name">{t.name}</span>
                          <span className="rtpick-body">{t.body}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                  {groups.length === 0 && (
                    <div className="rtpick-empty">No templates in this set.</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
