import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      behaviorLog: {
        findMany: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
      },
    };
    service = new MetricsService(mockPrisma);
  });

  describe('calculateDAU', () => {
    it('should calculate daily active users correctly', async () => {
      const mockLogs = [
        { timestamp: new Date('2025-12-20T10:00:00Z'), userId: 'u1' },
        { timestamp: new Date('2025-12-20T14:00:00Z'), userId: 'u1' },
        { timestamp: new Date('2025-12-20T15:00:00Z'), userId: 'u2' },
        { timestamp: new Date('2025-12-21T10:00:00Z'), userId: 'u1' },
        { timestamp: new Date('2025-12-21T11:00:00Z'), userId: 'u3' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.calculateDAU(
        new Date('2025-12-20'),
        new Date('2025-12-21'),
      );

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(2); // u1, u2 on Dec 20
      expect(result[1].value).toBe(2); // u1, u3 on Dec 21
      expect(result[0].date.toISOString()).toContain('2025-12-20');
      expect(result[1].date.toISOString()).toContain('2025-12-21');
    });

    it('should handle empty logs', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.calculateDAU(
        new Date('2025-12-20'),
        new Date('2025-12-21'),
      );

      expect(result).toHaveLength(0);
    });

    it('should deduplicate users within the same day', async () => {
      const mockLogs = [
        { timestamp: new Date('2025-12-20T10:00:00Z'), userId: 'u1' },
        { timestamp: new Date('2025-12-20T11:00:00Z'), userId: 'u1' },
        { timestamp: new Date('2025-12-20T12:00:00Z'), userId: 'u1' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.calculateDAU(
        new Date('2025-12-20'),
        new Date('2025-12-20'),
      );

      expect(result[0].value).toBe(1);
    });

    it('should filter out null userId entries', async () => {
      const mockLogs = [
        { timestamp: new Date('2025-12-20T10:00:00Z'), userId: 'u1' },
        { timestamp: new Date('2025-12-20T11:00:00Z'), userId: null },
        { timestamp: new Date('2025-12-20T12:00:00Z'), userId: 'u2' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.calculateDAU(
        new Date('2025-12-20'),
        new Date('2025-12-20'),
      );

      expect(result[0].value).toBe(2);
    });
  });

  describe('calculateWAU', () => {
    it('should calculate weekly active users', async () => {
      const mockUsers = [{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockUsers);

      const result = await service.calculateWAU(
        new Date('2025-12-15'),
        new Date('2025-12-21'),
      );

      expect(result).toBe(3);
      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      });
    });

    it('should return 0 for no active users', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.calculateWAU(
        new Date('2025-12-15'),
        new Date('2025-12-21'),
      );

      expect(result).toBe(0);
    });
  });

  describe('calculateMAU', () => {
    it('should calculate monthly active users for December 2025', async () => {
      const mockUsers = [
        { userId: 'u1' },
        { userId: 'u2' },
        { userId: 'u3' },
        { userId: 'u4' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockUsers);

      const result = await service.calculateMAU(2025, 12);

      expect(result).toBe(4);
      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: expect.objectContaining({
              gte: new Date(2025, 11, 1),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should handle edge case of February', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([{ userId: 'u1' }]);

      const result = await service.calculateMAU(2025, 2);

      expect(result).toBe(1);
    });
  });

  describe('calculateRetention', () => {
    it('should calculate cohort retention correctly', async () => {
      const cohortDate = new Date('2025-12-01');
      const mockUsers = [
        { id: 'u1', createdAt: new Date('2025-12-01T08:00:00Z') },
        { id: 'u2', createdAt: new Date('2025-12-01T10:00:00Z') },
        { id: 'u3', createdAt: new Date('2025-12-01T14:00:00Z') },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      // Day 1: u1, u2 active
      // Day 2: u1, u3 active
      // Day 3: u1 active
      mockPrisma.behaviorLog.findMany
        .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }])
        .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u3' }])
        .mockResolvedValueOnce([{ userId: 'u1' }]);

      const result = await service.calculateRetention(cohortDate, 3);

      expect(result.totalUsers).toBe(3);
      expect(result.retainedUsers[1]).toBe(2);
      expect(result.retainedUsers[2]).toBe(2);
      expect(result.retainedUsers[3]).toBe(1);
      expect(result.cohortDate).toEqual(cohortDate);
    });

    it('should handle zero retention', async () => {
      const cohortDate = new Date('2025-12-01');
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1', createdAt: new Date('2025-12-01T08:00:00Z') },
      ]);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.calculateRetention(cohortDate, 2);

      expect(result.totalUsers).toBe(1);
      expect(result.retainedUsers[1]).toBe(0);
      expect(result.retainedUsers[2]).toBe(0);
    });

    it('should handle empty cohort', async () => {
      const cohortDate = new Date('2025-12-01');
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.calculateRetention(cohortDate, 3);

      expect(result.totalUsers).toBe(0);
      expect(result.retainedUsers).toEqual({});
    });
  });

  describe('calculateEngagement', () => {
    it('should calculate engagement metrics correctly', async () => {
      const mockLogs = [
        // Session 1: u1, 3 events, 120 seconds
        {
          sessionId: 's1',
          userId: 'u1',
          timestamp: new Date('2025-12-20T10:00:00Z'),
        },
        {
          sessionId: 's1',
          userId: 'u1',
          timestamp: new Date('2025-12-20T10:01:00Z'),
        },
        {
          sessionId: 's1',
          userId: 'u1',
          timestamp: new Date('2025-12-20T10:02:00Z'),
        },
        // Session 2: u2, 1 event (bounce)
        {
          sessionId: 's2',
          userId: 'u2',
          timestamp: new Date('2025-12-20T11:00:00Z'),
        },
        // Session 3: u1, 2 events, 60 seconds
        {
          sessionId: 's3',
          userId: 'u1',
          timestamp: new Date('2025-12-20T12:00:00Z'),
        },
        {
          sessionId: 's3',
          userId: 'u1',
          timestamp: new Date('2025-12-20T12:01:00Z'),
        },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.calculateEngagement(
        new Date('2025-12-20'),
        new Date('2025-12-20'),
      );

      expect(result.avgSessionDuration).toBe(60); // (120 + 0 + 60) / 3
      expect(result.avgSessionsPerUser).toBe(1.5); // 3 sessions / 2 users
      expect(result.avgEventsPerSession).toBe(2); // 6 events / 3 sessions
      expect(result.bounceRate).toBeCloseTo(0.333, 2); // 1 bounce / 3 sessions
    });

    it('should handle empty logs', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.calculateEngagement(
        new Date('2025-12-20'),
        new Date('2025-12-20'),
      );

      expect(result.avgSessionDuration).toBe(0);
      expect(result.avgSessionsPerUser).toBe(0);
      expect(result.avgEventsPerSession).toBe(0);
      expect(result.bounceRate).toBe(0);
    });

    it('should calculate 100% bounce rate when all sessions have 1 event', async () => {
      const mockLogs = [
        {
          sessionId: 's1',
          userId: 'u1',
          timestamp: new Date('2025-12-20T10:00:00Z'),
        },
        {
          sessionId: 's2',
          userId: 'u2',
          timestamp: new Date('2025-12-20T11:00:00Z'),
        },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.calculateEngagement(
        new Date('2025-12-20'),
        new Date('2025-12-20'),
      );

      expect(result.bounceRate).toBe(1);
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate 50th percentile (median) correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = service.calculatePercentile(values, 50);
      expect(result).toBe(5.5);
    });

    it('should calculate 95th percentile correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = service.calculatePercentile(values, 95);
      expect(result).toBeCloseTo(9.55, 2);
    });

    it('should calculate 0th percentile (minimum)', () => {
      const values = [5, 10, 15, 20, 25];
      const result = service.calculatePercentile(values, 0);
      expect(result).toBe(5);
    });

    it('should calculate 100th percentile (maximum)', () => {
      const values = [5, 10, 15, 20, 25];
      const result = service.calculatePercentile(values, 100);
      expect(result).toBe(25);
    });

    it('should handle single value array', () => {
      const values = [42];
      const result = service.calculatePercentile(values, 50);
      expect(result).toBe(42);
    });

    it('should return 0 for empty array', () => {
      const values: number[] = [];
      const result = service.calculatePercentile(values, 50);
      expect(result).toBe(0);
    });

    it('should throw error for invalid percentile < 0', () => {
      const values = [1, 2, 3];
      expect(() => service.calculatePercentile(values, -10)).toThrow(
        'Percentile must be between 0 and 100',
      );
    });

    it('should throw error for invalid percentile > 100', () => {
      const values = [1, 2, 3];
      expect(() => service.calculatePercentile(values, 150)).toThrow(
        'Percentile must be between 0 and 100',
      );
    });

    it('should handle unsorted input correctly', () => {
      const values = [10, 1, 5, 8, 3];
      const result = service.calculatePercentile(values, 50);
      expect(result).toBe(5);
    });
  });

  describe('getUserPointsPercentiles', () => {
    it('should calculate multiple percentiles for user points', async () => {
      const mockUsers = [
        { points: 100 },
        { points: 200 },
        { points: 300 },
        { points: 400 },
        { points: 500 },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getUserPointsPercentiles([25, 50, 75, 90]);

      expect(result[25]).toBe(200);
      expect(result[50]).toBe(300);
      expect(result[75]).toBe(400);
      expect(result[90]).toBe(460);
    });

    it('should handle users with zero points', async () => {
      const mockUsers = [{ points: 0 }, { points: 0 }, { points: 100 }];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getUserPointsPercentiles([50]);

      expect(result[50]).toBe(0);
    });

    it('should handle empty user list', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.getUserPointsPercentiles([50, 95]);

      expect(result[50]).toBe(0);
      expect(result[95]).toBe(0);
    });
  });

  describe('aggregateTimeSeries', () => {
    describe('events metric', () => {
      it('should aggregate events by day', async () => {
        const mockLogs = [
          {
            timestamp: new Date('2025-12-20T10:00:00Z'),
            userId: 'u1',
            sessionId: 's1',
          },
          {
            timestamp: new Date('2025-12-20T14:00:00Z'),
            userId: 'u2',
            sessionId: 's2',
          },
          {
            timestamp: new Date('2025-12-21T10:00:00Z'),
            userId: 'u1',
            sessionId: 's3',
          },
        ];
        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const result = await service.aggregateTimeSeries(
          new Date('2025-12-20'),
          new Date('2025-12-21'),
          'events',
          'day',
        );

        expect(result).toHaveLength(2);
        expect(result[0].value).toBe(2);
        expect(result[1].value).toBe(1);
      });

      it('should aggregate events by hour', async () => {
        const mockLogs = [
          {
            timestamp: new Date('2025-12-20T10:15:00Z'),
            userId: 'u1',
            sessionId: 's1',
          },
          {
            timestamp: new Date('2025-12-20T10:45:00Z'),
            userId: 'u2',
            sessionId: 's2',
          },
          {
            timestamp: new Date('2025-12-20T11:00:00Z'),
            userId: 'u1',
            sessionId: 's3',
          },
        ];
        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const result = await service.aggregateTimeSeries(
          new Date('2025-12-20T10:00:00Z'),
          new Date('2025-12-20T12:00:00Z'),
          'events',
          'hour',
        );

        expect(result).toHaveLength(2);
        expect(result[0].value).toBe(2); // 10:00 hour
        expect(result[1].value).toBe(1); // 11:00 hour
      });
    });

    describe('users metric', () => {
      it('should aggregate unique users by day', async () => {
        const mockLogs = [
          {
            timestamp: new Date('2025-12-20T10:00:00Z'),
            userId: 'u1',
            sessionId: 's1',
          },
          {
            timestamp: new Date('2025-12-20T14:00:00Z'),
            userId: 'u1',
            sessionId: 's2',
          },
          {
            timestamp: new Date('2025-12-20T16:00:00Z'),
            userId: 'u2',
            sessionId: 's3',
          },
        ];
        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const result = await service.aggregateTimeSeries(
          new Date('2025-12-20'),
          new Date('2025-12-20'),
          'users',
          'day',
        );

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(2); // u1 and u2
      });

      it('should filter out null userIds', async () => {
        const mockLogs = [
          {
            timestamp: new Date('2025-12-20T10:00:00Z'),
            userId: 'u1',
            sessionId: 's1',
          },
          {
            timestamp: new Date('2025-12-20T14:00:00Z'),
            userId: null,
            sessionId: 's2',
          },
        ];
        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const result = await service.aggregateTimeSeries(
          new Date('2025-12-20'),
          new Date('2025-12-20'),
          'users',
          'day',
        );

        expect(result[0].value).toBe(1);
      });
    });

    describe('sessions metric', () => {
      it('should aggregate unique sessions by day', async () => {
        const mockLogs = [
          {
            timestamp: new Date('2025-12-20T10:00:00Z'),
            userId: 'u1',
            sessionId: 's1',
          },
          {
            timestamp: new Date('2025-12-20T10:30:00Z'),
            userId: 'u1',
            sessionId: 's1',
          },
          {
            timestamp: new Date('2025-12-20T14:00:00Z'),
            userId: 'u2',
            sessionId: 's2',
          },
        ];
        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const result = await service.aggregateTimeSeries(
          new Date('2025-12-20'),
          new Date('2025-12-20'),
          'sessions',
          'day',
        );

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(2); // s1 and s2
      });
    });

    describe('week interval', () => {
      it('should aggregate by week starting Monday', async () => {
        const mockLogs = [
          // Dec 16, 2025 (Monday)
          {
            timestamp: new Date('2025-12-16T10:00:00Z'),
            userId: 'u1',
            sessionId: 's1',
          },
          // Dec 18, 2025 (Wednesday)
          {
            timestamp: new Date('2025-12-18T10:00:00Z'),
            userId: 'u2',
            sessionId: 's2',
          },
          // Dec 23, 2025 (next Tuesday)
          {
            timestamp: new Date('2025-12-23T10:00:00Z'),
            userId: 'u3',
            sessionId: 's3',
          },
        ];
        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const result = await service.aggregateTimeSeries(
          new Date('2025-12-16'),
          new Date('2025-12-25'),
          'events',
          'week',
        );

        expect(result).toHaveLength(2);
        expect(result[0].value).toBe(2); // Week of Dec 16
        expect(result[1].value).toBe(1); // Week of Dec 23
      });

      it('should handle Sunday correctly (week starts Monday)', async () => {
        const mockLogs = [
          // Dec 21, 2025 (Sunday) - should map to week of Dec 15 (Monday)
          {
            timestamp: new Date('2025-12-21T10:00:00Z'),
            userId: 'u1',
            sessionId: 's1',
          },
        ];
        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const result = await service.aggregateTimeSeries(
          new Date('2025-12-15'),
          new Date('2025-12-21'),
          'events',
          'week',
        );

        expect(result).toHaveLength(1);
        expect(result[0].date.toISOString()).toContain('2025-12-15');
      });
    });

    it('should return empty array for no logs', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.aggregateTimeSeries(
        new Date('2025-12-20'),
        new Date('2025-12-21'),
        'events',
        'day',
      );

      expect(result).toHaveLength(0);
    });

    it('should sort results chronologically', async () => {
      const mockLogs = [
        {
          timestamp: new Date('2025-12-22T10:00:00Z'),
          userId: 'u1',
          sessionId: 's1',
        },
        {
          timestamp: new Date('2025-12-20T10:00:00Z'),
          userId: 'u2',
          sessionId: 's2',
        },
        {
          timestamp: new Date('2025-12-21T10:00:00Z'),
          userId: 'u3',
          sessionId: 's3',
        },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.aggregateTimeSeries(
        new Date('2025-12-20'),
        new Date('2025-12-22'),
        'events',
        'day',
      );

      expect(result[0].date.toISOString()).toContain('2025-12-20');
      expect(result[1].date.toISOString()).toContain('2025-12-21');
      expect(result[2].date.toISOString()).toContain('2025-12-22');
    });
  });

  describe('Database Integration', () => {
    it('should use correct Prisma query for DAU', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const startDate = new Date('2025-12-01');
      const endDate = new Date('2025-12-31');

      await service.calculateDAU(startDate, endDate);

      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          userId: { not: null },
        },
        select: {
          timestamp: true,
          userId: true,
        },
      });
    });

    it('should use distinct query for WAU', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      await service.calculateWAU(
        new Date('2025-12-01'),
        new Date('2025-12-07'),
      );

      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          distinct: ['userId'],
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle timezone differences correctly', async () => {
      const mockLogs = [
        { timestamp: new Date('2025-12-20T23:59:59Z'), userId: 'u1' },
        { timestamp: new Date('2025-12-21T00:00:01Z'), userId: 'u1' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.calculateDAU(
        new Date('2025-12-20'),
        new Date('2025-12-21'),
      );

      expect(result).toHaveLength(2);
    });

    it('should handle large datasets efficiently', async () => {
      const largeMockLogs = Array.from({ length: 10000 }, (_, i) => ({
        timestamp: new Date(2025, 11, 20, i % 24),
        userId: `u${i % 100}`,
        sessionId: `s${i}`,
      }));
      mockPrisma.behaviorLog.findMany.mockResolvedValue(largeMockLogs);

      const result = await service.calculateEngagement(
        new Date('2025-12-20'),
        new Date('2025-12-20'),
      );

      expect(result).toBeDefined();
      expect(result.avgEventsPerSession).toBeGreaterThan(0);
    });
  });
});
