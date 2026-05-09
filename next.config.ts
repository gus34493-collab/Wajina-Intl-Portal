import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  analyzerMode: "static",
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  output: "standalone",
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

};

export default withBundleAnalyzer(nextConfig);
