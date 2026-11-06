"use client";

import { useEffect, useState } from "react";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { readStoredSession, useSessionStore } from "@/store/session.store";
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
        const param = DEMO_ENABLED ? readPersonaParam() : null;
        const wanted = DEMO_ENABLED ? param ?? readStoredPersona() : null;
        clearPersonaParam();
        const stored = readStoredSession();
        const persona = personaById(wanted);
        // A stored identity that no remembered persona accounts for (a runtime-
        // created org) is restored if its rows still exist; else fall back.
        const personaIsIt = persona && persona.userId === stored?.userId && persona.orgId === stored?.orgId;
        if (stored && !personaIsIt && param === null) {
          const [user, org] = await Promise.all([
            adapter.getById(Collections.USERS, stored.userId),
            adapter.getById(Collections.ORGS, stored.orgId),
          ]);
          if (user && org) {
            useSessionStore.getState().signIn(stored);
            await loadSessionData();
            return;
          }
        }
        if (wanted && persona) await useDemoStore.getState().apply(wanted);
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
