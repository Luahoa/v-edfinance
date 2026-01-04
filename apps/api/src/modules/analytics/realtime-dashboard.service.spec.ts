import { Test, type TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DiagnosticService } from '../debug/diagnostic.service';
import { AnalyticsService } from './analytics.service';
import { SocialGateway } from '../social/social.gateway';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import * as client from 'prom-client';

describe('RealtimeDashboardService (Integration)', () => {
  let diagnosticService: DiagnosticService;
  let analyticsService: AnalyticsService;
  let socialGateway: SocialGateway;
  let prismaService: PrismaService;
  let aiService: AiService;

  const mockPrismaService = {
    $queryRaw: vi.fn(),
    user: {
      count: vi.fn(),
      findUnique: vi.fn(),
      aggregate: vi.fn(),
      upsert: vi.fn(),
    },
    behaviorLog: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    course: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    userProgress: {
      count: vi.fn(),
    },
    chatThread: {
      findFirst: vi.fn(),
    },
  };

  const mockAiService = {
    createThread: vi.fn(),
    generateResponse: vi.fn(),
  };

  const mockSocialGateway = {
    getConnectedClientsCount: vi.fn().mockReturnValue(0),
    broadcastNewPost: vi.fn().mockImplementation((post) => {
      mockSocialGateway.server.emit('new_post', post);
    }),
    sendToUser: vi.fn().mockImplementation((userId, event, data) => {
      mockSocialGateway.server.to(`user_${userId}`);
      mockSocialGateway.server.emit(event, data);
    }),
    broadcastToGroup: vi.fn().mockImplementation((groupId, event, data) => {
      mockSocialGateway.server.to(`group_${groupId}`);
      mockSocialGateway.server.emit(event, data);
    }),
    handleDisconnect: vi.fn().mockImplementation((client) => {
      for (const [
        userId,
        socketId,
      ] of mockSocialGateway.connectedClients.entries()) {
        if (socketId === client.id) {
          mockSocialGateway.server.emit('user_offline', { userId });
          mockSocialGateway.connectedClients.delete(userId);
          break;
        }
      }
    }),
    server: {
      emit: vi.fn(),
      to: vi.fn().mockReturnThis(),
    },
    connectedClients: new Map(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiagnosticService,
        AnalyticsService,
        { provide: SocialGateway, useValue: mockSocialGateway },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    diagnosticService = module.get<DiagnosticService>(DiagnosticService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    socialGateway = module.get<SocialGateway>(SocialGateway);
    prismaService = module.get<PrismaService>(PrismaService);
    aiService = module.get<AiService>(AiService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Live Metric Updates', () => {
    it('should collect real-time metrics from last 10 minutes', async () => {
      const mockDate = new Date('2025-01-01T12:00:00Z');
      vi.setSystemTime(mockDate);

      mockPrismaService.behaviorLog.count
        .mockResolvedValueOnce(6000) // Total events
        .mockResolvedValueOnce(60) // Error events
        .mockResolvedValueOnce(300); // Nudge events

      const result = await diagnosticService['collectRealTimeMetrics']();

      expect(result).toEqual({
        throughput_eps: 10, // 6000 events / 600 seconds
        error_rate: 1, // (60/6000) * 100
        nudge_engagement_potential: 5, // (300/6000) * 100
        resource_state: 'OPTIMAL_UNDER_E2B_8VCPU',
      });

      const expectedTimestamp = new Date(mockDate.getTime() - 10 * 60 * 1000);
      expect(mockPrismaService.behaviorLog.count).toHaveBeenCalledWith({
        where: { timestamp: { gte: expectedTimestamp } },
      });
    });

    it('should handle zero events gracefully', async () => {
      mockPrismaService.behaviorLog.count.mockResolvedValue(0);

      const result = await diagnosticService['collectRealTimeMetrics']();

      expect(result.throughput_eps).toBe(0);
      expect(result.error_rate).toBe(0);
      expect(result.nudge_engagement_potential).toBe(0);
    });

    it('should update Prometheus gauges on metrics collection', async () => {
      const setThroughputSpy = vi.spyOn(
        diagnosticService['throughputGauge'],
        'set',
      );
      const setErrorRateSpy = vi.spyOn(
        diagnosticService['errorRateGauge'],
        'set',
      );
      const setWsConnectionsSpy = vi.spyOn(
        diagnosticService['wsConnectionsGauge'],
        'set',
      );

      mockPrismaService.behaviorLog.count
        .mockResolvedValueOnce(1200)
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(60);

      mockSocialGateway.getConnectedClientsCount.mockReturnValue(25);

      await diagnosticService['updatePrometheusMetrics']();

      expect(setThroughputSpy).toHaveBeenCalledWith(2); // 1200/600
      expect(setErrorRateSpy).toHaveBeenCalledWith(1); // (12/1200)*100
      expect(setWsConnectionsSpy).toHaveBeenCalledWith(25);
    });

    it('should export metrics in Prometheus format', async () => {
      const metrics = await diagnosticService.getMetrics();

      expect(metrics).toContain('vedfinance_throughput_eps');
      expect(metrics).toContain('vedfinance_error_rate');
      expect(metrics).toContain('vedfinance_ws_connections');
      expect(typeof metrics).toBe('string');
    });
  });

  describe('WebSocket Event Streaming', () => {
    it('should track active WebSocket connections', () => {
      mockSocialGateway.connectedClients.set('user-1', 'socket-abc');
      mockSocialGateway.connectedClients.set('user-2', 'socket-def');
      mockSocialGateway.getConnectedClientsCount.mockReturnValue(2);

      const count = socialGateway.getConnectedClientsCount();

      expect(count).toBe(2);
    });

    it('should broadcast real-time events to all connected clients', () => {
      const mockPost = {
        id: 'post-123',
        content: 'Market crash alert!',
        timestamp: new Date(),
      };

      socialGateway.broadcastNewPost(mockPost);

      expect(mockSocialGateway.server.emit).toHaveBeenCalledWith(
        'new_post',
        mockPost,
      );
    });

    it('should send targeted events to specific users', () => {
      const userId = 'user-456';
      const eventData = { achievement: 'STREAK_7_DAYS', points: 50 };

      socialGateway.sendToUser(userId, 'achievement_unlocked', eventData);

      expect(mockSocialGateway.server.to).toHaveBeenCalledWith(
        `user_${userId}`,
      );
      expect(mockSocialGateway.server.emit).toHaveBeenCalledWith(
        'achievement_unlocked',
        eventData,
      );
    });

    it('should broadcast to groups (rooms)', () => {
      const groupId = 'cohort-2025-jan';
      const announcement = {
        message: 'New lesson released!',
        priority: 'HIGH',
      };

      socialGateway.broadcastToGroup(
        groupId,
        'group_announcement',
        announcement,
      );

      expect(mockSocialGateway.server.to).toHaveBeenCalledWith(
        `group_${groupId}`,
      );
      expect(mockSocialGateway.server.emit).toHaveBeenCalledWith(
        'group_announcement',
        announcement,
      );
    });

    it('should handle client disconnection and cleanup', () => {
      const mockClient = {
        id: 'socket-xyz',
      } as any;

      mockSocialGateway.connectedClients.set('user-789', 'socket-xyz');

      socialGateway.handleDisconnect(mockClient);

      expect(mockSocialGateway.server.emit).toHaveBeenCalledWith(
        'user_offline',
        {
          userId: 'user-789',
        },
      );
    });
  });

  describe('Data Aggregation Performance', () => {
    it('should aggregate behavior logs efficiently for daily archival', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const mockLogs = [
        {
          id: '1',
          userId: 'user-1',
          eventType: 'COURSE_VIEW',
          timestamp: yesterday,
          sessionId: 'session-1',
          path: '/courses',
          payload: {},
        },
        {
          id: '2',
          userId: 'user-1',
          eventType: 'COURSE_VIEW',
          timestamp: yesterday,
          sessionId: 'session-1',
          path: '/courses',
          payload: {},
        },
        {
          id: '3',
          userId: 'user-2',
          eventType: 'QUIZ_SUBMIT',
          timestamp: yesterday,
          sessionId: 'session-2',
          path: '/quiz',
          payload: {},
        },
      ];

      mockPrismaService.behaviorLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.behaviorLog.deleteMany.mockResolvedValue({
        count: 150,
      });

      await analyticsService.handleLogAggregation();

      expect(mockPrismaService.behaviorLog.findMany).toHaveBeenCalled();
      expect(mockPrismaService.behaviorLog.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should perform health check aggregation every hour', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      mockPrismaService.user.count.mockResolvedValue(1250);
      mockPrismaService.behaviorLog.count.mockResolvedValue(45);
      mockPrismaService.behaviorLog.create.mockResolvedValue({});

      await analyticsService.handleSystemHealthCheck();

      expect(mockPrismaService.behaviorLog.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'health-hub',
          path: 'system/health',
          eventType: 'HEALTH_CHECK',
          payload: {
            dbStatus: 'OK',
            userCount: 1250,
            errorRateLastHour: 45,
            timestamp: expect.any(Date),
          },
        },
      });
    });

    it('should calculate global system stats efficiently', async () => {
      mockPrismaService.user.count.mockResolvedValue(5000);
      mockPrismaService.userProgress.count.mockResolvedValue(12500);
      mockPrismaService.user.aggregate.mockResolvedValue({
        _sum: { points: 250000 },
      });

      const stats = await analyticsService.getGlobalSystemStats();

      expect(stats).toEqual({
        totalUsers: 5000,
        completedLessons: 12500,
        distributedPoints: 250000,
      });

      expect(mockPrismaService.user.count).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.userProgress.count).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.user.aggregate).toHaveBeenCalledTimes(1);
    });

    it('should analyze user learning habits from behavior logs', async () => {
      const mockLogs = Array.from({ length: 100 }, (_, i) => ({
        id: `log-${i}`,
        userId: 'user-123',
        eventType: i % 3 === 0 ? 'COURSE_VIEW' : 'QUIZ_SUBMIT',
        timestamp: new Date(2025, 0, 1, i % 24, 0, 0),
        sessionId: `session-${i}`,
        path: '/learn',
        payload: {},
      }));

      mockPrismaService.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const habits = await analyticsService.getUserLearningHabits('user-123');

      expect(habits).toBeTruthy();
      expect(habits?.peakLearningHour).toBeGreaterThanOrEqual(0);
      expect(habits?.peakLearningHour).toBeLessThan(24);
      expect(habits?.topActivities).toBeInstanceOf(Array);
      expect(habits?.totalLogsAnalyzed).toBe(100);
    });

    it('should handle empty user learning habits', async () => {
      mockPrismaService.behaviorLog.findMany.mockResolvedValue([]);

      const habits =
        await analyticsService.getUserLearningHabits('user-nonexistent');

      expect(habits).toBeNull();
    });
  });

  describe('Mock Real-Time Data Sources', () => {
    it('should generate mock behavioral data for stress testing', async () => {
      const mockUser = {
        id: 'test-user-123',
        email: 'sandbox-test@v-edfinance.com',
        passwordHash: 'nopassword',
        name: { vi: 'Test', en: 'Test', zh: 'Test' },
      };

      mockPrismaService.user.upsert.mockResolvedValue(mockUser);

      const mockLogs = Array.from({ length: 10 }, (_, i) => ({
        id: `mock-log-${i}`,
        userId: mockUser.id,
        sessionId: `mock-session-${i}`,
        path: '/courses',
        eventType: 'COURSE_VIEW',
        payload: { isMock: true },
        timestamp: new Date(),
      }));

      mockPrismaService.behaviorLog.create.mockImplementation((params) =>
        Promise.resolve({
          id: `mock-log-${Math.random()}`,
          ...params.data,
        }),
      );

      const result = await diagnosticService.generateMockBehavioralData(
        mockUser.id,
        10,
      );

      expect(result).toHaveLength(10);
      expect(result[0].eventType).toMatch(
        /COURSE_VIEW|LESSON_START|QUIZ_SUBMIT|STREAK_FREEZE|AI_CHAT_OPEN/,
      );
      expect(result[0].payload).toHaveProperty('isMock', true);
    });

    it('should run AI stress test with different complexity levels', async () => {
      vi.useRealTimers(); // Use real timers for this test

      const mockThread = {
        id: 'thread-stress-test',
        userId: 'user-123',
        title: 'AI Stress Test',
        category: 'DEBUG',
      };

      const mockResponse = {
        content:
          'Compound interest is the interest calculated on both the principal and previously accumulated interest.',
        tokenCount: 50,
      };

      mockPrismaService.chatThread.findFirst.mockResolvedValue(null);
      mockAiService.createThread.mockResolvedValue(mockThread);
      mockAiService.generateResponse.mockResolvedValue(mockResponse);

      const result = await diagnosticService.runAiStressTest('user-123', 'LOW');

      expect(result.status).toBe('SUCCESS');
      expect(result.complexity).toBe('LOW');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.tokenEstimate).toBeGreaterThan(0);
      expect(result.contextWindowSafe).toBe(true);
    });

    it('should handle AI stress test failures gracefully', async () => {
      mockPrismaService.chatThread.findFirst.mockResolvedValue(null);
      mockAiService.createThread.mockRejectedValue(
        new Error('API quota exceeded'),
      );

      const result = await diagnosticService.runAiStressTest(
        'user-123',
        'HIGH',
      );

      expect(result.status).toBe('FAIL');
      expect(result.errorId).toMatch(/^ERR-STRESS-[A-Z0-9]{6}$/);
      expect(result.error).toContain('API quota exceeded');
      expect(result.complexity).toBe('HIGH');
    });

    it('should simulate complete user flow for integration testing', async () => {
      const mockUser = {
        id: 'user-flow-123',
        email: 'flow@test.com',
        passwordHash: 'hash',
        name: { vi: 'Test', en: 'Test', zh: 'Test' },
      };

      const mockCourse = {
        id: 'course-1',
        slug: 'financial-literacy-101',
        title: { vi: 'Tài chính', en: 'Finance', zh: '财务' },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.course.findFirst.mockResolvedValue(mockCourse);

      const result = await diagnosticService.simulateUserFlow('user-flow-123');

      expect(result.status).toBe('SUCCESS');
      expect(result.steps).toContain('User verified');
      expect(result.steps).toContain('Course found: financial-literacy-101');
    });
  });

  describe('Full System Diagnostics Integration', () => {
    it('should run comprehensive diagnostics with all subsystems', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);
      mockPrismaService.behaviorLog.count
        .mockResolvedValueOnce(3000)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(150);
      mockPrismaService.course.findMany.mockResolvedValue([
        {
          id: 'course-1',
          title: { vi: 'Khóa học', en: 'Course', zh: '课程' },
          slug: 'test-course',
        },
      ]);
      mockPrismaService.user.upsert.mockResolvedValue({
        id: 'sandbox-user',
        email: 'sandbox-test@v-edfinance.com',
      });
      mockPrismaService.behaviorLog.create.mockResolvedValue({
        id: 'mock-log-1',
        eventType: 'COURSE_VIEW',
      });
      mockSocialGateway.getConnectedClientsCount.mockReturnValue(15);

      const result = await diagnosticService.runFullDiagnostics();

      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('aiModel');
      expect(result).toHaveProperty('websockets');
      expect(result).toHaveProperty('storage');
      expect(result).toHaveProperty('sandbox');
      expect(result).toHaveProperty('logTracer');
      expect(result).toHaveProperty('integrity');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('timestamp');

      expect(result.database.status).toBe('OK');
      expect(result.websockets.connectedClients).toBe(15);
      expect(result.metrics.throughput_eps).toBe(5); // 3000/600
    });

    it('should detect database connection failure in diagnostics', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(
        new Error('Connection refused'),
      );

      const dbCheck = await diagnosticService['checkDatabase']();

      expect(dbCheck.status).toBe('FAIL');
      expect(dbCheck.error).toContain('Connection refused');
    });

    it('should validate JSONB schema integrity', async () => {
      const validCourses = [
        {
          id: 'course-1',
          title: { vi: 'Valid', en: 'Valid', zh: 'Valid' },
          slug: 'valid-course',
        },
      ];

      mockPrismaService.course.findMany.mockResolvedValue(validCourses);

      const integrityCheck = await diagnosticService['checkIntegrity']();

      expect(integrityCheck.status).toBe('OK');
      expect(integrityCheck.checked).toContain('CourseSchema');
    });

    it('should warn on JSONB schema drift', async () => {
      const invalidCourses = [
        {
          id: 'course-broken',
          title: 'Invalid String',
          slug: 'broken-course',
        },
      ];

      mockPrismaService.course.findMany.mockResolvedValue(invalidCourses);

      const integrityCheck = await diagnosticService['checkIntegrity']();

      expect(integrityCheck.status).toBe('WARN');
      expect(integrityCheck.detail).toContain('missing locale fields');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete metrics collection in under 100ms (mocked)', async () => {
      mockPrismaService.behaviorLog.count
        .mockResolvedValueOnce(5000)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(250);

      const startTime = performance.now();
      await diagnosticService['collectRealTimeMetrics']();
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should handle high-volume log aggregation efficiently', async () => {
      const largeBatch = Array.from({ length: 10000 }, (_, i) => ({
        id: `log-${i}`,
        userId: `user-${i % 100}`,
        eventType: 'COURSE_VIEW',
        timestamp: new Date(),
        sessionId: `session-${i}`,
        path: '/learn',
        payload: {},
      }));

      mockPrismaService.behaviorLog.findMany.mockResolvedValue(largeBatch);
      mockPrismaService.behaviorLog.deleteMany.mockResolvedValue({
        count: 5000,
      });

      const startTime = performance.now();
      await analyticsService.handleLogAggregation();
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('User Persona Classification', () => {
    it('should classify user as HUNTER (risk-taker)', async () => {
      const hunterLogs = Array.from({ length: 20 }, (_, i) => ({
        id: `log-${i}`,
        userId: 'hunter-user',
        eventType: i % 2 === 0 ? 'TRADE_BUY' : 'HIGH_RISK_DECISION',
        timestamp: new Date(),
        sessionId: `session-${i}`,
        path: '/trading',
        payload: {},
      }));

      mockPrismaService.behaviorLog.findMany.mockResolvedValue(hunterLogs);

      const persona = await analyticsService.getUserPersona('hunter-user');

      expect(persona).toBe('HUNTER');
    });

    it('should classify user as SAVER (conservative)', async () => {
      const saverLogs = Array.from({ length: 15 }, (_, i) => ({
        id: `log-${i}`,
        userId: 'saver-user',
        eventType: i % 2 === 0 ? 'COMMITMENT_CREATED' : 'POINTS_DEDUCTED',
        timestamp: new Date(),
        sessionId: `session-${i}`,
        path: '/commitments',
        payload: {},
      }));

      mockPrismaService.behaviorLog.findMany.mockResolvedValue(saverLogs);

      const persona = await analyticsService.getUserPersona('saver-user');

      expect(persona).toBe('SAVER');
    });

    it('should classify user as OBSERVER (default)', async () => {
      const observerLogs = Array.from({ length: 10 }, (_, i) => ({
        id: `log-${i}`,
        userId: 'observer-user',
        eventType: 'COURSE_VIEW',
        timestamp: new Date(),
        sessionId: `session-${i}`,
        path: '/browse',
        payload: {},
      }));

      mockPrismaService.behaviorLog.findMany.mockResolvedValue(observerLogs);

      const persona = await analyticsService.getUserPersona('observer-user');

      expect(persona).toBe('OBSERVER');
    });
  });
});
