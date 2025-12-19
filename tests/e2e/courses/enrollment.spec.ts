import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, assertUserIsLoggedIn } from '../../helpers/test-utils';

test.describe('Courses: Browse & Enrollment Flow', () => {
  test('Browse and enroll in a course', async ({ page }) => {
    // 1. Setup - Create a user and login
    const user = generateTestUser();
    await registerUser(page, user, 'vi');
    await page.waitForURL(/.*dashboard/);
    await assertUserIsLoggedIn(page);

    // 2. Navigate to Courses
    await page.click('[data-testid="nav-courses"]');
    await expect(page).toHaveURL(/\/vi\/courses/);

    // 3. Search or Filter courses
    const searchInput = page.locator('[data-testid="course-search-input"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Chứng khoán');
    }

    // 4. View Course Detail
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await expect(courseCard).toBeVisible();
    await courseCard.click();
    await expect(page).toHaveURL(/\/vi\/courses\/[a-zA-Z0-9-]+/);

    // 5. Enroll in Course
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
      // Expect redirect to lesson or enrollment success message
      await expect(page.locator('[data-testid="lesson-content"]').or(page.locator('text=Đã đăng ký'))).toBeVisible();
    }
  });

  test('Course content localization', async ({ page }) => {
    await page.goto('/en/courses');
    const title = page.locator('h1');
    await expect(title).toContainText(/Courses/i);

    await page.goto('/zh/courses');
    await expect(title).toContainText(/课程/i);
  });
});

test.describe('Store: Points & Purchases', () => {
  test('Buy item from store', async ({ page }) => {
    // 1. Register and gain some initial points (if applicable)
    const user = generateTestUser();
    await registerUser(page, user, 'vi');
    await page.waitForURL(/.*dashboard/);

    // 2. Navigate to Store
    await page.click('[data-testid="nav-store"]');
    await expect(page).toHaveURL(/\/vi\/store/);

    // 3. Verify points
    const pointsDisplay = page.locator('[data-testid="user-points"]');
    await expect(pointsDisplay).toBeVisible();

    // 4. Purchase Streak Freeze
    const purchaseBtn = page.locator('[data-testid="buy-streak-freeze"]');
    if (await purchaseBtn.isEnabled()) {
      await purchaseBtn.click();
      await expect(page.locator('text=Thành công').or(page.locator('text=Success'))).toBeVisible();
    } else {
      console.log('Not enough points to buy streak freeze, test skipped purchase action');
    }
  });
});
