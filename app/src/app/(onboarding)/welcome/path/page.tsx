"use client";

import { PathChoice } from "@/components/organisms/onboarding";
import { CALL_SLOTS, useWelcomePath } from "../hooks/useWelcome";

export default function WelcomePathPage() {
  const w = useWelcomePath();
  if (!w.org) return null;
  return (
    <div className="wel-stage">
      <div className="wel-card">
        <PathChoice
          salesFirst={w.salesFirst}
          choice={w.choice}
          onChoice={w.setChoice}
          trialCredits={w.trialCredits}
          fullReviews={w.fullReviews}
          slots={CALL_SLOTS}
          slot={w.slot}
          onSlot={w.setSlot}
          booked={w.booked}
          onBook={w.bookCall}
          onContinue={w.proceed}
        />
      </div>
    </div>
  );
}
