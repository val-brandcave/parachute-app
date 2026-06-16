"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type SkeletonProps = {
  /** width — number → px, or any CSS length (e.g. "62%") */
  width?: number | string;
  /** height — number → px, or any CSS length */
  height?: number | string;
  /** border radius — number → px, or any CSS length */
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Neutral grey placeholder block with a Framer-Motion shimmer sweep.
 * Purposely distinct from the petrol `.ai-processing` shimmer (that's the
 * reserved AI cue). Compose these to mirror a real layout while it loads.
 * Decorative — hidden from assistive tech; label the surrounding region.
 */
export function Skeleton({
  width,
  height = 12,
  radius,
  className,
  style,
}: SkeletonProps) {
  return (
    <span
      className={cn("ui-skel", className)}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    >
      <motion.span
        className="ui-skel-sweep"
        initial={{ x: "-150%" }}
        animate={{ x: "150%" }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
      />
    </span>
  );
}
