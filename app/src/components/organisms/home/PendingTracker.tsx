"use client";

import { Icon } from "@/components/atoms";
import { cn } from "@/lib/utils";

/** One step of the enterprise tracker (Signed up · Call booked · Confirmed). */
export interface PendingTrackerStep {
  label: string;
  date?: string;
  state: "done" | "current" | "todo";
}

const STATE_WORD: Record<PendingTrackerStep["state"], string> = {
  done: "done",
  current: "current step",
  todo: "not reached",
};

/**
 * Three-step tracker (Signed up · Call booked · Confirmed). Width-fluid: equal columns
 * that share whatever width the host gives (the Get started card or the lock dialog,
 * T4.1). `compact` tightens the dots and type for the dialog.
 *
 * DS-candidate: StepLine `current` state — DS StepLine only knows reached (dated) and
 * "Not yet"; it can't ring a current step or put a caption ("Usually same day") under
 * an unreached one, so this is a local variant with the same ordered-list semantics.
 */
export function PendingTracker({ steps, compact = false }: { steps: PendingTrackerStep[]; compact?: boolean }) {
  return (
    <ol className={cn("gs-track", compact && "gs-track--compact")} aria-label="Account progress">
      {steps.map((s, i) => (
        <li key={s.label} className={cn("gs-track-step", `is-${s.state}`)} aria-current={s.state === "current" ? "step" : undefined}>
          <span className="gs-track-dot" aria-hidden="true">
            {s.state === "done" ? <Icon name="check" size={compact ? 12 : 14} strokeWidth={2.6} /> : i + 1}
          </span>
          <span className="gs-track-label">
            {s.label}
            <span className="ui-visually-hidden">, {STATE_WORD[s.state]}</span>
          </span>
          {s.date && <span className="gs-track-date">{s.date}</span>}
        </li>
      ))}
    </ol>
  );
}
