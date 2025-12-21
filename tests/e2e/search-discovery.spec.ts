import { expect, test } from '@playwright/test';
import {
  assertUserIsLoggedIn,
  completeOnboarding,
  generateTestUser,
  registerUser,
} from '../helpers/test-utils';

test.describe('E015: Search & Discovery', () => {
  test.use({
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  });

  test('Full-text course search', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    await page.goto('/vi/courses');

    // Search for specific term
    await page.fill('[data-testid="search-input"]', 'đầu tư');
    await page.click('[data-testid="search-btn"]');

    // Wait for results
    await page.waitForTimeout(1000);

    const searchResults = page.locator('[data-testid="course-card"]');
    await expect(searchResults).toHaveCount({ min: 1 });

    // Verify results contain search term
    const firstResult = searchResults.first();
    const titleText = await firstResult.locator('[data-testid="course-title"]').textContent();
    const descText = await firstResult.locator('[data-testid="course-description"]').textContent();
    
    const combinedText = `${titleText} ${descText}`.toLowerCase();
    expect(combinedText).toContain('đầu tư');
  });

  test('Filter courses by category and difficulty', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    await page.goto('/vi/courses');

    // Apply category filter
    await page.click('[data-testid="filter-category"]');
    await page.click('[data-testid="category-investing"]');

    const resultsAfterCategory = page.locator('[data-testid="course-card"]');
    await expect(resultsAfterCategory).toHaveCount({ min: 1 });

    // Verify all results match category
    const categories = await resultsAfterCategory.locator('[data-testid="course-category"]').allTextContents();
    expect(categories.every(cat => cat.includes('Đầu tư'))).toBeTruthy();

    // Apply difficulty filter
    await page.click('[data-testid="filter-difficulty"]');
    await page.click('[data-testid="difficulty-beginner"]');

    const resultsAfterDifficulty = page.locator('[data-testid="course-card"]');
    const difficulties = await resultsAfterDifficulty.locator('[data-testid="course-difficulty"]').allTextContents();
    expect(difficulties.every(diff => diff.includes('Cơ bản'))).toBeTruthy();
  });

  test('Sort courses by relevance, rating, and popularity', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    await page.goto('/vi/courses');

    // Sort by rating
    await page.click('[data-testid="sort-by"]');
    await page.click('[data-testid="sort-rating"]');

    const ratings = await page.locator('[data-testid="course-rating"]').allTextContents();
    const ratingValues = ratings.map(r => Number.parseFloat(r.replace(/[^\d.]/g, '')));
    
    // Should be descending
    for (let i = 0; i < ratingValues.length - 1; i++) {
      expect(ratingValues[i]).toBeGreaterThanOrEqual(ratingValues[i + 1]);
    }

    // Sort by popularity
    await page.click('[data-testid="sort-by"]');
    await page.click('[data-testid="sort-popularity"]');

    const enrollments = await page.locator('[data-testid="enrollment-count"]').allTextContents();
    const enrollValues = enrollments.map(e => Number.parseInt(e.replace(/\D/g, ''), 10));
    
    for (let i = 0; i < enrollValues.length - 1; i++) {
      expect(enrollValues[i]).toBeGreaterThanOrEqual(enrollValues[i + 1]);
    }

    // Sort by newest
    await page.click('[data-testid="sort-by"]');
    await page.click('[data-testid="sort-newest"]');

    // First course should be the most recent
    const firstCourse = page.locator('[data-testid="course-card"]').first();
    await expect(firstCourse.locator('[data-testid="course-badge"]')).toContainText(/Mới|New/);
  });

  test('Save courses to favorites', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    await page.goto('/vi/courses');

    // Favorite first course
    const firstCourse = page.locator('[data-testid="course-card"]').first();
    const courseTitle = await firstCourse.locator('[data-testid="course-title"]').textContent();
    
    await firstCourse.locator('[data-testid="favorite-btn"]').click();
    await expect(firstCourse.locator('[data-testid="favorite-btn"]')).toHaveClass(/active|favorited/);

    // Navigate to favorites
    await page.goto('/vi/profile/favorites');

    const favoriteCourses = page.locator('[data-testid="favorite-course"]');
    await expect(favoriteCourses).toHaveCount({ min: 1 });

    const favoriteTitles = await favoriteCourses.locator('[data-testid="course-title"]').allTextContents();
    expect(favoriteTitles).toContain(courseTitle);

    // Unfavorite
    await page.goto('/vi/courses');
    await firstCourse.locator('[data-testid="favorite-btn"]').click();
    await expect(firstCourse.locator('[data-testid="favorite-btn"]')).not.toHaveClass(/active|favorited/);

    // Verify removed from favorites
    await page.goto('/vi/profile/favorites');
    const updatedFavorites = await page.locator('[data-testid="favorite-course"]').count();
    expect(updatedFavorites).toBe(0);
  });

  test('Search with multi-locale support', async ({ page }) => {
    const locales = [
      { locale: 'vi', searchTerm: 'tiết kiệm' },
      { locale: 'en', searchTerm: 'saving' },
      { locale: 'zh', searchTerm: '储蓄' },
    ];

    for (const { locale, searchTerm } of locales) {
      const user = generateTestUser();

      await registerUser(page, user, locale);
      if (page.url().includes('onboarding')) {
        await completeOnboarding(page);
      }

      await page.goto(`/${locale}/courses`);
      await page.fill('[data-testid="search-input"]', searchTerm);
      await page.click('[data-testid="search-btn"]');

      const results = page.locator('[data-testid="course-card"]');
      await expect(results).toHaveCount({ min: 1 });

      // Verify results are in correct locale
      const firstTitle = await results.first().locator('[data-testid="course-title"]').textContent();
      expect(firstTitle).toBeTruthy();

      await page.context().clearCookies();
    }
  });

  test('Advanced search with multiple filters', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    await page.goto('/vi/courses');

    // Open advanced search
    await page.click('[data-testid="advanced-search-toggle"]');

    // Apply multiple filters
    await page.fill('[data-testid="search-input"]', 'đầu tư');
    
    await page.click('[data-testid="filter-category"]');
    await page.click('[data-testid="category-investing"]');
    
    await page.click('[data-testid="filter-difficulty"]');
    await page.click('[data-testid="difficulty-intermediate"]');
    
    await page.click('[data-testid="filter-duration"]');
    await page.fill('[data-testid="min-duration"]', '2');
    await page.fill('[data-testid="max-duration"]', '8');

    await page.click('[data-testid="apply-filters"]');

    // Verify results match all criteria
    const results = page.locator('[data-testid="course-card"]');
    
    if (await results.count() > 0) {
      const categories = await results.locator('[data-testid="course-category"]').allTextContents();
      expect(categories.every(c => c.includes('Đầu tư'))).toBeTruthy();

      const difficulties = await results.locator('[data-testid="course-difficulty"]').allTextContents();
      expect(difficulties.every(d => d.includes('Trung'))).toBeTruthy();
    }

    // Clear filters
    await page.click('[data-testid="clear-filters"]');
    const allResults = page.locator('[data-testid="course-card"]');
    await expect(allResults).toHaveCount({ min: 3 });
  });

  test('Search result persistence across navigation', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    await page.goto('/vi/courses');

    // Perform search
    await page.fill('[data-testid="search-input"]', 'đầu tư');
    await page.click('[data-testid="search-btn"]');

    const resultsCount = await page.locator('[data-testid="course-card"]').count();

    // Navigate to course detail
    await page.click('[data-testid="course-card"]').first();
    await expect(page).toHaveURL(/.*courses\/[a-z0-9-]+/);

    // Go back
    await page.goBack();

    // Search results should persist
    const persistedResults = await page.locator('[data-testid="course-card"]').count();
    expect(persistedResults).toBe(resultsCount);

    // Search input should still have value
    const searchValue = await page.locator('[data-testid="search-input"]').inputValue();
    expect(searchValue).toBe('đầu tư');
  });

  test('Empty search results handling', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    await page.goto('/vi/courses');

    // Search for nonsense term
    await page.fill('[data-testid="search-input"]', 'xyzabc123nonexistent');
    await page.click('[data-testid="search-btn"]');

    // Should show empty state
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results"]')).toContainText(/Không tìm thấy|No results/);

    // Should suggest clearing filters or browsing all
    const suggestionsLink = page.locator('[data-testid="browse-all-link"]');
    await expect(suggestionsLink).toBeVisible();

    await suggestionsLink.click();
    const allCourses = page.locator('[data-testid="course-card"]');
    await expect(allCourses).toHaveCount({ min: 1 });
  });
});
