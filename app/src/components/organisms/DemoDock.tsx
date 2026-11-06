"use client";

import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/atoms";
import { DEMO_ENABLED, personaById } from "@/lib/demo";
import { useCurrentOrg, useCurrentUser } from "@/lib/current-user";
import { useDemoStore } from "@/store/demo.store";
import { useWalletStore } from "@/store/wallet.store";

/**
 * PROTOTYPE ONLY. A small floating chip so the presenter can push state without
 * leaving the page: current persona, reset the org, approve a pending workspace,
 * add credits. Mounted once in AppShell; gated by NEXT_PUBLIC_DEMO_PERSONAS.
 */
export function DemoDock() {
  const router = useRouter();
  const open = useDemoStore((s) => s.dockOpen);
  const toggle = useDemoStore((s) => s.toggleDock);
  const personaId = useDemoStore((s) => s.personaId);
  const me = useCurrentUser();
  const org = useCurrentOrg();
  const balance = useWalletStore((s) => s.ledger.reduce((sum, e) => sum + e.credits, 0));

  // Children only render after SeedProvider is ready (client side), so `document` exists.
  if (!DEMO_ENABLED) return null;

  const persona = personaById(personaId);
  const pending = org.org?.approval === "pending";

  const reset = async () => {
    const { removed } = await useDemoStore.getState().resetOrg();
    if (removed) router.push("/start");
  };

  return createPortal(
    <div className="demo-dock" data-open={open || undefined}>
      {open && (
        <div className="demo-dock-panel" role="group" aria-label="Demo controls">
          <div className="demo-dock-id">
            <span className="demo-dock-name">{me.name}</span>
            <span className="demo-dock-sub">
              {me.role.replace("_", " ")} at {org.name}
            </span>
            {org.org?.billing !== "invoiced" && (
              <span className="demo-dock-sub">
                {balance} {balance === 1 ? "credit" : "credits"}
              </span>
            )}
          </div>
          <div className="demo-dock-actions">
            <button className="demo-dock-btn" onClick={reset}>
              <Icon name="restore" size={15} /> Reset org
            </button>
            {pending && (
              <button className="demo-dock-btn" onClick={() => useDemoStore.getState().approveOrg()}>
                <Icon name="check-circle" size={15} /> Approve
              </button>
            )}
            <button className="demo-dock-btn" onClick={() => useDemoStore.getState().addCredits(5)}>
              <Icon name="coins" size={15} /> +5 credits
            </button>
            <button className="demo-dock-btn" onClick={() => router.push("/start")}>
              <Icon name="switch" size={15} /> Personas
            </button>
          </div>
        </div>
      )}
      <button
        className="demo-dock-chip"
        onClick={toggle}
        aria-expanded={open}
        aria-label="Demo controls"
      >
        <Icon name="flask" size={15} />
        <span>{persona ? persona.label : "Demo"}</span>
      </button>
    </div>,
    document.body,
  );
}
