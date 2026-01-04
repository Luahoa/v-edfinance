import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FunnelAnalysisService } from './funnel-analysis.service';

describe('FunnelAnalysisService', () => {
  let service: FunnelAnalysisService;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      behaviorLog: {
        count: vi.fn(),
        findMany: vi.fn(),
        groupBy: vi.fn(),
      },
    };
    service = new FunnelAnalysisService(mockPrisma);
  });

  describe('getConversionFunnel', () => {
    it('should calculate conversion funnel with correct drop-off rates', async () => {
      const stages = ['SIGNUP', 'ONBOARDING', 'FIRST_LESSON', 'QUIZ_PASSED'];
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(1000) // SIGNUP
        .mockResolvedValueOnce(800) // ONBOARDING (20% drop)
        .mockResolvedValueOnce(600) // FIRST_LESSON (25% drop)
        .mockResolvedValueOnce(480); // QUIZ_PASSED (20% drop)

      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.getConversionFunnel(
        stages,
        startDate,
        endDate,
      );

      expect(result.totalUsers).toBe(1000);
      expect(result.overallConversionRate).toBe(48); // 480/1000 * 100
      expect(result.stages).toHaveLength(4);
      expect(result.stages[1].dropOffRate).toBe(20); // (1000-800)/1000 * 100
      expect(result.stages[2].dropOffRate).toBe(25); // (800-600)/800 * 100
    });

    it('should handle empty funnel data', async () => {
      mockPrisma.behaviorLog.count.mockResolvedValue(0);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.getConversionFunnel(
        ['SIGNUP', 'ONBOARDING'],
        new Date(),
        new Date(),
      );

      expect(result.totalUsers).toBe(0);
      expect(result.overallConversionRate).toBe(0);
      expect(result.stages[0].dropOffRate).toBe(0);
    });

    it('should calculate average time to next stage', async () => {
      const stages = ['LESSON_START', 'LESSON_COMPLETED'];

      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80);

      const mockLogs = [
        {
          sessionId: 's1',
          userId: 'u1',
          eventType: 'LESSON_START',
          timestamp: new Date('2025-01-01T10:00:00Z'),
        },
        {
          sessionId: 's1',
          userId: 'u1',
          eventType: 'LESSON_COMPLETED',
          timestamp: new Date('2025-01-01T10:30:00Z'), // 30 minutes later
        },
        {
          sessionId: 's2',
          userId: 'u2',
          eventType: 'LESSON_START',
          timestamp: new Date('2025-01-01T14:00:00Z'),
        },
        {
          sessionId: 's2',
          userId: 'u2',
          eventType: 'LESSON_COMPLETED',
          timestamp: new Date('2025-01-01T14:20:00Z'), // 20 minutes later
        },
      ];

      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getConversionFunnel(
        stages,
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result.stages[0].avgTimeToNext).toBeDefined();
      expect(result.stages[0].avgTimeToNext).toBe(1500); // (1800 + 1200) / 2 seconds
    });

    it('should handle users who never complete next stage', async () => {
      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(0);

      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        {
          sessionId: 's1',
          eventType: 'LESSON_START',
          timestamp: new Date(),
        },
      ]);

      const result = await service.getConversionFunnel(
        ['LESSON_START', 'LESSON_COMPLETED'],
        new Date(),
        new Date(),
      );

      expect(result.stages[1].count).toBe(0);
      expect(result.stages[1].dropOffRate).toBe(100);
    });
  });

  describe('detectDropOffPoints', () => {
    it('should identify critical drop-off points above threshold', async () => {
      const stages = ['SIGNUP', 'ONBOARDING', 'FIRST_LESSON', 'QUIZ_START'];

      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(900) // 10% drop
        .mockResolvedValueOnce(500) // 44% drop - CRITICAL
        .mockResolvedValueOnce(450); // 10% drop

      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const dropOffPoints = await service.detectDropOffPoints(
        stages,
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        30, // threshold
      );

      expect(dropOffPoints).toHaveLength(1);
      expect(dropOffPoints[0].stage).toBe('FIRST_LESSON');
      expect(dropOffPoints[0].dropOffRate).toBeGreaterThanOrEqual(30);
      expect(dropOffPoints[0].reasons).toContain('LOW_ENGAGEMENT');
    });

    it('should return severe reasons for high drop-off rates', async () => {
      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(400); // 60% drop

      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const dropOffPoints = await service.detectDropOffPoints(
        ['SIGNUP', 'ONBOARDING'],
        new Date(),
        new Date(),
        30,
      );

      expect(dropOffPoints[0].reasons).toContain('CRITICAL_UX_ISSUE');
      expect(dropOffPoints[0].reasons).toContain('CONTENT_TOO_DIFFICULT');
    });

    it('should return empty array when no critical drop-offs exist', async () => {
      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(950)
        .mockResolvedValueOnce(920);

      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const dropOffPoints = await service.detectDropOffPoints(
        ['STAGE1', 'STAGE2', 'STAGE3'],
        new Date(),
        new Date(),
        30,
      );

      expect(dropOffPoints).toHaveLength(0);
    });

    it('should use custom threshold for detection', async () => {
      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(85); // 15% drop

      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const dropOffPoints = await service.detectDropOffPoints(
        ['STAGE1', 'STAGE2'],
        new Date(),
        new Date(),
        10, // lower threshold
      );

      expect(dropOffPoints).toHaveLength(1);
      expect(dropOffPoints[0].dropOffRate).toBe(15);
    });
  });

  describe('analyzeCohort', () => {
    it('should analyze cohort retention across stages', async () => {
      const cohortStart = new Date('2025-01-01');
      const cohortEnd = new Date('2025-01-07');
      const stages = ['SIGNUP', 'ONBOARDING', 'FIRST_LESSON'];

      const mockUsers = [
        { userId: 'u1' },
        { userId: 'u2' },
        { userId: 'u3' },
        { userId: 'u4' },
        { userId: 'u5' },
      ];

      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(mockUsers) // Initial cohort
        .mockResolvedValueOnce([
          { userId: 'u1' },
          { userId: 'u2' },
          { userId: 'u3' },
          { userId: 'u4' },
          { userId: 'u5' },
        ]) // SIGNUP: 100%
        .mockResolvedValueOnce([
          { userId: 'u1' },
          { userId: 'u2' },
          { userId: 'u3' },
          { userId: 'u4' },
        ]) // ONBOARDING: 80%
        .mockResolvedValueOnce([
          { userId: 'u1' },
          { userId: 'u2' },
          { userId: 'u3' },
        ]); // FIRST_LESSON: 60%

      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { timestamp: new Date('2025-01-01T10:00:00Z') },
        { timestamp: new Date('2025-01-01T12:00:00Z') },
      ]);

      const result = await service.analyzeCohort(
        cohortStart,
        cohortEnd,
        stages,
      );

      expect(result.userCount).toBe(5);
      expect(result.retentionByStage['SIGNUP']).toBe(100);
      expect(result.retentionByStage['ONBOARDING']).toBe(80);
      expect(result.retentionByStage['FIRST_LESSON']).toBe(60);
      expect(result.cohortId).toContain('2025-01-01');
    });

    it('should calculate average completion time for cohort', async () => {
      mockPrisma.behaviorLog.groupBy.mockResolvedValue([
        { userId: 'u1' },
        { userId: 'u2' },
      ]);

      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }])
        .mockResolvedValueOnce([{ userId: 'u1' }])
        .mockResolvedValueOnce([{ userId: 'u2' }]);

      mockPrisma.behaviorLog.findMany
        .mockResolvedValueOnce([
          { timestamp: new Date('2025-01-01T10:00:00Z') },
          { timestamp: new Date('2025-01-01T12:00:00Z') }, // 2 hours = 7200s
        ])
        .mockResolvedValueOnce([
          { timestamp: new Date('2025-01-01T14:00:00Z') },
          { timestamp: new Date('2025-01-01T15:00:00Z') }, // 1 hour = 3600s
        ]);

      const result = await service.analyzeCohort(
        new Date('2025-01-01'),
        new Date('2025-01-07'),
        ['STAGE1'],
      );

      expect(result.avgCompletionTime).toBe(5400); // (7200 + 3600) / 2
    });

    it('should handle cohort with no users', async () => {
      mockPrisma.behaviorLog.groupBy.mockResolvedValue([]);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.analyzeCohort(new Date(), new Date(), [
        'STAGE1',
        'STAGE2',
      ]);

      expect(result.userCount).toBe(0);
      expect(result.avgCompletionTime).toBe(0);
    });

    it('should track week-over-week cohort performance', async () => {
      const week1Users = [{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }];

      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(week1Users)
        .mockResolvedValueOnce(week1Users)
        .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }]);

      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { timestamp: new Date() },
        { timestamp: new Date() },
      ]);

      const week1Cohort = await service.analyzeCohort(
        new Date('2025-01-01'),
        new Date('2025-01-07'),
        ['SIGNUP', 'FIRST_LESSON'],
      );

      expect(week1Cohort.userCount).toBe(3);
      expect(week1Cohort.retentionByStage['FIRST_LESSON']).toBe(66.67);
    });
  });

  describe('trackUserJourney', () => {
    it('should track complete user journey with all stages', async () => {
      const mockJourney = [
        {
          eventType: 'SIGNUP',
          timestamp: new Date('2025-01-01T10:00:00Z'),
        },
        {
          eventType: 'ONBOARDING',
          timestamp: new Date('2025-01-01T10:15:00Z'),
        },
        {
          eventType: 'FIRST_LESSON',
          timestamp: new Date('2025-01-01T10:30:00Z'),
        },
        {
          eventType: 'LESSON_COMPLETED',
          timestamp: new Date('2025-01-01T11:00:00Z'),
        },
      ];

      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockJourney);

      const result = await service.trackUserJourney('u1');

      expect(result.stages).toHaveLength(4);
      expect(result.stages[0]).toBe('SIGNUP');
      expect(result.stages[3]).toBe('LESSON_COMPLETED');
      expect(result.duration).toBe(3600); // 1 hour in seconds
      expect(result.completed).toBe(true);
    });

    it('should mark journey as incomplete when no completion events', async () => {
      const mockJourney = [
        {
          eventType: 'SIGNUP',
          timestamp: new Date('2025-01-01T10:00:00Z'),
        },
        {
          eventType: 'PAGE_VIEW',
          timestamp: new Date('2025-01-01T10:15:00Z'),
        },
      ];

      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockJourney);

      const result = await service.trackUserJourney('u1');

      expect(result.completed).toBe(false);
      expect(result.stages).toHaveLength(2);
    });

    it('should return empty journey for new users', async () => {
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.trackUserJourney('new-user');

      expect(result.stages).toHaveLength(0);
      expect(result.timestamps).toHaveLength(0);
      expect(result.duration).toBe(0);
      expect(result.completed).toBe(false);
    });

    it('should calculate journey duration in seconds', async () => {
      const mockJourney = [
        {
          eventType: 'LESSON_START',
          timestamp: new Date('2025-01-01T10:00:00Z'),
        },
        {
          eventType: 'QUIZ_START',
          timestamp: new Date('2025-01-01T10:45:30Z'),
        },
      ];

      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockJourney);

      const result = await service.trackUserJourney('u1');

      expect(result.duration).toBe(2730); // 45 minutes 30 seconds
    });

    it('should preserve timestamp order for journey reconstruction', async () => {
      const mockJourney = [
        {
          eventType: 'STAGE_A',
          timestamp: new Date('2025-01-01T10:00:00Z'),
        },
        {
          eventType: 'STAGE_B',
          timestamp: new Date('2025-01-01T10:05:00Z'),
        },
        {
          eventType: 'STAGE_C',
          timestamp: new Date('2025-01-01T10:10:00Z'),
        },
      ];

      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockJourney);

      const result = await service.trackUserJourney('u1');

      expect(result.stages).toEqual(['STAGE_A', 'STAGE_B', 'STAGE_C']);
      expect(result.timestamps[0] < result.timestamps[1]).toBe(true);
      expect(result.timestamps[1] < result.timestamps[2]).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle single-stage funnel', async () => {
      mockPrisma.behaviorLog.count.mockResolvedValue(500);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.getConversionFunnel(
        ['SINGLE_STAGE'],
        new Date(),
        new Date(),
      );

      expect(result.stages).toHaveLength(1);
      expect(result.stages[0].dropOffRate).toBe(0);
      expect(result.overallConversionRate).toBe(100);
    });

    it('should handle null userId in cohort analysis', async () => {
      mockPrisma.behaviorLog.groupBy.mockResolvedValue([
        { userId: 'u1' },
        { userId: null }, // Should be filtered out
        { userId: 'u2' },
      ]);

      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce([
          { userId: 'u1' },
          { userId: null },
          { userId: 'u2' },
        ])
        .mockResolvedValueOnce([{ userId: 'u1' }]);

      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.analyzeCohort(new Date(), new Date(), [
        'STAGE1',
      ]);

      expect(result.userCount).toBe(2); // null userId filtered out
    });

    it('should handle concurrent user sessions in time calculation', async () => {
      const mockLogs = [
        {
          sessionId: 's1',
          userId: 'u1',
          eventType: 'START',
          timestamp: new Date('2025-01-01T10:00:00Z'),
        },
        {
          sessionId: 's2',
          userId: 'u1',
          eventType: 'START',
          timestamp: new Date('2025-01-01T11:00:00Z'),
        },
        {
          sessionId: 's1',
          userId: 'u1',
          eventType: 'END',
          timestamp: new Date('2025-01-01T10:30:00Z'),
        },
        {
          sessionId: 's2',
          userId: 'u1',
          eventType: 'END',
          timestamp: new Date('2025-01-01T11:15:00Z'),
        },
      ];

      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(2);

      mockPrisma.behaviorLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getConversionFunnel(
        ['START', 'END'],
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result.stages[0].avgTimeToNext).toBeDefined();
    });

    it('should handle users with incomplete journeys in cohort', async () => {
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }])
        .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }]);

      mockPrisma.behaviorLog.findMany
        .mockResolvedValueOnce([
          { timestamp: new Date('2025-01-01T10:00:00Z') },
          { timestamp: new Date('2025-01-01T12:00:00Z') },
        ])
        .mockResolvedValueOnce([]); // u2 has no logs

      const result = await service.analyzeCohort(new Date(), new Date(), [
        'STAGE1',
      ]);

      expect(result.avgCompletionTime).toBeGreaterThan(0);
    });

    it('should handle zero division in conversion rate calculation', async () => {
      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.getConversionFunnel(
        ['STAGE1', 'STAGE2'],
        new Date(),
        new Date(),
      );

      expect(result.overallConversionRate).toBe(0);
      expect(Number.isNaN(result.overallConversionRate)).toBe(false);
    });
  });

  describe('Complex Funnel Scenarios', () => {
    it('should analyze multi-step onboarding funnel', async () => {
      const onboardingStages = [
        'REGISTRATION',
        'EMAIL_VERIFIED',
        'PROFILE_CREATED',
        'FIRST_DEPOSIT',
        'FIRST_LESSON_STARTED',
        'FIRST_LESSON_COMPLETED',
      ];

      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(10000)
        .mockResolvedValueOnce(8500)
        .mockResolvedValueOnce(7200)
        .mockResolvedValueOnce(5400)
        .mockResolvedValueOnce(4800)
        .mockResolvedValueOnce(4320);

      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.getConversionFunnel(
        onboardingStages,
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result.stages).toHaveLength(6);
      expect(result.overallConversionRate).toBe(43.2);
      expect(result.totalUsers).toBe(10000);
    });

    it('should identify multiple drop-off points in complex funnel', async () => {
      mockPrisma.behaviorLog.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(950)
        .mockResolvedValueOnce(500) // Major drop
        .mockResolvedValueOnce(490)
        .mockResolvedValueOnce(200); // Another major drop

      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const dropOffs = await service.detectDropOffPoints(
        ['S1', 'S2', 'S3', 'S4', 'S5'],
        new Date(),
        new Date(),
        25,
      );

      expect(dropOffs.length).toBeGreaterThanOrEqual(2);
      expect(dropOffs.some((d) => d.stage === 'S3')).toBe(true);
      expect(dropOffs.some((d) => d.stage === 'S5')).toBe(true);
    });

    it('should compare cohort performance across different time periods', async () => {
      const stages = ['SIGNUP', 'ACTIVE_USER'];

      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }])
        .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }])
        .mockResolvedValueOnce([{ userId: 'u1' }]);

      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { timestamp: new Date() },
      ]);

      const cohort1 = await service.analyzeCohort(
        new Date('2025-01-01'),
        new Date('2025-01-07'),
        stages,
      );

      expect(cohort1.retentionByStage['ACTIVE_USER']).toBe(50);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large dataset efficiently', async () => {
      const largeUserSet = Array.from({ length: 1000 }, (_, i) => ({
        userId: `u${i}`,
      }));

      mockPrisma.behaviorLog.groupBy.mockResolvedValue(largeUserSet);
      mockPrisma.behaviorLog.groupBy
        .mockResolvedValueOnce(largeUserSet)
        .mockResolvedValueOnce(largeUserSet.slice(0, 500));

      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.analyzeCohort(new Date(), new Date(), [
        'STAGE1',
      ]);

      expect(result.userCount).toBe(1000);
    });

    it('should batch process funnel stages', async () => {
      const manyStages = Array.from({ length: 10 }, (_, i) => `STAGE_${i}`);

      mockPrisma.behaviorLog.count.mockResolvedValue(100);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const result = await service.getConversionFunnel(
        manyStages,
        new Date(),
        new Date(),
      );

      expect(result.stages).toHaveLength(10);
      expect(mockPrisma.behaviorLog.count).toHaveBeenCalledTimes(10);
    });
  });
});
