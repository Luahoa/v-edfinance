import { Test, type TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service';
import { ReportsService } from '../src/modules/analytics/reports.service';
import { FunnelAnalysisService } from '../src/modules/analytics/funnel-analysis.service';
import { UserSegmentationService } from '../src/modules/analytics/user-segmentation.service';
import { DiagnosticService } from '../src/modules/debug/diagnostic.service';
import { AiService } from '../src/ai/ai.service';
import { SocialGateway } from '../src/modules/social/social.gateway';
import { I18nService } from '../src/common/i18n.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

describe('Analytics Reporting Integration', () => {
  let reportsService: ReportsService;
  let funnelService: FunnelAnalysisService;
  let segmentationService: UserSegmentationService;
  let diagnosticService: DiagnosticService;
  let socialGateway: SocialGateway;
  let prisma: PrismaService;

  const mockPrisma = {
    behaviorLog: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      aggregate: vi.fn(),
    },
    userProgress: {
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    $queryRaw: vi.fn(),
  };

  const mockSocialGateway = {
    server: {
      emit: vi.fn(),
    },
    getConnectedClientsCount: vi.fn().mockReturnValue(10),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        FunnelAnalysisService,
        UserSegmentationService,
        DiagnosticService,
        I18nService,
        AiService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SocialGateway, useValue: mockSocialGateway },
        { provide: CACHE_MANAGER, useValue: { get: vi.fn(), set: vi.fn() } },
        { provide: ConfigService, useValue: { get: vi.fn() } },
      ],
    }).compile();

    reportsService = module.get<ReportsService>(ReportsService);
    funnelService = module.get<FunnelAnalysisService>(FunnelAnalysisService);
    segmentationService = module.get<UserSegmentationService>(
      UserSegmentationService,
    );
    diagnosticService = module.get<DiagnosticService>(DiagnosticService);
    socialGateway = module.get<SocialGateway>(SocialGateway);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('Pipeline: Actions -> BehaviorLog -> Daily Report -> Export CSV', () => {
    it('should complete the full analytics pipeline', async () => {
      const userId = 'user-123';
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 1);

      // 1. Verify BehaviorLog (Mocking data that would be there after actions)
      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { eventType: 'LESSON_START', userId, timestamp: today },
        { eventType: 'SIMULATION_START', userId, timestamp: today },
      ]);
      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.userProgress.count.mockResolvedValue(5);
      mockPrisma.userProgress.aggregate.mockResolvedValue({
        _avg: { progressPercentage: 50 },
      });
      mockPrisma.user.aggregate.mockResolvedValue({ _sum: { points: 100 } });

      // 2. Generate daily report
      const report = await reportsService.generateReport({
        period: 'daily',
        userId,
      });

      expect(report.metrics.activeUsers).toBe(2);
      expect(report.activities).toContainEqual(
        expect.objectContaining({ eventType: 'LESSON_START' }),
      );

      // 3. Export CSV
      const csv = await reportsService.exportToCSV(report);
      expect(csv).toContain('LESSON_START,1');
      expect(csv).toContain('SIMULATION_START,1');
    });
  });

  describe('Conversion Funnel: Register -> First Simulation', () => {
    it('should calculate funnel conversion rates correctly', async () => {
      const stages = ['USER_REGISTERED', 'LESSON_START', 'SIMULATION_START'];
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-02');

      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(100) // Registered
        .mockResolvedValueOnce(50) // Lesson Start
        .mockResolvedValueOnce(10); // Simulation Start

      const funnel = await funnelService.getConversionFunnel(
        stages,
        start,
        end,
      );

      expect(funnel.totalUsers).toBe(100);
      expect(funnel.overallConversionRate).toBe(10);
      expect(funnel.stages[1].dropOffRate).toBe(50); // 100 -> 50
      expect(funnel.stages[2].dropOffRate).toBe(80); // 50 -> 10
    });
  });

  describe('Real-time Metrics: Prometheus/WS Updates', () => {
    it('should update Prometheus gauges and emit via WebSocket', async () => {
      const throughputSpy = vi.spyOn(
        diagnosticService['throughputGauge'],
        'set',
      );
      const wsSpy = vi.spyOn(diagnosticService['wsConnectionsGauge'], 'set');

      mockPrisma.behaviorLog.count.mockResolvedValue(600); // 600 events / 600s = 1 EPS
      mockSocialGateway.getConnectedClientsCount.mockReturnValue(42);

      await diagnosticService['updatePrometheusMetrics']();

      expect(throughputSpy).toHaveBeenCalledWith(1);
      expect(wsSpy).toHaveBeenCalledWith(42);
    });
  });

  describe('Segment-based Filtering', () => {
    it('should filter users by behavior segment', async () => {
      const criteria = { behaviorType: 'HUNTER' as const };

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-hunter-1', dateOfBirth: new Date('1990-01-01') },
      ]);

      // Mock logs to identify hunter behavior
      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
      ]);

      const matchedUsers =
        await segmentationService.getUsersMatchingCriteria(criteria);

      expect(matchedUsers).toHaveLength(1);
      expect(matchedUsers[0].id).toBe('user-hunter-1');
    });
  });
});
