import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StreakService } from './streak.service';

describe('StreakService', () => {
  let service: StreakService;
  let mockPrisma: any;
  let mockGamification: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      userStreak: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    mockGamification = {
      logEvent: vi.fn(),
    };
    service = new StreakService(mockPrisma, mockGamification);
  });

  describe('updateStreak', () => {
    const userId = 'u1';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    it('should initialize streak if it does not exist', async () => {
      mockPrisma.userStreak.findUnique.mockResolvedValue(null);
      mockPrisma.userStreak.create.mockResolvedValue({
        userId,
        currentStreak: 1,
      });

      await service.updateStreak(userId);

      expect(mockPrisma.userStreak.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          currentStreak: 1,
          lastActivityDate: today,
        }),
      });
    });

    it('should increment streak if last activity was yesterday', async () => {
      const existingStreak = {
        userId,
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: yesterday,
        freezesRemaining: 1,
      };
      mockPrisma.userStreak.findUnique.mockResolvedValue(existingStreak);
      mockPrisma.userStreak.update.mockResolvedValue({
        ...existingStreak,
        currentStreak: 6,
      });

      await service.updateStreak(userId);

      expect(mockPrisma.userStreak.update).toHaveBeenCalledWith({
        where: { userId },
        data: expect.objectContaining({
          currentStreak: 6,
          longestStreak: 6,
          lastActivityDate: today,
        }),
      });
    });

    it('should reward points for 7-day milestone', async () => {
      const existingStreak = {
        userId,
        currentStreak: 6,
        longestStreak: 6,
        lastActivityDate: yesterday,
      };
      mockPrisma.userStreak.findUnique.mockResolvedValue(existingStreak);
      mockPrisma.userStreak.update.mockResolvedValue({
        ...existingStreak,
        currentStreak: 7,
      });

      await service.updateStreak(userId);

      expect(mockGamification.logEvent).toHaveBeenCalledWith(
        userId,
        'STREAK_MILESTONE',
        100,
        {
          days: 7,
        },
      );
    });

    it('should use freeze if streak is broken but freezes are available', async () => {
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      const existingStreak = {
        userId,
        currentStreak: 5,
        lastActivityDate: twoDaysAgo,
        freezesRemaining: 2,
      };
      mockPrisma.userStreak.findUnique.mockResolvedValue(existingStreak);
      mockPrisma.userStreak.update.mockResolvedValue({
        ...existingStreak,
        freezesRemaining: 1,
        streakFrozen: true,
      });

      await service.updateStreak(userId);

      expect(mockPrisma.userStreak.update).toHaveBeenCalledWith({
        where: { userId },
        data: expect.objectContaining({
          freezesRemaining: 1,
          streakFrozen: true,
          lastActivityDate: today,
        }),
      });
    });

    it('should reset streak if broken and no freezes remaining', async () => {
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      const existingStreak = {
        userId,
        currentStreak: 10,
        lastActivityDate: twoDaysAgo,
        freezesRemaining: 0,
      };
      mockPrisma.userStreak.findUnique.mockResolvedValue(existingStreak);
      mockPrisma.userStreak.update.mockResolvedValue({
        ...existingStreak,
        currentStreak: 1,
      });

      await service.updateStreak(userId);

      expect(mockPrisma.userStreak.update).toHaveBeenCalledWith({
        where: { userId },
        data: expect.objectContaining({
          currentStreak: 1,
          lastActivityDate: today,
        }),
      });
    });

    it('should not update if user already active today', async () => {
      const existingStreak = {
        userId,
        currentStreak: 5,
        longestStreak: 8,
        lastActivityDate: today,
      };
      mockPrisma.userStreak.findUnique.mockResolvedValue(existingStreak);

      const result = await service.updateStreak(userId);

      expect(result).toEqual(existingStreak);
      expect(mockPrisma.userStreak.update).not.toHaveBeenCalled();
    });

    it('should update longest streak when current exceeds it', async () => {
      const existingStreak = {
        userId,
        currentStreak: 9,
        longestStreak: 8,
        lastActivityDate: yesterday,
      };
      mockPrisma.userStreak.findUnique.mockResolvedValue(existingStreak);
      mockPrisma.userStreak.update.mockResolvedValue({
        ...existingStreak,
        currentStreak: 10,
        longestStreak: 10,
      });

      await service.updateStreak(userId);

      expect(mockPrisma.userStreak.update).toHaveBeenCalledWith({
        where: { userId },
        data: expect.objectContaining({
          currentStreak: 10,
          longestStreak: 10,
        }),
      });
    });

    it('should unfreeze streak when user becomes active', async () => {
      const existingStreak = {
        userId,
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: yesterday,
        streakFrozen: true,
      };
      mockPrisma.userStreak.findUnique.mockResolvedValue(existingStreak);
      mockPrisma.userStreak.update.mockResolvedValue({
        ...existingStreak,
        currentStreak: 6,
        streakFrozen: false,
      });

      await service.updateStreak(userId);

      expect(mockPrisma.userStreak.update).toHaveBeenCalledWith({
        where: { userId },
        data: expect.objectContaining({
          streakFrozen: false,
        }),
      });
    });

    it('should reward for multiple of 7 days (14, 21, etc)', async () => {
      const existingStreak = {
        userId,
        currentStreak: 13,
        longestStreak: 13,
        lastActivityDate: yesterday,
      };
      mockPrisma.userStreak.findUnique.mockResolvedValue(existingStreak);
      mockPrisma.userStreak.update.mockResolvedValue({
        ...existingStreak,
        currentStreak: 14,
      });

      await service.updateStreak(userId);

      expect(mockGamification.logEvent).toHaveBeenCalledWith(
        userId,
        'STREAK_MILESTONE',
        100,
        {
          days: 14,
        },
      );
    });
  });

  describe('getStreak', () => {
    it('should return user streak', async () => {
      const streakData = {
        userId: 'u1',
        currentStreak: 10,
        longestStreak: 15,
      };
      mockPrisma.userStreak.findUnique.mockResolvedValue(streakData);

      const result = await service.getStreak('u1');

      expect(result).toEqual(streakData);
      expect(mockPrisma.userStreak.findUnique).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
    });

    it('should return null if streak does not exist', async () => {
      mockPrisma.userStreak.findUnique.mockResolvedValue(null);

      const result = await service.getStreak('u1');

      expect(result).toBeNull();
    });
  });
});
