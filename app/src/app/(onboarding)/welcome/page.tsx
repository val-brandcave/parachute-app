"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OrgSetupForm, WelcomeAside } from "@/components/organisms/onboarding";
import { KIND_OPTIONS, TEAM_OPTIONS, VOLUME_OPTIONS, useWelcomeSetup } from "./hooks/useWelcome";

function Setup() {
  const params = useSearchParams();
  const w = useWelcomeSetup({ preset: params.get("preset"), step: params.get("step") });
  if (w.jumping) return null;
  return (
    <div className="wel-stage">
      <WelcomeAside />
      <div className="wel-card">
        <OrgSetupForm
          name={w.name}
          onName={w.setName}
          kind={w.kind}
          onKind={w.setKind}
          team={w.team}
          onTeam={w.setTeam}
          volume={w.volume}
          onVolume={w.setVolume}
          kindOptions={KIND_OPTIONS}
          teamOptions={TEAM_OPTIONS}
          volumeOptions={VOLUME_OPTIONS}
          canContinue={w.canContinue}
          onSubmit={w.submit}
        />
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={null}>
      <Setup />
    </Suspense>
  );
}
