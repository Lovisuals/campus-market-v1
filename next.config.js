/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // This unique ID forces Vercel to treat this as a fresh build
  generateBuildId: async () => `build-${Date.now()}`,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com', pathname: '**' }],
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
