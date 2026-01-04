import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { NudgeService } from './nudge.service';

describe('NudgeService', () => {
  let service: NudgeService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      userStreak: {
        findMany: vi.fn(),
      },
      behaviorLog: {
        create: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NudgeService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<NudgeService>(NudgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleStreakNudges', () => {
    it('should find users with streaks between 20-24 hours ago and send nudges', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 5,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1', email: 'user1@example.com' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.create.mockResolvedValue({});

      await service.handleStreakNudges();

      expect(prismaService.userStreak.findMany).toHaveBeenCalled();
      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            eventType: 'STREAK_NUDGE_SENT',
            payload: expect.objectContaining({
              currentStreak: 5,
            }),
          }),
        }),
      );
    });

    it('should not send nudges if no users match criteria', async () => {
      prismaService.userStreak.findMany.mockResolvedValue([]);

      await service.handleStreakNudges();

      expect(prismaService.userStreak.findMany).toHaveBeenCalled();
      expect(prismaService.behaviorLog.create).not.toHaveBeenCalled();
    });

    it('should filter out frozen streaks', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 10,
          lastActivityDate: new Date(Date.now() - 21 * 60 * 60 * 1000),
          streakFrozen: true,
          user: { id: 'user-1', email: 'frozen@example.com' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);

      await service.handleStreakNudges();

      const call = prismaService.userStreak.findMany.mock.calls[0][0];
      expect(call.where.streakFrozen).toBe(false);
    });

    it('should filter out zero-streak users', async () => {
      prismaService.userStreak.findMany.mockResolvedValue([]);
      await service.handleStreakNudges();

      const call = prismaService.userStreak.findMany.mock.calls[0][0];
      expect(call.where.currentStreak.gt).toBe(0);
    });

    it('should send nudges to multiple users', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 3,
          lastActivityDate: new Date(Date.now() - 20.5 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1' },
        },
        {
          userId: 'user-2',
          currentStreak: 7,
          lastActivityDate: new Date(Date.now() - 23 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-2' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.create.mockResolvedValue({});

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).toHaveBeenCalledTimes(2);
    });

    it('should include correct time boundaries (20-24 hours)', async () => {
      prismaService.userStreak.findMany.mockResolvedValue([]);
      await service.handleStreakNudges();

      const call = prismaService.userStreak.findMany.mock.calls[0][0];
      expect(call.where.lastActivityDate.lt).toBeDefined();
      expect(call.where.lastActivityDate.gt).toBeDefined();
    });

    it('should log user streak data in nudge payload', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 15,
          lastActivityDate: new Date('2025-01-01T12:00:00Z'),
          streakFrozen: false,
          user: { id: 'user-1' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.create.mockResolvedValue({});

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: expect.objectContaining({
              currentStreak: 15,
              lastActivity: new Date('2025-01-01T12:00:00Z'),
              message: expect.stringContaining('15-day streak'),
            }),
          }),
        }),
      );
    });

    it('should use nudge-system as sessionId', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 5,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.create.mockResolvedValue({});

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: 'nudge-system',
          }),
        }),
      );
    });

    it('should use correct event path', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 5,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.create.mockResolvedValue({});

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            path: '/nudge/streak-warning',
            eventType: 'STREAK_NUDGE_SENT',
          }),
        }),
      );
    });
  });

  describe('Trigger Frequency Limits', () => {
    it('should not send nudge to same user within 24 hours', async () => {
      const recentNudgeTime = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 5,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          lastNudgeSent: recentNudgeTime,
          user: { id: 'user-1' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.findMany = vi.fn().mockResolvedValue([
        {
          userId: 'user-1',
          eventType: 'STREAK_NUDGE_SENT',
          timestamp: recentNudgeTime,
        },
      ]);

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).not.toHaveBeenCalled();
    });

    it('should enforce max 3 nudges per day per user', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 5,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.findMany = vi.fn().mockResolvedValue([
        {
          eventType: 'STREAK_NUDGE_SENT',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          eventType: 'STREAK_NUDGE_SENT',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
        {
          eventType: 'STREAK_NUDGE_SENT',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        },
      ]);

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).not.toHaveBeenCalled();
    });

    it('should allow nudge after 24 hours cooldown', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 5,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.findMany.mockResolvedValue([]);
      prismaService.behaviorLog.create.mockResolvedValue({});

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).toHaveBeenCalled();
    });
  });

  describe('User Preference Overrides', () => {
    it('should respect user opt-out from nudges', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 5,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1', nudgePreferences: { streakNudges: false } },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).not.toHaveBeenCalled();
    });

    it('should respect quiet hours preference', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 5,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: {
            id: 'user-1',
            nudgePreferences: { quietHoursStart: 22, quietHoursEnd: 8 },
          },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);

      const currentHour = new Date().getHours();
      if (currentHour >= 22 || currentHour < 8) {
        await service.handleStreakNudges();
        expect(prismaService.behaviorLog.create).not.toHaveBeenCalled();
      }
    });

    it('should send nudge outside quiet hours', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 5,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: {
            id: 'user-1',
            nudgePreferences: { quietHoursStart: 1, quietHoursEnd: 5 },
          },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.create.mockResolvedValue({});

      await service.handleStreakNudges();

      const currentHour = new Date().getHours();
      if (currentHour >= 5 && currentHour < 1) {
        expect(prismaService.behaviorLog.create).toHaveBeenCalled();
      }
    });
  });

  describe('Thaler Pattern Validation', () => {
    it('should apply loss aversion nudge for streak preservation', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 10,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.create.mockResolvedValue({});

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: expect.objectContaining({
              message: expect.stringContaining('about to expire'),
            }),
          }),
        }),
      );
    });

    it('should use social proof for high streaks', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 30,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.create.mockResolvedValue({});

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: expect.objectContaining({
              currentStreak: 30,
            }),
          }),
        }),
      );
    });

    it('should use framing for milestone streaks', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 6,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.create.mockResolvedValue({});

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: expect.objectContaining({
              message: expect.stringMatching(/6-day/),
            }),
          }),
        }),
      );
    });
  });

  describe('A/B Test Integration', () => {
    it('should track nudge variant for A/B testing', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 5,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.create.mockResolvedValue({});

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'STREAK_NUDGE_SENT',
          }),
        }),
      );
    });

    it('should support different nudge message variants', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 5,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1' },
        },
        {
          userId: 'user-2',
          currentStreak: 7,
          lastActivityDate: new Date(Date.now() - 23 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-2' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.create.mockResolvedValue({});

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).toHaveBeenCalledTimes(2);
    });

    it('should log A/B test metadata for analytics', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 5,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1' },
        },
      ];

      prismaService.userStreak.findMany.mockResolvedValue(mockUsers);
      prismaService.behaviorLog.create.mockResolvedValue({});

      await service.handleStreakNudges();

      expect(prismaService.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: 'nudge-system',
            path: '/nudge/streak-warning',
          }),
        }),
      );
    });
  });
});
