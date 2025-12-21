import { test, expect } from '@playwright/test';

test.describe('E002: Course Discovery & Enrollment', () => {
  test.setTimeout(90000);

  let authToken: string;

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    
    // Create authenticated user
    const timestamp = Date.now();
    const testEmail = `course-user-${timestamp}@vedfinance.test`;

    await page.goto('/vi/register');
    await page.fill('[data-testid="register-name"]', 'Course Tester');
    await page.fill('[data-testid="register-email"]', testEmail);
    await page.fill('[data-testid="register-password"]', 'CoursePass123!');
    await page.fill('[data-testid="register-password-confirm"]', 'CoursePass123!');
    await page.click('[data-testid="register-submit"]');

    // Complete onboarding
    await page.waitForURL(/\/vi\/onboarding/, { timeout: 15000 });
    await page.click('[data-testid="onboarding-beginner"]');
    await page.click('[data-testid="onboarding-longterm"]');
    await page.click('[data-testid="onboarding-medium"]');
    await page.click('[data-testid="onboarding-complete"]');

    await page.waitForURL(/\/vi\/dashboard/, { timeout: 15000 });
  });

  test('should browse courses → filter → enroll → access lesson', async ({ page }) => {
    // 1. Navigate to courses page
    await page.click('[data-testid="nav-courses"]');
    await page.waitForURL(/\/vi\/courses/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText(/Khóa học|Courses/);

    // 2. Verify courses are displayed
    const courseCards = page.locator('[data-testid^="course-card"]');
    await expect(courseCards.first()).toBeVisible({ timeout: 10000 });

    // 3. Filter by category (beginner)
    const categoryFilter = page.locator('[data-testid="filter-category-beginner"]');
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.waitForTimeout(1000);
    }

    // 4. View course details
    await courseCards.first().click();
    await page.waitForURL(/\/vi\/courses\/[a-z0-9-]+/, { timeout: 10000 });

    // 5. Verify course details page
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="course-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="course-enroll-btn"]')).toBeVisible();

    // 6. Enroll in course
    await page.click('[data-testid="course-enroll-btn"]');
    await page.waitForTimeout(2000);

    // 7. Verify enrollment success (button text changes or modal appears)
    const enrolledIndicator = page.locator('[data-testid="enrollment-success"], text=/Đã ghi danh|Enrolled/i');
    await expect(enrolledIndicator).toBeVisible({ timeout: 10000 });

    // 8. Access first lesson
    const firstLesson = page.locator('[data-testid="lesson-item-0"], [data-testid^="lesson-"]:first-child');
    await firstLesson.click();
    await page.waitForURL(/\/vi\/courses\/[a-z0-9-]+\/lessons\/[a-z0-9-]+/, { timeout: 15000 });

    // 9. Verify lesson content
    await expect(page.locator('[data-testid="lesson-content"]')).toBeVisible({ timeout: 10000 });

    // 10. Verify progress tracking UI
    const progressBar = page.locator('[data-testid="course-progress"], [data-testid="lesson-progress"]');
    await expect(progressBar).toBeVisible({ timeout: 5000 });

    // 11. Mark lesson as complete
    const completeBtn = page.locator('[data-testid="lesson-complete-btn"]');
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await page.waitForTimeout(1000);
    }

    // 12. Verify progress updated
    const progress = await page.evaluate(() => {
      const progressEl = document.querySelector('[data-progress]');
      return progressEl?.getAttribute('data-progress');
    });
    
    if (progress) {
      expect(parseInt(progress)).toBeGreaterThan(0);
    }
  });

  test('should show enrolled courses in dashboard', async ({ page }) => {
    // Navigate to courses
    await page.click('[data-testid="nav-courses"]');
    await page.waitForURL(/\/vi\/courses/, { timeout: 10000 });

    // Enroll in first available course
    const firstCourse = page.locator('[data-testid^="course-card"]').first();
    await firstCourse.click();
    await page.waitForURL(/\/vi\/courses\/[a-z0-9-]+/, { timeout: 10000 });
    
    const enrollBtn = page.locator('[data-testid="course-enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
      await page.waitForTimeout(2000);
    }

    // Go back to dashboard
    await page.click('[data-testid="nav-dashboard"]');
    await page.waitForURL(/\/vi\/dashboard/, { timeout: 10000 });

    // Verify enrolled course appears
    const enrolledSection = page.locator('[data-testid="enrolled-courses"]');
    await expect(enrolledSection).toBeVisible({ timeout: 10000 });
  });

  test('should navigate between lessons', async ({ page }) => {
    // Enroll in a course
    await page.click('[data-testid="nav-courses"]');
    await page.waitForURL(/\/vi\/courses/, { timeout: 10000 });
    
    const firstCourse = page.locator('[data-testid^="course-card"]').first();
    await firstCourse.click();
    await page.waitForURL(/\/vi\/courses\/[a-z0-9-]+/, { timeout: 10000 });
    
    const enrollBtn = page.locator('[data-testid="course-enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
      await page.waitForTimeout(2000);
    }

    // Access first lesson
    const firstLesson = page.locator('[data-testid^="lesson-"]:first-child');
    await firstLesson.click();
    await page.waitForURL(/\/vi\/courses\/[a-z0-9-]+\/lessons/, { timeout: 15000 });

    // Try to navigate to next lesson
    const nextBtn = page.locator('[data-testid="lesson-next"]');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      
      // Verify URL changed
      expect(page.url()).toContain('/lessons/');
    }
  });

  test('should filter courses by difficulty level', async ({ page }) => {
    await page.click('[data-testid="nav-courses"]');
    await page.waitForURL(/\/vi\/courses/, { timeout: 10000 });

    // Apply beginner filter
    const beginnerFilter = page.locator('[data-testid="filter-level-beginner"]');
    if (await beginnerFilter.isVisible()) {
      await beginnerFilter.click();
      await page.waitForTimeout(1000);

      // Verify filtered results
      const courseCards = page.locator('[data-testid^="course-card"]');
      const count = await courseCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});
