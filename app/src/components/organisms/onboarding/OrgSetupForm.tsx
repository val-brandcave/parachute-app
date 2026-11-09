"use client";

import { Button, Icon } from "@/components/atoms";
import { Callout } from "@realwired/ui";
import { SegmentedControl } from "@/components/molecules";
import { TRIAL_GRANT_CREDITS } from "@/lib/pricing";
import type { OrgKind, TeamBand, VolumeBand } from "@/types";

export interface OrgSetupOption<T extends string> {
  value: T;
  label: string;
}

/** The one setup card: organization name, what you are, and two size bands. */
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
  needsSales,
  callRequested,
  onBookCall,
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
  /** Answers meet the sales rule: show the optional call box. */
  needsSales: boolean;
  callRequested: boolean;
  onBookCall: () => void;
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
      <h1 className="wel-title">Set up your organization</h1>
      <p className="wel-sub">Three quick answers, then you&apos;re in.</p>

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
      {needsSales ? (
        <div className="wel-sales">
          <Callout
            tone="info"
            icon="calendar"
            action={
              callRequested ? undefined : (
                <Button type="button" variant="outline" size="sm" onClick={onBookCall}>
                  Book a call
                </Button>
              )
            }
          >
            <strong>A team your size usually starts with a call</strong>
            <br />
            {callRequested
              ? "Call requested. We will email you. You can go in now: Realwired confirms larger organizations within one business day, and the sample review is open meanwhile."
              : "Optional: you can go in now. Realwired confirms larger organizations within one business day, and the sample review is open while you wait."}
          </Callout>
        </div>
      ) : (
        <p className="wel-reassure">
          <Icon name="check" size={16} />
          <span>
            You start with a free sample review and {TRIAL_GRANT_CREDITS} trial credits. No card needed.
          </span>
        </p>
      )}

      <Button type="submit" size="lg" block disabled={!canContinue}>
        Continue to Parachute
      </Button>
    </form>
  );
}
