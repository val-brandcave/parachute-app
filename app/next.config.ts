import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // App entry: send the root straight to login at the routing layer
      // (checked before the filesystem) so no `Home` component is rendered.
      {
        source: "/",
        destination: "/login",
        permanent: false, // 307 — auth-dependent entry, not a cacheable redirect
      },
    ];
  },
};

export default nextConfig;
