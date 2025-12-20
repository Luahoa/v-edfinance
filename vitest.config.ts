import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
      globals: true,
      environment: 'node',
      setupFiles: [path.resolve(__dirname, './tests/setup.ts')],
      include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)', '**/*.e2e-spec.ts'],
      exclude: [
        '**/node_modules/**',
        'tests/**',
        '**/dist/**',
        '**/.next/**',
        'apps/web/e2e/**',
        'apps/web/tests/e2e/**',
        'beads/**',
      ],
      coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html', 'lcov'],
          exclude: [
              'node_modules/',
              'tests/',
              '**/*.spec.ts',
              '**/*.test.ts',
              '**/dist/',
              '**/.next/',
          ],
          thresholds: {
              lines: 80,
              functions: 80,
              branches: 75,
              statements: 80,
          },
      },
      // Disable UI mode in terminal/automated environments
      ui: false,
      // Disable parallel pools to reduce overhead on dev machine
      pool: 'threads',
      poolOptions: {
          threads: {
              singleThread: true,
          },
      },
      // Timeout for tests (increase if needed for E2B tests)
      testTimeout: 30000,
      hookTimeout: 60000,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './apps/api/src'),
            '@web': path.resolve(__dirname, './apps/web/src'),
        },
    },
});
