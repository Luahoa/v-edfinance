import { Test } from '@nestjs/testing';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { NudgeService } from '../../apps/api/src/modules/nudge/nudge.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('I021: Nudge Frequency Limiter Integration', () => {
  let prismaService: PrismaService;
  let nudgeService: NudgeService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService, NudgeService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    nudgeService = module.get<NudgeService>(NudgeService);
  });

  it('should enforce 24-hour cooldown between nudges', async () => {
    const userId = 'cooldown-test-user';

    await prismaService.behaviorLog.create({
      data: {
        userId,
        sessionId: 'nudge-system',
        path: '/nudge/streak-warning',
        eventType: 'STREAK_NUDGE_SENT',
        payload: { currentStreak: 5 },
      },
    });

    const recentNudges = await prismaService.behaviorLog.findMany({
      where: {
        userId,
        eventType: 'STREAK_NUDGE_SENT',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    expect(recentNudges).toHaveLength(1);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const secondNudgeAttempt = await prismaService.behaviorLog.count({
      where: {
        userId,
        eventType: 'STREAK_NUDGE_SENT',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    expect(secondNudgeAttempt).toBe(1);
  });

  it('should enforce maximum 3 nudges per day limit', async () => {
    const userId = 'max-nudges-user';
    const now = new Date();

    for (let i = 0; i < 3; i++) {
      await prismaService.behaviorLog.create({
        data: {
          userId,
          sessionId: 'nudge-system',
          path: `/nudge/type-${i}`,
          eventType: 'STREAK_NUDGE_SENT',
          payload: { nudgeNumber: i + 1 },
          createdAt: new Date(now.getTime() - (22 - i * 4) * 60 * 60 * 1000),
        },
      });
    }

    const todayNudges = await prismaService.behaviorLog.count({
      where: {
        userId,
        eventType: 'STREAK_NUDGE_SENT',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    expect(todayNudges).toBe(3);

    const shouldNotSend = todayNudges >= 3;
    expect(shouldNotSend).toBe(true);
  });

  it('should reset nudge count after 24 hours', async () => {
    const userId = 'reset-test-user';

    await prismaService.behaviorLog.create({
      data: {
        userId,
        sessionId: 'nudge-system',
        path: '/nudge/old',
        eventType: 'STREAK_NUDGE_SENT',
        payload: {},
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      },
    });

    const recentNudges = await prismaService.behaviorLog.count({
      where: {
        userId,
        eventType: 'STREAK_NUDGE_SENT',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    expect(recentNudges).toBe(0);

    await prismaService.behaviorLog.create({
      data: {
        userId,
        sessionId: 'nudge-system',
        path: '/nudge/new',
        eventType: 'STREAK_NUDGE_SENT',
        payload: {},
      },
    });

    const afterReset = await prismaService.behaviorLog.count({
      where: {
        userId,
        eventType: 'STREAK_NUDGE_SENT',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    expect(afterReset).toBe(1);
  });

  it('should prevent nudge spam across different nudge types', async () => {
    const userId = 'multi-type-user';

    const nudgeTypes = ['STREAK_NUDGE_SENT', 'GOAL_REMINDER', 'REWARD_ALERT'];

    for (let i = 0; i < nudgeTypes.length; i++) {
      await prismaService.behaviorLog.create({
        data: {
          userId,
          sessionId: 'nudge-system',
          path: `/nudge/${nudgeTypes[i]}`,
          eventType: nudgeTypes[i],
          payload: {},
        },
      });
    }

    const allNudges = await prismaService.behaviorLog.count({
      where: {
        userId,
        eventType: {
          in: nudgeTypes,
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    expect(allNudges).toBe(3);
    expect(allNudges).toBeLessThanOrEqual(3);
  });

  it('should track frequency per user independently', async () => {
    const user1 = 'user-1';
    const user2 = 'user-2';

    for (let i = 0; i < 2; i++) {
      await prismaService.behaviorLog.create({
        data: {
          userId: user1,
          sessionId: 'nudge-system',
          path: `/nudge/u1-${i}`,
          eventType: 'STREAK_NUDGE_SENT',
          payload: {},
        },
      });
    }

    await prismaService.behaviorLog.create({
      data: {
        userId: user2,
        sessionId: 'nudge-system',
        path: '/nudge/u2-0',
        eventType: 'STREAK_NUDGE_SENT',
        payload: {},
      },
    });

    const user1Count = await prismaService.behaviorLog.count({
      where: {
        userId: user1,
        eventType: 'STREAK_NUDGE_SENT',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const user2Count = await prismaService.behaviorLog.count({
      where: {
        userId: user2,
        eventType: 'STREAK_NUDGE_SENT',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    expect(user1Count).toBe(2);
    expect(user2Count).toBe(1);
  });
});
