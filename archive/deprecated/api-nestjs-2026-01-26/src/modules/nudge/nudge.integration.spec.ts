import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiService } from '../../ai/ai.service';
import { GamificationService } from '../../common/gamification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NudgeEngineService, NudgeType } from './nudge-engine.service';
import { NudgeListener } from './nudge.listener';
import { NudgeService } from './nudge.service';

describe('Nudge System Integration Tests', () => {
  let nudgeService: NudgeService;
  let nudgeEngine: NudgeEngineService;
  let nudgeListener: NudgeListener;
  let eventEmitter: EventEmitter2;
  let prismaService: any;
  let analyticsService: any;
  let gamificationService: any;
  let aiService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: vi.fn(),
      },
      userStreak: {
        findMany: vi.fn(),
      },
      behaviorLog: {
        create: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    analyticsService = {
      getUserPersona: vi.fn(),
    };

    gamificationService = {
      deductPoints: vi.fn(),
      awardPoints: vi.fn(),
    };

    aiService = {
      modelInstance: {
        generateContent: vi.fn(),
      },
    };

    eventEmitter = new EventEmitter2();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NudgeService,
        NudgeEngineService,
        NudgeListener,
        { provide: PrismaService, useValue: prismaService },
        { provide: AnalyticsService, useValue: analyticsService },
        { provide: GamificationService, useValue: gamificationService },
        { provide: AiService, useValue: aiService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    nudgeService = module.get<NudgeService>(NudgeService);
    nudgeEngine = module.get<NudgeEngineService>(NudgeEngineService);
    nudgeListener = module.get<NudgeListener>(NudgeListener);

    // Manual bindings for NudgeService dependencies
    (nudgeService as any).prisma = prismaService;

    // Manual bindings for NudgeEngineService dependencies
    (nudgeEngine as any).prisma = prismaService;
    (nudgeEngine as any).analytics = analyticsService;
    (nudgeEngine as any).aiService = aiService;

    // Manual bindings for NudgeListener dependencies
    (nudgeListener as any).nudgeEngine = nudgeEngine;
    (nudgeListener as any).prisma = prismaService;
    (nudgeListener as any).gamification = gamificationService;
  });

  describe('End-to-End Nudge Flows', () => {
    it('should complete full streak warning flow: trigger → nudge → log', async () => {
      const mockUser = {
        userId: 'user-1',
        currentStreak: 10,
        lastActivityDate: new Date(Date.now() - 21 * 60 * 60 * 1000),
        streakFrozen: false,
        user: { id: 'user-1', email: 'test@example.com' },
      };

      prismaService.userStreak.findMany.mockResolvedValue([mockUser]);
      prismaService.behaviorLog.create.mockResolvedValue({
        id: 'log-1',
        userId: 'user-1',
        eventType: 'STREAK_NUDGE_SENT',
      });

      await nudgeService.handleStreakNudges();

      expect(prismaService.userStreak.findMany).toHaveBeenCalledTimes(1);
      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            eventType: 'STREAK_NUDGE_SENT',
            sessionId: 'nudge-system',
            path: '/nudge/streak-warning',
            payload: expect.objectContaining({
              currentStreak: 10,
              message: expect.stringContaining('10-day streak'),
            }),
          }),
        }),
      );
    });

    it('should complete investment decision flow: request → persona analysis → nudge generation', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'hunter@example.com',
        investmentProfile: { riskTolerance: 'HIGH' },
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('HUNTER');

      const nudge = await nudgeEngine.generateNudge(
        'user-1',
        'INVESTMENT_DECISION',
        {
          riskLevel: 50,
        },
      );

      expect(analyticsService.getUserPersona).toHaveBeenCalledWith('user-1');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { investmentProfile: true },
      });
      expect(nudge).toEqual({
        type: NudgeType.SOCIAL_PROOF,
        message: expect.objectContaining({
          vi: expect.stringContaining('10% nhà đầu tư hàng đầu'),
          en: expect.stringContaining('top 10% of investors'),
          zh: expect.stringContaining('前 10% 的投资者'),
        }),
        priority: 'HIGH',
      });
    });

    it('should complete budgeting flow with SAVER persona: context → persona → mapping nudge', async () => {
      const mockUser = {
        id: 'user-2',
        email: 'saver@example.com',
        investmentProfile: { riskTolerance: 'LOW' },
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('SAVER');

      const nudge = await nudgeEngine.generateNudge('user-2', 'BUDGETING', {
        amount: 250000,
      });

      expect(nudge).toEqual({
        type: NudgeType.GOAL_GRADIENT,
        message: expect.objectContaining({
          vi: expect.stringContaining('mục tiêu tiết kiệm'),
          en: expect.stringContaining('savings goal'),
          zh: expect.stringContaining('储蓄目标'),
        }),
        priority: 'HIGH',
      });
    });

    it('should complete social proof flow with realtime data aggregation', async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      prismaService.behaviorLog.count.mockResolvedValue(42);

      const socialProof = await nudgeEngine.getRealtimeSocialProof(
        'COURSE_COMPLETED',
        'course-123',
      );

      expect(prismaService.behaviorLog.count).toHaveBeenCalledWith({
        where: {
          eventType: 'COURSE_COMPLETED',
          path: { contains: 'course-123' },
          timestamp: { gte: expect.any(Date) },
        },
      });
      expect(socialProof).toEqual({
        count: 42,
        action: 'COURSE_COMPLETED',
        targetId: 'course-123',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('Trigger → Reward → Notification Pipeline', () => {
    it('should process points.earned event → generate nudge → log behavior', async () => {
      const payload = {
        userId: 'sim-user-1',
        eventType: 'LESSON_COMPLETED',
        metadata: {
          isSimulation: true,
          triggerNudge: true,
          nudgeContext: 'STREAK_WARNING',
          nudgeData: { streak: 5 },
        },
      };

      const mockUser = {
        id: 'sim-user-1',
        investmentProfile: null,
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('GENERAL');
      prismaService.behaviorLog.create.mockResolvedValue({
        id: 'log-1',
        eventType: 'AI_DRIVEN_NUDGE',
      });

      await nudgeListener.handlePointsEarnedEvent(payload);

      expect(analyticsService.getUserPersona).toHaveBeenCalledWith(
        'sim-user-1',
      );
      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'sim-user-1',
            sessionId: 'simulation-system',
            path: '/gamification/nudge',
            eventType: 'AI_DRIVEN_NUDGE',
            payload: expect.objectContaining({
              originalEvent: 'LESSON_COMPLETED',
            }),
          }),
        }),
      );
    });

    it('should handle nudge.request event → generate personalized nudge', async () => {
      const payload = {
        userId: 'user-3',
        context: 'INVESTMENT_DECISION',
        data: { riskLevel: 95 },
      };

      const mockUser = {
        id: 'user-3',
        investmentProfile: { riskTolerance: 'LOW' },
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('SAVER');

      await nudgeListener.handleNudgeRequest(payload);

      expect(analyticsService.getUserPersona).toHaveBeenCalledWith('user-3');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-3' },
        include: { investmentProfile: true },
      });
    });

    it('should handle points.deduct event → call gamification service', async () => {
      const payload = {
        userId: 'user-4',
        points: 50,
        reason: 'PENALTY_MISSED_GOAL',
      };

      gamificationService.deductPoints.mockResolvedValue({
        success: true,
        newBalance: 150,
      });

      await nudgeListener.handlePointsDeduct(payload);

      expect(gamificationService.deductPoints).toHaveBeenCalledWith(
        'user-4',
        50,
        'PENALTY_MISSED_GOAL',
      );
    });

    it('should handle failed point deduction gracefully', async () => {
      const payload = {
        userId: 'user-5',
        points: 100,
        reason: 'INVALID_REASON',
      };

      gamificationService.deductPoints.mockRejectedValue(
        new Error('Insufficient points'),
      );

      await expect(
        nudgeListener.handlePointsDeduct(payload),
      ).resolves.not.toThrow();
      expect(gamificationService.deductPoints).toHaveBeenCalledWith(
        'user-5',
        100,
        'INVALID_REASON',
      );
    });
  });

  describe('Cross-Service Integration', () => {
    it('should integrate with Analytics service for persona-driven nudges', async () => {
      const mockUser = {
        id: 'user-6',
        investmentProfile: null,
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('HUNTER');

      const nudge = await nudgeEngine.generateNudge(
        'user-6',
        'INVESTMENT_DECISION',
        {
          riskLevel: 30,
        },
      );

      expect(analyticsService.getUserPersona).toHaveBeenCalledTimes(1);
      expect(nudge.type).toBe(NudgeType.SOCIAL_PROOF);
      expect(nudge.priority).toBe('HIGH');
    });

    it('should integrate with Prisma for streak data retrieval and logging', async () => {
      const mockStreaks = [
        {
          userId: 'user-7',
          currentStreak: 3,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-7' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockStreaks);
      prismaService.behaviorLog.create.mockResolvedValue({ id: 'log-2' });

      await nudgeService.handleStreakNudges();

      expect(prismaService.userStreak.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            currentStreak: { gt: 0 },
            streakFrozen: false,
          }),
          include: { user: true },
        }),
      );
      expect(prismaService.behaviorLog.create).toHaveBeenCalledTimes(1);
    });

    it('should integrate with Gamification service for point adjustments', async () => {
      const payload = {
        userId: 'user-8',
        points: 25,
        reason: 'STREAK_BROKEN',
      };

      gamificationService.deductPoints.mockResolvedValue({
        userId: 'user-8',
        pointsDeducted: 25,
        totalPoints: 75,
      });

      await nudgeListener.handlePointsDeduct(payload);

      expect(gamificationService.deductPoints).toHaveBeenCalledWith(
        'user-8',
        25,
        'STREAK_BROKEN',
      );
    });
  });

  describe('Mock Dependencies Validation', () => {
    it('should mock PrismaService correctly', () => {
      expect(prismaService.user.findUnique).toBeDefined();
      expect(prismaService.userStreak.findMany).toBeDefined();
      expect(prismaService.behaviorLog.create).toBeDefined();
      expect(prismaService.behaviorLog.count).toBeDefined();
    });

    it('should mock AnalyticsService correctly', () => {
      expect(analyticsService.getUserPersona).toBeDefined();
    });

    it('should mock GamificationService correctly', () => {
      expect(gamificationService.deductPoints).toBeDefined();
      expect(gamificationService.awardPoints).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle user not found in database', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      analyticsService.getUserPersona.mockResolvedValue('GENERAL');

      await expect(
        nudgeEngine.generateNudge(
          'nonexistent-user',
          'INVESTMENT_DECISION',
          {},
        ),
      ).rejects.toThrow('User not found');
    });

    it('should handle invalid nudge context gracefully', async () => {
      const mockUser = { id: 'user-9', investmentProfile: null };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('GENERAL');

      const nudge = await nudgeEngine.generateNudge(
        'user-9',
        'INVALID_CONTEXT',
        {},
      );

      expect(nudge).toBeNull();
    });

    it('should handle failed behavior logging without crashing', async () => {
      const payload = {
        userId: 'user-10',
        eventType: 'LESSON_COMPLETED',
        metadata: {
          isSimulation: true,
          triggerNudge: true,
          nudgeContext: 'GENERAL',
        },
      };

      prismaService.user.findUnique.mockResolvedValue({ id: 'user-10' });
      analyticsService.getUserPersona.mockResolvedValue('GENERAL');
      prismaService.behaviorLog.create.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(
        nudgeListener.handlePointsEarnedEvent(payload),
      ).resolves.not.toThrow();
    });

    it('should skip nudge generation if simulation flag is false', async () => {
      const payload = {
        userId: 'user-11',
        eventType: 'LESSON_COMPLETED',
        metadata: {
          isSimulation: false,
        },
      };

      await nudgeListener.handlePointsEarnedEvent(payload);

      expect(analyticsService.getUserPersona).not.toHaveBeenCalled();
      expect(prismaService.behaviorLog.create).not.toHaveBeenCalled();
    });

    it('should handle high-risk investment with SAVER persona', async () => {
      const mockUser = {
        id: 'user-12',
        investmentProfile: { riskTolerance: 'LOW' },
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('SAVER');

      const nudge = await nudgeEngine.generateNudge(
        'user-12',
        'INVESTMENT_DECISION',
        {
          riskLevel: 95,
        },
      );

      expect(nudge).toEqual({
        type: NudgeType.LOSS_AVERSION,
        message: expect.objectContaining({
          vi: expect.stringContaining('Thận trọng'),
          en: expect.stringContaining('Caution'),
        }),
        priority: 'HIGH',
      });
    });

    it('should handle empty streak list without errors', async () => {
      prismaService.userStreak.findMany.mockResolvedValue([]);

      await nudgeService.handleStreakNudges();

      expect(prismaService.behaviorLog.create).not.toHaveBeenCalled();
    });
  });

  describe('Multi-Language Support', () => {
    it('should return nudges with all three language variants', async () => {
      const mockUser = { id: 'user-13', investmentProfile: null };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('GENERAL');

      const nudge = await nudgeEngine.generateNudge(
        'user-13',
        'INVESTMENT_DECISION',
        {
          riskLevel: 40,
        },
      );

      expect(nudge.message).toHaveProperty('vi');
      expect(nudge.message).toHaveProperty('en');
      expect(nudge.message).toHaveProperty('zh');
      expect(nudge.message.vi).toBeTruthy();
      expect(nudge.message.en).toBeTruthy();
      expect(nudge.message.zh).toBeTruthy();
    });

    it('should provide localized budgeting nudges', async () => {
      const mockUser = { id: 'user-14', investmentProfile: null };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('HUNTER');

      const nudge = await nudgeEngine.generateNudge('user-14', 'BUDGETING', {
        amount: 150000,
      });

      expect(nudge.message.vi).toContain('cà phê');
      expect(nudge.message.en).toContain('coffee');
      expect(nudge.message.zh).toContain('咖啡');
    });
  });

  describe('Behavioral Psychology Tactics', () => {
    it('should apply Social Proof tactic for HUNTER persona', async () => {
      const mockUser = { id: 'user-15', investmentProfile: null };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('HUNTER');

      const nudge = await nudgeEngine.generateNudge(
        'user-15',
        'INVESTMENT_DECISION',
        {},
      );

      expect(nudge.type).toBe(NudgeType.SOCIAL_PROOF);
      expect(nudge.message.en).toContain('top 10%');
    });

    it('should apply Loss Aversion tactic for high-risk scenarios', async () => {
      const mockUser = { id: 'user-16', investmentProfile: null };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('SAVER');

      const nudge = await nudgeEngine.generateNudge(
        'user-16',
        'INVESTMENT_DECISION',
        {
          riskLevel: 85,
        },
      );

      expect(nudge.type).toBe(NudgeType.LOSS_AVERSION);
      expect(nudge.message.en).toContain('20%');
    });

    it('should apply Goal Gradient tactic for streak warnings', async () => {
      const mockUser = { id: 'user-17', investmentProfile: null };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('GENERAL');

      const nudge = await nudgeEngine.generateNudge(
        'user-17',
        'STREAK_WARNING',
        {},
      );

      expect(nudge.type).toBe(NudgeType.GOAL_GRADIENT);
      expect(nudge.message.en).toContain('90%');
    });

    it('should apply Salience tactic with mapping for budgeting', async () => {
      const mockUser = { id: 'user-18', investmentProfile: null };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('HUNTER');

      const nudge = await nudgeEngine.generateNudge('user-18', 'BUDGETING', {
        amount: 200000,
      });

      expect(nudge.type).toBe(NudgeType.SALIENCE);
      expect(nudge.message.vi).toContain('ly cà phê');
    });
  });

  describe('Realtime Social Proof Integration', () => {
    it('should aggregate activity counts for social proof nudge', async () => {
      const mockUser = { id: 'user-19', investmentProfile: null };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('GENERAL');
      prismaService.behaviorLog.count.mockResolvedValue(127);

      const nudge = await nudgeEngine.generateNudge(
        'user-19',
        'SOCIAL_PROOF_REALTIME',
        {},
      );

      expect(prismaService.behaviorLog.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: { gte: expect.any(Date) },
          }),
        }),
      );
      expect(nudge.message.en).toContain('127 friends');
    });

    it('should return null if no active users found', async () => {
      const mockUser = { id: 'user-20', investmentProfile: null };
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      analyticsService.getUserPersona.mockResolvedValue('GENERAL');
      prismaService.behaviorLog.count.mockResolvedValue(0);

      const nudge = await nudgeEngine.generateNudge(
        'user-20',
        'SOCIAL_PROOF_REALTIME',
        {},
      );

      expect(nudge).toBeNull();
    });
  });
});
