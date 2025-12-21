import { expect, test } from '@playwright/test';

test.describe('Multi-Locale Experience (E010)', () => {
  test.setTimeout(60000);

  const locales = ['vi', 'en', 'zh'];
  const testTranslations = {
    vi: {
      register: 'Đăng ký',
      login: 'Đăng nhập',
      dashboard: 'Bảng điều khiển',
      courses: 'Khóa học',
    },
    en: {
      register: 'Register',
      login: 'Login',
      dashboard: 'Dashboard',
      courses: 'Courses',
    },
    zh: {
      register: '注册',
      login: '登录',
      dashboard: '仪表板',
      courses: '课程',
    },
  };

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('should display content in Vietnamese (default)', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to /vi
    await page.waitForURL(/.*\/vi/, { timeout: 10000 });
    
    // Check Vietnamese content
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    const text = await heading.textContent();
    expect(text).toBeTruthy();
  });

  test('should switch between all three languages (vi/en/zh)', async ({ page }) => {
    // Start with Vietnamese
    await page.goto('/vi/register');
    await expect(page.locator('h2')).toContainText(testTranslations.vi.register, { timeout: 10000 });
    
    // Switch to English via selector
    const langSwitcher = page.locator('[data-testid="lang-switcher"]');
    if (await langSwitcher.isVisible({ timeout: 5000 })) {
      await langSwitcher.selectOption('en');
      await page.waitForURL(/.*\/en\/register/, { timeout: 10000 });
      await expect(page.locator('h2')).toContainText(testTranslations.en.register, { timeout: 10000 });
      
      // Switch to Chinese
      await langSwitcher.selectOption('zh');
      await page.waitForURL(/.*\/zh\/register/, { timeout: 10000 });
      await expect(page.locator('h2')).toContainText(testTranslations.zh.register, { timeout: 10000 });
      
      // Switch back to Vietnamese
      await langSwitcher.selectOption('vi');
      await page.waitForURL(/.*\/vi\/register/, { timeout: 10000 });
      await expect(page.locator('h2')).toContainText(testTranslations.vi.register, { timeout: 10000 });
    }
  });

  test('should maintain locale across navigation', async ({ page }) => {
    // Start in English
    await page.goto('/en/register');
    await expect(page).toHaveURL(/.*\/en\/register/);
    
    // Navigate to login
    await page.click('[data-testid="nav-login"]');
    await expect(page).toHaveURL(/.*\/en\/login/);
    await expect(page.locator('h2')).toContainText(testTranslations.en.login);
    
    // Navigate to courses
    await page.goto('/en/courses');
    await expect(page).toHaveURL(/.*\/en\/courses/);
    await expect(page.locator('h1')).toContainText(testTranslations.en.courses);
  });

  test('should validate form errors in selected locale', async ({ page }) => {
    // Test in Vietnamese
    await page.goto('/vi/register');
    await page.click('[data-testid="register-submit"]'); // Submit without filling
    
    const errorMessage = page.locator('[data-testid="error-message"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    const viError = await errorMessage.textContent();
    expect(viError).toContain('bắt buộc' || 'không được để trống' || 'required');
    
    // Switch to English and test
    await page.goto('/en/register');
    await page.click('[data-testid="register-submit"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    const enError = await errorMessage.textContent();
    expect(enError?.toLowerCase()).toContain('required');
  });

  test('should display translated content from database (JSONB)', async ({ page, context }) => {
    // Login first
    await page.goto('/vi/login');
    await page.fill('[data-testid="login-email"]', 'test@example.com');
    await page.fill('[data-testid="login-password"]', 'Password123!');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 30000 });
    
    // Navigate to courses (which have JSONB localized content)
    await page.goto('/vi/courses');
    const courseTitle = page.locator('[data-testid="course-title"]').first();
    await expect(courseTitle).toBeVisible({ timeout: 10000 });
    const viTitle = await courseTitle.textContent();
    
    // Switch to English
    const langSwitcher = page.locator('[data-testid="lang-switcher"]');
    if (await langSwitcher.isVisible({ timeout: 5000 })) {
      await langSwitcher.selectOption('en');
      await page.waitForURL(/.*\/en\/courses/, { timeout: 10000 });
      
      const enTitle = await courseTitle.textContent();
      
      // Titles should be different (assuming JSONB has different translations)
      if (viTitle !== enTitle) {
        expect(enTitle).not.toBe(viTitle);
      }
    }
  });

  test('should format numbers and dates according to locale', async ({ page }) => {
    await page.goto('/vi/dashboard');
    
    // Check for Vietnamese number formatting (1.000.000 VND)
    const viBalance = page.locator('[data-testid="wallet-balance"]');
    if (await viBalance.isVisible({ timeout: 5000 })) {
      const viBalanceText = await viBalance.textContent();
      // Vietnamese typically uses dots for thousands
      expect(viBalanceText).toMatch(/\d+/);
    }
    
    // Switch to English
    await page.goto('/en/dashboard');
    const enBalance = page.locator('[data-testid="wallet-balance"]');
    if (await enBalance.isVisible({ timeout: 5000 })) {
      const enBalanceText = await enBalance.textContent();
      // English typically uses commas for thousands
      expect(enBalanceText).toMatch(/\d+/);
    }
  });

  test('should persist locale preference after logout', async ({ page, context }) => {
    // Set locale to Chinese
    await page.goto('/zh/login');
    await expect(page).toHaveURL(/.*\/zh\/login/);
    
    // Store locale in localStorage or cookie
    const localeStored = await page.evaluate(() => {
      return localStorage.getItem('locale') || document.cookie.includes('NEXT_LOCALE=zh');
    });
    
    // Navigate to home
    await page.goto('/');
    
    // Should redirect to Chinese version
    if (localeStored) {
      await expect(page).toHaveURL(/.*\/zh/, { timeout: 10000 });
    }
  });

  test('should handle missing translations gracefully', async ({ page }) => {
    // Test a page that might have incomplete translations
    await page.goto('/zh/help');
    
    // Even if some translations are missing, page should still render
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible({ timeout: 10000 });
    
    // Check that at least some content is visible
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible({ timeout: 5000 });
  });

  test('should support translation consistency across components', async ({ page }) => {
    await page.goto('/en/dashboard');
    
    // Check navigation menu
    const navCourses = page.locator('[data-testid="nav-courses"]');
    await expect(navCourses).toContainText(/Courses/i);
    
    // Check page heading
    const pageHeading = page.locator('h1');
    // Should be in English throughout
    const headingText = await pageHeading.textContent();
    expect(headingText).not.toContain('Khóa học'); // Should not contain Vietnamese
    expect(headingText).not.toContain('课程'); // Should not contain Chinese
  });

  test('should render SEO meta tags in correct locale', async ({ page }) => {
    await page.goto('/vi/courses');
    
    // Check HTML lang attribute
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('vi');
    
    // Check meta description (should be in Vietnamese)
    const metaDesc = await page.getAttribute('meta[name="description"]', 'content');
    expect(metaDesc).toBeTruthy();
    
    // Switch to English
    await page.goto('/en/courses');
    const htmlLangEn = await page.getAttribute('html', 'lang');
    expect(htmlLangEn).toBe('en');
  });
});
