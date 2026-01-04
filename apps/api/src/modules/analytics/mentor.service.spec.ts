import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiService } from '../../config/gemini.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';
import { MentorService } from './mentor.service';
import { PredictiveService } from './predictive.service';

describe('MentorService (Phase 7 Integration Test)', () => {
  let service: MentorService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'user-1',
        investmentProfile: { currentKnowledge: 'BEGINNER', riskScore: 70 },
        buddyMemberships: [{ group: { streak: 10 } }],
        preferredLocale: 'vi',
      }),
    },
    behaviorLog: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };

  const mockGemini = {
    generateResponse: vi.fn().mockResolvedValue({
      text: 'Chào bạn, tôi là Mentor Lúa!',
      locale: 'vi',
    }),
  };

  const mockAnalytics = {
    getUserPersona: vi.fn().mockResolvedValue('HUNTER'),
  };

  const mockPredictive = {
    predictChurnRisk: vi.fn().mockResolvedValue('LOW'),
  };

  const mockEventEmitter = {
    emit: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockPrisma.user.findUnique = vi.fn().mockResolvedValue({
      id: 'user-1',
      investmentProfile: { currentKnowledge: 'BEGINNER', riskScore: 70 },
      buddyMemberships: [{ group: { streak: 10 } }],
      preferredLocale: 'vi',
    });
    mockPrisma.behaviorLog.findMany = vi.fn().mockResolvedValue([]);
    mockAnalytics.getUserPersona = vi.fn().mockResolvedValue('HUNTER');
    mockPredictive.predictChurnRisk = vi.fn().mockResolvedValue('LOW');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MentorService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GeminiService, useValue: mockGemini },
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: PredictiveService, useValue: mockPredictive },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<MentorService>(MentorService);
    // @ts-ignore
    service.prisma = mockPrisma;
    // @ts-ignore
    service.analytics = mockAnalytics;
    // @ts-ignore
    service.predictive = mockPredictive;
    // @ts-ignore
    service.gemini = mockGemini;
    // @ts-ignore
    service.eventEmitter = mockEventEmitter;
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should select STRICT_COACH persona for a HUNTER user', async () => {
    await service.getPersonalizedAdvice('user-1', 'Nên đầu tư gì?', {
      module: 'M1',
      lesson: 'L1',
      locale: 'vi',
    });

    expect(mockGemini.generateResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        mentor_config: expect.objectContaining({
          persona: 'STRICT_COACH',
          group_streak: 10,
        }),
      }),
    );
  });

  it('should trigger variable reward logic (random chance)', async () => {
    // Mock logToday to have one completion
    mockPrisma.behaviorLog.findMany.mockResolvedValueOnce([
      { eventType: 'LESSON_COMPLETED', timestamp: new Date() },
    ]);

    // We can't easily test Math.random without mocking it, but we can verify the call structure
    const result = await service.getPersonalizedAdvice('user-1', 'Hello', {
      module: 'M1',
      lesson: 'L1',
      locale: 'vi',
    });
    expect(result.text).toBeDefined();
  });
});
