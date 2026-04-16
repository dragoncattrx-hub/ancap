import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/w", destination: "/", permanent: true },
      { source: "/w/", destination: "/", permanent: true },
      { source: "/w/:path+", destination: "/:path+", permanent: true },
    ];
  },
  // Fresh Docker builds get new chunk filenames.
  generateBuildId: async () => {
    if (process.env.NODE_ENV === "development") return "development";
    return process.env.NEXT_BUILD_ID || `local-${Date.now()}`;
  },
  // App Router: RSC prefetch from a public hostname (Cloudflare Tunnel) to local dev must be allowed.
  allowedDevOrigins: [
    "https://ancap.cloud",
    "https://www.ancap.cloud",
    "http://ancap.cloud",
    "http://www.ancap.cloud",
  ],
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];

    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:8001/v1/:path*",
      },
      // Swagger UI (same paths as prod nginx: /api → backend, /openapi.json for spec)
      { source: "/api/docs", destination: "http://127.0.0.1:8001/docs" },
      { source: "/api/redoc", destination: "http://127.0.0.1:8001/redoc" },
      { source: "/openapi.json", destination: "http://127.0.0.1:8001/openapi.json" },
    ];
  },
};

export default nextConfig;
