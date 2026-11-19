"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useOnboardingFrame } from "@/components/organisms/onboarding";
import { useStepVariants } from "@/lib/motion";

/** A jump to a pose with no visible tween (never framer's default spring). */
const INSTANT = { duration: 0 };

/**
 * Remounts on every step (Next keys a template by its child segment) and plays
 * the step's enter from the side of travel (T3/T3b). The exit is played here too,
 * before the push, when the frame says so (`useStepNav().go`). A direct load
 * renders at rest. During the T2 arrival the content holds its enter pose (set
 * instantly, while the card is still an empty first frame) and enters when the
 * frame says `contentIn`. Focus moves to the step's h1 after a step change and
 * after the T2 arrival.
 */
export default function WelcomeTemplate({ children }: { children: React.ReactNode }) {
  const frame = useOnboardingFrame();
  const variants = useStepVariants();
  const ref = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  const navigated = Boolean(frame?.navigated);
  const arrived = Boolean(frame?.handoff && frame.contentIn);
  const wantFocus = navigated || arrived;

  useEffect(() => {
    if (!wantFocus || focused.current) return;
    focused.current = true;
    // A step that deliberately focuses a field on arrival (Invite's first email) keeps it.
    if (ref.current?.contains(document.activeElement)) return;
    const h1 = ref.current?.querySelector("h1");
    if (!h1) return;
    if (!h1.hasAttribute("tabindex")) h1.setAttribute("tabindex", "-1");
    h1.focus({ preventScroll: true });
  }, [wantFocus]);

  if (!frame) return <>{children}</>;
  const holding = frame.handoff && !frame.contentIn;
  const target = frame.exiting ? "exit" : holding ? "enter" : "center";
  return (
    <motion.div
      ref={ref}
      className="onb-step"
      custom={frame.exiting ? frame.exitDir : frame.dir}
      variants={variants}
      initial={navigated ? "enter" : false}
      animate={target}
      // `enter` has no transition of its own: holding there must be instant.
      transition={holding ? INSTANT : undefined}
      onAnimationComplete={(def) => {
        if (def === "exit") frame.exitDone();
      }}
    >
      {children}
    </motion.div>
  );
}
