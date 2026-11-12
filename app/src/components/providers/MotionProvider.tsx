"use client";

import { useEffect } from "react";
import { MotionConfig, MotionGlobalConfig } from "framer-motion";
import { initMotionFlag, motionOff } from "@/lib/motion";

// Set at module load on the client so children's first animations already skip
// (effects run child-first, so an effect alone would be one frame late).
if (typeof window !== "undefined") {
  initMotionFlag();
  MotionGlobalConfig.skipAnimations = motionOff();
}

/**
 * App-wide motion config (motion-spec §1.1). reducedMotion="user" drops
 * transform/layout animation for users who ask for less; when motion is off
 * (tests, recordings) every framer animation jumps to its end state.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    MotionGlobalConfig.skipAnimations = motionOff();
  }, []);
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
