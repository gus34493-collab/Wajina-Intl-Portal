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

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://api.flutterwave.com https://neon.tech",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

};

export default withBundleAnalyzer(nextConfig);
