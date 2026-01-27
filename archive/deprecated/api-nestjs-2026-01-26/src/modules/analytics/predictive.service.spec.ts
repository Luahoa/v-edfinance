import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';
import { PredictiveService } from './predictive.service';

describe('PredictiveService (Plan 1 - Unit Test)', () => {
  let service: PredictiveService;
  let prisma: PrismaService;

  const mockPrisma = {
    behaviorLog: {
      findMany: vi.fn(),
    },
  };

  const mockAnalytics = {
    getUserPersona: vi.fn().mockResolvedValue('SAVER'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockPrisma.behaviorLog.findMany = vi.fn();
    mockAnalytics.getUserPersona = vi.fn().mockResolvedValue('SAVER');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictiveService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AnalyticsService, useValue: mockAnalytics },
      ],
    }).compile();

    service = module.get<PredictiveService>(PredictiveService);
    // @ts-ignore
    service.prisma = mockPrisma;
    // @ts-ignore
    service.analytics = mockAnalytics;
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should calculate HIGH churn risk when activity gap is large', async () => {
    const now = new Date();
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(now.getDate() - 10);
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(now.getDate() - 20);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const fortyDaysAgo = new Date();
    fortyDaysAgo.setDate(now.getDate() - 40);

    mockPrisma.behaviorLog.findMany.mockResolvedValue([
      { timestamp: now },
      { timestamp: tenDaysAgo },
      { timestamp: twentyDaysAgo },
      { timestamp: thirtyDaysAgo },
      { timestamp: fortyDaysAgo },
    ]);

    const risk = await service.predictChurnRisk('user-1');
    expect(risk).toBe('HIGH');
  });

  it('should calculate LOW churn risk when activity gap is small', async () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 96 * 60 * 60 * 1000);

    mockPrisma.behaviorLog.findMany.mockResolvedValue([
      { timestamp: now },
      { timestamp: oneDayAgo },
      { timestamp: twoDaysAgo },
      { timestamp: threeDaysAgo },
      { timestamp: fourDaysAgo },
    ]);

    const risk = await service.predictChurnRisk('user-1');
    expect(risk).toBe('LOW');
  });

  it('should return LOW risk if not enough logs', async () => {
    mockPrisma.behaviorLog.findMany.mockResolvedValue([
      { timestamp: new Date() },
    ]);

    const risk = await service.predictChurnRisk('user-1');
    expect(risk).toBe('LOW');
  });

  it('should include persona context in financial simulation', async () => {
    mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
    mockAnalytics.getUserPersona.mockResolvedValue('WHALE');

    const result = await service.simulateFinancialFuture('user-1');

    expect(result.personaContext).toBe('WHALE');
    expect(mockAnalytics.getUserPersona).toHaveBeenCalledWith('user-1');
  });
});
