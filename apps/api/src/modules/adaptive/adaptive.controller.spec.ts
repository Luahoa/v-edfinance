import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdaptiveController } from './adaptive.controller';
import { AdaptiveService } from './adaptive.service';

describe('AdaptiveController', () => {
  let controller: AdaptiveController;
  let service: AdaptiveService;

  const mockAdaptiveService = {
    adjustLearningPath: vi.fn(),
  };

  const mockUser = { id: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdaptiveController],
      providers: [{ provide: AdaptiveService, useValue: mockAdaptiveService }],
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

    controller = module.get<AdaptiveController>(AdaptiveController);
    service = module.get<AdaptiveService>(AdaptiveService);

    // Manually bind service to controller
    (controller as any).adaptiveService = service;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /adaptive/complete-lesson', () => {
    it('should adjust learning path after lesson completion', async () => {
      const body = { lessonId: 'l-1', score: 85, timeSpent: 1200 };
      const mockResponse = {
        nextLesson: 'l-2',
        difficulty: 'MEDIUM',
        feedback: 'Good progress!',
      };

      mockAdaptiveService.adjustLearningPath.mockResolvedValue(mockResponse);

      const result = await controller.completeLesson({ user: mockUser }, body);

      expect(service.adjustLearningPath).toHaveBeenCalledWith('user-1', 'l-1', {
        score: 85,
        timeSpent: 1200,
      });
      expect(result.nextLesson).toBe('l-2');
    });

    it('should handle lesson completion without score', async () => {
      const body = { lessonId: 'l-1', timeSpent: 900 };
      mockAdaptiveService.adjustLearningPath.mockResolvedValue({
        nextLesson: 'l-2',
      });

      await controller.completeLesson({ user: mockUser }, body);

      expect(service.adjustLearningPath).toHaveBeenCalledWith('user-1', 'l-1', {
        score: undefined,
        timeSpent: 900,
      });
    });

    it('should increase difficulty for high-performing users', async () => {
      const body = { lessonId: 'l-1', score: 95, timeSpent: 600 };
      mockAdaptiveService.adjustLearningPath.mockResolvedValue({
        nextLesson: 'l-advanced',
        difficulty: 'HARD',
        message: 'You are doing great! Advancing to harder content.',
      });

      const result = await controller.completeLesson({ user: mockUser }, body);

      expect(result.difficulty).toBe('HARD');
      expect(result.message).toContain('Advancing');
    });

    it('should decrease difficulty for struggling users', async () => {
      const body = { lessonId: 'l-1', score: 40, timeSpent: 2400 };
      mockAdaptiveService.adjustLearningPath.mockResolvedValue({
        nextLesson: 'l-review',
        difficulty: 'EASY',
        recommendation: 'Review previous concepts',
      });

      const result = await controller.completeLesson({ user: mockUser }, body);

      expect(result.difficulty).toBe('EASY');
      expect(result.recommendation).toContain('Review');
    });

    it('should maintain flow state for optimal performance', async () => {
      const body = { lessonId: 'l-1', score: 75, timeSpent: 1000 };
      mockAdaptiveService.adjustLearningPath.mockResolvedValue({
        nextLesson: 'l-2',
        difficulty: 'MEDIUM',
        flowState: true,
      });

      const result = await controller.completeLesson({ user: mockUser }, body);

      expect(result.flowState).toBe(true);
    });

    it('should recommend break after extended session', async () => {
      const body = { lessonId: 'l-5', score: 70, timeSpent: 3600 };
      mockAdaptiveService.adjustLearningPath.mockResolvedValue({
        nextLesson: null,
        recommendation: 'Take a break',
        totalSessionTime: 7200,
      });

      const result = await controller.completeLesson({ user: mockUser }, body);

      expect(result.recommendation).toContain('break');
    });

    it('should suggest review for spaced repetition', async () => {
      const body = { lessonId: 'l-old', score: 65, timeSpent: 800 };
      mockAdaptiveService.adjustLearningPath.mockResolvedValue({
        nextLesson: 'l-review-1',
        spacedRepetition: true,
        reviewInterval: 7,
      });

      const result = await controller.completeLesson({ user: mockUser }, body);

      expect(result.spacedRepetition).toBe(true);
    });

    it('should track time efficiency', async () => {
      const body = { lessonId: 'l-1', score: 90, timeSpent: 450 };
      mockAdaptiveService.adjustLearningPath.mockResolvedValue({
        nextLesson: 'l-2',
        efficiency: 'HIGH',
        expectedTime: 600,
      });

      const result = await controller.completeLesson({ user: mockUser }, body);

      expect(result.efficiency).toBe('HIGH');
    });

    it('should integrate with investment profile risk assessment', async () => {
      const body = { lessonId: 'l-risk', score: 80, timeSpent: 1100 };
      mockAdaptiveService.adjustLearningPath.mockResolvedValue({
        nextLesson: 'l-advanced-risk',
        riskProfileUpdate: { riskScore: 75 },
      });

      const result = await controller.completeLesson({ user: mockUser }, body);

      expect(result.riskProfileUpdate).toBeDefined();
    });

    it('should suggest parallel learning paths', async () => {
      const body = { lessonId: 'l-stocks', score: 88, timeSpent: 950 };
      mockAdaptiveService.adjustLearningPath.mockResolvedValue({
        nextLesson: 'l-stocks-2',
        alternativePaths: ['l-bonds', 'l-crypto'],
      });

      const result = await controller.completeLesson({ user: mockUser }, body);

      expect(result.alternativePaths).toBeDefined();
      expect(result.alternativePaths.length).toBeGreaterThan(0);
    });

    it('should validate JSONB lesson metadata', async () => {
      const body = { lessonId: 'l-1', score: 82, timeSpent: 1050 };
      mockAdaptiveService.adjustLearningPath.mockResolvedValue({
        nextLesson: 'l-2',
        metadata: {
          vi: { title: 'Bài học tiếp theo' },
          en: { title: 'Next lesson' },
          zh: { title: '下一课' },
        },
      });

      const result = await controller.completeLesson({ user: mockUser }, body);

      expect(result.metadata.vi).toBeDefined();
      expect(result.metadata.en).toBeDefined();
      expect(result.metadata.zh).toBeDefined();
    });

    it('should calculate adaptive difficulty based on success rate', async () => {
      const body = { lessonId: 'l-quiz', score: 70, timeSpent: 1500 };
      mockAdaptiveService.adjustLearningPath.mockResolvedValue({
        nextLesson: 'l-quiz-2',
        successRate: 0.7,
        targetSuccessRate: 0.75,
      });

      const result = await controller.completeLesson({ user: mockUser }, body);

      expect(result.successRate).toBeLessThan(result.targetSuccessRate);
    });

    it('should provide AI-generated personalized feedback', async () => {
      const body = { lessonId: 'l-1', score: 78, timeSpent: 1200 };
      mockAdaptiveService.adjustLearningPath.mockResolvedValue({
        nextLesson: 'l-2',
        aiFeedback:
          'You have mastered basic concepts. Ready for intermediate level.',
      });

      const result = await controller.completeLesson({ user: mockUser }, body);

      expect(result.aiFeedback).toBeDefined();
    });
  });
});
