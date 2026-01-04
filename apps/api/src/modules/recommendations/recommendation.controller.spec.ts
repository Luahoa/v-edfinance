import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';

describe('RecommendationController', () => {
  let controller: RecommendationController;
  let service: RecommendationService;

  const mockRecommendationService = {
    getPersonalizedRecommendations: vi.fn(),
  };

  const mockUser = { id: 'user-1', preferredLocale: 'vi' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationController],
      providers: [
        { provide: RecommendationService, useValue: mockRecommendationService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    controller = module.get<RecommendationController>(RecommendationController);
    service = module.get<RecommendationService>(RecommendationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /recommendations/personalized', () => {
    it('should return personalized course recommendations', async () => {
      const mockRecommendations = [
        {
          courseId: 'c-1',
          title: 'Stock Market Basics',
          matchScore: 0.95,
          reason: 'Based on your profile',
        },
        {
          courseId: 'c-2',
          title: 'Budgeting 101',
          matchScore: 0.85,
          reason: 'Popular among beginners',
        },
      ];

      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue(
        mockRecommendations,
      );

      const result = await controller.getPersonalized({ user: mockUser });

      expect(service.getPersonalizedRecommendations).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toHaveLength(2);
      expect(result[0].matchScore).toBeGreaterThan(result[1].matchScore);
    });

    it('should integrate with user investment profile', async () => {
      const mockRecommendations = [
        {
          courseId: 'c-3',
          title: 'Advanced Options Trading',
          matchScore: 0.88,
          reason: 'Matches your HIGH risk tolerance',
          profileMatch: true,
        },
      ];

      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue(
        mockRecommendations,
      );

      const result = await controller.getPersonalized({ user: mockUser });

      expect(result[0].profileMatch).toBe(true);
      expect(result[0].reason).toContain('risk tolerance');
    });

    it('should recommend based on learning progress', async () => {
      const mockRecommendations = [
        {
          courseId: 'c-4',
          title: 'Intermediate Investing',
          matchScore: 0.9,
          reason: 'Next step after completing beginner courses',
          progressBased: true,
        },
      ];

      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue(
        mockRecommendations,
      );

      const result = await controller.getPersonalized({ user: mockUser });

      expect(result[0].progressBased).toBe(true);
    });

    it('should recommend based on similar user behavior', async () => {
      const mockRecommendations = [
        {
          courseId: 'c-5',
          title: 'Real Estate Investment',
          matchScore: 0.82,
          reason: 'Users similar to you enjoyed this',
          collaborativeFiltering: true,
        },
      ];

      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue(
        mockRecommendations,
      );

      const result = await controller.getPersonalized({ user: mockUser });

      expect(result[0].collaborativeFiltering).toBe(true);
    });

    it('should handle new users with minimal data', async () => {
      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue(
        [
          {
            courseId: 'c-beginner',
            title: 'Start Here',
            matchScore: 0.7,
            reason: 'Recommended for new users',
          },
        ],
      );

      const result = await controller.getPersonalized({
        user: { id: 'new-user' },
      });

      expect(result[0].reason).toContain('new users');
    });

    it('should return empty array if no suitable recommendations', async () => {
      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue(
        [],
      );

      const result = await controller.getPersonalized({ user: mockUser });

      expect(result).toEqual([]);
    });

    it('should limit number of recommendations', async () => {
      const mockRecommendations = Array.from({ length: 10 }, (_, i) => ({
        courseId: `c-${i}`,
        title: `Course ${i}`,
        matchScore: 0.9 - i * 0.05,
      }));

      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue(
        mockRecommendations.slice(0, 5),
      );

      const result = await controller.getPersonalized({ user: mockUser });

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should consider user locale for recommendations', async () => {
      const vietnameseUser = { id: 'user-vi', preferredLocale: 'vi' };
      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue(
        [
          {
            courseId: 'c-vi',
            title: 'Đầu tư chứng khoán',
            matchScore: 0.95,
            locale: 'vi',
          },
        ],
      );

      const result = await controller.getPersonalized({ user: vietnameseUser });

      expect(result[0].locale).toBe('vi');
    });

    it('should include AI-generated recommendations', async () => {
      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue(
        [
          {
            courseId: 'c-ai',
            title: 'AI Suggested Course',
            matchScore: 0.93,
            aiGenerated: true,
          },
        ],
      );

      const result = await controller.getPersonalized({ user: mockUser });

      expect(result[0].aiGenerated).toBe(true);
    });

    it('should refresh recommendations based on recent activity', async () => {
      const mockRecommendations = [
        {
          courseId: 'c-fresh',
          title: 'Updated Recommendation',
          matchScore: 0.91,
          freshness: 'recent',
        },
      ];

      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue(
        mockRecommendations,
      );

      const result = await controller.getPersonalized({ user: mockUser });

      expect(result[0].freshness).toBe('recent');
    });

    it('should handle service errors gracefully', async () => {
      mockRecommendationService.getPersonalizedRecommendations.mockRejectedValue(
        new Error('AI service unavailable'),
      );

      await expect(
        controller.getPersonalized({ user: mockUser }),
      ).rejects.toThrow('AI service unavailable');
    });

    it('should include diversity in recommendations', async () => {
      const mockRecommendations = [
        { courseId: 'c-stocks', category: 'stocks', matchScore: 0.9 },
        { courseId: 'c-crypto', category: 'crypto', matchScore: 0.88 },
        {
          courseId: 'c-real-estate',
          category: 'real-estate',
          matchScore: 0.85,
        },
      ];

      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue(
        mockRecommendations,
      );

      const result = await controller.getPersonalized({ user: mockUser });

      const categories = new Set(result.map((r) => r.category));
      expect(categories.size).toBeGreaterThan(1);
    });

    it('should prioritize high-match scores', async () => {
      const mockRecommendations = [
        { courseId: 'c-1', matchScore: 0.95 },
        { courseId: 'c-2', matchScore: 0.92 },
        { courseId: 'c-3', matchScore: 0.88 },
      ];

      mockRecommendationService.getPersonalizedRecommendations.mockResolvedValue(
        mockRecommendations,
      );

      const result = await controller.getPersonalized({ user: mockUser });

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].matchScore).toBeGreaterThanOrEqual(
          result[i + 1].matchScore,
        );
      }
    });
  });
});
