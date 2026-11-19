import { Logo } from "@/components/atoms";
import { LockDialog } from "@/components/organisms/LockDialog";
import { ProtoPill } from "@/components/organisms/prototype/ProtoPill";

/**
 * (onboarding) route group: Parachute-owned, standalone (no shell), after the
 * Keycloak token. Logo top-left, centred card, footer. The prototype state pill is
 * mounted here too so a presenter can approve a pending workspace from this canvas.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wel">
      <div className="wel-top">
        <Logo full height={25} themeAware />
      </div>
      <main className="wel-main">{children}</main>
      <footer className="wel-foot">
        <span>Secured by Realwired ID</span>
        <span aria-hidden="true">·</span>
        <a href="#help">Help</a>
        <span aria-hidden="true">·</span>
        <a href="#privacy">Privacy</a>
      </footer>
      <LockDialog />
      <ProtoPill />
    </div>
  );
}
