import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 4,
  reporter: 'list',
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-vi',
      use: { ...devices['Desktop Chrome'], locale: 'vi-VN' },
    },
    {
      name: 'chromium-en',
      use: { ...devices['Desktop Chrome'], locale: 'en-US' },
    },
    {
      name: 'webkit-mobile-vi',
      use: { ...devices['iPhone 14'], locale: 'vi-VN' },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120 * 1000,
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:3000/api/mock',
      NODE_ENV: 'test',
    },
  },
});
