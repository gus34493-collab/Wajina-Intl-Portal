import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: true, // Optimizes for static hosting and legacy .html styles
  
  // Suppress specific warnings about deprecated middleware in non-standard environments
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Experimental features for performance if using Next.js 15+
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
