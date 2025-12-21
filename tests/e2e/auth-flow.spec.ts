import { test, expect } from '@playwright/test';

test.describe('E001: User Registration & Login Flow', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`BROWSER ERROR: ${msg.text()}`);
      }
    });
  });

  test('should complete full registration → login → dashboard flow', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `e2e-user-${timestamp}@vedfinance.test`;

    // 1. Navigate to homepage
    await page.goto('/vi');
    await expect(page).toHaveURL(/\/vi$/);

    // 2. Navigate to register
    await page.click('[data-testid="header-register"]');
    await expect(page).toHaveURL(/\/vi\/register/);
    await expect(page.locator('h2')).toContainText('Đăng ký');

    // 3. Fill registration form
    await page.fill('[data-testid="register-name"]', 'E2E Test User');
    await page.fill('[data-testid="register-email"]', testEmail);
    await page.fill('[data-testid="register-password"]', 'SecurePass123!');
    await page.fill('[data-testid="register-password-confirm"]', 'SecurePass123!');
    
    // 4. Submit registration
    await page.click('[data-testid="register-submit"]');

    // 5. Should redirect to onboarding after successful registration
    await page.waitForURL(/\/vi\/onboarding/, { timeout: 15000 });
    
    // 6. Complete onboarding quickly
    await page.click('[data-testid="onboarding-beginner"]');
    await page.click('[data-testid="onboarding-longterm"]');
    await page.click('[data-testid="onboarding-medium"]');
    await page.click('[data-testid="onboarding-complete"]');

    // 7. Should redirect to dashboard
    await page.waitForURL(/\/vi\/dashboard/, { timeout: 15000 });
    
    // 8. Validate JWT stored (check localStorage or cookies)
    const hasAuth = await page.evaluate(() => {
      return !!(localStorage.getItem('accessToken') || document.cookie.includes('accessToken'));
    });
    expect(hasAuth).toBeTruthy();

    // 9. Validate protected route accessible
    await expect(page.locator('h1')).toContainText(/Chào mừng|Dashboard/);
    await expect(page.locator('[data-testid="user-profile-menu"]')).toBeVisible();

    // 10. Logout
    await page.click('[data-testid="user-profile-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // 11. Should redirect to login page after logout
    await page.waitForURL(/\/vi\/(login|$)/, { timeout: 10000 });
    
    // 12. Login again with same credentials
    await page.goto('/vi/login');
    await page.fill('[data-testid="login-email"]', testEmail);
    await page.fill('[data-testid="login-password"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');

    // 13. Should redirect back to dashboard
    await page.waitForURL(/\/vi\/dashboard/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText(/Chào mừng|Dashboard/);
  });

  test('should show validation errors on invalid registration', async ({ page }) => {
    await page.goto('/vi/register');

    // Submit empty form
    await page.click('[data-testid="register-submit"]');

    // Verify error messages
    await expect(page.locator('text=/Tên|Name.*required/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Email.*required/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Password.*required/i')).toBeVisible({ timeout: 5000 });
  });

  test('should prevent access to protected routes when not authenticated', async ({ page, context }) => {
    // Clear all auth
    await context.clearCookies();
    await page.goto('/vi/dashboard');

    // Should redirect to login
    await page.waitForURL(/\/vi\/login/, { timeout: 10000 });
    await expect(page.locator('h2')).toContainText(/Đăng nhập|Login/);
  });

  test('should support email verification flow (if enabled)', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `verify-${timestamp}@vedfinance.test`;

    await page.goto('/vi/register');
    await page.fill('[data-testid="register-name"]', 'Verify User');
    await page.fill('[data-testid="register-email"]', testEmail);
    await page.fill('[data-testid="register-password"]', 'SecurePass123!');
    await page.fill('[data-testid="register-password-confirm"]', 'SecurePass123!');
    await page.click('[data-testid="register-submit"]');

    // Check if verification page appears or direct login
    const currentUrl = page.url();
    if (currentUrl.includes('verify')) {
      await expect(page.locator('text=/Kiểm tra email|Check your email/i')).toBeVisible();
    }
  });
});
