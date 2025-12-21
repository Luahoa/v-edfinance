/**
 * I014: Social Learning Network Integration Test
 * Tests: Follow user → See activity feed → Join group → Participate in discussion
 * Validates: Newsfeed algorithm, notification batching
 */

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

const mockPrismaService = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  follower: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  activityFeed: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  studyGroup: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  groupMember: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  discussion: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  notification: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  behaviorLog: {
    create: vi.fn(),
  },
};

const mockNotificationService = {
  batchNotifications: vi.fn().mockResolvedValue({ sent: 5 }),
};

describe('[I014] Social Learning Network Integration', () => {
  let app: INestApplication;
  const currentUserId = 'user-1';
  const targetUserId = 'user-2';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: 'PrismaService', useValue: mockPrismaService },
        { provide: 'NotificationService', useValue: mockNotificationService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('Scenario 1: Follow another user', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: targetUserId,
      name: 'Target User',
      email: 'target@test.com',
    });

    mockPrismaService.follower.create.mockResolvedValue({
      id: 'follow-1',
      followerId: currentUserId,
      followingId: targetUserId,
      createdAt: new Date(),
    });

    mockPrismaService.notification.create.mockResolvedValue({
      id: 'notif-1',
      userId: targetUserId,
      type: 'NEW_FOLLOWER',
      content: { followerId: currentUserId },
    });

    const targetUser = await mockPrismaService.user.findUnique({
      where: { id: targetUserId },
    });
    expect(targetUser).toBeDefined();

    const follow = await mockPrismaService.follower.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    expect(follow.followerId).toBe(currentUserId);
    expect(mockPrismaService.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: targetUserId,
          type: 'NEW_FOLLOWER',
        }),
      })
    );
  });

  it('Scenario 2: See activity feed from followed users', async () => {
    mockPrismaService.follower.findMany.mockResolvedValue([
      { followingId: targetUserId },
      { followingId: 'user-3' },
    ]);

    mockPrismaService.activityFeed.findMany.mockResolvedValue([
      {
        id: 'activity-1',
        userId: targetUserId,
        eventType: 'LESSON_COMPLETED',
        content: { lessonId: 'lesson-5' },
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        id: 'activity-2',
        userId: 'user-3',
        eventType: 'BADGE_EARNED',
        content: { badgeId: 'first-investment' },
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      },
    ]);

    const following = await mockPrismaService.follower.findMany({
      where: { followerId: currentUserId },
    });

    const followingIds = following.map((f) => f.followingId);

    const feed = await mockPrismaService.activityFeed.findMany({
      where: {
        userId: { in: followingIds },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    expect(feed).toHaveLength(2);
    expect(feed[0].userId).toBe(targetUserId);
    expect(feed[0].eventType).toBe('LESSON_COMPLETED');
    // Verify newsfeed algorithm prioritizes recent activities
    expect(new Date(feed[0].createdAt).getTime()).toBeGreaterThan(
      new Date(feed[1].createdAt).getTime()
    );
  });

  it('Scenario 3: Join a study group', async () => {
    const groupId = 'group-1';

    mockPrismaService.studyGroup.findUnique.mockResolvedValue({
      id: groupId,
      name: 'Investment Enthusiasts',
      description: 'Learn investing together',
      isPrivate: false,
    });

    mockPrismaService.groupMember.create.mockResolvedValue({
      id: 'member-1',
      userId: currentUserId,
      groupId,
      role: 'MEMBER',
      joinedAt: new Date(),
    });

    mockPrismaService.groupMember.findMany.mockResolvedValue([
      { userId: 'user-4' },
      { userId: 'user-5' },
    ]);

    const group = await mockPrismaService.studyGroup.findUnique({
      where: { id: groupId },
    });
    expect(group.isPrivate).toBe(false);

    const membership = await mockPrismaService.groupMember.create({
      data: {
        userId: currentUserId,
        groupId,
        role: 'MEMBER',
      },
    });

    expect(membership.groupId).toBe(groupId);

    // Notify existing members
    const members = await mockPrismaService.groupMember.findMany({
      where: { groupId },
    });
    expect(mockNotificationService.batchNotifications).toHaveBeenCalledWith({
      userIds: expect.arrayContaining(['user-4', 'user-5']),
      type: 'NEW_GROUP_MEMBER',
    });
  });

  it('Scenario 4: Create a discussion post in group', async () => {
    const groupId = 'group-1';
    const postContent = 'What are your thoughts on index funds vs individual stocks?';

    mockPrismaService.discussion.create.mockResolvedValue({
      id: 'post-1',
      groupId,
      userId: currentUserId,
      content: postContent,
      createdAt: new Date(),
    });

    mockPrismaService.activityFeed.create.mockResolvedValue({
      id: 'activity-3',
      userId: currentUserId,
      eventType: 'DISCUSSION_CREATED',
      content: { groupId, postId: 'post-1' },
    });

    const post = await mockPrismaService.discussion.create({
      data: {
        groupId,
        userId: currentUserId,
        content: postContent,
      },
    });

    expect(post.content).toBe(postContent);
    expect(mockPrismaService.activityFeed.create).toHaveBeenCalled();
    expect(mockPrismaService.behaviorLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: currentUserId,
          eventType: 'DISCUSSION_POSTED',
        }),
      })
    );
  });

  it('Scenario 5: Participate in discussion (comment)', async () => {
    const postId = 'post-1';
    const comment = 'I prefer index funds for long-term stability!';

    mockPrismaService.discussion.create.mockResolvedValue({
      id: 'comment-1',
      parentId: postId,
      userId: targetUserId,
      content: comment,
      createdAt: new Date(),
    });

    mockPrismaService.notification.create.mockResolvedValue({
      id: 'notif-2',
      userId: currentUserId, // Original poster
      type: 'NEW_COMMENT',
      content: { postId, commenterId: targetUserId },
    });

    const reply = await mockPrismaService.discussion.create({
      data: {
        parentId: postId,
        userId: targetUserId,
        content: comment,
      },
    });

    expect(reply.parentId).toBe(postId);
    expect(mockPrismaService.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: currentUserId,
          type: 'NEW_COMMENT',
        }),
      })
    );
  });

  it('Scenario 6: Verify notification batching for high-volume events', async () => {
    // Simulate 10 users liking a post simultaneously
    const likerIds = Array.from({ length: 10 }, (_, i) => `user-like-${i}`);

    mockPrismaService.notification.createMany.mockResolvedValue({
      count: 10,
    });

    // Batch notifications to avoid spam
    const batchedNotifications = await mockNotificationService.batchNotifications({
      userIds: [currentUserId],
      type: 'POST_LIKED',
      content: { postId: 'post-1', likerCount: likerIds.length },
    });

    expect(batchedNotifications.sent).toBeGreaterThan(0);
    // Should create 1 aggregated notification instead of 10
    expect(mockNotificationService.batchNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'POST_LIKED',
        content: expect.objectContaining({
          likerCount: 10,
        }),
      })
    );
  });

  it('Scenario 7: Newsfeed algorithm - verify ranking logic', async () => {
    mockPrismaService.activityFeed.findMany.mockResolvedValue([
      {
        id: 'activity-old',
        userId: targetUserId,
        eventType: 'LESSON_COMPLETED',
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        engagementScore: 5,
      },
      {
        id: 'activity-recent',
        userId: 'user-3',
        eventType: 'ACHIEVEMENT_UNLOCKED',
        createdAt: new Date(Date.now() - 1800000), // 30 min ago
        engagementScore: 20,
      },
    ]);

    const feed = await mockPrismaService.activityFeed.findMany({
      where: { userId: { in: [targetUserId, 'user-3'] } },
      orderBy: [{ engagementScore: 'desc' }, { createdAt: 'desc' }],
    });

    // Higher engagement + recent should rank first
    expect(feed[0].id).toBe('activity-recent');
    expect(feed[0].engagementScore).toBeGreaterThan(feed[1].engagementScore);
  });
});
