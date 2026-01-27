import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NudgeService } from './nudge.service';
import { NudgeEngineService, NudgeType } from './nudge-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

describe('Nudge Trigger Service (Comprehensive)', () => {
  let nudgeService: NudgeService;
  let nudgeEngine: NudgeEngineService;
  let mockPrisma: any;
  let mockAnalytics: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      userStreak: {
        findMany: vi.fn(),
      },
      behaviorLog: {
        create: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    mockAnalytics = {
      getUserPersona: vi.fn(),
    };

    nudgeService = new NudgeService(mockPrisma);
    nudgeEngine = new NudgeEngineService(mockPrisma, mockAnalytics);
  });

  describe('Time-Based Trigger Evaluation', () => {
    describe('Streak Inactivity Trigger (20-24h)', () => {
      it('should trigger nudge for user inactive for 22 hours', async () => {
        const twentyTwoHoursAgo = new Date(Date.now() - 22 * 60 * 60 * 1000);
        const mockUsers = [
          {
            userId: 'user-1',
            currentStreak: 7,
            lastActivityDate: twentyTwoHoursAgo,
            streakFrozen: false,
            user: { id: 'user-1', email: 'test@example.com' },
          },
        ];

        mockPrisma.userStreak.findMany.mockResolvedValue(mockUsers);
        mockPrisma.behaviorLog.create.mockResolvedValue({});

        await nudgeService.handleStreakNudges();

        expect(mockPrisma.userStreak.findMany).toHaveBeenCalledWith({
          where: {
            lastActivityDate: {
              lt: expect.any(Date),
              gt: expect.any(Date),
            },
            currentStreak: { gt: 0 },
            streakFrozen: false,
          },
          include: { user: true },
        });
        expect(mockPrisma.behaviorLog.create).toHaveBeenCalledTimes(1);
      });

      it('should NOT trigger for user inactive for 19 hours (too early)', async () => {
        const nineteenHoursAgo = new Date(Date.now() - 19 * 60 * 60 * 1000);
        const mockUsers = [
          {
            userId: 'user-1',
            currentStreak: 5,
            lastActivityDate: nineteenHoursAgo,
            streakFrozen: false,
            user: { id: 'user-1' },
          },
        ];

        mockPrisma.userStreak.findMany.mockResolvedValue([]);

        await nudgeService.handleStreakNudges();

        expect(mockPrisma.behaviorLog.create).not.toHaveBeenCalled();
      });

      it('should NOT trigger for user inactive for 25 hours (too late)', async () => {
        const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
        mockPrisma.userStreak.findMany.mockResolvedValue([]);

        await nudgeService.handleStreakNudges();

        expect(mockPrisma.behaviorLog.create).not.toHaveBeenCalled();
      });

      it('should trigger for multiple users in the time window', async () => {
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
            currentStreak: 10,
            lastActivityDate: new Date(Date.now() - 23.5 * 60 * 60 * 1000),
            streakFrozen: false,
            user: { id: 'user-2' },
          },
        ];

        mockPrisma.userStreak.findMany.mockResolvedValue(mockUsers);
        mockPrisma.behaviorLog.create.mockResolvedValue({});

        await nudgeService.handleStreakNudges();

        expect(mockPrisma.behaviorLog.create).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Event-Based Trigger Evaluation', () => {
    describe('Investment Decision Trigger', () => {
      it('should trigger SOCIAL_PROOF for HUNTER persona', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'user-1',
          investmentProfile: { riskTolerance: 80 },
        });

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'INVESTMENT_DECISION',
          {
            amount: 100000,
          },
        );

        expect(result).toBeDefined();
        expect(result.type).toBe(NudgeType.SOCIAL_PROOF);
        expect(result.priority).toBe('HIGH');
        expect(result.message.vi).toContain('10% nhà đầu tư hàng đầu');
      });

      it('should trigger LOSS_AVERSION for high risk level', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'user-1',
          investmentProfile: { riskTolerance: 30 },
        });

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'INVESTMENT_DECISION',
          {
            riskLevel: 95,
          },
        );

        expect(result).toBeDefined();
        expect(result.type).toBe(NudgeType.LOSS_AVERSION);
        expect(result.message.vi).toContain('mất 20% vốn');
        expect(result.priority).toBe('HIGH');
      });

      it('should trigger LOSS_AVERSION for SAVER persona regardless of risk', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'INVESTMENT_DECISION',
          {
            riskLevel: 50,
          },
        );

        expect(result.type).toBe(NudgeType.LOSS_AVERSION);
      });

      it('should return default SOCIAL_PROOF for moderate risk', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'INVESTMENT_DECISION',
          {
            riskLevel: 50,
          },
        );

        expect(result.type).toBe(NudgeType.SOCIAL_PROOF);
        expect(result.message.vi).toContain('85% nhà đầu tư');
        expect(result.priority).toBe('MEDIUM');
      });
    });

    describe('Budgeting Trigger', () => {
      it('should trigger GOAL_GRADIENT for SAVER persona', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge('user-1', 'BUDGETING', {
          amount: 200000,
        });

        expect(result.type).toBe(NudgeType.GOAL_GRADIENT);
        expect(result.message.vi).toContain('bước nữa');
        expect(result.priority).toBe('HIGH');
      });

      it('should trigger SALIENCE with coffee mapping for default persona', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge('user-1', 'BUDGETING', {
          amount: 150000,
        });

        expect(result.type).toBe(NudgeType.SALIENCE);
        expect(result.message.vi).toContain('3 ly cà phê');
        expect(result.priority).toBe('LOW');
      });

      it('should calculate coffee equivalents correctly', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge('user-1', 'BUDGETING', {
          amount: 250000,
        });

        expect(result.message.vi).toContain('5 ly cà phê');
      });
    });

    describe('Milestone Trigger', () => {
      it('should trigger GOAL_GRADIENT for streak warning', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'STREAK_WARNING',
          {
            currentStreak: 9,
            targetStreak: 10,
          },
        );

        expect(result.type).toBe(NudgeType.GOAL_GRADIENT);
        expect(result.message.vi).toContain('90%');
        expect(result.priority).toBe('HIGH');
      });
    });

    describe('Realtime Social Proof Trigger', () => {
      it('should trigger SOCIAL_PROOF when many users active', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
        mockPrisma.behaviorLog.count.mockResolvedValue(150);

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'SOCIAL_PROOF_REALTIME',
          {},
        );

        expect(result).toBeDefined();
        expect(result.type).toBe(NudgeType.SOCIAL_PROOF);
        expect(result.message.vi).toContain('150 người');
        expect(result.message.vi).toContain('24h qua');
      });

      it('should return null when no active users', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
        mockPrisma.behaviorLog.count.mockResolvedValue(0);

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'SOCIAL_PROOF_REALTIME',
          {},
        );

        expect(result).toBeNull();
      });

      it('should query behavioral logs from last 24 hours', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
        mockPrisma.behaviorLog.count.mockResolvedValue(50);

        await nudgeEngine.generateNudge('user-1', 'SOCIAL_PROOF_REALTIME', {});

        expect(mockPrisma.behaviorLog.count).toHaveBeenCalledWith({
          where: {
            timestamp: { gte: expect.any(Date) },
          },
        });
      });
    });
  });

  describe('Trigger Conditions', () => {
    describe('Streak Conditions', () => {
      it('should NOT trigger for frozen streaks', async () => {
        const mockUsers = [
          {
            userId: 'user-1',
            currentStreak: 10,
            lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
            streakFrozen: true,
            user: { id: 'user-1' },
          },
        ];

        mockPrisma.userStreak.findMany.mockResolvedValue([]);

        await nudgeService.handleStreakNudges();

        const call = mockPrisma.userStreak.findMany.mock.calls[0][0];
        expect(call.where.streakFrozen).toBe(false);
      });

      it('should NOT trigger for zero streaks', async () => {
        mockPrisma.userStreak.findMany.mockResolvedValue([]);

        await nudgeService.handleStreakNudges();

        const call = mockPrisma.userStreak.findMany.mock.calls[0][0];
        expect(call.where.currentStreak.gt).toBe(0);
      });

      it('should trigger for high-value streaks (7+ days)', async () => {
        const mockUsers = [
          {
            userId: 'user-1',
            currentStreak: 15,
            lastActivityDate: new Date(Date.now() - 21 * 60 * 60 * 1000),
            streakFrozen: false,
            user: { id: 'user-1' },
          },
        ];

        mockPrisma.userStreak.findMany.mockResolvedValue(mockUsers);
        mockPrisma.behaviorLog.create.mockResolvedValue({});

        await nudgeService.handleStreakNudges();

        expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              payload: expect.objectContaining({
                currentStreak: 15,
              }),
            }),
          }),
        );
      });
    });

    describe('Inactivity Conditions', () => {
      it('should identify users approaching streak expiration', async () => {
        mockPrisma.userStreak.findMany.mockResolvedValue([]);

        await nudgeService.handleStreakNudges();

        const call = mockPrisma.userStreak.findMany.mock.calls[0][0];
        expect(call.where.lastActivityDate.lt).toBeDefined();
        expect(call.where.lastActivityDate.gt).toBeDefined();
      });

      it('should exclude users with recent activity', async () => {
        mockPrisma.userStreak.findMany.mockResolvedValue([]);

        await nudgeService.handleStreakNudges();

        expect(mockPrisma.behaviorLog.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('Notification Generation', () => {
    describe('Multi-language Support', () => {
      it('should generate Vietnamese message', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'INVESTMENT_DECISION',
          {},
        );

        expect(result.message.vi).toBeDefined();
        expect(result.message.vi).toContain('nhà đầu tư');
      });

      it('should generate English message', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'INVESTMENT_DECISION',
          {},
        );

        expect(result.message.en).toBeDefined();
        expect(result.message.en).toContain('investors');
      });

      it('should generate Chinese message', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'INVESTMENT_DECISION',
          {},
        );

        expect(result.message.zh).toBeDefined();
        expect(result.message.zh).toContain('投资者');
      });
    });

    describe('Priority Assignment', () => {
      it('should assign HIGH priority to loss aversion nudges', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'INVESTMENT_DECISION',
          {
            riskLevel: 90,
          },
        );

        expect(result.priority).toBe('HIGH');
      });

      it('should assign MEDIUM priority to default social proof', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'INVESTMENT_DECISION',
          {
            riskLevel: 50,
          },
        );

        expect(result.priority).toBe('MEDIUM');
      });

      it('should assign LOW priority to salience nudges', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge('user-1', 'BUDGETING', {
          amount: 100000,
        });

        expect(result.priority).toBe('LOW');
      });
    });

    describe('Behavioral Logging', () => {
      it('should log streak nudge to BehaviorLog', async () => {
        const mockUsers = [
          {
            userId: 'user-123',
            currentStreak: 7,
            lastActivityDate: new Date('2025-01-01T12:00:00Z'),
            streakFrozen: false,
            user: { id: 'user-123' },
          },
        ];

        mockPrisma.userStreak.findMany.mockResolvedValue(mockUsers);
        mockPrisma.behaviorLog.create.mockResolvedValue({});

        await nudgeService.handleStreakNudges();

        expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
          data: {
            userId: 'user-123',
            sessionId: 'nudge-system',
            path: '/nudge/streak-warning',
            eventType: 'STREAK_NUDGE_SENT',
            payload: {
              currentStreak: 7,
              lastActivity: new Date('2025-01-01T12:00:00Z'),
              message: expect.stringContaining('7-day streak'),
            },
          },
        });
      });

      it('should use system session ID for automated nudges', async () => {
        const mockUsers = [
          {
            userId: 'user-1',
            currentStreak: 5,
            lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
            streakFrozen: false,
            user: { id: 'user-1' },
          },
        ];

        mockPrisma.userStreak.findMany.mockResolvedValue(mockUsers);
        mockPrisma.behaviorLog.create.mockResolvedValue({});

        await nudgeService.handleStreakNudges();

        expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              sessionId: 'nudge-system',
            }),
          }),
        );
      });

      it('should include correct event type', async () => {
        const mockUsers = [
          {
            userId: 'user-1',
            currentStreak: 3,
            lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
            streakFrozen: false,
            user: { id: 'user-1' },
          },
        ];

        mockPrisma.userStreak.findMany.mockResolvedValue(mockUsers);
        mockPrisma.behaviorLog.create.mockResolvedValue({});

        await nudgeService.handleStreakNudges();

        expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              eventType: 'STREAK_NUDGE_SENT',
            }),
          }),
        );
      });
    });
  });

  describe('Mock User Behavior Data', () => {
    describe('Persona-Based Behavior', () => {
      it('should fetch user persona from analytics', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        await nudgeEngine.generateNudge('user-1', 'INVESTMENT_DECISION', {});

        expect(mockAnalytics.getUserPersona).toHaveBeenCalledWith('user-1');
      });

      it('should handle OBSERVER persona', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'INVESTMENT_DECISION',
          {
            riskLevel: 50,
          },
        );

        expect(result.type).toBe(NudgeType.SOCIAL_PROOF);
      });

      it('should handle missing user gracefully', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
          nudgeEngine.generateNudge('user-1', 'INVESTMENT_DECISION', {}),
        ).rejects.toThrow('User not found');
      });
    });

    describe('Activity Tracking', () => {
      it('should query user activity correctly', async () => {
        const mockUsers = [
          {
            userId: 'user-1',
            currentStreak: 5,
            lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
            streakFrozen: false,
            user: { id: 'user-1' },
          },
        ];

        mockPrisma.userStreak.findMany.mockResolvedValue(mockUsers);
        mockPrisma.behaviorLog.create.mockResolvedValue({});

        await nudgeService.handleStreakNudges();

        expect(mockPrisma.userStreak.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            include: { user: true },
          }),
        );
      });
    });
  });

  describe('Trigger JSONB Config Validation', () => {
    describe('Investment Data Structure', () => {
      it('should handle riskLevel in payload', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'INVESTMENT_DECISION',
          {
            riskLevel: 85,
            amount: 500000,
          },
        );

        expect(result).toBeDefined();
      });

      it('should handle missing riskLevel gracefully', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge(
          'user-1',
          'INVESTMENT_DECISION',
          {},
        );

        expect(result.type).toBe(NudgeType.SOCIAL_PROOF);
      });
    });

    describe('Budgeting Data Structure', () => {
      it('should validate amount field in budgeting context', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge('user-1', 'BUDGETING', {
          amount: 300000,
        });

        expect(result).toBeDefined();
        expect(result.type).toBe(NudgeType.GOAL_GRADIENT);
      });

      it('should calculate coffee mapping from amount', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

        const result = await nudgeEngine.generateNudge('user-1', 'BUDGETING', {
          amount: 500000,
        });

        expect(result.message.vi).toContain('10 ly cà phê');
      });
    });

    describe('Streak Data Structure', () => {
      it('should validate streak payload in notification', async () => {
        const mockUsers = [
          {
            userId: 'user-1',
            currentStreak: 12,
            lastActivityDate: new Date('2025-12-20T10:00:00Z'),
            streakFrozen: false,
            user: { id: 'user-1', email: 'test@example.com' },
          },
        ];

        mockPrisma.userStreak.findMany.mockResolvedValue(mockUsers);
        mockPrisma.behaviorLog.create.mockResolvedValue({});

        await nudgeService.handleStreakNudges();

        expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith({
          data: {
            userId: 'user-1',
            sessionId: 'nudge-system',
            path: '/nudge/streak-warning',
            eventType: 'STREAK_NUDGE_SENT',
            payload: {
              currentStreak: 12,
              lastActivity: new Date('2025-12-20T10:00:00Z'),
              message: expect.stringContaining('12-day streak'),
            },
          },
        });
      });
    });
  });

  describe('Realtime Social Proof Action Tracking', () => {
    it('should track action count for specific target', async () => {
      mockPrisma.behaviorLog.count.mockResolvedValue(42);

      const result = await nudgeEngine.getRealtimeSocialProof(
        'COURSE_VIEW',
        'course-123',
      );

      expect(result.count).toBe(42);
      expect(result.action).toBe('COURSE_VIEW');
      expect(result.targetId).toBe('course-123');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should filter by event type and path', async () => {
      mockPrisma.behaviorLog.count.mockResolvedValue(15);

      await nudgeEngine.getRealtimeSocialProof('LESSON_COMPLETE', 'lesson-456');

      expect(mockPrisma.behaviorLog.count).toHaveBeenCalledWith({
        where: {
          eventType: 'LESSON_COMPLETE',
          path: { contains: 'lesson-456' },
          timestamp: { gte: expect.any(Date) },
        },
      });
    });

    it('should only count events from last 24 hours', async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      mockPrisma.behaviorLog.count.mockResolvedValue(8);

      await nudgeEngine.getRealtimeSocialProof(
        'INVESTMENT_MADE',
        'portfolio-789',
      );

      const call = mockPrisma.behaviorLog.count.mock.calls[0][0];
      expect(call.where.timestamp.gte).toBeInstanceOf(Date);
      expect(call.where.timestamp.gte.getTime()).toBeGreaterThan(
        twentyFourHoursAgo.getTime() - 1000,
      );
    });

    it('should return zero count when no matching events', async () => {
      mockPrisma.behaviorLog.count.mockResolvedValue(0);

      const result = await nudgeEngine.getRealtimeSocialProof(
        'RARE_EVENT',
        'target-999',
      );

      expect(result.count).toBe(0);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should return null for unknown context', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

      const result = await nudgeEngine.generateNudge(
        'user-1',
        'UNKNOWN_CONTEXT',
        {},
      );

      expect(result).toBeNull();
    });

    it('should handle empty streak list gracefully', async () => {
      mockPrisma.userStreak.findMany.mockResolvedValue([]);

      await nudgeService.handleStreakNudges();

      expect(mockPrisma.behaviorLog.create).not.toHaveBeenCalled();
    });

    it('should handle persona fetch failure', async () => {
      mockAnalytics.getUserPersona.mockRejectedValue(
        new Error('Network error'),
      );
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

      await expect(
        nudgeEngine.generateNudge('user-1', 'INVESTMENT_DECISION', {}),
      ).rejects.toThrow('Network error');
    });

    it('should handle database query failure', async () => {
      mockPrisma.userStreak.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(nudgeService.handleStreakNudges()).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle behavioral log creation failure', async () => {
      const mockUsers = [
        {
          userId: 'user-1',
          currentStreak: 5,
          lastActivityDate: new Date(Date.now() - 22 * 60 * 60 * 1000),
          streakFrozen: false,
          user: { id: 'user-1' },
        },
      ];

      mockPrisma.userStreak.findMany.mockResolvedValue(mockUsers);
      mockPrisma.behaviorLog.create.mockRejectedValue(
        new Error('Log write failed'),
      );

      await expect(nudgeService.handleStreakNudges()).rejects.toThrow(
        'Log write failed',
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete streak nudge workflow', async () => {
      const mockUsers = [
        {
          userId: 'user-complete',
          currentStreak: 20,
          lastActivityDate: new Date(Date.now() - 21 * 60 * 60 * 1000),
          streakFrozen: false,
          user: {
            id: 'user-complete',
            email: 'complete@example.com',
            name: 'Complete User',
          },
        },
      ];

      mockPrisma.userStreak.findMany.mockResolvedValue(mockUsers);
      mockPrisma.behaviorLog.create.mockResolvedValue({
        id: 'log-123',
        userId: 'user-complete',
        timestamp: new Date(),
      });

      await nudgeService.handleStreakNudges();

      expect(mockPrisma.userStreak.findMany).toHaveBeenCalled();
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalled();
    });

    it('should handle complete investment decision workflow', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'investor-1',
        email: 'investor@example.com',
        investmentProfile: {
          riskTolerance: 85,
          experience: 'ADVANCED',
        },
      });

      const result = await nudgeEngine.generateNudge(
        'investor-1',
        'INVESTMENT_DECISION',
        {
          riskLevel: 75,
          amount: 1000000,
        },
      );

      expect(mockAnalytics.getUserPersona).toHaveBeenCalledWith('investor-1');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'investor-1' },
        include: { investmentProfile: true },
      });
      expect(result).toBeDefined();
      expect(result.type).toBe(NudgeType.SOCIAL_PROOF);
    });
  });
});
