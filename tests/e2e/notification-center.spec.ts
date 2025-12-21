import { expect, test } from '@playwright/test';
import {
  assertUserIsLoggedIn,
  completeOnboarding,
  generateTestUser,
  registerUser,
  waitForToast,
} from '../helpers/test-utils';

test.describe('E014: Notification Center', () => {
  test.use({
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  });

  test('Multi-channel notification delivery', async ({ page }) => {
    test.setTimeout(90000);

    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    await page.goto('/vi/dashboard');

    // Trigger different notification types
    // 1. Nudge notification (behavioral)
    await page.goto('/vi/courses');
    await page.click('[data-testid="course-card"]').first();
    await page.waitForTimeout(5000); // Wait for nudge system to trigger

    await page.goto('/vi/notifications');
    const nudgeNotif = page.locator('[data-testid="notification-type-nudge"]').first();
    await expect(nudgeNotif).toBeVisible();

    // 2. Social notification
    await page.goto('/vi/groups');
    await page.click('[data-testid="group-card"]').first();
    await page.click('[data-testid="join-group-btn"]');

    await page.goto('/vi/notifications');
    const socialNotif = page.locator('[data-testid="notification-type-social"]').first();
    await expect(socialNotif).toBeVisible();

    // 3. System notification
    await page.goto('/vi/profile');
    await page.click('[data-testid="edit-profile"]');
    await page.fill('[data-testid="profile-name"]', 'Updated Name');
    await page.click('[data-testid="save-profile"]');

    await page.goto('/vi/notifications');
    const systemNotif = page.locator('[data-testid="notification-type-system"]').first();
    await expect(systemNotif).toBeVisible();

    // Verify all three types exist
    const allNotifications = page.locator('[data-testid^="notification-type-"]');
    await expect(allNotifications).toHaveCount({ min: 3 });
  });

  test('Mark notifications as read', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    // Generate notifications
    await page.goto('/vi/courses');
    await page.click('[data-testid="course-card"]').first();
    await page.click('[data-testid="enroll-btn"]');

    // Check notification center
    await page.goto('/vi/notifications');
    const unreadBadge = page.locator('[data-testid="unread-count"]');
    const initialUnread = await unreadBadge.textContent();

    // Mark first notification as read
    await page.click('[data-testid="notification-item"]').first();
    await page.click('[data-testid="mark-read"]');

    // Verify unread count decreased
    const updatedUnread = await unreadBadge.textContent();
    expect(Number(updatedUnread)).toBe(Number(initialUnread) - 1);

    // Verify notification style changed
    const firstNotif = page.locator('[data-testid="notification-item"]').first();
    await expect(firstNotif).not.toHaveClass(/unread/);
  });

  test('Filter notifications by type', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    // Generate multiple notification types
    await page.goto('/vi/courses');
    await page.click('[data-testid="course-card"]').first();
    await page.click('[data-testid="enroll-btn"]');

    await page.goto('/vi/groups');
    await page.click('[data-testid="group-card"]').first();
    await page.click('[data-testid="join-group-btn"]');

    // Navigate to notifications
    await page.goto('/vi/notifications');

    // Filter by nudge
    await page.click('[data-testid="filter-nudge"]');
    const nudgeNotifs = page.locator('[data-testid="notification-item"]');
    await expect(nudgeNotifs).toHaveCount({ min: 1 });
    
    for (let i = 0; i < await nudgeNotifs.count(); i++) {
      await expect(nudgeNotifs.nth(i)).toHaveAttribute('data-type', 'nudge');
    }

    // Filter by social
    await page.click('[data-testid="filter-social"]');
    const socialNotifs = page.locator('[data-testid="notification-item"]');
    await expect(socialNotifs).toHaveCount({ min: 1 });
    
    for (let i = 0; i < await socialNotifs.count(); i++) {
      await expect(socialNotifs.nth(i)).toHaveAttribute('data-type', 'social');
    }

    // Show all
    await page.click('[data-testid="filter-all"]');
    const allNotifs = page.locator('[data-testid="notification-item"]');
    await expect(allNotifs).toHaveCount({ min: 2 });
  });

  test('Unread count synchronization', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    // Trigger notification
    await page.goto('/vi/courses');
    await page.click('[data-testid="course-card"]').first();
    await page.click('[data-testid="enroll-btn"]');

    // Check badge in navigation
    await page.goto('/vi/dashboard');
    const navBadge = page.locator('[data-testid="notification-badge"]');
    await expect(navBadge).toBeVisible();
    const badgeCount = await navBadge.textContent();

    // Navigate to notifications center
    await navBadge.click();
    await expect(page).toHaveURL(/.*notifications/);

    const centerUnread = await page.locator('[data-testid="unread-count"]').textContent();
    expect(centerUnread).toBe(badgeCount);

    // Mark all as read
    await page.click('[data-testid="mark-all-read"]');

    // Verify badge cleared
    await page.goto('/vi/dashboard');
    await expect(navBadge).not.toBeVisible();
  });

  test('Notification action buttons', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    // Generate course recommendation notification
    await page.goto('/vi/dashboard');
    await page.waitForTimeout(3000);

    await page.goto('/vi/notifications');
    
    const notificationItem = page.locator('[data-testid="notification-item"]').first();
    await notificationItem.click();

    // Click action button (e.g., "View Course")
    const actionBtn = page.locator('[data-testid="notification-action"]').first();
    
    if (await actionBtn.isVisible()) {
      await actionBtn.click();
      
      // Should navigate to relevant page
      await expect(page).toHaveURL(/.*courses/);
    }
  });

  test('Real-time notification push', async ({ browser }) => {
    test.setTimeout(90000);

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = generateTestUser();
    const user2 = generateTestUser();

    // Setup users
    await registerUser(page1, user1, 'vi');
    if (page1.url().includes('onboarding')) {
      await completeOnboarding(page1);
    }

    await registerUser(page2, user2, 'vi');
    if (page2.url().includes('onboarding')) {
      await completeOnboarding(page2);
    }

    // User 1 creates group
    await page1.goto('/vi/groups');
    await page1.click('[data-testid="create-group-btn"]');
    await page1.fill('[data-testid="group-name"]', 'Notification Test Group');
    await page1.click('[data-testid="submit-group"]');

    const groupId = await page1.locator('[data-testid="group-id"]').textContent();

    // User 2 joins group and stays on dashboard
    await page2.goto('/vi/groups');
    await page2.fill('[data-testid="search-group"]', 'Notification Test Group');
    await page2.click('[data-testid="search-btn"]');
    await page2.click(`[data-testid="join-group-${groupId}"]`);
    await page2.goto('/vi/dashboard');

    // User 1 posts to group
    await page1.goto(`/vi/groups/${groupId}`);
    await page1.fill('[data-testid="post-content"]', 'Real-time notification test');
    await page1.click('[data-testid="submit-post"]');

    // User 2 should receive notification badge without reload
    const notifBadge = page2.locator('[data-testid="notification-badge"]');
    await expect(notifBadge).toBeVisible({ timeout: 15000 });

    await context1.close();
    await context2.close();
  });

  test('Notification pagination', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    // Generate many notifications (mock)
    await page.evaluate(() => {
      localStorage.setItem('mock-notifications-count', '25');
    });

    await page.goto('/vi/notifications');

    // Should show first page (default 10)
    const notifications = page.locator('[data-testid="notification-item"]');
    await expect(notifications).toHaveCount(10);

    // Load more
    await page.click('[data-testid="load-more"]');
    await expect(notifications).toHaveCount(20);

    // Load remaining
    await page.click('[data-testid="load-more"]');
    await expect(notifications).toHaveCount(25);

    // Button should be hidden
    await expect(page.locator('[data-testid="load-more"]')).not.toBeVisible();
  });
});
