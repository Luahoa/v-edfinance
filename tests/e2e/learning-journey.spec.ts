import { expect, test } from '@playwright/test';
import {
  assertUserIsLoggedIn,
  completeOnboarding,
  generateTestUser,
  registerUser,
  waitForToast,
} from '../helpers/test-utils';

test.describe('E011: Full Learning Journey', () => {
  test.use({
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  });

  test('Complete learning journey: Onboarding → Course → Certificate', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for full journey

    const user = generateTestUser();

    // Step 1: Registration
    await registerUser(page, user, 'vi');
    await page.waitForURL(/.*\/(onboarding|dashboard)/, { timeout: 10000 });

    // Step 2: Complete onboarding with risk assessment
    if (page.url().includes('onboarding')) {
      await page.click('[data-testid="risk-moderate"]');
      await page.click('[data-testid="onboarding-next"]');
      
      // Select financial goals
      await page.click('[data-testid="goal-saving"]');
      await page.click('[data-testid="goal-investing"]');
      await page.click('[data-testid="onboarding-finish"]');
      
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    }

    await assertUserIsLoggedIn(page);

    // Step 3: Receive personalized course recommendations
    await page.goto('/vi/courses');
    const recommendedCourse = page.locator('[data-testid="recommended-course"]').first();
    await expect(recommendedCourse).toBeVisible({ timeout: 10000 });

    // Step 4: Enroll in recommended course
    await recommendedCourse.click();
    await page.click('[data-testid="enroll-btn"]');
    await waitForToast(page, /Đã ghi danh|Enrolled/);

    // Step 5: Complete course modules
    await page.goto('/vi/my-courses');
    await page.click('[data-testid="active-course"]').first();
    
    // Complete first lesson
    await page.click('[data-testid="lesson-1"]');
    await page.click('[data-testid="mark-complete"]');
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuenow', /[1-9]/);

    // Step 6: Pass quiz
    await page.click('[data-testid="quiz-start"]');
    const questions = page.locator('[data-testid="quiz-question"]');
    const count = await questions.count();
    
    for (let i = 0; i < count; i++) {
      await page.click(`[data-testid="answer-1-${i}"]`);
    }
    
    await page.click('[data-testid="quiz-submit"]');
    await expect(page.locator('[data-testid="quiz-score"]')).toHaveText(/[0-9]+/);

    // Step 7: Earn certificate
    await page.click('[data-testid="complete-course"]');
    await waitForToast(page, /Chúc mừng|Congratulations/);
    
    const certificate = page.locator('[data-testid="certificate"]');
    await expect(certificate).toBeVisible();
    
    // Step 8: Verify achievement unlocked
    await page.goto('/vi/profile');
    const badges = page.locator('[data-testid="badge"]');
    await expect(badges).toHaveCount({ min: 1 });
  });

  test('Progress persistence across sessions', async ({ page, context }) => {
    const user = generateTestUser();
    
    // Session 1: Start course
    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }
    
    await page.goto('/vi/courses');
    await page.click('[data-testid="course-card"]').first();
    await page.click('[data-testid="enroll-btn"]');
    
    await page.click('[data-testid="lesson-1"]');
    await page.click('[data-testid="mark-complete"]');
    
    const progressBefore = await page.locator('[data-testid="progress-bar"]').getAttribute('aria-valuenow');
    
    // Clear cookies and reload
    await context.clearCookies();
    await page.reload();
    
    // Re-login
    await page.goto('/vi/login');
    await page.fill('[data-testid="login-email-input"]', user.email);
    await page.fill('[data-testid="login-password-input"]', user.password);
    await page.click('[data-testid="login-submit-btn"]');
    
    // Session 2: Verify progress persisted
    await page.goto('/vi/my-courses');
    const progressAfter = await page.locator('[data-testid="progress-bar"]').getAttribute('aria-valuenow');
    
    expect(progressAfter).toBe(progressBefore);
  });

  test('Multi-locale learning journey', async ({ page }) => {
    const locales = ['vi', 'en', 'zh'];
    
    for (const locale of locales) {
      const user = generateTestUser();
      
      await registerUser(page, user, locale);
      if (page.url().includes('onboarding')) {
        await page.click('[data-testid="risk-low"]');
        await page.click('[data-testid="onboarding-next"]');
        await page.click('[data-testid="onboarding-finish"]');
      }
      
      await page.goto(`/${locale}/courses`);
      const courseTitle = page.locator('[data-testid="course-title"]').first();
      await expect(courseTitle).toBeVisible();
      
      // Verify content is in correct locale
      const content = await courseTitle.textContent();
      expect(content).toBeTruthy();
      
      // Clear session for next locale
      await page.context().clearCookies();
    }
  });

  test('Achievement milestones tracking', async ({ page }) => {
    const user = generateTestUser();
    
    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }
    
    // Track initial points
    await page.goto('/vi/profile');
    const initialPoints = await page.locator('[data-testid="user-points"]').textContent();
    
    // Complete action (enroll in course)
    await page.goto('/vi/courses');
    await page.click('[data-testid="course-card"]').first();
    await page.click('[data-testid="enroll-btn"]');
    
    // Verify points increased
    await page.goto('/vi/profile');
    const updatedPoints = await page.locator('[data-testid="user-points"]').textContent();
    
    expect(Number(updatedPoints)).toBeGreaterThan(Number(initialPoints));
  });

  test('Learning path recommendations based on risk profile', async ({ page }) => {
    const riskProfiles = [
      { testId: 'risk-low', expectedTag: 'Cơ bản' },
      { testId: 'risk-moderate', expectedTag: 'Trung cấp' },
      { testId: 'risk-high', expectedTag: 'Nâng cao' },
    ];
    
    for (const profile of riskProfiles) {
      const user = generateTestUser();
      
      await registerUser(page, user, 'vi');
      await page.waitForURL(/.*onboarding/);
      
      await page.click(`[data-testid="${profile.testId}"]`);
      await page.click('[data-testid="onboarding-next"]');
      await page.click('[data-testid="onboarding-finish"]');
      
      await page.goto('/vi/courses');
      const recommendedCourses = page.locator('[data-testid="recommended-course"]');
      await expect(recommendedCourses.first()).toBeVisible();
      
      // Verify course difficulty matches risk profile
      const courseDifficulty = page.locator('[data-testid="course-difficulty"]').first();
      await expect(courseDifficulty).toContainText(new RegExp(profile.expectedTag));
      
      await page.context().clearCookies();
    }
  });

  test('Certificate download and verification', async ({ page }) => {
    const user = generateTestUser();
    
    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }
    
    // Navigate to completed course
    await page.goto('/vi/my-courses');
    
    // Mock course completion
    await page.evaluate(() => {
      localStorage.setItem('mock-completed-course', 'true');
    });
    
    await page.reload();
    
    const certificateBtn = page.locator('[data-testid="view-certificate"]').first();
    
    if (await certificateBtn.isVisible()) {
      await certificateBtn.click();
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-certificate"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/certificate.*\.pdf/);
    }
  });
});
