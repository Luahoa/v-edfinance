import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      $queryRaw: vi.fn(),
      user: {
        count: vi.fn(),
        aggregate: vi.fn(),
      },
      behaviorLog: {
        count: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      userProgress: {
        count: vi.fn(),
      },
    };
    service = new AnalyticsService(mockPrisma);
  });

  describe('handleSystemHealthCheck', () => {
    it('should log health check and warn on high error rates', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([1]);
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.behaviorLog.count.mockResolvedValue(60); // High error rate
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.handleSystemHealthCheck();

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'HEALTH_CHECK',
            payload: expect.objectContaining({
              errorRateLastHour: 60,
            }),
          }),
        }),
      );
    });
  });

  describe('getUserLearningHabits', () => {
    it('should return habits based on logs', async () => {
      const mockLogs = [
        {
          timestamp: new Date('2025-12-20T10:00:00Z').toISOString(),
          eventType: 'LESSON_VIEW',
        },
        {
          timestamp: new Date('2025-12-20T10:30:00Z').toISOString(),
          eventType: 'LESSON_VIEW',
        },
        {
          timestamp: new Date('2025-12-20T14:00:00Z').toISOString(),
          eventType: 'QUIZ_START',
        },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getUserLearningHabits('u1');

      expect(result?.peakLearningHour).toBeDefined();
      expect(result?.topActivities).toContain('LESSON_VIEW');
    });

    it('should return null if no logs found', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      const result = await service.getUserLearningHabits('u1');
      expect(result).toBeNull();
    });
  });

  describe('getUserPersona', () => {
    it('should classify as HUNTER for risk-taking behavior', async () => {
      const mockLogs = Array(10).fill({ eventType: 'TRADE_BUY' });
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getUserPersona('u1');
      expect(result).toBe('HUNTER');
    });

    it('should classify as SAVER for commitment-focused behavior', async () => {
      const mockLogs = Array(10).fill({ eventType: 'COMMITMENT_CREATED' });
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getUserPersona('u1');
      expect(result).toBe('SAVER');
    });
  });

  describe('handleLogAggregation', () => {
    it('should aggregate logs from yesterday by user and eventType', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const mockLogs = [
        { userId: 'u1', eventType: 'LESSON_VIEW', timestamp: yesterday },
        { userId: 'u1', eventType: 'LESSON_VIEW', timestamp: yesterday },
        { userId: 'u2', eventType: 'QUIZ_START', timestamp: yesterday },
      ];

      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.behaviorLog.deleteMany.mockResolvedValue({ count: 0 });

      await service.handleLogAggregation();

      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            timestamp: expect.objectContaining({
              gte: expect.any(Date),
              lt: expect.any(Date),
            }),
          },
        }),
      );
    });

    it('should handle empty log set gracefully', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.behaviorLog.deleteMany.mockResolvedValue({ count: 0 });

      await service.handleLogAggregation();

      // When empty, the function returns early - no deleteMany call
      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalled();
    });

    it('should delete logs older than 30 days', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const mockLogs = [
        { userId: 'u1', eventType: 'TEST', timestamp: yesterday },
      ];

      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.behaviorLog.deleteMany.mockResolvedValue({ count: 15 });

      await service.handleLogAggregation();

      expect(mockPrisma.behaviorLog.deleteMany).toHaveBeenCalled();
      const callArgs = mockPrisma.behaviorLog.deleteMany.mock.calls[0][0];
      expect(callArgs.where.timestamp.lt).toBeDefined();
    });

    it('should handle aggregation errors gracefully', async () => {
      mockPrisma.behaviorLog.findMany.mockRejectedValue(new Error('DB Error'));
      mockPrisma.behaviorLog.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.handleLogAggregation()).resolves.not.toThrow();
    });
  });

  describe('getGlobalSystemStats', () => {
    it('should return aggregated system statistics', async () => {
      mockPrisma.user.count.mockResolvedValue(150);
      mockPrisma.userProgress.count.mockResolvedValue(500);
      mockPrisma.user.aggregate.mockResolvedValue({ _sum: { points: 25000 } });

      const result = await service.getGlobalSystemStats();

      expect(result.totalUsers).toBe(150);
      expect(result.completedLessons).toBe(500);
      expect(result.distributedPoints).toBe(25000);
    });

    it('should handle null points sum gracefully', async () => {
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.userProgress.count.mockResolvedValue(0);
      mockPrisma.user.aggregate.mockResolvedValue({ _sum: { points: null } });

      const result = await service.getGlobalSystemStats();

      expect(result.distributedPoints).toBe(0);
    });
  });

  describe('Date Range Validation', () => {
    it('should correctly calculate 1-hour time window for health check', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([1]);
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.behaviorLog.count.mockResolvedValue(10);
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.handleSystemHealthCheck();

      const countCall = mockPrisma.behaviorLog.count.mock.calls[0][0];
      const timeDiff =
        new Date().getTime() - countCall.where.timestamp.gte.getTime();
      expect(timeDiff).toBeGreaterThanOrEqual(60 * 60 * 1000 - 1000);
      expect(timeDiff).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);
    });

    it('should handle date boundary edge cases in aggregation', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const edgeCaseLogs = [
        {
          userId: 'u1',
          eventType: 'TEST',
          timestamp: new Date(yesterday.getTime() + 1),
        },
        {
          userId: 'u1',
          eventType: 'TEST',
          timestamp: new Date(yesterday.getTime() + 86399999),
        },
      ];

      mockPrisma.behaviorLog.findMany.mockResolvedValue(edgeCaseLogs);
      mockPrisma.behaviorLog.deleteMany.mockResolvedValue({ count: 0 });

      await service.handleLogAggregation();

      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalled();
    });
  });

  describe('Real-Time Metrics Updates', () => {
    it('should track error rate spikes in real-time', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([1]);
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.behaviorLog.count.mockResolvedValue(75);
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.handleSystemHealthCheck();

      const createCall = mockPrisma.behaviorLog.create.mock.calls[0][0];
      expect(createCall.data.payload.errorRateLastHour).toBe(75);
    });

    it('should update health metrics every hour', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([1]);
      mockPrisma.user.count.mockResolvedValue(200);
      mockPrisma.behaviorLog.count.mockResolvedValue(5);
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      await service.handleSystemHealthCheck();

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'HEALTH_CHECK',
            payload: expect.objectContaining({
              dbStatus: 'OK',
              userCount: 200,
            }),
          }),
        }),
      );
    });
  });

  describe('Behavior Log Archiving', () => {
    it('should archive logs in batches based on age threshold', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const mockLogs = [
        { userId: 'u1', eventType: 'OLD_EVENT', timestamp: yesterday },
      ];

      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.behaviorLog.deleteMany.mockResolvedValue({ count: 100 });

      await service.handleLogAggregation();

      expect(mockPrisma.behaviorLog.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            timestamp: {
              lt: expect.any(Date),
            },
          },
        }),
      );
    });

    it('should preserve recent logs during archiving', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const mockLogs = [
        { userId: 'u1', eventType: 'TEST', timestamp: yesterday },
      ];

      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.behaviorLog.deleteMany.mockResolvedValue({ count: 0 });

      await service.handleLogAggregation();

      const deleteCall = mockPrisma.behaviorLog.deleteMany.mock.calls[0][0];
      const threshold = deleteCall.where.timestamp.lt;
      const daysSinceThreshold =
        (new Date().getTime() - threshold.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysSinceThreshold).toBeGreaterThanOrEqual(29);
      expect(daysSinceThreshold).toBeLessThanOrEqual(31);
    });
  });
});
