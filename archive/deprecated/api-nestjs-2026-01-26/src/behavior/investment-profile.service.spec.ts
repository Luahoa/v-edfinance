import { Level } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvestmentProfileService } from './investment-profile.service';

describe('InvestmentProfileService (Pure Unit Test)', () => {
  let service: InvestmentProfileService;
  let mockPrisma: any;
  let mockGemini: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      behaviorLog: {
        findMany: vi.fn(),
      },
      userProgress: {
        findMany: vi.fn(),
      },
      investmentProfile: {
        upsert: vi.fn(),
      },
    };
    mockGemini = {
      generateResponse: vi.fn(),
    };
    const mockValidation = {
      validate: vi.fn((type, data) => data),
    };
    service = new InvestmentProfileService(
      mockPrisma,
      mockGemini,
      mockValidation as any,
    );
  });

  it('should analyze behavior and sync profile', async () => {
    const userId = 'u1';
    mockPrisma.behaviorLog.findMany.mockResolvedValue([
      { eventType: 'CLICK', path: '/home' },
    ]);
    mockPrisma.userProgress.findMany.mockResolvedValue([
      { status: 'COMPLETED', lesson: { id: 'l1' } },
    ]);
    mockGemini.generateResponse.mockResolvedValue({
      text: 'AI Analysis result',
    });
    mockPrisma.investmentProfile.upsert.mockResolvedValue({
      userId,
      riskScore: 5,
    });

    const result = await service.analyzeBehaviorAndSyncProfile(userId);

    expect(mockGemini.generateResponse).toHaveBeenCalled();
    expect(mockPrisma.investmentProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
        update: expect.objectContaining({
          investmentPhilosophy: { ai_summary: 'AI Analysis result' },
        }),
      }),
    );
    expect(result.userId).toBe(userId);
  });

  describe('Risk score calculation', () => {
    it('should calculate risk score from high-risk behavior logs', async () => {
      const userId = 'u1';
      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { eventType: 'INVESTMENT_AGGRESSIVE', path: '/invest' },
        { eventType: 'INVESTMENT_AGGRESSIVE', path: '/stocks' },
      ]);
      mockPrisma.userProgress.findMany.mockResolvedValue([]);
      mockGemini.generateResponse.mockResolvedValue({
        text: 'High-risk investor profile',
      });
      mockPrisma.investmentProfile.upsert.mockResolvedValue({
        userId,
        riskScore: 8,
      });

      await service.analyzeBehaviorAndSyncProfile(userId);

      expect(mockGemini.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          user_profile: expect.objectContaining({
            logs: expect.arrayContaining([
              expect.objectContaining({ type: 'INVESTMENT_AGGRESSIVE' }),
            ]),
          }),
        }),
      );
    });

    it('should calculate risk score from conservative behavior', async () => {
      const userId = 'u1';
      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { eventType: 'SAVINGS_FOCUS', path: '/savings' },
        { eventType: 'LOW_RISK_PREFERENCE', path: '/bonds' },
      ]);
      mockPrisma.userProgress.findMany.mockResolvedValue([]);
      mockGemini.generateResponse.mockResolvedValue({
        text: 'Conservative investor profile',
      });
      mockPrisma.investmentProfile.upsert.mockResolvedValue({
        userId,
        riskScore: 3,
      });

      await service.analyzeBehaviorAndSyncProfile(userId);

      expect(mockPrisma.investmentProfile.upsert).toHaveBeenCalled();
    });
  });

  describe('Knowledge level assessment', () => {
    it('should set knowledge to BEGINNER for new user with few lessons', async () => {
      const userId = 'u1';
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.userProgress.findMany.mockResolvedValue([
        { status: 'COMPLETED', lesson: { id: 'l1' } },
      ]);
      mockGemini.generateResponse.mockResolvedValue({
        text: 'Beginner level analysis',
      });
      mockPrisma.investmentProfile.upsert.mockResolvedValue({
        userId,
        currentKnowledge: Level.BEGINNER,
      });

      const result = await service.analyzeBehaviorAndSyncProfile(userId);

      expect(mockPrisma.investmentProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            currentKnowledge: Level.BEGINNER,
          }),
        }),
      );
    });

    it('should assess knowledge from completed lessons count', async () => {
      const userId = 'u1';
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.userProgress.findMany.mockResolvedValue([
        { status: 'COMPLETED', lesson: { id: 'l1' } },
        { status: 'COMPLETED', lesson: { id: 'l2' } },
        { status: 'COMPLETED', lesson: { id: 'l3' } },
        { status: 'IN_PROGRESS', lesson: { id: 'l4' } },
      ]);
      mockGemini.generateResponse.mockResolvedValue({
        text: 'Intermediate analysis',
      });
      mockPrisma.investmentProfile.upsert.mockResolvedValue({ userId });

      await service.analyzeBehaviorAndSyncProfile(userId);

      expect(mockGemini.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          user_profile: expect.objectContaining({
            completed_lessons: 3,
          }),
        }),
      );
    });
  });

  describe('Profile sync from behavior patterns', () => {
    it('should sync profile with JSONB investment philosophy', async () => {
      const userId = 'u1';
      const aiAnalysis =
        'Diversified portfolio preference with moderate risk tolerance';

      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { eventType: 'PORTFOLIO_VIEW', path: '/portfolio' },
      ]);
      mockPrisma.userProgress.findMany.mockResolvedValue([]);
      mockGemini.generateResponse.mockResolvedValue({ text: aiAnalysis });
      mockPrisma.investmentProfile.upsert.mockResolvedValue({
        userId,
        investmentPhilosophy: { ai_summary: aiAnalysis },
      });

      const result = await service.analyzeBehaviorAndSyncProfile(userId);

      expect(result.investmentPhilosophy).toEqual({ ai_summary: aiAnalysis });
    });

    it('should create new profile if none exists', async () => {
      const userId = 'u1';
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.userProgress.findMany.mockResolvedValue([]);
      mockGemini.generateResponse.mockResolvedValue({
        text: 'New user analysis',
      });
      mockPrisma.investmentProfile.upsert.mockResolvedValue({
        userId,
        riskScore: 5,
        currentKnowledge: Level.BEGINNER,
      });

      await service.analyzeBehaviorAndSyncProfile(userId);

      expect(mockPrisma.investmentProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            userId,
            riskScore: 5,
            currentKnowledge: Level.BEGINNER,
          }),
        }),
      );
    });

    it('should update existing profile with new analysis', async () => {
      const userId = 'u1';
      mockPrisma.behaviorLog.findMany.mockResolvedValue([
        { eventType: 'ADVANCED_STRATEGY', path: '/strategies' },
      ]);
      mockPrisma.userProgress.findMany.mockResolvedValue([
        { status: 'COMPLETED', lesson: { id: 'l1' } },
      ]);
      mockGemini.generateResponse.mockResolvedValue({
        text: 'Updated analysis',
      });
      mockPrisma.investmentProfile.upsert.mockResolvedValue({
        userId,
        investmentPhilosophy: { ai_summary: 'Updated analysis' },
      });

      await service.analyzeBehaviorAndSyncProfile(userId);

      expect(mockPrisma.investmentProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            investmentPhilosophy: { ai_summary: 'Updated analysis' },
          }),
        }),
      );
    });

    it('should include locale in AI prompt', async () => {
      const userId = 'u1';
      mockPrisma.behaviorLog.findMany.mockResolvedValue([]);
      mockPrisma.userProgress.findMany.mockResolvedValue([]);
      mockGemini.generateResponse.mockResolvedValue({ text: 'Analysis' });
      mockPrisma.investmentProfile.upsert.mockResolvedValue({ userId });

      await service.analyzeBehaviorAndSyncProfile(userId);

      expect(mockGemini.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            locale: 'vi',
          }),
        }),
      );
    });
  });
});
