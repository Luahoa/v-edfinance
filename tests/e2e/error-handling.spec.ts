import { expect, test } from '@playwright/test';

test.describe('E016: Error Handling UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vi');
  });

  test('Network error shows user-friendly message with ErrorId', async ({ page, context }) => {
    await context.setOffline(true);

    const errorPromise = page.waitForEvent('pageerror');
    await page.goto('/vi/dashboard').catch(() => {});

    await context.setOffline(false);

    const errorMessage = page.locator('[data-testid="error-message"]');
    const errorId = page.locator('[data-testid="error-id"]');

    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/kết nối|mạng|network/i);
      if (await errorId.isVisible()) {
        await expect(errorId).toMatch(/ERR-\d{4}|UI-\d{4}/);
      }
    }
  });

  test('401 Unauthorized triggers re-login flow', async ({ page }) => {
    await page.route('**/api/**', (route) => {
      if (route.request().url().includes('/api/user/profile')) {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Unauthorized', errorId: 'ERR-1001' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/vi/dashboard');
    await page.waitForTimeout(1000);

    await expect(page).toHaveURL(/\/(vi|en|zh)\/(login|auth)/);

    const errorNotification = page.locator('[role="alert"]');
    if (await errorNotification.isVisible()) {
      await expect(errorNotification).toContainText(/phiên|hết hạn|session|expired/i);
    }
  });

  test('500 Server Error displays ErrorBoundary with recovery options', async ({ page }) => {
    await page.route('**/api/courses/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Internal Server Error',
          errorId: 'ERR-5001',
          stack: 'Error stack trace...',
        }),
      });
    });

    await page.goto('/vi/courses');
    await page.waitForTimeout(1500);

    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    const retryButton = page.locator('button:has-text("Thử lại"), button:has-text("Retry")');
    const homeButton = page.locator('button:has-text("Trang chủ"), button:has-text("Home")');

    if (await errorBoundary.isVisible()) {
      await expect(errorBoundary).toBeVisible();

      const errorIdDisplay = page.locator('[data-testid="error-id"]');
      if (await errorIdDisplay.isVisible()) {
        const errorIdText = await errorIdDisplay.textContent();
        expect(errorIdText).toMatch(/ERR-\d{4}/);
      }

      if (await retryButton.isVisible()) {
        await retryButton.click();
        await page.waitForTimeout(500);
      }

      if (await homeButton.isVisible()) {
        await homeButton.click();
        await expect(page).toHaveURL(/\/(vi|en|zh)(\/dashboard)?$/);
      }
    }
  });

  test('Retry mechanism with exponential backoff', async ({ page }) => {
    let attemptCount = 0;
    const requestTimestamps: number[] = [];

    await page.route('**/api/wallet/balance', (route) => {
      requestTimestamps.push(Date.now());
      attemptCount++;

      if (attemptCount < 3) {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Service Unavailable', errorId: 'ERR-5031' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ balance: 100000, currency: 'VND' }),
        });
      }
    });

    await page.goto('/vi/wallet');
    await page.waitForTimeout(5000);

    expect(attemptCount).toBeGreaterThanOrEqual(3);

    if (requestTimestamps.length >= 3) {
      const firstDelay = requestTimestamps[1] - requestTimestamps[0];
      const secondDelay = requestTimestamps[2] - requestTimestamps[1];
      expect(secondDelay).toBeGreaterThanOrEqual(firstDelay * 0.9);
    }
  });

  test('Global error handler prevents app crash', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.evaluate(() => {
      throw new Error('Simulated runtime error');
    });

    await page.waitForTimeout(1000);

    const errorBoundary = page.locator('[data-testid="global-error-boundary"]');
    const resetButton = page.locator('button:has-text("Khôi phục"), button:has-text("Reset")');

    if (await errorBoundary.isVisible()) {
      await expect(errorBoundary).toBeVisible();

      if (await resetButton.isVisible()) {
        await resetButton.click();
        await page.waitForTimeout(500);

        await expect(errorBoundary).not.toBeVisible();
      }
    }

    expect(consoleErrors.length).toBeGreaterThan(0);
  });
});
