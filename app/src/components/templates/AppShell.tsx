import { Sidebar } from "@/components/organisms/Sidebar";
import { AppHeader } from "@/components/organisms/AppHeader";
import { OrderModal } from "@/components/organisms/OrderModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="maincol">
        {/* Ambient teal streaks tracing the sidebar + header divider hairlines */}
        <span className="edge-beam edge-beam--v" aria-hidden="true" />
        <span className="edge-beam edge-beam--h" aria-hidden="true" />
        <AppHeader />
        <main className="content scroll">{children}</main>
      </div>
      <OrderModal />
    </div>
  );
}
