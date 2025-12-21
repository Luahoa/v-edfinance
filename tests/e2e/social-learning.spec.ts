import { expect, test } from '@playwright/test';
import {
  assertUserIsLoggedIn,
  completeOnboarding,
  generateTestUser,
  registerUser,
  waitForToast,
} from '../helpers/test-utils';

test.describe('E012: Social Learning Network', () => {
  test.use({
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  });

  test('Multi-user group interaction and leaderboard', async ({ browser }) => {
    test.setTimeout(120000);

    // Create two users in parallel contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = generateTestUser();
    const user2 = generateTestUser();

    // User 1: Create and join group
    await registerUser(page1, user1, 'vi');
    if (page1.url().includes('onboarding')) {
      await completeOnboarding(page1);
    }

    await page1.goto('/vi/groups');
    await page1.click('[data-testid="create-group-btn"]');
    await page1.fill('[data-testid="group-name"]', 'Financial Warriors');
    await page1.fill('[data-testid="group-description"]', 'Learning together');
    await page1.click('[data-testid="submit-group"]');
    await waitForToast(page1, /Tạo nhóm thành công/);

    const groupId = await page1.locator('[data-testid="group-id"]').textContent();

    // User 2: Join the group
    await registerUser(page2, user2, 'vi');
    if (page2.url().includes('onboarding')) {
      await completeOnboarding(page2);
    }

    await page2.goto('/vi/groups');
    await page2.fill('[data-testid="search-group"]', 'Financial Warriors');
    await page2.click('[data-testid="search-btn"]');
    await page2.click(`[data-testid="join-group-${groupId}"]`);
    await waitForToast(page2, /Đã tham gia nhóm/);

    // User 1: Post to group
    await page1.goto(`/vi/groups/${groupId}`);
    await page1.fill('[data-testid="post-content"]', 'Hello group!');
    await page1.click('[data-testid="submit-post"]');

    // User 2: See post via WebSocket update
    await page2.goto(`/vi/groups/${groupId}`);
    await expect(page2.locator('text=Hello group!')).toBeVisible({ timeout: 10000 });

    // User 2: React to post
    await page2.click('[data-testid="like-post"]').first();
    
    // User 1: See reaction update
    await page1.reload();
    await expect(page1.locator('[data-testid="post-likes"]').first()).toContainText('1');

    // Both users: Check leaderboard
    await page1.goto(`/vi/groups/${groupId}/leaderboard`);
    await page2.goto(`/vi/groups/${groupId}/leaderboard`);

    const leaderboard1 = page1.locator('[data-testid="leaderboard-entry"]');
    const leaderboard2 = page2.locator('[data-testid="leaderboard-entry"]');

    await expect(leaderboard1).toHaveCount({ min: 2 });
    await expect(leaderboard2).toHaveCount({ min: 2 });

    await context1.close();
    await context2.close();
  });

  test('Group challenge participation', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    // Join existing group
    await page.goto('/vi/groups');
    await page.click('[data-testid="group-card"]').first();
    await page.click('[data-testid="join-group-btn"]');

    // Navigate to challenges
    await page.click('[data-testid="group-challenges"]');
    await expect(page.locator('[data-testid="challenge-card"]')).toHaveCount({ min: 1 });

    // Accept challenge
    await page.click('[data-testid="challenge-card"]').first();
    await page.click('[data-testid="accept-challenge"]');
    await waitForToast(page, /Đã chấp nhận thử thách/);

    // Complete challenge action
    await page.click('[data-testid="complete-task-1"]');
    await page.fill('[data-testid="task-proof"]', 'Completed savings goal');
    await page.click('[data-testid="submit-task"]');

    // Verify progress
    await page.goto('/vi/profile/challenges');
    const activeChallenge = page.locator('[data-testid="active-challenge"]').first();
    await expect(activeChallenge).toContainText(/[1-9][0-9]?%/);
  });

  test('Share progress to group feed', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    // Complete an achievement
    await page.goto('/vi/courses');
    await page.click('[data-testid="course-card"]').first();
    await page.click('[data-testid="enroll-btn"]');

    // Share achievement
    await page.click('[data-testid="share-btn"]');
    await page.click('[data-testid="share-to-group"]');
    
    const groupSelector = page.locator('[data-testid="select-group"]');
    await groupSelector.selectOption({ index: 0 });
    
    await page.fill('[data-testid="share-message"]', 'Just enrolled in a new course!');
    await page.click('[data-testid="confirm-share"]');
    await waitForToast(page, /Đã chia sẻ/);

    // Verify in group feed
    const groupId = await groupSelector.inputValue();
    await page.goto(`/vi/groups/${groupId}`);
    await expect(page.locator('text=Just enrolled in a new course!')).toBeVisible();
  });

  test('Group leaderboard sorting and filtering', async ({ page }) => {
    const user = generateTestUser();

    await registerUser(page, user, 'vi');
    if (page.url().includes('onboarding')) {
      await completeOnboarding(page);
    }

    await page.goto('/vi/groups');
    await page.click('[data-testid="group-card"]').first();
    await page.click('[data-testid="view-leaderboard"]');

    // Test sorting
    await page.click('[data-testid="sort-by-points"]');
    const points = await page.locator('[data-testid="member-points"]').allTextContents();
    const pointsNum = points.map(p => Number.parseInt(p.replace(/\D/g, '')));
    expect(pointsNum).toEqual([...pointsNum].sort((a, b) => b - a));

    // Test filtering by timeframe
    await page.click('[data-testid="filter-weekly"]');
    await expect(page.locator('[data-testid="leaderboard-period"]')).toContainText('Tuần');

    await page.click('[data-testid="filter-monthly"]');
    await expect(page.locator('[data-testid="leaderboard-period"]')).toContainText('Tháng');
  });

  test('WebSocket real-time notifications', async ({ browser }) => {
    test.setTimeout(90000);

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = generateTestUser();
    const user2 = generateTestUser();

    // Setup both users
    await registerUser(page1, user1, 'vi');
    if (page1.url().includes('onboarding')) {
      await completeOnboarding(page1);
    }

    await registerUser(page2, user2, 'vi');
    if (page2.url().includes('onboarding')) {
      await completeOnboarding(page2);
    }

    // User 1: Create group
    await page1.goto('/vi/groups');
    await page1.click('[data-testid="create-group-btn"]');
    await page1.fill('[data-testid="group-name"]', 'Live Test Group');
    await page1.click('[data-testid="submit-group"]');

    const groupId = await page1.locator('[data-testid="group-id"]').textContent();

    // User 2: Join and navigate to group page
    await page2.goto('/vi/groups');
    await page2.fill('[data-testid="search-group"]', 'Live Test Group');
    await page2.click('[data-testid="search-btn"]');
    await page2.click(`[data-testid="join-group-${groupId}"]`);
    await page2.goto(`/vi/groups/${groupId}`);

    // User 1: Send message
    await page1.goto(`/vi/groups/${groupId}`);
    await page1.fill('[data-testid="post-content"]', 'Real-time test message');
    await page1.click('[data-testid="submit-post"]');

    // User 2: Should receive notification without reload
    const notification = page2.locator('[data-testid="notification-badge"]');
    await expect(notification).toBeVisible({ timeout: 15000 });
    await expect(page2.locator('text=Real-time test message')).toBeVisible({ timeout: 10000 });

    await context1.close();
    await context2.close();
  });

  test('Private vs public group visibility', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = generateTestUser();
    const user2 = generateTestUser();

    // User 1: Create private group
    await registerUser(page1, user1, 'vi');
    if (page1.url().includes('onboarding')) {
      await completeOnboarding(page1);
    }

    await page1.goto('/vi/groups');
    await page1.click('[data-testid="create-group-btn"]');
    await page1.fill('[data-testid="group-name"]', 'Private Elite Group');
    await page1.click('[data-testid="privacy-private"]');
    await page1.click('[data-testid="submit-group"]');

    // User 2: Should NOT see private group in search
    await registerUser(page2, user2, 'vi');
    if (page2.url().includes('onboarding')) {
      await completeOnboarding(page2);
    }

    await page2.goto('/vi/groups');
    await page2.fill('[data-testid="search-group"]', 'Private Elite Group');
    await page2.click('[data-testid="search-btn"]');

    const searchResults = page2.locator('[data-testid="group-card"]');
    await expect(searchResults).toHaveCount(0);

    await context1.close();
    await context2.close();
  });
});
