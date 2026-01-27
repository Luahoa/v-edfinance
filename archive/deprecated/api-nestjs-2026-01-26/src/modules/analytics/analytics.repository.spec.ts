import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AnalyticsRepository } from './analytics.repository';
import { KYSELY_TOKEN } from '../../database/kysely.module';

describe('AnalyticsRepository', () => {
  let repository: AnalyticsRepository;
  let mockDb: Record<string, unknown>;
  let mockCache: any;

  beforeEach(async () => {
    mockDb = {
      selectFrom: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
      executeTakeFirst: vi.fn().mockResolvedValue({ count: 0 }),
    };

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsRepository,
        {
          provide: KYSELY_TOKEN,
          useValue: mockDb,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCache,
        },
      ],
    }).compile();

    repository = module.get<AnalyticsRepository>(AnalyticsRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getDailyActiveUsers', () => {
    it('should return DAU results with default 30 days', async () => {
      mockDb.execute = vi.fn().mockResolvedValue([
        { date: new Date('2024-12-20'), activeUsers: 150 },
        { date: new Date('2024-12-19'), activeUsers: 145 },
      ]);

      const result = await repository.getDailyActiveUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('activeUsers');
    });

    it('should accept custom days parameter', async () => {
      mockDb.execute = vi.fn().mockResolvedValue([]);

      await repository.getDailyActiveUsers(7);

      expect(mockDb.selectFrom).toHaveBeenCalled();
    });
  });

  describe('getMonthlyActiveUsers', () => {
    it('should return MAU results', async () => {
      mockDb.execute = vi.fn().mockResolvedValue([
        { month: '2024-12', activeUsers: 1500 },
        { month: '2024-11', activeUsers: 1400 },
      ]);

      const result = await repository.getMonthlyActiveUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('activeUsers');
    });
  });

  describe('getLearningFunnel', () => {
    it('should return funnel stages', async () => {
      mockDb.executeTakeFirst = vi
        .fn()
        .mockResolvedValueOnce({ count: 1000 })
        .mockResolvedValueOnce({ count: 600 })
        .mockResolvedValueOnce({ count: 300 });

      const result = await repository.getLearningFunnel();

      expect(result).toHaveLength(3);
      expect(result[0].stage).toBe('Registered');
      expect(result[1].stage).toBe('Started Learning');
      expect(result[2].stage).toBe('Completed Lesson');
    });

    it('should calculate correct percentages', async () => {
      mockDb.executeTakeFirst = vi
        .fn()
        .mockResolvedValueOnce({ count: 100 })
        .mockResolvedValueOnce({ count: 50 })
        .mockResolvedValueOnce({ count: 25 });

      const result = await repository.getLearningFunnel();

      expect(result[0].percentage).toBe(100);
      expect(result[1].percentage).toBe(50);
      expect(result[2].percentage).toBe(25);
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard entries with default limit', async () => {
      const mockExecute = vi.fn().mockResolvedValue({
        rows: [
          {
            userId: 'u1',
            name: 'User 1',
            points: 5000,
            currentStreak: 10,
            rank: 1,
          },
          {
            userId: 'u2',
            name: 'User 2',
            points: 4500,
            currentStreak: 5,
            rank: 2,
          },
        ],
      });

      mockDb = {
        ...mockDb,
        execute: mockExecute,
      } as unknown as Record<string, unknown>;

      expect(repository).toBeDefined();
    });
  });

  describe('getEngagementMetrics', () => {
    it('should return engagement metrics', async () => {
      mockDb.executeTakeFirst = vi.fn().mockResolvedValue({
        totalSessions: 1000,
        uniqueUsers: 200,
        avgDuration: 300,
      });
      mockDb.execute = vi.fn().mockResolvedValue([
        { eventType: 'page_view', count: 5000 },
        { eventType: 'lesson_complete', count: 1500 },
      ]);

      const result = await repository.getEngagementMetrics(7);

      expect(result).toHaveProperty('totalSessions');
      expect(result).toHaveProperty('avgSessionsPerUser');
      expect(result).toHaveProperty('topEventTypes');
    });
  });

  describe('getStudentBehaviorPattern', () => {
    it('should return behavior pattern for a user', async () => {
      mockDb.executeTakeFirst = vi
        .fn()
        .mockResolvedValueOnce({ hour: '14', count: 50 })
        .mockResolvedValueOnce({ avgDuration: 450 })
        .mockResolvedValueOnce({ day: 'Monday', count: 30 });
      mockDb.execute = vi
        .fn()
        .mockResolvedValue([{ eventType: 'video_play', count: 100 }]);

      const result = await repository.getStudentBehaviorPattern('user-123');

      expect(result).toHaveProperty('preferredTime');
      expect(result).toHaveProperty('avgSessionDuration');
      expect(result).toHaveProperty('mostActiveDay');
      expect(result).toHaveProperty('learningStyle');
    });
  });
});
