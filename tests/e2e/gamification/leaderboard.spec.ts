import { expect, test } from '@playwright/test';
import { loginAsUser } from '../../helpers/test-utils';

test.describe('E024: Gamification Leaderboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'test@example.com', 'password123');
  });

  test('Scenario 1: View global leaderboard', async ({ page }) => {
    await page.goto('/vi/leaderboard');
    
    // Verify leaderboard is displayed
    await expect(page.locator('[data-testid="leaderboard-container"]')).toBeVisible();
    
    // Check top 10 users are shown
    const leaderboardItems = page.locator('[data-testid="leaderboard-item"]');
    const count = await leaderboardItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(10);
    
    // Verify rank, username, and points are displayed
    const firstItem = leaderboardItems.first();
    await expect(firstItem.locator('[data-testid="user-rank"]')).toHaveText('1');
    await expect(firstItem.locator('[data-testid="user-name"]')).toBeVisible();
    await expect(firstItem.locator('[data-testid="user-points"]')).toBeVisible();
  });

  test('Scenario 2: Filter leaderboard by timeframe', async ({ page }) => {
    await page.goto('/vi/leaderboard');
    
    const timeframes = [
      { value: 'daily', label: 'Hôm nay' },
      { value: 'weekly', label: 'Tuần này' },
      { value: 'monthly', label: 'Tháng này' },
      { value: 'all-time', label: 'Mọi thời gian' },
    ];
    
    for (const timeframe of timeframes) {
      await page.selectOption('[data-testid="timeframe-filter"]', timeframe.value);
      
      // Wait for leaderboard to update
      await page.waitForTimeout(500);
      
      // Verify data reloaded
      await expect(page.locator('[data-testid="leaderboard-item"]').first()).toBeVisible();
      
      // Take screenshot for comparison
      await page.screenshot({ 
        path: `playwright-report/leaderboard-${timeframe.value}.png` 
      });
    }
  });

  test('Scenario 3: View own rank and highlight', async ({ page }) => {
    await page.goto('/vi/leaderboard');
    
    // Find current user's rank
    const currentUserItem = page.locator('[data-testid="leaderboard-item"][data-current-user="true"]');
    
    if (await currentUserItem.isVisible()) {
      // Verify highlighted
      await expect(currentUserItem).toHaveClass(/highlighted|current-user/);
      
      // Check rank display
      const rank = await currentUserItem.locator('[data-testid="user-rank"]').textContent();
      expect(rank).toBeTruthy();
      
      // Verify "You" label or similar
      await expect(
        currentUserItem.locator('text=Bạn').or(currentUserItem.locator('text=You'))
      ).toBeVisible();
    } else {
      // If not in top 10, check for "Your Rank" section
      await expect(page.locator('[data-testid="your-rank-section"]')).toBeVisible();
    }
  });

  test('Scenario 4: Click user profile from leaderboard', async ({ page }) => {
    await page.goto('/vi/leaderboard');
    
    // Click on a user in the leaderboard
    const firstUser = page.locator('[data-testid="leaderboard-item"]').first();
    const userName = await firstUser.locator('[data-testid="user-name"]').textContent();
    
    await firstUser.click();
    
    // Verify navigated to user profile
    await expect(page).toHaveURL(/\/profile\/|\/user\//);
    
    // Verify profile page shows user info
    if (userName) {
      await expect(page.locator(`text=${userName}`)).toBeVisible();
    }
    
    // Check profile stats
    await expect(page.locator('[data-testid="user-total-points"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-badges"]')).toBeVisible();
  });

  test('Scenario 5: Pagination through leaderboard', async ({ page }) => {
    await page.goto('/vi/leaderboard');
    
    // Check if pagination exists
    const paginationNext = page.locator('[data-testid="pagination-next"]');
    
    if (await paginationNext.isVisible()) {
      // Get first user on page 1
      const firstUserPage1 = await page
        .locator('[data-testid="leaderboard-item"]')
        .first()
        .locator('[data-testid="user-name"]')
        .textContent();
      
      // Go to page 2
      await paginationNext.click();
      await page.waitForTimeout(500);
      
      // Get first user on page 2
      const firstUserPage2 = await page
        .locator('[data-testid="leaderboard-item"]')
        .first()
        .locator('[data-testid="user-name"]')
        .textContent();
      
      // Users should be different
      expect(firstUserPage1).not.toBe(firstUserPage2);
      
      // Verify rank continuity (should be 11 on page 2)
      const rankPage2 = await page
        .locator('[data-testid="leaderboard-item"]')
        .first()
        .locator('[data-testid="user-rank"]')
        .textContent();
      
      expect(rankPage2).toBe('11');
    }
  });

  test('Scenario 6: Leaderboard ranking accuracy validation', async ({ page }) => {
    await page.goto('/vi/leaderboard');
    
    // Get all visible leaderboard items
    const items = page.locator('[data-testid="leaderboard-item"]');
    const count = await items.count();
    
    let previousPoints: number | null = null;
    
    // Verify descending order by points
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const pointsText = await item.locator('[data-testid="user-points"]').textContent();
      const points = pointsText ? parseInt(pointsText.replace(/[^\d]/g, ''), 10) : 0;
      
      if (previousPoints !== null) {
        expect(points).toBeLessThanOrEqual(previousPoints);
      }
      
      previousPoints = points;
      
      // Verify rank matches position
      const rank = await item.locator('[data-testid="user-rank"]').textContent();
      expect(rank).toBe((i + 1).toString());
    }
  });

  test('Scenario 7: Real-time leaderboard updates', async ({ page }) => {
    await page.goto('/vi/leaderboard');
    
    // Open in new tab to simulate another user
    const page2 = await page.context().newPage();
    await page2.goto('/vi/courses/1/lesson/1');
    
    // Complete an action that awards points
    await page2.click('[data-testid="complete-lesson-btn"]');
    await page2.waitForTimeout(1000);
    
    // Back to leaderboard - check for update indicator
    await page.reload();
    await page.waitForTimeout(500);
    
    // Verify leaderboard refreshed
    await expect(page.locator('[data-testid="leaderboard-container"]')).toBeVisible();
    
    await page2.close();
  });
});
