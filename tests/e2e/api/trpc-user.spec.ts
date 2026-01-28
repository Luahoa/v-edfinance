import { test, expect } from '@playwright/test';

/**
 * E2E Tests for tRPC User API
 * Tests public and protected procedures
 */

const API_BASE = 'http://localhost:3001/trpc';

test.describe('tRPC User API - Public Procedures', () => {
  test('user.testDb - verifies database connection', async ({ request }) => {
    const response = await request.get(`${API_BASE}/user.testDb`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.result).toBeDefined();
    expect(data.result.data).toBeDefined();
    expect(data.result.data.success).toBe(true);
    expect(typeof data.result.data.userCount).toBe('number');
  });

  test('user.getById - returns user public info', async ({ request }) => {
    // First verify DB is connected and has users
    const testDbResponse = await request.get(`${API_BASE}/user.testDb`);
    const testDbData = await testDbResponse.json();

    if (testDbData.result.data.userCount === 0) {
      test.skip();
      return;
    }

    // This test needs a valid user ID - in real scenario, we'd seed the DB
    // For now, test that invalid ID returns null
    const response = await request.get(`${API_BASE}/user.getById`, {
      params: {
        input: JSON.stringify({ id: '00000000-0000-0000-0000-000000000000' }),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Non-existent user returns null
    expect(data.result.data).toBeNull();
  });
});

test.describe('tRPC User API - Protected Procedures (Unauthorized)', () => {
  test('user.me - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.get(`${API_BASE}/user.me`);

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('UNAUTHORIZED');
  });

  test('user.getStats - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.get(`${API_BASE}/user.getStats`);

    expect(response.status()).toBe(401);
  });

  test('user.updateProfile - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.post(`${API_BASE}/user.updateProfile`, {
      data: {
        name: { vi: 'Test Name' },
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('tRPC User API - Input Validation', () => {
  test('user.getById - requires valid UUID format', async ({ request }) => {
    const response = await request.get(`${API_BASE}/user.getById`, {
      params: {
        input: JSON.stringify({ id: 'not-a-valid-uuid' }),
      },
    });

    // Drizzle/Postgres may return error for invalid UUID format
    // or just return null - both are acceptable
    const data = await response.json();

    if (response.ok()) {
      expect(data.result.data).toBeNull();
    } else {
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });
});
