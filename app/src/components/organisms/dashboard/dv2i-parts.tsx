"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { dur, ease, staggerFor } from "@/lib/motion";
import { cn } from "@/lib/utils";
import "./dashboard-v2-b.css";

/** Shared bits for the insights + risk cards (IssuesByCategory, FirmScorecard,
 *  ReviewerAgreement, PortfolioRisk). Internal to this folder. */

export type Tone = "strong" | "mid" | "soft" | "warn";

/** Card header: the shared `.widget-head` (same padding, rule and h3 as every
 *  other dashboard card) with an optional right-hand slot. No eyebrow badge. */
export function CardHead({ title, right }: { title: ReactNode; right?: ReactNode }) {
  return (
    <div className="widget-head">
      <h3>{title}</h3>
      {right && <div className="dv2i-head-right">{right}</div>}
    </div>
  );
}

/** Small square legend swatch, coloured like the chart segment it names. */
export function Swatch({ tone }: { tone: Tone }) {
  return <span className={cn("dv2i-swatch", `dv2i-tone--${tone}`)} aria-hidden="true" />;
}

// DS-candidate: LegendRow — inline chart legend (swatch + label) shared by every
// bespoke bar chart so legends read back to the marks the same way everywhere.
export function Legend({ items }: { items: { tone: Tone; label: ReactNode }[] }) {
  return (
    <div className="dv2i-legend">
      {items.map((it, i) => (
        <span key={i} className="dv2i-legend-item">
          <Swatch tone={it.tone} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

// DS-candidate: SegmentBar — single-colour-family stacked bar (CSS, no chart lib)
// with a grow-in from the left; used for category split, agreement and risk mix.
export function SegmentBar({
  segments,
  scale = 1,
  index = 0,
  count = 1,
  label,
  size = "md",
}: {
  /** Shares of the drawn bar; any positive numbers (normalised here). */
  segments: { value: number; tone: Tone }[];
  /** 0..1 — how much of the track the bar fills (relative-to-max rows). */
  scale?: number;
  /** Row index + row count, for the entrance stagger. */
  index?: number;
  count?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  return (
    <span
      className={cn("dv2i-track", `dv2i-track--${size}`)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {total > 0 && scale > 0 && (
        <motion.span
          className="dv2i-fill"
          style={{ width: `${Math.min(1, scale) * 100}%`, transformOrigin: "left center" }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{
            duration: dur.slow,
            ease: ease.enter,
            delay: index * staggerFor(count),
          }}
        >
          {segments.map((s, i) =>
            s.value > 0 ? (
              <span
                key={i}
                className={cn("dv2i-seg", `dv2i-tone--${s.tone}`)}
                style={{ width: `${(s.value / total) * 100}%` }}
              />
            ) : null,
          )}
        </motion.span>
      )}
    </span>
  );
}

/** Whole-number percentages that always sum to 100 (largest remainder). */
export function roundShares(shares: number[]): number[] {
  const sum = shares.reduce((s, x) => s + x, 0) || 1;
  const raw = shares.map((x) => (x / sum) * 100);
  const floor = raw.map(Math.floor);
  let left = 100 - floor.reduce((s, x) => s + x, 0);
  const order = raw
    .map((x, i) => ({ i, r: x - Math.floor(x) }))
    .sort((a, b) => b.r - a.r);
  for (const { i } of order) {
    if (left <= 0) break;
    floor[i] += 1;
    left -= 1;
  }
  return floor;
}

export const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;
