import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from '../../../src/modules/analytics/analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      user: {
        count: vi.fn().mockResolvedValue(100),
        aggregate: vi.fn().mockResolvedValue({ _sum: { points: 1000 } }),
      },
      behaviorLog: {
        count: vi.fn().mockResolvedValue(5),
        create: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn().mockResolvedValue({ count: 10 }),
      },
      userProgress: {
        count: vi.fn().mockResolvedValue(50),
      },
    };
    service = new AnalyticsService(prisma);
  });

  describe('handleSystemHealthCheck', () => {
    it('should run health check and log results', async () => {
      await service.handleSystemHealthCheck();
      expect(prisma.behaviorLog.create).toHaveBeenCalled();
      expect(prisma.user.count).toHaveBeenCalled();
    });

    it('should handle DB failure gracefully', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('DB DOWN'));
      await service.handleSystemHealthCheck();
      expect(prisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payload: expect.objectContaining({ dbStatus: 'DOWN' }),
          }),
        }),
      );
    });
  });

  describe('getGlobalSystemStats', () => {
    it('should return global stats', async () => {
      const stats = await service.getGlobalSystemStats();
      expect(stats.totalUsers).toBe(100);
      expect(stats.distributedPoints).toBe(1000);
    });
  });

  describe('getUserPersona', () => {
    it('should return OBSERVER for no logs', async () => {
      prisma.behaviorLog.findMany.mockResolvedValue([]);
      const persona = await service.getUserPersona('user-1');
      expect(persona).toBe('OBSERVER');
    });

    it('should classify as HUNTER if high risk events predominate', async () => {
      prisma.behaviorLog.findMany.mockResolvedValue([
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
      ]);
      const persona = await service.getUserPersona('user-1');
      expect(persona).toBe('HUNTER');
    });
  });
});
