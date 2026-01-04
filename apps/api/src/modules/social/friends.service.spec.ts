import { RelationStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialService } from './social.service';

describe('SocialService - Friends System', () => {
  let service: SocialService;
  let mockPrisma: any;
  let mockEventEmitter: any;
  let mockSocialGateway: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      userRelationship: {
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
      },
      socialPost: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn((promises) => Promise.all(promises)),
    };
    mockEventEmitter = { emit: vi.fn() };
    mockSocialGateway = { broadcastNewPost: vi.fn() };
    service = new SocialService(
      mockPrisma,
      mockEventEmitter,
      mockSocialGateway,
    );
  });

  describe('Friend Requests', () => {
    it('should send a friend request', async () => {
      mockPrisma.userRelationship.create.mockResolvedValue({ id: 'r1' });
      await service.sendFriendRequest('u1', 'u2');
      expect(mockPrisma.userRelationship.create).toHaveBeenCalledWith({
        data: {
          followerId: 'u1',
          followedId: 'u2',
          status: RelationStatus.FRIEND_REQUESTED,
        },
      });
    });

    it('should accept a friend request', async () => {
      await service.acceptFriendRequest('u1', 'u2');
      expect(mockPrisma.userRelationship.update).toHaveBeenCalled();
      expect(mockPrisma.userRelationship.upsert).toHaveBeenCalled();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should reject a friend request', async () => {
      await service.rejectFriendRequest('u1', 'u2');
      expect(mockPrisma.userRelationship.delete).toHaveBeenCalledWith({
        where: {
          followerId_followedId: { followerId: 'u1', followedId: 'u2' },
        },
      });
    });
  });

  describe('Blocking', () => {
    it('should block a user', async () => {
      await service.blockUser('u1', 'u2');
      expect(mockPrisma.userRelationship.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            followerId_followedId: { followerId: 'u1', followedId: 'u2' },
          },
          update: { status: RelationStatus.BLOCKED },
        }),
      );
    });

    it('should unblock a user', async () => {
      await service.unblockUser('u1', 'u2');
      expect(mockPrisma.userRelationship.delete).toHaveBeenCalledWith({
        where: {
          followerId_followedId: { followerId: 'u1', followedId: 'u2' },
        },
      });
    });
  });

  describe('Activity Feed', () => {
    it('should get friend activity feed', async () => {
      mockPrisma.userRelationship.findMany.mockResolvedValue([
        { followedId: 'u2' },
        { followedId: 'u3' },
      ]);
      mockPrisma.socialPost.findMany.mockResolvedValue([
        { id: 'p1' },
        { id: 'p2' },
      ]);

      const feed = await service.getFriendActivityFeed('u1');

      expect(mockPrisma.userRelationship.findMany).toHaveBeenCalled();
      expect(mockPrisma.socialPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: { in: ['u2', 'u3'] } },
        }),
      );
      expect(feed).toHaveLength(2);
    });
  });
});
