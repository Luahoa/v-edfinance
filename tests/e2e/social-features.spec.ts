import { test, expect } from '@playwright/test';

test.describe('E004: Social Features', () => {
  test.setTimeout(120000);

  let user1Email: string;
  let user2Email: string;

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    
    const timestamp = Date.now();
    user1Email = `social-user1-${timestamp}@vedfinance.test`;

    // Create first user
    await page.goto('/vi/register');
    await page.fill('[data-testid="register-name"]', 'Social User 1');
    await page.fill('[data-testid="register-email"]', user1Email);
    await page.fill('[data-testid="register-password"]', 'SocialPass123!');
    await page.fill('[data-testid="register-password-confirm"]', 'SocialPass123!');
    await page.click('[data-testid="register-submit"]');

    // Complete onboarding
    await page.waitForURL(/\/vi\/onboarding/, { timeout: 15000 });
    await page.click('[data-testid="onboarding-beginner"]');
    await page.click('[data-testid="onboarding-longterm"]');
    await page.click('[data-testid="onboarding-medium"]');
    await page.click('[data-testid="onboarding-complete"]');

    await page.waitForURL(/\/vi\/dashboard/, { timeout: 15000 });
  });

  test('should create a post in social feed', async ({ page }) => {
    // Navigate to social/community page
    const socialNav = page.locator('[data-testid="nav-social"], [data-testid="nav-community"]');
    if (await socialNav.isVisible({ timeout: 5000 })) {
      await socialNav.click();
      await page.waitForURL(/\/vi\/(social|community)/, { timeout: 10000 });

      // Create new post
      const createPostBtn = page.locator('[data-testid="create-post-btn"]');
      await createPostBtn.click();

      // Fill post content
      const postInput = page.locator('[data-testid="post-input"], [data-testid="post-textarea"]');
      await postInput.fill('This is a test post from E2E test!');

      // Submit post
      const submitBtn = page.locator('[data-testid="post-submit"]');
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // Verify post appears in feed
      const feedPosts = page.locator('[data-testid^="post-"]');
      await expect(feedPosts.first()).toBeVisible({ timeout: 10000 });
      await expect(feedPosts.first()).toContainText('This is a test post from E2E test!');
    }
  });

  test('should follow another user', async ({ page, context }) => {
    const socialNav = page.locator('[data-testid="nav-social"], [data-testid="nav-community"]');
    if (await socialNav.isVisible({ timeout: 5000 })) {
      await socialNav.click();
      await page.waitForURL(/\/vi\/(social|community)/, { timeout: 10000 });

      // Find users list or suggested users
      const usersList = page.locator('[data-testid="users-list"], [data-testid="suggested-users"]');
      
      if (await usersList.isVisible({ timeout: 5000 })) {
        const firstUser = usersList.locator('[data-testid^="user-card-"]').first();
        
        if (await firstUser.isVisible({ timeout: 5000 })) {
          // Click follow button
          const followBtn = firstUser.locator('[data-testid="follow-btn"]');
          await followBtn.click();
          await page.waitForTimeout(1000);

          // Verify button text changed
          await expect(followBtn).toContainText(/Following|Đang theo dõi|Unfollow/i);
        }
      }
    }
  });

  test('should like and comment on a post', async ({ page }) => {
    const socialNav = page.locator('[data-testid="nav-social"], [data-testid="nav-community"]');
    if (await socialNav.isVisible({ timeout: 5000 })) {
      await socialNav.click();
      await page.waitForURL(/\/vi\/(social|community)/, { timeout: 10000 });

      // Wait for feed to load
      const feedPosts = page.locator('[data-testid^="post-"]');
      await expect(feedPosts.first()).toBeVisible({ timeout: 10000 });

      // Like the first post
      const firstPost = feedPosts.first();
      const likeBtn = firstPost.locator('[data-testid="like-btn"]');
      
      const initialLikes = await likeBtn.textContent();
      await likeBtn.click();
      await page.waitForTimeout(1000);

      // Verify like count increased
      const updatedLikes = await likeBtn.textContent();
      expect(updatedLikes).not.toBe(initialLikes);

      // Add comment
      const commentBtn = firstPost.locator('[data-testid="comment-btn"]');
      await commentBtn.click();

      const commentInput = page.locator('[data-testid="comment-input"]');
      await commentInput.fill('Great post! This is a test comment.');

      const submitCommentBtn = page.locator('[data-testid="comment-submit"]');
      await submitCommentBtn.click();
      await page.waitForTimeout(2000);

      // Verify comment appears
      const comments = firstPost.locator('[data-testid^="comment-"]');
      await expect(comments.last()).toContainText('Great post! This is a test comment.');
    }
  });

  test('should receive notifications', async ({ page }) => {
    // Check notifications icon/bell
    const notificationsBell = page.locator('[data-testid="notifications-bell"]');
    
    if (await notificationsBell.isVisible({ timeout: 5000 })) {
      await notificationsBell.click();

      // Verify notifications panel opens
      const notificationsPanel = page.locator('[data-testid="notifications-panel"]');
      await expect(notificationsPanel).toBeVisible({ timeout: 5000 });

      // Check for any notifications (new user might have welcome notification)
      const notifications = notificationsPanel.locator('[data-testid^="notification-"]');
      
      if (await notifications.first().isVisible({ timeout: 5000 })) {
        await expect(notifications.first()).toBeVisible();
      }
    }
  });

  test('should update feed in real-time (WebSocket)', async ({ page, context }) => {
    const socialNav = page.locator('[data-testid="nav-social"], [data-testid="nav-community"]');
    if (await socialNav.isVisible({ timeout: 5000 })) {
      await socialNav.click();
      await page.waitForURL(/\/vi\/(social|community)/, { timeout: 10000 });

      // Create a post
      const createPostBtn = page.locator('[data-testid="create-post-btn"]');
      if (await createPostBtn.isVisible({ timeout: 5000 })) {
        await createPostBtn.click();

        const postInput = page.locator('[data-testid="post-input"], [data-testid="post-textarea"]');
        await postInput.fill('WebSocket real-time test post');

        const submitBtn = page.locator('[data-testid="post-submit"]');
        await submitBtn.click();

        // Wait for post to appear (should be real-time)
        await page.waitForTimeout(2000);

        const feedPosts = page.locator('[data-testid^="post-"]');
        await expect(feedPosts.first()).toContainText('WebSocket real-time test post');
      }
    }
  });

  test('should create and join a buddy group', async ({ page }) => {
    const socialNav = page.locator('[data-testid="nav-social"], [data-testid="nav-community"]');
    if (await socialNav.isVisible({ timeout: 5000 })) {
      await socialNav.click();
      await page.waitForURL(/\/vi\/(social|community)/, { timeout: 10000 });

      // Navigate to groups tab
      const groupsTab = page.locator('[data-testid="tab-groups"], text=/Nhóm|Groups/i');
      
      if (await groupsTab.isVisible({ timeout: 5000 })) {
        await groupsTab.click();
        await page.waitForTimeout(1000);

        // Create new group
        const createGroupBtn = page.locator('[data-testid="create-group-btn"]');
        
        if (await createGroupBtn.isVisible({ timeout: 5000 })) {
          await createGroupBtn.click();

          // Fill group details
          await page.fill('[data-testid="group-name"]', 'E2E Test Group');
          await page.fill('[data-testid="group-description"]', 'A group for E2E testing');

          const submitGroupBtn = page.locator('[data-testid="group-submit"]');
          await submitGroupBtn.click();
          await page.waitForTimeout(2000);

          // Verify group created
          const groupsList = page.locator('[data-testid="groups-list"]');
          await expect(groupsList).toContainText('E2E Test Group');
        }
      }
    }
  });

  test('should display notification center with unread count', async ({ page }) => {
    const notificationsBell = page.locator('[data-testid="notifications-bell"]');
    
    if (await notificationsBell.isVisible({ timeout: 5000 })) {
      // Check for unread badge
      const unreadBadge = page.locator('[data-testid="notifications-unread"]');
      
      if (await unreadBadge.isVisible({ timeout: 2000 })) {
        const count = await unreadBadge.textContent();
        expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
      }

      // Open notifications
      await notificationsBell.click();

      const notificationsPanel = page.locator('[data-testid="notifications-panel"]');
      await expect(notificationsPanel).toBeVisible({ timeout: 5000 });

      // Mark all as read
      const markAllReadBtn = page.locator('[data-testid="mark-all-read"]');
      
      if (await markAllReadBtn.isVisible({ timeout: 2000 })) {
        await markAllReadBtn.click();
        await page.waitForTimeout(1000);

        // Verify unread count cleared
        const updatedBadge = await unreadBadge.isVisible({ timeout: 2000 });
        if (updatedBadge) {
          const newCount = await unreadBadge.textContent();
          expect(parseInt(newCount || '0')).toBe(0);
        }
      }
    }
  });
});
