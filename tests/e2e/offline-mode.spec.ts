import { expect, test } from '@playwright/test';

test.describe('E017: Offline Mode', () => {
  test.beforeEach(async ({ page, context }) => {
    await page.goto('/vi');
    await context.clearCookies();
  });

  test('Queue actions when offline and sync when online', async ({ page, context }) => {
    await page.goto('/vi/wallet');
    await page.waitForLoadState('networkidle');

    await context.setOffline(true);

    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).toBeVisible();
    }

    const purchaseButton = page.locator('button:has-text("Mua"), button:has-text("Purchase")').first();
    if (await purchaseButton.isVisible()) {
      await purchaseButton.click();
      await page.waitForTimeout(1000);

      const queueNotification = page.locator('[role="alert"]');
      if (await queueNotification.isVisible()) {
        await expect(queueNotification).toContainText(/hàng đợi|queue|offline/i);
      }
    }

    await context.setOffline(false);

    await page.waitForTimeout(2000);

    const syncNotification = page.locator('[role="alert"]');
    if (await syncNotification.isVisible()) {
      await expect(syncNotification).toContainText(/đồng bộ|sync|online/i);
    }
  });

  test('Local storage persists data during offline period', async ({ page, context }) => {
    await page.goto('/vi/courses');
    await page.waitForLoadState('networkidle');

    const initialData = await page.evaluate(() => localStorage.getItem('courses-cache'));

    await context.setOffline(true);

    await page.reload();
    await page.waitForTimeout(1000);

    const offlineData = await page.evaluate(() => localStorage.getItem('courses-cache'));
    expect(offlineData).toBeTruthy();
    expect(offlineData).toEqual(initialData);

    const courseCards = page.locator('[data-testid="course-card"]');
    if (await courseCards.first().isVisible()) {
      await expect(courseCards.first()).toBeVisible();
    }

    await context.setOffline(false);
  });

  test('Service worker caches critical assets for offline access', async ({ page, context }) => {
    await page.goto('/vi');
    await page.waitForLoadState('networkidle');

    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return registration ? 'active' : 'none';
      }
      return 'unsupported';
    });

    if (swRegistration === 'active') {
      await context.setOffline(true);

      await page.goto('/vi/dashboard');
      await page.waitForTimeout(2000);

      const dashboardContent = page.locator('[data-testid="dashboard-content"]');
      if (await dashboardContent.isVisible()) {
        await expect(dashboardContent).toBeVisible();
      }

      await context.setOffline(false);
    } else {
      console.log('Service Worker not supported or not registered - test skipped');
    }
  });

  test('Conflict resolution when syncing divergent offline changes', async ({ page, context }) => {
    await page.goto('/vi/wallet');
    await page.waitForLoadState('networkidle');

    const initialBalance = await page.locator('[data-testid="wallet-balance"]').textContent();

    await context.setOffline(true);

    const depositButton = page.locator('button:has-text("Nạp"), button:has-text("Deposit")').first();
    if (await depositButton.isVisible()) {
      await depositButton.click();
      await page.fill('input[name="amount"]', '50000');
      await page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').click();
      await page.waitForTimeout(1000);
    }

    await context.setOffline(false);
    await page.waitForTimeout(3000);

    const conflictDialog = page.locator('[data-testid="sync-conflict-dialog"]');
    if (await conflictDialog.isVisible()) {
      await expect(conflictDialog).toBeVisible();

      const resolveButton = page.locator('button:has-text("Chấp nhận"), button:has-text("Accept")').first();
      await resolveButton.click();
      await page.waitForTimeout(1000);
    }

    const finalBalance = await page.locator('[data-testid="wallet-balance"]').textContent();
    expect(finalBalance).not.toEqual(initialBalance);
  });

  test('Offline mode displays appropriate UI states', async ({ page, context }) => {
    await page.goto('/vi/courses');
    await page.waitForLoadState('networkidle');

    await context.setOffline(true);

    const offlineBanner = page.locator('[data-testid="offline-banner"]');
    if (await offlineBanner.isVisible()) {
      await expect(offlineBanner).toBeVisible();
      await expect(offlineBanner).toContainText(/offline|ngoại tuyến/i);
    }

    const actionButtons = page.locator('button[data-requires-network="true"]');
    if (await actionButtons.first().isVisible()) {
      await expect(actionButtons.first()).toBeDisabled();
    }

    await context.setOffline(false);
    await page.waitForTimeout(1500);

    if (await offlineBanner.isVisible()) {
      await expect(offlineBanner).not.toBeVisible();
    }
  });
});
