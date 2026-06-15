"use client";

import { useState } from "react";
import { Button, Modal, Icon } from "@/components/atoms";

/**
 * Launches the "Order a review" flow. The full stepper is a later sprint —
 * for now this opens the full-page modal shell so the pattern is in place.
 */
export function OrderButton({
  variant = "primary",
}: {
  variant?: "primary" | "accent" | "outline";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} iconLeft="add" onClick={() => setOpen(true)}>
        Order a review
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Order a review">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            height: "100%",
            color: "var(--md-on-surface-v)",
            gap: 14,
          }}
        >
          <span
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              background: "var(--md-accent-c)",
              color: "var(--md-accent-d)",
            }}
          >
            <Icon name="add" size={30} />
          </span>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--md-on-surface)" }}>
            Full-page order stepper
          </div>
          <p style={{ maxWidth: 460 }}>
            This is the modal shell. The multi-step order flow — pull from YouConnect or
            upload a PDF, choose review types, assign a reviewer, set options, and run the
            pipeline — will be built here next.
          </p>
        </div>
      </Modal>
    </>
  );
}
