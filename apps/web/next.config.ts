import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Build output mode:
  // - 'standalone' for Docker (Linux CI/Docker only, symlinks fail on Windows)
  // - 'export' for Cloudflare Pages static hosting
  output: process.env.NEXT_OUTPUT_MODE as 'standalone' | 'export' | undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default withNextIntl(nextConfig);
