import type { NextConfig } from "next";

// @ts-ignore
const nextConfig: any = {
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // We removed the 'eslint' block to fix the warning
};

export default nextConfig;