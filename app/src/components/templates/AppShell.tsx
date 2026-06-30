"use client";

import { Sidebar } from "@/components/organisms/Sidebar";
import { AppHeader } from "@/components/organisms/AppHeader";
import { OrderModal } from "@/components/organisms/OrderModal";
import { RunModal } from "@/components/run/RunModal";
import { useSessionStore } from "@/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const mode = useSessionStore((s) => s.mode);
  const embedded = mode === "embedded";

  return (
    <div className={`shell${embedded ? " shell--embedded" : ""}`}>
      {/* Embedded (J1) hides the standalone chrome — single-document scope; the
          run flow takes over the viewport and returns to YouConnect on sign. */}
      {!embedded && <Sidebar />}
      <div className="maincol">
        {!embedded && <AppHeader />}
        <main className="content scroll">{children}</main>
      </div>
      {!embedded && <OrderModal />}
      <RunModal />
    </div>
  );
}
