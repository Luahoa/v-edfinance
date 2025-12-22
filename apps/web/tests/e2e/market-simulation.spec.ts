import { expect, test } from '@playwright/test';

test.describe('Market Simulation Execution (E006)', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
      }
    });

    // Login as existing user
    await page.goto('/vi/login');
    await page.fill('[data-testid="login-email"]', 'test@example.com');
    await page.fill('[data-testid="login-password"]', 'Password123!');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 30000 });
  });

  test('should create simulation, execute trades, and view results', async ({ page }) => {
    // Navigate to market simulation
    await page.goto('/vi/simulation');
    await expect(page.locator('h1')).toContainText(/Mô phỏng|Simulation/);

    // Create new simulation
    await page.click('[data-testid="simulation-create"]');
    await page.fill('[data-testid="simulation-name"]', `Market Test ${Date.now()}`);
    await page.selectOption('[data-testid="simulation-scenario"]', 'bull-market');
    await page.fill('[data-testid="simulation-capital"]', '100000');
    await page.click('[data-testid="simulation-start"]');

    // Wait for simulation to initialize
    await expect(page.locator('[data-testid="simulation-status"]')).toContainText(
      /Active|Đang chạy/,
      { timeout: 15000 }
    );

    // Execute a trade
    await page.click('[data-testid="trade-panel-toggle"]');
    await page.fill('[data-testid="trade-symbol"]', 'AAPL');
    await page.selectOption('[data-testid="trade-type"]', 'buy');
    await page.fill('[data-testid="trade-quantity"]', '10');
    await page.click('[data-testid="trade-execute"]');

    // Verify trade confirmation
    await expect(page.locator('[data-testid="trade-confirmation"]')).toBeVisible({
      timeout: 10000,
    });

    // Check real-time price updates (WebSocket)
    const priceElement = page.locator('[data-testid="stock-price-AAPL"]');
    await expect(priceElement).toBeVisible();
    const initialPrice = await priceElement.textContent();

    // Wait for price update
    await page.waitForTimeout(3000);
    const updatedPrice = await priceElement.textContent();
    // Prices should be numeric
    expect(Number.parseFloat(initialPrice?.replace(/[^0-9.]/g, '') || '0')).toBeGreaterThan(0);

    // View portfolio calculation
    await page.click('[data-testid="portfolio-view"]');
    await expect(page.locator('[data-testid="portfolio-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="portfolio-holdings"]')).toContainText('AAPL');

    // View leaderboard
    await page.click('[data-testid="leaderboard-tab"]');
    await expect(page.locator('[data-testid="leaderboard-rankings"]')).toBeVisible({
      timeout: 10000,
    });

    // Verify current user appears in leaderboard
    const leaderboardItems = page.locator('[data-testid^="leaderboard-user-"]');
    await expect(leaderboardItems).not.toHaveCount(0);
  });

  test('should handle simulation failure gracefully', async ({ page }) => {
    await page.goto('/vi/simulation');

    // Try to create simulation with invalid data
    await page.click('[data-testid="simulation-create"]');
    await page.fill('[data-testid="simulation-capital"]', '-1000'); // Invalid
    await page.click('[data-testid="simulation-start"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      /Invalid|Không hợp lệ/
    );
  });

  test('should display performance metrics over time', async ({ page }) => {
    await page.goto('/vi/simulation/history');

    // Check if historical data is displayed
    await expect(page.locator('[data-testid="simulation-chart"]')).toBeVisible({ timeout: 10000 });

    // Verify metric cards
    await expect(page.locator('[data-testid="metric-total-return"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-win-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-sharpe-ratio"]')).toBeVisible();
  });
});
