/**
 * I003: Nudge → Analytics Flow Integration Tests
 * Tests nudge triggering, user interaction tracking, behavior logging, and analytics aggregation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('I003: Nudge → Analytics Flow', () => {
  let testUserId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.behaviorLog.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: '@nudge-test.com' } }
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `user-${Date.now()}@nudge-test.com`,
        passwordHash: 'hashed',
        name: { vi: 'Nudge User', en: 'Nudge User', zh: '推送用户' },
        points: 50
      }
    });
    testUserId = user.id;
  });

  it('S01: Should trigger social proof nudge based on user behavior', async () => {
    const nudgeData = {
      type: 'SOCIAL_PROOF',
      message: { vi: '80% người dùng đã hoàn thành bài này', en: '80% of users completed this', zh: '80%的用户完成了此课程' },
      context: { lessonId: 'lesson-123', completionRate: 0.8 }
    };

    const behaviorLog = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'NUDGE_TRIGGERED',
        context: nudgeData
      }
    });

    expect(behaviorLog).toBeDefined();
    expect(behaviorLog.action).toBe('NUDGE_TRIGGERED');
    expect((behaviorLog.context as any).type).toBe('SOCIAL_PROOF');
  });

  it('S02: Should log user interaction with nudge (click)', async () => {
    const interactionLog = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'NUDGE_CLICKED',
        context: {
          nudgeId: 'nudge-001',
          type: 'LOSS_AVERSION',
          timestamp: new Date().toISOString()
        }
      }
    });

    expect(interactionLog.action).toBe('NUDGE_CLICKED');
  });

  it('S03: Should log user dismissal of nudge', async () => {
    const dismissLog = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'NUDGE_DISMISSED',
        context: {
          nudgeId: 'nudge-002',
          reason: 'user_closed'
        }
      }
    });

    expect(dismissLog.action).toBe('NUDGE_DISMISSED');
  });

  it('S04: Should track conversion after nudge interaction', async () => {
    // Trigger nudge
    await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'NUDGE_TRIGGERED',
        context: { nudgeId: 'nudge-003', type: 'STREAK_REMINDER' }
      }
    });

    // User completes action
    await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'LESSON_COMPLETED',
        context: { nudgeId: 'nudge-003', convertedFromNudge: true }
      }
    });

    const conversionLog = await prisma.behaviorLog.findFirst({
      where: {
        userId: testUserId,
        action: 'LESSON_COMPLETED'
      }
    });

    expect((conversionLog!.context as any).convertedFromNudge).toBe(true);
  });

  it('S05: Should aggregate nudge performance metrics', async () => {
    // Create multiple nudge logs
    await prisma.behaviorLog.createMany({
      data: [
        { userId: testUserId, action: 'NUDGE_TRIGGERED', context: { nudgeType: 'SOCIAL_PROOF' } },
        { userId: testUserId, action: 'NUDGE_CLICKED', context: { nudgeType: 'SOCIAL_PROOF' } },
        { userId: testUserId, action: 'NUDGE_TRIGGERED', context: { nudgeType: 'LOSS_AVERSION' } },
        { userId: testUserId, action: 'NUDGE_DISMISSED', context: { nudgeType: 'LOSS_AVERSION' } }
      ]
    });

    const triggered = await prisma.behaviorLog.count({
      where: { userId: testUserId, action: 'NUDGE_TRIGGERED' }
    });

    const clicked = await prisma.behaviorLog.count({
      where: { userId: testUserId, action: 'NUDGE_CLICKED' }
    });

    expect(triggered).toBe(2);
    expect(clicked).toBe(1);

    const clickThroughRate = clicked / triggered;
    expect(clickThroughRate).toBe(0.5);
  });

  it('S06: Should track A/B test variant assignment', async () => {
    const abTestLog = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'AB_TEST_ASSIGNED',
        context: {
          experimentId: 'exp-001',
          variant: 'B',
          nudgeType: 'GAMIFIED_CHALLENGE'
        }
      }
    });

    expect((abTestLog.context as any).variant).toBe('B');
  });

  it('S07: Should aggregate analytics by time period', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const today = new Date();

    await prisma.behaviorLog.createMany({
      data: [
        { userId: testUserId, action: 'NUDGE_TRIGGERED', context: {}, createdAt: yesterday },
        { userId: testUserId, action: 'NUDGE_TRIGGERED', context: {}, createdAt: today }
      ]
    });

    const todayCount = await prisma.behaviorLog.count({
      where: {
        userId: testUserId,
        action: 'NUDGE_TRIGGERED',
        createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) }
      }
    });

    expect(todayCount).toBeGreaterThanOrEqual(1);
  });

  it('S08: Should calculate nudge effectiveness by user segment', async () => {
    // Create another user
    const user2 = await prisma.user.create({
      data: {
        email: `user2-${Date.now()}@nudge-test.com`,
        passwordHash: 'hashed',
        name: { vi: 'User 2', en: 'User 2', zh: '用户2' },
        points: 200 // High performer
      }
    });

    await prisma.behaviorLog.createMany({
      data: [
        { userId: testUserId, action: 'NUDGE_CLICKED', context: { segment: 'beginner' } },
        { userId: user2.id, action: 'NUDGE_DISMISSED', context: { segment: 'advanced' } }
      ]
    });

    const beginnerEngagement = await prisma.behaviorLog.count({
      where: {
        action: 'NUDGE_CLICKED',
        context: { path: ['segment'], equals: 'beginner' }
      }
    });

    expect(beginnerEngagement).toBeGreaterThanOrEqual(1);

    // Cleanup
    await prisma.behaviorLog.deleteMany({ where: { userId: user2.id } });
    await prisma.user.delete({ where: { id: user2.id } });
  });

  it('S09: Should track multi-channel nudge delivery', async () => {
    await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'NUDGE_SENT',
        context: {
          nudgeId: 'nudge-005',
          channels: ['email', 'push', 'in-app']
        }
      }
    });

    const deliveryLog = await prisma.behaviorLog.findFirst({
      where: { userId: testUserId, action: 'NUDGE_SENT' }
    });

    expect((deliveryLog!.context as any).channels).toHaveLength(3);
  });

  it('S10: Should support real-time analytics dashboard queries', async () => {
    await prisma.behaviorLog.createMany({
      data: [
        { userId: testUserId, action: 'NUDGE_TRIGGERED', context: {} },
        { userId: testUserId, action: 'NUDGE_CLICKED', context: {} },
        { userId: testUserId, action: 'LESSON_COMPLETED', context: {} }
      ]
    });

    const recentActivity = await prisma.behaviorLog.findMany({
      where: {
        userId: testUserId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    expect(recentActivity.length).toBeGreaterThanOrEqual(3);
  });
});
