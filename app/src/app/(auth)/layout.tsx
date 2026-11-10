/**
 * (auth) route group: the Keycloak-styled pages. Pre-session, standalone, no
 * shell. Each page wraps itself in `KeycloakFrame`.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
