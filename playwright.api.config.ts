import { defineConfig } from '@playwright/test';

/**
 * Playwright config for tRPC API E2E tests
 * Runs against the server directly (no browser needed)
 */
export default defineConfig({
  testDir: './tests/e2e/api',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['html', { outputFolder: 'playwright-report/api' }],
    ['list'],
  ],
  use: {
    // API tests don't need baseURL for browser
    // We use direct HTTP calls to the server
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
  // No browser projects needed for API tests
  projects: [
    {
      name: 'api-tests',
      use: {},
    },
  ],
  // Start the API server before running tests
  webServer: {
    command: 'pnpm --filter server dev',
    url: 'http://localhost:3001/trpc/user.testDb',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
