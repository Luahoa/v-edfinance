import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from './analytics.service';
import { MentorService } from './mentor.service';
import { PredictiveService } from './predictive.service';

describe('Behavioral Simulation (Plan 2)', () => {
  let mentorService: MentorService;
  let analyticsService: AnalyticsService;
  let predictiveService: PredictiveService;
  let mockPrisma: any;
  let mockGemini: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      behaviorLog: {
        findMany: vi.fn(),
        create: vi.fn().mockResolvedValue({}),
      },
      userProgress: {
        count: vi.fn(),
      },
    };

    mockGemini = {
      generateResponse: vi.fn().mockImplementation((prompt) => {
        const persona = prompt.mentor_config.persona;
        const response =
          persona === 'STRICT_COACH'
            ? 'DỪNG LẠI! Bạn đang quá nôn nóng.'
            : 'Cố lên bạn ơi, mỗi ngày một chút.';
        return { text: response, persona };
      }),
    };

    mockEventEmitter = {
      emit: vi.fn(),
    };

    analyticsService = new AnalyticsService(mockPrisma);
    predictiveService = new PredictiveService(mockPrisma, analyticsService);
    mentorService = new MentorService(
      mockGemini,
      mockPrisma,
      predictiveService,
      analyticsService,
      mockEventEmitter,
    );
  });

  it('Simulation: RUSH_USER should trigger STRICT_COACH persona', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'rush-1',
      investmentProfile: { currentKnowledge: 'BEGINNER', riskScore: 90 },
      buddyMemberships: [],
    });

    const now = new Date();
    mockPrisma.behaviorLog.findMany.mockResolvedValue([
      { eventType: 'HIGH_RISK_DECISION', timestamp: now },
      { eventType: 'HIGH_RISK_DECISION', timestamp: now },
      { eventType: 'HIGH_RISK_DECISION', timestamp: now },
      { eventType: 'HIGH_RISK_DECISION', timestamp: now },
      { eventType: 'HIGH_RISK_DECISION', timestamp: now },
      { eventType: 'HIGH_RISK_DECISION', timestamp: now },
    ]);

    const result: any = await mentorService.getPersonalizedAdvice(
      'rush-1',
      'Tôi muốn tất tay!',
      {
        module: 'Invest',
        lesson: 'Risk',
        locale: 'vi',
      },
    );

    expect(result.persona).toBe('STRICT_COACH');
    expect(result.text).toContain('DỪNG LẠI');
  });

  it('Simulation: LAZY_USER should trigger SUPPORTIVE_BUDDY persona', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'lazy-1',
      investmentProfile: { currentKnowledge: 'BEGINNER', riskScore: 20 },
      buddyMemberships: [],
    });
    mockPrisma.behaviorLog.findMany.mockResolvedValue([]);

    const result: any = await mentorService.getPersonalizedAdvice(
      'lazy-1',
      'Mệt quá...',
      {
        module: 'Intro',
        lesson: '1',
        locale: 'vi',
      },
    );

    expect(result.persona).toBe('SUPPORTIVE_BUDDY');
    expect(result.text).toContain('Cố lên');
  });
});
