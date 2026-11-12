"use client";

import { useId } from "react";
import type { TooltipRenderProps } from "react-joyride";
import { Button } from "@/components/atoms/Button";
import { IconButton } from "@/components/atoms/IconButton";
import { Illustration, type IllustrationName } from "@/components/atoms/Illustration";
import { useTourStore } from "@/store/tour.store";

/** What TourHost puts on each Joyride step's `data`. */
export interface TourStepData {
  art?: IllustrationName;
}

/**
 * The tour card (spec §5.13): art, title, body, step dots, "Skip tour" and Next / Done.
 * Buttons drive `useTourStore` (the host feeds Joyride its `stepIndex`), so Joyride's own
 * button handlers are not used; only `data-action="primary"` is kept so Joyride's focus
 * trap lands on Next. Focusable on its own (`tabIndex=-1`) so it works over the
 * `aria-modal` review takeover, which it sits beside in `document.body`.
 * // DS-candidate: TourCard — the DS has no coach-mark / step card.
 */
export function TourTooltip({ index, size, step, isLastStep, tooltipProps }: TooltipRenderProps) {
  const uid = useId();
  const data = (step.data ?? {}) as TourStepData;
  const { next, back, stop } = useTourStore.getState();
  const titleId = `${uid}-title`;
  const bodyId = `${uid}-body`;

  return (
    <div
      {...tooltipProps}
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      tabIndex={-1}
      className="tour-tip"
      data-tour-tip=""
    >
      <IconButton
        name="close"
        size={16}
        className="tour-tip-x"
        aria-label="Close tour"
        onClick={() => stop("skipped")}
      />
      {data.art && (
        <div className="tour-tip-art" aria-hidden="true">
          <Illustration name={data.art} size={240} />
        </div>
      )}
      <p className="tour-tip-count">
        Step {index + 1} of {size}
      </p>
      <h2 id={titleId} className="tour-tip-title">
        {step.title}
      </h2>
      <p id={bodyId} className="tour-tip-body">
        {step.content}
      </p>
      <div className="tour-tip-foot">
        <span className="tour-tip-dots" aria-hidden="true">
          {Array.from({ length: size }, (_, i) => (
            <span key={i} className={i === index ? "tour-dot is-on" : "tour-dot"} />
          ))}
        </span>
        <Button variant="ghost" size="sm" onClick={() => stop("skipped")}>
          Skip tour
        </Button>
        {index > 0 && (
          <Button variant="outline" size="sm" onClick={() => back()}>
            Back
          </Button>
        )}
        <Button variant="primary" size="sm" data-action="primary" onClick={() => next()}>
          {isLastStep ? "Done" : "Next"}
        </Button>
      </div>
    </div>
  );
}
