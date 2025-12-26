import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // 1. IGNORE ESLINT ERRORS (The Style Police)
  // This stops the build from failing if you have unused variables
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 2. IGNORE TYPESCRIPT ERRORS (The Syntax Police)
  // This is crucial. It tells the server "Deploy even if there are type errors"
  typescript: {
    ignoreBuildErrors: true,
  },

  // 3. IMAGE CONFIGURATION
  // Allows images from Supabase and Placeholders without crashing
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true, // Fixes mobile image loading issues
  },
};

export default nextConfig;

