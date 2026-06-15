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
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: Side;
  block?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = () => {
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
                className={`ui-tip ui-tip--${side}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                role="tooltip"
                style={{ position: "fixed", left: pos.x, top: pos.y, transform }}
              >
                {content}
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
