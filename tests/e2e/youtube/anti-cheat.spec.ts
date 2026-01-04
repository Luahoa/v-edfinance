import { test, expect } from '@playwright/test';

const STAGING_API = process.env.API_URL || 'http://103.54.153.248:3001';
const TEST_USER_EMAIL = 'test-anticheat@vedfinance.com';
const TEST_USER_PASSWORD = 'Test123!@#';

test.describe('YouTube Anti-Cheat - VED-YT12', () => {
  let authToken: string;
  let testLessonId: string;
  let userId: string;

  test.beforeAll(async ({ request }) => {
    const loginResponse = await request.post(`${STAGING_API}/auth/login`, {
      data: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      },
    });

    const loginData = await loginResponse.json();
    authToken = loginData.accessToken;
    userId = loginData.user.id;

    const coursesResponse = await request.get(`${STAGING_API}/courses`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const courses = await coursesResponse.json();
    
    if (courses.length > 0 && courses[0].lessons && courses[0].lessons.length > 0) {
      testLessonId = courses[0].lessons[0].id;
    }
  });

  test('should accept legitimate 90% watch with valid logs', async ({ request }) => {
    const baseTime = Date.now();
    const watchLogs = Array.from({ length: 180 }, (_, i) => ({
      timestamp: baseTime + i * 1000,
      playedSeconds: i,
      played: i / 200,
      sessionId: 'test-session-valid',
      userId,
    }));

    const response = await request.post(`${STAGING_API}/courses/lessons/${testLessonId}/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        status: 'COMPLETED',
        durationSpent: 180,
        watchLogs,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('COMPLETED');
  });

  test('should reject seekTo() attack - forward jump', async ({ request }) => {
    const baseTime = Date.now();
    const watchLogs = [
      { timestamp: baseTime, playedSeconds: 0, played: 0, sessionId: 'attack-seek', userId },
      { timestamp: baseTime + 1000, playedSeconds: 1, played: 0.005, sessionId: 'attack-seek', userId },
      { timestamp: baseTime + 2000, playedSeconds: 180, played: 0.9, sessionId: 'attack-seek', userId },
    ];

    const response = await request.post(`${STAGING_API}/courses/lessons/${testLessonId}/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        status: 'COMPLETED',
        durationSpent: 180,
        watchLogs,
      },
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400);
    
    const error = await response.json();
    expect(error.message).toContain('validation failed');
  });

  test('should reject excessive jumps (>2)', async ({ request }) => {
    const baseTime = Date.now();
    const watchLogs = [
      { timestamp: baseTime, playedSeconds: 0, played: 0, sessionId: 'attack-jumps', userId },
      { timestamp: baseTime + 1000, playedSeconds: 50, played: 0.25, sessionId: 'attack-jumps', userId },
      { timestamp: baseTime + 2000, playedSeconds: 100, played: 0.5, sessionId: 'attack-jumps', userId },
      { timestamp: baseTime + 3000, playedSeconds: 150, played: 0.75, sessionId: 'attack-jumps', userId },
      { timestamp: baseTime + 4000, playedSeconds: 180, played: 0.9, sessionId: 'attack-jumps', userId },
    ];

    const response = await request.post(`${STAGING_API}/courses/lessons/${testLessonId}/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        status: 'COMPLETED',
        durationSpent: 180,
        watchLogs,
      },
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400);
  });

  test('should reject impossibly short session', async ({ request }) => {
    const baseTime = Date.now();
    const watchLogs = [
      { timestamp: baseTime, playedSeconds: 0, played: 0, sessionId: 'attack-time', userId },
      { timestamp: baseTime + 10000, playedSeconds: 180, played: 0.9, sessionId: 'attack-time', userId },
    ];

    const response = await request.post(`${STAGING_API}/courses/lessons/${testLessonId}/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        status: 'COMPLETED',
        durationSpent: 180,
        watchLogs,
      },
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400);
    
    const error = await response.json();
    expect(error.message).toContain('session_too_short');
  });

  test('should reject >3x speed manipulation', async ({ request }) => {
    const baseTime = Date.now();
    const watchLogs = Array.from({ length: 40 }, (_, i) => ({
      timestamp: baseTime + i * 1000,
      playedSeconds: i * 5,
      played: (i * 5) / 200,
      sessionId: 'attack-speed',
      userId,
    }));

    const response = await request.post(`${STAGING_API}/courses/lessons/${testLessonId}/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        status: 'COMPLETED',
        durationSpent: 180,
        watchLogs,
      },
    });

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400);
    
    const error = await response.json();
    expect(error.message).toContain('speed_anomalies');
  });

  test('should allow 2x speed (legitimate)', async ({ request }) => {
    const baseTime = Date.now();
    const watchLogs = Array.from({ length: 90 }, (_, i) => ({
      timestamp: baseTime + i * 1000,
      playedSeconds: i * 2,
      played: (i * 2) / 200,
      sessionId: 'valid-2x-speed',
      userId,
    }));

    const response = await request.post(`${STAGING_API}/courses/lessons/${testLessonId}/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        status: 'COMPLETED',
        durationSpent: 180,
        watchLogs,
      },
    });

    expect(response.ok()).toBeTruthy();
  });

  test('should handle pause/resume behavior', async ({ request }) => {
    const baseTime = Date.now();
    const watchLogs = [
      ...Array.from({ length: 60 }, (_, i) => ({
        timestamp: baseTime + i * 1000,
        playedSeconds: i,
        played: i / 200,
        sessionId: 'pause-resume',
        userId,
      })),
      ...Array.from({ length: 120 }, (_, i) => ({
        timestamp: baseTime + 90000 + i * 1000,
        playedSeconds: 60 + i,
        played: (60 + i) / 200,
        sessionId: 'pause-resume',
        userId,
      })),
    ];

    const response = await request.post(`${STAGING_API}/courses/lessons/${testLessonId}/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        status: 'COMPLETED',
        durationSpent: 180,
        watchLogs,
      },
    });

    expect(response.ok()).toBeTruthy();
  });

  test('should log cheat attempts in BehaviorLog', async ({ request }) => {
    const baseTime = Date.now();
    const watchLogs = [
      { timestamp: baseTime, playedSeconds: 0, played: 0, sessionId: 'cheat-log', userId },
      { timestamp: baseTime + 1000, playedSeconds: 180, played: 0.9, sessionId: 'cheat-log', userId },
    ];

    await request.post(`${STAGING_API}/courses/lessons/${testLessonId}/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        status: 'COMPLETED',
        durationSpent: 180,
        watchLogs,
      },
    });

    const logsResponse = await request.get(`${STAGING_API}/behavior/logs?userId=${userId}&limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (logsResponse.ok()) {
      const logs = await logsResponse.json();
      const cheatLog = logs.find((log: any) => log.eventType === 'CHEAT_ATTEMPT_DETECTED');
      expect(cheatLog).toBeDefined();
      expect(cheatLog.payload.suspiciousActivity).toBeDefined();
    }
  });

  test('should accept buffering delays (±5s tolerance)', async ({ request }) => {
    const baseTime = Date.now();
    const watchLogs = [
      { timestamp: baseTime, playedSeconds: 0, played: 0, sessionId: 'buffering', userId },
      { timestamp: baseTime + 1000, playedSeconds: 1, played: 0.005, sessionId: 'buffering', userId },
      { timestamp: baseTime + 8000, playedSeconds: 5, played: 0.025, sessionId: 'buffering', userId },
      ...Array.from({ length: 175 }, (_, i) => ({
        timestamp: baseTime + 8000 + (i + 1) * 1000,
        playedSeconds: 5 + i + 1,
        played: (5 + i + 1) / 200,
        sessionId: 'buffering',
        userId,
      })),
    ];

    const response = await request.post(`${STAGING_API}/courses/lessons/${testLessonId}/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        status: 'COMPLETED',
        durationSpent: 180,
        watchLogs,
      },
    });

    expect(response.ok()).toBeTruthy();
  });

  test('should allow up to 2 legitimate seeks', async ({ request }) => {
    const baseTime = Date.now();
    const watchLogs = [
      ...Array.from({ length: 60 }, (_, i) => ({
        timestamp: baseTime + i * 1000,
        playedSeconds: i,
        played: i / 200,
        sessionId: 'legit-seeks',
        userId,
      })),
      { timestamp: baseTime + 61000, playedSeconds: 100, played: 0.5, sessionId: 'legit-seeks', userId },
      ...Array.from({ length: 90 }, (_, i) => ({
        timestamp: baseTime + 62000 + i * 1000,
        playedSeconds: 100 + i,
        played: (100 + i) / 200,
        sessionId: 'legit-seeks',
        userId,
      })),
    ];

    const response = await request.post(`${STAGING_API}/courses/lessons/${testLessonId}/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        status: 'COMPLETED',
        durationSpent: 180,
        watchLogs,
      },
    });

    expect(response.ok()).toBeTruthy();
  });
});
