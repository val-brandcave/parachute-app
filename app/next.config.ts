import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prototype-only: lets parallel build agents run separate dev servers without sharing .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async redirects() {
    return [
      // App entry: send the root to the Prototype Index at the routing layer
      // (checked before the filesystem) so no page component renders just to redirect.
      {
        source: "/",
        destination: "/prototype",
        permanent: false, // 307 — entry redirect, not a cacheable redirect
      },
      // The old demo launcher (/start) is retired into the Prototype Index (PC-13);
      // old shared links keep working. Done here, not in a page: a page that calls
      // redirect() during render trips Next 16 dev's performance.measure
      // ("StartPage cannot have a negative time stamp").
      {
        source: "/start",
        destination: "/prototype",
        permanent: false,
      },
      // RWT-1130 removed Parachute's own sign-in; /login is the Keycloak-styled page now.
      {
        source: "/login",
        destination: "/auth/sign-in",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
