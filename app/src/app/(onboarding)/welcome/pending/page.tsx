"use client";

import { useRouter } from "next/navigation";
import { PendingState } from "@/components/organisms/onboarding";
import { useWelcomePending } from "../hooks/useWelcome";

export default function WelcomePendingPage() {
  const router = useRouter();
  const w = useWelcomePending();
  if (!w.org) return null;
  return (
    <div className="wel-stage">
      <div className="wel-card">
        <PendingState
          org={w.org}
          userName={w.user.name}
          email={w.user.email}
          trialCredits={w.trialCredits}
          onOpenSample={() => router.push("/reviews/review-sample")}
          onAddCard={w.addCard}
          onTalk={w.talkToUs}
        />
      </div>
    </div>
  );
}
