import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommunityStatsService } from './community-stats.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SocialGateway } from './social.gateway';

describe('CommunityStatsService', () => {
  let service: CommunityStatsService;
  let prisma: PrismaService;
  let gateway: SocialGateway;

  const mockPrismaService = {
    user: {
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    socialPost: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    behaviorLog: {
      groupBy: vi.fn(),
    },
  };

  const mockSocialGateway = {
    server: {
      emit: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityStatsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SocialGateway, useValue: mockSocialGateway },
      ],
    }).compile();

    service = module.get<CommunityStatsService>(CommunityStatsService);
    prisma = module.get<PrismaService>(PrismaService);
    gateway = module.get<SocialGateway>(SocialGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCommunityImpact', () => {
    it('should calculate total community impact correctly', async () => {
      mockPrismaService.user.count.mockResolvedValue(100);
      mockPrismaService.user.aggregate.mockResolvedValue({
        _sum: { points: 5000 },
      });
      mockPrismaService.socialPost.count.mockResolvedValue(250);

      const result = await service.getCommunityImpact();

      expect(result).toEqual({
        totalUsers: 100,
        totalImpactPoints: 5000,
        totalContributions: 250,
        timestamp: expect.any(Date),
      });
      expect(prisma.user.count).toHaveBeenCalled();
      expect(prisma.user.aggregate).toHaveBeenCalledWith({
        _sum: { points: true },
      });
      expect(prisma.socialPost.count).toHaveBeenCalled();
    });

    it('should return 0 impact points if aggregate returns null', async () => {
      mockPrismaService.user.count.mockResolvedValue(10);
      mockPrismaService.user.aggregate.mockResolvedValue({
        _sum: { points: null },
      });
      mockPrismaService.socialPost.count.mockResolvedValue(5);

      const result = await service.getCommunityImpact();

      expect(result.totalImpactPoints).toBe(0);
    });
  });

  describe('getUsersOnline', () => {
    it('should aggregate users online based on recent behavior logs', async () => {
      mockPrismaService.behaviorLog.groupBy.mockResolvedValue([
        { userId: 'user1' },
        { userId: 'user2' },
      ]);

      const result = await service.getUsersOnline();

      expect(result.count).toBe(2);
      expect(prisma.behaviorLog.groupBy).toHaveBeenCalledWith({
        by: ['userId'],
        where: {
          timestamp: { gte: expect.any(Date) },
        },
      });
    });
  });

  describe('getRecentGlobalAchievements', () => {
    it('should fetch recent global achievements', async () => {
      const mockAchievements = [
        { id: '1', type: 'ACHIEVEMENT', user: { email: 'user@test.com' } },
      ];
      mockPrismaService.socialPost.findMany.mockResolvedValue(mockAchievements);

      const result = await service.getRecentGlobalAchievements(3);

      expect(result).toEqual(mockAchievements);
      expect(prisma.socialPost.findMany).toHaveBeenCalledWith({
        where: { type: 'ACHIEVEMENT' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { user: { select: { id: true, email: true } } },
      });
    });
  });

  describe('triggerRealtimeUpdate', () => {
    it('should fetch all stats and emit to gateway', async () => {
      vi.spyOn(service, 'getCommunityImpact').mockResolvedValue({
        totalUsers: 100,
        totalImpactPoints: 5000,
        totalContributions: 250,
        timestamp: new Date(),
      });
      vi.spyOn(service, 'getUsersOnline').mockResolvedValue({
        count: 15,
        timestamp: new Date(),
      });

      const result = await service.triggerRealtimeUpdate();

      expect(result.onlineUsers).toBe(15);
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'community_stats_update',
        expect.objectContaining({
          totalUsers: 100,
          onlineUsers: 15,
        }),
      );
    });
  });

  describe('High-concurrency data updates (Mock)', () => {
    it('should handle multiple simultaneous update requests', async () => {
      const getImpactSpy = vi
        .spyOn(service, 'getCommunityImpact')
        .mockResolvedValue({
          totalUsers: 200,
          totalImpactPoints: 10000,
          totalContributions: 500,
          timestamp: new Date(),
        });
      const getOnlineSpy = vi
        .spyOn(service, 'getUsersOnline')
        .mockResolvedValue({
          count: 50,
          timestamp: new Date(),
        });

      // Simulate 50 concurrent requests
      const requests = Array(50)
        .fill(null)
        .map(() => service.triggerRealtimeUpdate());
      const results = await Promise.all(requests);

      expect(results).toHaveLength(50);
      results.forEach((res) => {
        expect(res.onlineUsers).toBe(50);
        expect(res.totalUsers).toBe(200);
      });

      // Ensure we didn't overload Prisma (though in this service they are all independent calls)
      expect(getImpactSpy).toHaveBeenCalledTimes(50);
      expect(getOnlineSpy).toHaveBeenCalledTimes(50);
    });
  });
});
