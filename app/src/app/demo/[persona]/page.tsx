"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { enterPreset } from "@/lib/landing";
import { presetFor } from "@/lib/prototype/presets";

/**
 * PROTOTYPE ONLY. Deep link alias (spec §6): /demo/<id> resolves to a preset — by
 * preset id or by the nine legacy persona ids — applies it through `enterPreset()` and
 * lands on its entry route via `resolveEntryRoute`. A legacy persona id keeps that
 * persona's seeded identity, so old shared links and every earlier flow land as before.
 * Unknown ids go to the Prototype Index; a Planned preset explains itself and links there
 * instead of applying (same as the scenario popover).
 */
export default function DemoPersonaPage() {
  const params = useParams<{ persona: string }>();
  const router = useRouter();
  const id = params.persona;
  const preset = presetFor(id);

  // Runs once per id: StrictMode's double effect must not apply the preset twice (two
  // overlapping applies used to double the stage org's rows). No cancel on cleanup, so the
  // first run still navigates after StrictMode's simulated unmount.
  const started = useRef<string | null>(null);
  const planned = preset?.status === "planned";
  useEffect(() => {
    if (started.current === id) return;
    started.current = id;
    if (!preset) {
      router.replace("/prototype");
      return;
    }
    if (planned) return;
    void enterPreset(preset, { alias: preset.legacyPersonaId === id }).then((route) => router.replace(route));
  }, [preset, planned, id, router]);

  return (
    <div className="start">
      <div className="start-card">
        <Logo full height={30} themeAware />
        <p className="start-sub" role="status" style={{ marginTop: 18, marginBottom: 0 }}>
          {!preset ? "Unknown preset." : planned ? `${preset.label} is not built yet (Planned).` : `Switching to ${preset.label}…`}
        </p>
        {planned && (
          <p className="start-sub" style={{ marginBottom: 0 }}>
            <Link href="/prototype">Open the Prototype Index</Link>
          </p>
        )}
      </div>
    </div>
  );
}
