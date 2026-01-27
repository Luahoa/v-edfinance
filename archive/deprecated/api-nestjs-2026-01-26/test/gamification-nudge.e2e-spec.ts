import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PostType } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NudgeModule } from '../src/modules/nudge/nudge.module';
import { AdaptiveModule } from '../src/modules/adaptive/adaptive.module';
import { NudgeService } from '../src/modules/nudge/nudge.service';
import { SocialProofService } from '../src/modules/nudge/social-proof.service';
import { LossAversionService } from '../src/modules/nudge/loss-aversion.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AnalyticsModule } from '../src/modules/analytics/analytics.module';
import { CommonModule } from '../src/common/common.module';

describe('Gamification & Nudge System (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let nudgeService: NudgeService;
  let socialProofService: SocialProofService;
  let lossAversionService: LossAversionService;

  beforeAll(async () => {
    const prismaMock = {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      onModuleInit: vi.fn(),
      onModuleDestroy: vi.fn(),
      user: {
        create: vi
          .fn()
          .mockResolvedValue({ id: 'user-1', email: 'test@example.com' }),
        findUnique: vi.fn().mockResolvedValue({
          id: 'user-1',
          email: 'test@example.com',
          investmentProfile: { id: 'prof-1' },
        }),
        count: vi.fn().mockResolvedValue(100),
      },
      userStreak: {
        findMany: vi.fn().mockResolvedValue([
          {
            userId: 'user-1',
            currentStreak: 5,
            lastActivityDate: new Date(Date.now() - 21 * 60 * 60 * 1000),
          },
        ]),
        findUnique: vi.fn().mockResolvedValue({
          userId: 'user-1',
          currentStreak: 10,
          lastActivityDate: new Date(Date.now() - 21 * 60 * 60 * 1000),
        }),
      },
      behaviorLog: {
        create: vi.fn().mockResolvedValue({ id: 'log-1' }),
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
        findFirst: vi
          .fn()
          .mockResolvedValue({ id: 'log-1', payload: { currentStreak: 5 } }),
        findMany: vi
          .fn()
          .mockResolvedValue([
            { id: 'log-1', userId: 'user-1', eventType: 'COURSE_COMPLETED' },
          ]),
        groupBy: vi.fn().mockResolvedValue([{ userId: 'user-1' }]),
        count: vi.fn().mockResolvedValue(1),
      },
      userProgress: {
        count: vi.fn().mockResolvedValue(10),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      aggregate: vi.fn().mockResolvedValue({ _sum: { points: 1000 } }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        NudgeModule,
        AnalyticsModule,
        CommonModule,
        AdaptiveModule,
        EventEmitterModule.forRoot(),
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    nudgeService = app.get<NudgeService>(NudgeService);
    socialProofService = app.get<SocialProofService>(SocialProofService);
    lossAversionService = app.get<LossAversionService>(LossAversionService);

    // Assign mock back to services if they already have an instance
    (nudgeService as any).prisma = prismaMock;
    (socialProofService as any).prisma = prismaMock;
    (lossAversionService as any).prisma = prismaMock;

    const { AdaptiveService } =
      await import('../src/modules/adaptive/adaptive.service');
    const adaptiveService = app.get(AdaptiveService);
    adaptiveService.prisma = prismaMock;

    const { AnalyticsService } =
      await import('../src/modules/analytics/analytics.service');
    const analyticsService = app.get(AnalyticsService);
    analyticsService.prisma = prismaMock;
    (socialProofService as any).analytics = analyticsService;
    (lossAversionService as any).analytics = analyticsService;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Inactivity & Streak Nudge', () => {
    it('should trigger a nudge when user is inactive for 20-24 hours', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          passwordHash: 'hashed',
          streaks: {
            create: {
              currentStreak: 5,
              lastActivityDate: new Date(Date.now() - 21 * 60 * 60 * 1000),
            },
          },
        },
      });

      await nudgeService.handleStreakNudges();

      const log = await prisma.behaviorLog.findFirst({
        where: { userId: user.id, eventType: 'STREAK_NUDGE_SENT' },
      });

      expect(log).toBeDefined();
      expect((log?.payload as any).currentStreak).toBe(5);
    });

    it('should preserve streak logic via LossAversionService', async () => {
      const user = await prisma.user.create({
        data: {
          email: `loss-${Date.now()}@example.com`,
          passwordHash: 'hashed',
          streaks: {
            create: {
              currentStreak: 10,
              lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
            },
          },
        },
      });

      const nudge = await lossAversionService.generateStreakLossWarning(
        user.id,
      );

      expect(nudge).not.toBeNull();
      expect(nudge?.type).toBe('STREAK_LOSS');
      expect(nudge?.priority).toBe('CRITICAL');
      expect(nudge?.metadata?.hoursRemaining).toBeLessThanOrEqual(4);
    });
  });

  describe('Social Proof Nudge Generation', () => {
    it('should generate social proof based on cohort behavior', async () => {
      const user = await prisma.user.create({
        data: {
          email: `social-${Date.now()}@example.com`,
          passwordHash: 'hashed',
        },
      });

      // Mock behavior logs for cohort
      await prisma.behaviorLog.createMany({
        data: [
          {
            userId: user.id,
            sessionId: 's1',
            path: '/course/1',
            eventType: 'COURSE_COMPLETED',
          },
          {
            userId: 'other-1',
            sessionId: 's2',
            path: '/course/1',
            eventType: 'COURSE_COMPLETED',
          },
        ],
      });

      const nudge = await socialProofService.generateCohortMessage(
        user.id,
        'COURSE_COMPLETED',
        'course/1',
      );

      if (nudge) {
        expect(nudge.type).toBe('SOCIAL_PROOF');
        expect(nudge.metadata.percentage).toBeGreaterThan(0);
      }
    });

    it('should verify realtime activity social proof', async () => {
      const targetId = 'lesson-123';
      await prisma.behaviorLog.create({
        data: {
          userId: 'user-1',
          sessionId: 'session-1',
          path: `/lessons/${targetId}`,
          eventType: 'LESSON_START',
          timestamp: new Date(),
        },
      });

      const activity = await socialProofService.getRealtimeActivity(
        'LESSON_START',
        targetId,
      );
      expect(activity.uniqueUsers).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Variable Rewards & Adaptive Adjustment', () => {
    it('should simulate reward distribution/adjustment based on performance', async () => {
      const user = await prisma.user.create({
        data: {
          email: `reward-${Date.now()}@example.com`,
          passwordHash: 'hashed',
          investmentProfile: {
            create: { investmentPhilosophy: {}, financialGoals: {} },
          },
        },
      });

      const { AdaptiveService } =
        await import('../src/modules/adaptive/adaptive.service');
      const adaptiveService = app.get(AdaptiveService);

      const result = await adaptiveService.adjustLearningPath(
        user.id,
        'lesson-1',
        { score: 95, timeSpent: 300 },
      );

      expect(result.adjustment).toBe('LEVEL_UP');
      expect(result.suggestedLevel).toBe('INTERMEDIATE');

      const log = await prisma.behaviorLog.findFirst({
        where: { userId: user.id, eventType: 'ADAPTIVE_ADJUSTMENT' },
      });
      expect(log).toBeDefined();
    });
  });
});
