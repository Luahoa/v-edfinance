import { expect, test } from '@playwright/test';

test.describe('Authentication and Dashboard Onboarding', () => {
  const API_URL = 'http://localhost:3001';
  const FRONTEND_URL = 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    // Mock Login API
    await page.route(`${API_URL}/auth/login`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          user: {
            id: 'user-123',
            email: 'tester@v-edfinance.com',
            role: 'STUDENT',
          },
        }),
      });
    });

    // Mock Dashboard Stats API
    await page.route(`${API_URL}/users/dashboard-stats`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          points: 1250,
          enrolledCoursesCount: 3,
          completedLessonsCount: 15,
          badgesCount: 4,
          streak: 7,
        }),
      });
    });

    // Mock Social Feed API
    await page.route(`${API_URL}/social/feed?limit=5`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'post-1',
            type: 'ACHIEVEMENT',
            userId: 'user-456',
            likesCount: 12,
            createdAt: new Date().toISOString(),
            user: { email: 'buddy@example.com', metadata: { name: 'Buddy One' } },
            content: {
              vi: 'Vừa hoàn thành khóa học Đầu tư cơ bản! 🚀',
              en: 'Just finished Basic Investment course! 🚀',
              zh: '刚完成了基础投资课程！ 🚀',
            },
          },
        ]),
      });
    });

    // Mock Buddy Recommendations API
    await page.route(`${API_URL}/social/recommendations`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'group-1',
            name: 'Học nhóm FIRE',
            description: 'Cùng nhau đạt tự do tài chính',
            type: 'INVESTING',
            totalPoints: 5000,
            streak: 12,
            _count: { members: 8 },
          },
        ]),
      });
    });
  });

  test('user can login and see personalized dashboard with social nudges', async ({
    page,
    context,
  }) => {
    // Set a longer timeout for this test
    test.setTimeout(60000);

    // 1. Go to Login Page (Vietnamese)
    await page.goto('/vi/login');
    console.log('Navigated to login page');

    // 2. Fill credentials
    await page.fill('input[type="email"]', 'tester@v-edfinance.com');
    await page.fill('input[type="password"]', 'Password123!');

    // 3. Click Login and wait for navigation
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/auth/login')),
      page.click('button[type="submit"]'),
    ]);
    console.log('Login response received:', response.status());

    await page.waitForURL('**/dashboard');
    console.log('Reached dashboard');

    // 4. Verify Dashboard content
    // Use getByText with regex for better matching
    await expect(page.locator('h1')).toContainText(/Chào mừng/i);

    // Verify Stat Cards - check for the values from mock
    await expect(page.getByText('1250', { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('7', { exact: false })).toBeVisible({ timeout: 15000 });

    // 5. Verify Social Proof Nudge (Behavioral Engineering)
    await expect(page.getByText(/Vừa hoàn thành khóa học Đầu tư cơ bản/)).toBeVisible();

    // 6. Test Multi-language switch behavior (i18n)
    console.log('Switching to English locale...');

    // Use page.evaluate to set cookie directly in browser context
    await page.evaluate(() => {
      document.cookie = 'NEXT_LOCALE=en; path=/; max-age=31536000';
    });

    // Also use context.addCookies with proper domain
    await context.addCookies([
      {
        name: 'NEXT_LOCALE',
        value: 'en',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Navigate to EN dashboard with a fresh state
    await page.goto(`${FRONTEND_URL}/en/dashboard`, { waitUntil: 'networkidle' });
    console.log('Navigated to EN dashboard, current URL:', page.url());

    // Wait for the h1 to contain English text
    await expect(page.locator('h1')).toContainText(/Welcome/i, { timeout: 15000 });

    const content = await page.textContent('h1');
    console.log('H1 Content after EN navigation:', content);

    await expect(page.getByText(/Just finished Basic Investment course/)).toBeVisible();
  });
});
