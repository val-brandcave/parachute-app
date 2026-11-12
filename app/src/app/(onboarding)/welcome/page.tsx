"use client";

import { OrgSetupForm } from "@/components/organisms/onboarding";
import { KIND_OPTIONS, TEAM_OPTIONS, VOLUME_OPTIONS, useWelcomeSetup } from "./hooks/useWelcome";

/** Step 1 of 2: org setup. The card shell, progress bar and side panel come from the welcome layout. */
export default function WelcomePage() {
  const w = useWelcomeSetup();
  return (
    <OrgSetupForm
      name={w.name}
      onName={w.setName}
      nameError={w.nameError}
      shake={w.shake}
      kind={w.kind}
      onKind={w.setKind}
      team={w.team}
      onTeam={w.setTeam}
      volume={w.volume}
      onVolume={w.setVolume}
      kindOptions={KIND_OPTIONS}
      teamOptions={TEAM_OPTIONS}
      volumeOptions={VOLUME_OPTIONS}
      route={w.route}
      trigger={w.trigger}
      unsure={w.unsure}
      busy={w.busy}
      formError={w.formError}
      onSubmit={w.submit}
    />
  );
}
