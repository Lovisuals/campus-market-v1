import type { NextConfig } from "next";

// @ts-ignore
const nextConfig: any = {
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  typescript: {
    // We want to see real errors now that we've stabilized
    ignoreBuildErrors: false,
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