import type { Severity, Disposition, ReviewStatus } from "@/types";

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

export const SEV_META: Record<
  Severity,
  { label: string; chip: string; icon: string; rank: number }
> = {
  crit: { label: "Critical", chip: "chip-crit", icon: "gpp_maybe", rank: 0 },
  fail: { label: "Fail", chip: "chip-fail", icon: "error", rank: 1 },
  flag: { label: "Flagged", chip: "chip-flag", icon: "flag", rank: 2 },
  pass: { label: "Pass", chip: "chip-pass", icon: "check_circle", rank: 3 },
  na: { label: "N/A", chip: "chip-na", icon: "remove", rank: 4 },
};

export const DISP_META: Record<
  Disposition,
  { label: string; icon: string }
> = {
  pending: { label: "Pending", icon: "schedule" },
  accepted: { label: "Accepted", icon: "check" },
  override: { label: "Overridden", icon: "edit" },
  rejected: { label: "Rejected", icon: "block" },
  commented: { label: "Commented", icon: "chat_bubble" },
};

export const STATUS_META: Record<
  ReviewStatus,
  { label: string; chip: string }
> = {
  intake: { label: "Intake", chip: "chip-info" },
  autorejected: { label: "Auto-rejected", chip: "chip-blocked" },
  running: { label: "Running", chip: "chip-info" },
  needs_action: { label: "Needs action", chip: "chip-flag" },
  in_review: { label: "In review", chip: "chip-info" },
  returned: { label: "Returned", chip: "chip-returned" },
  completed: { label: "Completed", chip: "chip-pass" },
};

export const PIPELINE_STAGES = [
  "S1 Checklist",
  "S2 Validation",
  "S3 Consistency",
  "S4 Analytics",
  "S5 Policy",
];

export function formatPct(v: number): string {
  return `${Math.round(v * 100)}%`;
}
