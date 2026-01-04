import { PostType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialService } from './social.service';

describe('ActivityFeedService (SocialService)', () => {
  let service: SocialService;
  let mockPrisma: any;
  let mockEventEmitter: any;
  let mockSocialGateway: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      socialPost: {
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      buddyMember: {
        findMany: vi.fn(),
      },
      behaviorLog: {
        create: vi.fn(),
      },
      user: {
        select: vi.fn(),
      },
    };
    mockEventEmitter = { emit: vi.fn() };
    mockSocialGateway = { broadcastNewPost: vi.fn() };
    service = new SocialService(
      mockPrisma,
      mockEventEmitter,
      mockSocialGateway,
    );
  });

  describe('Feed Generation & Pagination', () => {
    it('should fetch feed with pagination (limit and offset)', async () => {
      mockPrisma.buddyMember.findMany.mockResolvedValue([{ groupId: 'g1' }]);
      mockPrisma.socialPost.findMany.mockResolvedValue([
        { id: 'p1', type: PostType.ACHIEVEMENT },
        { id: 'p2', type: PostType.MILESTONE },
      ]);

      const result = await service.getFeed('u1', 10, 5);

      expect(mockPrisma.socialPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
          where: expect.objectContaining({
            OR: [{ groupId: { in: ['g1'] } }, { groupId: null }],
          }),
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('should include friends activities in the feed', async () => {
      mockPrisma.buddyMember.findMany.mockResolvedValue([
        { groupId: 'group-friends' },
      ]);
      mockPrisma.socialPost.findMany.mockResolvedValue([
        { id: 'p1', userId: 'friend-1', content: { vi: 'Friend achievement' } },
      ]);

      const result = await service.getFeed('u1');

      expect(result[0].userId).toBe('friend-1');
      expect(mockPrisma.socialPost.findMany).toHaveBeenCalled();
    });
  });

  describe('Like & Comment Functionality', () => {
    it('should increment likesCount when liking a post', async () => {
      mockPrisma.socialPost.update.mockResolvedValue({
        id: 'p1',
        likesCount: 1,
      });

      const result = await service.likePost('u1', 'p1');

      expect(mockPrisma.socialPost.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { likesCount: { increment: 1 } },
      });
      expect(result.likesCount).toBe(1);
    });

    it('should create a behavior log when commenting on a post', async () => {
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'log1' });

      const result = await service.commentOnPost('u1', 'p1', 'Great job!');

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          eventType: 'POST_COMMENT',
          payload: { postId: 'p1', content: 'Great job!' },
        }),
      });
      expect(result.id).toBe('log1');
    });
  });

  describe('Multi-user Activity Mocking', () => {
    it('should handle feed from multiple users across different groups', async () => {
      mockPrisma.buddyMember.findMany.mockResolvedValue([
        { groupId: 'group1' },
        { groupId: 'group2' },
      ]);

      mockPrisma.socialPost.findMany.mockResolvedValue([
        { id: 'p1', userId: 'user2', groupId: 'group1' },
        { id: 'p2', userId: 'user3', groupId: 'group2' },
        { id: 'p3', userId: 'user4', groupId: null },
      ]);

      const result = await service.getFeed('u1');

      expect(mockPrisma.socialPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ groupId: { in: ['group1', 'group2'] } }, { groupId: null }],
          },
        }),
      );
      expect(result).toHaveLength(3);
    });
  });
});
