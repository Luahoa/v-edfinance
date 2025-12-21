import { expect, test } from '@playwright/test';
import { loginAsUser } from '../../helpers/test-utils';
import fs from 'fs/promises';
import path from 'path';

test.describe('E023: Data Export & Import E2E (GDPR Compliance)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, 'test@example.com', 'password123');
  });

  test('Scenario 1: Export user data as JSON', async ({ page }) => {
    await page.goto('/vi/settings/privacy');
    
    // Navigate to data export section
    await page.click('[data-testid="data-export-tab"]');
    
    // Request JSON export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-json-btn"]'),
    ]);
    
    // Verify download started
    expect(download.suggestedFilename()).toContain('.json');
    
    // Save and validate file
    const downloadPath = await download.path();
    if (downloadPath) {
      const content = await fs.readFile(downloadPath, 'utf-8');
      const data = JSON.parse(content);
      
      // Validate structure
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('enrollments');
      expect(data).toHaveProperty('transactions');
      expect(data.user).toHaveProperty('email');
      expect(data.user.email).toBe('test@example.com');
    }
  });

  test('Scenario 2: Export user data as CSV', async ({ page }) => {
    await page.goto('/vi/settings/privacy');
    await page.click('[data-testid="data-export-tab"]');
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-csv-btn"]'),
    ]);
    
    expect(download.suggestedFilename()).toContain('.csv');
    
    const downloadPath = await download.path();
    if (downloadPath) {
      const content = await fs.readFile(downloadPath, 'utf-8');
      
      // Validate CSV headers
      const lines = content.split('\n');
      expect(lines[0]).toContain('email');
      expect(lines[0]).toContain('name');
      expect(lines.length).toBeGreaterThan(1);
    }
  });

  test('Scenario 3: Import previously exported data', async ({ page }) => {
    // First export data
    await page.goto('/vi/settings/privacy');
    await page.click('[data-testid="data-export-tab"]');
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-json-btn"]'),
    ]);
    
    const exportPath = await download.path();
    
    // Now test import
    await page.goto('/vi/admin/data-import'); // Admin route
    
    // Upload file
    const fileInput = page.locator('[data-testid="import-file-input"]');
    if (exportPath) {
      await fileInput.setInputFiles(exportPath);
    }
    
    // Select import type
    await page.selectOption('[data-testid="import-type-select"]', 'user-data');
    
    // Start import
    await page.click('[data-testid="start-import-btn"]');
    
    // Wait for success message
    await expect(
      page.locator('text=Import successful').or(page.locator('text=Nhập dữ liệu thành công'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('Scenario 4: Validate exported data completeness', async ({ page }) => {
    await page.goto('/vi/settings/privacy');
    await page.click('[data-testid="data-export-tab"]');
    
    // Check export options
    await expect(page.locator('[data-testid="export-profile-checkbox"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-courses-checkbox"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-transactions-checkbox"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-progress-checkbox"]')).toBeVisible();
    
    // Select all options
    await page.check('[data-testid="export-profile-checkbox"]');
    await page.check('[data-testid="export-courses-checkbox"]');
    await page.check('[data-testid="export-transactions-checkbox"]');
    await page.check('[data-testid="export-progress-checkbox"]');
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-json-btn"]'),
    ]);
    
    const downloadPath = await download.path();
    if (downloadPath) {
      const content = await fs.readFile(downloadPath, 'utf-8');
      const data = JSON.parse(content);
      
      // Validate all sections present
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('enrollments');
      expect(data).toHaveProperty('transactions');
      expect(data).toHaveProperty('progress');
    }
  });

  test('Scenario 5: GDPR - Request account deletion with data export', async ({ page }) => {
    await page.goto('/vi/settings/privacy');
    
    // Navigate to account deletion
    await page.click('[data-testid="delete-account-tab"]');
    
    // Export data before deletion
    await page.check('[data-testid="export-before-delete-checkbox"]');
    
    // Initiate deletion
    await page.click('[data-testid="request-deletion-btn"]');
    
    // Confirm dialog
    await expect(page.locator('[data-testid="confirm-deletion-dialog"]')).toBeVisible();
    
    // Verify warning message
    await expect(
      page.locator('text=This action cannot be undone').or(
        page.locator('text=Hành động này không thể hoàn tác')
      )
    ).toBeVisible();
    
    // Cancel to avoid actual deletion
    await page.click('[data-testid="cancel-deletion-btn"]');
  });

  test('Scenario 6: Data portability - Export in multiple formats', async ({ page }) => {
    await page.goto('/vi/settings/privacy');
    await page.click('[data-testid="data-export-tab"]');
    
    const formats = [
      { id: 'export-json-btn', extension: '.json' },
      { id: 'export-csv-btn', extension: '.csv' },
      { id: 'export-xml-btn', extension: '.xml' },
    ];
    
    for (const format of formats) {
      const exportBtn = page.locator(`[data-testid="${format.id}"]`);
      if (await exportBtn.isVisible()) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          exportBtn.click(),
        ]);
        
        expect(download.suggestedFilename()).toContain(format.extension);
        await page.waitForTimeout(500);
      }
    }
  });
});
