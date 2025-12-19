import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, completeOnboarding, assertUserIsLoggedIn } from '../../helpers/test-utils';

test.describe('Auth: Registration & Onboarding Flow', () => {
  const locales = ['vi', 'en', 'zh'];

  for (const locale of locales) {
    test(`[${locale}] Full flow: Register -> Onboarding -> Dashboard`, async ({ page }) => {
      const user = generateTestUser();
      
      // 1. Registration
      await registerUser(page, user, locale);
      
      // Handle potential success redirect or direct to onboarding
      await expect(page).toHaveURL(new RegExp(`.*(${locale}/onboarding|${locale}/dashboard)`));

      // 2. Onboarding (if redirected)
      if (page.url().includes('onboarding')) {
        await completeOnboarding(page);
      }

      // 3. Verification
      await assertUserIsLoggedIn(page);
      
      // Verify gamification init (Badge/Points)
      // Note: This assumes UI elements exist for these
      const points = page.locator('[data-testid="user-points"]');
      if (await points.isVisible()) {
        await expect(points).not.toHaveText('0');
      }
    });
  }

  test('Registration validation errors', async ({ page }) => {
    await page.goto('/vi/register');
    const submitBtn = page.locator('button').filter({ hasText: /Đăng ký/i }).first();
    
    // Empty submit
    await submitBtn.click();
    
    // Expect error messages (localized)
    await expect(page.locator('text=Email không hợp lệ').or(page.locator('text=Bắt buộc'))).toBeVisible();
  });

  test('Reject duplicate email', async ({ page }) => {
    // This assumes we have a way to know a duplicate email or use a fixed one known to exist
    const duplicateEmail = 'test@example.com'; 
    await page.goto('/vi/register');
    await page.fill('input[type="text"]', 'Duplicate User');
    await page.fill('input[type="email"]', duplicateEmail);
    await page.fill('input[type="password"]', 'Password123!');
    
    const submitBtn = page.locator('button').filter({ hasText: /Đăng ký/i }).first();
    await submitBtn.click();
    
    // Error message for duplicate email
    await expect(page.locator('text=Email đã tồn tại').or(page.locator('text=already exists'))).toBeVisible();
  });
});

test.describe('Auth: Login Flow', () => {
  test('Successful Login', async ({ page }) => {
    // Use fixed test credentials or registered one
    await page.goto('/vi/login');
    await page.fill('[data-testid="login-email-input"]', 'test@example.com');
    await page.fill('[data-testid="login-password-input"]', 'password123');
    await page.click('[data-testid="login-submit-btn"]');
    
    await expect(page).toHaveURL(/\/vi\/dashboard/);
    await assertUserIsLoggedIn(page);
  });

  test('Reject invalid credentials', async ({ page }) => {
    await page.goto('/vi/login');
    await page.fill('[data-testid="login-email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="login-password-input"]', 'wrongpass');
    await page.click('[data-testid="login-submit-btn"]');
    
    await expect(page.locator('text=Thông tin đăng nhập không chính xác').or(page.locator('text=Invalid'))).toBeVisible();
  });

  test('Redirect to login for protected routes', async ({ page }) => {
    await page.goto('/vi/dashboard');
    // Should be redirected to login
    await expect(page).toHaveURL(/\/vi\/login/);
  });
});
