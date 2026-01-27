import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialProofService } from './social-proof.service';

/**
 * Comprehensive test suite for Social Proof Nudge Service
 * Target Coverage: 85%+
 *
 * Tests cover:
 * - "X% of users like you" cohort messages
 * - Peer comparison logic
 * - Social norm framing
 * - Mock user cohort data
 */
describe('SocialProofService', () => {
  let service: SocialProofService;
  let mockPrisma: any;
  let mockAnalytics: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      behaviorLog: {
        count: vi.fn(),
        groupBy: vi.fn(),
      },
    };

    mockAnalytics = {
      getUserPersona: vi.fn(),
    };

    service = new SocialProofService(mockPrisma, mockAnalytics);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCohortMessage - "X% of users like you"', () => {
    it('should generate high-percentage cohort message for popular action', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        investmentProfile: { riskTolerance: 'LOW' },
      });

      // Mock: 80 out of 100 users in cohort performed action
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(
          Array.from({ length: 100 }, (_, i) => ({ userId: `u${i}` })),
        )
        .mockResolvedValueOnce(
          Array.from({ length: 80 }, (_, i) => ({ userId: `u${i}` })),
        );

      const result = await service.generateCohortMessage(
        'u1',
        'COURSE_COMPLETED',
        'course-123',
      );

      expect(result).toBeDefined();
      expect(result?.type).toBe('SOCIAL_PROOF');
      expect(result?.metadata.percentage).toBe(80);
      expect(result?.metadata.cohortSize).toBe(100);
      expect(result?.metadata.comparisonType).toBe('SIMILAR_USERS');
      expect(result?.priority).toBe('HIGH'); // >= 75%
      expect(result?.message.vi).toContain('80%');
      expect(result?.message.en).toContain('80%');
      expect(result?.message.zh).toContain('80%');
    });

    it('should generate medium-priority message for moderate adoption', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u2' });

      // Mock: 60 out of 100 users performed action
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(
          Array.from({ length: 100 }, (_, i) => ({ userId: `u${i}` })),
        )
        .mockResolvedValueOnce(
          Array.from({ length: 60 }, (_, i) => ({ userId: `u${i}` })),
        );

      const result = await service.generateCohortMessage(
        'u2',
        'INVESTMENT_MADE',
      );

      expect(result?.metadata.percentage).toBe(60);
      expect(result?.priority).toBe('MEDIUM'); // >= 50%
    });

    it('should generate low-priority message for low adoption', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u3' });

      // Mock: 30 out of 100 users performed action
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(
          Array.from({ length: 100 }, (_, i) => ({ userId: `u${i}` })),
        )
        .mockResolvedValueOnce(
          Array.from({ length: 30 }, (_, i) => ({ userId: `u${i}` })),
        );

      const result = await service.generateCohortMessage(
        'u3',
        'COURSE_COMPLETED',
      );

      expect(result?.metadata.percentage).toBe(30);
      expect(result?.priority).toBe('LOW'); // < 50%
    });

    it('should return null if user not found', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.generateCohortMessage(
        'u999',
        'COURSE_COMPLETED',
      );

      expect(result).toBeNull();
    });

    it('should return null if cohort has zero users', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce([]) // No cohort users
        .mockResolvedValueOnce([]);

      const result = await service.generateCohortMessage(
        'u1',
        'COURSE_COMPLETED',
      );

      expect(result).toBeNull();
    });

    it('should handle action without targetId', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(
          Array.from({ length: 50 }, (_, i) => ({ userId: `u${i}` })),
        )
        .mockResolvedValueOnce(
          Array.from({ length: 40 }, (_, i) => ({ userId: `u${i}` })),
        );

      const result = await service.generateCohortMessage(
        'u1',
        'GENERAL_ACTIVITY',
      );

      expect(result?.metadata.percentage).toBe(80);
    });
  });

  describe('generatePeerComparison - Peer ranking logic', () => {
    it('should generate congratulatory message when user is above average', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        investmentProfile: {},
        userProgress: {},
      });

      // User has 80 actions, peers have [10, 20, 30, 40, 50, 60, 70]
      mockPrisma.behaviorLog.count.mockResolvedValue(80);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue([
        { userId: 'u2', _count: 10 },
        { userId: 'u3', _count: 20 },
        { userId: 'u4', _count: 30 },
        { userId: 'u5', _count: 40 },
        { userId: 'u6', _count: 50 },
        { userId: 'u7', _count: 60 },
        { userId: 'u8', _count: 70 },
      ]);

      const result = await service.generatePeerComparison('u1', 'LEARNING');

      expect(result).toBeDefined();
      expect(result?.type).toBe('SOCIAL_PROOF');
      expect(result?.metadata.comparisonType).toBe('PEERS');
      expect(result?.metadata.percentage).toBe(0); // All peers below user
      expect(result?.message.vi).toContain('vượt trội');
      expect(result?.message.en).toContain('outperforming');
    });

    it('should generate motivational message when user is below average', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        investmentProfile: {},
        userProgress: {},
      });

      // User has 20 actions, peers have [30, 40, 50, 60, 70, 80, 90]
      mockPrisma.behaviorLog.count.mockResolvedValue(20);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue([
        { userId: 'u2', _count: 30 },
        { userId: 'u3', _count: 40 },
        { userId: 'u4', _count: 50 },
        { userId: 'u5', _count: 60 },
        { userId: 'u6', _count: 70 },
        { userId: 'u7', _count: 80 },
        { userId: 'u8', _count: 90 },
      ]);

      const result = await service.generatePeerComparison('u1', 'SAVINGS');

      expect(result?.metadata.percentage).toBe(100); // All peers above user
      expect(result?.priority).toBe('HIGH'); // Below average should be high priority
      expect(result?.message.vi).toContain('dẫn trước');
      expect(result?.message.en).toContain('ahead of you');
    });

    it('should handle middle-ranked user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        investmentProfile: {},
        userProgress: {},
      });

      // User has 50 actions, peers have [10, 20, 30, 40, 60, 70, 80, 90]
      mockPrisma.behaviorLog.count.mockResolvedValue(50);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue([
        { userId: 'u2', _count: 10 },
        { userId: 'u3', _count: 20 },
        { userId: 'u4', _count: 30 },
        { userId: 'u5', _count: 40 },
        { userId: 'u6', _count: 60 },
        { userId: 'u7', _count: 70 },
        { userId: 'u8', _count: 80 },
        { userId: 'u9', _count: 90 },
      ]);

      const result = await service.generatePeerComparison('u1', 'INVESTMENT');

      expect(result?.metadata.percentage).toBe(50); // 4 out of 8 are better
      expect(result?.priority).toBe('MEDIUM');
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.generatePeerComparison('u999', 'LEARNING');

      expect(result).toBeNull();
    });

    it('should handle edge case with no peers', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.behaviorLog.count.mockResolvedValue(50);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue([]);

      const result = await service.generatePeerComparison('u1', 'LEARNING');

      expect(result?.metadata.percentage).toBe(50); // Default when no peers
    });
  });

  describe('generateSocialNorm - Social norm framing', () => {
    it('should generate positive message when user is aligned with norm', async () => {
      mockPrisma.user.count.mockResolvedValue(1000);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue(
        Array.from({ length: 750 }, (_, i) => ({ userId: `u${i}` })),
      );

      // User has high activity (aligned)
      mockPrisma.behaviorLog.count.mockResolvedValue(25);

      const result = await service.generateSocialNorm('u1', 'SAVINGS_HABIT');

      expect(result).toBeDefined();
      expect(result?.type).toBe('SOCIAL_PROOF');
      expect(result?.metadata.comparisonType).toBe('SOCIAL_NORM');
      expect(result?.metadata.percentage).toBe(75); // 750/1000
      expect(result?.priority).toBe('LOW'); // User aligned = low urgency
      expect(result?.message.vi).toContain('Bạn là một trong');
      expect(result?.message.en).toContain('among the');
    });

    it('should generate motivational message when user is NOT aligned', async () => {
      mockPrisma.user.count.mockResolvedValue(1000);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue(
        Array.from({ length: 800 }, (_, i) => ({ userId: `u${i}` })),
      );

      // User has low activity (not aligned)
      mockPrisma.behaviorLog.count.mockResolvedValue(5);

      const result = await service.generateSocialNorm(
        'u1',
        'LEARNING_CONSISTENCY',
      );

      expect(result?.metadata.percentage).toBe(80);
      expect(result?.priority).toBe('HIGH'); // Not aligned = high urgency
      expect(result?.message.vi).toContain('Tham gia với họ');
      expect(result?.message.en).toContain('Join them');
    });

    it('should handle different behavior types', async () => {
      mockPrisma.user.count.mockResolvedValue(500);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue(
        Array.from({ length: 300 }, (_, i) => ({ userId: `u${i}` })),
      );
      mockPrisma.behaviorLog.count.mockResolvedValue(5);

      const savingsResult = await service.generateSocialNorm(
        'u1',
        'SAVINGS_HABIT',
      );
      expect(savingsResult?.message.vi).toContain('thói quen tiết kiệm');

      const investmentResult = await service.generateSocialNorm(
        'u1',
        'INVESTMENT_DIVERSIFICATION',
      );
      expect(investmentResult?.message.vi).toContain('đa dạng hóa đầu tư');

      const learningResult = await service.generateSocialNorm(
        'u1',
        'LEARNING_CONSISTENCY',
      );
      expect(learningResult?.message.vi).toContain('học tập đều đặn');
    });

    it('should return null if no social norm data available', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue([]);
      mockPrisma.behaviorLog.count.mockResolvedValue(0);

      const result = await service.generateSocialNorm('u1', 'SAVINGS_HABIT');

      // Should still return data with 0% but not null
      expect(result).toBeDefined();
      expect(result?.metadata.percentage).toBe(0);
    });
  });

  describe('getRealtimeActivity - Real-time social proof', () => {
    it('should get activity count for last 24 hours by default', async () => {
      mockPrisma.behaviorLog.count.mockResolvedValue(150);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue(
        Array.from({ length: 45 }, (_, i) => ({ userId: `u${i}` })),
      );

      const result = await service.getRealtimeActivity(
        'COURSE_VIEW',
        'course-123',
      );

      expect(result).toBeDefined();
      expect(result.actionCount).toBe(150);
      expect(result.uniqueUsers).toBe(45);
      expect(result.timeWindowHours).toBe(24);
      expect(result.targetId).toBe('course-123');
    });

    it('should support custom time windows', async () => {
      mockPrisma.behaviorLog.count.mockResolvedValue(50);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({ userId: `u${i}` })),
      );

      const result = await service.getRealtimeActivity(
        'INVESTMENT_MADE',
        'inv-456',
        1,
      );

      expect(result.actionCount).toBe(50);
      expect(result.uniqueUsers).toBe(20);
      expect(result.timeWindowHours).toBe(1);
    });

    it('should handle zero activity', async () => {
      mockPrisma.behaviorLog.count.mockResolvedValue(0);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue([]);

      const result = await service.getRealtimeActivity(
        'RARE_ACTION',
        'target-789',
      );

      expect(result.actionCount).toBe(0);
      expect(result.uniqueUsers).toBe(0);
    });
  });

  describe('Message localization', () => {
    it('should provide messages in all three locales (vi, en, zh)', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(
          Array.from({ length: 100 }, (_, i) => ({ userId: `u${i}` })),
        )
        .mockResolvedValueOnce(
          Array.from({ length: 85 }, (_, i) => ({ userId: `u${i}` })),
        );

      const result = await service.generateCohortMessage(
        'u1',
        'COURSE_COMPLETED',
      );

      expect(result?.message.vi).toBeTruthy();
      expect(result?.message.en).toBeTruthy();
      expect(result?.message.zh).toBeTruthy();
      expect(typeof result?.message.vi).toBe('string');
      expect(typeof result?.message.en).toBe('string');
      expect(typeof result?.message.zh).toBe('string');
    });

    it('should use appropriate language-specific terminology', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(
          Array.from({ length: 100 }, (_, i) => ({ userId: `u${i}` })),
        )
        .mockResolvedValueOnce(
          Array.from({ length: 90 }, (_, i) => ({ userId: `u${i}` })),
        );

      const result = await service.generateCohortMessage(
        'u1',
        'COURSE_COMPLETED',
        'c-123',
      );

      expect(result?.message.vi).toContain('hoàn thành khóa học này');
      expect(result?.message.en).toContain('completed this course');
      expect(result?.message.zh).toContain('完成了这门课程');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAnalytics.getUserPersona.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.generateCohortMessage('u1', 'ACTION'),
      ).rejects.toThrow('DB Error');
    });

    it('should handle missing investment profile', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        investmentProfile: null,
      });
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(
          Array.from({ length: 100 }, (_, i) => ({ userId: `u${i}` })),
        )
        .mockResolvedValueOnce(
          Array.from({ length: 70 }, (_, i) => ({ userId: `u${i}` })),
        );

      const result = await service.generateCohortMessage(
        'u1',
        'COURSE_COMPLETED',
      );

      expect(result).toBeDefined();
      expect(result?.metadata.percentage).toBe(70);
    });

    it('should round percentages correctly', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });

      // 67 out of 100 = 67%
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(
          Array.from({ length: 100 }, (_, i) => ({ userId: `u${i}` })),
        )
        .mockResolvedValueOnce(
          Array.from({ length: 67 }, (_, i) => ({ userId: `u${i}` })),
        );

      const result = await service.generateCohortMessage('u1', 'ACTION');

      expect(result?.metadata.percentage).toBe(67);
    });

    it('should handle very small cohorts', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });

      // 2 out of 3 users
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce([
          { userId: 'u1' },
          { userId: 'u2' },
          { userId: 'u3' },
        ])
        .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }]);

      const result = await service.generateCohortMessage('u1', 'ACTION');

      expect(result?.metadata.cohortSize).toBe(3);
      expect(result?.metadata.percentage).toBe(67); // Rounded from 66.67
    });
  });

  describe('Priority calculation', () => {
    it('should assign HIGH priority for >= 75%', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(
          Array.from({ length: 100 }, (_, i) => ({ userId: `u${i}` })),
        )
        .mockResolvedValueOnce(
          Array.from({ length: 75 }, (_, i) => ({ userId: `u${i}` })),
        );

      const result = await service.generateCohortMessage('u1', 'ACTION');

      expect(result?.priority).toBe('HIGH');
    });

    it('should assign MEDIUM priority for 50-74%', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(
          Array.from({ length: 100 }, (_, i) => ({ userId: `u${i}` })),
        )
        .mockResolvedValueOnce(
          Array.from({ length: 50 }, (_, i) => ({ userId: `u${i}` })),
        );

      const result = await service.generateCohortMessage('u1', 'ACTION');

      expect(result?.priority).toBe('MEDIUM');
    });

    it('should assign LOW priority for < 50%', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(
          Array.from({ length: 100 }, (_, i) => ({ userId: `u${i}` })),
        )
        .mockResolvedValueOnce(
          Array.from({ length: 49 }, (_, i) => ({ userId: `u${i}` })),
        );

      const result = await service.generateCohortMessage('u1', 'ACTION');

      expect(result?.priority).toBe('LOW');
    });
  });

  describe('Metadata accuracy', () => {
    it('should include accurate cohort metadata', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(
          Array.from({ length: 250 }, (_, i) => ({ userId: `u${i}` })),
        )
        .mockResolvedValueOnce(
          Array.from({ length: 200 }, (_, i) => ({ userId: `u${i}` })),
        );

      const result = await service.generateCohortMessage('u1', 'ACTION');

      expect(result?.metadata).toEqual({
        cohortSize: 250,
        percentage: 80,
        comparisonType: 'SIMILAR_USERS',
      });
    });

    it('should include accurate peer metadata', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.behaviorLog.count.mockResolvedValue(60);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue(
        Array.from({ length: 50 }, (_, i) => ({
          userId: `u${i}`,
          _count: i * 2,
        })),
      );

      const result = await service.generatePeerComparison('u1', 'LEARNING');

      expect(result?.metadata.cohortSize).toBe(50);
      expect(result?.metadata.comparisonType).toBe('PEERS');
      expect(typeof result?.metadata.percentage).toBe('number');
    });

    it('should include accurate social norm metadata', async () => {
      mockPrisma.user.count.mockResolvedValue(500);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue(
        Array.from({ length: 400 }, (_, i) => ({ userId: `u${i}` })),
      );
      mockPrisma.behaviorLog.count.mockResolvedValue(15);

      const result = await service.generateSocialNorm('u1', 'SAVINGS_HABIT');

      expect(result?.metadata).toEqual({
        cohortSize: 500,
        percentage: 80,
        comparisonType: 'SOCIAL_NORM',
      });
    });
  });
});
