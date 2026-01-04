import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, assertUserIsLoggedIn } from '../../helpers/test-utils';

test.describe('YouTube Error Scenarios - ved-yt14', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    testUser = generateTestUser();
    await registerUser(page, testUser, 'vi');
    await page.waitForURL(/.*dashboard/);
    await assertUserIsLoggedIn(page);
  });

  test('Deleted video → show "Video unavailable" message', async ({ page }) => {
    // This test requires a lesson with a known deleted video
    // We'll simulate by blocking YouTube API or using invalid video ID
    
    // Navigate to courses
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    // Block YouTube iframe to simulate deleted video
    await page.route('**/youtube.com/embed/**', (route) => {
      route.abort('failed');
    });
    
    await page.click('[data-testid="lesson-item"]').first;
    
    // Should show error boundary with deleted video message
    await expect(
      page.locator('text=Video unavailable').or(
        page.locator('text=Video không khả dụng')
      ).or(
        page.locator('[data-testid="youtube-error-deleted"]')
      )
    ).toBeVisible({ timeout: 10000 });
    
    // Should NOT show retry button for deleted video
    const retryBtn = page.locator('[data-testid="youtube-retry-btn"]');
    await expect(retryBtn).not.toBeVisible();
  });

  test('Network error → show retry button', async ({ page }) => {
    // Navigate to lesson
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    // Simulate network error by aborting YouTube requests
    let requestCount = 0;
    await page.route('**/youtube.com/**', (route) => {
      requestCount++;
      if (requestCount === 1) {
        // Fail first request
        route.abort('failed');
      } else {
        // Allow retry to succeed
        route.continue();
      }
    });
    
    await page.click('[data-testid="lesson-item"]').first;
    
    // Should show network error message
    await expect(
      page.locator('text=Network error').or(
        page.locator('text=Lỗi mạng')
      ).or(
        page.locator('[data-testid="youtube-error-network"]')
      )
    ).toBeVisible({ timeout: 10000 });
    
    // Should show retry button
    const retryBtn = page.locator('[data-testid="youtube-retry-btn"]');
    await expect(retryBtn).toBeVisible();
    
    // Click retry and verify video loads
    await retryBtn.click();
    await expect(page.locator('[data-testid="youtube-embed"]')).toBeVisible({ timeout: 10000 });
  });

  test('Ad blocker enabled → show fallback UI with "Watch on YouTube" link', async ({ page }) => {
    // Simulate ad blocker by blocking YouTube scripts
    await page.route('**/youtube.com/**/*.js', (route) => {
      route.abort('blockedbyclient');
    });
    
    await page.route('**/googlevideo.com/**', (route) => {
      route.abort('blockedbyclient');
    });
    
    // Navigate to lesson
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    await page.click('[data-testid="lesson-item"]').first;
    
    // Should show ad blocker message
    await expect(
      page.locator('text=Ad blocker detected').or(
        page.locator('text=Phát hiện ad blocker')
      ).or(
        page.locator('[data-testid="youtube-error-adblocker"]')
      )
    ).toBeVisible({ timeout: 10000 });
    
    // Should show "Watch on YouTube" link
    const watchOnYouTubeLink = page.locator('[data-testid="watch-on-youtube-link"]');
    await expect(watchOnYouTubeLink).toBeVisible();
    
    // Verify link opens in new tab
    const href = await watchOnYouTubeLink.getAttribute('href');
    expect(href).toContain('youtube.com/watch');
    
    const target = await watchOnYouTubeLink.getAttribute('target');
    expect(target).toBe('_blank');
    
    // Verify security attributes
    const rel = await watchOnYouTubeLink.getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  });

  test('Slow loading video → show loading spinner', async ({ page }) => {
    // Navigate to lesson
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    // Delay YouTube iframe loading
    await page.route('**/youtube.com/embed/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      route.continue();
    });
    
    await page.click('[data-testid="lesson-item"]').first;
    
    // Should show loading spinner immediately
    await expect(page.locator('[data-testid="youtube-loading-spinner"]')).toBeVisible({ timeout: 1000 });
    
    // Loading spinner should disappear when video loads
    await expect(page.locator('[data-testid="youtube-loading-spinner"]')).not.toBeVisible({ timeout: 10000 });
    
    // Video should be visible
    await expect(page.locator('[data-testid="youtube-embed"]')).toBeVisible();
  });

  test('Invalid video ID → show appropriate error', async ({ page }) => {
    // This requires admin to create a lesson with invalid video ID
    // Or we can test via direct URL manipulation if accessible
    
    // Navigate to a lesson and try to manipulate URL (if route params exposed)
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    await page.click('[data-testid="lesson-item"]').first;
    
    // Block all YouTube iframe loads to simulate invalid video
    await page.route('**/youtube.com/embed/**', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'text/html',
        body: 'Video not found',
      });
    });
    
    // Reload the page to trigger error
    await page.reload();
    
    // Should show error message
    await expect(
      page.locator('[data-testid="youtube-error-boundary"]')
    ).toBeVisible({ timeout: 10000 });
  });

  test('Console errors are logged to BehaviorLog', async ({ page }) => {
    let behaviorLogRequests: any[] = [];
    
    // Intercept BehaviorLog API calls
    page.on('request', (request) => {
      if (request.url().includes('/api/behavior/log') && request.method() === 'POST') {
        try {
          const postData = request.postDataJSON();
          behaviorLogRequests.push(postData);
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
    
    // Navigate to lesson
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    // Trigger an error by blocking YouTube
    await page.route('**/youtube.com/**', (route) => {
      route.abort('failed');
    });
    
    await page.click('[data-testid="lesson-item"]').first;
    
    // Wait for error to be logged
    await page.waitForTimeout(3000);
    
    // Verify BehaviorLog was called with youtube_error action
    const youtubeErrorLog = behaviorLogRequests.find(
      (log) => log.action === 'youtube_error' || log.eventType === 'youtube_error'
    );
    
    expect(youtubeErrorLog).toBeDefined();
  });

  test('Error boundary does not break page navigation', async ({ page }) => {
    // Navigate to lesson with error
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    // Block YouTube to trigger error
    await page.route('**/youtube.com/**', (route) => {
      route.abort('failed');
    });
    
    await page.click('[data-testid="lesson-item"]').first;
    
    // Wait for error to appear
    await expect(page.locator('[data-testid="youtube-error-boundary"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate away should still work
    await page.click('[data-testid="nav-dashboard"]');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Navigate back should work
    await page.click('[data-testid="nav-courses"]');
    await expect(page).toHaveURL(/.*courses/);
  });

  test('Multiple retry attempts work correctly', async ({ page }) => {
    let requestAttempts = 0;
    
    await page.route('**/youtube.com/embed/**', (route) => {
      requestAttempts++;
      if (requestAttempts < 3) {
        // Fail first 2 attempts
        route.abort('failed');
      } else {
        // Succeed on 3rd attempt
        route.continue();
      }
    });
    
    // Navigate to lesson
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    await page.click('[data-testid="lesson-item"]').first;
    
    // First error
    await expect(page.locator('[data-testid="youtube-error-network"]')).toBeVisible({ timeout: 10000 });
    
    // First retry
    await page.click('[data-testid="youtube-retry-btn"]');
    await page.waitForTimeout(2000);
    
    // Second error
    await expect(page.locator('[data-testid="youtube-error-network"]')).toBeVisible();
    
    // Second retry - should succeed
    await page.click('[data-testid="youtube-retry-btn"]');
    
    // Video should load
    await expect(page.locator('[data-testid="youtube-embed"]')).toBeVisible({ timeout: 10000 });
    
    // Verify total attempts
    expect(requestAttempts).toBeGreaterThanOrEqual(3);
  });
});
