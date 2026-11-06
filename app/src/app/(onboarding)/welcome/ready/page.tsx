"use client";

import { useRouter } from "next/navigation";
import { ReadyState } from "@/components/organisms/onboarding";
import { useWelcomeReady } from "../hooks/useWelcome";

export default function WelcomeReadyPage() {
  const router = useRouter();
  const w = useWelcomeReady();
  if (!w.org) return null;
  return (
    <div className="wel-stage">
      <div className="wel-card">
        <ReadyState
          orgName={w.org.name}
          balance={w.balance}
          firstReportCost={w.firstReportCost}
          onSample={() => router.push("/reviews/review-sample")}
          onFirstReport={() => router.push("/dashboard")}
          onAddCard={w.addCard}
          onHome={() => router.push("/dashboard")}
        />
      </div>
    </div>
  );
}
