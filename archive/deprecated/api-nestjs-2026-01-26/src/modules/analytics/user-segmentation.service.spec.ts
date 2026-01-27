import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  UserSegmentationService,
  type SegmentCriteria,
  type UserDemographics,
} from './user-segmentation.service';

describe('UserSegmentationService', () => {
  let service: UserSegmentationService;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      userProgress: {
        groupBy: vi.fn(),
      },
      behaviorLog: {
        findMany: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        createMany: vi.fn(),
      },
    };
    service = new UserSegmentationService(mockPrisma);
  });

  describe('Segment Definition', () => {
    it('should define a new segment with criteria', () => {
      const criteria: SegmentCriteria = {
        ageRange: { min: 18, max: 25 },
        engagementLevel: 'HIGH',
      };

      const segment = service.defineSegment(
        'youth-high',
        'Youth High Engagement',
        criteria,
      );

      expect(segment.id).toBe('youth-high');
      expect(segment.name).toBe('Youth High Engagement');
      expect(segment.criteria).toEqual(criteria);
      expect(segment.users).toEqual([]);
      expect(segment.updatedAt).toBeInstanceOf(Date);
    });

    it('should define segment with behavior type criteria', () => {
      const criteria: SegmentCriteria = {
        behaviorType: 'SAVER',
        pointsRange: { min: 100, max: 500 },
      };

      const segment = service.defineSegment(
        'saver-segment',
        'Savers',
        criteria,
      );

      expect(segment.criteria.behaviorType).toBe('SAVER');
      expect(segment.criteria.pointsRange).toEqual({ min: 100, max: 500 });
    });

    it('should define segment with locale criteria', () => {
      const criteria: SegmentCriteria = {
        locale: ['vi', 'en'],
        completedLessonsMin: 5,
      };

      const segment = service.defineSegment(
        'vn-en-learners',
        'Vietnamese/English Learners',
        criteria,
      );

      expect(segment.criteria.locale).toEqual(['vi', 'en']);
      expect(segment.criteria.completedLessonsMin).toBe(5);
    });
  });

  describe('Dynamic Segment Updates', () => {
    it('should update segment with matching users', async () => {
      const criteria: SegmentCriteria = {
        pointsRange: { min: 50, max: 200 },
      };

      service.defineSegment('mid-points', 'Mid Points Users', criteria);

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1', points: 100 },
        { id: 'u2', points: 150 },
      ]);

      const updated = await service.updateSegment('mid-points');

      expect(updated).not.toBeNull();
      expect(updated?.users).toEqual(['u1', 'u2']);
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null when updating non-existent segment', async () => {
      const result = await service.updateSegment('non-existent');
      expect(result).toBeNull();
    });

    it('should filter users by age range', async () => {
      const criteria: SegmentCriteria = {
        ageRange: { min: 20, max: 30 },
      };

      service.defineSegment('age-segment', 'Age 20-30', criteria);

      const birthDate1 = new Date();
      birthDate1.setFullYear(birthDate1.getFullYear() - 25);

      const birthDate2 = new Date();
      birthDate2.setFullYear(birthDate2.getFullYear() - 35);

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1', dateOfBirth: birthDate1 },
        { id: 'u2', dateOfBirth: birthDate2 },
      ]);

      const updated = await service.updateSegment('age-segment');

      expect(updated?.users).toEqual(['u1']);
    });

    it('should filter users by completed lessons minimum', async () => {
      const criteria: SegmentCriteria = {
        completedLessonsMin: 5,
      };

      service.defineSegment('active-learners', 'Active Learners', criteria);

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1' },
        { id: 'u2' },
        { id: 'u3' },
      ]);

      mockPrisma.userProgress.groupBy.mockResolvedValue([
        { userId: 'u1', _count: { id: 10 } },
        { userId: 'u2', _count: { id: 3 } },
        { userId: 'u3', _count: { id: 7 } },
      ]);

      const updated = await service.updateSegment('active-learners');

      expect(updated?.users).toContain('u1');
      expect(updated?.users).toContain('u3');
      expect(updated?.users).not.toContain('u2');
    });

    it('should filter by LOW engagement level', async () => {
      const criteria: SegmentCriteria = {
        engagementLevel: 'LOW',
      };

      service.defineSegment('low-engage', 'Low Engagement', criteria);

      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

      mockPrisma.behaviorLog.groupBy.mockResolvedValue([
        { userId: 'u1', _count: { id: 5 } },
        { userId: 'u2', _count: { id: 15 } },
      ]);

      const updated = await service.updateSegment('low-engage');

      expect(updated?.users).toEqual(['u1']);
    });

    it('should filter by MEDIUM engagement level', async () => {
      const criteria: SegmentCriteria = {
        engagementLevel: 'MEDIUM',
      };

      service.defineSegment('med-engage', 'Medium Engagement', criteria);

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1' },
        { id: 'u2' },
        { id: 'u3' },
      ]);

      mockPrisma.behaviorLog.groupBy.mockResolvedValue([
        { userId: 'u1', _count: { id: 30 } },
        { userId: 'u2', _count: { id: 5 } },
        { userId: 'u3', _count: { id: 60 } },
      ]);

      const updated = await service.updateSegment('med-engage');

      expect(updated?.users).toEqual(['u1']);
    });

    it('should filter by HIGH engagement level', async () => {
      const criteria: SegmentCriteria = {
        engagementLevel: 'HIGH',
      };

      service.defineSegment('high-engage', 'High Engagement', criteria);

      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

      mockPrisma.behaviorLog.groupBy.mockResolvedValue([
        { userId: 'u1', _count: { id: 100 } },
        { userId: 'u2', _count: { id: 20 } },
      ]);

      const updated = await service.updateSegment('high-engage');

      expect(updated?.users).toEqual(['u1']);
    });

    it('should filter by HUNTER behavior type', async () => {
      const criteria: SegmentCriteria = {
        behaviorType: 'HUNTER',
      };

      service.defineSegment('hunters', 'Risk Takers', criteria);

      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

      mockPrisma.behaviorLog.findMany
        .mockResolvedValueOnce(Array(10).fill({ eventType: 'TRADE_BUY' }))
        .mockResolvedValueOnce(
          Array(10).fill({ eventType: 'COMMITMENT_CREATED' }),
        );

      const updated = await service.updateSegment('hunters');

      expect(updated?.users).toEqual(['u1']);
    });

    it('should filter by SAVER behavior type', async () => {
      const criteria: SegmentCriteria = {
        behaviorType: 'SAVER',
      };

      service.defineSegment('savers', 'Savers', criteria);

      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

      mockPrisma.behaviorLog.findMany
        .mockResolvedValueOnce(
          Array(10).fill({ eventType: 'COMMITMENT_CREATED' }),
        )
        .mockResolvedValueOnce(Array(10).fill({ eventType: 'TRADE_BUY' }));

      const updated = await service.updateSegment('savers');

      expect(updated?.users).toEqual(['u1']);
    });

    it('should filter by OBSERVER behavior type', async () => {
      const criteria: SegmentCriteria = {
        behaviorType: 'OBSERVER',
      };

      service.defineSegment('observers', 'Observers', criteria);

      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

      mockPrisma.behaviorLog.findMany
        .mockResolvedValueOnce(Array(3).fill({ eventType: 'LESSON_VIEW' }))
        .mockResolvedValueOnce(Array(10).fill({ eventType: 'TRADE_BUY' }));

      const updated = await service.updateSegment('observers');

      expect(updated?.users).toEqual(['u1']);
    });

    it('should filter by locale criteria', async () => {
      const criteria: SegmentCriteria = {
        locale: ['vi', 'zh'],
      };

      service.defineSegment('asian-users', 'Asian Users', criteria);

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u1', preferredLanguage: 'vi' },
        { id: 'u2', preferredLanguage: 'zh' },
      ]);

      const updated = await service.updateSegment('asian-users');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            preferredLanguage: { in: ['vi', 'zh'] },
          }),
        }),
      );
    });
  });

  describe('Segment Targeting', () => {
    it('should target segment with message', async () => {
      service.defineSegment('test-seg', 'Test', {});
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

      await service.updateSegment('test-seg');

      mockPrisma.behaviorLog.createMany.mockResolvedValue({ count: 2 });

      const result = await service.targetSegment(
        'test-seg',
        'Special offer for you!',
      );

      expect(result).toBe(true);
      expect(mockPrisma.behaviorLog.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'u1',
            eventType: 'SEGMENT_TARGETED',
            payload: expect.objectContaining({
              message: 'Special offer for you!',
            }),
          }),
          expect.objectContaining({
            userId: 'u2',
            eventType: 'SEGMENT_TARGETED',
          }),
        ]),
      });
    });

    it('should return false when targeting non-existent segment', async () => {
      const result = await service.targetSegment('non-existent', 'message');
      expect(result).toBe(false);
    });

    it('should return false when targeting empty segment', async () => {
      service.defineSegment('empty-seg', 'Empty', {});
      const result = await service.targetSegment('empty-seg', 'message');
      expect(result).toBe(false);
    });
  });

  describe('User Demographics', () => {
    it('should return user demographics with all fields', async () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 22);

      mockPrisma.user.findUnique.mockResolvedValue({
        dateOfBirth: birthDate,
        preferredLanguage: 'en',
        createdAt: new Date('2024-01-15'),
      });

      mockPrisma.behaviorLog.findMany.mockResolvedValue(
        Array(10).fill({ eventType: 'TRADE_BUY' }),
      );

      mockPrisma.behaviorLog.count.mockResolvedValue(25);

      const demographics = await service.getUserDemographics('u1');

      expect(demographics).not.toBeNull();
      expect(demographics?.age).toBe(22);
      expect(demographics?.locale).toBe('en');
      expect(demographics?.engagementScore).toBe(25);
      expect(demographics?.behaviorType).toBe('HUNTER');
      expect(demographics?.registeredAt).toBeInstanceOf(Date);
    });

    it('should classify user as SAVER based on behavior', async () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      mockPrisma.user.findUnique.mockResolvedValue({
        dateOfBirth: birthDate,
        preferredLanguage: 'vi',
        createdAt: new Date(),
      });

      mockPrisma.behaviorLog.findMany.mockResolvedValue(
        Array(10).fill({ eventType: 'COMMITMENT_CREATED' }),
      );

      mockPrisma.behaviorLog.count.mockResolvedValue(15);

      const demographics = await service.getUserDemographics('u1');

      expect(demographics?.behaviorType).toBe('SAVER');
    });

    it('should classify user as OBSERVER when no strong behavior', async () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);

      mockPrisma.user.findUnique.mockResolvedValue({
        dateOfBirth: birthDate,
        preferredLanguage: 'zh',
        createdAt: new Date(),
      });

      mockPrisma.behaviorLog.findMany.mockResolvedValue(
        Array(3).fill({ eventType: 'LESSON_VIEW' }),
      );

      mockPrisma.behaviorLog.count.mockResolvedValue(5);

      const demographics = await service.getUserDemographics('u1');

      expect(demographics?.behaviorType).toBe('OBSERVER');
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const demographics = await service.getUserDemographics('non-existent');

      expect(demographics).toBeNull();
    });

    it('should return null when user has no date of birth', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        dateOfBirth: null,
        preferredLanguage: 'vi',
        createdAt: new Date(),
      });

      const demographics = await service.getUserDemographics('u1');

      expect(demographics).toBeNull();
    });

    it('should default to "vi" locale when user has no preferred language', async () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 20);

      mockPrisma.user.findUnique.mockResolvedValue({
        dateOfBirth: birthDate,
        preferredLanguage: null,
        createdAt: new Date(),
      });

      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.behaviorLog.count.mockResolvedValue(0);

      const demographics = await service.getUserDemographics('u1');

      expect(demographics?.locale).toBe('vi');
    });
  });

  describe('Segment Retrieval & Management', () => {
    it('should retrieve segment by ID', () => {
      const criteria: SegmentCriteria = { ageRange: { min: 18, max: 30 } };
      service.defineSegment('seg1', 'Segment 1', criteria);

      const segment = service.getSegmentById('seg1');

      expect(segment).not.toBeNull();
      expect(segment?.name).toBe('Segment 1');
    });

    it('should return null for non-existent segment', () => {
      const segment = service.getSegmentById('non-existent');
      expect(segment).toBeNull();
    });

    it('should get all segments', () => {
      service.defineSegment('seg1', 'Segment 1', {});
      service.defineSegment('seg2', 'Segment 2', {});
      service.defineSegment('seg3', 'Segment 3', {});

      const allSegments = service.getAllSegments();

      expect(allSegments).toHaveLength(3);
      expect(allSegments.map((s) => s.id)).toContain('seg1');
      expect(allSegments.map((s) => s.id)).toContain('seg2');
      expect(allSegments.map((s) => s.id)).toContain('seg3');
    });

    it('should delete segment successfully', () => {
      service.defineSegment('to-delete', 'To Delete', {});

      const deleted = service.deleteSegment('to-delete');

      expect(deleted).toBe(true);
      expect(service.getSegmentById('to-delete')).toBeNull();
    });

    it('should return false when deleting non-existent segment', () => {
      const deleted = service.deleteSegment('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('Complex Multi-Criteria Filtering', () => {
    it('should apply multiple criteria filters together', async () => {
      const criteria: SegmentCriteria = {
        ageRange: { min: 18, max: 30 },
        pointsRange: { min: 100, max: 500 },
        locale: ['vi'],
        completedLessonsMin: 3,
      };

      service.defineSegment('complex-seg', 'Complex Segment', criteria);

      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);

      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'u1',
          dateOfBirth: birthDate,
          preferredLanguage: 'vi',
          points: 250,
        },
      ]);

      mockPrisma.userProgress.groupBy.mockResolvedValue([
        { userId: 'u1', _count: { id: 5 } },
      ]);

      const updated = await service.updateSegment('complex-seg');

      expect(updated?.users).toEqual(['u1']);
    });

    it('should handle empty result when no users match all criteria', async () => {
      const criteria: SegmentCriteria = {
        ageRange: { min: 60, max: 70 },
        behaviorType: 'HUNTER',
        engagementLevel: 'HIGH',
      };

      service.defineSegment('strict-seg', 'Strict Segment', criteria);

      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.behaviorLog.groupBy.mockResolvedValue([]);
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

      const updated = await service.updateSegment('strict-seg');

      expect(updated?.users).toEqual([]);
    });
  });

  describe('Age Calculation Edge Cases', () => {
    it('should calculate age correctly for birthday today', async () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);

      mockPrisma.user.findUnique.mockResolvedValue({
        dateOfBirth: birthDate,
        preferredLanguage: 'en',
        createdAt: new Date(),
      });

      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.behaviorLog.count.mockResolvedValue(0);

      const demographics = await service.getUserDemographics('u1');

      expect(demographics?.age).toBe(25);
    });

    it('should calculate age correctly for birthday tomorrow', async () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      birthDate.setDate(birthDate.getDate() + 1);

      mockPrisma.user.findUnique.mockResolvedValue({
        dateOfBirth: birthDate,
        preferredLanguage: 'en',
        createdAt: new Date(),
      });

      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.behaviorLog.count.mockResolvedValue(0);

      const demographics = await service.getUserDemographics('u1');

      expect(demographics?.age).toBe(24);
    });
  });
});
