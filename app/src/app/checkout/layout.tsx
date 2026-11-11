import { DemoDock } from "@/components/organisms";
import { LockDialog } from "@/components/organisms/LockDialog";
import { ReceiptDialog } from "@/components/organisms/wallet";

/**
 * Focused checkout frame (spec §5.6, PC-8): outside (shell) — no sidebar, no header.
 * The root layout already provides SeedProvider (stores hydrate), ToastHost and density.
 * Mounts only what checkout needs from AppShell: LockDialog (pending org or a reviewer
 * landing on the URL) and ReceiptDialog (Paid → "View receipt"). The top bar and the
 * two-column body are CheckoutShell's (T3.1). No RunModal, no CheckoutLauncher.
 */
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ReceiptDialog />
      <LockDialog />
      <DemoDock />
    </>
  );
}
