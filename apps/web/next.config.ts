import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Standalone mode for Docker - disabled on Windows due to symlink permission issues
  // CI/Docker builds on Linux work correctly
  output: process.env.NEXT_BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default withNextIntl(nextConfig);
