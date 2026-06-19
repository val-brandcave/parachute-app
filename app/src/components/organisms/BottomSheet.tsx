"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconButton } from "@/components/atoms";

// A bottom-up, near-full-height drawer — the app's standard surface for a
// focused task on top of a place (create/edit/preview that doesn't warrant its
// own route or a multi-step wizard). Slides up from the bottom, dims the page
// behind it. Use StepperModal for linear multi-step flows; route for places.
export function BottomSheet({
  open,
  onClose,
  title,
  eyebrow,
  footer,
  size = "tall",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  footer?: React.ReactNode;
  size?: "tall" | "half";
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ui-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className={`ui-sheet ui-sheet--${size}`}
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className="ui-sheet-grab" aria-hidden />
            <div className="ui-sheet-head">
              <div style={{ minWidth: 0 }}>
                {eyebrow && <div className="eyebrow">{eyebrow}</div>}
                <h2>{title}</h2>
              </div>
              <IconButton name="close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="ui-sheet-body scroll">{children}</div>
            {footer && <div className="ui-sheet-foot">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
