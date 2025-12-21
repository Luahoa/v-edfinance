import { expect, test } from '@playwright/test';
import {
  assertUserIsLoggedIn,
  completeOnboarding,
  generateTestUser,
  registerUser,
} from '../helpers/test-utils';

test.describe('E013: Recommendation System', () => {
  test.use({
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  });

  test('Persona-based course recommendations', async ({ page }) => {
    test.setTimeout(90000);

    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    await page.waitForURL(/.*onboarding/);

    // Set specific persona traits
    await page.click('[data-testid="risk-high"]');
    await page.click('[data-testid="onboarding-next"]');

    await page.click('[data-testid="goal-investing"]');
    await page.click('[data-testid="goal-wealth"]');
    await page.click('[data-testid="onboarding-finish"]');

    // Navigate to recommendations
    await page.goto('/vi/dashboard');
    const recommendedSection = page.locator('[data-testid="recommended-for-you"]');
    await expect(recommendedSection).toBeVisible();

    // Verify recommendations match persona (high risk → advanced investing courses)
    const recommendations = page.locator('[data-testid="recommended-course"]');
    await expect(recommendations).toHaveCount({ min: 3 });

    const firstRec = recommendations.first();
    const tags = firstRec.locator('[data-testid="course-tags"]');
    await expect(tags).toContainText(/Đầu tư|Nâng cao/);
  });

  test('Behavior-based recommendation evolution', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await page.click('[data-testid="risk-low"]');
      await page.click('[data-testid="onboarding-next"]');
      await page.click('[data-testid="onboarding-finish"]');
    }

    // Initial recommendations (conservative)
    await page.goto('/vi/dashboard');
    const initialRecs = await page.locator('[data-testid="recommended-course-title"]').allTextContents();

    // Simulate user actions: view advanced courses
    await page.goto('/vi/courses');
    await page.click('[data-testid="filter-advanced"]');
    
    const advancedCourses = page.locator('[data-testid="course-card"]');
    for (let i = 0; i < 3; i++) {
      await advancedCourses.nth(i).click();
      await page.waitForTimeout(1000);
      await page.goBack();
    }

    // Enroll in advanced course
    await advancedCourses.first().click();
    await page.click('[data-testid="enroll-btn"]');

    // Wait for behavior analytics to process
    await page.waitForTimeout(2000);

    // Check updated recommendations
    await page.goto('/vi/dashboard');
    const updatedRecs = await page.locator('[data-testid="recommended-course-title"]').allTextContents();

    // Should now include more advanced content
    expect(updatedRecs).not.toEqual(initialRecs);
  });

  test('Click-through tracking and refinement', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    await page.goto('/vi/dashboard');

    // Click on first recommendation
    const firstRec = page.locator('[data-testid="recommended-course"]').first();
    const firstRecTitle = await firstRec.locator('[data-testid="course-title"]').textContent();
    
    await firstRec.click();
    await expect(page).toHaveURL(/.*courses\/[a-z0-9-]+/);

    // Verify analytics tracking
    const analyticsCall = page.waitForResponse(resp => 
      resp.url().includes('/api/analytics/track') && resp.status() === 200
    );
    
    await page.click('[data-testid="enroll-btn"]');
    await analyticsCall;

    // Return to dashboard
    await page.goto('/vi/dashboard');

    // Recommendations should now prioritize similar courses
    const similarRecs = page.locator('[data-testid="similar-courses"]');
    await expect(similarRecs).toBeVisible();
    await expect(similarRecs.locator('[data-testid="course-card"]')).toHaveCount({ min: 2 });
  });

  test('Multi-locale recommendation consistency', async ({ page }) => {
    const locales = ['vi', 'en', 'zh'];
    const user = generateTestUser();

    for (const locale of locales) {
      // Register with same persona
      await registerUser(page, user, locale);
      
      if (page.url().includes('onboarding')) {
        await page.click('[data-testid="risk-moderate"]');
        await page.click('[data-testid="onboarding-next"]');
        await page.click('[data-testid="goal-saving"]');
        await page.click('[data-testid="onboarding-finish"]');
      }

      await page.goto(`/${locale}/dashboard`);
      const recommendations = page.locator('[data-testid="recommended-course"]');
      
      // Should have recommendations in all locales
      await expect(recommendations).toHaveCount({ min: 3 });

      // Verify content is localized
      const courseTitle = await recommendations.first().locator('[data-testid="course-title"]').textContent();
      expect(courseTitle).toBeTruthy();

      await page.context().clearCookies();
    }
  });

  test('Recommendation freshness and diversity', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    await page.goto('/vi/dashboard');

    // Collect initial recommendations
    const initialRecs = await page.locator('[data-testid="recommended-course-id"]').allTextContents();

    // Complete an action
    await page.goto('/vi/courses');
    await page.click('[data-testid="course-card"]').first();
    await page.click('[data-testid="enroll-btn"]');

    // Wait for recommendation refresh
    await page.waitForTimeout(3000);
    await page.goto('/vi/dashboard');

    // Recommendations should update
    const updatedRecs = await page.locator('[data-testid="recommended-course-id"]').allTextContents();

    // Should have at least some different recommendations
    const unchangedCount = initialRecs.filter(id => updatedRecs.includes(id)).length;
    expect(unchangedCount).toBeLessThan(initialRecs.length);

    // Should still have diversity (different categories)
    const categories = await page.locator('[data-testid="course-category"]').allTextContents();
    const uniqueCategories = new Set(categories);
    expect(uniqueCategories.size).toBeGreaterThan(1);
  });

  test('Fallback recommendations for new users', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    
    // Skip onboarding to simulate minimal persona data
    await page.goto('/vi/dashboard');

    // Should still show recommendations (default/popular)
    const recommendations = page.locator('[data-testid="recommended-course"]');
    await expect(recommendations).toHaveCount({ min: 3 });

    // Verify they're marked as "Popular" or "Trending"
    const badges = page.locator('[data-testid="recommendation-badge"]');
    await expect(badges.first()).toContainText(/Phổ biến|Popular|Trending/);
  });

  test('Recommendation exclusion for completed courses', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    // Enroll and complete a course
    await page.goto('/vi/courses');
    const firstCourse = page.locator('[data-testid="course-card"]').first();
    const courseId = await firstCourse.getAttribute('data-course-id');
    
    await firstCourse.click();
    await page.click('[data-testid="enroll-btn"]');

    // Mock course completion
    await page.evaluate(() => {
      localStorage.setItem('completed-courses', JSON.stringify(['course-1']));
    });

    // Check recommendations don't include completed course
    await page.goto('/vi/dashboard');
    const recCourseIds = await page.locator('[data-testid="recommended-course"]').allTextContents();
    
    expect(recCourseIds).not.toContain(courseId);
  });
});
