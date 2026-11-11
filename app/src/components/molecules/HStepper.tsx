"use client";

import { Icon } from "@/components/atoms";
import { cn } from "@/lib/utils";
import "./hstepper.css";

export interface HStep {
  id: string;
  label: string;
}

/**
 * Horizontal numbered stepper: numbers, `check` when done, connector lines.
 * With `onSelect`, every step up to the current one is a button: done steps show a
 * check, an earlier step that isn't done (skipped) keeps its number. Later steps are
 * plain text. Styles: `hstepper.css`, imported here so it renders styled anywhere.
 * // DS-candidate: HStepper — no DS or local horizontal stepper exists (StepRail is vertical).
 */
export function HStepper(props: {
  steps: HStep[];
  current: string;
  done: string[];
  /** Click a reachable step (done or current). */
  onSelect?: (id: string) => void;
  "aria-label"?: string;
}) {
  const { steps, current, done, onSelect } = props;
  const currentAt = steps.findIndex((s) => s.id === current);
  return (
    <ol className="hstep" aria-label={props["aria-label"] ?? "Steps"}>
      {steps.map((s, i) => {
        const isDone = done.includes(s.id);
        const isCurrent = s.id === current;
        const reachable = !!onSelect && (isDone || isCurrent || i < currentAt);
        const body = (
          <>
            <span className="hstep-n" aria-hidden="true">
              {isDone ? <Icon name="check" size={14} strokeWidth={2.5} /> : i + 1}
            </span>
            <span className="hstep-label">{s.label}</span>
            {isDone && <span className="sr-only"> (done)</span>}
          </>
        );
        return (
          <li
            key={s.id}
            className={cn("hstep-item", isDone && "is-done", isCurrent && "is-current", i < currentAt && "is-past")}
            aria-current={isCurrent ? "step" : undefined}
          >
            {i > 0 && <span className="hstep-line" aria-hidden="true" />}
            {reachable ? (
              <button type="button" className="hstep-btn" onClick={() => onSelect?.(s.id)}>
                {body}
              </button>
            ) : (
              <span className="hstep-btn">{body}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
