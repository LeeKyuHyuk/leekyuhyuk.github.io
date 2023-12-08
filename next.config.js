/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      require('./scripts/sitemap-generator');
    }
    return config;
  },
};

module.exports = nextConfig;
