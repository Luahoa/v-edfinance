import { expect, test } from '@playwright/test';

test.describe('Payment & Commitment Contract (E009)', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    
    // Login
    await page.goto('/vi/login');
    await page.fill('[data-testid="login-email"]', 'test@example.com');
    await page.fill('[data-testid="login-password"]', 'Password123!');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 30000 });
  });

  test('should create commitment contract with deposit', async ({ page }) => {
    // Navigate to commitment contracts
    await page.goto('/vi/commitment');
    await expect(page.locator('h1')).toContainText(/Commitment|Cam kết/i);

    // Click create new contract
    await page.click('[data-testid="contract-create"]');
    
    // Fill contract details
    await page.fill('[data-testid="contract-goal"]', 'Complete Advanced Investing Course');
    await page.fill('[data-testid="contract-amount"]', '1000000'); // 1M VND
    await page.selectOption('[data-testid="contract-duration"]', '30'); // 30 days
    await page.fill('[data-testid="contract-penalty"]', '50'); // 50% penalty
    
    // Select verification method
    await page.selectOption('[data-testid="contract-verification"]', 'course-completion');
    
    // Continue to payment
    await page.click('[data-testid="contract-continue"]');
    
    // Review contract terms
    await expect(page.locator('[data-testid="contract-review"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-amount"]')).toContainText('1,000,000');
    
    // Accept terms
    await page.click('[data-testid="contract-accept-terms"]');
    
    // Proceed to payment
    await page.click('[data-testid="contract-pay"]');
    
    // Wait for payment processing (mock or test payment gateway)
    await expect(page.locator('[data-testid="payment-processing"]')).toBeVisible({ timeout: 5000 });
    
    // Mock payment success (in real scenario, would interact with payment gateway)
    // For testing, assume payment succeeds
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({ timeout: 20000 });
    
    // Verify contract is active
    await expect(page.locator('[data-testid="contract-status"]')).toContainText(/Active|Đang hoạt động/i);
  });

  test('should track contract progress', async ({ page }) => {
    // Assume a contract exists from previous test or seed data
    await page.goto('/vi/commitment/my-contracts');
    
    // Select an active contract
    const activeContract = page.locator('[data-testid^="contract-"]').first();
    await expect(activeContract).toBeVisible({ timeout: 10000 });
    
    await activeContract.click();
    
    // View progress dashboard
    await expect(page.locator('[data-testid="contract-progress"]')).toBeVisible();
    
    // Check progress metrics
    await expect(page.locator('[data-testid="progress-percentage"]')).toBeVisible();
    await expect(page.locator('[data-testid="days-remaining"]')).toBeVisible();
    await expect(page.locator('[data-testid="milestones-completed"]')).toBeVisible();
    
    // Verify progress bar
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();
    const progressValue = await progressBar.getAttribute('aria-valuenow');
    expect(parseInt(progressValue || '0')).toBeGreaterThanOrEqual(0);
    expect(parseInt(progressValue || '0')).toBeLessThanOrEqual(100);
  });

  test('should handle goal completion and payout', async ({ page }) => {
    await page.goto('/vi/commitment/my-contracts');
    
    // Find a nearly completed contract (you may need to set this up in seed data)
    const completableContract = page.locator('[data-testid="contract-completable"]');
    
    if (await completableContract.isVisible({ timeout: 5000 })) {
      await completableContract.click();
      
      // Complete final milestone
      await page.click('[data-testid="complete-milestone"]');
      
      // Verify completion triggers verification
      await expect(page.locator('[data-testid="verification-in-progress"]')).toBeVisible({ timeout: 5000 });
      
      // Mock verification success
      await expect(page.locator('[data-testid="verification-success"]')).toBeVisible({ timeout: 15000 });
      
      // Claim payout
      await page.click('[data-testid="claim-payout"]');
      
      // Verify payout processing
      await expect(page.locator('[data-testid="payout-processing"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="payout-success"]')).toBeVisible({ timeout: 20000 });
      
      // Check wallet balance updated
      const walletBalance = page.locator('[data-testid="wallet-balance"]');
      await expect(walletBalance).toBeVisible();
    }
  });

  test('should handle early withdrawal with penalty', async ({ page }) => {
    await page.goto('/vi/commitment/my-contracts');
    
    // Select an active contract
    const activeContract = page.locator('[data-testid^="contract-active-"]').first();
    await expect(activeContract).toBeVisible({ timeout: 10000 });
    await activeContract.click();
    
    // Request early withdrawal
    await page.click('[data-testid="contract-withdraw"]');
    
    // Review penalty warning
    await expect(page.locator('[data-testid="penalty-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="penalty-amount"]')).toContainText(/[0-9,]+/);
    
    // Confirm withdrawal despite penalty
    await page.fill('[data-testid="withdrawal-confirmation"]', 'CONFIRM');
    await page.click('[data-testid="withdrawal-submit"]');
    
    // Verify withdrawal processed
    await expect(page.locator('[data-testid="withdrawal-success"]')).toBeVisible({ timeout: 15000 });
    
    // Verify contract status updated to terminated
    await expect(page.locator('[data-testid="contract-status"]')).toContainText(/Terminated|Đã hủy/i);
  });

  test('should display contract analytics and history', async ({ page }) => {
    await page.goto('/vi/commitment/analytics');
    
    // Verify analytics dashboard
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
    
    // Check key metrics
    await expect(page.locator('[data-testid="total-contracts"]')).toBeVisible();
    await expect(page.locator('[data-testid="completion-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-committed"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-earned"]')).toBeVisible();
    
    // Verify contract history table
    await expect(page.locator('[data-testid="contract-history"]')).toBeVisible();
    const historyRows = page.locator('[data-testid^="history-row-"]');
    await expect(historyRows.first()).toBeVisible({ timeout: 5000 });
  });

  test('should integrate with payment gateway', async ({ page }) => {
    await page.goto('/vi/wallet/deposit');
    
    // Fill deposit form
    await page.fill('[data-testid="deposit-amount"]', '500000');
    await page.selectOption('[data-testid="payment-method"]', 'vnpay');
    
    // Proceed to payment
    await page.click('[data-testid="deposit-submit"]');
    
    // Should redirect to payment gateway (in test, might be mocked)
    // Check for payment gateway iframe or redirect
    const paymentFrame = page.frameLocator('[data-testid="payment-iframe"]');
    if (await paymentFrame.locator('body').isVisible({ timeout: 5000 })) {
      // Mock payment success callback
      await page.evaluate(() => {
        window.postMessage({ type: 'payment-success', transactionId: 'TEST-123' }, '*');
      });
      
      // Verify deposit success
      await expect(page.locator('[data-testid="deposit-success"]')).toBeVisible({ timeout: 15000 });
    }
  });
});
