import { Logo } from "@/components/atoms";
import { DemoDock } from "@/components/organisms";

/**
 * (onboarding) route group: Parachute-owned, standalone (no shell), after the
 * Keycloak token. Logo top-left, centred card, footer. The demo dock is mounted
 * here too so a presenter can approve a pending workspace from this canvas.
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
      <DemoDock />
    </div>
  );
}
