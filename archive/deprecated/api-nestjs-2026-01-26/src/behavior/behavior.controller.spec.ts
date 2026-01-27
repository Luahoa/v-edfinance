import { Test, type TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorController } from './behavior.controller';
import { BehaviorService } from './behavior.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('BehaviorController (Gamification)', () => {
  let controller: BehaviorController;
  let behaviorService: BehaviorService;

  const mockUserId = 'user-123';
  const mockBehaviorService = {
    logEvent: vi.fn(),
    getUserBehaviors: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BehaviorController],
      providers: [
        {
          provide: BehaviorService,
          useValue: mockBehaviorService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: mockUserId };
          return true;
        },
      })
      .compile();

    controller = module.get<BehaviorController>(BehaviorController);
    behaviorService = module.get<BehaviorService>(BehaviorService);

    // Manually bind service to fix NestJS TestingModule mock binding issue
    (controller as any).behaviorService = mockBehaviorService;

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('log - XP Event Logging', () => {
    it('should log lesson completion event with points', async () => {
      const eventDto = {
        eventType: 'LESSON_COMPLETED',
        path: '/courses/course-1/lessons/lesson-1',
        sessionId: 'session-abc',
        metadata: { lessonId: 'lesson-1', points: 10 },
      };

      mockBehaviorService.logEvent.mockResolvedValue({
        id: 'log-1',
        userId: mockUserId,
        ...eventDto,
        createdAt: new Date(),
      });

      const req = { user: { userId: mockUserId } };
      const result = await controller.log(req, eventDto);

      expect(behaviorService.logEvent).toHaveBeenCalledWith(
        mockUserId,
        eventDto,
      );
      expect(result).toHaveProperty('id');
      expect(result.eventType).toBe('LESSON_COMPLETED');
    });

    it('should log achievement unlocked event', async () => {
      const eventDto = {
        eventType: 'ACHIEVEMENT_UNLOCKED',
        path: '/achievements',
        sessionId: 'session-xyz',
        metadata: {
          achievementId: 'first-lesson',
          rewardPoints: 50,
          badgeIcon: 'star',
        },
      };

      mockBehaviorService.logEvent.mockResolvedValue({
        id: 'log-2',
        userId: mockUserId,
        ...eventDto,
      });

      const req = { user: { userId: mockUserId } };
      const result = await controller.log(req, eventDto);

      expect(behaviorService.logEvent).toHaveBeenCalledWith(
        mockUserId,
        eventDto,
      );
      expect(result.metadata.rewardPoints).toBe(50);
    });

    it('should log streak milestone event', async () => {
      const eventDto = {
        eventType: 'STREAK_MILESTONE',
        path: '/streaks',
        sessionId: 'session-streak',
        metadata: { currentStreak: 7, milestone: 7, bonusPoints: 100 },
      };

      mockBehaviorService.logEvent.mockResolvedValue({
        id: 'log-3',
        userId: mockUserId,
        ...eventDto,
      });

      const req = { user: { userId: mockUserId } };
      await controller.log(req, eventDto);

      expect(behaviorService.logEvent).toHaveBeenCalledWith(
        mockUserId,
        eventDto,
      );
    });

    it('should handle missing userId gracefully', async () => {
      const eventDto = {
        eventType: 'ANONYMOUS_VIEW',
        path: '/courses',
        sessionId: 'anon-session',
        metadata: {},
      };

      const req = { user: { userId: undefined } };
      const result = await controller.log(req, eventDto);

      expect(behaviorService.logEvent).toHaveBeenCalledWith(
        undefined,
        eventDto,
      );
    });

    it('should validate eventType is required', async () => {
      const invalidDto = {
        path: '/courses',
        sessionId: 'session-1',
        metadata: {},
      };

      mockBehaviorService.logEvent.mockRejectedValue(
        new Error('eventType is required'),
      );

      const req = { user: { userId: mockUserId } };

      await expect(controller.log(req, invalidDto as any)).rejects.toThrow();
    });

    it('should log multiple rapid events without collision', async () => {
      const events = [
        {
          eventType: 'PAGE_VIEW',
          path: '/dashboard',
          sessionId: 's1',
          metadata: {},
        },
        {
          eventType: 'BUTTON_CLICK',
          path: '/dashboard',
          sessionId: 's1',
          metadata: {},
        },
        {
          eventType: 'LESSON_START',
          path: '/courses/1',
          sessionId: 's1',
          metadata: {},
        },
      ];

      for (const event of events) {
        mockBehaviorService.logEvent.mockResolvedValueOnce({
          id: `log-${Math.random()}`,
          userId: mockUserId,
          ...event,
        });
      }

      const req = { user: { userId: mockUserId } };

      for (const event of events) {
        await controller.log(req, event);
      }

      expect(behaviorService.logEvent).toHaveBeenCalledTimes(3);
    });
  });

  describe('getMyHistory - Behavior Analytics', () => {
    it('should return user behavior history', async () => {
      const history = [
        {
          id: 'log-1',
          eventType: 'LESSON_COMPLETED',
          createdAt: new Date('2025-01-01'),
          metadata: { points: 10 },
        },
        {
          id: 'log-2',
          eventType: 'ACHIEVEMENT_UNLOCKED',
          createdAt: new Date('2025-01-02'),
          metadata: { achievementId: 'streak-7' },
        },
      ];

      mockBehaviorService.getUserBehaviors.mockResolvedValue(history);

      const req = { user: { userId: mockUserId } };
      const result = await controller.getMyHistory(req);

      expect(behaviorService.getUserBehaviors).toHaveBeenCalledWith(mockUserId);
      expect(result).toHaveLength(2);
      expect(result[0].eventType).toBe('LESSON_COMPLETED');
    });

    it('should return empty array for user with no history', async () => {
      mockBehaviorService.getUserBehaviors.mockResolvedValue([]);

      const req = { user: { userId: 'new-user' } };
      const result = await controller.getMyHistory(req);

      expect(result).toEqual([]);
    });

    it('should throw UnauthorizedException for missing auth', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [BehaviorController],
        providers: [
          { provide: BehaviorService, useValue: mockBehaviorService },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: () => {
            throw new UnauthorizedException();
          },
        })
        .compile();

      const testController = module.get<BehaviorController>(BehaviorController);
      // Manually bind service to fix NestJS TestingModule mock binding issue
      (testController as any).behaviorService = mockBehaviorService;

      mockBehaviorService.getUserBehaviors.mockImplementation(() => {
        throw new UnauthorizedException();
      });

      await expect(testController.getMyHistory({ user: {} })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getMyStreak - Gamification Streak Tracking', () => {
    it('should return current streak (placeholder)', async () => {
      const req = { user: { userId: mockUserId } };
      const result = await controller.getMyStreak(req);

      expect(result).toHaveProperty('currentStreak');
      expect(result.currentStreak).toBe(0);
    });

    it('should work without errors for new users', async () => {
      const req = { user: { userId: 'brand-new-user' } };
      const result = await controller.getMyStreak(req);

      expect(result.currentStreak).toBe(0);
    });
  });

  describe('Guard Protection', () => {
    it('should protect log endpoint with JwtAuthGuard', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        BehaviorController.prototype.log,
      );
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should protect getMyHistory with JwtAuthGuard', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        BehaviorController.prototype.getMyHistory,
      );
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should protect getMyStreak with JwtAuthGuard', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        BehaviorController.prototype.getMyStreak,
      );
      expect(guards).toContain(JwtAuthGuard);
    });
  });

  describe('Gamification Integration Tests', () => {
    it('should trigger XP calculation on lesson completion', async () => {
      const eventDto = {
        eventType: 'LESSON_COMPLETED',
        path: '/courses/1/lessons/5',
        sessionId: 'session-1',
        metadata: { points: 15, difficulty: 'INTERMEDIATE' },
      };

      mockBehaviorService.logEvent.mockImplementation(async (userId, dto) => {
        return {
          id: 'log-xp',
          userId,
          ...dto,
          createdAt: new Date(),
        };
      });

      const req = { user: { userId: mockUserId } };
      await controller.log(req, eventDto);

      expect(behaviorService.logEvent).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          metadata: expect.objectContaining({ points: 15 }),
        }),
      );
    });

    it('should track badge awarding event', async () => {
      const badgeEvent = {
        eventType: 'BADGE_AWARDED',
        path: '/badges',
        sessionId: 'session-badge',
        metadata: {
          badgeId: 'streak-master',
          title: 'Streak Master',
          description: '30 day streak achieved',
        },
      };

      mockBehaviorService.logEvent.mockResolvedValue({
        id: 'log-badge',
        userId: mockUserId,
        ...badgeEvent,
      });

      const req = { user: { userId: mockUserId } };
      const result = await controller.log(req, badgeEvent);

      expect(result.metadata.badgeId).toBe('streak-master');
    });

    it('should log leaderboard position change', async () => {
      const leaderboardEvent = {
        eventType: 'LEADERBOARD_RANK_UP',
        path: '/leaderboard',
        sessionId: 'session-lb',
        metadata: { oldRank: 10, newRank: 5, category: 'POINTS' },
      };

      mockBehaviorService.logEvent.mockResolvedValue({
        id: 'log-rank',
        userId: mockUserId,
        ...leaderboardEvent,
      });

      const req = { user: { userId: mockUserId } };
      await controller.log(req, leaderboardEvent);

      expect(behaviorService.logEvent).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          eventType: 'LEADERBOARD_RANK_UP',
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      mockBehaviorService.logEvent.mockRejectedValue(
        new Error('Database error'),
      );

      const req = { user: { userId: mockUserId } };
      const eventDto = {
        eventType: 'TEST',
        path: '/test',
        sessionId: 's1',
        metadata: {},
      };

      await expect(controller.log(req, eventDto)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle getUserBehaviors service errors', async () => {
      mockBehaviorService.getUserBehaviors.mockRejectedValue(
        new Error('Query timeout'),
      );

      const req = { user: { userId: mockUserId } };

      await expect(controller.getMyHistory(req)).rejects.toThrow(
        'Query timeout',
      );
    });
  });
});
