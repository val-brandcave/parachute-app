"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/atoms";
import { StepperModal, type Step } from "./StepperModal";
import { useOrderStore } from "@/store";

const STEPS: Step[] = [
  { key: "source", label: "Source", icon: "connect" },
  { key: "type", label: "Review type", icon: "checklist" },
  { key: "reviewer", label: "Reviewer", icon: "user" },
  { key: "options", label: "Options", icon: "settings" },
  { key: "confirm", label: "Confirm & run", icon: "check-circle" },
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

/** The global "Order a review" stepper, mounted once in the shell. */
export function OrderModal() {
  const router = useRouter();
  const { open, step, close, setStep } = useOrderStore();
  const current = STEPS[step];
  const content = PLACEHOLDER[current.key];

  return (
    <StepperModal
      open={open}
      onClose={close}
      title="Order a review"
      steps={STEPS}
      current={step}
      onNavigate={setStep}
      onBack={() => setStep(Math.max(0, step - 1))}
      onNext={() => setStep(Math.min(STEPS.length - 1, step + 1))}
      onSubmit={() => {
        close();
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
  );
}
