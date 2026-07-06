import type { ReactNode } from "react";
import { Chip, Icon, type ChipTone, type IconName } from "@/components/atoms";
import { cn } from "@/lib/utils";

/** Colour applied to the leading indicator (dot / check / spinner), independent of
 *  the chip background — lets a calm neutral pill carry a single coloured cue. */
type IndicatorTone = "accent" | "info" | "pass" | "warn" | "fail" | "neutral";

function Indicator({
  icon,
  spinner,
  dot,
  tone,
}: {
  icon?: IconName;
  spinner?: boolean;
  dot?: boolean;
  tone?: IndicatorTone;
}) {
  const toneCls = tone && tone !== "neutral" ? `status-pill-ic--${tone}` : undefined;
  if (spinner) return <span className={cn("status-pill-spin", toneCls)} aria-hidden="true" />;
  if (dot) return <span className={cn("status-pill-dot", toneCls)} aria-hidden="true" />;
  if (icon)
    return (
      <span className={cn("status-pill-ic", toneCls)}>
        <Icon name={icon} size={13} />
      </span>
    );
  return null;
}

/**
 * A tone-coded status label with a leading indicator. One component for every
 * "state" cue in the app:
 *  - `bare` (no wrapper) — an inline dot/check/spinner + quiet label, for status
 *    that sits INSIDE another container (e.g. the run-flow type tabs), where a
 *    filled chip-in-a-chip reads muddy.
 *  - default (Chip wrapper) — a pill for flat surfaces (e.g. the workbook toolbar
 *    Draft / Final marker).
 *
 * `indicatorTone` colours only the dot/check/spinner, so the label can stay quiet
 * (neutral) and the state reads from one small coloured cue rather than a loud pill.
 */
export function StatusPill({
  tone = "neutral",
  indicatorTone,
  icon,
  spinner,
  dot,
  bare,
  className,
  children,
}: {
  tone?: ChipTone;
  indicatorTone?: IndicatorTone;
  icon?: IconName;
  spinner?: boolean;
  dot?: boolean;
  bare?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const inner = (
    <>
      <Indicator icon={icon} spinner={spinner} dot={dot} tone={indicatorTone} />
      {children}
    </>
  );
  if (bare) return <span className={cn("status-pill-bare", className)}>{inner}</span>;
  return (
    <Chip tone={tone} className={cn("status-chip", className)}>
      {inner}
    </Chip>
  );
}
