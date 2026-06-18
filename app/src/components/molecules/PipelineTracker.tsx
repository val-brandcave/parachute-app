import { Icon } from "@/components/atoms";
import { PIPELINE_STAGES } from "@/lib/utils";
import type { PipelineView } from "@/lib/review-lifecycle";

/**
 * The queue's Pipeline column — the phase carrier (replaces a synthetic status).
 * Renders the S1–S5 tracker (done · active · idle) once a review is in/through
 * the pipeline, or a word-state for pre/post-pipeline phases (awaiting order,
 * blocked at intake, returned). Driven by `pipelineView()`.
 */
export function PipelineTracker({ view }: { view: PipelineView }) {
  if (view.mode === "word") {
    return (
      <span className={`pipe-word pipe-word--${view.tone}`}>
        <Icon name={view.icon} size={13} />
        {view.label}
      </span>
    );
  }
  return (
    <span className="pipe-track" aria-label={`Pipeline: ${view.label}`}>
      <span className="pipe-dots">
        {PIPELINE_STAGES.map((title, i) => {
          const state =
            i < view.filled ? "done" : view.active === i ? "run" : "idle";
          return (
            <span
              key={title}
              className={`pipe-dot pipe-dot--${state}`}
              title={title}
            />
          );
        })}
      </span>
      <span className={`pipe-label pipe-label--${view.tone}`}>{view.label}</span>
    </span>
  );
}
