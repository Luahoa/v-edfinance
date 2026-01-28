import { test, expect } from '@playwright/test';

/**
 * E2E Tests for tRPC Gamification API
 * Tests leaderboard (public) and streak/achievements (protected)
 */

const API_BASE = 'http://localhost:3001/trpc';

test.describe('tRPC Gamification API - Public Procedures', () => {
  test('gamification.leaderboard - returns top users by points', async ({ request }) => {
    const response = await request.get(`${API_BASE}/gamification.leaderboard`, {
      params: {
        input: JSON.stringify({ limit: 10, period: 'all' }),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.result).toBeDefined();
    expect(data.result.data).toBeDefined();

    const users = data.result.data;
    expect(Array.isArray(users)).toBeTruthy();

    // If users exist, verify structure and ordering
    if (users.length > 0) {
      const user = users[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('points');

      // Verify descending order by points
      for (let i = 1; i < users.length; i++) {
        expect(users[i - 1].points).toBeGreaterThanOrEqual(users[i].points);
      }
    }
  });

  test('gamification.leaderboard - respects limit parameter', async ({ request }) => {
    const response = await request.get(`${API_BASE}/gamification.leaderboard`, {
      params: {
        input: JSON.stringify({ limit: 5 }),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const users = data.result.data;

    expect(users.length).toBeLessThanOrEqual(5);
  });

  test('gamification.leaderboard - handles period filter', async ({ request }) => {
    const periods = ['all', 'weekly', 'monthly'] as const;

    for (const period of periods) {
      const response = await request.get(`${API_BASE}/gamification.leaderboard`, {
        params: {
          input: JSON.stringify({ limit: 5, period }),
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data.result.data)).toBeTruthy();
    }
  });
});

test.describe('tRPC Gamification API - Protected Procedures (Unauthorized)', () => {
  test('gamification.getStreak - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.get(`${API_BASE}/gamification.getStreak`);

    expect(response.status()).toBe(401);
  });

  test('gamification.updateStreak - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.post(`${API_BASE}/gamification.updateStreak`);

    expect(response.status()).toBe(401);
  });

  test('gamification.getAchievements - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.get(`${API_BASE}/gamification.getAchievements`);

    expect(response.status()).toBe(401);
  });

  test('gamification.addPoints - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.post(`${API_BASE}/gamification.addPoints`, {
      data: {
        points: 100,
        reason: 'test',
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('tRPC Gamification API - Input Validation', () => {
  test('gamification.leaderboard - rejects limit over 100', async ({ request }) => {
    const response = await request.get(`${API_BASE}/gamification.leaderboard`, {
      params: {
        input: JSON.stringify({ limit: 200 }),
      },
    });

    expect(response.status()).toBe(400);
  });

  test('gamification.leaderboard - rejects invalid period', async ({ request }) => {
    const response = await request.get(`${API_BASE}/gamification.leaderboard`, {
      params: {
        input: JSON.stringify({ period: 'invalid' }),
      },
    });

    expect(response.status()).toBe(400);
  });
});
