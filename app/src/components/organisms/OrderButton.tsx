"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon } from "@/components/atoms";
import { StepperModal, type Step } from "./StepperModal";

const STEPS: Step[] = [
  { key: "source", label: "Source", desc: "YouConnect or upload" },
  { key: "type", label: "Review type", desc: "Technical / Administrative" },
  { key: "reviewer", label: "Reviewer", desc: "Assign the review" },
  { key: "options", label: "Options", desc: "Defaults & overrides" },
  { key: "confirm", label: "Confirm & run", desc: "Review and submit" },
];

const PLACEHOLDER: Record<string, { title: string; body: string }> = {
  source: {
    title: "Where's the appraisal coming from?",
    body: "Pull a delivery from the YouConnect inbox, or upload an appraisal PDF. Pickers and the dropzone will live here.",
  },
  type: {
    title: "What should Parachute run?",
    body: "Choose Technical review, Administrative (compliance checklist), or both. Each option shows what it produces.",
  },
  reviewer: {
    title: "Who owns this review?",
    body: "Assign a reviewer (inherited from the YouConnect engagement when available).",
  },
  options: {
    title: "Apply your organization's defaults",
    body: "Auto-reject quality gate, SLA start, compliance template and bank policy — with per-order overrides.",
  },
  confirm: {
    title: "Review and run the pipeline",
    body: "A summary of the order, then run. The staged pipeline (S1–S5) kicks off and the review appears in your queue.",
  },
};

/**
 * Launches the full-page "Order a review" stepper. Step content is placeholder
 * for now (the shell + navigation are real); fields land in a later sprint.
 */
export function OrderButton({
  variant = "primary",
}: {
  variant?: "primary" | "accent" | "outline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const start = () => {
    setStep(0);
    setOpen(true);
  };
  const current = STEPS[step];
  const content = PLACEHOLDER[current.key];

  return (
    <>
      <Button variant={variant} iconLeft="add" onClick={start}>
        Order a review
      </Button>

      <StepperModal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="New order"
        title="Order a review"
        steps={STEPS}
        current={step}
        onNavigate={setStep}
        onBack={() => setStep((s) => Math.max(0, s - 1))}
        onNext={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
        onSubmit={() => {
          setOpen(false);
          router.push("/reviews");
        }}
        submitLabel="Run pipeline"
      >
        <div
          style={{
            border: "1px dashed var(--md-outline)",
            borderRadius: 14,
            padding: "40px 28px",
            textAlign: "center",
            color: "var(--md-on-surface-v)",
            background: "var(--md-surface-1)",
          }}
        >
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              margin: "0 auto 14px",
              background: "var(--md-accent-c)",
              color: "var(--md-accent-d)",
            }}
          >
            <Icon name="construction" size={26} />
          </span>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 19,
              color: "var(--md-on-surface)",
            }}
          >
            {content.title}
          </div>
          <p style={{ maxWidth: 460, margin: "8px auto 0" }}>{content.body}</p>
        </div>
      </StepperModal>
    </>
  );
}
