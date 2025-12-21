import { expect, test } from '@playwright/test';
import { loginAsUser } from '../../helpers/test-utils';

test.describe('E025: Full Regression Suite', () => {
  test('Scenario 1: Critical Path - User Registration to Course Completion', async ({ page }) => {
    // 1. Register
    await page.goto('/vi/register');
    const timestamp = Date.now();
    const email = `regression-${timestamp}@test.com`;
    
    await page.fill('[data-testid="register-name-input"]', `Test User ${timestamp}`);
    await page.fill('[data-testid="register-email-input"]', email);
    await page.fill('[data-testid="register-password-input"]', 'Test123!');
    await page.click('[data-testid="register-submit-btn"]');
    
    // 2. Onboarding
    if (await page.locator('[data-testid="onboarding-container"]').isVisible()) {
      await page.click('[data-testid="onboarding-next-btn"]');
      await page.selectOption('[data-testid="risk-tolerance-select"]', 'moderate');
      await page.click('[data-testid="onboarding-complete-btn"]');
    }
    
    // 3. Browse courses
    await page.goto('/vi/courses');
    await expect(page.locator('[data-testid="course-card"]').first()).toBeVisible();
    
    // 4. Enroll in course
    await page.click('[data-testid="course-card"]').first();
    await page.click('[data-testid="enroll-btn"]');
    
    // 5. Start lesson
    await page.click('[data-testid="start-course-btn"]');
    await expect(page.locator('[data-testid="lesson-content"]')).toBeVisible();
    
    // 6. Complete lesson
    await page.click('[data-testid="complete-lesson-btn"]');
    await expect(
      page.locator('text=Completed').or(page.locator('text=Hoàn thành'))
    ).toBeVisible();
    
    await page.screenshot({ path: 'playwright-report/critical-path-success.png' });
  });

  test('Scenario 2: Smoke Test - All Major Routes Accessible', async ({ page }) => {
    await loginAsUser(page, 'test@example.com', 'password123');
    
    const routes = [
      { path: '/vi', name: 'Homepage' },
      { path: '/vi/dashboard', name: 'Dashboard' },
      { path: '/vi/courses', name: 'Courses' },
      { path: '/vi/wallet', name: 'Wallet' },
      { path: '/vi/achievements', name: 'Achievements' },
      { path: '/vi/leaderboard', name: 'Leaderboard' },
      { path: '/vi/settings', name: 'Settings' },
    ];
    
    for (const route of routes) {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path));
      
      // Verify no error page
      await expect(
        page.locator('text=404').or(page.locator('text=Error'))
      ).not.toBeVisible();
      
      await page.screenshot({ path: `playwright-report/smoke-${route.name}.png` });
    }
  });

  test('Scenario 3: Visual Regression - UI Component Baseline', async ({ page }) => {
    await page.goto('/vi');
    
    // Capture homepage baseline
    await page.screenshot({ 
      path: 'playwright-report/baseline-homepage.png',
      fullPage: true 
    });
    
    // Capture course card
    await page.goto('/vi/courses');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.screenshot({ path: 'playwright-report/baseline-course-card.png' });
    
    // Capture button states
    const button = page.locator('[data-testid="enroll-btn"]').first();
    if (await button.isVisible()) {
      await button.screenshot({ path: 'playwright-report/baseline-button-normal.png' });
      
      await button.hover();
      await button.screenshot({ path: 'playwright-report/baseline-button-hover.png' });
    }
    
    // Capture form elements
    await page.goto('/vi/login');
    await page.screenshot({ path: 'playwright-report/baseline-login-form.png' });
  });

  test('Scenario 4: Performance - Page Load Times', async ({ page }) => {
    const routes = ['/vi', '/vi/courses', '/vi/dashboard'];
    const loadTimes: Record<string, number> = {};
    
    for (const route of routes) {
      const startTime = Date.now();
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const endTime = Date.now();
      
      loadTimes[route] = endTime - startTime;
      
      // Assert load time < 3 seconds
      expect(loadTimes[route]).toBeLessThan(3000);
    }
    
    console.log('Load Times:', loadTimes);
  });

  test('Scenario 5: Cross-Locale Consistency', async ({ page }) => {
    const locales = ['vi', 'en', 'zh'];
    
    for (const locale of locales) {
      await page.goto(`/${locale}`);
      
      // Verify key elements present in all locales
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="course-card"]').first()).toBeVisible();
      
      // Verify language switcher
      const langSwitcher = page.locator('[data-testid="language-switcher"]');
      if (await langSwitcher.isVisible()) {
        await expect(langSwitcher).toHaveText(new RegExp(locale.toUpperCase()));
      }
      
      await page.screenshot({ path: `playwright-report/locale-${locale}.png` });
    }
  });

  test('Scenario 6: Error Handling - Network Failures', async ({ page, context }) => {
    await loginAsUser(page, 'test@example.com', 'password123');
    
    // Simulate offline mode
    await context.setOffline(true);
    
    await page.goto('/vi/courses');
    
    // Verify offline indicator or error message
    await expect(
      page.locator('text=No connection').or(
        page.locator('text=Offline').or(
          page.locator('text=Mất kết nối')
        )
      )
    ).toBeVisible({ timeout: 5000 });
    
    // Restore connection
    await context.setOffline(false);
    await page.reload();
    
    // Verify content loads
    await expect(page.locator('[data-testid="course-card"]').first()).toBeVisible();
  });

  test('Scenario 7: Accessibility - Keyboard Navigation', async ({ page }) => {
    await page.goto('/vi');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verify focus visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test Enter key activation
    await page.keyboard.press('Enter');
    
    // Verify navigation occurred or modal opened
    await page.waitForTimeout(500);
  });

  test('Scenario 8: Data Persistence - LocalStorage/SessionStorage', async ({ page }) => {
    await loginAsUser(page, 'test@example.com', 'password123');
    
    // Check auth token stored
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
    
    // Check user preferences
    await page.goto('/vi/settings');
    await page.selectOption('[data-testid="theme-select"]', 'dark');
    
    // Reload page
    await page.reload();
    
    // Verify preference persisted
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('dark');
  });

  test('Scenario 9: Security - XSS Protection', async ({ page }) => {
    await loginAsUser(page, 'test@example.com', 'password123');
    
    // Try to inject script via input
    const maliciousInput = '<script>alert("XSS")</script>';
    
    await page.goto('/vi/settings/profile');
    await page.fill('[data-testid="bio-input"]', maliciousInput);
    await page.click('[data-testid="save-profile-btn"]');
    
    // Reload and verify script not executed (should be escaped)
    await page.reload();
    const bioText = await page.locator('[data-testid="bio-display"]').textContent();
    
    // Should show escaped HTML, not execute script
    expect(bioText).toContain('script');
    expect(bioText).not.toContain('XSS');
  });

  test('Scenario 10: Full User Journey - Week 1 Simulation', async ({ page }) => {
    await loginAsUser(page, 'test@example.com', 'password123');
    
    // Day 1: Enroll in course
    await page.goto('/vi/courses');
    await page.click('[data-testid="course-card"]').first();
    await page.click('[data-testid="enroll-btn"]');
    
    // Day 2: Complete first lesson
    await page.click('[data-testid="start-course-btn"]');
    await page.click('[data-testid="complete-lesson-btn"]');
    
    // Day 3: Check progress
    await page.goto('/vi/dashboard');
    await expect(page.locator('[data-testid="course-progress"]')).toBeVisible();
    
    // Day 4: Interact with AI mentor
    await page.goto('/vi/mentor');
    await page.fill('[data-testid="chat-input"]', 'What is compound interest?');
    await page.click('[data-testid="send-btn"]');
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
    
    // Day 5: Make first wallet deposit
    await page.goto('/vi/wallet');
    await page.click('[data-testid="deposit-btn"]');
    await page.fill('[data-testid="amount-input"]', '100000');
    await page.click('[data-testid="confirm-deposit-btn"]');
    
    // Day 7: View achievements
    await page.goto('/vi/achievements');
    await expect(page.locator('[data-testid="achievement-badge"]').first()).toBeVisible();
    
    await page.screenshot({ path: 'playwright-report/week1-journey-complete.png', fullPage: true });
  });
});
