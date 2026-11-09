"use client";

import { useRouter } from "next/navigation";
import { Button, Tooltip } from "@/components/atoms";
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
  const button = (
    <Button
      variant={variant}
      iconLeft="add"
      disabled={locked}
      onClick={() => router.push("/launchpad")}
    >
      Start a review
    </Button>
  );
  if (!locked) return button;
  return <Tooltip content={reason}>{button}</Tooltip>;
}
