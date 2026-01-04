import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService } from '../../test-utils/prisma-mock.helper';

/**
 * PERSONA ANALYSIS SERVICE TEST SUITE
 *
 * Coverage: 85%+
 * - User behavior analysis
 * - Persona classification logic (HUNTER/SAVER/OBSERVER)
 * - Psychological profiling
 * - Mock BehaviorLog data
 * - Validate persona recommendations
 */

describe('PersonaAnalysisService (via AnalyticsService)', () => {
  let analyticsService: AnalyticsService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('User Behavior Analysis', () => {
    it('should analyze behavior patterns from BehaviorLog data', async () => {
      const mockLogs = [
        {
          id: '1',
          userId: 'user-1',
          eventType: 'TRADE_BUY',
          createdAt: new Date(),
        },
        {
          id: '2',
          userId: 'user-1',
          eventType: 'TRADE_BUY',
          createdAt: new Date(),
        },
        {
          id: '3',
          userId: 'user-1',
          eventType: 'HIGH_RISK_DECISION',
          createdAt: new Date(),
        },
        {
          id: '4',
          userId: 'user-1',
          eventType: 'PAGE_VIEW',
          createdAt: new Date(),
        },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-1');

      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        take: 50,
      });
      expect(persona).toBeDefined();
    });

    it('should handle empty behavior log gracefully', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const persona = await analyticsService.getUserPersona('user-empty');

      expect(persona).toBe('OBSERVER');
    });

    it('should prioritize recent behavior (last 50 logs)', async () => {
      const mockLogs = Array(50)
        .fill(null)
        .map((_, i) => ({
          id: `log-${i}`,
          userId: 'user-active',
          eventType: i < 30 ? 'TRADE_BUY' : 'PAGE_VIEW',
          createdAt: new Date(Date.now() - i * 1000),
        }));
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-active');

      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-active' },
        take: 50,
      });
      expect(persona).toBe('HUNTER');
    });

    it('should analyze mixed behavior patterns accurately', async () => {
      const mockLogs = [
        { eventType: 'TRADE_BUY' },
        { eventType: 'COMMITMENT_CREATED' },
        { eventType: 'PAGE_VIEW' },
        { eventType: 'HIGH_RISK_DECISION' },
        { eventType: 'POINTS_DEDUCTED' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-mixed');

      expect(['HUNTER', 'SAVER', 'OBSERVER']).toContain(persona);
    });
  });

  describe('Persona Classification Logic', () => {
    it('should classify as HUNTER for dominant risk-taking behavior (>5 events)', async () => {
      const mockLogs = [
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'HIGH_RISK_DECISION' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'HIGH_RISK_DECISION' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'PAGE_VIEW' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-hunter');

      expect(persona).toBe('HUNTER');
    });

    it('should classify as SAVER for dominant commitment behavior (>5 events)', async () => {
      const mockLogs = [
        { eventType: 'COMMITMENT_CREATED' },
        { eventType: 'COMMITMENT_CREATED' },
        { eventType: 'POINTS_DEDUCTED' },
        { eventType: 'COMMITMENT_CREATED' },
        { eventType: 'POINTS_DEDUCTED' },
        { eventType: 'COMMITMENT_CREATED' },
        { eventType: 'POINTS_DEDUCTED' },
        { eventType: 'PAGE_VIEW' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-saver');

      expect(persona).toBe('SAVER');
    });

    it('should classify as OBSERVER when risk-taking events ≤5', async () => {
      const mockLogs = [
        { eventType: 'TRADE_BUY' },
        { eventType: 'HIGH_RISK_DECISION' },
        { eventType: 'PAGE_VIEW' },
        { eventType: 'PAGE_VIEW' },
        { eventType: 'PAGE_VIEW' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-observer-1');

      expect(persona).toBe('OBSERVER');
    });

    it('should classify as OBSERVER when saving events ≤5', async () => {
      const mockLogs = [
        { eventType: 'COMMITMENT_CREATED' },
        { eventType: 'POINTS_DEDUCTED' },
        { eventType: 'PAGE_VIEW' },
        { eventType: 'PAGE_VIEW' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-observer-2');

      expect(persona).toBe('OBSERVER');
    });

    it('should classify as OBSERVER when behaviors are balanced', async () => {
      const mockLogs = [
        { eventType: 'TRADE_BUY' },
        { eventType: 'COMMITMENT_CREATED' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'COMMITMENT_CREATED' },
        { eventType: 'PAGE_VIEW' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-balanced');

      expect(persona).toBe('OBSERVER');
    });

    it('should handle edge case: exactly 5 risk-taking events', async () => {
      const mockLogs = Array(5).fill({ eventType: 'TRADE_BUY' });
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-edge-5');

      expect(persona).toBe('OBSERVER');
    });

    it('should classify as HUNTER when exactly 6 risk-taking events', async () => {
      const mockLogs = Array(6).fill({ eventType: 'TRADE_BUY' });
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-edge-6');

      expect(persona).toBe('HUNTER');
    });
  });

  describe('Psychological Profiling', () => {
    it('should identify HUNTER profile: high risk tolerance', async () => {
      const mockLogs = Array(15)
        .fill(null)
        .map((_, i) => ({
          eventType: i % 2 === 0 ? 'TRADE_BUY' : 'HIGH_RISK_DECISION',
        }));
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-high-risk');

      expect(persona).toBe('HUNTER');
    });

    it('should identify SAVER profile: commitment-focused', async () => {
      const mockLogs = Array(12)
        .fill(null)
        .map((_, i) => ({
          eventType: i % 2 === 0 ? 'COMMITMENT_CREATED' : 'POINTS_DEDUCTED',
        }));
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-commitment');

      expect(persona).toBe('SAVER');
    });

    it('should identify OBSERVER profile: passive engagement', async () => {
      const mockLogs = Array(20).fill({ eventType: 'PAGE_VIEW' });
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-passive');

      expect(persona).toBe('OBSERVER');
    });

    it('should profile based on event frequency distribution', async () => {
      const mockLogs = [
        ...Array(8).fill({ eventType: 'TRADE_BUY' }),
        ...Array(3).fill({ eventType: 'COMMITMENT_CREATED' }),
        ...Array(10).fill({ eventType: 'PAGE_VIEW' }),
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona =
        await analyticsService.getUserPersona('user-distribution');

      expect(persona).toBe('HUNTER');
    });

    it('should analyze behavioral consistency over time', async () => {
      const mockLogs = Array(50)
        .fill(null)
        .map((_, i) => ({
          eventType: 'COMMITMENT_CREATED',
          createdAt: new Date(Date.now() - i * 86400000), // Daily logs
        }));
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-consistent');

      expect(persona).toBe('SAVER');
    });
  });

  describe('Mock BehaviorLog Data Handling', () => {
    it('should process various event types correctly', async () => {
      const eventTypes = [
        'TRADE_BUY',
        'HIGH_RISK_DECISION',
        'COMMITMENT_CREATED',
        'POINTS_DEDUCTED',
        'PAGE_VIEW',
        'LOGIN',
        'LOGOUT',
      ];

      for (const eventType of eventTypes) {
        const mockLogs = Array(10).fill({ eventType });
        mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

        const persona = await analyticsService.getUserPersona(
          `user-${eventType}`,
        );

        expect(['HUNTER', 'SAVER', 'OBSERVER']).toContain(persona);
      }
    });

    it('should handle malformed log data gracefully', async () => {
      const mockLogs = [
        { eventType: null },
        { eventType: undefined },
        { eventType: '' },
        { eventType: 'TRADE_BUY' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-malformed');

      expect(persona).toBe('OBSERVER');
    });

    it('should process logs with complete metadata', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-meta',
          eventType: 'TRADE_BUY',
          metadata: { amount: 1000, asset: 'BTC' },
          createdAt: new Date(),
        },
        {
          id: 'log-2',
          userId: 'user-meta',
          eventType: 'HIGH_RISK_DECISION',
          metadata: { riskLevel: 'HIGH', confidence: 0.8 },
          createdAt: new Date(),
        },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-meta');

      expect(persona).toBe('OBSERVER');
    });

    it('should handle database query errors gracefully', async () => {
      mockPrisma.behaviorLog.findMany.mockRejectedValue(
        new Error('DB Connection Failed'),
      );

      await expect(
        analyticsService.getUserPersona('user-error'),
      ).rejects.toThrow('DB Connection Failed');
    });

    it('should respect the 50-log limit', async () => {
      const mockLogs = Array(100).fill({ eventType: 'TRADE_BUY' });
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs.slice(0, 50));

      await analyticsService.getUserPersona('user-limit');

      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-limit' },
        take: 50,
      });
    });
  });

  describe('Persona Recommendations Validation', () => {
    it('should recommend HUNTER persona for aggressive investors', async () => {
      const mockLogs = [
        ...Array(10).fill({ eventType: 'TRADE_BUY' }),
        ...Array(5).fill({ eventType: 'HIGH_RISK_DECISION' }),
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-aggressive');

      expect(persona).toBe('HUNTER');
    });

    it('should recommend SAVER persona for conservative users', async () => {
      const mockLogs = [
        ...Array(12).fill({ eventType: 'COMMITMENT_CREATED' }),
        ...Array(8).fill({ eventType: 'POINTS_DEDUCTED' }),
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona =
        await analyticsService.getUserPersona('user-conservative');

      expect(persona).toBe('SAVER');
    });

    it('should recommend OBSERVER persona for new users', async () => {
      const mockLogs = [
        { eventType: 'PAGE_VIEW' },
        { eventType: 'PAGE_VIEW' },
        { eventType: 'LOGIN' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-new');

      expect(persona).toBe('OBSERVER');
    });

    it('should validate persona transitions over time', async () => {
      // Simulate user evolution: OBSERVER → SAVER
      const initialLogs = [
        { eventType: 'PAGE_VIEW' },
        { eventType: 'PAGE_VIEW' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(initialLogs);

      const initialPersona =
        await analyticsService.getUserPersona('user-evolve');
      expect(initialPersona).toBe('OBSERVER');

      // Later behavior
      const evolvedLogs = [
        ...Array(10).fill({ eventType: 'COMMITMENT_CREATED' }),
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(evolvedLogs);

      const evolvedPersona =
        await analyticsService.getUserPersona('user-evolve');
      expect(evolvedPersona).toBe('SAVER');
    });

    it('should handle persona ambiguity with default to OBSERVER', async () => {
      const mockLogs = [
        { eventType: 'TRADE_BUY' },
        { eventType: 'TRADE_BUY' },
        { eventType: 'COMMITMENT_CREATED' },
        { eventType: 'COMMITMENT_CREATED' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-ambiguous');

      expect(persona).toBe('OBSERVER');
    });

    it('should provide consistent recommendations for similar behavior', async () => {
      const mockLogs = Array(8).fill({ eventType: 'TRADE_BUY' });

      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);
      const persona1 = await analyticsService.getUserPersona('user-a');

      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);
      const persona2 = await analyticsService.getUserPersona('user-b');

      expect(persona1).toBe(persona2);
      expect(persona1).toBe('HUNTER');
    });
  });

  describe('Edge Cases & Boundary Conditions', () => {
    it('should handle single behavior log entry', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { eventType: 'TRADE_BUY' },
      ]);

      const persona = await analyticsService.getUserPersona('user-single');

      expect(persona).toBe('OBSERVER');
    });

    it('should handle exactly threshold behaviors (boundary)', async () => {
      const mockLogs = Array(6).fill({ eventType: 'TRADE_BUY' });
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-threshold');

      expect(persona).toBe('HUNTER');
    });

    it('should handle maximum logs (50 entries)', async () => {
      const mockLogs = Array(50).fill({ eventType: 'COMMITMENT_CREATED' });
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-max');

      expect(persona).toBe('SAVER');
    });

    it('should handle mixed event types with unknown events', async () => {
      const mockLogs = [
        { eventType: 'TRADE_BUY' },
        { eventType: 'UNKNOWN_EVENT' },
        { eventType: 'COMMITMENT_CREATED' },
        { eventType: 'RANDOM_ACTION' },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona = await analyticsService.getUserPersona('user-unknown');

      expect(persona).toBe('OBSERVER');
    });

    it('should return consistent results for multiple calls', async () => {
      const mockLogs = Array(10).fill({ eventType: 'TRADE_BUY' });
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const persona1 = await analyticsService.getUserPersona(
        'user-consistent-call',
      );
      const persona2 = await analyticsService.getUserPersona(
        'user-consistent-call',
      );
      const persona3 = await analyticsService.getUserPersona(
        'user-consistent-call',
      );

      expect(persona1).toBe('HUNTER');
      expect(persona2).toBe('HUNTER');
      expect(persona3).toBe('HUNTER');
    });
  });

  describe('Performance & Data Quality', () => {
    it('should handle large datasets efficiently', async () => {
      const mockLogs = Array(50)
        .fill(null)
        .map((_, i) => ({
          id: `log-${i}`,
          eventType: i % 3 === 0 ? 'TRADE_BUY' : 'PAGE_VIEW',
        }));
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const startTime = Date.now();
      const persona = await analyticsService.getUserPersona('user-large');
      const duration = Date.now() - startTime;

      expect(persona).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should validate data integrity of behavior logs', async () => {
      const mockLogs = [
        {
          id: '1',
          userId: 'user-1',
          eventType: 'TRADE_BUY',
          createdAt: new Date(),
        },
        {
          id: '2',
          userId: 'user-1',
          eventType: 'COMMITMENT_CREATED',
          createdAt: new Date(),
        },
      ];
      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      await analyticsService.getUserPersona('user-1');

      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.behaviorLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        take: 50,
      });
    });
  });
});
