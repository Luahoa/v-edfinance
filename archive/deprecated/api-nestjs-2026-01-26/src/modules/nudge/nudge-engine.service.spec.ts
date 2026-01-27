import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NudgeEngineService, NudgeType } from './nudge-engine.service';

describe('NudgeEngineService (Pure Unit Test)', () => {
  let service: NudgeEngineService;
  let mockPrisma: any;
  let mockAnalytics: any;
  let mockAiService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      behaviorLog: {
        create: vi.fn(),
      },
    };

    mockAnalytics = {
      getUserPersona: vi.fn(),
    };

    mockAiService = {
      modelInstance: {
        generateContent: vi.fn(),
      },
    };

    // Instantiate service directly without NestJS Testing Module for speed and reliability
    service = new NudgeEngineService(mockPrisma, mockAnalytics, mockAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateNudge', () => {
    it('should return null for unknown context', async () => {
      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });

      const result = await service.generateNudge('u1', 'UNKNOWN', {});
      expect(result).toBeNull();
    });

    describe('INVESTMENT_DECISION', () => {
      it('should return SOCIAL_PROOF nudge for HUNTER persona', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('HUNTER');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });

        const result = await service.generateNudge(
          'u1',
          'INVESTMENT_DECISION',
          {},
        );

        expect(result.type).toBe(NudgeType.SOCIAL_PROOF);
        expect(result.message.vi).toContain('10% nhà đầu tư hàng đầu');
        expect(result.priority).toBe('HIGH');
      });

      it('should return LOSS_AVERSION nudge for high risk level', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });

        const result = await service.generateNudge(
          'u1',
          'INVESTMENT_DECISION',
          { riskLevel: 90 },
        );

        expect(result.type).toBe(NudgeType.LOSS_AVERSION);
        expect(result.message.vi).toContain('mất 20% vốn');
      });
    });

    describe('BUDGETING', () => {
      it('should return GOAL_GRADIENT for SAVER persona', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });

        const result = await service.generateNudge('u1', 'BUDGETING', {
          amount: 100000,
        });

        expect(result.type).toBe(NudgeType.GOAL_GRADIENT);
        expect(result.priority).toBe('HIGH');
      });

      it('should return SALIENCE nudge showing equivalent coffee cups', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('DEFAULT');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });

        const result = await service.generateNudge('u1', 'BUDGETING', {
          amount: 150000,
        });

        expect(result.type).toBe(NudgeType.SALIENCE);
        expect(result.message.vi).toContain('3 ly cà phê');
      });
    });

    describe('STREAK_WARNING', () => {
      it('should return GOAL_GRADIENT for streak warning', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });

        const result = await service.generateNudge('u1', 'STREAK_WARNING', {});

        expect(result.type).toBe(NudgeType.GOAL_GRADIENT);
        expect(result.message.vi).toContain('90% chặng đường');
      });
    });

    describe('Edge Cases', () => {
      it('should handle missing user profile gracefully', async () => {
        mockAnalytics.getUserPersona.mockResolvedValue('OBSERVER');
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
          service.generateNudge('u1', 'INVESTMENT_DECISION', { riskLevel: 50 }),
        ).rejects.toThrow('User not found');
      });
    });
  });

  describe('AI Variants', () => {
    it('should generate AI variant for 10% of traffic', async () => {
      // Force AI path
      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'u1' }) // First call for base nudge
        .mockResolvedValueOnce({
          id: 'u1',
          knowledgeLevel: 'BEGINNER',
          locale: 'vi',
          streak: 5,
        }); // Second call for AI variant

      mockAiService.modelInstance.generateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              vi: 'AI-generated Vietnamese nudge',
              en: 'AI-generated English nudge',
              zh: 'AI-generated Chinese nudge',
            }),
        },
      });

      const nudge = await service.generateNudge('u1', 'STREAK_WARNING', {});

      expect(nudge.metadata?.generatedBy).toBe('AI');
      expect(mockAiService.modelInstance.generateContent).toHaveBeenCalled();
      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'NUDGE_VARIANT_TEST',
            payload: expect.objectContaining({
              variant: 'AI',
            }),
          }),
        }),
      );
    });

    it('should fallback to rule-based on AI error', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.05);

      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockAiService.modelInstance.generateContent.mockRejectedValue(
        new Error('AI error'),
      );

      const nudge = await service.generateNudge('u1', 'STREAK_WARNING', {});

      // Should still return base nudge
      expect(nudge).toBeDefined();
      expect(nudge.type).toBe(NudgeType.GOAL_GRADIENT);
    });

    it('should track variant type in BehaviorLog', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.95); // Force rule-based path

      mockAnalytics.getUserPersona.mockResolvedValue('SAVER');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });

      await service.generateNudge('u1', 'STREAK_WARNING', {});

      expect(mockPrisma.behaviorLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'NUDGE_VARIANT_TEST',
            payload: expect.objectContaining({
              variant: 'RULE_BASED',
            }),
          }),
        }),
      );
    });
  });
});

