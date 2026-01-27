import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LeaderboardService } from './leaderboard.service';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      behaviorLog: {
        groupBy: vi.fn(),
      },
    };
    service = new LeaderboardService(mockPrisma);
  });

  describe('getTopUsers', () => {
    it('should return top users with formatted names', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'u1',
          email: 'bob@test.com',
          points: 100,
          metadata: { displayName: 'Bob' },
          streaks: { currentStreak: 5, longestStreak: 10 },
        },
        {
          id: 'u2',
          email: 'alice@test.com',
          points: 200,
          metadata: {},
          streaks: null,
        },
      ]);

      const result = await service.getTopUsers();

      expect(result).toHaveLength(2);
      expect(result[0].displayName).toBe('Bob');
      expect(result[1].displayName).toBe('alice');
      expect(result[0].points).toBe(100);
      expect(result[0].currentStreak).toBe(5);
      expect(result[1].currentStreak).toBe(0);
    });
  });

  describe('getGlobalRanking', () => {
    it('should return correct rank and percentile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ points: 500 });
      mockPrisma.user.count
        .mockResolvedValueOnce(10) // users with points > 500
        .mockResolvedValueOnce(100); // total users

      const result = await service.getGlobalRanking('u1');

      expect(result.rank).toBe(11);
      expect(result.percentile).toBe(90.0);
      expect(result.totalUsers).toBe(100);
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getGlobalRanking('u1')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getPeriodicLeaderboard', () => {
    it('should aggregate scores for daily period', async () => {
      mockPrisma.behaviorLog.groupBy.mockResolvedValue([
        { userId: 'u1', _sum: { duration: 150 } },
        { userId: 'u2', _sum: { duration: 100 } },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1', email: 'u1@t.com', metadata: { displayName: 'User 1' } },
        { id: 'u2', email: 'u2@t.com', metadata: {} },
      ]);

      const result = await service.getPeriodicLeaderboard('daily');

      expect(result).toHaveLength(2);
      expect(result[0].points).toBe(150);
      expect(result[0].displayName).toBe('User 1');
      expect(result[1].displayName).toBe('u2');
      expect(mockPrisma.behaviorLog.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventType: 'POINTS_EARNED',
          }),
        }),
      );
    });

    it('should work for weekly period', async () => {
      mockPrisma.behaviorLog.groupBy.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      await service.getPeriodicLeaderboard('weekly');
      expect(mockPrisma.behaviorLog.groupBy).toHaveBeenCalled();
    });

    it('should work for monthly period', async () => {
      mockPrisma.behaviorLog.groupBy.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      await service.getPeriodicLeaderboard('monthly');
      expect(mockPrisma.behaviorLog.groupBy).toHaveBeenCalled();
    });
  });
});
