"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, type IconName } from "@/components/atoms";
import { EmptyState, LockedAction } from "@/components/molecules";
import { useStartGate } from "@/components/organisms/home/useStartGate";
import { EmptyVideo } from "@/components/organisms/EmptyVideo";
import { useOrgStore } from "@/store";
import "./first-run-hero.css";

/** The three steps of a review, shown as tiles under the hero. */
// Icons, not illustrations: the video is this view's one piece of art (AGENTS: one illustration per view).
const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "upload", title: "Add an appraisal", text: "Drop a PDF or pick a delivery from YouConnect." },
  { icon: "file-search", title: "Parachute checks it", text: "Every figure is traced to its page and findings are drafted." },
  { icon: "edit", title: "You decide and sign", text: "Concur, edit or reject each finding, then sign the workbook." },
];

/**
 * Level-1 empty state for the review pages (Dashboard, Reviews): one hero card — title,
 * description and the Start a review CTA on the left, the how-it-works video on the right —
 * with the three review steps as tiles underneath. No page header strip, no uploads here:
 * the CTA goes to the Start a review page (/launchpad). Respects the approval gate.
 * // DS-candidate: FirstRunHero (EmptyState split + media + step tiles).
 */
export function FirstRunHero({ title, children }: { title: ReactNode; children: ReactNode }) {
  const router = useRouter();
  const { locked, reason } = useStartGate();
  const orgName = useOrgStore((s) => s.org?.name);

  const cta =
    locked && reason ? (
      <LockedAction reason={reason} glyph="hourglass">
        <Button size="lg" iconLeft="rocket">
          Start a review
        </Button>
      </LockedAction>
    ) : (
      <Button size="lg" iconLeft="rocket" onClick={() => router.push("/launchpad")}>
        Start a review
      </Button>
    );

  return (
    <div className="frh">
      <EmptyState
        layout="split"
        className="frh-hero"
        title={title}
        media={<EmptyVideo videoId="how-a-review-works" />}
        actions={cta}
        status={
          locked ? (
            <>
              <b>{orgName ?? "Your organization"} is waiting for approval.</b> Start a review opens once that is done.
            </>
          ) : undefined
        }
      >
        {children}
      </EmptyState>

      <ol className="frh-steps" aria-label="How a review works">
        {STEPS.map((s, i) => (
          <li key={s.title} className="card frh-step">
            <span className="frh-step-ic" aria-hidden="true">
              <Icon name={s.icon} size={20} />
            </span>
            <div className="frh-step-tx">
              <span className="frh-step-n">Step {i + 1}</span>
              <b>{s.title}</b>
              <span>{s.text}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
