import { describe, it, expect } from 'vitest';
import { TRPCError } from '@trpc/server';
import {
  createTestCaller,
  createAuthenticatedContext,
  createUnauthenticatedContext,
  createMockDb,
  vi,
} from './test-helpers';

describe('analyticsRouter', () => {
  describe('logEvent', () => {
    it('should create a behavior log entry', async () => {
      const mockLog = {
        id: 'log-1',
        userId: 'test-user-id',
        sessionId: 'session-123',
        path: '/dashboard',
        eventType: 'page_view',
        actionCategory: 'navigation',
        payload: { section: 'overview' },
      };

      const mockDb = createMockDb();
      const insertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockLog]),
      };
      mockDb.insert = vi.fn().mockReturnValue(insertChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.analytics.logEvent({
        action: 'page_view',
        module: '/dashboard',
      });

      expect(result.eventType).toBe('page_view');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createTestCaller(ctx);

      await expect(
        caller.analytics.logEvent({ action: 'click' })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent behavior logs', async () => {
      const mockLogs = [
        { id: 'log-1', eventType: 'page_view', timestamp: new Date() },
        { id: 'log-2', eventType: 'click', timestamp: new Date() },
      ];

      const mockDb = createMockDb();
      mockDb.query.behaviorLogs.findMany.mockResolvedValue(mockLogs);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.analytics.getRecentActivity({ limit: 10 });

      expect(result).toHaveLength(2);
      expect(mockDb.query.behaviorLogs.findMany).toHaveBeenCalled();
    });

    it('should use default limit when not provided', async () => {
      const mockDb = createMockDb();
      mockDb.query.behaviorLogs.findMany.mockResolvedValue([]);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      await caller.analytics.getRecentActivity();

      expect(mockDb.query.behaviorLogs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        })
      );
    });
  });

  describe('getLearningStats', () => {
    it('should return aggregated learning stats', async () => {
      const mockDb = createMockDb();
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { lessonsCompleted: 15, totalTimeSpent: 7200, lessonsStarted: 20 },
        ]),
      };
      mockDb.select = vi.fn().mockReturnValue(selectChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.analytics.getLearningStats();

      expect(result).toEqual({
        lessonsCompleted: 15,
        totalTimeSpent: 7200,
        lessonsStarted: 20,
      });
    });

    it('should return zero values when no data', async () => {
      const mockDb = createMockDb();
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { lessonsCompleted: 0, totalTimeSpent: 0, lessonsStarted: 0 },
        ]),
      };
      mockDb.select = vi.fn().mockReturnValue(selectChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.analytics.getLearningStats();

      expect(result.lessonsCompleted).toBe(0);
      expect(result.totalTimeSpent).toBe(0);
      expect(result.lessonsStarted).toBe(0);
    });
  });

  describe('getStreak', () => {
    it('should return current streak data', async () => {
      const mockStreak = {
        currentStreak: 7,
        longestStreak: 14,
        lastActivityDate: new Date('2025-01-27'),
      };

      const mockDb = createMockDb();
      mockDb.query.userStreaks.findFirst.mockResolvedValue(mockStreak);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.analytics.getStreak();

      expect(result.currentStreak).toBe(7);
      expect(result.longestStreak).toBe(14);
    });

    it('should return zeros when no streak exists', async () => {
      const mockDb = createMockDb();
      mockDb.query.userStreaks.findFirst.mockResolvedValue(null);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.analytics.getStreak();

      expect(result).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
      });
    });
  });

  describe('getTimeSpentPerLesson', () => {
    it('should return time spent per lesson', async () => {
      const mockData = [
        {
          lessonId: 'lesson-1',
          lessonTitle: { vi: 'Bài 1', en: 'Lesson 1' },
          courseTitle: { vi: 'Khóa 1', en: 'Course 1' },
          timeSpent: 1800,
          progressPercentage: 75,
        },
      ];

      const mockDb = createMockDb();
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockData),
      };
      mockDb.select = vi.fn().mockReturnValue(selectChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.analytics.getTimeSpentPerLesson({ limit: 10 });

      expect(result).toHaveLength(1);
      expect(result[0].timeSpent).toBe(1800);
      expect(result[0].lessonTitle).toBe('Bài 1');
    });
  });

  describe('getCompletionTrend', () => {
    it('should return completion trend data', async () => {
      const mockResults = [
        { date: '2025-01-25', completedCount: 2 },
        { date: '2025-01-27', completedCount: 3 },
      ];

      const mockDb = createMockDb();
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockResults),
      };
      mockDb.select = vi.fn().mockReturnValue(selectChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.analytics.getCompletionTrend({ days: 7 });

      expect(result).toHaveLength(7);
      expect(result.every((d) => typeof d.date === 'string')).toBe(true);
      expect(result.every((d) => typeof d.completed === 'number')).toBe(true);
    });

    it('should fill missing days with zero completions', async () => {
      const mockDb = createMockDb();
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };
      mockDb.select = vi.fn().mockReturnValue(selectChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.analytics.getCompletionTrend({ days: 7 });

      expect(result).toHaveLength(7);
      expect(result.every((d) => d.completed === 0)).toBe(true);
    });
  });

  describe('getEngagementSummary', () => {
    it('should return engagement summary with completion rate', async () => {
      const mockDb = createMockDb();
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { total: 20, completed: 15, totalTime: 36000, avgProgress: 75 },
        ]),
      };
      mockDb.select = vi.fn().mockReturnValue(selectChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.analytics.getEngagementSummary();

      expect(result.totalLessons).toBe(20);
      expect(result.completedLessons).toBe(15);
      expect(result.completionRate).toBe(75);
      expect(result.totalTimeMinutes).toBe(600);
      expect(result.avgProgress).toBe(75);
    });

    it('should handle zero total lessons', async () => {
      const mockDb = createMockDb();
      const selectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { total: 0, completed: 0, totalTime: 0, avgProgress: 0 },
        ]),
      };
      mockDb.select = vi.fn().mockReturnValue(selectChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.analytics.getEngagementSummary();

      expect(result.completionRate).toBe(0);
    });
  });
});
