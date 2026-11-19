"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import { LockedAction } from "@/components/molecules";
import { useStartGate } from "@/components/organisms/home/useStartGate";

/** "Start a review" → the Start a review page; lock-then-explain while starting is blocked. */
export function StartReviewButton() {
  const router = useRouter();
  const { locked, reason } = useStartGate();
  if (locked && reason) {
    return (
      <LockedAction reason={reason} glyph="hourglass">
        <Button iconLeft="rocket">Start a review</Button>
      </LockedAction>
    );
  }
  return (
    <Button iconLeft="rocket" onClick={() => router.push("/launchpad")}>
      Start a review
    </Button>
  );
}
