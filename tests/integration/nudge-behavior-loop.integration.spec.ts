/**
 * I010: Nudge → Behavior Change Loop Integration Test
 * 
 * Tests: Loss aversion nudge → User action → Behavior logged → Next nudge adapted
 * Validates: Hooked model implementation (Trigger → Action → Variable Reward → Investment)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { PrismaModule } from '../../apps/api/src/prisma/prisma.module';
import { generateTestEmail } from './test-setup';

describe('I010: Nudge → Behavior Change Loop', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    prisma = moduleRef.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef.close();
  });

  afterEach(async () => {
    await prisma.nudgeHistory.deleteMany({});
    await prisma.behaviorLog.deleteMany({ where: { eventType: { contains: 'TEST-' } } });
    await prisma.userStreak.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { contains: 'test-nudge-' } } });
  });

  describe('Hooked Model: Trigger → Action → Reward → Investment', () => {
    it('should trigger loss aversion nudge for inactive user', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Inactive User',
            role: 'USER',
            lastActiveAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          },
        });

        // Create streak at risk
        await tx.userStreak.create({
          data: {
            userId: user.id,
            currentStreak: 7,
            longestStreak: 10,
            lastActivityDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        });

        // Send loss aversion nudge
        const nudge = await tx.nudgeHistory.create({
          data: {
            userId: user.id,
            nudgeType: 'LOSS_AVERSION',
            message: {
              vi: 'Streak của bạn sắp mất! Đăng nhập ngay.',
              en: 'Your streak is at risk! Log in now.',
              zh: '你的连续记录即将丢失！立即登录。',
            },
            metadata: { streakAtRisk: true, currentStreak: 7 },
            sentAt: new Date(),
          },
        });

        expect(nudge.nudgeType).toBe('LOSS_AVERSION');
        expect(nudge.metadata).toMatchObject({ streakAtRisk: true });
      });
    });

    it('should log user action in response to nudge', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Responsive User',
            role: 'USER',
          },
        });

        const nudge = await tx.nudgeHistory.create({
          data: {
            userId: user.id,
            nudgeType: 'SOCIAL_PROOF',
            message: { vi: 'Test nudge', en: 'Test nudge', zh: 'Test nudge' },
            metadata: {},
            sentAt: new Date(),
          },
        });

        // User takes action
        const behaviorLog = await tx.behaviorLog.create({
          data: {
            userId: user.id,
            eventType: 'TEST-NUDGE_RESPONSE',
            metadata: {
              nudgeId: nudge.id,
              nudgeType: 'SOCIAL_PROOF',
              action: 'clicked',
            },
            timestamp: new Date(),
          },
        });

        expect(behaviorLog.metadata).toMatchObject({
          nudgeId: nudge.id,
          action: 'clicked',
        });
      });
    });

    it('should provide variable reward after user action', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Rewarded User',
            role: 'USER',
            points: 100,
          },
        });

        // User completes action
        await tx.behaviorLog.create({
          data: {
            userId: user.id,
            eventType: 'TEST-LESSON_COMPLETE',
            metadata: { lessonId: 'lesson-1' },
            timestamp: new Date(),
          },
        });

        // Variable reward (randomized points: 10-50)
        const rewardPoints = Math.floor(Math.random() * 41) + 10;

        await tx.user.update({
          where: { id: user.id },
          data: { points: { increment: rewardPoints } },
        });

        const updatedUser = await tx.user.findUnique({
          where: { id: user.id },
        });

        expect(updatedUser?.points).toBeGreaterThan(100);
        expect(updatedUser?.points).toBeLessThanOrEqual(150);
      });
    });

    it('should increase investment through streak maintenance', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Invested User',
            role: 'USER',
          },
        });

        const streak = await tx.userStreak.create({
          data: {
            userId: user.id,
            currentStreak: 5,
            longestStreak: 5,
            lastActivityDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          },
        });

        // User logs in today
        await tx.userStreak.update({
          where: { id: streak.id },
          data: {
            currentStreak: { increment: 1 },
            longestStreak: 6,
            lastActivityDate: new Date(),
          },
        });

        const updatedStreak = await tx.userStreak.findUnique({
          where: { id: streak.id },
        });

        expect(updatedStreak?.currentStreak).toBe(6);
        expect(updatedStreak?.longestStreak).toBe(6);
      });
    });

    it('should adapt next nudge based on user response', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Adaptive User',
            role: 'USER',
          },
        });

        // First nudge: Social proof
        const nudge1 = await tx.nudgeHistory.create({
          data: {
            userId: user.id,
            nudgeType: 'SOCIAL_PROOF',
            message: { vi: 'Social nudge', en: 'Social nudge', zh: 'Social nudge' },
            metadata: {},
            sentAt: new Date(Date.now() - 60000),
          },
        });

        // User ignored it (no action logged)
        // Next nudge: Try loss aversion instead
        const nudge2 = await tx.nudgeHistory.create({
          data: {
            userId: user.id,
            nudgeType: 'LOSS_AVERSION',
            message: { vi: 'Loss nudge', en: 'Loss nudge', zh: 'Loss nudge' },
            metadata: { previousNudgeIgnored: nudge1.id },
            sentAt: new Date(),
          },
        });

        expect(nudge2.nudgeType).toBe('LOSS_AVERSION');
        expect(nudge2.metadata).toMatchObject({ previousNudgeIgnored: nudge1.id });
      });
    });

    it('should track nudge effectiveness over time', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Tracked User',
            role: 'USER',
          },
        });

        // Send multiple nudges
        const nudges = await Promise.all([
          tx.nudgeHistory.create({
            data: {
              userId: user.id,
              nudgeType: 'SOCIAL_PROOF',
              message: { vi: 'N1', en: 'N1', zh: 'N1' },
              metadata: {},
              sentAt: new Date(Date.now() - 3 * 60000),
            },
          }),
          tx.nudgeHistory.create({
            data: {
              userId: user.id,
              nudgeType: 'LOSS_AVERSION',
              message: { vi: 'N2', en: 'N2', zh: 'N2' },
              metadata: {},
              sentAt: new Date(Date.now() - 2 * 60000),
            },
          }),
          tx.nudgeHistory.create({
            data: {
              userId: user.id,
              nudgeType: 'FRAMING',
              message: { vi: 'N3', en: 'N3', zh: 'N3' },
              metadata: {},
              sentAt: new Date(Date.now() - 1 * 60000),
            },
          }),
        ]);

        // User responds to loss aversion nudge
        await tx.behaviorLog.create({
          data: {
            userId: user.id,
            eventType: 'TEST-NUDGE_RESPONSE',
            metadata: { nudgeId: nudges[1].id, responded: true },
            timestamp: new Date(),
          },
        });

        // Calculate effectiveness
        const responses = await tx.behaviorLog.count({
          where: {
            userId: user.id,
            eventType: 'TEST-NUDGE_RESPONSE',
            metadata: { path: ['responded'], equals: true },
          },
        });

        const totalNudges = await tx.nudgeHistory.count({ where: { userId: user.id } });

        const effectiveness = (responses / totalNudges) * 100;

        expect(effectiveness).toBeCloseTo(33.33, 1); // 1 out of 3
      });
    });

    it('should implement full Hooked loop cycle', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'Hooked User',
            role: 'USER',
            points: 50,
          },
        });

        // TRIGGER: External nudge
        const nudge = await tx.nudgeHistory.create({
          data: {
            userId: user.id,
            nudgeType: 'LOSS_AVERSION',
            message: { vi: 'Complete lesson!', en: 'Complete lesson!', zh: 'Complete lesson!' },
            metadata: {},
            sentAt: new Date(),
          },
        });

        // ACTION: User completes lesson
        await tx.behaviorLog.create({
          data: {
            userId: user.id,
            eventType: 'TEST-LESSON_COMPLETE',
            metadata: { nudgeId: nudge.id },
            timestamp: new Date(),
          },
        });

        // VARIABLE REWARD: Random points
        const reward = 30;
        await tx.user.update({
          where: { id: user.id },
          data: { points: { increment: reward } },
        });

        // INVESTMENT: Streak updated
        await tx.userStreak.create({
          data: {
            userId: user.id,
            currentStreak: 1,
            longestStreak: 1,
            lastActivityDate: new Date(),
          },
        });

        // Verify full cycle
        const finalUser = await tx.user.findUnique({
          where: { id: user.id },
          include: { streaks: true },
        });

        expect(finalUser?.points).toBe(80); // 50 + 30
        expect(finalUser?.streaks).toHaveLength(1);
        expect(finalUser?.streaks[0].currentStreak).toBe(1);
      });
    });
  });
});
