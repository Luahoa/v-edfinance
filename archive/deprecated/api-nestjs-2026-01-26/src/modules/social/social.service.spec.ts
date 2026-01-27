import { BuddyRole, PostType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SocialService } from './social.service';

describe('SocialService', () => {
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
      },
      buddyMember: {
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
      },
      buddyGroup: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      buddyChallenge: {
        create: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      behaviorLog: {
        create: vi.fn(),
      },
      investmentProfile: {
        findUnique: vi.fn(),
      },
    };
    mockEventEmitter = {
      emit: vi.fn(),
    };
    mockSocialGateway = {
      broadcastNewPost: vi.fn(),
    };
    service = new SocialService(
      mockPrisma,
      mockEventEmitter,
      mockSocialGateway,
    );
  });

  describe('createPost', () => {
    it('should create a post and broadcast it', async () => {
      const mockPost = {
        id: 'p1',
        userId: 'u1',
        type: PostType.DISCUSSION,
        content: { vi: 'Xin chào' },
      };
      mockPrisma.socialPost.create.mockResolvedValue(mockPost);

      const result = await service.createPost('u1', PostType.DISCUSSION, {
        vi: 'Xin chào',
        en: 'Hello',
        zh: 'Ni hao',
      });

      expect(mockPrisma.socialPost.create).toHaveBeenCalled();
      expect(mockSocialGateway.broadcastNewPost).toHaveBeenCalledWith(mockPost);
      expect(result.id).toBe('p1');
    });
  });

  describe('joinGroup', () => {
    it('should allow a user to join a group and create a welcome post', async () => {
      mockPrisma.buddyGroup.findUnique.mockResolvedValue({
        id: 'g1',
        name: 'Test Group',
        members: [],
      });
      mockPrisma.buddyMember.create.mockResolvedValue({
        userId: 'u1',
        groupId: 'g1',
      });
      mockPrisma.socialPost.create.mockResolvedValue({ id: 'p1' });

      const result = await service.joinGroup('u1', 'g1');

      expect(mockPrisma.buddyMember.create).toHaveBeenCalled();
      expect(mockPrisma.socialPost.create).toHaveBeenCalled();
      expect(result.userId).toBe('u1');
    });

    it('should throw error if group is full', async () => {
      mockPrisma.buddyGroup.findUnique.mockResolvedValue({
        id: 'g1',
        name: 'Full Group',
        members: new Array(10).fill({}),
      });

      await expect(service.joinGroup('u1', 'g1')).rejects.toThrow(
        'Group is full',
      );
    });
  });

  describe('updateGroupStreak', () => {
    it('should increment group streak if all members are active', async () => {
      mockPrisma.buddyGroup.findUnique.mockResolvedValue({
        id: 'g1',
        name: 'Active Group',
        streak: 5,
        members: [{ user: { streaks: { currentStreak: 1 } } }],
      });
      mockPrisma.buddyGroup.update.mockResolvedValue({ id: 'g1' });

      await service.updateGroupStreak('g1');

      expect(mockPrisma.buddyGroup.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { streak: { increment: 1 } },
        }),
      );
    });

    it('should nudge group if some members are inactive', async () => {
      mockPrisma.buddyGroup.findUnique.mockResolvedValue({
        id: 'g1',
        name: 'Inactive Group',
        streak: 5,
        members: [
          { userId: 'u1', user: { streaks: { currentStreak: 0 } } },
          { userId: 'u2', user: { streaks: { currentStreak: 1 } } },
        ],
      });

      await service.updateGroupStreak('g1');

      expect(mockPrisma.buddyGroup.update).not.toHaveBeenCalled();
      expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: PostType.NUDGE,
          }),
        }),
      );
    });
  });

  describe('checkChallengeProgress', () => {
    it('should complete challenge and reward members if target reached', async () => {
      const mockChallenge = {
        id: 'c1',
        groupId: 'g1',
        target: 1000,
        rewardPoints: 100,
        group: {
          name: 'Group 1',
          members: [
            { userId: 'u1', user: { points: 600 } },
            { userId: 'u2', user: { points: 500 } },
          ],
        },
      };
      mockPrisma.buddyChallenge.findUnique.mockResolvedValue(mockChallenge);
      mockPrisma.user.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.buddyChallenge.delete.mockResolvedValue({});

      await service.checkChallengeProgress('c1');

      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['u1', 'u2'] } },
          data: { points: { increment: 100 } },
        }),
      );
      expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: PostType.ACHIEVEMENT,
          }),
        }),
      );
      expect(mockPrisma.buddyChallenge.delete).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
    });

    it('should fail challenge if expired and target not reached', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockChallenge = {
        id: 'c1',
        groupId: 'g1',
        target: 1000,
        rewardPoints: 100,
        expiresAt: pastDate,
        group: {
          name: 'Group 1',
          members: [{ userId: 'u1', user: { points: 100 } }],
        },
      };
      mockPrisma.buddyChallenge.findUnique.mockResolvedValue(mockChallenge);
      mockPrisma.buddyChallenge.delete.mockResolvedValue({});

      await service.checkChallengeProgress('c1');

      expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: PostType.NUDGE,
          }),
        }),
      );
      expect(mockPrisma.buddyChallenge.delete).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
    });
  });

  describe('generateCompetitiveNudge', () => {
    it('should generate nudge for the user in second place', async () => {
      mockPrisma.buddyMember.findMany.mockResolvedValue([
        { userId: 'u1', user: { email: 'leader@v.ed', points: 1000 } },
        { userId: 'u2', user: { email: 'second@v.ed', points: 800 } },
      ]);

      await service.generateCompetitiveNudge('g1');

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalled(); // via sendPushNotification
      expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: PostType.NUDGE,
            userId: 'u1',
          }),
        }),
      );
    });
  });

  describe('getFeed', () => {
    it('should return posts for user groups and public posts', async () => {
      mockPrisma.buddyMember.findMany.mockResolvedValue([{ groupId: 'g1' }]);
      mockPrisma.socialPost.findMany.mockResolvedValue([{ id: 'p1' }]);

      const result = await service.getFeed('u1');

      expect(mockPrisma.buddyMember.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        select: { groupId: true },
      });
      expect(mockPrisma.socialPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ groupId: { in: ['g1'] } }, { groupId: null }],
          },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('createGroup', () => {
    it('should create a group and add the creator as leader', async () => {
      const groupData = { name: 'New Group', description: 'Test' };
      mockPrisma.buddyGroup.create.mockResolvedValue({
        id: 'g1',
        ...groupData,
      });

      const result = await service.createGroup('u1', groupData);

      expect(mockPrisma.buddyGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Group',
            members: {
              create: {
                userId: 'u1',
                role: BuddyRole.LEADER,
              },
            },
          }),
        }),
      );
      expect(result.id).toBe('g1');
    });
  });

  describe('getGroupDetails', () => {
    it('should return group with members and challenges', async () => {
      mockPrisma.buddyGroup.findUnique.mockResolvedValue({
        id: 'g1',
        members: [],
        challenges: [],
      });

      const result = await service.getGroupDetails('g1');

      if (!result) {
        throw new Error('Expected result to be defined');
      }

      expect(result.id).toBe('g1');
      expect(mockPrisma.buddyGroup.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'g1' },
          include: expect.objectContaining({
            members: expect.objectContaining({
              include: {
                user: expect.objectContaining({
                  select: expect.any(Object),
                }),
              },
            }),
            challenges: true,
          }),
        }),
      );
      expect(result.id).toBe('g1');
    });
  });

  describe('getRecommendedGroups', () => {
    it('should return fallback groups if user has no profile', async () => {
      mockPrisma.investmentProfile.findUnique.mockResolvedValue(null);
      mockPrisma.buddyGroup.findMany.mockResolvedValue([{ id: 'g1' }]);

      const result = await service.getRecommendedGroups('u1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.buddyGroup.findMany).toHaveBeenCalledWith({ take: 3 });
    });

    it('should return learning groups for beginners', async () => {
      mockPrisma.investmentProfile.findUnique.mockResolvedValue({
        currentKnowledge: 'BEGINNER',
      });
      mockPrisma.buddyGroup.findMany.mockResolvedValue([{ id: 'g1' }]);

      await service.getRecommendedGroups('u1');

      expect(mockPrisma.buddyGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'LEARNING' },
        }),
      );
    });
  });

  describe('createGroupChallenge', () => {
    it('should create a challenge and announce it', async () => {
      const challengeData = {
        title: { vi: 'Thử thách', en: 'Challenge', zh: '挑战' },
        target: 1000,
        rewardPoints: 100,
        days: 7,
      };
      mockPrisma.buddyChallenge.create.mockResolvedValue({ id: 'c1' });
      mockPrisma.buddyMember.findFirst.mockResolvedValue({
        userId: 'leader-id',
      });

      const result = await service.createGroupChallenge('g1', challengeData);

      expect(mockPrisma.buddyChallenge.create).toHaveBeenCalled();
      expect(mockPrisma.socialPost.create).toHaveBeenCalled();
      expect(result.id).toBe('c1');
    });
  });

  describe('Challenge Progress Tracking (S005)', () => {
    it('should calculate progress correctly with partial completion', async () => {
      const mockChallenge = {
        id: 'c1',
        groupId: 'g1',
        target: 2000,
        rewardPoints: 200,
        group: {
          name: 'Group 1',
          members: [
            { userId: 'u1', user: { points: 800 } },
            { userId: 'u2', user: { points: 700 } },
          ],
        },
      };
      mockPrisma.buddyChallenge.findUnique.mockResolvedValue(mockChallenge);

      await service.checkChallengeProgress('c1');

      expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('should handle challenge with no members', async () => {
      const mockChallenge = {
        id: 'c1',
        groupId: 'g1',
        target: 1000,
        rewardPoints: 100,
        group: { name: 'Empty Group', members: [] },
      };
      mockPrisma.buddyChallenge.findUnique.mockResolvedValue(mockChallenge);
      mockPrisma.buddyChallenge.delete.mockResolvedValue({});

      await service.checkChallengeProgress('c1');
      expect(mockPrisma.buddyChallenge.delete).toHaveBeenCalled();
    });

    it('should handle concurrent challenge checks', async () => {
      const mockChallenge = {
        id: 'c1',
        groupId: 'g1',
        target: 1000,
        rewardPoints: 100,
        group: {
          name: 'Group 1',
          members: [{ userId: 'u1', user: { points: 1100 } }],
        },
      };
      mockPrisma.buddyChallenge.findUnique.mockResolvedValue(mockChallenge);
      mockPrisma.user.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.buddyChallenge.delete.mockResolvedValue({});

      const promises = [
        service.checkChallengeProgress('c1'),
        service.checkChallengeProgress('c1'),
      ];

      await Promise.all(promises);
      expect(mockPrisma.buddyChallenge.delete).toHaveBeenCalled();
    });
  });

  describe('Group Membership Validation (S005)', () => {
    it('should prevent joining already joined group', async () => {
      mockPrisma.buddyGroup.findUnique.mockResolvedValue({
        id: 'g1',
        name: 'Test Group',
        members: [{ userId: 'u1' }],
      });

      mockPrisma.buddyMember.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.joinGroup('u1', 'g1')).rejects.toThrow();
    });

    it('should validate group exists before joining', async () => {
      mockPrisma.buddyGroup.findUnique.mockResolvedValue(null);

      await expect(service.joinGroup('u1', 'non-existent')).rejects.toThrow();
    });

    it('should handle group at max capacity minus one', async () => {
      mockPrisma.buddyGroup.findUnique.mockResolvedValue({
        id: 'g1',
        name: 'Almost Full',
        members: new Array(9).fill({}),
      });
      mockPrisma.buddyMember.create.mockResolvedValue({
        userId: 'u1',
        groupId: 'g1',
      });
      mockPrisma.socialPost.create.mockResolvedValue({ id: 'p1' });

      const result = await service.joinGroup('u1', 'g1');
      expect(result.userId).toBe('u1');
    });
  });

  describe('WebSocket Broadcast Integration (S005)', () => {
    it('should broadcast post creation to all members', async () => {
      const mockPost = {
        id: 'p1',
        userId: 'u1',
        type: PostType.DISCUSSION,
        content: { vi: 'Test' },
      };
      mockPrisma.socialPost.create.mockResolvedValue(mockPost);

      await service.createPost('u1', PostType.DISCUSSION, {
        vi: 'Test',
        en: 'Test',
        zh: 'Test',
      });

      expect(mockSocialGateway.broadcastNewPost).toHaveBeenCalledWith(mockPost);
    });

    it('should handle broadcast failure gracefully', async () => {
      const mockPost = { id: 'p1', userId: 'u1', type: PostType.DISCUSSION };
      mockPrisma.socialPost.create.mockResolvedValue(mockPost);
      mockSocialGateway.broadcastNewPost.mockImplementation(() => {
        throw new Error('WS Error');
      });

      // Broadcast failure should not fail post creation
      const result = await service.createPost('u1', PostType.DISCUSSION, {
        vi: 'Test',
        en: 'Test',
        zh: 'Test',
      });
      expect(result).toEqual(mockPost);
    });
  });

  describe('Group Streak Edge Cases (S005)', () => {
    it('should not increment streak if any member inactive', async () => {
      mockPrisma.buddyGroup.findUnique.mockResolvedValue({
        id: 'g1',
        name: 'Mixed Activity',
        streak: 3,
        members: [
          { userId: 'u1', user: { streaks: { currentStreak: 5 } } },
          { userId: 'u2', user: { streaks: { currentStreak: 0 } } },
        ],
      });

      await service.updateGroupStreak('g1');
      expect(mockPrisma.buddyGroup.update).not.toHaveBeenCalled();
    });

    it('should handle group with all active members', async () => {
      mockPrisma.buddyGroup.findUnique.mockResolvedValue({
        id: 'g1',
        name: 'All Active',
        streak: 10,
        members: [
          { userId: 'u1', user: { streaks: { currentStreak: 11 } } },
          { userId: 'u2', user: { streaks: { currentStreak: 8 } } },
        ],
      });
      mockPrisma.buddyGroup.update.mockResolvedValue({ id: 'g1' });

      await service.updateGroupStreak('g1');
      expect(mockPrisma.buddyGroup.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { streak: { increment: 1 } },
        }),
      );
    });

    it('should handle missing streak data', async () => {
      mockPrisma.buddyGroup.findUnique.mockResolvedValue({
        id: 'g1',
        name: 'No Streaks',
        streak: 0,
        members: [{ userId: 'u1', user: { streaks: null } }],
      });

      await service.updateGroupStreak('g1');
      expect(mockPrisma.buddyGroup.update).not.toHaveBeenCalled();
    });
  });

  describe('Feed Generation (S005)', () => {
    it('should return empty feed if user has no groups', async () => {
      mockPrisma.buddyMember.findMany.mockResolvedValue([]);
      mockPrisma.socialPost.findMany.mockResolvedValue([]);

      const result = await service.getFeed('u1');
      expect(result).toEqual([]);
    });

    it('should include public posts for all users', async () => {
      mockPrisma.buddyMember.findMany.mockResolvedValue([]);
      mockPrisma.socialPost.findMany.mockResolvedValue([
        { id: 'p1', groupId: null, content: { vi: 'Public' } },
      ]);

      const result = await service.getFeed('u1');
      expect(result).toHaveLength(1);
    });

    it('should combine group and public posts', async () => {
      mockPrisma.buddyMember.findMany.mockResolvedValue([{ groupId: 'g1' }]);
      mockPrisma.socialPost.findMany.mockResolvedValue([
        { id: 'p1', groupId: 'g1' },
        { id: 'p2', groupId: null },
      ]);

      const result = await service.getFeed('u1');
      expect(result).toHaveLength(2);
    });
  });

  describe('Competitive Nudge Generation (S005)', () => {
    it('should not generate nudge if only one member', async () => {
      mockPrisma.buddyMember.findMany.mockResolvedValue([
        { userId: 'u1', user: { email: 'solo@v.ed', points: 100 } },
      ]);

      await service.generateCompetitiveNudge('g1');
      expect(mockPrisma.socialPost.create).not.toHaveBeenCalled();
    });

    it('should target second place correctly', async () => {
      mockPrisma.buddyMember.findMany.mockResolvedValue([
        { userId: 'u1', user: { email: 'first@v.ed', points: 1000 } },
        { userId: 'u2', user: { email: 'second@v.ed', points: 900 } },
        { userId: 'u3', user: { email: 'third@v.ed', points: 800 } },
      ]);

      await service.generateCompetitiveNudge('g1');

      expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u1',
          }),
        }),
      );
    });
  });
});
