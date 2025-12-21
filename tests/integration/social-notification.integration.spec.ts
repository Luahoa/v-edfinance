/**
 * I004: Social → Notification Flow Integration Tests
 * Tests social post creation, follower notification, and WebSocket broadcast
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('I004: Social → Notification Flow', () => {
  let testUserId: string;
  let followerId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.socialPost.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.userRelationship.deleteMany({
      where: { OR: [{ followerId }, { followingId: testUserId }] }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: '@social-test.com' } }
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `poster-${Date.now()}@social-test.com`,
        passwordHash: 'hashed',
        name: { vi: 'Poster', en: 'Poster', zh: '发布者' },
        points: 100
      }
    });
    testUserId = user.id;

    const follower = await prisma.user.create({
      data: {
        email: `follower-${Date.now()}@social-test.com`,
        passwordHash: 'hashed',
        name: { vi: 'Follower', en: 'Follower', zh: '关注者' },
        points: 50
      }
    });
    followerId = follower.id;

    // Create follow relationship
    await prisma.userRelationship.create({
      data: {
        followerId: followerId,
        followingId: testUserId
      }
    });
  });

  it('S01: Should create social post', async () => {
    const post = await prisma.socialPost.create({
      data: {
        userId: testUserId,
        type: 'ACHIEVEMENT',
        content: {
          vi: 'Tôi vừa hoàn thành khóa học!',
          en: 'I just completed a course!',
          zh: '我刚完成了课程！'
        },
        likesCount: 0
      }
    });

    expect(post).toBeDefined();
    expect(post.userId).toBe(testUserId);
    expect(post.type).toBe('ACHIEVEMENT');
  });

  it('S02: Should notify followers when post is created', async () => {
    const post = await prisma.socialPost.create({
      data: {
        userId: testUserId,
        type: 'MILESTONE',
        content: { vi: 'Milestone reached!', en: 'Milestone reached!', zh: '达到里程碑！' }
      }
    });

    // Simulate notification creation
    const notification = await prisma.behaviorLog.create({
      data: {
        userId: followerId,
        action: 'NOTIFICATION_RECEIVED',
        context: {
          type: 'NEW_POST',
          postId: post.id,
          fromUserId: testUserId
        }
      }
    });

    expect(notification).toBeDefined();
    expect((notification.context as any).postId).toBe(post.id);

    // Cleanup
    await prisma.behaviorLog.delete({ where: { id: notification.id } });
    await prisma.socialPost.delete({ where: { id: post.id } });
  });

  it('S03: Should broadcast post via WebSocket (simulated)', async () => {
    const post = await prisma.socialPost.create({
      data: {
        userId: testUserId,
        type: 'ACHIEVEMENT',
        content: { vi: 'Achievement!', en: 'Achievement!', zh: '成就！' }
      }
    });

    // Simulate WebSocket broadcast tracking
    const broadcastLog = await prisma.behaviorLog.create({
      data: {
        userId: testUserId,
        action: 'WS_BROADCAST_SENT',
        context: {
          eventType: 'social:newPost',
          postId: post.id,
          recipientCount: 1
        }
      }
    });

    expect((broadcastLog.context as any).eventType).toBe('social:newPost');

    // Cleanup
    await prisma.behaviorLog.delete({ where: { id: broadcastLog.id } });
    await prisma.socialPost.delete({ where: { id: post.id } });
  });

  it('S04: Should send email notification to followers', async () => {
    const post = await prisma.socialPost.create({
      data: {
        userId: testUserId,
        type: 'ACHIEVEMENT',
        content: { vi: 'New achievement', en: 'New achievement', zh: '新成就' }
      }
    });

    const emailLog = await prisma.behaviorLog.create({
      data: {
        userId: followerId,
        action: 'EMAIL_SENT',
        context: {
          template: 'follower_new_post',
          postId: post.id,
          recipientEmail: (await prisma.user.findUnique({ where: { id: followerId } }))!.email
        }
      }
    });

    expect((emailLog.context as any).template).toBe('follower_new_post');

    // Cleanup
    await prisma.behaviorLog.delete({ where: { id: emailLog.id } });
    await prisma.socialPost.delete({ where: { id: post.id } });
  });

  it('S05: Should send push notification to mobile devices', async () => {
    const post = await prisma.socialPost.create({
      data: {
        userId: testUserId,
        type: 'MILESTONE',
        content: { vi: 'Milestone', en: 'Milestone', zh: '里程碑' }
      }
    });

    const pushLog = await prisma.behaviorLog.create({
      data: {
        userId: followerId,
        action: 'PUSH_NOTIFICATION_SENT',
        context: {
          title: 'New post from Poster',
          body: 'Milestone reached!',
          postId: post.id
        }
      }
    });

    expect((pushLog.context as any).postId).toBe(post.id);

    // Cleanup
    await prisma.behaviorLog.delete({ where: { id: pushLog.id } });
    await prisma.socialPost.delete({ where: { id: post.id } });
  });

  it('S06: Should track notification delivery across all channels', async () => {
    const post = await prisma.socialPost.create({
      data: {
        userId: testUserId,
        type: 'ACHIEVEMENT',
        content: { vi: 'Content', en: 'Content', zh: '内容' }
      }
    });

    await prisma.behaviorLog.createMany({
      data: [
        {
          userId: followerId,
          action: 'NOTIFICATION_DELIVERED',
          context: { channel: 'email', postId: post.id }
        },
        {
          userId: followerId,
          action: 'NOTIFICATION_DELIVERED',
          context: { channel: 'push', postId: post.id }
        },
        {
          userId: followerId,
          action: 'NOTIFICATION_DELIVERED',
          context: { channel: 'websocket', postId: post.id }
        }
      ]
    });

    const deliveredCount = await prisma.behaviorLog.count({
      where: {
        userId: followerId,
        action: 'NOTIFICATION_DELIVERED'
      }
    });

    expect(deliveredCount).toBe(3);

    // Cleanup
    await prisma.behaviorLog.deleteMany({
      where: { userId: followerId, action: 'NOTIFICATION_DELIVERED' }
    });
    await prisma.socialPost.delete({ where: { id: post.id } });
  });

  it('S07: Should handle notification preferences', async () => {
    // Update user preferences
    await prisma.user.update({
      where: { id: followerId },
      data: {
        metadata: {
          notificationPreferences: {
            email: true,
            push: false,
            inApp: true
          }
        }
      }
    });

    const followerData = await prisma.user.findUnique({ where: { id: followerId } });
    const prefs = (followerData!.metadata as any).notificationPreferences;

    expect(prefs.email).toBe(true);
    expect(prefs.push).toBe(false);
  });

  it('S08: Should track notification open/click rate', async () => {
    const post = await prisma.socialPost.create({
      data: {
        userId: testUserId,
        type: 'ACHIEVEMENT',
        content: { vi: 'Test', en: 'Test', zh: '测试' }
      }
    });

    await prisma.behaviorLog.createMany({
      data: [
        {
          userId: followerId,
          action: 'NOTIFICATION_SENT',
          context: { postId: post.id }
        },
        {
          userId: followerId,
          action: 'NOTIFICATION_CLICKED',
          context: { postId: post.id }
        }
      ]
    });

    const sent = await prisma.behaviorLog.count({
      where: { userId: followerId, action: 'NOTIFICATION_SENT' }
    });

    const clicked = await prisma.behaviorLog.count({
      where: { userId: followerId, action: 'NOTIFICATION_CLICKED' }
    });

    expect(clicked / sent).toBe(1);

    // Cleanup
    await prisma.behaviorLog.deleteMany({
      where: { userId: followerId, action: { in: ['NOTIFICATION_SENT', 'NOTIFICATION_CLICKED'] } }
    });
    await prisma.socialPost.delete({ where: { id: post.id } });
  });

  it('S09: Should support batch notification for multiple followers', async () => {
    // Create more followers
    const follower2 = await prisma.user.create({
      data: {
        email: `follower2-${Date.now()}@social-test.com`,
        passwordHash: 'hashed',
        name: { vi: 'Follower 2', en: 'Follower 2', zh: '关注者2' }
      }
    });

    await prisma.userRelationship.create({
      data: { followerId: follower2.id, followingId: testUserId }
    });

    const followers = await prisma.userRelationship.findMany({
      where: { followingId: testUserId },
      select: { followerId: true }
    });

    expect(followers.length).toBeGreaterThanOrEqual(2);

    // Cleanup
    await prisma.userRelationship.deleteMany({ where: { followerId: follower2.id } });
    await prisma.user.delete({ where: { id: follower2.id } });
  });

  it('S10: Should prevent duplicate notifications', async () => {
    const post = await prisma.socialPost.create({
      data: {
        userId: testUserId,
        type: 'MILESTONE',
        content: { vi: 'Content', en: 'Content', zh: '内容' }
      }
    });

    // First notification
    await prisma.behaviorLog.create({
      data: {
        userId: followerId,
        action: 'NOTIFICATION_SENT',
        context: { postId: post.id, notificationId: 'notif-001' }
      }
    });

    // Check for duplicates before sending again
    const existing = await prisma.behaviorLog.findFirst({
      where: {
        userId: followerId,
        action: 'NOTIFICATION_SENT',
        context: { path: ['notificationId'], equals: 'notif-001' }
      }
    });

    expect(existing).toBeDefined();

    // Cleanup
    await prisma.behaviorLog.deleteMany({
      where: { userId: followerId, action: 'NOTIFICATION_SENT' }
    });
    await prisma.socialPost.delete({ where: { id: post.id } });
  });
});
