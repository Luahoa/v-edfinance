import { expect, test } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.setTimeout(60000); // Increase timeout for the whole suite

  test.beforeEach(async ({ page, context }) => {
    // Clear cookies for each test to ensure isolation
    await context.clearCookies();

    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning' || msg.type() === 'log') {
        console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
      }
    });
  });

  test('should allow a new user to register and complete onboarding', async ({ page }) => {
    // 1. Đi tới trang đăng ký (mặc định tiếng Việt)
    await page.goto('/vi/register');

    // Kiểm tra tiêu đề trang
    await expect(page.locator('h2')).toContainText('Đăng ký');

    // 2. Điền form đăng ký
    await page.fill('[data-testid="register-name"]', 'Test User');
    await page.fill('[data-testid="register-email"]', `test-user-${Date.now()}@example.com`);
    await page.fill('[data-testid="register-password"]', 'Password123!');
    await page.click('[data-testid="register-submit"]');

    // 3. Sau khi đăng ký thành công, chuyển hướng tới Onboarding
    await page.waitForURL(/.*onboarding/, { timeout: 30000 });
    await expect(page).toHaveURL(/.*onboarding/, { timeout: 30000 });

    // 4. Hoàn thành khảo sát hồ sơ đầu tư (Investment Profile)
    await page.click('[data-testid="onboarding-beginner"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="onboarding-longterm"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid="onboarding-medium"]');
    await page.waitForTimeout(500);

    await Promise.all([
      page.waitForURL(/.*dashboard/, { timeout: 30000 }),
      page.click('[data-testid="onboarding-complete"]'),
    ]);

    // 5. Kiểm tra sự xuất hiện của các thành phần Dashboard
    await expect(page.locator('h1')).toContainText(/Chào mừng|Welcome/, { timeout: 15000 });
    await expect(page.locator('[data-testid="streak-counter"]')).toBeVisible();
  });

  test('should support language switching to English', async ({ page }) => {
    // Đi thẳng tới trang tiếng Anh
    await page.goto('/en/register');

    // Đợi URL ổn định
    await page.waitForURL(/.*\/en\/register/);

    // Đợi nội dung text xuất hiện (English)
    await expect(page.locator('h2')).toContainText('Register', { timeout: 15000 });

    // Thử chuyển ngược lại tiếng Việt qua switcher để kiểm tra switcher
    await page.selectOption('[data-testid="lang-switcher"]', 'vi');
    await page.waitForURL(/.*vi\/register/, { timeout: 10000 });
    await expect(page.locator('h2')).toContainText('Đăng ký', { timeout: 10000 });
  });
});
