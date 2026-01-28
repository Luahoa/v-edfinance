import { test, expect } from '@playwright/test';

/**
 * E2E Tests for tRPC Course API
 * Tests public procedures that don't require authentication
 */

const API_BASE = 'http://localhost:3001/trpc';

test.describe('tRPC Course API - Public Procedures', () => {
  test('course.list - returns published courses', async ({ request }) => {
    const response = await request.get(`${API_BASE}/course.list`, {
      params: {
        input: JSON.stringify({ limit: 10, offset: 0 }),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // tRPC wraps result in { result: { data: ... } }
    expect(data.result).toBeDefined();
    expect(data.result.data).toBeDefined();

    // Should be an array
    const courses = data.result.data;
    expect(Array.isArray(courses)).toBeTruthy();

    // If courses exist, verify structure
    if (courses.length > 0) {
      const course = courses[0];
      expect(course).toHaveProperty('id');
      expect(course).toHaveProperty('slug');
      expect(course).toHaveProperty('title');
      expect(course).toHaveProperty('published', true);
    }
  });

  test('course.list - filters by level', async ({ request }) => {
    const response = await request.get(`${API_BASE}/course.list`, {
      params: {
        input: JSON.stringify({ level: 'BEGINNER', limit: 5 }),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const courses = data.result.data;

    // All returned courses should be BEGINNER level
    for (const course of courses) {
      expect(course.level).toBe('BEGINNER');
    }
  });

  test('course.list - respects pagination', async ({ request }) => {
    // First page
    const page1 = await request.get(`${API_BASE}/course.list`, {
      params: {
        input: JSON.stringify({ limit: 2, offset: 0 }),
      },
    });
    const data1 = await page1.json();
    const courses1 = data1.result.data;

    // Second page
    const page2 = await request.get(`${API_BASE}/course.list`, {
      params: {
        input: JSON.stringify({ limit: 2, offset: 2 }),
      },
    });
    const data2 = await page2.json();
    const courses2 = data2.result.data;

    // Pages should have different courses (if enough exist)
    if (courses1.length > 0 && courses2.length > 0) {
      expect(courses1[0].id).not.toBe(courses2[0].id);
    }
  });

  test('course.getBySlug - returns course with lessons', async ({ request }) => {
    // First get a course slug from list
    const listResponse = await request.get(`${API_BASE}/course.list`, {
      params: {
        input: JSON.stringify({ limit: 1 }),
      },
    });
    const listData = await listResponse.json();
    const courses = listData.result.data;

    if (courses.length === 0) {
      test.skip();
      return;
    }

    const slug = courses[0].slug;

    // Get course by slug
    const response = await request.get(`${API_BASE}/course.getBySlug`, {
      params: {
        input: JSON.stringify({ slug }),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const course = data.result.data;

    expect(course).not.toBeNull();
    expect(course.slug).toBe(slug);
    expect(course).toHaveProperty('title');
    expect(course).toHaveProperty('description');

    // Should include lessons relation
    if (course.lessons) {
      expect(Array.isArray(course.lessons)).toBeTruthy();
    }
  });

  test('course.getBySlug - returns null for non-existent slug', async ({ request }) => {
    const response = await request.get(`${API_BASE}/course.getBySlug`, {
      params: {
        input: JSON.stringify({ slug: 'non-existent-course-slug-12345' }),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Should return null for non-existent course
    expect(data.result.data).toBeNull();
  });
});

test.describe('tRPC Course API - Input Validation', () => {
  test('course.list - rejects invalid limit', async ({ request }) => {
    const response = await request.get(`${API_BASE}/course.list`, {
      params: {
        input: JSON.stringify({ limit: 100 }), // max is 50
      },
    });

    // Should return error for invalid input
    expect(response.status()).toBe(400);
  });

  test('course.list - rejects negative offset', async ({ request }) => {
    const response = await request.get(`${API_BASE}/course.list`, {
      params: {
        input: JSON.stringify({ offset: -1 }),
      },
    });

    expect(response.status()).toBe(400);
  });

  test('course.list - rejects invalid level enum', async ({ request }) => {
    const response = await request.get(`${API_BASE}/course.list`, {
      params: {
        input: JSON.stringify({ level: 'INVALID_LEVEL' }),
      },
    });

    expect(response.status()).toBe(400);
  });
});
