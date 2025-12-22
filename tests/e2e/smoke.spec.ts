/**
 * E2E Smoke Tests - Quick health check before full suite
 *
 * Purpose: Verify critical paths work before running expensive tests
 * Duration: <30s total
 */

import { expect, test } from '@playwright/test';

test.describe('Smoke Tests - Critical Paths', () => {
  test.setTimeout(30000);

  test('SMOKE-001: Homepage loads successfully', async ({ page }) => {
    await page.goto('/vi');

    // Check page loads
    await expect(page).toHaveURL(/\/vi/);

    // Check critical elements exist
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    console.log('✅ Homepage loaded');
  });

  test('SMOKE-002: API health check responds', async ({ request }) => {
    const response = await request.get('http://localhost:3001');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain('Hello');

    console.log('✅ API responding');
  });

  test('SMOKE-003: Register page loads', async ({ page }) => {
    await page.goto('/vi/register');

    await expect(page).toHaveURL(/\/vi\/register/);

    // Check form exists (any form element)
    const formExists = await page.locator('form, input[type="email"]').count();
    expect(formExists).toBeGreaterThan(0);

    console.log('✅ Register page accessible');
  });

  test('SMOKE-004: Login page loads', async ({ page }) => {
    await page.goto('/vi/login');

    await expect(page).toHaveURL(/\/vi\/login/);

    // Check login form exists
    const hasEmailInput = await page.locator('input[type="email"]').count();
    expect(hasEmailInput).toBeGreaterThan(0);

    console.log('✅ Login page accessible');
  });

  test('SMOKE-005: Courses page loads', async ({ page }) => {
    await page.goto('/vi/courses');

    await expect(page).toHaveURL(/\/vi\/courses/);

    // Page loaded successfully
    const bodyExists = await page.locator('body').count();
    expect(bodyExists).toBe(1);

    console.log('✅ Courses page accessible');
  });
});
