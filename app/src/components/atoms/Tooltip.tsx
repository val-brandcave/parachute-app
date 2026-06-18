"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "./Icon";

type Side = "top" | "right";

/**
 * Hover/focus tooltip rendered in a portal with fixed positioning, so it is
 * never clipped by ancestor `overflow: hidden` (stat bar, nav rail, cells…).
 */
export function Tooltip({
  content,
  children,
  side = "top",
  block = false,
  panel = false,
  disabled = false,
  compact = false,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: Side;
  block?: boolean;
  /** Light token-driven surface for rich content (vs. the default dark label tip). */
  panel?: boolean;
  /** Keep the wrapper (layout stays put) but never show the tip — used for
   *  truncation-only tooltips that enable just when text is clipped. */
  disabled?: boolean;
  /** Minimal label chip: smaller, quick fade only (no rise/scale). For
   *  icon-button labels like "More options" / "Download". */
  compact?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = () => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (side === "right") {
      setPos({ x: r.right + 12, y: r.top + r.height / 2 });
    } else {
      const x = Math.min(Math.max(r.left + r.width / 2, 130), window.innerWidth - 130);
      setPos({ x, y: r.top - 10 });
    }
  };
  const hide = () => setPos(null);

  const transform =
    side === "right" ? "translateY(-50%)" : "translate(-50%, -100%)";

  // Directional entrance offset — animated on the INNER bubble only (the outer
  // wrapper owns the centering transform), so we never fight Framer's transform.
  const from = side === "right" ? { x: -5 } : { y: 5 };
  const fromExit = side === "right" ? { x: -3 } : { y: 3 };

  return (
    <span
      ref={ref}
      className="ui-tip-wrap"
      style={block ? { display: "block" } : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
    >
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {pos && (
              <motion.span
                className="ui-tip-pos"
                style={{ position: "fixed", left: pos.x, top: pos.y, transform }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                role="tooltip"
              >
                <motion.span
                  className={`ui-tip ui-tip--${side}${panel ? " ui-tip--panel" : ""}${
                    compact ? " ui-tip--compact" : ""
                  }`}
                  initial={compact ? { opacity: 0 } : { opacity: 0, scale: 0.96, ...from }}
                  animate={compact ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0, y: 0 }}
                  exit={compact ? { opacity: 0 } : { opacity: 0, scale: 0.98, ...fromExit }}
                  transition={
                    compact
                      ? { duration: 0.09 }
                      : { type: "spring", stiffness: 560, damping: 34, mass: 0.7 }
                  }
                >
                  {content}
                </motion.span>
              </motion.span>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </span>
  );
}

/** The ⓘ info trigger used next to labels. */
export function InfoTip({ content }: { content: React.ReactNode }) {
  return (
    <Tooltip content={content}>
      <span className="ui-infotip" aria-label="More info">
        <Icon name="info" size={13} />
      </span>
    </Tooltip>
  );
}
