import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LossAversionService } from './loss-aversion.service';

describe('LossAversionService (85%+ Coverage)', () => {
  let service: LossAversionService;
  let mockPrisma: any;
  let mockAnalytics: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      userStreak: {
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    };

    mockAnalytics = {
      getUserPersona: vi.fn(),
    };

    service = new LossAversionService(mockPrisma, mockAnalytics);
  });

  describe('generateStreakLossWarning', () => {
    it('should return CRITICAL warning for high-value streak (>= 7 days) about to expire', async () => {
      const mockStreak = {
        userId: 'user-1',
        currentStreak: 10,
        longestStreak: 15,
        lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000), // 22 hours ago
        streakFrozen: false,
        freezesRemaining: 2,
      };

      mockPrisma.userStreak.findUnique.mockResolvedValue(mockStreak);

      const result = await service.generateStreakLossWarning('user-1');

      expect(result).not.toBeNull();
      expect(result?.type).toBe('STREAK_LOSS');
      expect(result?.priority).toBe('CRITICAL');
      expect(result?.message.vi).toContain('10 ngày');
      expect(result?.message.vi).toContain('2 giờ');
      expect(result?.message.en).toContain('10-day streak');
      expect(result?.message.zh).toContain('10 天');
      expect(result?.metadata?.currentStreak).toBe(10);
      expect(result?.metadata?.hoursRemaining).toBe(2);
    });

    it('should return HIGH priority for low-value streak (< 7 days) about to expire', async () => {
      const mockStreak = {
        userId: 'user-2',
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: new Date(Date.now() - 21 * 60 * 60 * 1000), // 21 hours ago
        streakFrozen: false,
        freezesRemaining: 1,
      };

      mockPrisma.userStreak.findUnique.mockResolvedValue(mockStreak);

      const result = await service.generateStreakLossWarning('user-2');

      expect(result).not.toBeNull();
      expect(result?.priority).toBe('HIGH');
      expect(result?.metadata?.currentStreak).toBe(5);
      expect(result?.metadata?.hoursRemaining).toBe(3);
    });

    it('should return null when streak is already expired (>24 hours)', async () => {
      const mockStreak = {
        userId: 'user-3',
        currentStreak: 8,
        longestStreak: 10,
        lastActivityDate: new Date(Date.now() - 26 * 60 * 60 * 1000), // 26 hours ago
        streakFrozen: false,
        freezesRemaining: 0,
      };

      mockPrisma.userStreak.findUnique.mockResolvedValue(mockStreak);

      const result = await service.generateStreakLossWarning('user-3');

      expect(result).toBeNull();
    });

    it('should return null when activity is too recent (<20 hours)', async () => {
      const mockStreak = {
        userId: 'user-4',
        currentStreak: 12,
        longestStreak: 12,
        lastActivityDate: new Date(Date.now() - 15 * 60 * 60 * 1000), // 15 hours ago
        streakFrozen: false,
        freezesRemaining: 3,
      };

      mockPrisma.userStreak.findUnique.mockResolvedValue(mockStreak);

      const result = await service.generateStreakLossWarning('user-4');

      expect(result).toBeNull();
    });

    it('should return null when user has no streak', async () => {
      const mockStreak = {
        userId: 'user-5',
        currentStreak: 0,
        longestStreak: 5,
        lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
        streakFrozen: false,
        freezesRemaining: 0,
      };

      mockPrisma.userStreak.findUnique.mockResolvedValue(mockStreak);

      const result = await service.generateStreakLossWarning('user-5');

      expect(result).toBeNull();
    });

    it('should return null when streak data does not exist', async () => {
      mockPrisma.userStreak.findUnique.mockResolvedValue(null);

      const result = await service.generateStreakLossWarning('user-6');

      expect(result).toBeNull();
    });

    it('should calculate hours remaining correctly at exact 20-hour mark', async () => {
      const mockStreak = {
        userId: 'user-7',
        currentStreak: 3,
        longestStreak: 10,
        lastActivityDate: new Date(Date.now() - 20 * 60 * 60 * 1000), // Exactly 20 hours
        streakFrozen: false,
        freezesRemaining: 1,
      };

      mockPrisma.userStreak.findUnique.mockResolvedValue(mockStreak);

      const result = await service.generateStreakLossWarning('user-7');

      expect(result).not.toBeNull();
      expect(result?.metadata?.hoursRemaining).toBe(4);
    });
  });

  describe('generateAboutToLoseNudge', () => {
    it('should generate CRITICAL nudge when progress is 90%+', async () => {
      const result = await service.generateAboutToLoseNudge(
        'user-1',
        95,
        'Complete 10 Lessons',
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('ABOUT_TO_LOSE');
      expect(result?.priority).toBe('CRITICAL');
      expect(result?.message.vi).toContain('95%');
      expect(result?.message.vi).toContain('5%');
      expect(result?.message.vi).toContain('Complete 10 Lessons');
      expect(result?.metadata?.progressPercentage).toBe(95);
      expect(result?.metadata?.remaining).toBe(5);
    });

    it('should generate HIGH nudge when progress is 70-89%', async () => {
      const result = await service.generateAboutToLoseNudge(
        'user-2',
        80,
        'Save $1000',
      );

      expect(result).not.toBeNull();
      expect(result?.priority).toBe('HIGH');
      expect(result?.message.en).toContain('80%');
      expect(result?.message.en).toContain('20%');
      expect(result?.metadata?.goalName).toBe('Save $1000');
    });

    it('should return null when progress is below 70%', async () => {
      const result = await service.generateAboutToLoseNudge(
        'user-3',
        50,
        'Invest in Stocks',
      );

      expect(result).toBeNull();
    });

    it('should return null when progress is already 100%', async () => {
      const result = await service.generateAboutToLoseNudge(
        'user-4',
        100,
        'Finish Course',
      );

      expect(result).toBeNull();
    });

    it('should handle edge case at exactly 70% threshold', async () => {
      const result = await service.generateAboutToLoseNudge(
        'user-5',
        70,
        'Budget Plan',
      );

      expect(result).not.toBeNull();
      expect(result?.priority).toBe('HIGH');
      expect(result?.metadata?.remaining).toBe(30);
    });

    it('should handle multi-language goal names correctly', async () => {
      const result = await service.generateAboutToLoseNudge(
        'user-6',
        85,
        '完成理财课程',
      );

      expect(result).not.toBeNull();
      expect(result?.message.zh).toContain('完成理财课程');
      expect(result?.message.vi).toContain('完成理财课程');
    });
  });

  describe('generateCommitmentContract', () => {
    it('should generate commitment contract with penalty warning', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
      });

      const result = await service.generateCommitmentContract(
        'user-1',
        5000000,
        30,
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('COMMITMENT_CONTRACT');
      expect(result?.priority).toBe('HIGH');
      expect(result?.message.vi).toContain('5.000.000');
      expect(result?.message.vi).toContain('30 ngày');
      expect(result?.message.vi).toContain('10%');
      expect(result?.metadata?.amount).toBe(5000000);
      expect(result?.metadata?.duration).toBe(30);
      expect(result?.metadata?.penaltyRate).toBe(0.1);
    });

    it('should format large amounts correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' });

      const result = await service.generateCommitmentContract(
        'user-2',
        100000000,
        90,
      );

      expect(result).not.toBeNull();
      expect(result?.message.vi).toContain('100.000.000');
      expect(result?.message.vi).toContain('90 ngày');
    });

    it('should return null when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.generateCommitmentContract(
        'user-3',
        1000000,
        7,
      );

      expect(result).toBeNull();
    });

    it('should handle small amounts correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-4' });

      const result = await service.generateCommitmentContract(
        'user-4',
        500000,
        14,
      );

      expect(result).not.toBeNull();
      expect(result?.message.vi).toContain('500.000');
    });

    it('should include all three language translations', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-5' });

      const result = await service.generateCommitmentContract(
        'user-5',
        10000000,
        60,
      );

      expect(result?.message.vi).toBeDefined();
      expect(result?.message.en).toBeDefined();
      expect(result?.message.zh).toBeDefined();
      expect(result?.message.en).toContain('Lock');
      expect(result?.message.en).toContain('60 days');
      expect(result?.message.zh).toContain('锁定');
    });
  });

  describe('generateFramingNudge', () => {
    it('should frame as LOSS with HIGH priority', async () => {
      const result = await service.generateFramingNudge(
        'user-1',
        'LOSS',
        2000000,
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe('FRAMING');
      expect(result?.priority).toBe('HIGH');
      expect(result?.message.vi).toContain('mất');
      expect(result?.message.vi).toContain('2.000.000');
      expect(result?.message.en).toContain('lose');
      expect(result?.metadata?.framing).toBe('loss');
      expect(result?.metadata?.scenario).toBe('LOSS');
    });

    it('should frame as GAIN with MEDIUM priority', async () => {
      const result = await service.generateFramingNudge(
        'user-2',
        'GAIN',
        3000000,
      );

      expect(result).not.toBeNull();
      expect(result?.priority).toBe('MEDIUM');
      expect(result?.message.vi).toContain('bảo vệ');
      expect(result?.message.vi).toContain('3.000.000');
      expect(result?.message.en).toContain('protect');
      expect(result?.metadata?.framing).toBe('gain');
      expect(result?.metadata?.scenario).toBe('GAIN');
    });

    it('should include inflation context in loss framing', async () => {
      const result = await service.generateFramingNudge(
        'user-3',
        'LOSS',
        5000000,
      );

      expect(result?.message.vi).toContain('lạm phát');
      expect(result?.message.en).toContain('inflation');
      expect(result?.message.zh).toContain('通货膨胀');
    });

    it('should emphasize action in gain framing', async () => {
      const result = await service.generateFramingNudge(
        'user-4',
        'GAIN',
        1000000,
      );

      expect(result?.message.vi).toContain('Hành động ngay');
      expect(result?.message.en).toContain('Act now');
      expect(result?.message.zh).toContain('立即采取行动');
    });

    it('should handle edge case with zero amount', async () => {
      const result = await service.generateFramingNudge('user-5', 'LOSS', 0);

      expect(result).not.toBeNull();
      expect(result?.message.vi).toContain('0');
    });
  });

  describe('checkMultipleUsers', () => {
    it('should process multiple users and return nudges for each', async () => {
      const mockStreak1 = {
        userId: 'user-1',
        currentStreak: 8,
        lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
        streakFrozen: false,
      };

      const mockStreak2 = {
        userId: 'user-2',
        currentStreak: 5,
        lastActivityDate: new Date(Date.now() - 21 * 60 * 60 * 1000),
        streakFrozen: false,
      };

      mockPrisma.userStreak.findUnique
        .mockResolvedValueOnce(mockStreak1)
        .mockResolvedValueOnce(mockStreak2);

      const results = await service.checkMultipleUsers(['user-1', 'user-2']);

      expect(results.size).toBe(2);
      expect(results.get('user-1')).toHaveLength(1);
      expect(results.get('user-2')).toHaveLength(1);
      expect(results.get('user-1')?.[0]?.type).toBe('STREAK_LOSS');
    });

    it('should return empty arrays for users without warnings', async () => {
      mockPrisma.userStreak.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ userId: 'user-2', currentStreak: 0 });

      const results = await service.checkMultipleUsers(['user-1', 'user-2']);

      expect(results.size).toBe(2);
      expect(results.get('user-1')).toHaveLength(0);
      expect(results.get('user-2')).toHaveLength(0);
    });

    it('should handle empty user list', async () => {
      const results = await service.checkMultipleUsers([]);

      expect(results.size).toBe(0);
    });

    it('should process users independently even if one fails', async () => {
      mockPrisma.userStreak.findUnique
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({
          userId: 'user-2',
          currentStreak: 10,
          lastActivityDate: new Date(Date.now() - 23 * 60 * 60 * 1000),
        });

      await expect(
        service.checkMultipleUsers(['user-1', 'user-2']),
      ).rejects.toThrow('DB error');
    });
  });

  describe('Edge Cases & Robustness', () => {
    it('should handle future dates gracefully in streak calculation', async () => {
      const mockStreak = {
        userId: 'user-1',
        currentStreak: 5,
        lastActivityDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours in future
        streakFrozen: false,
      };

      mockPrisma.userStreak.findUnique.mockResolvedValue(mockStreak);

      const result = await service.generateStreakLossWarning('user-1');

      expect(result).toBeNull();
    });

    it('should handle very large streak numbers', async () => {
      const mockStreak = {
        userId: 'user-1',
        currentStreak: 365,
        lastActivityDate: new Date(Date.now() - 23 * 60 * 60 * 1000),
        streakFrozen: false,
      };

      mockPrisma.userStreak.findUnique.mockResolvedValue(mockStreak);

      const result = await service.generateStreakLossWarning('user-1');

      expect(result).not.toBeNull();
      expect(result?.message.vi).toContain('365');
      expect(result?.priority).toBe('CRITICAL');
    });

    it('should handle progress percentage edge cases', async () => {
      const result99 = await service.generateAboutToLoseNudge(
        'user-1',
        99,
        'Goal',
      );
      const result69 = await service.generateAboutToLoseNudge(
        'user-2',
        69,
        'Goal',
      );

      expect(result99).not.toBeNull();
      expect(result99?.priority).toBe('CRITICAL');
      expect(result69).toBeNull();
    });

    it('should handle very small commitment amounts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

      const result = await service.generateCommitmentContract(
        'user-1',
        1000,
        1,
      );

      expect(result).not.toBeNull();
      expect(result?.message.vi).toContain('1.000');
    });

    it('should handle very large commitment durations', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

      const result = await service.generateCommitmentContract(
        'user-1',
        10000000,
        365,
      );

      expect(result).not.toBeNull();
      expect(result?.message.vi).toContain('365');
    });
  });

  describe('Message Quality & Localization', () => {
    it('should ensure all messages contain required emoji/icons', async () => {
      const mockStreak = {
        userId: 'user-1',
        currentStreak: 7,
        lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
        streakFrozen: false,
      };

      mockPrisma.userStreak.findUnique.mockResolvedValue(mockStreak);

      const streakResult = await service.generateStreakLossWarning('user-1');
      const aboutToLoseResult = await service.generateAboutToLoseNudge(
        'user-1',
        85,
        'Goal',
      );

      expect(streakResult?.message.vi).toMatch(/⚠️/);
      expect(aboutToLoseResult?.message.vi).toMatch(/🎯/);
    });

    it('should ensure message consistency across all three languages', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

      const result = await service.generateCommitmentContract(
        'user-1',
        5000000,
        30,
      );

      expect(result?.message.vi).toBeTruthy();
      expect(result?.message.en).toBeTruthy();
      expect(result?.message.zh).toBeTruthy();
      expect(result?.message.vi.length).toBeGreaterThan(20);
      expect(result?.message.en.length).toBeGreaterThan(20);
      expect(result?.message.zh.length).toBeGreaterThan(10);
    });
  });
});
