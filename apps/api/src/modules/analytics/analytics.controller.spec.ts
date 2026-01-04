import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MentorService } from './mentor.service';
import { PredictiveService } from './predictive.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: AnalyticsService;
  let predictiveService: PredictiveService;
  let mentorService: MentorService;

  const mockAnalyticsService = {
    getUserLearningHabits: vi.fn(),
    getGlobalSystemStats: vi.fn(),
  };

  const mockPredictiveService = {
    simulateFinancialFuture: vi.fn(),
  };

  const mockMentorService = {
    getPersonalizedAdvice: vi.fn(),
  };

  const mockUser = { id: 'user-1', role: Role.USER, preferredLocale: 'vi' };
  const mockAdmin = { id: 'admin-1', role: Role.ADMIN, preferredLocale: 'en' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: PredictiveService, useValue: mockPredictiveService },
        { provide: MentorService, useValue: mockMentorService },
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
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    predictiveService = module.get<PredictiveService>(PredictiveService);
    mentorService = module.get<MentorService>(MentorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /analytics/my-habits', () => {
    it('should return user learning habits', async () => {
      const mockHabits = {
        averageSessionTime: 45,
        preferredLearningTime: 'MORNING',
        completionRate: 0.78,
        streakDays: 7,
      };

      mockAnalyticsService.getUserLearningHabits.mockResolvedValue(mockHabits);

      const result = await controller.getMyHabits({ user: mockUser });

      expect(analyticsService.getUserLearningHabits).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toEqual(mockHabits);
    });

    it('should handle user with no learning history', async () => {
      mockAnalyticsService.getUserLearningHabits.mockResolvedValue({
        averageSessionTime: 0,
        completionRate: 0,
        streakDays: 0,
      });

      const result = await controller.getMyHabits({ user: mockUser });

      expect(result.averageSessionTime).toBe(0);
      expect(result.streakDays).toBe(0);
    });

    it('should aggregate multi-day data correctly', async () => {
      const mockHabits = {
        averageSessionTime: 60,
        weeklyProgress: [10, 20, 30, 40, 50, 60, 70],
        totalLessonsCompleted: 42,
      };

      mockAnalyticsService.getUserLearningHabits.mockResolvedValue(mockHabits);

      const result = await controller.getMyHabits({ user: mockUser });

      expect(result.weeklyProgress).toHaveLength(7);
      expect(result.totalLessonsCompleted).toBe(42);
    });
  });

  describe('GET /analytics/predictive/future', () => {
    it('should simulate user financial future', async () => {
      const mockSimulation = {
        currentWealth: 50000000,
        projectedWealth: 150000000,
        yearsToGoal: 10,
        riskScore: 65,
      };

      mockPredictiveService.simulateFinancialFuture.mockResolvedValue(
        mockSimulation,
      );

      const result = await controller.getFutureSimulation({ user: mockUser });

      expect(predictiveService.simulateFinancialFuture).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result.projectedWealth).toBe(150000000);
    });

    it('should handle user with minimal financial data', async () => {
      mockPredictiveService.simulateFinancialFuture.mockResolvedValue({
        currentWealth: 0,
        projectedWealth: 0,
        warning: 'Insufficient data',
      });

      const result = await controller.getFutureSimulation({ user: mockUser });

      expect(result.warning).toBeDefined();
    });

    it('should project multiple time horizons', async () => {
      const mockSimulation = {
        shortTerm: { years: 1, projected: 55000000 },
        mediumTerm: { years: 5, projected: 85000000 },
        longTerm: { years: 20, projected: 200000000 },
      };

      mockPredictiveService.simulateFinancialFuture.mockResolvedValue(
        mockSimulation,
      );

      const result = await controller.getFutureSimulation({ user: mockUser });

      expect(result.shortTerm.years).toBe(1);
      expect(result.longTerm.years).toBe(20);
    });
  });

  describe('POST /analytics/mentor/chat', () => {
    it('should return personalized mentor advice', async () => {
      const body = {
        query: 'How do I invest in stocks?',
        module: 'Investing',
        lesson: 'Stocks 101',
      };
      const mockAdvice = {
        response: 'Start with index funds for beginners...',
        relatedLessons: ['lesson-1', 'lesson-2'],
      };

      mockMentorService.getPersonalizedAdvice.mockResolvedValue(mockAdvice);

      const result = await controller.askMentor({ user: mockUser }, body);

      expect(mentorService.getPersonalizedAdvice).toHaveBeenCalledWith(
        'user-1',
        body.query,
        {
          module: 'Investing',
          lesson: 'Stocks 101',
          locale: 'vi',
        },
      );
      expect(result.response).toContain('index funds');
    });

    it('should use default module and lesson when not provided', async () => {
      const body = { query: 'General finance question' };
      mockMentorService.getPersonalizedAdvice.mockResolvedValue({
        response: 'General advice',
      });

      await controller.askMentor({ user: mockUser }, body);

      expect(mentorService.getPersonalizedAdvice).toHaveBeenCalledWith(
        'user-1',
        body.query,
        {
          module: 'General',
          lesson: 'General',
          locale: 'vi',
        },
      );
    });

    it('should respect user locale preference', async () => {
      const englishUser = { ...mockUser, preferredLocale: 'en' };
      const body = { query: 'Investment advice' };
      mockMentorService.getPersonalizedAdvice.mockResolvedValue({
        response: 'Advice in English',
      });

      await controller.askMentor({ user: englishUser }, body);

      expect(mentorService.getPersonalizedAdvice).toHaveBeenCalledWith(
        'user-1',
        body.query,
        {
          module: 'General',
          lesson: 'General',
          locale: 'en',
        },
      );
    });

    it('should handle Chinese locale', async () => {
      const chineseUser = { ...mockUser, preferredLocale: 'zh' };
      const body = { query: '投资建议', module: '投资', lesson: '股票基础' };
      mockMentorService.getPersonalizedAdvice.mockResolvedValue({
        response: '中文建议',
      });

      await controller.askMentor({ user: chineseUser }, body);

      expect(mentorService.getPersonalizedAdvice).toHaveBeenCalledWith(
        'user-1',
        body.query,
        {
          module: '投资',
          lesson: '股票基础',
          locale: 'zh',
        },
      );
    });
  });

  describe('GET /analytics/system-stats (ADMIN)', () => {
    it('should return global system statistics for admin', async () => {
      const mockStats = {
        totalUsers: 10000,
        activeUsers: 7500,
        totalLessons: 250,
        averageCompletionRate: 0.68,
      };

      mockAnalyticsService.getGlobalSystemStats.mockResolvedValue(mockStats);

      const result = await controller.getSystemStats();

      expect(analyticsService.getGlobalSystemStats).toHaveBeenCalled();
      expect(result.totalUsers).toBe(10000);
      expect(result.activeUsers).toBe(7500);
    });

    it('should include platform-wide metrics', async () => {
      const mockStats = {
        totalRevenue: 500000000,
        totalCourses: 50,
        averageSessionTime: 35,
        peakUsageHour: '20:00',
      };

      mockAnalyticsService.getGlobalSystemStats.mockResolvedValue(mockStats);

      const result = await controller.getSystemStats();

      expect(result.totalRevenue).toBe(500000000);
      expect(result.peakUsageHour).toBe('20:00');
    });

    it('should aggregate user behavior metrics', async () => {
      const mockStats = {
        engagementRate: 0.82,
        retentionRate: 0.75,
        averageLifetimeValue: 1500000,
      };

      mockAnalyticsService.getGlobalSystemStats.mockResolvedValue(mockStats);

      const result = await controller.getSystemStats();

      expect(result.engagementRate).toBeGreaterThan(0.8);
      expect(result.retentionRate).toBeGreaterThan(0.7);
    });
  });
});
