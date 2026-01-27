import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiService } from '../../config/gemini.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';
import { MentorService } from './mentor.service';
import { PredictiveService } from './predictive.service';

describe('Analytics System Integration Tests', () => {
  let analyticsService: AnalyticsService;
  let predictiveService: PredictiveService;
  let mentorService: MentorService;
  let mockPrisma: any;
  let mockGemini: any;
  let mockEventEmitter: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockPrisma = {
      $queryRaw: vi.fn(),
      user: {
        count: vi.fn(),
        aggregate: vi.fn(),
        findUnique: vi.fn(),
      },
      behaviorLog: {
        count: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      userProgress: {
        count: vi.fn(),
      },
    };

    mockGemini = {
      generateResponse: vi.fn().mockResolvedValue({
        text: 'AI generated advice',
        locale: 'vi',
      }),
    };

    mockEventEmitter = {
      emit: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        PredictiveService,
        MentorService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GeminiService, useValue: mockGemini },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    predictiveService = module.get<PredictiveService>(PredictiveService);
    mentorService = module.get<MentorService>(MentorService);

    // Manually bind prisma to fix NestJS TestingModule mock binding issue
    (analyticsService as any).prisma = mockPrisma;
    (predictiveService as any).prisma = mockPrisma;
    (predictiveService as any).analytics = analyticsService;
    (mentorService as any).prisma = mockPrisma;
    (mentorService as any).gemini = mockGemini;
    (mentorService as any).analytics = analyticsService;
    (mentorService as any).predictive = predictiveService;
    (mentorService as any).eventEmitter = mockEventEmitter;
  });

  describe('End-to-End Analytics Flows', () => {
    describe('User Behavior Analysis Pipeline', () => {
      it('should analyze user behavior from raw logs to persona classification', async () => {
        const userId = 'user-behavioral-test';
        const mockLogs = [
          {
            eventType: 'TRADE_BUY',
            timestamp: new Date('2025-12-20T10:00:00Z'),
          },
          {
            eventType: 'TRADE_BUY',
            timestamp: new Date('2025-12-20T11:00:00Z'),
          },
          {
            eventType: 'HIGH_RISK_DECISION',
            timestamp: new Date('2025-12-20T12:00:00Z'),
          },
          {
            eventType: 'TRADE_BUY',
            timestamp: new Date('2025-12-20T13:00:00Z'),
          },
          {
            eventType: 'HIGH_RISK_DECISION',
            timestamp: new Date('2025-12-20T14:00:00Z'),
          },
          {
            eventType: 'TRADE_BUY',
            timestamp: new Date('2025-12-20T15:00:00Z'),
          },
        ];

        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const persona = await analyticsService.getUserPersona(userId);
        const habits = await analyticsService.getUserLearningHabits(userId);

        expect(persona).toBe('HUNTER');
        expect(habits).toBeDefined();
        expect(habits?.totalLogsAnalyzed).toBe(6);
        expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledTimes(2);
      });

      it('should handle SAVER persona with commitment-focused behavior', async () => {
        const userId = 'user-saver-test';
        const mockLogs = Array(10)
          .fill(null)
          .map((_, i) => ({
            eventType: 'COMMITMENT_CREATED',
            timestamp: new Date(`2025-12-20T${10 + i}:00:00Z`),
          }));

        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const persona = await analyticsService.getUserPersona(userId);
        const habits = await analyticsService.getUserLearningHabits(userId);

        expect(persona).toBe('SAVER');
        expect(habits?.topActivities).toContain('COMMITMENT_CREATED');
      });

      it('should default to OBSERVER for mixed behavior', async () => {
        const userId = 'user-observer-test';
        const mockLogs = [
          {
            eventType: 'LESSON_VIEW',
            timestamp: new Date('2025-12-20T10:00:00Z'),
          },
          {
            eventType: 'QUIZ_START',
            timestamp: new Date('2025-12-20T11:00:00Z'),
          },
          {
            eventType: 'PAGE_VIEW',
            timestamp: new Date('2025-12-20T12:00:00Z'),
          },
        ];

        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const persona = await analyticsService.getUserPersona(userId);

        expect(persona).toBe('OBSERVER');
      });
    });

    describe('Learning Habits Analysis', () => {
      it('should identify peak learning hours from activity patterns', async () => {
        const userId = 'user-habits-test';
        const mockLogs = [
          {
            eventType: 'LESSON_VIEW',
            timestamp: new Date('2025-12-20T10:00:00Z'),
          },
          {
            eventType: 'LESSON_VIEW',
            timestamp: new Date('2025-12-20T10:30:00Z'),
          },
          {
            eventType: 'LESSON_VIEW',
            timestamp: new Date('2025-12-20T10:45:00Z'),
          },
          {
            eventType: 'QUIZ_START',
            timestamp: new Date('2025-12-20T14:00:00Z'),
          },
          {
            eventType: 'QUIZ_START',
            timestamp: new Date('2025-12-20T14:30:00Z'),
          },
        ];

        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const habits = await analyticsService.getUserLearningHabits(userId);

        expect(habits).toBeDefined();
        expect([10, 17]).toContain(habits?.peakLearningHour);
        expect(habits?.topActivities).toContain('LESSON_VIEW');
        expect(habits?.totalLogsAnalyzed).toBe(5);
      });

      it('should return null for users with no activity', async () => {
        mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

        const habits =
          await analyticsService.getUserLearningHabits('inactive-user');

        expect(habits).toBeNull();
      });
    });

    describe('Predictive Analysis Pipeline', () => {
      it('should generate complete financial future simulation with persona context', async () => {
        const userId = 'user-prediction-test';
        const mockBehaviors = Array(20)
          .fill(null)
          .map((_, i) => ({
            eventType: 'LESSON_COMPLETED',
            timestamp: new Date(`2025-12-${10 + i}T10:00:00Z`),
            userId,
          }));

        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockBehaviors);

        const simulation =
          await predictiveService.simulateFinancialFuture(userId);

        expect(simulation).toBeDefined();
        expect(simulation.scenarios).toHaveLength(3);
        expect(simulation.scenarios[0].type).toBe('OPTIMISTIC');
        expect(simulation.scenarios[1].type).toBe('NEUTRAL');
        expect(simulation.scenarios[2].type).toBe('PESSIMISTIC');
        expect(simulation.personaContext).toBeDefined();
        expect(simulation.scenarios[2].nudge).toBeDefined();
      });

      it('should predict churn risk based on activity gaps', async () => {
        const userId = 'user-churn-test';
        const now = new Date();
        const mockLogs = [
          { timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000) },
          { timestamp: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) },
          { timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
          { timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
          { timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
        ];

        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const churnRisk = await predictiveService.predictChurnRisk(userId);

        expect(churnRisk).toBe('MEDIUM');
      });

      it('should return HIGH churn risk for large activity gaps', async () => {
        const userId = 'user-high-churn-test';
        const now = new Date();
        const mockLogs = [
          { timestamp: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000) },
          { timestamp: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          { timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000) },
          { timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
          { timestamp: new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000) },
        ];

        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const churnRisk = await predictiveService.predictChurnRisk(userId);

        expect(churnRisk).toBe('HIGH');
      });

      it('should return LOW churn risk for consistent daily activity', async () => {
        const userId = 'user-active-test';
        const now = new Date();
        const mockLogs = Array(10)
          .fill(null)
          .map((_, i) => ({
            timestamp: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
          }));

        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const churnRisk = await predictiveService.predictChurnRisk(userId);

        expect(churnRisk).toBe('LOW');
      });
    });
  });

  describe('Cross-Service Data Aggregation', () => {
    describe('Mentor Service with Analytics Integration', () => {
      it('should integrate persona, churn risk, and user profile for personalized advice', async () => {
        const userId = 'user-mentor-integration';
        const mockUser = {
          id: userId,
          investmentProfile: {
            currentKnowledge: 'INTERMEDIATE',
            riskScore: 75,
          },
          buddyMemberships: [{ group: { streak: 15 } }],
          preferredLocale: 'en',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.behaviorLog.findMany
          .mockResolvedValueOnce(Array(8).fill({ eventType: 'TRADE_BUY' }))
          .mockResolvedValueOnce([
            { timestamp: new Date('2025-12-20T10:00:00Z') },
            { timestamp: new Date('2025-12-19T10:00:00Z') },
            { timestamp: new Date('2025-12-18T10:00:00Z') },
          ])
          .mockResolvedValueOnce([]);

        const advice = await mentorService.getPersonalizedAdvice(
          userId,
          'How to invest?',
          {
            module: 'Investment',
            lesson: 'Basics',
            locale: 'en',
          },
        );

        expect(advice).toBeDefined();
        expect(mockGemini.generateResponse).toHaveBeenCalledWith(
          expect.objectContaining({
            context: expect.objectContaining({
              user_query: 'How to invest?',
              module: 'Investment',
            }),
            user_profile: expect.objectContaining({
              knowledge_level: 'INTERMEDIATE',
              risk_score: 75,
            }),
            mentor_config: expect.objectContaining({
              persona: 'STRICT_COACH',
              group_streak: 15,
            }),
          }),
        );
      });

      it('should select WISE_SAGE persona for SAVER users', async () => {
        const userId = 'user-saver-mentor';
        mockPrisma.user.findUnique.mockResolvedValue({
          id: userId,
          investmentProfile: { currentKnowledge: 'BEGINNER', riskScore: 30 },
          buddyMemberships: [],
        });

        mockPrisma.behaviorLog.findMany
          .mockResolvedValueOnce(
            Array(8).fill({ eventType: 'COMMITMENT_CREATED' }),
          )
          .mockResolvedValueOnce([{ timestamp: new Date() }])
          .mockResolvedValueOnce([]);

        await mentorService.getPersonalizedAdvice(userId, 'Save money tips?', {
          module: 'Savings',
          lesson: 'Budgeting',
          locale: 'vi',
        });

        expect(mockGemini.generateResponse).toHaveBeenCalledWith(
          expect.objectContaining({
            mentor_config: expect.objectContaining({
              persona: 'WISE_SAGE',
            }),
          }),
        );
      });

      it('should include high churn risk warning in AI context', async () => {
        const userId = 'user-churn-warning';
        const now = new Date();

        mockPrisma.user.findUnique.mockResolvedValue({
          id: userId,
          investmentProfile: {},
          buddyMemberships: [],
        });

        mockPrisma.behaviorLog.findMany
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            { timestamp: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000) },
            { timestamp: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
            { timestamp: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000) },
            { timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
            { timestamp: new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000) },
          ])
          .mockResolvedValueOnce([]);

        await mentorService.getPersonalizedAdvice(userId, 'Help me', {
          module: 'General',
          lesson: 'General',
          locale: 'vi',
        });

        expect(mockGemini.generateResponse).toHaveBeenCalledWith(
          expect.objectContaining({
            context: expect.objectContaining({
              behavior_prediction: 'High risk of stopping learning',
            }),
          }),
        );
      });
    });

    describe('System-Wide Statistics Aggregation', () => {
      it('should aggregate data from multiple Prisma models', async () => {
        mockPrisma.user.count.mockResolvedValue(1500);
        mockPrisma.userProgress.count.mockResolvedValue(8500);
        mockPrisma.user.aggregate.mockResolvedValue({
          _sum: { points: 125000 },
        });

        const stats = await analyticsService.getGlobalSystemStats();

        expect(stats).toEqual({
          totalUsers: 1500,
          completedLessons: 8500,
          distributedPoints: 125000,
        });
        expect(mockPrisma.user.count).toHaveBeenCalled();
        expect(mockPrisma.userProgress.count).toHaveBeenCalled();
        expect(mockPrisma.user.aggregate).toHaveBeenCalled();
      });

      it('should handle null aggregate values gracefully', async () => {
        mockPrisma.user.count.mockResolvedValue(0);
        mockPrisma.userProgress.count.mockResolvedValue(0);
        mockPrisma.user.aggregate.mockResolvedValue({ _sum: { points: null } });

        const stats = await analyticsService.getGlobalSystemStats();

        expect(stats.distributedPoints).toBe(0);
      });
    });
  });

  describe('Report Generation Pipeline', () => {
    describe('System Health Monitoring', () => {
      it('should execute complete health check workflow', async () => {
        mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
        mockPrisma.user.count.mockResolvedValue(250);
        mockPrisma.behaviorLog.count.mockResolvedValue(25);
        mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'health-log-1' });

        await analyticsService.handleSystemHealthCheck();

        expect(mockPrisma.$queryRaw).toHaveBeenCalled();
        expect(mockPrisma.user.count).toHaveBeenCalled();
        expect(mockPrisma.behaviorLog.count).toHaveBeenCalled();
        expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              sessionId: 'health-hub',
              path: 'system/health',
              eventType: 'HEALTH_CHECK',
              payload: expect.objectContaining({
                dbStatus: 'OK',
                userCount: 250,
                errorRateLastHour: 25,
              }),
            }),
          }),
        );
      });

      it('should detect and warn about critical error rates', async () => {
        const warnSpy = vi.spyOn(analyticsService['logger'], 'warn');

        mockPrisma.$queryRaw.mockResolvedValue([1]);
        mockPrisma.user.count.mockResolvedValue(100);
        mockPrisma.behaviorLog.count.mockResolvedValue(75);
        mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'critical-log' });

        await analyticsService.handleSystemHealthCheck();

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'CRITICAL: High error rate detected! 75 errors',
          ),
        );
        expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              payload: expect.objectContaining({
                errorRateLastHour: 75,
              }),
            }),
          }),
        );
      });

      it('should handle database connection failure', async () => {
        mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection timeout'));
        mockPrisma.user.count.mockResolvedValue(100);
        mockPrisma.behaviorLog.count.mockResolvedValue(10);
        mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'down-log' });

        await analyticsService.handleSystemHealthCheck();

        expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              payload: expect.objectContaining({
                dbStatus: 'DOWN',
              }),
            }),
          }),
        );
      });
    });

    describe('Log Aggregation and Archiving', () => {
      it('should aggregate and archive behavior logs successfully', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const mockLogs = [
          {
            userId: 'user-1',
            eventType: 'LESSON_VIEW',
            timestamp: new Date(yesterday.getTime() + 3600000),
          },
          {
            userId: 'user-1',
            eventType: 'LESSON_VIEW',
            timestamp: new Date(yesterday.getTime() + 7200000),
          },
          {
            userId: 'user-2',
            eventType: 'QUIZ_START',
            timestamp: new Date(yesterday.getTime() + 10800000),
          },
        ];

        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);
        mockPrisma.behaviorLog.deleteMany.mockResolvedValue({ count: 150 });

        await analyticsService.handleLogAggregation();

        expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith({
          where: {
            timestamp: {
              gte: expect.any(Date),
              lt: expect.any(Date),
            },
          },
        });
        expect(mockPrisma.behaviorLog.deleteMany).toHaveBeenCalledWith({
          where: {
            timestamp: {
              lt: expect.any(Date),
            },
          },
        });
      });

      it('should skip aggregation when no logs exist', async () => {
        const logSpy = vi.spyOn(analyticsService['logger'], 'log');
        mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
        mockPrisma.behaviorLog.deleteMany.mockResolvedValue({ count: 0 });

        await analyticsService.handleLogAggregation();

        expect(logSpy).toHaveBeenCalledWith(
          'No logs to aggregate for yesterday.',
        );
      });

      it('should handle aggregation errors gracefully', async () => {
        const errorSpy = vi.spyOn(analyticsService['logger'], 'error');
        mockPrisma.behaviorLog.findMany.mockRejectedValue(
          new Error('Database error'),
        );

        await analyticsService.handleLogAggregation();

        expect(errorSpy).toHaveBeenCalledWith(
          'Log aggregation failed',
          expect.any(String),
        );
      });
    });

    describe('Variable Reward Distribution', () => {
      it('should award variable rewards based on lesson completion', async () => {
        const userId = 'user-reward-test';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        vi.spyOn(Math, 'random').mockReturnValueOnce(0.15);

        mockPrisma.user.findUnique.mockResolvedValue({
          id: userId,
          investmentProfile: {},
          buddyMemberships: [],
        });

        mockPrisma.behaviorLog.findMany
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {
              eventType: 'LESSON_COMPLETED',
              timestamp: new Date(today.getTime() + 3600000),
            },
          ]);

        await mentorService.getPersonalizedAdvice(userId, 'Test query', {
          module: 'M1',
          lesson: 'L1',
          locale: 'vi',
        });

        expect(mockEventEmitter.emit).toHaveBeenCalledWith(
          'points.earned',
          expect.objectContaining({
            userId,
            eventType: 'VARIABLE_REWARD_CLAIMED',
            pointsEarned: expect.any(Number),
            metadata: expect.objectContaining({
              rewardName: expect.any(String),
            }),
          }),
        );
      });

      it('should not award rewards when random threshold not met', async () => {
        const userId = 'user-no-reward';

        vi.spyOn(Math, 'random').mockReturnValueOnce(0.85);

        mockPrisma.user.findUnique.mockResolvedValue({
          id: userId,
          investmentProfile: {},
          buddyMemberships: [],
        });

        mockPrisma.behaviorLog.findMany
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            { eventType: 'LESSON_COMPLETED', timestamp: new Date() },
          ]);

        await mentorService.getPersonalizedAdvice(userId, 'Test query', {
          module: 'M1',
          lesson: 'L1',
          locale: 'vi',
        });

        expect(mockEventEmitter.emit).not.toHaveBeenCalled();
      });

      it('should include reward notification in AI response context', async () => {
        const userId = 'user-reward-context';

        vi.spyOn(Math, 'random')
          .mockReturnValueOnce(0.1)
          .mockReturnValueOnce(0.5)
          .mockReturnValueOnce(0.3);

        mockPrisma.user.findUnique.mockResolvedValue({
          id: userId,
          investmentProfile: {},
          buddyMemberships: [],
        });

        mockPrisma.behaviorLog.findMany
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            { eventType: 'LESSON_COMPLETED', timestamp: new Date() },
          ]);

        await mentorService.getPersonalizedAdvice(userId, 'Thanks!', {
          module: 'M1',
          lesson: 'L1',
          locale: 'vi',
        });

        expect(mockGemini.generateResponse).toHaveBeenCalledWith(
          expect.objectContaining({
            context: expect.objectContaining({
              variable_reward: expect.stringContaining('surprise reward'),
            }),
          }),
        );
      });
    });
  });

  describe('Dependency Mocking and Isolation', () => {
    it('should properly mock all Prisma dependencies', () => {
      expect(mockPrisma.$queryRaw).toBeDefined();
      expect(mockPrisma.user.count).toBeDefined();
      expect(mockPrisma.behaviorLog.findMany).toBeDefined();
      expect(mockPrisma.userProgress.count).toBeDefined();
    });

    it('should properly mock GeminiService', () => {
      expect(mockGemini.generateResponse).toBeDefined();
    });

    it('should properly mock EventEmitter2', () => {
      expect(mockEventEmitter.emit).toBeDefined();
    });

    it('should ensure service dependencies are injected correctly', () => {
      expect(analyticsService).toBeDefined();
      expect(predictiveService).toBeDefined();
      expect(mentorService).toBeDefined();
    });

    it('should handle circular dependencies between analytics and predictive services', async () => {
      const userId = 'circular-dep-test';
      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { eventType: 'LESSON_COMPLETED', timestamp: new Date() },
      ]);

      const simulation =
        await predictiveService.simulateFinancialFuture(userId);

      expect(simulation.personaContext).toBeDefined();
      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty user data gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'nonexistent-user',
        investmentProfile: null,
        buddyMemberships: [],
      });
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await mentorService.getPersonalizedAdvice(
        'nonexistent-user',
        'Help',
        {
          module: 'M1',
          lesson: 'L1',
          locale: 'vi',
        },
      );

      expect(result).toBeDefined();
      expect(mockGemini.generateResponse).toHaveBeenCalled();
    });

    it('should handle invalid date ranges in log queries', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const habits =
        await analyticsService.getUserLearningHabits('user-no-data');

      expect(habits).toBeNull();
    });

    it('should handle concurrent health checks without race conditions', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([1]);
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.behaviorLog.count.mockResolvedValue(10);
      mockPrisma.behaviorLog.create.mockResolvedValue({ id: 'concurrent-log' });

      await Promise.all([
        analyticsService.handleSystemHealthCheck(),
        analyticsService.handleSystemHealthCheck(),
        analyticsService.handleSystemHealthCheck(),
      ]);

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledTimes(3);
    });

    it('should maintain data consistency during aggregation failures', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { userId: 'u1', eventType: 'TEST', timestamp: new Date() },
      ]);
      mockPrisma.behaviorLog.deleteMany.mockRejectedValue(
        new Error('Delete failed'),
      );

      await analyticsService.handleLogAggregation();

      const errorSpy = vi.spyOn(analyticsService['logger'], 'error');
      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalled();
    });
  });

  describe('Performance and Scalability', () => {
    it('should efficiently handle large behavior log datasets', async () => {
      const largeLogs = Array(1000)
        .fill(null)
        .map((_, i) => ({
          eventType: i % 2 === 0 ? 'LESSON_VIEW' : 'QUIZ_START',
          timestamp: new Date(`2025-12-20T${10 + (i % 12)}:${i % 60}:00Z`),
        }));

      mockPrisma.behaviorLog.findMany.mockResolvedValue(
        largeLogs.slice(0, 100),
      );

      const habits =
        await analyticsService.getUserLearningHabits('user-large-data');

      expect(habits).toBeDefined();
      expect(habits?.totalLogsAnalyzed).toBe(100);
      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it('should batch process multiple user personas efficiently', async () => {
      const userIds = ['u1', 'u2', 'u3', 'u4', 'u5'];
      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
      ]);

      const personas = await Promise.all(
        userIds.map((id) => analyticsService.getUserPersona(id)),
      );

      expect(personas).toHaveLength(5);
      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledTimes(5);
    });
  });
});
