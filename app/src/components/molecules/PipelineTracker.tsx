"use client";

import { useEffect, useState } from "react";
import { Icon, Tooltip, YouConnectGlyph } from "@/components/atoms";
import { PIPELINE_STAGES } from "@/lib/utils";
import type { PipelineView } from "@/lib/review-lifecycle";

const TOTAL = PIPELINE_STAGES.length;

/** "S1 Checklist" → "Checklist" (the callout/segment display name). */
const shortName = (s: string) => s.replace(/^S\d+\s/, "");

/** Stable per-review baseline % (30–85) for the active stage — derived, not
 *  random, so a given review always shows the same starting progress. */
function seedPct(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return 30 + (h % 56);
}

/** The active stage's progress — starts at the seeded baseline and climbs
 *  slowly toward 99% while mounted (i.e. while the tooltip is open). It never
 *  reaches 100%: that would be a stage change, not in-stage progress. */
function StageProgress({ start }: { start: number }) {
  const [pct, setPct] = useState(Math.min(99, start));
  useEffect(() => {
    const id = setInterval(() => {
      setPct((p) => {
        if (p >= 99) {
          clearInterval(id);
          return 99;
        }
        return p + 1;
      });
    }, 650);
    return () => clearInterval(id);
  }, []);
  return <span className="pipe-step-pct">{pct}%</span>;
}

/**
 * The queue's Pipeline column — the review's *journey* through the parachute.
 *
 * Layout stacks a stage callout ON TOP of a segmented track. Running rows show
 * a petrol badge with a single pulsing dot (the one "AI working" cue) over a
 * track whose active segment is a STATIC half-fill (no competing shimmer).
 * Ready/Done rows show a checked label. The hover tooltip is a light panel: a
 * "Stage X of N" header over a vertical stepper (done · active · upcoming),
 * where the active row carries a slowly-climbing stage %. Pre/post-pipeline
 * phases render a word-state. Driven by `pipelineView()`.
 */
export function PipelineTracker({
  view,
  seed,
  footnote,
}: {
  view: PipelineView;
  seed: string;
  /** Optional byline shown at the foot of the hover card (e.g. who completed it). */
  footnote?: string;
}) {
  if (view.mode === "word") {
    return (
      <span
        className={`pipe-word pipe-word--${view.tone}${view.badge ? " pipe-word--badge" : ""}`}
      >
        {view.brand === "yc" ? (
          <YouConnectGlyph size={13} />
        ) : (
          <Icon name={view.icon} size={13} />
        )}
        {view.label}
      </span>
    );
  }

  const { filled, active, tone } = view;
  const running = tone === "running" && active !== null;
  const done = tone === "ready" || tone === "done";
  const base = running ? seedPct(seed) : 0;
  const headerLabel = running
    ? `Stage ${active! + 1} of ${TOTAL}`
    : tone === "ready"
      ? "Ready for review"
      : "Pipeline complete";

  const card = (
    <span className="pipe-card">
      <span className="pipe-card-head">
        <span className="pipe-card-title">{headerLabel}</span>
      </span>
      <span className="pipe-card-steps">
        {PIPELINE_STAGES.map((title, i) => {
          const state = i < filled ? "done" : active === i ? "run" : "idle";
          return (
            <span key={title} className={`pipe-step pipe-step--${state}`}>
              <span className="pipe-step-node">
                {state === "done" && <Icon name="check" size={11} />}
                {state === "run" && <span className="pipe-step-pulse" />}
              </span>
              <span className="pipe-step-label">{title}</span>
              {state === "run" && <StageProgress start={base} />}
            </span>
          );
        })}
      </span>
      {footnote && (
        <span className="pipe-card-foot">
          <Icon name="check-circle" size={12} />
          {footnote}
        </span>
      )}
    </span>
  );

  return (
    <Tooltip content={card} side="top" panel>
      <span className={`pipe-jt pipe-jt--${tone}`} aria-label={`Pipeline: ${view.label}`}>
        {running ? (
          <span className="pipe-badge">
            <span className="pipe-badge-dot" />
            {shortName(PIPELINE_STAGES[active!])}
          </span>
        ) : (
          <span className={`pipe-badge pipe-badge--${tone}`}>
            {done && <Icon name="check" size={12} />}
            {view.label}
          </span>
        )}
        <span className="pipe-segs">
          {PIPELINE_STAGES.map((title, i) => {
            const state = i < filled ? "done" : active === i ? "run" : "idle";
            // Active segment = static half-fill to the seeded baseline (petrol → tint).
            const style =
              state === "run"
                ? {
                    background: `linear-gradient(90deg, var(--md-accent) ${base}%, var(--md-accent-c) ${base}%)`,
                  }
                : undefined;
            return (
              <span key={title} className={`pipe-seg pipe-seg--${state}`} style={style} />
            );
          })}
        </span>
      </span>
    </Tooltip>
  );
}
