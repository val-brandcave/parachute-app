"use client";

import { CallBooking } from "@/components/organisms/onboarding";
import { useFinishOnboarding, useStageOrg } from "../hooks/useWelcome";

/** Enterprise step 2 of 2: book the setup call (or later), then the interstitial and Get started (pending). */
export default function WelcomeCallPage() {
  const { orgName } = useStageOrg();
  const finish = useFinishOnboarding();
  return (
    <CallBooking
      orgName={orgName}
      onBooked={() => finish("enterprise_booked")}
      onLater={() => finish("enterprise_later")}
    />
  );
}
