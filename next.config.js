/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  trailingSlash: true,
  // Disable server-side features for static export
  experimental: {
    esmExternals: 'loose',
  },
};

module.exports = nextConfig;