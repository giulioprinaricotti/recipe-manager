import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/recipes/:id/schema.json",
        destination: "/api/recipes/:id/schema",
      },
    ];
  },
};

export default nextConfig;
