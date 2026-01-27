import { BuddyRole, PostType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialService } from './social.service';

describe('SocialService - P2P Challenges', () => {
  let service: SocialService;
  let mockPrisma: any;
  let mockEventEmitter: any;
  let mockSocialGateway: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      socialPost: { create: vi.fn() },
      buddyMember: { findMany: vi.fn(), findFirst: vi.fn() },
      buddyGroup: { findUnique: vi.fn(), update: vi.fn() },
      buddyChallenge: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
      user: { updateMany: vi.fn() },
      behaviorLog: { create: vi.fn() },
    };
    mockEventEmitter = { emit: vi.fn() };
    mockSocialGateway = { broadcastNewPost: vi.fn() };
    service = new SocialService(
      mockPrisma,
      mockEventEmitter,
      mockSocialGateway,
    );
  });

  describe('Challenge Creation & Invitation', () => {
    it('should create a challenge and post an announcement from the leader', async () => {
      const challengeData = {
        title: {
          vi: 'Thử thách tiết kiệm',
          en: 'Saving Challenge',
          zh: '储蓄挑战',
        },
        target: 5000,
        rewardPoints: 500,
        days: 30,
      };

      mockPrisma.buddyChallenge.create.mockResolvedValue({
        id: 'challenge-123',
        ...challengeData,
      });
      mockPrisma.buddyMember.findFirst.mockResolvedValue({
        userId: 'leader-01',
      });

      const result = await service.createGroupChallenge(
        'group-01',
        challengeData,
      );

      expect(mockPrisma.buddyChallenge.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          groupId: 'group-01',
          target: 5000,
          rewardPoints: 500,
        }),
      });

      expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'leader-01',
            type: PostType.MILESTONE,
            groupId: 'group-01',
          }),
        }),
      );
      expect(result.id).toBe('challenge-123');
    });

    it('should fallback to system user if no leader is found for announcement', async () => {
      mockPrisma.buddyMember.findFirst.mockResolvedValue(null);
      await service.createGroupChallenge('group-01', {
        title: { vi: 'T', en: 'T', zh: 'T' },
        target: 100,
        rewardPoints: 10,
        days: 1,
      });

      expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'system' }),
        }),
      );
    });
  });

  describe('Progress Tracking & Winner Determination', () => {
    it('should reward all members and delete challenge when target is reached', async () => {
      const mockChallenge = {
        id: 'c1',
        target: 1000,
        rewardPoints: 200,
        groupId: 'g1',
        group: {
          name: 'Alpha Team',
          members: [
            { userId: 'u1', user: { points: 600 } },
            { userId: 'u2', user: { points: 500 } },
          ],
        },
      };

      mockPrisma.buddyChallenge.findUnique.mockResolvedValue(mockChallenge);

      await service.checkChallengeProgress('c1');

      // Verify reward distribution
      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['u1', 'u2'] } },
        data: { points: { increment: 200 } },
      });

      // Verify achievement post
      expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: PostType.ACHIEVEMENT,
            content: expect.objectContaining({
              vi: expect.stringContaining('Chúc mừng! Nhóm Alpha Team'),
            }),
          }),
        }),
      );

      // Verify cleanup
      expect(mockPrisma.buddyChallenge.delete).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
    });

    it('should fail and delete challenge if expired without reaching target', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      const mockChallenge = {
        id: 'c2',
        target: 10000,
        rewardPoints: 1000,
        expiresAt: expiredDate,
        group: {
          name: 'Lazy Team',
          members: [{ userId: 'u1', user: { points: 100 } }],
        },
      };

      mockPrisma.buddyChallenge.findUnique.mockResolvedValue(mockChallenge);

      await service.checkChallengeProgress('c2');

      expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: PostType.NUDGE,
            content: expect.objectContaining({
              vi: expect.stringContaining('Thử thách thất bại!'),
            }),
          }),
        }),
      );
      expect(mockPrisma.buddyChallenge.delete).toHaveBeenCalledWith({
        where: { id: 'c2' },
      });
    });

    it('should do nothing if challenge is neither reached nor expired', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      mockPrisma.buddyChallenge.findUnique.mockResolvedValue({
        id: 'c3',
        target: 1000,
        expiresAt: futureDate,
        group: {
          members: [{ userId: 'u1', user: { points: 100 } }],
        },
      });

      await service.checkChallengeProgress('c3');

      expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.buddyChallenge.delete).not.toHaveBeenCalled();
    });
  });

  describe('Competitive P2P Nudges', () => {
    it('should send push notification to trailing user when someone is leading', async () => {
      mockPrisma.buddyMember.findMany.mockResolvedValue([
        { userId: 'leader', user: { email: 'leader@edu.vn', points: 1000 } },
        { userId: 'follower', user: { email: 'follower@edu.vn', points: 950 } },
      ]);

      await service.generateCompetitiveNudge('group-01');

      // Check Push Notification (via behaviorLog in SocialService)
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'follower',
            eventType: 'PUSH_SENT',
          }),
        }),
      );

      // Check Social Post
      expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'leader',
            type: PostType.NUDGE,
          }),
        }),
      );
    });

    it('should return null if there are fewer than 2 members', async () => {
      mockPrisma.buddyMember.findMany.mockResolvedValue([{ userId: 'solo' }]);
      const result = await service.generateCompetitiveNudge('group-01');
      expect(result).toBeNull();
    });
  });
});
