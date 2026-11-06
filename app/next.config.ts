import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // App entry: send the root to the demo entry fork (/start) at the routing
      // layer (checked before the filesystem) so no `Home` component is rendered.
      {
        source: "/",
        destination: "/start",
        permanent: false, // 307 — entry redirect, not a cacheable redirect
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
