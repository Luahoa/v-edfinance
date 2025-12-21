import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Standalone output for Docker deployment
  // Reduces image size from ~1GB to ~150MB
  output: 'standalone',
  // Disable telemetry in production
  outputFileTracingIncludes: {
    '/': ['./public/**/*'],
  },
};

export default withNextIntl(nextConfig);
