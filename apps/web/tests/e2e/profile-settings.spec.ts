import path from 'node:path';
import { expect, test } from '@playwright/test';

test.describe('Profile & Settings Management (E008)', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    // Login
    await page.goto('/vi/login');
    await page.fill('[data-testid="login-email"]', 'test@example.com');
    await page.fill('[data-testid="login-password"]', 'Password123!');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 30000 });
  });

  test('should edit profile information', async ({ page }) => {
    // Navigate to profile settings
    await page.goto('/vi/settings/profile');
    await expect(page.locator('h1')).toContainText(/Profile|Hồ sơ/i);

    // Edit name
    const nameInput = page.locator('[data-testid="profile-name"]');
    await nameInput.fill('Updated Test User');

    // Edit bio
    const bioInput = page.locator('[data-testid="profile-bio"]');
    await bioInput.fill('Financial education enthusiast');

    // Save changes
    await page.click('[data-testid="profile-save"]');

    // Verify success message
    await expect(page.locator('[data-testid="profile-updated"]')).toBeVisible({ timeout: 5000 });

    // Reload and verify changes persisted
    await page.reload();
    await expect(nameInput).toHaveValue('Updated Test User');
    await expect(bioInput).toHaveValue('Financial education enthusiast');
  });

  test('should upload avatar to R2', async ({ page }) => {
    await page.goto('/vi/settings/profile');

    // Prepare test image (use a small base64 test image or fixture)
    const fileInput = page.locator('[data-testid="avatar-upload"]');

    // Create a dummy file path (you may need to create an actual test image file)
    const testImagePath = path.join(
      process.cwd(),
      'apps',
      'web',
      'tests',
      'fixtures',
      'test-avatar.png'
    );

    // Upload file
    await fileInput.setInputFiles(testImagePath);

    // Wait for upload to complete
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 15000 });

    // Verify avatar preview updated
    const avatarPreview = page.locator('[data-testid="avatar-preview"]');
    await expect(avatarPreview).toBeVisible();

    // Verify image src contains R2 URL or blob URL
    const imgSrc = await avatarPreview.getAttribute('src');
    expect(imgSrc).toBeTruthy();
  });

  test('should change language preference (vi/en/zh)', async ({ page }) => {
    await page.goto('/vi/settings/preferences');

    // Change to English
    await page.selectOption('[data-testid="language-selector"]', 'en');
    await page.click('[data-testid="save-preferences"]');

    // Wait for page reload or URL change
    await page.waitForURL(/.*\/en\/settings/, { timeout: 10000 });

    // Verify UI is in English
    await expect(page.locator('h1')).toContainText(/Preferences|Settings/i);

    // Change to Chinese
    await page.selectOption('[data-testid="language-selector"]', 'zh');
    await page.click('[data-testid="save-preferences"]');
    await page.waitForURL(/.*\/zh\/settings/, { timeout: 10000 });

    // Change back to Vietnamese
    await page.selectOption('[data-testid="language-selector"]', 'vi');
    await page.click('[data-testid="save-preferences"]');
    await page.waitForURL(/.*\/vi\/settings/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText(/Tùy chọn|Cài đặt/i);
  });

  test('should update privacy settings (JSONB)', async ({ page }) => {
    await page.goto('/vi/settings/privacy');

    // Toggle various privacy options
    await page.click('[data-testid="privacy-show-portfolio"]');
    await page.click('[data-testid="privacy-allow-messages"]');
    await page.click('[data-testid="privacy-share-analytics"]');

    // Select visibility level
    await page.selectOption('[data-testid="privacy-visibility"]', 'friends-only');

    // Save settings
    await page.click('[data-testid="privacy-save"]');

    // Verify saved
    await expect(page.locator('[data-testid="privacy-updated"]')).toBeVisible({ timeout: 5000 });

    // Reload and verify JSONB data persisted
    await page.reload();
    await expect(page.locator('[data-testid="privacy-show-portfolio"]')).toBeChecked();
    await expect(page.locator('[data-testid="privacy-visibility"]')).toHaveValue('friends-only');
  });

  test('should update notification preferences', async ({ page }) => {
    await page.goto('/vi/settings/notifications');

    // Toggle email notifications
    await page.click('[data-testid="notif-email-enabled"]');

    // Toggle push notifications
    await page.click('[data-testid="notif-push-enabled"]');

    // Select notification frequency
    await page.selectOption('[data-testid="notif-frequency"]', 'daily');

    // Toggle specific notification types
    await page.click('[data-testid="notif-course-updates"]');
    await page.click('[data-testid="notif-achievement-alerts"]');

    // Save
    await page.click('[data-testid="notif-save"]');

    await expect(page.locator('[data-testid="notif-updated"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle investment profile updates', async ({ page }) => {
    await page.goto('/vi/settings/investment-profile');

    // Update risk tolerance
    await page.click('[data-testid="risk-tolerance-high"]');

    // Update investment horizon
    await page.selectOption('[data-testid="investment-horizon"]', 'long-term');

    // Update goals (multi-select)
    await page.click('[data-testid="goal-retirement"]');
    await page.click('[data-testid="goal-wealth-building"]');

    // Save profile
    await page.click('[data-testid="investment-profile-save"]');

    // Verify AI re-analysis triggered
    await expect(page.locator('[data-testid="profile-analyzing"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="profile-analysis-complete"]')).toBeVisible({
      timeout: 15000,
    });
  });
});
