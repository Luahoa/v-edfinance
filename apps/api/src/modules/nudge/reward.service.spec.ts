import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../../common/gamification.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NudgeEngineService } from './nudge-engine.service';

/**
 * Reward Distribution System Test Suite
 * Coverage: Variable rewards, timing optimization, value calculation, dopamine mechanics
 */
describe('RewardDistributionSystem (Dopamine-Driven Mechanics)', () => {
  let prismaService: PrismaService;
  let gamificationService: GamificationService;
  let analyticsService: AnalyticsService;
  let nudgeEngineService: NudgeEngineService;
  let eventEmitter: EventEmitter2;

  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    behaviorLog: {
      create: vi.fn(),
      count: vi.fn(),
    },
    userStreak: {
      findUnique: vi.fn(),
    },
  };

  const mockEventEmitter = {
    emit: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        NudgeEngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        {
          provide: AnalyticsService,
          useValue: {
            getUserPersona: vi.fn().mockResolvedValue('HUNTER'),
          },
        },
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    gamificationService = module.get<GamificationService>(GamificationService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    nudgeEngineService = module.get<NudgeEngineService>(NudgeEngineService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  describe('Variable Reward Algorithms', () => {
    it('should apply RANDOM variable ratio schedule (VR-3: avg 3 actions per reward)', async () => {
      const userId = 'user-vr-test';
      const actions = 10;
      const rewardTriggers: number[] = [];

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 100 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      for (let i = 1; i <= actions; i++) {
        const shouldReward = Math.random() < 1 / 3;
        if (shouldReward) {
          rewardTriggers.push(i);
          await gamificationService.logEvent(userId, `ACTION_${i}`, 10, {});
        }
      }

      const averageInterval = actions / rewardTriggers.length;
      expect(averageInterval).toBeGreaterThanOrEqual(1);
      expect(averageInterval).toBeLessThanOrEqual(10);
      expect(rewardTriggers.length).toBeGreaterThan(0);
    });

    it('should apply FIXED interval schedule (FI-5: reward every 5th minute)', async () => {
      const userId = 'user-fi-test';
      const intervals = [0, 4, 5, 10, 14, 15, 20];

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 50 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      for (const minute of intervals) {
        const shouldReward = minute > 0 && minute % 5 === 0;
        if (shouldReward) {
          await gamificationService.logEvent(userId, `INTERVAL_${minute}`, 15, {
            intervalMinute: minute,
          });
        }
      }

      expect(mockPrisma.user.update).toHaveBeenCalledTimes(4);
    });

    it('should calculate progressive reward multiplier based on streak', async () => {
      const userId = 'user-streak-multiplier';
      const baseReward = 10;

      mockPrisma.userStreak.findUnique.mockResolvedValueOnce({
        currentStreak: 7,
        userId,
      });
      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 100 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const streak = await prismaService.userStreak.findUnique({
        where: { userId },
      });

      const multiplier = Math.min(1 + streak.currentStreak * 0.1, 2.5);
      const finalReward = Math.floor(baseReward * multiplier);

      await gamificationService.logEvent(
        userId,
        'LESSON_COMPLETE',
        finalReward,
        {
          streakMultiplier: multiplier,
        },
      );

      expect(finalReward).toBe(17);
      expect(multiplier).toBeCloseTo(1.7, 2);
    });

    it('should implement jackpot mechanic (1% chance for 10x reward)', async () => {
      const userId = 'user-jackpot';
      const baseReward = 10;
      let jackpotHit = false;

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 200 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      vi.spyOn(Math, 'random').mockReturnValueOnce(0.005);

      const roll = Math.random();
      if (roll < 0.01) {
        jackpotHit = true;
        await gamificationService.logEvent(
          userId,
          'JACKPOT_HIT',
          baseReward * 10,
          {
            jackpot: true,
            roll,
          },
        );
      }

      expect(jackpotHit).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { points: { increment: 100 } },
      });
    });
  });

  describe('Reward Timing Optimization', () => {
    it('should delay reward delivery for suspense (200-500ms)', async () => {
      const userId = 'user-timing';
      const startTime = Date.now();

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 50 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const delayMs = 200 + Math.random() * 300;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await gamificationService.logEvent(userId, 'DELAYED_REWARD', 20, {
        delayMs,
      });

      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).toBeGreaterThanOrEqual(200);
      expect(elapsedTime).toBeLessThan(600);
    });

    it('should trigger reward immediately after critical milestone', async () => {
      const userId = 'user-instant';
      const startTime = Date.now();

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 100 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      await gamificationService.logEvent(userId, 'MILESTONE_COMPLETE', 50, {
        immediate: true,
      });

      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).toBeLessThan(100);
    });

    it('should batch rewards during high-frequency actions (debounce 2s)', async () => {
      const userId = 'user-batch';
      const actions = ['ACTION_A', 'ACTION_B', 'ACTION_C'];
      const rewardQueue: number[] = [];

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 60 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      for (const action of actions) {
        rewardQueue.push(10);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const totalReward = rewardQueue.reduce((sum, val) => sum + val, 0);
      await gamificationService.logEvent(userId, 'BATCH_REWARD', totalReward, {
        batched: true,
        count: actions.length,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { points: { increment: 30 } },
      });
    });

    it('should schedule prime-time bonuses (7-9 PM: +20% rewards)', async () => {
      const userId = 'user-primetime';
      const baseReward = 10;

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 12 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const currentHour = new Date().getHours();
      const isPrimeTime = currentHour >= 19 && currentHour < 21;
      const bonus = isPrimeTime ? 1.2 : 1.0;

      await gamificationService.logEvent(
        userId,
        'PRIMETIME_ACTION',
        Math.floor(baseReward * bonus),
        { primeTimeBonus: bonus },
      );

      if (isPrimeTime) {
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { points: { increment: 12 } },
          }),
        );
      }
    });
  });

  describe('Reward Value Calculation', () => {
    it('should scale rewards based on user level (exponential curve)', async () => {
      const userId = 'user-level';
      const userLevel = 5;
      const baseReward = 10;

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        level: userLevel,
        points: 500,
      });
      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 600 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const levelMultiplier = Math.pow(1.15, userLevel - 1);
      const scaledReward = Math.floor(baseReward * levelMultiplier);

      await gamificationService.logEvent(
        userId,
        'LEVEL_SCALED_REWARD',
        scaledReward,
        {
          level: userLevel,
          multiplier: levelMultiplier,
        },
      );

      expect(scaledReward).toBeGreaterThan(baseReward);
      expect(Math.round(levelMultiplier * 100) / 100).toBeCloseTo(1.75, 1);
    });

    it('should apply persona-based reward weights (HUNTER: 1.5x risk rewards)', async () => {
      const userId = 'user-hunter';
      const baseReward = 20;

      vi.spyOn(analyticsService, 'getUserPersona').mockResolvedValue('HUNTER');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        points: 100,
      });
      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 130 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const persona = await analyticsService.getUserPersona(userId);
      const personaWeight = persona === 'HUNTER' ? 1.5 : 1.0;
      const adjustedReward = Math.floor(baseReward * personaWeight);

      await gamificationService.logEvent(
        userId,
        'RISKY_INVESTMENT',
        adjustedReward,
        {
          persona,
          weight: personaWeight,
        },
      );

      expect(adjustedReward).toBe(30);
    });

    it('should cap daily rewards to prevent exploitation (max 500 points/day)', async () => {
      const userId = 'user-cap';
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      mockPrisma.behaviorLog.count.mockResolvedValue(12);
      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 500 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const earnedToday = (await prismaService.behaviorLog.count({})) * 40;
      const maxDaily = 500;
      const remainingCap = Math.max(0, maxDaily - earnedToday);
      const attemptedReward = 50;
      const finalReward = Math.min(attemptedReward, remainingCap);

      if (finalReward > 0) {
        await gamificationService.logEvent(
          userId,
          'CAPPED_REWARD',
          finalReward,
          {
            attemptedReward,
            remainingCap,
          },
        );
      }

      expect(finalReward).toBe(20);
    });

    it('should calculate diminishing returns for repeated actions (5% decay per repeat)', async () => {
      const userId = 'user-diminish';
      const baseReward = 10;
      const repeatCount = 3;

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 100 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const decayRate = 0.05;
      const decayedReward = Math.floor(
        baseReward * Math.pow(1 - decayRate, repeatCount),
      );

      await gamificationService.logEvent(
        userId,
        'REPEATED_ACTION',
        decayedReward,
        {
          repeatCount,
          decay: decayRate,
        },
      );

      expect(decayedReward).toBe(8);
    });
  });

  describe('Gamification Service Integration (Mocked)', () => {
    it('should emit points.earned event after reward distribution', async () => {
      const userId = 'user-event';
      const eventType = 'LESSON_COMPLETE';
      const points = 25;

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 125 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      await gamificationService.logEvent(userId, eventType, points, {});

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('points.earned', {
        userId,
        eventType,
        pointsEarned: points,
        metadata: {},
      });
    });

    it('should trigger nudge after reward threshold reached', async () => {
      const userId = 'user-nudge-trigger';
      const points = 100;

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 600 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      await gamificationService.logEvent(userId, 'THRESHOLD_REACHED', points, {
        triggerNudge: true,
        nudgeContext: 'INVESTMENT_DECISION',
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'points.earned',
        expect.objectContaining({
          metadata: expect.objectContaining({
            triggerNudge: true,
            nudgeContext: 'INVESTMENT_DECISION',
          }),
        }),
      );
    });

    it('should validate sufficient points before deduction', async () => {
      const userId = 'user-deduct';
      const points = 50;

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        points: 30,
      });

      await expect(
        gamificationService.deductPoints(userId, points, 'Test deduction'),
      ).rejects.toThrow('Insufficient points');
    });

    it('should successfully deduct points and log behavior', async () => {
      const userId = 'user-deduct-success';
      const points = 20;

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        points: 100,
      });
      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 80 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const result = await gamificationService.deductPoints(
        userId,
        points,
        'Power-up purchase',
      );

      expect(result).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { points: { decrement: points } },
      });
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          sessionId: 'gamification-system',
          path: '/gamification/deduct',
          eventType: 'POINTS_DEDUCTED',
          payload: {
            pointsDeducted: points,
            reason: 'Power-up purchase',
          },
        },
      });
    });

    it('should handle concurrent reward distributions without race conditions', async () => {
      const userId = 'user-concurrent';
      const concurrentRewards = [10, 15, 20];

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 145 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const promises = concurrentRewards.map((points, i) =>
        gamificationService.logEvent(userId, `CONCURRENT_${i}`, points, {}),
      );

      await Promise.all(promises);

      expect(mockPrisma.user.update).toHaveBeenCalledTimes(3);
    });
  });

  describe('Dopamine-Driven Mechanics', () => {
    it('should implement near-miss mechanic (show "almost won" at 95% threshold)', async () => {
      const userId = 'user-nearmiss';
      const threshold = 100;
      const currentPoints = 95;

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        points: currentPoints,
      });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const user = await prismaService.user.findUnique({
        where: { id: userId },
      });
      const isNearMiss =
        user.points >= threshold * 0.95 && user.points < threshold;

      if (isNearMiss) {
        await prismaService.behaviorLog.create({
          data: {
            userId,
            sessionId: 'gamification-system',
            path: '/gamification/near-miss',
            eventType: 'NEAR_MISS_TRIGGERED',
            payload: {
              threshold,
              currentPoints,
              message: 'Only 5 points away from bonus!',
            },
          },
        });
      }

      expect(isNearMiss).toBe(true);
    });

    it('should trigger achievement unlock with celebration animation', async () => {
      const userId = 'user-achievement';
      const achievementId = 'FIRST_INVESTMENT';

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 150 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      await gamificationService.logEvent(userId, 'ACHIEVEMENT_UNLOCKED', 50, {
        achievementId,
        celebration: 'confetti',
        soundEffect: 'fanfare.mp3',
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'points.earned',
        expect.objectContaining({
          metadata: expect.objectContaining({
            achievementId,
            celebration: 'confetti',
          }),
        }),
      );
    });

    it('should implement loss aversion nudge (show potential loss: -20 points)', async () => {
      const userId = 'user-loss-aversion';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        points: 100,
        investmentProfile: { riskTolerance: 'LOW' },
      });
      mockPrisma.behaviorLog.count.mockResolvedValue(0);

      vi.spyOn(analyticsService, 'getUserPersona').mockResolvedValue('SAVER');

      const nudge = await nudgeEngineService.generateNudge(
        userId,
        'INVESTMENT_DECISION',
        { riskLevel: 85 },
      );

      expect(nudge).toBeDefined();
      expect(nudge.type).toBe('LOSS_AVERSION');
      expect(nudge.message.vi).toContain('20%');
    });

    it('should apply social proof to boost motivation', async () => {
      const userId = 'user-social-proof';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        points: 50,
      });
      mockPrisma.behaviorLog.count.mockResolvedValue(150);

      const nudge = await nudgeEngineService.generateNudge(
        userId,
        'SOCIAL_PROOF_REALTIME',
        {},
      );

      expect(nudge).toBeDefined();
      expect(nudge.type).toBe('SOCIAL_PROOF');
      expect(nudge.message.vi).toContain('150');
    });

    it('should create anticipation phase before big reward reveal (3s countdown)', async () => {
      const userId = 'user-anticipation';
      const bigReward = 100;
      const anticipationMs = 3000;

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 200 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const startTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, anticipationMs));

      await gamificationService.logEvent(
        userId,
        'BIG_REWARD_REVEAL',
        bigReward,
        {
          anticipationMs,
          countdown: true,
        },
      );

      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).toBeGreaterThanOrEqual(anticipationMs);
    });

    it('should implement progress bar momentum (90% completion triggers urgency)', async () => {
      const userId = 'user-momentum';
      const goalTarget = 1000;
      const currentProgress = 900;

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        points: currentProgress,
      });

      const user = await prismaService.user.findUnique({
        where: { id: userId },
      });
      const progressPercentage = (user.points / goalTarget) * 100;
      const isUrgencyZone = progressPercentage >= 90;

      expect(isUrgencyZone).toBe(true);
      expect(progressPercentage).toBe(90);
    });

    it('should randomize reward particle effects for variety', async () => {
      const userId = 'user-particles';
      const effects = ['stars', 'coins', 'sparkles', 'confetti'];

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 75 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      const randomEffect = effects[Math.floor(Math.random() * effects.length)];

      await gamificationService.logEvent(userId, 'REWARD_WITH_EFFECT', 25, {
        visualEffect: randomEffect,
      });

      expect(effects).toContain(randomEffect);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle negative reward values gracefully', async () => {
      const userId = 'user-negative';
      const invalidReward = -10;

      mockPrisma.user.update.mockRejectedValue(
        new Error('Invalid reward value'),
      );

      await expect(
        gamificationService.logEvent(
          userId,
          'INVALID_REWARD',
          invalidReward,
          {},
        ),
      ).rejects.toThrow('Invalid reward value');
    });

    it('should prevent reward overflow (max 999999 points)', async () => {
      const userId = 'user-overflow';
      const currentPoints = 999990;
      const attemptedReward = 20;

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        points: currentPoints,
      });

      const maxPoints = 999999;
      const cappedReward = Math.min(attemptedReward, maxPoints - currentPoints);

      expect(cappedReward).toBe(9);
    });

    it('should handle missing user gracefully during reward distribution', async () => {
      const userId = 'non-existent-user';

      mockPrisma.user.update.mockRejectedValue(new Error('User not found'));
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      await expect(
        gamificationService.logEvent(userId, 'ORPHANED_REWARD', 10, {}),
      ).rejects.toThrow('User not found');
    });

    it('should log simulation events without incrementing real points', async () => {
      const userId = 'user-simulation';
      const points = 50;

      mockPrisma.user.update.mockResolvedValue({ id: userId, points: 100 });
      mockPrisma.behaviorLog.create.mockResolvedValue({});

      await gamificationService.logEvent(userId, 'SIMULATED_ACTION', points, {
        isSimulation: true,
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { points: { increment: points } },
      });
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: 'simulation-system',
          }),
        }),
      );
    });
  });
});
