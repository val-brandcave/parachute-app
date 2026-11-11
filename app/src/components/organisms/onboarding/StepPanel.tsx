"use client";

import { Icon, Illustration } from "@/components/atoms";
import { TRIAL_GRANT_CREDITS } from "@/lib/pricing";
import type { OrgKind } from "@/types";

export type PanelStep = "setup" | "invite" | "call";

/** "Harbor Community Bank" → "Harbor" (the board's short-name rule, motion-spec §5). */
export function orgShortName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/**
 * Side panel beside the onboarding card (spec §5.1 option C, PC-24): one
 * illustration, a title and a short list, per step. Product proof only, no
 * customer names. Centred beside the card; it never stretches to the card's height.
 * Book a call drops its illustration once the card shows the booked scene
 * (one illustration per view).
 */
export function StepPanel({
  step,
  kind = "bank",
  orgName,
  booked = false,
}: {
  step: PanelStep;
  /** "You are a" answer: appraisal firms get "review guidelines" instead of "credit policy". */
  kind?: OrgKind;
  orgName: string;
  /** Book a call: the card shows scene 25, so the panel shows text only. */
  booked?: boolean;
}) {
  if (step === "invite") {
    return (
      <>
        <div className="onb-panel-art">
          <Illustration name="15-request-sent" size={128} panel />
        </div>
        <h2 className="onb-panel-title">What your team gets</h2>
        <CheckList
          rows={[
            `An email to join ${orgName}, no account setup on their side`,
            "Reviews they start come out of the shared credit balance",
            "You can change anyone's role later in Members",
          ]}
        />
      </>
    );
  }

  if (step === "call") {
    const short = orgShortName(orgName);
    return (
      <>
        {!booked && (
          <div className="onb-panel-art">
            <Illustration name="25-scene-call-booked" size={300} />
          </div>
        )}
        <h2 className="onb-panel-title">What happens next</h2>
        <ol className="onb-panel-list onb-panel-list--num">
          <li>
            <span className="onb-panel-num" aria-hidden="true">1</span>
            <span>
              <b>You get into Parachute straight away.</b> Upload your policy and invite your team while you wait.
            </span>
          </li>
          <li>
            <span className="onb-panel-num" aria-hidden="true">2</span>
            <span>
              <b>On the call, we confirm {short}&apos;s account</b> and run your first review with you.
            </span>
          </li>
          <li>
            <span className="onb-panel-num" aria-hidden="true">3</span>
            <span>
              <b>Your {TRIAL_GRANT_CREDITS} trial credits open</b> once the account is confirmed, usually that day.
            </span>
          </li>
        </ol>
      </>
    );
  }

  return (
    <>
      <div className="onb-panel-art">
        <Illustration name="23-scene-first-review" size={300} />
      </div>
      <h2 className="onb-panel-title">What Parachute checks</h2>
      <CheckList
        rows={[
          "Every figure traced to its page in the appraisal",
          kind === "appraisal_firm"
            ? "Your review guidelines and compliance checklist applied"
            : "Your credit policy and compliance checklist applied",
          "A signed workbook you can send to the lender",
        ]}
      />
    </>
  );
}

function CheckList({ rows }: { rows: string[] }) {
  return (
    <ul className="onb-panel-list">
      {rows.map((r) => (
        <li key={r}>
          <Icon name="check-circle" size={16} />
          <span>{r}</span>
        </li>
      ))}
    </ul>
  );
}
