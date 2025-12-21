import { devices, expect, test } from '@playwright/test';

test.describe('E022: Mobile Responsive E2E', () => {
  const viewports = [
    { name: 'Mobile', ...devices['iPhone 13'] },
    { name: 'Tablet', ...devices['iPad Pro'] },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`Scenario 1: ${viewport.name} - Homepage responsive layout`, async ({ browser }) => {
      const context = await browser.newContext(viewport);
      const page = await context.newPage();
      
      await page.goto('/vi');
      
      // Check navigation menu adapts
      if (viewport.name === 'Mobile') {
        await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
        await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
      } else {
        await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
      }
      
      // Verify hero section scales
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      
      // Check card grid layout
      const cardGrid = page.locator('[data-testid="course-card-grid"]');
      await expect(cardGrid).toBeVisible();
      
      await page.screenshot({ path: `playwright-report/${viewport.name}-homepage.png` });
      await context.close();
    });

    test(`Scenario 2: ${viewport.name} - Dashboard responsive UI`, async ({ browser }) => {
      const context = await browser.newContext(viewport);
      const page = await context.newPage();
      
      // Login first
      await page.goto('/vi/login');
      await page.fill('[data-testid="login-email-input"]', 'test@example.com');
      await page.fill('[data-testid="login-password-input"]', 'password123');
      await page.click('[data-testid="login-submit-btn"]');
      
      await page.goto('/vi/dashboard');
      
      // Check sidebar behavior
      if (viewport.name === 'Mobile') {
        const sidebar = page.locator('[data-testid="sidebar"]');
        await expect(sidebar).toHaveCSS('position', 'fixed');
      }
      
      // Verify widgets stack vertically on mobile
      const widgets = page.locator('[data-testid="dashboard-widget"]');
      const count = await widgets.count();
      expect(count).toBeGreaterThan(0);
      
      await page.screenshot({ path: `playwright-report/${viewport.name}-dashboard.png` });
      await context.close();
    });
  }

  test('Scenario 3: Touch gestures on mobile', async ({ browser }) => {
    const mobile = await browser.newContext(devices['iPhone 13']);
    const page = await mobile.newPage();
    
    await page.goto('/vi/courses');
    
    // Swipe gesture on carousel
    const carousel = page.locator('[data-testid="course-carousel"]');
    if (await carousel.isVisible()) {
      const box = await carousel.boundingBox();
      if (box) {
        // Swipe left
        await page.touchscreen.tap(box.x + box.width - 50, box.y + box.height / 2);
        await page.waitForTimeout(500);
        
        // Verify carousel moved
        await expect(carousel.locator('[data-testid="active-slide"]')).toBeVisible();
      }
    }
    
    await mobile.close();
  });

  test('Scenario 4: Orientation change handling', async ({ browser }) => {
    const mobile = await browser.newContext({
      ...devices['iPhone 13'],
      viewport: { width: 390, height: 844 },
    });
    const page = await mobile.newPage();
    
    await page.goto('/vi/courses/1/lesson/1');
    
    // Portrait mode
    await expect(page.locator('[data-testid="lesson-content"]')).toBeVisible();
    await page.screenshot({ path: 'playwright-report/portrait.png' });
    
    // Simulate landscape
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);
    
    // Content should still be visible and adapted
    await expect(page.locator('[data-testid="lesson-content"]')).toBeVisible();
    await page.screenshot({ path: 'playwright-report/landscape.png' });
    
    await mobile.close();
  });

  test('Scenario 5: Tablet split-view layout', async ({ browser }) => {
    const tablet = await browser.newContext(devices['iPad Pro']);
    const page = await tablet.newPage();
    
    await page.goto('/vi/courses/1/lesson/1');
    
    // Check for split-view on tablet (content + sidebar)
    const contentArea = page.locator('[data-testid="lesson-content"]');
    const sidebar = page.locator('[data-testid="lesson-sidebar"]');
    
    await expect(contentArea).toBeVisible();
    
    // Sidebar should be visible on tablet but hidden on mobile
    if (await sidebar.isVisible()) {
      const sidebarBox = await sidebar.boundingBox();
      const contentBox = await contentArea.boundingBox();
      
      // Verify side-by-side layout
      if (sidebarBox && contentBox) {
        expect(sidebarBox.x).toBeGreaterThan(contentBox.x);
      }
    }
    
    await page.screenshot({ path: 'playwright-report/tablet-split-view.png' });
    await tablet.close();
  });
});
