"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { resolveEntryRoute } from "@/lib/landing";
import { personaById } from "@/lib/demo";
import { useDemoStore } from "@/store/demo.store";

/**
 * PROTOTYPE ONLY. Deep link: /demo/<persona> applies the persona, then redirects
 * to its entry route. Unknown ids fall back to the /start launcher.
 */
export default function DemoPersonaPage() {
  const params = useParams<{ persona: string }>();
  const router = useRouter();
  const id = params.persona;
  const persona = personaById(id);

  useEffect(() => {
    let active = true;
    if (!persona) {
      router.replace("/start");
      return;
    }
    useDemoStore
      .getState()
      .apply(persona.id)
      .then((p) => {
        if (active && p) router.replace(resolveEntryRoute(p.entryRoute));
      });
    return () => {
      active = false;
    };
  }, [persona, router]);

  return (
    <div className="start">
      <div className="start-card">
        <Logo full height={30} themeAware />
        <p className="start-sub" style={{ marginTop: 18, marginBottom: 0 }}>
          {persona ? `Switching to ${persona.label}…` : "Unknown demo persona."}
        </p>
      </div>
    </div>
  );
}
