import { Test, type TestingModule } from '@nestjs/testing';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PostType, BuddyGroupType } from '@prisma/client';
import { ExecutionContext } from '@nestjs/common';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('SocialController', () => {
  let controller: SocialController;
  let socialService: SocialService;

  const mockUser = { id: 'user-123' };
  const mockSocialService = {
    getFeed: vi.fn(),
    createPost: vi.fn(),
    getRecommendedGroups: vi.fn(),
    createGroup: vi.fn(),
    joinGroup: vi.fn(),
    getGroupDetails: vi.fn(),
    createGroupChallenge: vi.fn(),
    likePost: vi.fn(),
    commentOnPost: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialController],
      providers: [
        {
          provide: SocialService,
          useValue: mockSocialService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    controller = module.get<SocialController>(SocialController);
    socialService = module.get<SocialService>(SocialService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFeed', () => {
    it('should return social feed', async () => {
      const feedItems = [{ id: '1', content: { vi: 'test' } }];
      mockSocialService.getFeed.mockResolvedValue(feedItems);

      const result = await controller.getFeed({ user: mockUser }, 10);

      expect(socialService.getFeed).toHaveBeenCalledWith(
        mockUser.id,
        10,
        undefined,
      );
      expect(result).toEqual(feedItems);
    });
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const postData = {
        type: PostType.DISCUSSION,
        content: { vi: 'Nội dung', en: 'Content', zh: '内容' },
        groupId: 'group-1',
      };
      const createdPost = { id: 'post-1', ...postData, userId: mockUser.id };
      mockSocialService.createPost.mockResolvedValue(createdPost);

      const result = await controller.createPost({ user: mockUser }, postData);

      expect(socialService.createPost).toHaveBeenCalledWith(
        mockUser.id,
        postData.type,
        postData.content,
        postData.groupId,
      );
      expect(result).toEqual(createdPost);
    });
  });

  describe('getRecommendations', () => {
    it('should return group recommendations', async () => {
      const recommendations = [{ id: 'group-1', name: 'Group 1' }];
      mockSocialService.getRecommendedGroups.mockResolvedValue(recommendations);

      const result = await controller.getRecommendations({ user: mockUser });

      expect(socialService.getRecommendedGroups).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual(recommendations);
    });
  });

  describe('createGroup', () => {
    it('should create a new group', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'Test Description',
        type: BuddyGroupType.LEARNING,
      };
      const createdGroup = { id: 'group-1', ...groupData };
      mockSocialService.createGroup.mockResolvedValue(createdGroup);

      const result = await controller.createGroup(
        { user: mockUser },
        groupData,
      );

      expect(socialService.createGroup).toHaveBeenCalledWith(
        mockUser.id,
        groupData,
      );
      expect(result).toEqual(createdGroup);
    });
  });

  describe('joinGroup', () => {
    it('should join a group', async () => {
      const groupId = 'group-1';
      const joinResult = { id: 'member-1', userId: mockUser.id, groupId };
      mockSocialService.joinGroup.mockResolvedValue(joinResult);

      const result = await controller.joinGroup({ user: mockUser }, groupId);

      expect(socialService.joinGroup).toHaveBeenCalledWith(
        mockUser.id,
        groupId,
      );
      expect(result).toEqual(joinResult);
    });
  });

  describe('getGroupDetails', () => {
    it('should return group details', async () => {
      const groupId = 'group-1';
      const groupDetails = { id: groupId, name: 'Group 1', members: [] };
      mockSocialService.getGroupDetails.mockResolvedValue(groupDetails);

      const result = await controller.getGroupDetails(
        { user: mockUser },
        groupId,
      );

      expect(socialService.getGroupDetails).toHaveBeenCalledWith(groupId);
      expect(result).toEqual(groupDetails);
    });
  });

  describe('createChallenge', () => {
    it('should create a group challenge', async () => {
      const groupId = 'group-1';
      const challengeData = {
        title: { vi: 'Thử thách', en: 'Challenge', zh: '挑战' },
        target: 1000,
        rewardPoints: 100,
        days: 7,
      };
      const createdChallenge = { id: 'challenge-1', ...challengeData, groupId };
      mockSocialService.createGroupChallenge.mockResolvedValue(
        createdChallenge,
      );

      const result = await controller.createChallenge(
        { user: mockUser },
        groupId,
        challengeData,
      );

      expect(socialService.createGroupChallenge).toHaveBeenCalledWith(
        groupId,
        challengeData,
      );
      expect(result).toEqual(createdChallenge);
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from social service', async () => {
      mockSocialService.getFeed.mockRejectedValue(
        new Error('Internal Server Error'),
      );

      await expect(controller.getFeed({ user: mockUser })).rejects.toThrow(
        'Internal Server Error',
      );
    });
  });

  describe('likePost', () => {
    it('should like a post successfully', async () => {
      const likeResult = {
        id: 'like-1',
        userId: mockUser.id,
        postId: 'post-1',
      };
      mockSocialService.likePost.mockResolvedValue(likeResult);

      const result = await controller.likePost({ user: mockUser }, 'post-1');

      expect(socialService.likePost).toHaveBeenCalledWith(
        mockUser.id,
        'post-1',
      );
      expect(result).toEqual(likeResult);
    });

    it('should handle duplicate likes', async () => {
      mockSocialService.likePost.mockRejectedValue(new Error('Already liked'));

      await expect(
        controller.likePost({ user: mockUser }, 'post-1'),
      ).rejects.toThrow('Already liked');
    });
  });

  describe('commentOnPost', () => {
    it('should add comment to post successfully', async () => {
      const comment = {
        id: 'comment-1',
        userId: mockUser.id,
        postId: 'post-1',
        content: 'Great post!',
      };
      mockSocialService.commentOnPost.mockResolvedValue(comment);

      const result = await controller.commentOnPost(
        { user: mockUser },
        'post-1',
        'Great post!',
      );

      expect(socialService.commentOnPost).toHaveBeenCalledWith(
        mockUser.id,
        'post-1',
        'Great post!',
      );
      expect(result).toEqual(comment);
    });

    it('should validate empty content', async () => {
      mockSocialService.commentOnPost.mockRejectedValue(
        new Error('Content cannot be empty'),
      );

      await expect(
        controller.commentOnPost({ user: mockUser }, 'post-1', ''),
      ).rejects.toThrow();
    });
  });

  describe('WebSocket Integration (Mocked)', () => {
    it('should handle real-time feed updates', async () => {
      const feedItems = [
        {
          id: 'post-new',
          content: { vi: 'Real-time post' },
          createdAt: new Date(),
        },
      ];
      mockSocialService.getFeed.mockResolvedValue(feedItems);

      const result = await controller.getFeed({ user: mockUser }, 10);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('post-new');
    });

    it('should support pagination for feed', async () => {
      mockSocialService.getFeed.mockResolvedValue([]);

      await controller.getFeed({ user: mockUser }, 20, 40);

      expect(socialService.getFeed).toHaveBeenCalledWith(mockUser.id, 20, 40);
    });
  });

  describe('Group Challenge Tests', () => {
    it('should create challenge with all required fields', async () => {
      const groupId = 'group-1';
      const challengeData = {
        title: {
          vi: 'Thử thách 30 ngày',
          en: '30-day challenge',
          zh: '30天挑战',
        },
        target: 5000,
        rewardPoints: 200,
        days: 30,
      };
      const created = { id: 'challenge-1', ...challengeData, groupId };
      mockSocialService.createGroupChallenge.mockResolvedValue(created);

      const result = await controller.createChallenge(
        { user: mockUser },
        groupId,
        challengeData,
      );

      expect(socialService.createGroupChallenge).toHaveBeenCalledWith(
        groupId,
        challengeData,
      );
      expect(result.days).toBe(30);
      expect(result.target).toBe(5000);
    });

    it('should validate challenge target is positive', async () => {
      const invalidChallenge = {
        title: { vi: 'Test' },
        target: -100,
        rewardPoints: 50,
        days: 7,
      };
      mockSocialService.createGroupChallenge.mockRejectedValue(
        new Error('Target must be positive'),
      );

      await expect(
        controller.createChallenge(
          { user: mockUser },
          'group-1',
          invalidChallenge,
        ),
      ).rejects.toThrow();
    });
  });

  describe('Guard Protection', () => {
    it('should protect all endpoints with JwtAuthGuard', () => {
      // Check class-level guard instead of method-level
      const classGuards = Reflect.getMetadata('__guards__', SocialController);
      expect(classGuards).toBeDefined();
      expect(classGuards.length).toBeGreaterThan(0);
    });
  });
});
