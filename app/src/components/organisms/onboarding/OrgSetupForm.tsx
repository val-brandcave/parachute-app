"use client";

import { Button, Icon } from "@/components/atoms";
import { SegmentedControl } from "@/components/molecules";
import { TRIAL_GRANT_CREDITS, costFor } from "@/lib/pricing";
import type { OrgKind, TeamBand, VolumeBand } from "@/types";

export interface OrgSetupOption<T extends string> {
  value: T;
  label: string;
}

/** Step line: two dashes and a label, e.g. "1 of 2 · Organization". */
export function WelcomeStepLine({ step, label }: { step: 1 | 2; label: string }) {
  return (
    <div className="wel-steps" role="img" aria-label={`Step ${step} of 2, ${label}`}>
      <span className={step >= 1 ? "wel-dash on" : "wel-dash"} />
      <span className={step >= 2 ? "wel-dash on" : "wel-dash"} />
      <span>
        {step} of 2 · {label}
      </span>
    </div>
  );
}

/** The quiet "What happens next" aside, wide screens only. */
export function WelcomeAside() {
  const fullReviews = Math.floor(TRIAL_GRANT_CREDITS / costFor(["technical", "administrative"]));
  return (
    <aside className="wel-aside" aria-label="What happens next">
      <h2>What happens next</h2>
      <p>
        A free sample review, then {fullReviews} reviews on the house. No card needed.
      </p>
      <ul>
        <li>
          <Icon name="check" size={15} />A finished sample review to explore
        </li>
        <li>
          <Icon name="check" size={15} />
          {TRIAL_GRANT_CREDITS} trial credits, about {fullReviews} full reviews
        </li>
        <li>
          <Icon name="check" size={15} />
          Add a card only when you top up
        </li>
      </ul>
    </aside>
  );
}

/** B1: organization name, what you are, and the two bands that decide the start path. */
export function OrgSetupForm({
  name,
  onName,
  kind,
  onKind,
  team,
  onTeam,
  volume,
  onVolume,
  kindOptions,
  teamOptions,
  volumeOptions,
  canContinue,
  onSubmit,
}: {
  name: string;
  onName: (v: string) => void;
  kind: OrgKind;
  onKind: (v: OrgKind) => void;
  team: TeamBand;
  onTeam: (v: TeamBand) => void;
  volume: VolumeBand;
  onVolume: (v: VolumeBand) => void;
  kindOptions: OrgSetupOption<OrgKind>[];
  teamOptions: OrgSetupOption<TeamBand>[];
  volumeOptions: OrgSetupOption<VolumeBand>[];
  canContinue: boolean;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canContinue) onSubmit();
      }}
    >
      <WelcomeStepLine step={1} label="Organization" />
      <h1 className="wel-title">Set up your organization</h1>
      <p className="wel-sub">Two short questions decide how we help you get started.</p>

      <div className="field">
        <label htmlFor="wel-org">Organization name</label>
        <input id="wel-org" autoComplete="organization" value={name} onChange={(e) => onName(e.target.value)} />
      </div>

      <div className="wel-q">
        <span className="wel-lb">You are a</span>
        <SegmentedControl block label="You are a" options={kindOptions} value={kind} onChange={onKind} />
      </div>
      <div className="wel-q">
        <span className="wel-lb">How many people will review reports?</span>
        <SegmentedControl block label="Reviewers" options={teamOptions} value={team} onChange={onTeam} />
      </div>
      <div className="wel-q">
        <span className="wel-lb">Reports a month, roughly</span>
        <SegmentedControl block label="Reports a month" options={volumeOptions} value={volume} onChange={onVolume} />
      </div>
      <p className="wel-help">This only decides how we help you get started.</p>

      <Button type="submit" size="lg" block disabled={!canContinue}>
        Continue
      </Button>
    </form>
  );
}
