import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PostType, BuddyRole } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SocialModule } from './social.module';
import { SocialService } from './social.service';
import { SocialGateway } from './social.gateway';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WsJwtGuard } from '../../auth/ws-jwt.guard';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Social Integration', () => {
  let app: INestApplication;
  let socialService: SocialService;
  let socialGateway: SocialGateway;
  let prismaService: PrismaService;

  const mockPrisma = {
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
      findUnique: vi.fn(),
    },
    behaviorLog: {
      create: vi.fn(),
    },
    investmentProfile: {
      findUnique: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };

  const mockEventEmitter = {
    emit: vi.fn(),
  };

  beforeEach(async () => {
    // vi.clearAllMocks(); // We'll manage mocks manually to avoid interference

    // Explicitly reset specific prisma mocks that might leak
    mockPrisma.socialPost.create.mockReset().mockResolvedValue({
      id: 'p' + Math.random(),
      type: PostType.DISCUSSION,
    });
    mockPrisma.socialPost.findMany.mockReset();
    mockPrisma.buddyMember.findMany.mockReset();
    mockPrisma.buddyMember.create.mockReset();
    mockPrisma.buddyGroup.update.mockReset();
    mockPrisma.buddyGroup.findUnique.mockReset();
    mockPrisma.user.updateMany.mockReset();
    mockPrisma.behaviorLog.create.mockReset();
    mockPrisma.buddyChallenge.findUnique.mockReset();
    mockPrisma.buddyChallenge.delete.mockReset();
    mockPrisma.buddyMember.findFirst.mockReset();
    mockPrisma.investmentProfile.findUnique.mockReset();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        SocialGateway,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(WsJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    socialService = moduleFixture.get<SocialService>(SocialService);
    socialGateway = moduleFixture.get<SocialGateway>(SocialGateway);
    // prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Mock WebSocket server
    socialGateway.server = {
      emit: vi.fn(),
      to: vi.fn().mockReturnThis(),
    } as any;

    // Reset emitter spy
    mockEventEmitter.emit.mockReset();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    vi.clearAllMocks();
  });

  describe('End-to-end Social Flow', () => {
    it('should handle full cycle: join group -> welcome post -> leaderboard nudge -> notification', async () => {
      const userId = 'u1';
      const groupId = 'g1';
      const mockGroup = {
        id: groupId,
        name: 'Alpha Traders',
        members: [],
      };

      mockPrisma.buddyGroup.findUnique.mockResolvedValue(mockGroup);
      mockPrisma.buddyMember.create.mockResolvedValue({ userId, groupId });
      mockPrisma.socialPost.create.mockResolvedValue({
        id: 'post1',
        type: PostType.DISCUSSION,
      });

      // 1. User joins group
      await socialService.joinGroup(userId, groupId);

      expect(mockPrisma.buddyMember.create).toHaveBeenCalledWith({
        data: { userId, groupId },
      });
      // Should broadcast welcome post
      expect(socialGateway.server.emit).toHaveBeenCalledWith(
        'new_post',
        expect.any(Object),
      );

      // 2. Leaderboard Nudge
      mockPrisma.buddyMember.findMany.mockResolvedValue([
        { userId: 'u1', user: { email: 'user1@v.ed', points: 1000 } },
        { userId: 'u2', user: { email: 'user2@v.ed', points: 800 } },
      ]);

      await socialService.generateCompetitiveNudge(groupId);

      // Should send push notification to u2 (second place)
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u2',
            eventType: 'PUSH_SENT',
          }),
        }),
      );

      // Should create nudge post by u1 (leader)
      expect(mockPrisma.socialPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u1',
            type: PostType.NUDGE,
          }),
        }),
      );
    });

    it('should synchronize WebSocket broadcasts with REST API actions', async () => {
      const userId = 'u1';
      const postData = {
        type: PostType.DISCUSSION,
        content: { vi: 'Chào mọi người', en: 'Hello all', zh: '大家好' },
      };

      const mockPost = { id: 'p123', ...postData, userId };
      mockPrisma.socialPost.create.mockResolvedValue(mockPost);

      // Action via Service (which Controller calls)
      await socialService.createPost(userId, postData.type, postData.content);

      // Verify DB interaction
      expect(mockPrisma.socialPost.create).toHaveBeenCalled();

      // Verify WS synchronization
      expect(socialGateway.server.emit).toHaveBeenCalledWith(
        'new_post',
        mockPost,
      );
    });

    it('should handle challenge progression and cross-service rewards', async () => {
      const challengeId = 'c1';
      mockPrisma.socialPost.create.mockImplementation((args: any) =>
        Promise.resolve({ id: 'p_ach', type: args.data.type }),
      );
      const mockChallenge = {
        id: challengeId,
        groupId: 'g1',
        target: 1000,
        rewardPoints: 50,
        group: {
          name: 'Power Group',
          members: [
            { userId: 'u1', user: { points: 600 } },
            { userId: 'u2', user: { points: 500 } },
          ],
        },
      };

      mockPrisma.buddyChallenge.findUnique.mockResolvedValue(mockChallenge);
      mockPrisma.user.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.buddyChallenge.delete.mockResolvedValue({});

      // Check progress (cross-service: prisma user update + social post creation)
      await socialService.checkChallengeProgress(challengeId);

      // Verify users rewarded
      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['u1', 'u2'] } },
        data: { points: { increment: 50 } },
      });

      // Verify achievement broadcast
      expect(socialGateway.server.emit).toHaveBeenCalledWith(
        'new_post',
        expect.objectContaining({
          type: PostType.ACHIEVEMENT,
        }),
      );
    });
  });

  describe('WebSocket + Service Interactions', () => {
    it('should handle group streak updates and conditional nudging', async () => {
      const groupId = 'g1';
      mockPrisma.socialPost.create.mockImplementation((args: any) =>
        Promise.resolve({ id: 'p_streak', type: args.data.type }),
      );

      // Scenario: Streak continues
      mockPrisma.buddyGroup.findUnique.mockResolvedValue({
        id: groupId,
        name: 'Streak Seekers',
        streak: 6,
        members: [{ user: { streaks: { currentStreak: 1 } } }],
      });
      mockPrisma.buddyGroup.update.mockResolvedValue({
        id: groupId,
        streak: 7,
      });

      await socialService.updateGroupStreak(groupId);

      expect(mockPrisma.buddyGroup.update).toHaveBeenCalled();
      expect(socialGateway.server.emit).toHaveBeenCalledWith(
        'new_post',
        expect.objectContaining({ type: PostType.MILESTONE }),
      );

      // Scenario: Streak in danger (nudge)
      vi.clearAllMocks();
      mockPrisma.buddyGroup.findUnique.mockResolvedValue({
        id: groupId,
        name: 'Streak Seekers',
        streak: 7,
        members: [{ userId: 'u1', user: { streaks: { currentStreak: 0 } } }],
      });

      await socialService.updateGroupStreak(groupId);

      expect(mockPrisma.buddyGroup.update).not.toHaveBeenCalled();
      expect(socialGateway.server.emit).toHaveBeenCalledWith(
        'new_post',
        expect.objectContaining({ type: PostType.NUDGE }),
      );
    });
  });
});
