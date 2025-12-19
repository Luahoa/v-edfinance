import { test, expect } from '@playwright/test';

test.describe('The Holy Trinity: Onboarding', () => {
  const locales = ['vi', 'en', 'zh'];

  for (const locale of locales) {
    test(`should allow a new user to register in ${locale} with high latency`, async ({ page }) => {
      // Chaos Test: Simulate network latency
      await page.route('**/api/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s latency
        const url = route.request().url();
        if (url.includes('/auth/register')) {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              user: { id: 'test-user', email: 'test@example.com' },
              token: 'mock-token',
            }),
          });
        } else if (url.includes('/users/dashboard-stats')) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ points: 1250, streak: 7 }) });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        }
      });

      await page.goto(`/${locale}/register`);
      await page.waitForLoadState('networkidle');

      const nameInput = page.locator('input[type="text"]');
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      await nameInput.waitFor({ state: 'visible', timeout: 30000 });
      await nameInput.click();
      await nameInput.type('Chaos User', { delay: 50 });
      await emailInput.click();
      await emailInput.type('chaos@example.com', { delay: 50 });
      await passwordInput.click();
      await passwordInput.type('password123', { delay: 50 });
      
      const submitBtn = page.locator('button').filter({ hasText: /注册|Register|Đăng ký/i }).first();
      await submitBtn.click({ force: true });
      
      // Verification with high latency
      await expect(page).toHaveURL(/.*(login|dashboard)/, { timeout: 120000 });
      });
  }
});

test.describe('The Holy Trinity: AI Interaction', () => {
  test('should allow user to chat with AI mentor', async ({ page }) => {
    // Hermetic Pattern: Mock all API responses
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (url.includes('/ai/threads') && method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'thread-1', title: 'Test Thread', updatedAt: new Date().toISOString() }),
        });
      } else if (url.includes('/ai/threads/thread-1/messages')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'm1', role: 'ASSISTANT', content: 'Đây là câu trả lời từ AI Mentor.', createdAt: new Date().toISOString() }
          ]),
        });
      } else if (url.includes('/users/dashboard-stats')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ points: 100 }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    // Mock session
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: { token: 'mock-token', user: { id: 'test-user' } }
      }));
      document.cookie = "token=mock-token; path=/";
    });

    await page.goto('/vi/dashboard');
    
    // Increased timeout for slow mobile hydration
    const threadBtn = page.locator('button').filter({ hasText: /Bắt đầu thảo luận|thảo luận|Chat/i }).first();
    await expect(threadBtn).toBeVisible({ timeout: 45000 });
    await threadBtn.click();
    
    // Use regex for content to handle possible hydration mismatches
    await expect(page.locator('text=/Đây là câu trả lời từ AI Mentor/')).toBeVisible({ timeout: 30000 });
    });
    });

test.describe('The Holy Trinity: Gamification', () => {
  test('should show streak and points on dashboard', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/users/dashboard-stats')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            points: 1250,
            streak: 7,
            nextLevel: 2000,
            rank: 'Silver'
          }),
        });
      } else if (url.includes('/social/feed') || url.includes('/social/recommendations') || url.includes('/checklists')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      }
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: { token: 'mock-token', user: { id: 'test-user' } }
      }));
      document.cookie = "token=mock-token; path=/";
    });

    await page.goto('/vi/dashboard');
    
    // Using regex to find numbers that might be inside other text with longer timeouts
    await expect(page.locator('text=1250').first()).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=7').first()).toBeVisible({ timeout: 25000 });
    });
    });

test.describe('The Holy Trinity: Conversion', () => {
  test('should allow user to complete a simulated purchase', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/store/items')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { 
              id: 'streak-freeze', 
              name: { vi: 'Đóng băng chuỗi', en: 'Streak Freeze', zh: '连胜冻结' }, 
              description: { vi: 'Mô tả', en: 'Desc', zh: '描述' }, 
              price: 100 
            }
          ]),
        });
      } else if (url.includes('/users/profile') || url.includes('/users/dashboard-stats')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ points: 1000, streak: 7 }),
        });
      } else if (url.includes('/social/feed') || url.includes('/social/recommendations') || url.includes('/checklists')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else if (url.includes('/store/buy/streak-freeze')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      }
    });

    // Mock session
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: { token: 'mock-token', user: { id: 'test-user' } }
      }));
      document.cookie = "token=mock-token; path=/";
    });

    await page.goto('/vi/store');
    
    // Extended timeout for mobile and ensure visibility before click
    const buyButton = page.locator('button').filter({ hasText: /Mua|Buy|购买/ }).first();
    await buyButton.waitFor({ state: 'visible', timeout: 45000 });
    await buyButton.click({ force: true });
    
    await expect(page.locator('text=thành công').or(page.locator('text=success')).or(page.locator('text=成功'))).toBeVisible({ timeout: 25000 });
  });
});
