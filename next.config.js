/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly tell Next.js where the app lives
  distDir: '.next',
  // Ensure the server doesn't try to "static export" the API
  output: 'standalone',
  // Force clean build
  generateBuildId: async () => 'build-final-v1'
};

module.exports = nextConfig;
