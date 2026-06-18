"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
  const tipRef = useRef<HTMLSpanElement>(null);
  // `anchor` = the raw trigger-derived target (tip centre for top, left-mid for
  // right). `place` = the painted position after edge-clamping by the tip's
  // ACTUAL width, plus the arrow correction so it still points at the trigger.
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [place, setPlace] = useState({ x: 0, arrowDx: 0 });

  const show = () => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (side === "right") setAnchor({ x: r.right + 12, y: r.top + r.height / 2 });
    else setAnchor({ x: r.left + r.width / 2, y: r.top - 10 });
  };
  const hide = () => setAnchor(null);

  // Clamp to the viewport using the tip's measured half-width (not a fixed
  // worst-case margin, which shoves narrow tips like "More options" off their
  // trigger). Runs before paint, so there's no visible jump; the leftover
  // delta is fed to the arrow via --arrow-dx.
  useLayoutEffect(() => {
    if (!anchor) return;
    if (side !== "top" || !tipRef.current) {
      setPlace({ x: anchor.x, arrowDx: 0 });
      return;
    }
    const half = tipRef.current.offsetWidth / 2;
    const margin = 8;
    const x = Math.min(
      Math.max(anchor.x, half + margin),
      window.innerWidth - half - margin,
    );
    setPlace({ x, arrowDx: anchor.x - x });
  }, [anchor, side]);

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
            {anchor && (
              <motion.span
                className="ui-tip-pos"
                style={{ position: "fixed", left: place.x, top: anchor.y, transform }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                role="tooltip"
              >
                <motion.span
                  ref={tipRef}
                  className={`ui-tip ui-tip--${side}${panel ? " ui-tip--panel" : ""}${
                    compact ? " ui-tip--compact" : ""
                  }`}
                  style={{ "--arrow-dx": `${place.arrowDx}px` } as React.CSSProperties}
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
