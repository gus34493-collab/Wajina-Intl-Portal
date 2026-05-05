import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  analyzerMode: "static",
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  // Keep heavy server-only packages out of the client bundle
  serverExternalPackages: ["@react-pdf/renderer", "canvas"],
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: true,

  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  // Forward /api/* to the Express server for any path not handled by a
  // Next.js API route. Next.js routes always take priority over rewrites,
  // so migrated routes are served locally automatically.
  async rewrites() {
    const expressUrl = process.env.EXPRESS_API_URL ?? "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${expressUrl}/api/:path*`,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
