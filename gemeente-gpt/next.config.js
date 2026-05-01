/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'tesseract.js', '@prisma/client'],
  },
};

module.exports = nextConfig;
