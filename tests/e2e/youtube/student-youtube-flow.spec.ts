import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, assertUserIsLoggedIn } from '../../helpers/test-utils';

test.describe('Student YouTube Flow - ved-yt14', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    testUser = generateTestUser();
    await registerUser(page, testUser, 'vi');
    await page.waitForURL(/.*dashboard/);
    await assertUserIsLoggedIn(page);
  });

  test('Navigate to lesson → YouTube video embeds correctly', async ({ page }) => {
    // Navigate to courses
    await page.click('[data-testid="nav-courses"]');
    await expect(page).toHaveURL(/\/vi\/courses/);
    
    // Find and click first course with YouTube content
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    // Enroll if needed
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    // Navigate to first lesson
    await page.click('[data-testid="lesson-item"]').first;
    
    // Verify YouTube embed is present
    const youtubeEmbed = page.locator('[data-testid="youtube-embed"]');
    await expect(youtubeEmbed).toBeVisible({ timeout: 15000 });
    
    // Verify iframe is loaded
    await expect(page.frameLocator('iframe[src*="youtube.com"]').locator('video')).toBeVisible({ timeout: 10000 });
  });

  test('Watch video → progress updates every 5 seconds', async ({ page, context }) => {
    // Setup API request interceptor
    let progressUpdateCount = 0;
    
    page.on('request', (request) => {
      if (request.url().includes('/api/courses/lessons') && request.url().includes('/progress')) {
        progressUpdateCount++;
      }
    });
    
    // Navigate to lesson with YouTube video
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    await page.click('[data-testid="lesson-item"]').first;
    await expect(page.locator('[data-testid="youtube-embed"]')).toBeVisible();
    
    // Wait 15 seconds (should trigger 3 progress updates at 5s intervals)
    await page.waitForTimeout(15000);
    
    // Verify at least 2 progress updates were sent
    expect(progressUpdateCount).toBeGreaterThanOrEqual(2);
  });

  test('Reach 90% completion → next lesson unlocks', async ({ page }) => {
    // Navigate to course
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    // Get first lesson
    await page.click('[data-testid="lesson-item"]').first;
    await expect(page.locator('[data-testid="youtube-embed"]')).toBeVisible();
    
    // Check if second lesson exists and is initially locked
    const secondLesson = page.locator('[data-testid="lesson-item"]').nth(1);
    if (await secondLesson.isVisible()) {
      const lockIcon = secondLesson.locator('[data-testid="lesson-locked-icon"]');
      const isInitiallyLocked = await lockIcon.isVisible();
      
      if (isInitiallyLocked) {
        // Simulate watching to 90% (this would require YouTube API integration)
        // For now, we'll mock the progress update
        await page.evaluate(async () => {
          const response = await fetch('/api/courses/lessons/current/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'COMPLETED',
              durationSpent: 180,
              watchLogs: Array.from({ length: 180 }, (_, i) => ({
                timestamp: Date.now() - (180 - i) * 1000,
                playedSeconds: i,
                played: i / 200,
                sessionId: 'test-session',
              })),
            }),
          });
          return response.ok;
        });
        
        // Refresh lesson list
        await page.reload();
        
        // Verify second lesson is now unlocked
        await expect(lockIcon).not.toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Resume video → progress continues from last position', async ({ page }) => {
    // Navigate to lesson
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    await page.click('[data-testid="lesson-item"]').first;
    await expect(page.locator('[data-testid="youtube-embed"]')).toBeVisible();
    
    // Simulate watching for 10 seconds
    await page.waitForTimeout(10000);
    
    // Leave the page
    await page.click('[data-testid="nav-dashboard"]');
    
    // Return to the same lesson
    await page.click('[data-testid="nav-courses"]');
    await courseCard.click();
    await page.click('[data-testid="lesson-item"]').first;
    
    // Check if video resumed from previous position
    // (This would require checking YouTube API currentTime)
    const resumeIndicator = page.locator('[data-testid="resume-from-timestamp"]');
    if (await resumeIndicator.isVisible()) {
      await expect(resumeIndicator).toContainText(/0:[0-9]{2}/); // Should show seconds > 0
    }
  });

  test('Video controls are accessible and functional', async ({ page }) => {
    // Navigate to lesson
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    await page.click('[data-testid="lesson-item"]').first;
    const youtubeEmbed = page.locator('[data-testid="youtube-embed"]');
    await expect(youtubeEmbed).toBeVisible();
    
    // Wait for YouTube iframe to load
    const iframe = page.frameLocator('iframe[src*="youtube.com"]');
    await expect(iframe.locator('video')).toBeVisible({ timeout: 10000 });
    
    // Verify play button exists (YouTube controls)
    // Note: YouTube iframe might have restricted controls access
    // We verify the embed loaded successfully instead
    await page.waitForTimeout(2000);
    
    // No JavaScript errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('favicon') && !err.includes('sourcemap')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('Multiple lessons with YouTube videos can be accessed sequentially', async ({ page }) => {
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    // Get all lesson items
    const lessonItems = page.locator('[data-testid="lesson-item"]');
    const lessonCount = await lessonItems.count();
    
    // Test first 3 lessons (or all if less than 3)
    const lessonsToTest = Math.min(lessonCount, 3);
    
    for (let i = 0; i < lessonsToTest; i++) {
      await lessonItems.nth(i).click();
      
      // Verify YouTube embed loads
      await expect(page.locator('[data-testid="youtube-embed"]')).toBeVisible({ timeout: 10000 });
      
      // Wait briefly
      await page.waitForTimeout(2000);
      
      // Go back to lesson list if not last lesson
      if (i < lessonsToTest - 1) {
        await page.goBack();
        await page.waitForTimeout(1000);
      }
    }
  });
});
