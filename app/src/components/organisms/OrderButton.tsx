"use client";

import { Button } from "@/components/atoms";
import { useOrderStore } from "@/store";

/** Opens the global "Order a review" stepper (mounted in the shell). */
export function OrderButton({
  variant = "primary",
}: {
  variant?: "primary" | "accent" | "outline";
}) {
  const openOrder = useOrderStore((s) => s.openOrder);
  return (
    <Button variant={variant} iconLeft="add" onClick={openOrder}>
      Order a review
    </Button>
  );
}
