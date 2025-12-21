import path from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [path.resolve(__dirname, './tests/setup.ts')],
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: [
      '**/node_modules/**',
      'tests/**',
      '**/dist/**',
      '**/.next/**',
      'apps/web/e2e/**',
      'apps/web/tests/e2e/**',
      'beads/**',
      // Skip E2E and heavy integration tests for fast unit test runs
      '**/*.e2e-spec.ts',
      '**/integration/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/', '**/*.spec.ts', '**/*.test.ts', '**/dist/', '**/.next/'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    // Disable UI mode in terminal/automated environments
    ui: false,
    // Use forks pool for stability (avoids thread memory issues on Windows)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 2,
        minForks: 1,
      },
    },
    // Reduced timeout for unit tests (faster failure detection)
    testTimeout: 10000,
    hookTimeout: 15000,
    // Disable watch mode for CI
    watch: false,
    // Faster reporter
    reporter: 'basic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/api/src'),
      '@web': path.resolve(__dirname, './apps/web/src'),
    },
  },
});
