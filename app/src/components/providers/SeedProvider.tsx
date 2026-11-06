"use client";

import { useEffect, useState } from "react";
import { adapter } from "@/data/adapters";
import { loadSessionData } from "@/store/session-data";
import { useDemoStore } from "@/store/demo.store";
import {
  DEMO_ENABLED,
  clearPersonaParam,
  personaById,
  readPersonaParam,
  readStoredPersona,
} from "@/lib/demo";

/**
 * Seeds the mock data store (localStorage) once on the client before rendering
 * the app. On repeat loads the seed check is instant. With the API adapter this
 * is a no-op. localStorage is browser-only, so seeding happens client-side.
 */
export function SeedProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    adapter
      .seed()
      .then(async () => {
        // Demo only: ?persona= (read once) wins over the remembered persona, so a
        // reload stays in character. Otherwise load the default identity's data.
        const wanted = DEMO_ENABLED ? readPersonaParam() ?? readStoredPersona() : null;
        clearPersonaParam();
        if (wanted && personaById(wanted)) await useDemoStore.getState().apply(wanted);
        else await loadSessionData();
      })
      .catch((e) => console.error("seed failed", e))
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(135deg,#0d2a3d 0%,#10344C 50%,#1b4f73 100%)",
          color: "#fff",
        }}
      >
        <div style={{ textAlign: "center", opacity: 0.85 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            PARACHUTE
          </div>
          <div style={{ fontSize: 13, marginTop: 6, opacity: 0.7 }}>
            Loading…
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
