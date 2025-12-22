import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Sequential for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // No retries locally for speed
  workers: 1, // Single worker to avoid conflicts
  timeout: 90000, // 90s global timeout
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off', // Disable video for speed
    actionTimeout: 30000, // Increased for slow compile
    navigationTimeout: 60000, // Increased for Next.js compile
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Disable firefox and mobile for now - focus on chromium only
  ],
  webServer: [
    {
      command: 'pnpm --filter web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 120000,
    },
    {
      command: 'pnpm --filter api dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 120000,
    },
  ],
});
