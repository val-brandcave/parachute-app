"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import { LockedAction } from "@/components/molecules";
import { useStartGate } from "@/components/organisms/home/useStartGate";

/**
 * Reviews-queue primary CTA. Routes to the Launchpad intake front door
 * (`/launchpad`) — the same target as the sidebar "Start a review" action — which
 * flows into the run flow.
 *
 * NOTE: this deliberately no longer opens the old `OrderModal` stepper
 * (`useOrderStore.openOrder`). That order flow is being abandoned for now but is
 * kept in the codebase for reference — do not delete it.
 */
export function OrderButton({
  variant = "primary",
}: {
  variant?: "primary" | "accent" | "outline";
}) {
  const router = useRouter();
  const { locked, reason } = useStartGate();
  // Pending approval: same look, aria-disabled + reason + hourglass; a click explains (§5.5).
  if (locked && reason) {
    return (
      <LockedAction reason={reason} glyph="hourglass">
        <Button variant={variant} iconLeft="add">
          Start a review
        </Button>
      </LockedAction>
    );
  }
  return (
    <Button variant={variant} iconLeft="add" onClick={() => router.push("/launchpad")}>
      Start a review
    </Button>
  );
}
