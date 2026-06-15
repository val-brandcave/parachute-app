"use client";

import { useEffect, useState } from "react";
import { adapter } from "@/data/adapters";

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
