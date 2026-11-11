import { cn } from "@/lib/utils";

/**
 * Thin progress bar. Pass `value` (0–1) for a continuous bar, or `segments` for
 * a stepped one (onboarding "Step 2 of 2"). Read as one image with `label` as its
 * name, so screen readers hear "Step 2 of 2" rather than a list of bars.
 *
 * DS-candidate: ProgressBar/SegmentBar — @realwired/ui has no progress primitive.
 */
export function ProgressBar({
  value,
  segments,
  label,
  className,
}: {
  value?: number;
  segments?: { filled: boolean }[];
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("ui-progress", className)} role="img" aria-label={label}>
      {segments ? (
        segments.map((s, i) => (
          <span key={i} className={cn("ui-progress-seg", s.filled && "is-filled")} aria-hidden="true" />
        ))
      ) : (
        <span className="ui-progress-track" aria-hidden="true">
          <span
            className="ui-progress-fill"
            style={{ width: `${Math.round(Math.min(1, Math.max(0, value ?? 0)) * 100)}%` }}
          />
        </span>
      )}
      <span className="ui-visually-hidden">{label}</span>
    </div>
  );
}
