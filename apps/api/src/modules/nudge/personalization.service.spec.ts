import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { NudgeEngineService, NudgeType } from './nudge-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

/**
 * Comprehensive test suite for nudge personalization
 * Target coverage: 85%+
 *
 * Test areas:
 * 1. Persona-based nudging (HUNTER/SAVER/OBSERVER)
 * 2. Behavior-adaptive messaging
 * 3. Engagement optimization
 * 4. Context-specific triggers
 */
describe('NudgeEngineService - Personalization', () => {
  let service: NudgeEngineService;
  let mockPrisma: any;
  let mockAnalytics: any;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    investmentProfile: {
      riskTolerance: 'MEDIUM',
      preferredCategories: ['STOCKS', 'BONDS'],
    },
  };

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      behaviorLog: {
        count: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
    };

    mockAnalytics = {
      getUserPersona: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NudgeEngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AnalyticsService, useValue: mockAnalytics },
      ],
    }).compile();

    service = module.get<NudgeEngineService>(NudgeEngineService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Persona-Based Nudging', () => {
    describe('HUNTER Persona (Risk-Taker)', () => {
      it('should deliver SOCIAL_PROOF nudge emphasizing competition', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const nudge = await service.generateNudge(
          'test-user-id',
          'INVESTMENT_DECISION',
          {
            riskLevel: 60,
          },
        );

        expect(nudge).toBeDefined();
        expect(nudge.type).toBe(NudgeType.SOCIAL_PROOF);
        expect(nudge.priority).toBe('HIGH');
        expect(nudge.message.vi).toContain('Thách thức');
        expect(nudge.message.vi).toContain('10%');
        expect(nudge.message.en).toContain('Challenge');
      });

      it('should maintain high engagement for HUNTER persona', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const nudge = await service.generateNudge(
          'test-user-id',
          'INVESTMENT_DECISION',
          {
            riskLevel: 70,
          },
        );

        expect(nudge.priority).toBe('HIGH');
        expect(nudge.message.vi).toMatch(/thách thức|cạnh tranh|top/i);
      });

      it('should use competitive language for HUNTER', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const nudge = await service.generateNudge(
          'test-user-id',
          'INVESTMENT_DECISION',
          {},
        );

        expect(nudge.message.vi).toContain('theo kịp');
        expect(nudge.message.en).toContain('keep up');
        expect(nudge.message.zh).toContain('跟上');
      });
    });

    describe('SAVER Persona (Conservative)', () => {
      it('should deliver LOSS_AVERSION nudge for high-risk scenarios', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const nudge = await service.generateNudge(
          'test-user-id',
          'INVESTMENT_DECISION',
          {
            riskLevel: 85,
          },
        );

        expect(nudge).toBeDefined();
        expect(nudge.type).toBe(NudgeType.LOSS_AVERSION);
        expect(nudge.priority).toBe('HIGH');
        expect(nudge.message.vi).toContain('Thận trọng');
        expect(nudge.message.vi).toContain('mất');
      });

      it('should prioritize GOAL_GRADIENT for budgeting context', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const nudge = await service.generateNudge('test-user-id', 'BUDGETING', {
          amount: 250000,
        });

        expect(nudge.type).toBe(NudgeType.GOAL_GRADIENT);
        expect(nudge.priority).toBe('HIGH');
        expect(nudge.message.vi).toContain('mục tiêu');
      });

      it('should emphasize security and caution for SAVER', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const nudge = await service.generateNudge(
          'test-user-id',
          'INVESTMENT_DECISION',
          {
            riskLevel: 90,
          },
        );

        expect(nudge.message.vi).toMatch(/thận trọng|mất|rủi ro/i);
        expect(nudge.message.en).toContain('Caution');
      });

      it('should calculate progress correctly for SAVER budgeting', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const nudge = await service.generateNudge('test-user-id', 'BUDGETING', {
          amount: 400000, // 8 steps (400k / 50k)
        });

        expect(nudge.message.vi).toContain('2 bước nữa'); // 10 - 8 = 2
        expect(nudge.message.en).toContain('2 more steps');
      });
    });

    describe('OBSERVER Persona (Passive)', () => {
      it('should deliver default SOCIAL_PROOF nudge', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const nudge = await service.generateNudge(
          'test-user-id',
          'INVESTMENT_DECISION',
          {
            riskLevel: 50,
          },
        );

        expect(nudge.type).toBe(NudgeType.SOCIAL_PROOF);
        expect(nudge.priority).toBe('MEDIUM');
        expect(nudge.message.vi).toContain('85%');
      });

      it('should use neutral language for OBSERVER', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const nudge = await service.generateNudge('test-user-id', 'BUDGETING', {
          amount: 100000,
        });

        expect(nudge.type).toBe(NudgeType.SALIENCE);
        expect(nudge.priority).toBe('LOW');
        expect(nudge.message.vi).toContain('tương đương');
      });

      it('should provide informative mapping for OBSERVER budgeting', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const nudge = await service.generateNudge('test-user-id', 'BUDGETING', {
          amount: 150000, // 3 coffee cups
        });

        expect(nudge.message.vi).toContain('3 ly cà phê');
        expect(nudge.message.en).toContain('3 cups of coffee');
      });
    });
  });

  describe('Behavior-Adaptive Messaging', () => {
    it('should adapt message based on risk level threshold', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const highRiskNudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {
          riskLevel: 85,
        },
      );

      expect(highRiskNudge.type).toBe(NudgeType.LOSS_AVERSION);
      expect(highRiskNudge.priority).toBe('HIGH');

      const lowRiskNudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {
          riskLevel: 30,
        },
      );

      expect(lowRiskNudge.type).toBe(NudgeType.SOCIAL_PROOF);
    });

    it('should calculate real-world value mapping correctly', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge('test-user-id', 'BUDGETING', {
        amount: 500000, // 10 coffee cups
      });

      expect(nudge.message.vi).toContain('10 ly cà phê');
      expect(nudge.message.zh).toContain('10 杯咖啡');
    });

    it('should override persona logic when risk is critically high', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {
          riskLevel: 95, // Critical risk level
        },
      );

      expect(nudge.type).toBe(NudgeType.LOSS_AVERSION);
      expect(nudge.priority).toBe('HIGH');
    });

    it('should maintain persona preference when risk is moderate', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {
          riskLevel: 60,
        },
      );

      expect(nudge.type).toBe(NudgeType.SOCIAL_PROOF);
      expect(nudge.message.vi).toContain('Thách thức');
    });
  });

  describe('Context-Specific Triggers', () => {
    it('should handle INVESTMENT_DECISION context', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {},
      );

      expect(nudge).toBeDefined();
      expect(nudge.type).toBe(NudgeType.SOCIAL_PROOF);
    });

    it('should handle BUDGETING context', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge('test-user-id', 'BUDGETING', {
        amount: 100000,
      });

      expect(nudge).toBeDefined();
      expect([NudgeType.GOAL_GRADIENT, NudgeType.SALIENCE]).toContain(
        nudge.type,
      );
    });

    it('should handle STREAK_WARNING context', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge(
        'test-user-id',
        'STREAK_WARNING',
        {},
      );

      expect(nudge).toBeDefined();
      expect(nudge.type).toBe(NudgeType.GOAL_GRADIENT);
      expect(nudge.message.vi).toContain('90%');
    });

    it('should handle SOCIAL_PROOF_REALTIME context', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.behaviorLog.count.mockResolvedValue(42);

      const nudge = await service.generateNudge(
        'test-user-id',
        'SOCIAL_PROOF_REALTIME',
        {},
      );

      expect(nudge).toBeDefined();
      expect(nudge.type).toBe(NudgeType.SOCIAL_PROOF);
      expect(nudge.message.vi).toContain('42');
    });

    it('should return null for unknown context', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge(
        'test-user-id',
        'UNKNOWN_CONTEXT',
        {},
      );

      expect(nudge).toBeNull();
    });
  });

  describe('Engagement Optimization', () => {
    it('should prioritize HIGH for streak-critical situations', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge(
        'test-user-id',
        'STREAK_WARNING',
        {},
      );

      expect(nudge.priority).toBe('HIGH');
    });

    it('should prioritize HIGH for HUNTER investment decisions', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {},
      );

      expect(nudge.priority).toBe('HIGH');
    });

    it('should prioritize HIGH for SAVER loss aversion', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {
          riskLevel: 85,
        },
      );

      expect(nudge.priority).toBe('HIGH');
    });

    it('should prioritize MEDIUM for default social proof', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {
          riskLevel: 50,
        },
      );

      expect(nudge.priority).toBe('MEDIUM');
    });

    it('should prioritize LOW for OBSERVER budgeting nudges', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge('test-user-id', 'BUDGETING', {
        amount: 100000,
      });

      expect(nudge.priority).toBe('LOW');
    });
  });

  describe('Realtime Social Proof', () => {
    it('should fetch realtime social proof data', async () => {
      mockPrisma.behaviorLog.count.mockResolvedValue(127);

      const result = await service.getRealtimeSocialProof(
        'COURSE_COMPLETE',
        'course-123',
      );

      expect(result.count).toBe(127);
      expect(result.action).toBe('COURSE_COMPLETE');
      expect(result.targetId).toBe('course-123');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should query behavior logs from last 24 hours', async () => {
      mockPrisma.behaviorLog.count.mockResolvedValue(50);

      await service.getRealtimeSocialProof('LESSON_VIEW', 'lesson-456');

      expect(mockPrisma.behaviorLog.count).toHaveBeenCalledWith({
        where: {
          eventType: 'LESSON_VIEW',
          path: { contains: 'lesson-456' },
          timestamp: expect.objectContaining({ gte: expect.any(Date) }),
        },
      });
    });

    it('should generate realtime social nudge when users are active', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.behaviorLog.count.mockResolvedValue(89);

      const nudge = await service.generateNudge(
        'test-user-id',
        'SOCIAL_PROOF_REALTIME',
        {},
      );

      expect(nudge.type).toBe(NudgeType.SOCIAL_PROOF);
      expect(nudge.message.vi).toContain('89 người');
      expect(nudge.message.en).toContain('89 friends');
    });

    it('should return null when no active users in last 24h', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.behaviorLog.count.mockResolvedValue(0);

      const nudge = await service.generateNudge(
        'test-user-id',
        'SOCIAL_PROOF_REALTIME',
        {},
      );

      expect(nudge).toBeNull();
    });
  });

  describe('Multi-Language Support', () => {
    it('should provide Vietnamese translations', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {},
      );

      expect(nudge.message.vi).toBeDefined();
      expect(typeof nudge.message.vi).toBe('string');
      expect(nudge.message.vi.length).toBeGreaterThan(0);
    });

    it('should provide English translations', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge('test-user-id', 'BUDGETING', {
        amount: 100000,
      });

      expect(nudge.message.en).toBeDefined();
      expect(typeof nudge.message.en).toBe('string');
      expect(nudge.message.en.length).toBeGreaterThan(0);
    });

    it('should provide Chinese translations', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge(
        'test-user-id',
        'STREAK_WARNING',
        {},
      );

      expect(nudge.message.zh).toBeDefined();
      expect(typeof nudge.message.zh).toBe('string');
      expect(nudge.message.zh.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user gracefully', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.generateNudge('non-existent-user', 'INVESTMENT_DECISION', {}),
      ).rejects.toThrow();
    });

    it('should handle zero amount in budgeting', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge('test-user-id', 'BUDGETING', {
        amount: 0,
      });

      expect(nudge.message.vi).toContain('0 ly cà phê');
    });

    it('should handle very large amounts in budgeting', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge('test-user-id', 'BUDGETING', {
        amount: 10000000, // 200 coffee cups
      });

      expect(nudge.message.vi).toContain('200 ly cà phê');
    });

    it('should handle missing data object', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        null,
      );

      expect(nudge).toBeDefined();
    });

    it('should handle undefined risk level', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const nudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {},
      );

      expect(nudge.type).toBe(NudgeType.SOCIAL_PROOF);
    });
  });

  describe('Integration Scenarios', () => {
    it('should deliver cohesive persona journey for HUNTER', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const investmentNudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {
          riskLevel: 70,
        },
      );
      expect(investmentNudge.type).toBe(NudgeType.SOCIAL_PROOF);
      expect(investmentNudge.message.vi).toContain('Thách thức');

      const streakNudge = await service.generateNudge(
        'test-user-id',
        'STREAK_WARNING',
        {},
      );
      expect(streakNudge.type).toBe(NudgeType.GOAL_GRADIENT);
    });

    it('should deliver cohesive persona journey for SAVER', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const budgetNudge = await service.generateNudge(
        'test-user-id',
        'BUDGETING',
        {
          amount: 300000,
        },
      );
      expect(budgetNudge.type).toBe(NudgeType.GOAL_GRADIENT);

      const riskNudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {
          riskLevel: 85,
        },
      );
      expect(riskNudge.type).toBe(NudgeType.LOSS_AVERSION);
    });

    it('should adapt dynamically to changing user behavior', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      mockAnalytics.getUserPersona.mockResolvedValueOnce('OBSERVER');
      const observerNudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {
          riskLevel: 50,
        },
      );
      expect(observerNudge.priority).toBe('MEDIUM');

      mockAnalytics.getUserPersona.mockResolvedValueOnce('HUNTER');
      const hunterNudge = await service.generateNudge(
        'test-user-id',
        'INVESTMENT_DECISION',
        {
          riskLevel: 50,
        },
      );
      expect(hunterNudge.priority).toBe('HIGH');
    });
  });
});
