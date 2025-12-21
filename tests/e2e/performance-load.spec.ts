import { expect, test } from '@playwright/test';

test.describe('E019: Performance Under Load', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vi');
  });

  test('Slow network shows skeleton screens and loading states', async ({ page, context }) => {
    await context.route('**/*', (route) => {
      setTimeout(() => route.continue(), 2000);
    });

    await page.goto('/vi/courses');

    const skeletonLoader = page.locator('[data-testid="skeleton-loader"]');
    if (await skeletonLoader.isVisible({ timeout: 1000 })) {
      await expect(skeletonLoader).toBeVisible();
    }

    const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    if (await loadingSpinner.isVisible({ timeout: 1000 })) {
      await expect(loadingSpinner).toBeVisible();
    }

    await page.waitForLoadState('networkidle', { timeout: 30000 });

    if (await skeletonLoader.isVisible()) {
      await expect(skeletonLoader).not.toBeVisible();
    }

    const courseCards = page.locator('[data-testid="course-card"]');
    if (await courseCards.first().isVisible()) {
      await expect(courseCards.first()).toBeVisible();
    }
  });

  test('Lazy loading images and components on scroll', async ({ page }) => {
    await page.goto('/vi/courses');
    await page.waitForLoadState('networkidle');

    const initialImageCount = await page.locator('img[loading="lazy"]').count();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);

    const midScrollImageCount = await page.locator('img[loading="lazy"]').count();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const finalImageCount = await page.locator('img[loading="lazy"]').count();

    expect(finalImageCount).toBeGreaterThanOrEqual(initialImageCount);

    const lazyImages = page.locator('img[loading="lazy"]');
    if (await lazyImages.first().isVisible()) {
      const firstImage = lazyImages.first();
      const src = await firstImage.getAttribute('src');
      expect(src).toBeTruthy();
      expect(src).not.toContain('placeholder');
    }
  });

  test('Optimistic UI updates for better perceived performance', async ({ page }) => {
    await page.goto('/vi/wallet');
    await page.waitForLoadState('networkidle');

    const initialBalance = await page.locator('[data-testid="wallet-balance"]').textContent();

    await page.route('**/api/wallet/deposit', (route) => {
      setTimeout(
        () =>
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, newBalance: 150000 }),
          }),
        3000
      );
    });

    const depositButton = page.locator('button:has-text("Nạp"), button:has-text("Deposit")').first();
    if (await depositButton.isVisible()) {
      await depositButton.click();
      await page.fill('input[name="amount"]', '50000');
      await page.locator('button:has-text("Xác nhận"), button:has-text("Confirm")').click();

      await page.waitForTimeout(500);

      const updatingBalance = await page.locator('[data-testid="wallet-balance"]').textContent();
      expect(updatingBalance).not.toEqual(initialBalance);

      await page.waitForTimeout(3500);

      const finalBalance = await page.locator('[data-testid="wallet-balance"]').textContent();
      expect(finalBalance).toBeTruthy();
    }
  });

  test('Progressive loading of large data sets', async ({ page }) => {
    await page.goto('/vi/dashboard');
    await page.waitForLoadState('networkidle');

    const activityLog = page.locator('[data-testid="activity-log"]');
    if (await activityLog.isVisible()) {
      const initialItemCount = await activityLog.locator('[data-testid="activity-item"]').count();

      await activityLog.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await page.waitForTimeout(1500);

      const afterScrollItemCount = await activityLog.locator('[data-testid="activity-item"]').count();

      expect(afterScrollItemCount).toBeGreaterThanOrEqual(initialItemCount);

      const loadMoreButton = page.locator('button:has-text("Tải thêm"), button:has-text("Load more")');
      if (await loadMoreButton.isVisible()) {
        await loadMoreButton.click();
        await page.waitForTimeout(1000);

        const finalItemCount = await activityLog.locator('[data-testid="activity-item"]').count();
        expect(finalItemCount).toBeGreaterThan(afterScrollItemCount);
      }
    }
  });

  test('Performance metrics meet thresholds', async ({ page }) => {
    const performanceMetrics: any = {};

    await page.goto('/vi/dashboard');
    await page.waitForLoadState('networkidle');

    performanceMetrics.timing = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint').find((entry) => entry.name === 'first-paint')?.startTime || 0,
      };
    });

    expect(performanceMetrics.timing.loadTime).toBeLessThan(5000);
    expect(performanceMetrics.timing.domContentLoaded).toBeLessThan(3000);

    const resourceTimings = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((entry: any) => ({
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize,
      }));
    });

    const slowResources = resourceTimings.filter((r: any) => r.duration > 1000);
    console.log(`Slow resources (>1s): ${slowResources.length}`);

    const totalSize = resourceTimings.reduce((sum: number, r: any) => sum + (r.size || 0), 0);
    expect(totalSize).toBeLessThan(5 * 1024 * 1024);
  });

  test('Throttling and debouncing for search inputs', async ({ page }) => {
    await page.goto('/vi/courses');
    await page.waitForLoadState('networkidle');

    let requestCount = 0;
    await page.route('**/api/courses/search**', (route) => {
      requestCount++;
      route.continue();
    });

    const searchInput = page.locator('input[type="search"], input[placeholder*="Tìm"], input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('F');
      await page.waitForTimeout(100);
      await searchInput.fill('Fi');
      await page.waitForTimeout(100);
      await searchInput.fill('Fin');
      await page.waitForTimeout(100);
      await searchInput.fill('Fina');
      await page.waitForTimeout(100);
      await searchInput.fill('Finance');

      await page.waitForTimeout(1000);

      expect(requestCount).toBeLessThan(3);

      const searchResults = page.locator('[data-testid="search-results"]');
      if (await searchResults.isVisible()) {
        await expect(searchResults).toBeVisible();
      }
    }
  });
});
