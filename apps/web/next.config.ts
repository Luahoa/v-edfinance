import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Standalone output for Docker deployment
  // Reduces image size from ~1GB to ~150MB
  output: 'standalone',
  // Disable telemetry in production
  experimental: {
    outputFileTracingIncludes: {
      '/': ['./public/**/*'],
    },
  },
};

export default withNextIntl(nextConfig);
