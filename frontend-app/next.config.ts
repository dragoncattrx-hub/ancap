import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Only proxy API to localhost during local development.
    // In production, /api/* should be handled by the reverse proxy on https://ancap.cloud/api
    if (process.env.NODE_ENV !== "development") return [];

    return [
      {
        source: "/api/v1/:path*",
        // Use a dedicated local port for Docker API to avoid loopback conflicts on Windows.
        destination: "http://127.0.0.1:8001/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
