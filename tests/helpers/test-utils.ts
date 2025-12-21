import { type Page, expect } from '@playwright/test';

export function generateTestUser() {
  const timestamp = Date.now();
  const uniqueId = `${timestamp}-${Math.random().toString(36).substring(7)}`;
  return {
    email: `test-${uniqueId}@example.com`,
    password: 'SecurePass123!',
    name: `Test User ${timestamp}`,
  };
}

export async function loginViaUI(page: Page, email: string, password: string, locale = 'vi') {
  await page.goto(`/${locale}/login`);
  await page.fill('[data-testid="login-email-input"]', email);
  await page.fill('[data-testid="login-password-input"]', password);
  await page.click('[data-testid="login-submit-btn"]');
  await page.waitForURL(`**/${locale}/dashboard`);
}

export async function registerUser(
  page: Page,
  user: ReturnType<typeof generateTestUser>,
  locale = 'vi'
) {
  await page.goto(`/${locale}/register`);
  await page.fill('input[type="text"]', user.name);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  const submitBtn = page
    .locator('button')
    .filter({ hasText: /Đăng ký|Register|注册/i })
    .first();
  await submitBtn.click();
}

export async function completeOnboarding(page: Page) {
  await expect(page).toHaveURL(/.*onboarding/);
  // Simulate picking risk score
  await page.click('[data-testid="risk-low"]');
  await page.click('[data-testid="onboarding-next"]');
  // Finalize
  await page.click('[data-testid="onboarding-finish"]');
  await expect(page).toHaveURL(/.*dashboard/);
}

export async function waitForToast(page: Page, text: string | RegExp) {
  const toast = page.locator('[role="status"], .toast, .notification');
  await expect(toast).toContainText(text, { timeout: 10000 });
}

export async function assertUserIsLoggedIn(page: Page) {
  await expect(
    page.locator('[data-testid="user-profile-btn"], [data-testid="logout-btn"]')
  ).toBeVisible();
}

export async function loginAsAdmin(page: Page, locale = 'vi') {
  await page.goto(`/${locale}/login`);
  await page.fill('[data-testid="login-email-input"]', 'admin@v-edfinance.com');
  await page.fill('[data-testid="login-password-input"]', 'Admin123!');
  await page.click('[data-testid="login-submit-btn"]');
  await page.waitForURL(`**/${locale}/admin/dashboard`, { timeout: 5000 });
}

export async function loginAsUser(page: Page, email: string, password: string, locale = 'vi') {
  await page.goto(`/${locale}/login`);
  await page.fill('[data-testid="login-email-input"]', email);
  await page.fill('[data-testid="login-password-input"]', password);
  await page.click('[data-testid="login-submit-btn"]');
  await page.waitForURL(`**/${locale}/dashboard`, { timeout: 5000 });
}
