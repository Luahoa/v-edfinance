import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { NudgeController } from './nudge.controller';
import { NudgeEngineService } from './nudge-engine.service';

describe('NudgeController', () => {
  let controller: NudgeController;
  let nudgeEngine: NudgeEngineService;

  const mockNudgeEngine = {
    generateNudge: vi.fn(),
    getRealtimeSocialProof: vi.fn(),
  };

  const mockUser = { userId: 'user-1' };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NudgeController],
      providers: [{ provide: NudgeEngineService, useValue: mockNudgeEngine }],
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

    controller = module.get<NudgeController>(NudgeController);
    nudgeEngine = module.get<NudgeEngineService>(NudgeEngineService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /nudge/check', () => {
    it('should trigger nudge check with context', async () => {
      const body = { context: 'COURSE_START', data: { courseId: 'c-1' } };
      const mockNudge = {
        type: 'SOCIAL_PROOF',
        message: '1000 users enrolled today',
      };

      mockNudgeEngine.generateNudge.mockResolvedValue(mockNudge);

      const result = await controller.checkNudge({ user: mockUser }, body);

      expect(nudgeEngine.generateNudge).toHaveBeenCalledWith(
        'user-1',
        'COURSE_START',
        { courseId: 'c-1' },
      );
      expect(result.type).toBe('SOCIAL_PROOF');
    });

    it('should use default context and data when not provided', async () => {
      const body = {};
      mockNudgeEngine.generateNudge.mockResolvedValue({
        type: 'GENERAL',
        message: 'Keep learning!',
      });

      await controller.checkNudge({ user: mockUser }, body);

      expect(nudgeEngine.generateNudge).toHaveBeenCalledWith(
        'user-1',
        'GENERAL',
        {},
      );
    });

    it('should generate loss aversion nudge', async () => {
      const body = { context: 'STREAK_WARNING', data: {} };
      mockNudgeEngine.generateNudge.mockResolvedValue({
        type: 'LOSS_AVERSION',
        message: "Don't lose your 7-day streak!",
      });

      const result = await controller.checkNudge({ user: mockUser }, body);

      expect(result.type).toBe('LOSS_AVERSION');
      expect(result.message).toContain('streak');
    });
  });

  describe('GET /nudge/dashboard', () => {
    it('should return multiple dashboard nudges', async () => {
      mockNudgeEngine.generateNudge
        .mockResolvedValueOnce({ type: 'STREAK', message: '5-day streak!' })
        .mockResolvedValueOnce({
          type: 'SOCIAL',
          message: '50 users online now',
        });

      const result = await controller.getDashboardNudges({ user: mockUser });

      expect(nudgeEngine.generateNudge).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should filter out null nudges', async () => {
      mockNudgeEngine.generateNudge
        .mockResolvedValueOnce({ type: 'STREAK', message: 'Active' })
        .mockResolvedValueOnce(null);

      const result = await controller.getDashboardNudges({ user: mockUser });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('STREAK');
    });

    it('should generate streak warning nudge', async () => {
      mockNudgeEngine.generateNudge
        .mockResolvedValueOnce({ type: 'STREAK_WARNING', urgency: 'HIGH' })
        .mockResolvedValueOnce(null);

      const result = await controller.getDashboardNudges({ user: mockUser });

      expect(result[0].urgency).toBe('HIGH');
    });

    it('should generate social proof nudge', async () => {
      mockNudgeEngine.generateNudge
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ type: 'SOCIAL_PROOF_REALTIME', count: 150 });

      const result = await controller.getDashboardNudges({ user: mockUser });

      expect(result[0].count).toBe(150);
    });
  });

  describe('GET /nudge/social-proof', () => {
    it('should get realtime social proof for course enrollment', async () => {
      const mockProof = {
        action: 'ENROLL',
        targetId: 'c-1',
        recentCount: 45,
        message: '45 users enrolled in the last hour',
      };

      mockNudgeEngine.getRealtimeSocialProof.mockResolvedValue(mockProof);

      const result = await controller.getSocialProof('ENROLL', 'c-1');

      expect(nudgeEngine.getRealtimeSocialProof).toHaveBeenCalledWith(
        'ENROLL',
        'c-1',
      );
      expect(result.recentCount).toBe(45);
    });

    it('should get social proof for lesson completion', async () => {
      mockNudgeEngine.getRealtimeSocialProof.mockResolvedValue({
        action: 'COMPLETE',
        targetId: 'l-1',
        recentCount: 120,
      });

      const result = await controller.getSocialProof('COMPLETE', 'l-1');

      expect(result.recentCount).toBe(120);
    });

    it('should get social proof for commitment creation', async () => {
      mockNudgeEngine.getRealtimeSocialProof.mockResolvedValue({
        action: 'COMMIT',
        targetId: 'goal-1',
        recentCount: 30,
        trend: 'RISING',
      });

      const result = await controller.getSocialProof('COMMIT', 'goal-1');

      expect(result.trend).toBe('RISING');
    });

    it('should handle zero activity gracefully', async () => {
      mockNudgeEngine.getRealtimeSocialProof.mockResolvedValue({
        action: 'PURCHASE',
        targetId: 'item-1',
        recentCount: 0,
      });

      const result = await controller.getSocialProof('PURCHASE', 'item-1');

      expect(result.recentCount).toBe(0);
    });

    it('should include user demographics in social proof', async () => {
      mockNudgeEngine.getRealtimeSocialProof.mockResolvedValue({
        action: 'ENROLL',
        targetId: 'c-2',
        recentCount: 80,
        demographics: { age: '25-34', location: 'Vietnam' },
      });

      const result = await controller.getSocialProof('ENROLL', 'c-2');

      expect(result.demographics).toBeDefined();
    });

    it('should return percentage for social proof', async () => {
      mockNudgeEngine.getRealtimeSocialProof.mockResolvedValue({
        action: 'COMPLETE',
        targetId: 'l-2',
        completionRate: 0.85,
        message: '85% of users completed this lesson',
      });

      const result = await controller.getSocialProof('COMPLETE', 'l-2');

      expect(result.completionRate).toBe(0.85);
    });

    it('should show time-based scarcity', async () => {
      mockNudgeEngine.getRealtimeSocialProof.mockResolvedValue({
        action: 'DISCOUNT',
        targetId: 'course-sale',
        timeLeft: '2 hours',
        urgency: 'HIGH',
      });

      const result = await controller.getSocialProof('DISCOUNT', 'course-sale');

      expect(result.urgency).toBe('HIGH');
    });

    it('should display user testimonials count', async () => {
      mockNudgeEngine.getRealtimeSocialProof.mockResolvedValue({
        action: 'REVIEW',
        targetId: 'c-3',
        reviewCount: 1250,
        averageRating: 4.8,
      });

      const result = await controller.getSocialProof('REVIEW', 'c-3');

      expect(result.reviewCount).toBe(1250);
      expect(result.averageRating).toBeGreaterThan(4.5);
    });

    it('should show trending badge', async () => {
      mockNudgeEngine.getRealtimeSocialProof.mockResolvedValue({
        action: 'TRENDING',
        targetId: 'c-trending',
        trending: true,
        growthRate: 2.5,
      });

      const result = await controller.getSocialProof('TRENDING', 'c-trending');

      expect(result.trending).toBe(true);
      expect(result.growthRate).toBeGreaterThan(2);
    });

    it('should include peer comparison', async () => {
      mockNudgeEngine.getRealtimeSocialProof.mockResolvedValue({
        action: 'PROGRESS',
        targetId: 'user-compare',
        peerAverage: 75,
        userScore: 60,
        message: 'You are 15% behind your peers',
      });

      const result = await controller.getSocialProof(
        'PROGRESS',
        'user-compare',
      );

      expect(result.peerAverage).toBeGreaterThan(result.userScore);
    });

    it('should validate commitment contract nudge', async () => {
      mockNudgeEngine.getRealtimeSocialProof.mockResolvedValue({
        action: 'COMMITMENT_CONTRACT',
        targetId: 'contract-1',
        penaltyRate: 0.1,
        successRate: 0.82,
      });

      const result = await controller.getSocialProof(
        'COMMITMENT_CONTRACT',
        'contract-1',
      );

      expect(result.penaltyRate).toBeDefined();
      expect(result.successRate).toBeGreaterThan(0.8);
    });

    it('should show framing effect', async () => {
      mockNudgeEngine.getRealtimeSocialProof.mockResolvedValue({
        action: 'SAVE_MONEY',
        targetId: 'budget-plan',
        gain: 5000000,
        framing: 'Save 5M VND per month',
      });

      const result = await controller.getSocialProof(
        'SAVE_MONEY',
        'budget-plan',
      );

      expect(result.framing).toContain('Save');
      expect(result.gain).toBe(5000000);
    });

    it('should integrate with investment profile', async () => {
      mockNudgeEngine.getRealtimeSocialProof.mockResolvedValue({
        action: 'RISK_ASSESSMENT',
        targetId: 'profile-1',
        riskTolerance: 'MODERATE',
        profileMatch: true,
      });

      const result = await controller.getSocialProof(
        'RISK_ASSESSMENT',
        'profile-1',
      );

      expect(result.profileMatch).toBe(true);
    });
  });
});
