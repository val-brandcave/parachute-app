"use client";

import { InviteStep } from "@/components/organisms/onboarding";
import { useFinishOnboarding, useStageOrg } from "../hooks/useWelcome";

/** Self-serve step 2 of 2: invite the team, then the interstitial and Get started. */
export default function WelcomeInvitePage() {
  const { orgName, domain } = useStageOrg();
  const finish = useFinishOnboarding();
  return <InviteStep orgName={orgName} domain={domain} onDone={() => finish("self_serve")} />;
}
