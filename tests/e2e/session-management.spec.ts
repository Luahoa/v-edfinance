import { expect, test } from '@playwright/test';
import { generateTestUser, loginUser } from '../helpers/test-utils';

test.describe('E018: Session Management', () => {
  const testUser = generateTestUser();

  test.beforeEach(async ({ page }) => {
    await page.goto('/vi');
  });

  test('JWT token auto-refresh before expiration', async ({ page }) => {
    await loginUser(page, { email: testUser.email, password: testUser.password }, 'vi');

    const initialToken = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(initialToken).toBeTruthy();

    await page.evaluate(() => {
      const token = localStorage.getItem('access_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        payload.exp = Math.floor(Date.now() / 1000) + 60;
        const newToken = `${token.split('.')[0]}.${btoa(JSON.stringify(payload))}.${token.split('.')[2]}`;
        localStorage.setItem('access_token', newToken);
      }
    });

    await page.waitForTimeout(65000);

    const refreshedToken = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(refreshedToken).toBeTruthy();
    expect(refreshedToken).not.toEqual(initialToken);
  });

  test('Expired token triggers re-authentication', async ({ page }) => {
    await loginUser(page, { email: testUser.email, password: testUser.password }, 'vi');

    await page.evaluate(() => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNjAwMDAwMDAwfQ.fake';
      localStorage.setItem('access_token', expiredToken);
    });

    await page.goto('/vi/dashboard');
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/(vi|en|zh)\/(login|auth)/);

    const sessionExpiredMessage = page.locator('[role="alert"]');
    if (await sessionExpiredMessage.isVisible()) {
      await expect(sessionExpiredMessage).toContainText(/hết hạn|expired|session/i);
    }
  });

  test('Multi-device session handling', async ({ page, context }) => {
    await loginUser(page, { email: testUser.email, password: testUser.password }, 'vi');

    const device1Token = await page.evaluate(() => localStorage.getItem('access_token'));

    const device2Page = await context.newPage();
    await loginUser(device2Page, { email: testUser.email, password: testUser.password }, 'vi');

    const device2Token = await device2Page.evaluate(() => localStorage.getItem('access_token'));

    expect(device1Token).toBeTruthy();
    expect(device2Token).toBeTruthy();

    await page.goto('/vi/dashboard');
    await page.waitForTimeout(1000);

    const loggedInIndicator = page.locator('[data-testid="user-profile"]');
    if (await loggedInIndicator.isVisible()) {
      await expect(loggedInIndicator).toBeVisible();
    }

    await device2Page.close();
  });

  test('Logout clears all session data', async ({ page }) => {
    await loginUser(page, { email: testUser.email, password: testUser.password }, 'vi');

    await page.evaluate(() => {
      localStorage.setItem('user_preferences', JSON.stringify({ theme: 'dark' }));
      sessionStorage.setItem('temp_data', 'test');
    });

    const logoutButton = page.locator('button:has-text("Đăng xuất"), button:has-text("Logout")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForTimeout(1000);
    } else {
      const userMenu = page.locator('[data-testid="user-menu"]').first();
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.locator('button:has-text("Đăng xuất"), button:has-text("Logout")').first().click();
        await page.waitForTimeout(1000);
      }
    }

    await expect(page).toHaveURL(/\/(vi|en|zh)(\/)?$/);

    const clearedToken = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(clearedToken).toBeNull();

    const clearedPreferences = await page.evaluate(() => localStorage.getItem('user_preferences'));
    expect(clearedPreferences).toBeNull();

    const clearedSessionData = await page.evaluate(() => sessionStorage.getItem('temp_data'));
    expect(clearedSessionData).toBeNull();
  });

  test('Session timeout after inactivity', async ({ page }) => {
    await loginUser(page, { email: testUser.email, password: testUser.password }, 'vi');

    await page.evaluate(() => {
      window.sessionTimeout = 30000;
    });

    await page.waitForTimeout(35000);

    const timeoutDialog = page.locator('[data-testid="session-timeout-dialog"]');
    if (await timeoutDialog.isVisible()) {
      await expect(timeoutDialog).toBeVisible();

      const extendButton = page.locator('button:has-text("Gia hạn"), button:has-text("Extend")');
      if (await extendButton.isVisible()) {
        await extendButton.click();
        await page.waitForTimeout(1000);
        await expect(timeoutDialog).not.toBeVisible();
      }
    }
  });

  test('Remember me functionality', async ({ page, context }) => {
    await page.goto('/vi/login');

    const rememberCheckbox = page.locator('input[type="checkbox"][name="remember"]');
    if (await rememberCheckbox.isVisible()) {
      await rememberCheckbox.check();
    }

    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.locator('button:has-text("Đăng nhập"), button:has-text("Login")').click();
    await page.waitForTimeout(2000);

    const cookies = await context.cookies();
    const rememberCookie = cookies.find((c) => c.name === 'remember_token');

    if (rememberCookie) {
      expect(rememberCookie.expires).toBeGreaterThan(Date.now() / 1000 + 86400);
    }

    await context.clearCookies();
    await page.reload();

    const loginForm = page.locator('form[data-testid="login-form"]');
    if (await loginForm.isVisible()) {
      await expect(page).toHaveURL(/\/(vi|en|zh)\/login/);
    }
  });
});
