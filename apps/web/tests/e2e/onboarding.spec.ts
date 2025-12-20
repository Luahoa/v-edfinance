import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
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
    await expect(page).toHaveURL(/.*onboarding/);

    // 4. Hoàn thành khảo sát hồ sơ đầu tư (Investment Profile)
    // Giả định có các câu hỏi trắc nghiệm
    await page.click('[data-testid="onboarding-beginner"]'); // Bước 1
    await page.click('[data-testid="onboarding-longterm"]'); // Bước 2
    await page.click('[data-testid="onboarding-medium"]'); // Bước 3
    
    await page.click('[data-testid="onboarding-complete"]');

    // 5. Kiểm tra chuyển hướng về Dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Kiểm tra sự xuất hiện của các thành phần Dashboard
    await expect(page.locator('h1')).toContainText(/Chào mừng|Welcome/);
    await expect(page.locator('[data-testid="streak-counter"]')).toBeVisible();
  });

  test('should support language switching to English', async ({ page }) => {
    await page.goto('/vi/register');
    
    // Chuyển sang tiếng Anh
    await page.selectOption('[data-testid="lang-switcher"]', 'en');
    
    // Đợi URL thay đổi và đảm bảo h2 đã cập nhật bản dịch
    await expect(page).toHaveURL(/.*en\/register/);
    await page.waitForTimeout(500); // Thêm thời gian nhỏ cho hydration
    await expect(page.locator('h2')).toContainText('Register');
  });
});
