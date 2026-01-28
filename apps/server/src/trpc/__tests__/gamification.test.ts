import { describe, it, expect } from 'vitest';
import { TRPCError } from '@trpc/server';
import {
  createTestCaller,
  createAuthenticatedContext,
  createUnauthenticatedContext,
  createMockDb,
  vi,
} from './test-helpers';

describe('gamificationRouter', () => {
  describe('leaderboard', () => {
    it('should return top users by points', async () => {
      const mockUsers = [
        { id: 'user-1', name: { vi: 'Người dùng 1' }, points: 1000, role: 'STUDENT' },
        { id: 'user-2', name: { vi: 'Người dùng 2' }, points: 800, role: 'STUDENT' },
      ];

      const mockDb = createMockDb();
      mockDb.query.users.findMany.mockResolvedValue(mockUsers);

      const ctx = createUnauthenticatedContext(mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.gamification.leaderboard({ limit: 10 });

      expect(result).toHaveLength(2);
      expect(result[0].points).toBe(1000);
    });

    it('should use default limit when not provided', async () => {
      const mockDb = createMockDb();
      mockDb.query.users.findMany.mockResolvedValue([]);

      const ctx = createUnauthenticatedContext(mockDb);
      const caller = createTestCaller(ctx);

      await caller.gamification.leaderboard({});

      expect(mockDb.query.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
        })
      );
    });

    it('should respect limit parameter', async () => {
      const mockDb = createMockDb();
      mockDb.query.users.findMany.mockResolvedValue([]);

      const ctx = createUnauthenticatedContext(mockDb);
      const caller = createTestCaller(ctx);

      await caller.gamification.leaderboard({ limit: 50 });

      expect(mockDb.query.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        })
      );
    });
  });

  describe('getStreak', () => {
    it('should return user streak', async () => {
      const mockStreak = {
        id: 'streak-1',
        userId: 'test-user-id',
        currentStreak: 7,
        longestStreak: 14,
        lastActivityDate: new Date('2025-01-27'),
      };

      const mockDb = createMockDb();
      mockDb.query.userStreaks.findFirst.mockResolvedValue(mockStreak);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.gamification.getStreak();

      expect(result.currentStreak).toBe(7);
      expect(result.longestStreak).toBe(14);
    });

    it('should return default values when no streak exists', async () => {
      const mockDb = createMockDb();
      mockDb.query.userStreaks.findFirst.mockResolvedValue(null);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.gamification.getStreak();

      expect(result).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
      });
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createTestCaller(ctx);

      await expect(caller.gamification.getStreak()).rejects.toThrow(TRPCError);
    });
  });

  describe('updateStreak', () => {
    it('should create new streak for first activity', async () => {
      const mockDb = createMockDb();
      mockDb.query.userStreaks.findFirst.mockResolvedValue(null);

      const newStreak = {
        id: 'streak-new',
        userId: 'test-user-id',
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date(),
      };

      const insertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([newStreak]),
      };
      mockDb.insert = vi.fn().mockReturnValue(insertChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.gamification.updateStreak();

      expect(result.currentStreak).toBe(1);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should return existing streak if already logged today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingStreak = {
        id: 'streak-1',
        userId: 'test-user-id',
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: today,
      };

      const mockDb = createMockDb();
      mockDb.query.userStreaks.findFirst.mockResolvedValue(existingStreak);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.gamification.updateStreak();

      expect(result).toEqual(existingStreak);
    });

    it('should increment streak for consecutive day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const existingStreak = {
        id: 'streak-1',
        userId: 'test-user-id',
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: yesterday,
      };

      const updatedStreak = {
        ...existingStreak,
        currentStreak: 6,
        lastActivityDate: new Date(),
      };

      const mockDb = createMockDb();
      mockDb.query.userStreaks.findFirst.mockResolvedValue(existingStreak);

      const updateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedStreak]),
      };
      mockDb.update = vi.fn().mockReturnValue(updateChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.gamification.updateStreak();

      expect(result.currentStreak).toBe(6);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should reset streak when streak is broken', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      const existingStreak = {
        id: 'streak-1',
        userId: 'test-user-id',
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: twoDaysAgo,
      };

      const resetStreak = {
        ...existingStreak,
        currentStreak: 1,
        lastActivityDate: new Date(),
      };

      const mockDb = createMockDb();
      mockDb.query.userStreaks.findFirst.mockResolvedValue(existingStreak);

      const updateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([resetStreak]),
      };
      mockDb.update = vi.fn().mockReturnValue(updateChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.gamification.updateStreak();

      expect(result.currentStreak).toBe(1);
    });
  });

  describe('getAchievements', () => {
    it('should return user achievements', async () => {
      const mockAchievements = [
        { id: 'ua-1', achievementId: 'ach-1', earnedAt: new Date() },
        { id: 'ua-2', achievementId: 'ach-2', earnedAt: new Date() },
      ];

      const mockDb = createMockDb();
      mockDb.query.userAchievements.findMany.mockResolvedValue(mockAchievements);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.gamification.getAchievements();

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no achievements', async () => {
      const mockDb = createMockDb();
      mockDb.query.userAchievements.findMany.mockResolvedValue([]);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.gamification.getAchievements();

      expect(result).toEqual([]);
    });
  });

  describe('addPoints', () => {
    it('should add points to user', async () => {
      const mockUpdatedUser = {
        id: 'test-user-id',
        points: 150,
      };

      const mockDb = createMockDb();
      const updateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedUser]),
      };
      mockDb.update = vi.fn().mockReturnValue(updateChain);

      const ctx = createAuthenticatedContext({}, mockDb);
      const caller = createTestCaller(ctx);

      const result = await caller.gamification.addPoints({
        points: 50,
        reason: 'Completed lesson',
      });

      expect(result.points).toBe(150);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = createTestCaller(ctx);

      await expect(
        caller.gamification.addPoints({ points: 10 })
      ).rejects.toThrow(TRPCError);
    });

    it('should validate points range', async () => {
      const ctx = createAuthenticatedContext({});
      const caller = createTestCaller(ctx);

      await expect(
        caller.gamification.addPoints({ points: 0 })
      ).rejects.toThrow();

      await expect(
        caller.gamification.addPoints({ points: 1001 })
      ).rejects.toThrow();
    });
  });
});
