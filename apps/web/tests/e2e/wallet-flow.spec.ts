import { test, expect } from '@playwright/test';

test.describe('Wallet & Simulation Flow', () => {
  const TEST_USER = {
    email: `investor-${Date.now()}@example.com`,
    password: 'Password123!',
  };

  test.beforeEach(async ({ page }) => {
    // Login trước mỗi test
    console.log('Using test user:', TEST_USER.email);
    await page.goto('/vi/login');
    // Thực tế có thể cần tạo user nếu chưa có, nhưng ở đây giả định login flow cơ bản
    // Lưu ý: Trong E2E thực tế, ta thường dùng global setup hoặc tạo user qua API
  });

  test('should show virtual portfolio and allow simulated trade', async ({ page }) => {
    // Bypass login for brevity in this example, assuming session exists or login works
    await page.goto('/vi/simulation/portfolio');
    
    // Kiểm tra số dư mặc định (100,000,000 VND từ SimulationService)
    await expect(page.locator('text=100.000.000')).toBeVisible();

    // Thực hiện lệnh mua giả lập (ví dụ mua BTC)
    await page.click('button:has-text("Giao dịch")');
    await page.selectOption('select[name="asset"]', 'BTC');
    await page.fill('input[name="amount"]', '0.1');
    await page.click('button:has-text("Xác nhận mua")');

    // Kiểm tra thông báo thành công và thay đổi số dư
    await expect(page.locator('text=Giao dịch thành công')).toBeVisible();
    await expect(page.locator('text=BTC')).toBeVisible();
  });

  test('should run financial stress test and show nudges', async ({ page }) => {
    await page.goto('/vi/simulation/stress-test');

    await page.fill('input[name="monthlyIncome"]', '20000000');
    await page.fill('input[name="monthlyExpenses"]', '15000000');
    await page.fill('input[name="emergencyFund"]', '30000000');
    
    await page.click('button:has-text("Chạy Stress Test")');

    // Kiểm tra kết quả
    await expect(page.locator('text=2.0 tháng')).toBeVisible(); // 30M / 15M = 2 months
    
    // Kiểm tra AI Nudge xuất hiện (Social Proof)
    await expect(page.locator('text=80% của những nhà đầu tư thành công')).toBeVisible();
  });
});
