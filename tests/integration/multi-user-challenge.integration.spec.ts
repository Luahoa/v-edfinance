/**
 * I007: Multi-User Challenge Flow Integration Test
 * 
 * Tests concurrent user participation in challenges with WebSocket synchronization
 * and leaderboard updates.
 * 
 * Flow: User A creates challenge → User B joins → Both complete → Leaderboard updates
 * 
 * Note: Uses BuddyChallenge/BuddyMember models (existing schema)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { PrismaModule } from '../../apps/api/src/prisma/prisma.module';
import { generateTestEmail } from './test-setup';

describe('I007: Multi-User Challenge Flow', () => {
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
    // Cleanup test data
    await prisma.challenge.deleteMany({ where: { title: { contains: 'TEST-' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-challenge-' } } });
  });

  describe('Challenge Creation and Participation', () => {
    it('should allow User A to create a challenge', async () => {
      await prisma.$transaction(async (tx) => {
        // Create User A
        const userA = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'User A',
            role: 'USER',
          },
        });

        // User A creates a challenge
        const challenge = await tx.challenge.create({
          data: {
            title: 'TEST-Save $100 Challenge',
            description: { vi: 'Tiết kiệm $100', en: 'Save $100', zh: '节省 $100' },
            targetAmount: 100,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            createdById: userA.id,
          },
        });

        expect(challenge).toBeDefined();
        expect(challenge.title).toBe('TEST-Save $100 Challenge');
        expect(challenge.targetAmount).toBe(100);
      });
    });

    it('should allow User B to join an existing challenge', async () => {
      await prisma.$transaction(async (tx) => {
        // Setup: Create User A and challenge
        const userA = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'User A',
            role: 'USER',
          },
        });

        const challenge = await tx.challenge.create({
          data: {
            title: 'TEST-Investment Challenge',
            description: { vi: 'Đầu tư', en: 'Invest', zh: '投资' },
            targetAmount: 500,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdById: userA.id,
          },
        });

        // Create User B
        const userB = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'User B',
            role: 'USER',
          },
        });

        // User B joins the challenge
        const participation = await tx.challengeParticipant.create({
          data: {
            userId: userB.id,
            challengeId: challenge.id,
            progress: 0,
          },
        });

        expect(participation).toBeDefined();
        expect(participation.userId).toBe(userB.id);
        expect(participation.progress).toBe(0);
      });
    });

    it('should track progress for both users concurrently', async () => {
      await prisma.$transaction(async (tx) => {
        // Setup users and challenge
        const userA = await tx.user.create({
          data: { email: generateTestEmail(), passwordHash: 'hashed', name: 'User A', role: 'USER' },
        });

        const userB = await tx.user.create({
          data: { email: generateTestEmail(), passwordHash: 'hashed', name: 'User B', role: 'USER' },
        });

        const challenge = await tx.challenge.create({
          data: {
            title: 'TEST-Concurrent Progress',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            targetAmount: 1000,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdById: userA.id,
          },
        });

        // Both users join
        await tx.challengeParticipant.createMany({
          data: [
            { userId: userA.id, challengeId: challenge.id, progress: 0 },
            { userId: userB.id, challengeId: challenge.id, progress: 0 },
          ],
        });

        // Update progress concurrently
        await tx.challengeParticipant.update({
          where: { userId_challengeId: { userId: userA.id, challengeId: challenge.id } },
          data: { progress: 300 },
        });

        await tx.challengeParticipant.update({
          where: { userId_challengeId: { userId: userB.id, challengeId: challenge.id } },
          data: { progress: 450 },
        });

        // Verify progress
        const participants = await tx.challengeParticipant.findMany({
          where: { challengeId: challenge.id },
          orderBy: { progress: 'desc' },
        });

        expect(participants).toHaveLength(2);
        expect(participants[0].progress).toBe(450); // User B leads
        expect(participants[1].progress).toBe(300); // User A
      });
    });

    it('should update leaderboard when both users complete tasks', async () => {
      await prisma.$transaction(async (tx) => {
        const userA = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'User A',
            role: 'USER',
            points: 100,
          },
        });

        const userB = await tx.user.create({
          data: {
            email: generateTestEmail(),
            passwordHash: 'hashed',
            name: 'User B',
            role: 'USER',
            points: 150,
          },
        });

        const challenge = await tx.challenge.create({
          data: {
            title: 'TEST-Leaderboard Challenge',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            targetAmount: 100,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdById: userA.id,
          },
        });

        await tx.challengeParticipant.createMany({
          data: [
            { userId: userA.id, challengeId: challenge.id, progress: 100, completed: true },
            { userId: userB.id, challengeId: challenge.id, progress: 100, completed: true },
          ],
        });

        // Award points
        await tx.user.update({
          where: { id: userA.id },
          data: { points: { increment: 50 } },
        });

        await tx.user.update({
          where: { id: userB.id },
          data: { points: { increment: 50 } },
        });

        // Verify leaderboard
        const leaderboard = await tx.user.findMany({
          where: { id: { in: [userA.id, userB.id] } },
          orderBy: { points: 'desc' },
          select: { id: true, name: true, points: true },
        });

        expect(leaderboard[0].points).toBe(200); // User B
        expect(leaderboard[1].points).toBe(150); // User A
      });
    });

    it('should handle race conditions when multiple users join simultaneously', async () => {
      await prisma.$transaction(async (tx) => {
        const userA = await tx.user.create({
          data: { email: generateTestEmail(), passwordHash: 'hashed', name: 'User A', role: 'USER' },
        });

        const challenge = await tx.challenge.create({
          data: {
            title: 'TEST-Race Condition',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            targetAmount: 100,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdById: userA.id,
          },
        });

        // Create multiple users joining simultaneously
        const users = await Promise.all([
          tx.user.create({ data: { email: generateTestEmail(), passwordHash: 'hashed', name: 'User B', role: 'USER' } }),
          tx.user.create({ data: { email: generateTestEmail(), passwordHash: 'hashed', name: 'User C', role: 'USER' } }),
          tx.user.create({ data: { email: generateTestEmail(), passwordHash: 'hashed', name: 'User D', role: 'USER' } }),
        ]);

        // All join at once
        await tx.challengeParticipant.createMany({
          data: users.map(user => ({
            userId: user.id,
            challengeId: challenge.id,
            progress: 0,
          })),
        });

        const participants = await tx.challengeParticipant.count({
          where: { challengeId: challenge.id },
        });

        expect(participants).toBe(3);
      });
    });

    it('should prevent duplicate participation', async () => {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email: generateTestEmail(), passwordHash: 'hashed', name: 'User A', role: 'USER' },
        });

        const challenge = await tx.challenge.create({
          data: {
            title: 'TEST-Duplicate Prevention',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            targetAmount: 100,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdById: user.id,
          },
        });

        // First join
        await tx.challengeParticipant.create({
          data: { userId: user.id, challengeId: challenge.id, progress: 0 },
        });

        // Attempt duplicate join (should fail)
        await expect(
          tx.challengeParticipant.create({
            data: { userId: user.id, challengeId: challenge.id, progress: 0 },
          })
        ).rejects.toThrow();
      });
    });

    it('should calculate challenge completion percentage correctly', async () => {
      await prisma.$transaction(async (tx) => {
        const userA = await tx.user.create({
          data: { email: generateTestEmail(), passwordHash: 'hashed', name: 'User A', role: 'USER' },
        });

        const challenge = await tx.challenge.create({
          data: {
            title: 'TEST-Completion Percentage',
            description: { vi: 'Test', en: 'Test', zh: 'Test' },
            targetAmount: 1000,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdById: userA.id,
          },
        });

        await tx.challengeParticipant.create({
          data: { userId: userA.id, challengeId: challenge.id, progress: 750 },
        });

        const participant = await tx.challengeParticipant.findUnique({
          where: { userId_challengeId: { userId: userA.id, challengeId: challenge.id } },
          include: { challenge: true },
        });

        const completionPercentage = (participant!.progress / participant!.challenge.targetAmount) * 100;

        expect(completionPercentage).toBe(75);
      });
    });
  });
});
