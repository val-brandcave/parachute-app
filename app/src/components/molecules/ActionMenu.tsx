"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, type IconName } from "@/components/atoms";

export type ActionItem = {
  label: string;
  icon?: IconName;
  onClick: () => void;
  danger?: boolean;
};

export function ActionMenu({ items }: { items: ActionItem[] }) {
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
    <div className="ui-menu" ref={ref}>
      <button
        className="ui-iconbtn"
        onClick={() => setOpen((o) => !o)}
        aria-label="More options"
      >
        <Icon name="more" size={18} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="ui-menu-pop"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
          >
            {items.map((it) => (
              <button
                key={it.label}
                className={cnItem(it.danger)}
                onClick={() => {
                  it.onClick();
                  setOpen(false);
                }}
              >
                {it.icon && <Icon name={it.icon} size={16} />}
                {it.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cnItem(danger?: boolean) {
  return "ui-menu-item" + (danger ? " danger" : "");
}
