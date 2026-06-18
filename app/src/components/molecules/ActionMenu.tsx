"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, Tooltip, type IconName } from "@/components/atoms";

export type ActionItem = {
  label?: string;
  icon?: IconName;
  onClick?: () => void;
  danger?: boolean;
  /** Radio/checkbox-style option — reserves a check gutter; shows a tick when true. */
  selected?: boolean;
  /** Render a hairline separator instead of a button (label/onClick ignored). */
  divider?: boolean;
  /** Render a small non-clickable section header. */
  header?: boolean;
};

export function ActionMenu({
  items,
  tooltip,
}: {
  items: ActionItem[];
  /** When set, the ⋯ trigger gets a hover tooltip (and this as its aria-label). */
  tooltip?: string;
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

  const trigger = (
    <button
      className="ui-iconbtn"
      onClick={() => setOpen((o) => !o)}
      aria-label={tooltip ?? "More options"}
    >
      <Icon name="more" size={18} />
    </button>
  );

  return (
    <div className="ui-menu" ref={ref}>
      {tooltip ? (
        <Tooltip content={tooltip} compact disabled={open}>
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            className="ui-menu-pop"
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
                  className={cnItem(it.danger)}
                  onClick={() => {
                    it.onClick?.();
                    setOpen(false);
                  }}
                >
                  {it.selected !== undefined ? (
                    <span className="ui-menu-check">
                      {it.selected && <Icon name="check" size={15} />}
                    </span>
                  ) : (
                    it.icon && <Icon name={it.icon} size={16} />
                  )}
                  {it.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cnItem(danger?: boolean) {
  return "ui-menu-item" + (danger ? " danger" : "");
}
