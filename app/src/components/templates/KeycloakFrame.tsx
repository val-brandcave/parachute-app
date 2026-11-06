import { Icon, Logo } from "@/components/atoms";

/**
 * The page Keycloak (CIM) renders in production, themed for Parachute (RWT-1061).
 * Parachute never renders this: the persistent tag says so, so no engineer
 * mistakes it for a Parachute-owned form. Calm canvas, one 420 card.
 */
export function KeycloakFrame({
  children,
  template,
  below,
  after,
}: {
  children: React.ReactNode;
  /** The Keycloak template this screen themes, e.g. "register.ftl". */
  template?: string;
  /** Content between the secured line and the template chip (e.g. legal text). */
  below?: React.ReactNode;
  /** Content after the template chip (e.g. the demo-accounts disclosure). */
  after?: React.ReactNode;
}) {
  return (
    <div className="kc">
      <div className="kc-tag" role="note">
        <Icon name="info" size={14} />
        Keycloak theme reference · RWT-1061
      </div>
      <main className="kc-main">
        <div className="kc-card">
          <Logo full height={30} themeAware />
          {children}
        </div>
        <div className="kc-secure">
          <Icon name="shield" size={14} />
          <span>
            Secured by <b>Realwired ID</b>
          </span>
        </div>
        {below}
        {template && (
          <div className="kc-secure" style={{ marginTop: 8 }} aria-hidden="true">
            <span className="ui-chip">{template}</span>
          </div>
        )}
        {after}
      </main>
      <footer className="kc-foot">
        <span>Realwired</span>
        <span aria-hidden="true">·</span>
        <a href="#help">Help</a>
        <span aria-hidden="true">·</span>
        <a href="#privacy">Privacy</a>
      </footer>
    </div>
  );
}
