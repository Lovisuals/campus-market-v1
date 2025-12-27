import type { NextConfig } from "next";

// @ts-ignore
const nextConfig: any = {
  // 1. Force TypeScript to ignore errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // 2. Force ESLint to ignore errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 3. Allow images from everywhere
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;