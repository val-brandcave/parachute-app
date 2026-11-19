"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { FLOWS } from "@/lib/prototype-registry";
import { landPreset, landState, presetById, screenById } from "../land";

/**
 * PROTOTYPE ONLY. Deep links into the prototype (spec §6):
 *   /prototype/go?screen=billing&state=low   apply the state, open the route
 *   /prototype/go?preset=trial-admin         apply the preset, open its entry route
 *   /prototype/go?flow=buy-credits&step=2    the n-th step (1-based) of a flow
 * Unknown ids go back to the Index.
 */
function Go() {
  const router = useRouter();
  const sp = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    // The apply rewrites the address bar (view params), so run once per visit.
    if (started.current) return;
    started.current = true;
    const screenId = sp.get("screen");
    const stateId = sp.get("state");
    const flow = FLOWS.find((f) => f.id === sp.get("flow"));
    const step = Number(sp.get("step") ?? "1") || 1;
    const fs = flow ? flow.steps[Math.min(Math.max(step, 1), flow.steps.length) - 1] : undefined;
    (async () => {
      const preset = presetById(sp.get("preset"));
      if (preset) return router.replace(await landPreset(preset));
      const screen = screenById(fs?.screen ?? screenId);
      if (!screen) return router.replace("/prototype");
      const state = screen.states.find((x) => x.id === (fs?.state ?? stateId));
      router.replace(await landState(screen, state));
    })();
  }, [router, sp]);

  return (
    <div className="start">
      <div className="start-card">
        <Logo full height={30} themeAware />
        <p className="start-sub" role="status">
          Setting up the prototype…
        </p>
      </div>
    </div>
  );
}

export default function GoPage() {
  return (
    <Suspense fallback={null}>
      <Go />
    </Suspense>
  );
}
