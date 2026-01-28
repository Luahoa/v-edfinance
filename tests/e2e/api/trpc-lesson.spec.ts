import { test, expect } from '@playwright/test';

/**
 * E2E Tests for tRPC Lesson API
 * Tests public and protected lesson procedures
 */

const API_BASE = 'http://localhost:3001/trpc';

test.describe('tRPC Lesson API - Public Procedures', () => {
  test('lesson.getById - returns lesson with course info', async ({ request }) => {
    // First get a course to find its lessons
    const courseListResponse = await request.get(`${API_BASE}/course.list`, {
      params: {
        input: JSON.stringify({ limit: 1 }),
      },
    });

    const courseData = await courseListResponse.json();
    const courses = courseData.result.data;

    if (courses.length === 0) {
      test.skip();
      return;
    }

    // Get lessons for this course
    const lessonsResponse = await request.get(`${API_BASE}/lesson.getByCourse`, {
      params: {
        input: JSON.stringify({ courseId: courses[0].id }),
      },
    });

    const lessonsData = await lessonsResponse.json();
    const lessons = lessonsData.result.data;

    if (lessons.length === 0) {
      test.skip();
      return;
    }

    // Get lesson by ID
    const response = await request.get(`${API_BASE}/lesson.getById`, {
      params: {
        input: JSON.stringify({ id: lessons[0].id }),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const lesson = data.result.data;

    expect(lesson).not.toBeNull();
    expect(lesson).toHaveProperty('id');
    expect(lesson).toHaveProperty('title');
    expect(lesson).toHaveProperty('courseId');

    // Should include course relation
    if (lesson.course) {
      expect(lesson.course).toHaveProperty('id');
      expect(lesson.course).toHaveProperty('title');
    }
  });

  test('lesson.getById - returns null for non-existent ID', async ({ request }) => {
    const response = await request.get(`${API_BASE}/lesson.getById`, {
      params: {
        input: JSON.stringify({ id: '00000000-0000-0000-0000-000000000000' }),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.result.data).toBeNull();
  });

  test('lesson.getByCourse - returns ordered lessons', async ({ request }) => {
    // First get a course
    const courseListResponse = await request.get(`${API_BASE}/course.list`, {
      params: {
        input: JSON.stringify({ limit: 1 }),
      },
    });

    const courseData = await courseListResponse.json();
    const courses = courseData.result.data;

    if (courses.length === 0) {
      test.skip();
      return;
    }

    const response = await request.get(`${API_BASE}/lesson.getByCourse`, {
      params: {
        input: JSON.stringify({ courseId: courses[0].id }),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const lessons = data.result.data;

    expect(Array.isArray(lessons)).toBeTruthy();

    // All lessons should be published
    for (const lesson of lessons) {
      expect(lesson.published).toBe(true);
      expect(lesson.courseId).toBe(courses[0].id);
    }

    // Verify order is ascending
    for (let i = 1; i < lessons.length; i++) {
      expect(lessons[i - 1].order).toBeLessThanOrEqual(lessons[i].order);
    }
  });

  test('lesson.getByCourse - returns empty array for non-existent course', async ({ request }) => {
    const response = await request.get(`${API_BASE}/lesson.getByCourse`, {
      params: {
        input: JSON.stringify({ courseId: '00000000-0000-0000-0000-000000000000' }),
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.result.data).toEqual([]);
  });
});

test.describe('tRPC Lesson API - Protected Procedures (Unauthorized)', () => {
  test('lesson.getProgress - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.get(`${API_BASE}/lesson.getProgress`, {
      params: {
        input: JSON.stringify({ lessonId: '00000000-0000-0000-0000-000000000000' }),
      },
    });

    expect(response.status()).toBe(401);
  });

  test('lesson.markComplete - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.post(`${API_BASE}/lesson.markComplete`, {
      data: {
        lessonId: '00000000-0000-0000-0000-000000000000',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('lesson.updateWatchTime - returns UNAUTHORIZED without session', async ({ request }) => {
    const response = await request.post(`${API_BASE}/lesson.updateWatchTime`, {
      data: {
        lessonId: '00000000-0000-0000-0000-000000000000',
        durationSpent: 120,
        progressPercentage: 50,
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('tRPC Lesson API - Input Validation', () => {
  test('lesson.getById - requires valid UUID', async ({ request }) => {
    const response = await request.get(`${API_BASE}/lesson.getById`, {
      params: {
        input: JSON.stringify({ id: 'invalid-uuid' }),
      },
    });

    expect(response.status()).toBe(400);
  });

  test('lesson.getByCourse - requires valid UUID', async ({ request }) => {
    const response = await request.get(`${API_BASE}/lesson.getByCourse`, {
      params: {
        input: JSON.stringify({ courseId: 'not-a-uuid' }),
      },
    });

    expect(response.status()).toBe(400);
  });
});
