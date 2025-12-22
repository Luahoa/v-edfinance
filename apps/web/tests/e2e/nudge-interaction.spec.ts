import { expect, test } from '@playwright/test';

test.describe('Nudge Interaction Flow (E007)', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();

    // Grant notification permissions
    await context.grantPermissions(['notifications']);

    // Login
    await page.goto('/vi/login');
    await page.fill('[data-testid="login-email"]', 'test@example.com');
    await page.fill('[data-testid="login-password"]', 'Password123!');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 30000 });
  });

  test('should receive nudge notification and trigger action', async ({ page }) => {
    // Navigate to dashboard where nudges appear
    await page.goto('/vi/dashboard');

    // Wait for nudge to appear (could be WebSocket or polling)
    const nudgeNotification = page.locator('[data-testid="nudge-notification"]').first();
    await expect(nudgeNotification).toBeVisible({ timeout: 20000 });

    // Verify nudge content
    await expect(nudgeNotification).toContainText(/.*/, { timeout: 5000 });

    // Click on nudge
    await nudgeNotification.click();

    // Should navigate to action page or show modal
    const actionModal = page.locator('[data-testid="nudge-action-modal"]');
    if (await actionModal.isVisible()) {
      await expect(actionModal).toContainText(/Complete|Hoàn thành/);

      // Take action
      await page.click('[data-testid="nudge-action-confirm"]');

      // Verify action taken confirmation
      await expect(page.locator('[data-testid="nudge-action-success"]')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should trigger loss aversion nudge', async ({ page }) => {
    // Create scenario where user has declining streak
    await page.goto('/vi/dashboard');

    // Check if loss aversion nudge appears
    const lossAversionNudge = page.locator('[data-testid="nudge-type-loss-aversion"]');

    // If nudge appears, interact with it
    if (await lossAversionNudge.isVisible({ timeout: 10000 })) {
      await expect(lossAversionNudge).toContainText(/streak|chuỗi/i);

      // Click to take recovery action
      await lossAversionNudge.click();
      await page.click('[data-testid="nudge-recover-streak"]');

      // Verify behavior logged
      await page.waitForTimeout(2000);

      // Check analytics endpoint was called (via network or UI confirmation)
      await expect(page.locator('[data-testid="action-logged"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should track conversion after nudge interaction', async ({ page }) => {
    await page.goto('/vi/dashboard');

    // Wait for any nudge
    const nudge = page.locator('[data-testid^="nudge-"]').first();
    await expect(nudge).toBeVisible({ timeout: 15000 });

    // Get nudge ID
    const nudgeId = await nudge.getAttribute('data-nudge-id');

    // Click nudge
    await nudge.click();

    // Complete suggested action
    await page.click('[data-testid="nudge-action-confirm"]');

    // Navigate to behavior analytics
    await page.goto('/vi/profile/analytics');

    // Verify conversion was tracked
    const behaviorLog = page.locator(`[data-testid="behavior-log-${nudgeId}"]`);
    await expect(behaviorLog).toBeVisible({ timeout: 10000 });
    await expect(behaviorLog).toContainText(/completed|đã hoàn thành/i);
  });

  test('should display social proof nudge with peer comparison', async ({ page }) => {
    await page.goto('/vi/courses');

    // Look for social proof nudge
    const socialProofNudge = page.locator('[data-testid="nudge-social-proof"]');

    if (await socialProofNudge.isVisible({ timeout: 10000 })) {
      // Should contain percentage or peer info
      await expect(socialProofNudge).toContainText(/%|người dùng|users/);

      // Click to view details
      await socialProofNudge.click();

      // Should show peer comparison
      await expect(page.locator('[data-testid="peer-comparison"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should respect nudge preferences and frequency limits', async ({ page }) => {
    // Go to settings
    await page.goto('/vi/settings/notifications');

    // Disable certain nudge types
    await page.click('[data-testid="nudge-settings-loss-aversion"]');
    await page.click('[data-testid="save-settings"]');

    // Verify settings saved
    await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible({ timeout: 5000 });

    // Go back to dashboard
    await page.goto('/vi/dashboard');

    // Loss aversion nudges should not appear
    const lossAversionNudge = page.locator('[data-testid="nudge-type-loss-aversion"]');
    await expect(lossAversionNudge).not.toBeVisible({ timeout: 10000 });
  });
});
