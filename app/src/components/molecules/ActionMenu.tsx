"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, Tooltip, type IconName } from "@/components/atoms";

export type ActionItem = {
  label?: string;
  icon?: IconName;
  onClick?: () => void;
  danger?: boolean;
  /** Radio/checkbox-style option — reserves a check gutter; shows a tick when true. */
  selected?: boolean;
  /** Keep the menu open after clicking (multi-toggle checkbox menus). */
  keepOpen?: boolean;
  /** Render a hairline separator instead of a button (label/onClick ignored). */
  divider?: boolean;
  /** Render a small non-clickable section header. */
  header?: boolean;
  /** A second, muted line under the label (icon + name + "what it does" cards). */
  description?: string;
  /** Non-clickable, dimmed — e.g. a singleton section already in the document. */
  disabled?: boolean;
};

/**
 * The ⋯ overflow menu. The popover renders in a PORTAL with fixed positioning
 * derived from the trigger's rect (right-aligned, flips above when it would
 * overflow the viewport bottom) — so it is never clipped by an ancestor's
 * `overflow: hidden/auto` (cards, table cells, scroll containers). Same escape
 * pattern as `Tooltip`/`Modal`. Closes on outside click, Escape, scroll, resize.
 */
export function ActionMenu({
  items,
  tooltip,
  trigger,
  menuClassName,
}: {
  items: ActionItem[];
  /** When set, the ⋯ trigger gets a hover tooltip (and this as its aria-label). */
  tooltip?: string;
  /** Replace the default ⋯ trigger. Given the live `open` state + a `toggle`,
   *  so callers can render any control (a "Change" pill, a field row, …) and
   *  reflect the open state without re-implementing the portal/dismiss logic. */
  trigger?: (o: { open: boolean; toggle: () => void }) => ReactNode;
  /** Extra class on the popover (e.g. a wider min-width for long option labels). */
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null); // in-flow trigger wrapper
  const popRef = useRef<HTMLDivElement>(null); // portaled popover
  const [pos, setPos] = useState<{
    right: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  // Position from the trigger rect, before paint (no flash). Right-align the
  // menu's right edge to the trigger; flip upward if it would spill past the
  // viewport bottom and there's room above.
  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const popH = popRef.current?.offsetHeight ?? 0;
    const margin = 8;
    const right = Math.max(margin, window.innerWidth - r.right);
    const flipUp =
      r.bottom + popH + margin > window.innerHeight && r.top - popH - margin > 0;
    setPos(
      flipUp
        ? { right, bottom: window.innerHeight - r.top + 6 }
        : { right, top: r.bottom + 6 },
    );
  }, [open]);

  // Dismissal. Outside-click must account for the portaled popover (it's not a
  // DOM descendant of the trigger wrapper). Scroll/resize close it, since a
  // fixed popover would otherwise detach from its trigger.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const dismiss = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    // capture phase so scrolls inside nested containers are caught too.
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);

  const toggle = () => setOpen((o) => !o);

  const defaultTrigger = (
    <button
      className="ui-iconbtn"
      onClick={toggle}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={tooltip ?? "More options"}
    >
      <Icon name="more" size={18} />
    </button>
  );

  return (
    <div className="ui-menu" ref={wrapRef}>
      {trigger ? (
        trigger({ open, toggle })
      ) : tooltip ? (
        <Tooltip content={tooltip} compact disabled={open}>
          {defaultTrigger}
        </Tooltip>
      ) : (
        defaultTrigger
      )}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={popRef}
                className={"ui-menu-pop" + (menuClassName ? ` ${menuClassName}` : "")}
                role="menu"
                // Until measured, park offscreen (invisible anyway via opacity 0)
                // so the first commit can't show an unpositioned flash.
                style={{ position: "fixed", ...(pos ?? { right: -9999, top: 0 }) }}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
              >
                {items.map((it, idx) => {
                  if (it.divider)
                    return <div key={`sep-${idx}`} className="ui-menu-sep" />;
                  if (it.header)
                    return (
                      <div key={`hdr-${idx}`} className="ui-menu-header">
                        {it.label}
                      </div>
                    );
                  return (
                    <button
                      key={it.label ?? `item-${idx}`}
                      role="menuitem"
                      className={cnItem(it.danger, it.description)}
                      disabled={it.disabled}
                      onClick={() => {
                        it.onClick?.();
                        if (!it.keepOpen) setOpen(false);
                      }}
                    >
                      {it.selected !== undefined ? (
                        <span className="ui-menu-check">
                          {it.selected && <Icon name="check" size={15} />}
                        </span>
                      ) : (
                        it.icon && <Icon name={it.icon} size={16} />
                      )}
                      {it.description ? (
                        <span className="ui-menu-item-body">
                          <span className="ui-menu-item-label">{it.label}</span>
                          <span className="ui-menu-item-desc">{it.description}</span>
                        </span>
                      ) : (
                        it.label
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

function cnItem(danger?: boolean, description?: string) {
  return (
    "ui-menu-item" +
    (danger ? " danger" : "") +
    (description ? " ui-menu-item--rich" : "")
  );
}
