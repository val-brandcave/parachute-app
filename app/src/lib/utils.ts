import type { Severity, Disposition, ReviewStatus } from "@/types";
import type { IconName } from "@/components/atoms/Icon";

/** Tailwind-friendly className combiner. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Relative SLA label, e.g. "Due in 2d", "Overdue 1d", "Due today". */
export function relativeDue(epoch: number): {
  label: string;
  tone: "ok" | "soon" | "overdue";
} {
  const now = Date.now();
  const diff = epoch - now;
  const day = 86400000;
  if (diff < 0) {
    const d = Math.max(1, Math.round(-diff / day));
    return { label: `Overdue ${d}d`, tone: "overdue" };
  }
  if (diff < day) return { label: "Due today", tone: "soon" };
  const d = Math.round(diff / day);
  return { label: `Due in ${d}d`, tone: d <= 2 ? "soon" : "ok" };
}

/** Short calendar date for the Due column, e.g. "Jun 24". Deterministic given
 *  the epoch (no Date.now()), so it's safe to call during render. */
export function formatShortDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export const SEV_META: Record<
  Severity,
  { label: string; chip: string; icon: IconName; rank: number }
> = {
  crit: { label: "Critical", chip: "chip-crit", icon: "crit", rank: 0 },
  fail: { label: "Fail", chip: "chip-fail", icon: "fail", rank: 1 },
  flag: { label: "Flagged", chip: "chip-flag", icon: "flag", rank: 2 },
  pass: { label: "Pass", chip: "chip-pass", icon: "check-circle", rank: 3 },
  na: { label: "N/A", chip: "chip-na", icon: "na", rank: 4 },
};

export const DISP_META: Record<
  Disposition,
  { label: string; icon: IconName }
> = {
  pending: { label: "Pending", icon: "clock" },
  accepted: { label: "Accepted", icon: "check" },
  override: { label: "Overridden", icon: "edit" },
  rejected: { label: "Rejected", icon: "reject" },
  commented: { label: "Commented", icon: "comment" },
  removed: { label: "Removed", icon: "eye-off" },
};

export const STATUS_META: Record<
  ReviewStatus,
  { label: string; chip: string }
> = {
  intake: { label: "Intake", chip: "chip-info" },
  autorejected: { label: "Auto-rejected", chip: "chip-blocked" },
  running: { label: "Running", chip: "chip-info" },
  in_review: { label: "In review", chip: "chip-info" },
  returned: { label: "Returned", chip: "chip-returned" },
  completed: { label: "Completed", chip: "chip-pass" },
};

export const PIPELINE_STAGES = [
  "Checklist",
  "Validation",
  "Consistency",
  "Analytics",
  "Policy",
];

export function formatPct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

/**
 * Fill a response-template body's `{{merge}}` tokens from the finding/review.
 * The three tokens we can resolve from data — `property`, `page`, `topic` — are
 * substituted; any remaining soft token (`action`, `condition`, `detail`, …) is
 * left as a bracketed editable placeholder (e.g. `[detail]`) for the reviewer to
 * complete before saving. Mirrors the merge-field contract in domain.types.
 */
export function fillTemplate(
  body: string,
  ctx: { property: string; page: number; topic: string },
): string {
  return body
    .replace(/\{\{\s*property\s*\}\}/g, ctx.property)
    .replace(/\{\{\s*page\s*\}\}/g, String(ctx.page))
    .replace(/\{\{\s*topic\s*\}\}/g, ctx.topic)
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => `[${k}]`);
}
