import type { Review } from "@/types";
import type { IconName, ChipTone } from "@/components/atoms";

/**
 * Single source of truth for a review's *derived* state. The queue and dashboard
 * read these helpers instead of printing a synthetic "status" — the real signals
 * (pipeline phase + findings outcome + review type) are computed from the honest
 * lifecycle phase (`Review.status`). See app/AGENTS.md (review queue patterns).
 */

/* ---------- Tabs / scoping ---------- */

export type LifecycleBucket =
  | "needs_action"
  | "in_pipeline"
  | "sent_back"
  | "completed"
  | "intake";

/** Which lifecycle-stage tab a review belongs to. Intake folds in auto-rejected
 *  (both are pre-review intake-desk states: confirm-&-run and triage). */
export function lifecycleBucket(r: Review): LifecycleBucket {
  switch (r.status) {
    case "in_review":
      return "needs_action";
    case "running":
      return "in_pipeline";
    case "returned":
      return "sent_back";
    case "completed":
      return "completed";
    case "intake":
    case "autorejected":
      return "intake";
  }
}

/** Reviews waiting on *my* decision: assigned to me and in an actionable phase. */
export function needsMyAction(r: Review, meId: string): boolean {
  return (
    r.assigneeId === meId &&
    (r.status === "in_review" ||
      r.status === "autorejected" ||
      r.status === "intake")
  );
}

/** Past SLA while still in an active phase (intake awaits order, auto-reject
 *  pauses SLA, completed is done — none of those count as overdue). */
export function isOverdue(r: Review, now: number): boolean {
  return (
    (r.status === "running" ||
      r.status === "in_review" ||
      r.status === "returned") &&
    r.slaDueAt < now
  );
}

/* ---------- Filter facets (derived, never a synthetic field) ---------- */

/** The honest "Findings" facet — replaces the made-up "severity" filter.
 *  Reads the same outcome the Findings column shows. `null` = no findings yet
 *  (pre-pipeline / running), so those rows fall out of any Findings filter. */
export type FindingsKey = "crit" | "fail" | "flag" | "clean";
export function findingsKey(r: Review): FindingsKey | null {
  const o = outcomeView(r);
  if (!o) return null;
  return o.tone === "pass" ? "clean" : (o.tone as FindingsKey);
}

/** Due/SLA bucket for the Due facet. Auto-rejected pauses the clock; only
 *  active phases can be overdue or due-soon (≤2d). Derived from `slaDueAt`. */
export type DueBucket = "overdue" | "soon" | "paused" | "none";
export function dueBucket(r: Review, now: number): DueBucket {
  if (r.status === "autorejected") return "paused";
  if (isOverdue(r, now)) return "overdue";
  const active =
    r.status === "running" ||
    r.status === "in_review" ||
    r.status === "returned" ||
    r.status === "intake";
  if (active) {
    const diff = r.slaDueAt - now;
    // Match relativeDue()'s "soon" (≤2 days, same rounding) so the Due filter
    // and the Due column's yellow warning agree on what counts as due-soon.
    if (diff >= 0 && Math.round(diff / 86_400_000) <= 2) return "soon";
  }
  return "none";
}

/* ---------- Pipeline column (the phase carrier) ---------- */

export type PipelineView =
  | {
      mode: "dots";
      filled: number; // completed stages (0–5)
      active: number | null; // index of the currently-running stage, if any
      label: string;
      tone: "running" | "ready" | "done";
    }
  | { mode: "word"; label: string; icon: IconName; tone: "muted" | "fail" | "warn" };

export function pipelineView(r: Review): PipelineView {
  switch (r.status) {
    case "intake":
      return { mode: "word", label: "Awaiting order", icon: "clock", tone: "muted" };
    case "autorejected":
      return { mode: "word", label: "Blocked at intake", icon: "reject", tone: "fail" };
    case "returned":
      return { mode: "word", label: "Returned · rev 2", icon: "undo", tone: "warn" };
    case "running": {
      const stage = Math.min(5, Math.max(1, r.pipelineStage || 1));
      return {
        mode: "dots",
        filled: stage - 1,
        active: stage - 1,
        label: `S${stage}…`,
        tone: "running",
      };
    }
    case "in_review":
      return { mode: "dots", filled: 5, active: null, label: "Ready", tone: "ready" };
    case "completed":
      return { mode: "dots", filled: 5, active: null, label: "Done", tone: "done" };
  }
}

/* ---------- Findings / Outcome column (the result) ---------- */

export type OutcomeView = { label: string; tone: ChipTone; icon: IconName } | null;

/** The worst-severity result chip; null before the pipeline has produced findings. */
export function outcomeView(r: Review): OutcomeView {
  if (r.status === "intake" || r.status === "running" || r.status === "autorejected")
    return null;
  if (r.openFindings === 0 && !r.worstSeverity)
    return { label: "clean", tone: "pass", icon: "check-circle" };
  const n = r.openFindings || r.flaggedCount;
  switch (r.worstSeverity) {
    case "crit":
      return { label: `${n} critical`, tone: "crit", icon: "crit" };
    case "fail":
      return { label: `${n} fail`, tone: "fail", icon: "fail" };
    default:
      return { label: `${r.flaggedCount || n} flagged`, tone: "flag", icon: "flag" };
  }
}

/* ---------- Next action (one derived primary per row) ---------- */

export type NextActionKind = "order" | "route" | "download" | "none";
export interface NextActionView {
  label: string;
  tone: "primary" | "quiet";
  icon?: IconName;
  iconRight?: IconName;
  kind: NextActionKind;
  href?: string;
  /** Render the button icon-only (label moves to a tooltip). */
  iconOnly?: boolean;
}

/** The single most useful next step for a row. `kind` tells the component how to
 *  wire it (open the Order stepper, route, download menu, or no-op for waits). */
export function nextActionView(r: Review): NextActionView {
  switch (r.status) {
    case "intake":
      return { label: "Run", tone: "primary", icon: "rocket", kind: "order" };
    case "autorejected":
      return {
        label: "Triage",
        tone: "primary",
        icon: "gavel",
        kind: "route",
        href: `/reviews/${r.id}/triage`,
      };
    case "running":
      return { label: "Running…", tone: "quiet", icon: "clock", kind: "none" };
    case "in_review": {
      const adminOnly =
        r.reviewTypes.includes("administrative") &&
        !r.reviewTypes.includes("technical");
      if (r.openFindings === 0)
        return {
          label: adminOnly ? "Sign attestation" : "Compile",
          tone: "primary",
          icon: "edit",
          kind: "route",
          href: `/reviews/${r.id}`,
        };
      return {
        label: "Review",
        tone: "primary",
        icon: "reviews",
        kind: "route",
        href: `/reviews/${r.id}`,
      };
    }
    case "returned":
      return { label: "With appraiser", tone: "quiet", icon: "undo", kind: "none" };
    case "completed":
      return {
        label: "Download",
        tone: "primary",
        icon: "download",
        kind: "download",
        iconOnly: true,
      };
  }
}
