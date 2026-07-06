"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms";

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
  return (
    <Button variant={variant} iconLeft="add" onClick={() => router.push("/launchpad")}>
      Start a review
    </Button>
  );
}
