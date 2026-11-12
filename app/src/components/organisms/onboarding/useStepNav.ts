"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Dir } from "@/lib/motion";
import { useOnboardingFrame } from "./OnboardingFrame";

/**
 * Step navigation with direction (motion-spec §2.2). Inside `OnboardingFrame`,
 * `go` plays the current step's exit first, then pushes; the new step enters
 * from the side of travel. Outside the frame it just pushes.
 */
export function useStepNav(): { go: (href: string, dir: Dir) => Promise<void>; dir: Dir } {
  const frame = useOnboardingFrame();
  const router = useRouter();
  const plain = useCallback(
    async (href: string) => {
      router.push(href);
    },
    [router],
  );
  return { go: frame?.go ?? plain, dir: frame?.dir ?? 1 };
}
