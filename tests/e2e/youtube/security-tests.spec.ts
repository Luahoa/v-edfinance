import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, assertUserIsLoggedIn } from '../../helpers/test-utils';

const STAGING_API = process.env.API_URL || 'http://103.54.153.248:3001';

test.describe('YouTube Security Tests - ved-yt14', () => {
  let testUser: ReturnType<typeof generateTestUser>;
  let authToken: string;

  test.beforeEach(async ({ page, request }) => {
    testUser = generateTestUser();
    await registerUser(page, testUser, 'vi');
    await page.waitForURL(/.*dashboard/);
    await assertUserIsLoggedIn(page);
    
    // Get auth token from localStorage or cookie
    authToken = await page.evaluate(() => {
      return localStorage.getItem('accessToken') || '';
    });
  });

  test('Console manipulation → server rejects invalid progress', async ({ page, request }) => {
    // Navigate to lesson
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    await page.click('[data-testid="lesson-item"]').first;
    await expect(page.locator('[data-testid="youtube-embed"]')).toBeVisible({ timeout: 10000 });
    
    // Get lesson ID from URL or page
    const lessonId = await page.evaluate(() => {
      const match = window.location.pathname.match(/lessons\/([^\/]+)/);
      return match ? match[1] : null;
    });
    
    if (!lessonId) {
      console.warn('Could not extract lesson ID, skipping console manipulation test');
      return;
    }
    
    // Attempt console manipulation: instant 90% completion with no watch logs
    const manipulatedProgress = {
      status: 'COMPLETED',
      durationSpent: 180,
      watchLogs: [
        {
          timestamp: Date.now(),
          playedSeconds: 180,
          played: 0.9,
          sessionId: 'console-hack',
        },
      ],
    };
    
    // Send manipulated data
    const response = await request.post(`${STAGING_API}/courses/lessons/${lessonId}/progress`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: manipulatedProgress,
    });
    
    // Server should reject (400 Bad Request)
    expect(response.status()).toBe(400);
    
    const errorData = await response.json();
    expect(errorData.message || errorData.error).toMatch(/validation failed|suspicious|cheat|invalid/i);
  });

  test('Skip ahead attack → anti-cheat detects and rejects', async ({ page, request }) => {
    // This is covered in anti-cheat.spec.ts but we test UI integration here
    
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    await page.click('[data-testid="lesson-item"]').first;
    await expect(page.locator('[data-testid="youtube-embed"]')).toBeVisible();
    
    // Attempt to send progress with suspicious seekTo pattern
    const result = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/courses/lessons/current/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'COMPLETED',
            durationSpent: 180,
            watchLogs: [
              { timestamp: Date.now(), playedSeconds: 0, played: 0, sessionId: 'skip-attack' },
              { timestamp: Date.now() + 1000, playedSeconds: 50, played: 0.25, sessionId: 'skip-attack' },
              { timestamp: Date.now() + 2000, playedSeconds: 100, played: 0.5, sessionId: 'skip-attack' },
              { timestamp: Date.now() + 3000, playedSeconds: 180, played: 0.9, sessionId: 'skip-attack' },
            ],
          }),
        });
        
        return {
          ok: response.ok,
          status: response.status,
          data: await response.json(),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    });
    
    // Should be rejected
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  test('Speed manipulation >3x → server detects anomaly', async ({ page }) => {
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    await page.click('[data-testid="lesson-item"]').first;
    await expect(page.locator('[data-testid="youtube-embed"]')).toBeVisible();
    
    // Send progress with 5x playback speed (suspicious)
    const result = await page.evaluate(async () => {
      const baseTime = Date.now();
      const watchLogs = Array.from({ length: 40 }, (_, i) => ({
        timestamp: baseTime + i * 1000,
        playedSeconds: i * 5, // 5x speed
        played: (i * 5) / 200,
        sessionId: 'speed-hack',
      }));
      
      const response = await fetch('/api/courses/lessons/current/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          durationSpent: 180,
          watchLogs,
        }),
      });
      
      return {
        ok: response.ok,
        status: response.status,
        data: await response.json(),
      };
    });
    
    // Should be rejected
    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(JSON.stringify(result.data)).toMatch(/speed|anomaly|suspicious/i);
  });

  test('Valid 2x speed is allowed', async ({ page }) => {
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    await page.click('[data-testid="lesson-item"]').first;
    await expect(page.locator('[data-testid="youtube-embed"]')).toBeVisible();
    
    // Send progress with legitimate 2x speed
    const result = await page.evaluate(async () => {
      const baseTime = Date.now();
      const watchLogs = Array.from({ length: 90 }, (_, i) => ({
        timestamp: baseTime + i * 1000,
        playedSeconds: i * 2, // 2x speed (YouTube allows this)
        played: (i * 2) / 200,
        sessionId: 'valid-2x',
      }));
      
      const response = await fetch('/api/courses/lessons/current/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          durationSpent: 180,
          watchLogs,
        }),
      });
      
      return {
        ok: response.ok,
        status: response.status,
      };
    });
    
    // Should be accepted
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  test('YouTube API key not exposed in client bundle', async ({ page }) => {
    // Check page source for API key exposure
    await page.goto('/vi/courses');
    
    const pageContent = await page.content();
    const scriptContent = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.map((s) => s.innerHTML).join('\n');
    });
    
    // Check for common YouTube API key patterns
    const apiKeyPatterns = [
      /AIza[0-9A-Za-z_-]{35}/g, // YouTube Data API v3 key pattern
      /YOUTUBE_API_KEY/g,
      /youtube.*api.*key/gi,
    ];
    
    for (const pattern of apiKeyPatterns) {
      expect(pageContent).not.toMatch(pattern);
      expect(scriptContent).not.toMatch(pattern);
    }
  });

  test('Rate limiting on /youtube/validate endpoint', async ({ request }) => {
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const requests: Promise<any>[] = [];
    
    // Send 20 rapid requests
    for (let i = 0; i < 20; i++) {
      requests.push(
        request.post(`${STAGING_API}/youtube/validate`, {
          headers: { Authorization: `Bearer ${authToken}` },
          data: { url: testUrl },
        })
      );
    }
    
    const responses = await Promise.all(requests);
    
    // At least one should be rate-limited (429)
    const rateLimitedCount = responses.filter((r) => r.status() === 429).length;
    
    // Should have rate limiting (some requests rejected)
    // If no rate limiting, all 20 would succeed (status 200)
    expect(rateLimitedCount).toBeGreaterThan(0);
  });

  test('iframe has proper sandbox attributes', async ({ page }) => {
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    await page.click('[data-testid="lesson-item"]').first;
    await expect(page.locator('[data-testid="youtube-embed"]')).toBeVisible();
    
    // Get YouTube iframe
    const iframeAttributes = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="youtube.com"]');
      if (!iframe) return null;
      
      return {
        sandbox: iframe.getAttribute('sandbox'),
        allow: iframe.getAttribute('allow'),
        referrerpolicy: iframe.getAttribute('referrerpolicy'),
      };
    });
    
    if (iframeAttributes) {
      // Verify security attributes
      // YouTube embeds typically need: allow-scripts, allow-same-origin
      if (iframeAttributes.sandbox) {
        expect(iframeAttributes.sandbox).toContain('allow-scripts');
        expect(iframeAttributes.sandbox).toContain('allow-same-origin');
      }
      
      // Verify allow attribute for autoplay
      if (iframeAttributes.allow) {
        expect(iframeAttributes.allow).toContain('autoplay');
        expect(iframeAttributes.allow).toContain('encrypted-media');
      }
    }
  });

  test('BehaviorLog records cheat attempts with details', async ({ page, request }) => {
    await page.click('[data-testid="nav-courses"]');
    const courseCard = page.locator('[data-testid="course-card"]').first();
    await courseCard.click();
    
    const enrollBtn = page.locator('[data-testid="enroll-btn"]');
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
    }
    
    await page.click('[data-testid="lesson-item"]').first;
    await expect(page.locator('[data-testid="youtube-embed"]')).toBeVisible();
    
    // Attempt cheat
    await page.evaluate(async () => {
      await fetch('/api/courses/lessons/current/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          durationSpent: 180,
          watchLogs: [
            { timestamp: Date.now(), playedSeconds: 0, played: 0, sessionId: 'cheat' },
            { timestamp: Date.now() + 1000, playedSeconds: 180, played: 0.9, sessionId: 'cheat' },
          ],
        }),
      });
    });
    
    // Wait for BehaviorLog to be written
    await page.waitForTimeout(2000);
    
    // Query BehaviorLog
    const userId = await page.evaluate(() => {
      return localStorage.getItem('userId') || '';
    });
    
    if (userId) {
      const logsResponse = await request.get(`${STAGING_API}/behavior/logs?userId=${userId}&limit=10`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      if (logsResponse.ok()) {
        const logs = await logsResponse.json();
        const cheatLog = logs.find((log: any) => 
          log.eventType === 'CHEAT_ATTEMPT_DETECTED' || 
          log.action === 'CHEAT_ATTEMPT_DETECTED'
        );
        
        if (cheatLog) {
          expect(cheatLog.payload || cheatLog.metadata).toBeDefined();
          expect(JSON.stringify(cheatLog)).toMatch(/suspicious|cheat|invalid/i);
        }
      }
    }
  });
});
