/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: __dirname, // Explicitly set the root directory to avoid warnings
  },
};
module.exports = nextConfig;
