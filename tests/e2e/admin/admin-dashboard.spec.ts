import { expect, test } from '@playwright/test';
import { loginAsAdmin } from '../../helpers/test-utils';

test.describe('E021: Admin Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Scenario 1: Admin login and view metrics', async ({ page }) => {
    await page.goto('/vi/admin/dashboard');
    
    // Verify admin access granted
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    
    // Check key metrics are displayed
    await expect(page.locator('[data-testid="total-users-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-courses-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-metric"]')).toBeVisible();
    
    // Verify real-time analytics widget
    const analyticsWidget = page.locator('[data-testid="real-time-analytics"]');
    await expect(analyticsWidget).toBeVisible();
    
    // Check data refresh indicator
    await expect(page.locator('[data-testid="last-updated-timestamp"]')).toBeVisible();
  });

  test('Scenario 2: User management operations', async ({ page }) => {
    await page.goto('/vi/admin/users');
    
    // Search for a user
    await page.fill('[data-testid="user-search-input"]', 'test@example.com');
    await page.click('[data-testid="search-button"]');
    
    // Verify search results
    await expect(page.locator('[data-testid="user-list-item"]').first()).toBeVisible();
    
    // View user details
    await page.click('[data-testid="user-list-item"]').first();
    await expect(page.locator('[data-testid="user-detail-panel"]')).toBeVisible();
    
    // Suspend user action
    await page.click('[data-testid="suspend-user-btn"]');
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
    await page.click('[data-testid="cancel-btn"]'); // Cancel to avoid actual suspension
  });

  test('Scenario 3: Content moderation workflow', async ({ page }) => {
    await page.goto('/vi/admin/moderation');
    
    // View flagged content
    await expect(page.locator('[data-testid="flagged-content-list"]')).toBeVisible();
    
    // Filter by content type
    await page.selectOption('[data-testid="content-type-filter"]', 'comments');
    
    // Review flagged comment
    const firstFlaggedItem = page.locator('[data-testid="flagged-item"]').first();
    await firstFlaggedItem.click();
    
    // Verify moderation actions available
    await expect(page.locator('[data-testid="approve-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="reject-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="flag-user-btn"]')).toBeVisible();
    
    // Take screenshot for audit trail
    await page.screenshot({ path: 'playwright-report/moderation-panel.png' });
  });

  test('Scenario 4: Role-based access validation', async ({ page }) => {
    // Verify admin can access restricted routes
    const adminRoutes = [
      '/vi/admin/dashboard',
      '/vi/admin/users',
      '/vi/admin/moderation',
      '/vi/admin/analytics',
    ];
    
    for (const route of adminRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route));
      await expect(page.locator('[data-testid="admin-header"]')).toBeVisible();
    }
  });
});

test.describe('E021: Non-Admin Access Restriction', () => {
  test('Scenario 5: Regular user cannot access admin panel', async ({ page }) => {
    // Login as regular user
    await page.goto('/vi/login');
    await page.fill('[data-testid="login-email-input"]', 'user@example.com');
    await page.fill('[data-testid="login-password-input"]', 'password123');
    await page.click('[data-testid="login-submit-btn"]');
    
    // Try to access admin dashboard
    await page.goto('/vi/admin/dashboard');
    
    // Should be redirected to unauthorized page or dashboard
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
    await expect(
      page.locator('text=Unauthorized').or(page.locator('text=Access Denied'))
    ).toBeVisible();
  });
});
