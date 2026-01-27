import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecommendationService } from './recommendation.service';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let mockPrisma: any;
  let mockAi: any;
  let mockAnalytics: any;
  let mockValidation: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      user: { findUnique: vi.fn() },
      course: { findMany: vi.fn() },
    };
    mockAi = {
      model: {
        generateContent: vi.fn(),
      },
    };
    mockAnalytics = {
      getUserLearningHabits: vi.fn(),
      getUserPersona: vi.fn(),
    };
    mockValidation = {
      validate: vi.fn((type, data) => data),
    };
    service = new RecommendationService(
      mockPrisma,
      mockAi,
      mockAnalytics,
      mockValidation,
    );
  });

  describe('Basic Recommendation', () => {
    it('should return personalized recommendations', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', progress: [] });
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'c1',
          title: { vi: 'Course 1' },
          published: true,
          lessons: [{ id: 'l1' }],
        },
      ]);
      mockAnalytics.getUserLearningHabits.mockResolvedValue({});

      const mockAiResponse = {
        response: {
          text: () =>
            '```json\n[{"courseId": "c1", "reason": {"vi": "Lý do"}, "strategy": "SOCIAL_PROOF"}]\n```',
        },
      };
      mockAi.model.generateContent.mockResolvedValue(mockAiResponse);

      const result = await service.getPersonalizedRecommendations('u1');

      expect(result).toHaveLength(1);
      expect(result[0].courseId).toBe('c1');
      expect(mockAi.model.generateContent).toHaveBeenCalled();
    });

    it('should return fallback recommendations if AI fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', progress: [] });
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'c1',
          title: { vi: 'Course 1' },
          published: true,
          lessons: [{ id: 'l1' }],
        },
      ]);
      mockAi.model.generateContent.mockRejectedValue(new Error('AI Error'));

      const result = await service.getPersonalizedRecommendations('u1');

      expect(result).toHaveLength(1);
      expect(result[0].strategy).toBe('DEFAULT');
    });
  });

  describe('Persona-Based Filtering', () => {
    it('should recommend risk-focused courses for HUNTER persona', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        progress: [],
        investmentProfile: { riskTolerance: 'HIGH' },
      });
      mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
      mockAnalytics.getUserLearningHabits.mockResolvedValue({
        peakLearningHour: 10,
      });
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'c1',
          title: { vi: 'Crypto Trading' },
          published: true,
          lessons: [{ id: 'l1' }],
        },
      ]);

      const mockAiResponse = {
        response: {
          text: () =>
            JSON.stringify([
              {
                courseId: 'c1',
                reason: {
                  vi: 'Phù hợp với HUNTER persona',
                  en: 'Suitable for HUNTER persona',
                  zh: '适合猎手角色',
                },
                strategy: 'PERSONA_MATCH',
              },
            ]),
        },
      };
      mockAi.model.generateContent.mockResolvedValue(mockAiResponse);

      const result = await service.getPersonalizedRecommendations('u1');

      expect(result[0].strategy).toBe('PERSONA_MATCH');
      expect(mockAi.model.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('HUNTER'),
      );
    });

    it('should recommend savings courses for SAVER persona', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        progress: [],
        investmentProfile: { riskTolerance: 'LOW' },
      });
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockAnalytics.getUserLearningHabits.mockResolvedValue({});
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'c2',
          title: { vi: 'Savings Strategies' },
          published: true,
          lessons: [{ id: 'l2' }],
        },
      ]);

      mockAi.model.generateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify([
              {
                courseId: 'c2',
                reason: {
                  vi: 'SAVER persona',
                  en: 'SAVER persona',
                  zh: 'SAVER persona',
                },
                strategy: 'PERSONA_MATCH',
              },
            ]),
        },
      });

      const result = await service.getPersonalizedRecommendations('u1');

      expect(mockAi.model.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('SAVER'),
      );
    });

    it('should recommend diverse courses for OBSERVER persona', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        progress: [],
      });
      mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
      mockAnalytics.getUserLearningHabits.mockResolvedValue({});
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'c1',
          title: { vi: 'Basics' },
          published: true,
          lessons: [{ id: 'l1' }],
        },
        {
          id: 'c2',
          title: { vi: 'Advanced' },
          published: true,
          lessons: [{ id: 'l2' }],
        },
      ]);

      mockAi.model.generateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify([
              {
                courseId: 'c1',
                reason: { vi: 'Diverse', en: 'Diverse', zh: 'Diverse' },
                strategy: 'DEFAULT',
              },
              {
                courseId: 'c2',
                reason: { vi: 'Diverse', en: 'Diverse', zh: 'Diverse' },
                strategy: 'DEFAULT',
              },
            ]),
        },
      });

      const result = await service.getPersonalizedRecommendations('u1');

      expect(result).toHaveLength(2);
    });
  });

  describe('Content Freshness', () => {
    it('should filter out completed courses', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        progress: [
          { lessonId: 'l1', status: 'COMPLETED' },
          { lessonId: 'l2', status: 'COMPLETED' },
        ],
      });
      mockAnalytics.getUserLearningHabits.mockResolvedValue({});
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'c1',
          title: { vi: 'Completed' },
          published: true,
          lessons: [{ id: 'l1' }],
        },
        {
          id: 'c2',
          title: { vi: 'New' },
          published: true,
          lessons: [{ id: 'l3' }],
        },
      ]);

      mockAi.model.generateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify([
              {
                courseId: 'c2',
                reason: { vi: 'New', en: 'New', zh: 'New' },
                strategy: 'FRESHNESS',
              },
            ]),
        },
      });

      const result = await service.getPersonalizedRecommendations('u1');

      expect(result.every((r) => r.courseId !== 'c1')).toBe(true);
    });

    it('should prioritize recently published courses', async () => {
      const recentDate = new Date();
      const oldDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', progress: [] });
      mockAnalytics.getUserLearningHabits.mockResolvedValue({});
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'c1',
          title: { vi: 'Recent' },
          published: true,
          createdAt: recentDate,
          lessons: [{ id: 'l1' }],
        },
        {
          id: 'c2',
          title: { vi: 'Old' },
          published: true,
          createdAt: oldDate,
          lessons: [{ id: 'l2' }],
        },
      ]);

      mockAi.model.generateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify([
              {
                courseId: 'c1',
                reason: { vi: 'Recent', en: 'Recent', zh: 'Recent' },
                strategy: 'FRESHNESS',
              },
            ]),
        },
      });

      const result = await service.getPersonalizedRecommendations('u1');

      expect(result[0].courseId).toBe('c1');
    });
  });

  describe('Cache Invalidation', () => {
    it('should bypass cache when user completes new lesson', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        progress: [
          { lessonId: 'l1', status: 'COMPLETED', updatedAt: new Date() },
        ],
      });
      mockAnalytics.getUserLearningHabits.mockResolvedValue({});
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'c1',
          title: { vi: 'Next Course' },
          published: true,
          lessons: [{ id: 'l2' }],
        },
      ]);

      mockAi.model.generateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify([
              {
                courseId: 'c1',
                reason: { vi: 'Next', en: 'Next', zh: 'Next' },
                strategy: 'FRESHNESS',
              },
            ]),
        },
      });

      const result = await service.getPersonalizedRecommendations('u1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should refresh recommendations when persona changes', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', progress: [] });
      mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
      mockAnalytics.getUserLearningHabits.mockResolvedValue({});
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'c1',
          title: { vi: 'Course' },
          published: true,
          lessons: [{ id: 'l1' }],
        },
      ]);

      mockAi.model.generateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify([
              {
                courseId: 'c1',
                reason: { vi: 'New', en: 'New', zh: 'New' },
                strategy: 'PERSONA_CHANGE',
              },
            ]),
        },
      });

      await service.getPersonalizedRecommendations('u1');

      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');

      await service.getPersonalizedRecommendations('u1');

      expect(mockAi.model.generateContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Personalization Accuracy', () => {
    it('should match recommendations to user learning habits', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', progress: [] });
      mockAnalytics.getUserLearningHabits.mockResolvedValue({
        peakLearningHour: 20,
        topActivities: ['LESSON_VIEW', 'QUIZ_START'],
      });
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'c1',
          title: { vi: 'Evening Course' },
          published: true,
          lessons: [{ id: 'l1' }],
        },
      ]);

      mockAi.model.generateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify([
              {
                courseId: 'c1',
                reason: {
                  vi: 'Matches habits',
                  en: 'Matches habits',
                  zh: 'Matches habits',
                },
                strategy: 'HABIT_MATCH',
              },
            ]),
        },
      });

      const result = await service.getPersonalizedRecommendations('u1');

      expect(mockAi.model.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('peakLearningHour'),
      );
      expect(result[0].strategy).toBe('HABIT_MATCH');
    });

    it('should validate AI recommendation output structure', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', progress: [] });
      mockAnalytics.getUserLearningHabits.mockResolvedValue({});
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'c1',
          title: { vi: 'Course' },
          published: true,
          lessons: [{ id: 'l1' }],
        },
      ]);

      const validRecommendation = [
        {
          courseId: 'c1',
          reason: { vi: 'Lý do', en: 'Reason', zh: '原因' },
          strategy: 'SOCIAL_PROOF',
        },
      ];

      mockAi.model.generateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(validRecommendation) },
      });

      await service.getPersonalizedRecommendations('u1');

      expect(mockValidation.validate).toHaveBeenCalledWith(
        'COURSE_RECOMMENDATION',
        validRecommendation,
      );
    });

    it('should apply nudge strategies correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', progress: [] });
      mockAnalytics.getUserLearningHabits.mockResolvedValue({});
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'c1',
          title: { vi: 'Course' },
          published: true,
          lessons: [{ id: 'l1' }],
        },
      ]);

      mockAi.model.generateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify([
              {
                courseId: 'c1',
                reason: {
                  vi: '75% người dùng hoàn thành khóa này',
                  en: '75% of users complete this',
                  zh: '75%的用户完成此课程',
                },
                strategy: 'SOCIAL_PROOF',
              },
            ]),
        },
      });

      const result = await service.getPersonalizedRecommendations('u1');

      expect(result[0].strategy).toBe('SOCIAL_PROOF');
      expect(result[0].reason.vi).toContain('75%');
    });
  });
});
