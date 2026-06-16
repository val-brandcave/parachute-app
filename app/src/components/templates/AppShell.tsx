import { Sidebar } from "@/components/organisms/Sidebar";
import { AppHeader } from "@/components/organisms/AppHeader";
import { OrderModal } from "@/components/organisms/OrderModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="maincol">
        <AppHeader />
        <main className="content scroll">{children}</main>
      </div>
      <OrderModal />
    </div>
  );
}
